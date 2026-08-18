import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { Run, SavedRoute, SettingsMap } from '../types';

const DB_NAME = 'runtracker.db';

let _db: SQLiteDatabase | null = null;
let _initPromise: Promise<SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLiteDatabase> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const database = await openDatabaseAsync(DB_NAME);
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS runs (
          id TEXT PRIMARY KEY,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          duration_s REAL NOT NULL,
          distance_m REAL NOT NULL,
          polyline TEXT NOT NULL,
          notes TEXT,
          paused_s REAL NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_runs_start_time ON runs (start_time DESC);

        CREATE TABLE IF NOT EXISTS routes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          waypoints TEXT NOT NULL,
          distance_m REAL NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes (created_at DESC);

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      _db = database;
      return database;
    } catch (e) {
      _initPromise = null;
      _db = null;
      throw e;
    }
  })();

  return _initPromise;
}

function isDeadDatabaseError(e: unknown): boolean {
  const msg = String((e as any)?.message ?? e);
  return msg.includes('has been rejected') || msg.includes('AccessClosedResource');
}

// Runs a DB operation, reopening the database once if the native handle was
// released underneath us (can happen when a dev-mode reload tears the JS
// context down; guarded for release robustness too).
async function dbOp<T>(op: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  let database = await getDb();
  try {
    return await op(database);
  } catch (e) {
    if (isDeadDatabaseError(e)) {
      _db = null;
      _initPromise = null;
      database = await getDb();
      return await op(database);
    }
    throw e;
  }
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function parseRowToRun(row: any): Run {
  return {
    id: row.id,
    start_time: row.start_time,
    end_time: row.end_time,
    duration_s: row.duration_s,
    distance_m: row.distance_m,
    polyline: safeJsonParse(row.polyline, []),
    notes: row.notes,
    paused_s: row.paused_s,
  };
}

function parseRowToRoute(row: any): SavedRoute {
  return {
    id: row.id,
    name: row.name,
    waypoints: safeJsonParse(row.waypoints, []),
    distance_m: row.distance_m,
    created_at: row.created_at,
  };
}

export const db = {
  insertRun(run: Run): Promise<void> {
    return dbOp(async (database) => {
      await database.runAsync(
        `INSERT OR REPLACE INTO runs (id, start_time, end_time, duration_s, distance_m, polyline, notes, paused_s)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [run.id, run.start_time, run.end_time, run.duration_s, run.distance_m, JSON.stringify(run.polyline), run.notes, run.paused_s],
      );
    });
  },

  getAllRuns(): Promise<Run[]> {
    return dbOp(async (database) => {
      const rows = await database.getAllAsync<Record<string, any>>(
        `SELECT * FROM runs ORDER BY start_time DESC`,
      );
      return rows.map(parseRowToRun);
    });
  },

  getRun(id: string): Promise<Run | null> {
    return dbOp(async (database) => {
      const row = await database.getFirstAsync<Record<string, any>>(
        `SELECT * FROM runs WHERE id = ? LIMIT 1`,
        [id],
      );
      return row ? parseRowToRun(row) : null;
    });
  },

  deleteRun(id: string): Promise<void> {
    return dbOp(async (database) => {
      await database.runAsync(`DELETE FROM runs WHERE id = ?`, [id]);
    });
  },

  insertRoute(route: SavedRoute): Promise<void> {
    return dbOp(async (database) => {
      await database.runAsync(
        `INSERT OR REPLACE INTO routes (id, name, waypoints, distance_m, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [route.id, route.name, JSON.stringify(route.waypoints), route.distance_m, route.created_at],
      );
    });
  },

  getAllRoutes(): Promise<SavedRoute[]> {
    return dbOp(async (database) => {
      const rows = await database.getAllAsync<Record<string, any>>(
        `SELECT * FROM routes ORDER BY created_at DESC`,
      );
      return rows.map(parseRowToRoute);
    });
  },

  getRoute(id: string): Promise<SavedRoute | null> {
    return dbOp(async (database) => {
      const row = await database.getFirstAsync<Record<string, any>>(
        `SELECT * FROM routes WHERE id = ? LIMIT 1`,
        [id],
      );
      return row ? parseRowToRoute(row) : null;
    });
  },

  deleteRoute(id: string): Promise<void> {
    return dbOp(async (database) => {
      await database.runAsync(`DELETE FROM routes WHERE id = ?`, [id]);
    });
  },

  setSetting(key: string, value: string): Promise<void> {
    return dbOp(async (database) => {
      await database.runAsync(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value]);
    });
  },

  getSetting(key: string): Promise<string | null> {
    return dbOp(async (database) => {
      const row = await database.getFirstAsync<{ value: string }>(
        `SELECT value FROM settings WHERE key = ?`,
        [key],
      );
      return row ? row.value : null;
    });
  },

  getSettingsMap(): Promise<SettingsMap> {
    return dbOp(async (database) => {
      const rows = await database.getAllAsync<{ key: string; value: string }>(
        `SELECT key, value FROM settings`,
      );
      const map: SettingsMap = {};
      for (const row of rows) {
        try {
          map[row.key] = JSON.parse(row.value);
        } catch {
          map[row.key] = row.value;
        }
      }
      return map;
    });
  },

  importSettings(map: SettingsMap): Promise<void> {
    return dbOp(async (database) => {
      await database.withTransactionAsync(async () => {
        for (const [key, value] of Object.entries(map)) {
          await database.runAsync(
            `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            [key, JSON.stringify(value)],
          );
        }
      });
    });
  },

  deleteSetting(key: string): Promise<void> {
    return dbOp(async (database) => {
      await database.runAsync(`DELETE FROM settings WHERE key = ?`, [key]);
    });
  },
};
