import * as DocumentPicker from 'expo-document-picker';
import { unzip, zip } from 'react-native-zip-archive';
import { Share } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { db } from '../db/database';
import { BackupData, MergeStrategy, Run } from '../types';

export const BACKUP_VERSION = 1;

const JSON_NAME = 'data.json';

export async function exportBackup(): Promise<string | null> {
  const runs = await db.getAllRuns();
  const routes = await db.getAllRoutes();
  const settings = await db.getSettingsMap();

  const data: BackupData = {
    version: BACKUP_VERSION,
    export_date: new Date().toISOString(),
    runs,
    routes,
    settings,
  };

  const dir = new Directory(Paths.document, 'runtracker_backups');
  dir.create({ intermediates: true, idempotent: true });
  const jsonFile = new File(dir, JSON_NAME);
  jsonFile.write(JSON.stringify(data, null, 2));

  const gpxDir = new Directory(dir, 'gpx');
  gpxDir.create({ idempotent: true });
  for (const run of runs) {
    const gpxFile = new File(gpxDir, `${run.id}.gpx`);
    if (!gpxFile.exists) {
      gpxFile.write(toGpx(run));
    }
  }

  const stamp = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
  const zipPath = `${dir.uri}/backup_${stamp}.zip`;
  await zip(dir.uri, zipPath);

  return zipPath;
}

export async function shareBackup(zipPath: string): Promise<void> {
  await Share.share({ url: zipPath, message: 'RunTracker backup' });
}

export async function pickBackupFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', '*/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]?.uri) return null;
  return res.assets[0].uri;
}

async function readBackupData(zipPath: string): Promise<BackupData> {
  const destDir = await ensureImportDir();
  await unzip(zipPath, destDir.uri);
  const jsonFile = new File(destDir, JSON_NAME);
  if (!jsonFile.exists) {
    throw new Error('Invalid backup: data.json not found');
  }
  const data: BackupData = JSON.parse(await jsonFile.text());
  if (!data.version || !Array.isArray(data.runs)) {
    throw new Error('Invalid backup format');
  }
  return data;
}

export async function readBackupPreview(zipPath: string): Promise<{ runs: number; routes: number } | null> {
  try {
    const data = await readBackupData(zipPath);
    return { runs: data.runs?.length ?? 0, routes: data.routes?.length ?? 0 };
  } catch (e: any) {
    console.warn('[backup] readBackupPreview failed', e?.stack ?? String(e?.message ?? e));
    return null;
  }
}

export async function importBackup(
  zipPath: string,
  strategy: MergeStrategy,
): Promise<{ runs: number; routes: number }> {
  const data = await readBackupData(zipPath);
  return mergeBackup(data, strategy);
}

export async function mergeBackup(
  data: BackupData,
  strategy: MergeStrategy,
): Promise<{ runs: number; routes: number }> {
  const existingRuns = await db.getAllRuns();
  const existingRoutes = await db.getAllRoutes();

  let importedRuns = 0;
  let importedRoutes = 0;

  for (const run of data.runs ?? []) {
    if (!run || !run.id || !run.polyline) continue;
    const dup = existingRuns.find(isRunDuplicate.bind(null, run));
    if (strategy === 'skip' && dup) continue;
    if (strategy === 'keep' && dup) {
      run.id = `${run.id}_imported`;
    }
    run.polyline = run.polyline.map((p: any) => ({
      lat: Number(p.lat),
      lng: Number(p.lng),
      alt: p.alt ?? null,
      accuracy: p.accuracy ?? null,
      ts: p.ts ?? Date.now(),
    }));
    run.duration_s = Number(run.duration_s ?? 0);
    run.distance_m = Number(run.distance_m ?? 0);
    run.paused_s = Number(run.paused_s ?? 0);
    await db.insertRun(run);
    importedRuns++;
  }

  for (const route of data.routes ?? []) {
    if (!route || !route.id || !route.waypoints) continue;
    const dup = existingRoutes.find(
      (r) => r.name === route.name && Math.abs(r.distance_m - route.distance_m) < 50,
    );
    if (strategy === 'skip' && dup) continue;
    if (strategy === 'keep' && dup) {
      route.id = `${route.id}_imported`;
      route.name = `${route.name} (imported)`;
    }
    route.waypoints = route.waypoints.map((p: any) => ({
      lat: Number(p.lat),
      lng: Number(p.lng),
      alt: p.alt ?? null,
      accuracy: p.accuracy ?? null,
      ts: p.ts ?? Date.now(),
    }));
    route.distance_m = Number(route.distance_m ?? 0);
    await db.insertRoute(route);
    importedRoutes++;
  }

  if (data.settings && strategy !== 'skip') {
    await db.importSettings(data.settings);
  }

  return { runs: importedRuns, routes: importedRoutes };
}

function isRunDuplicate(candidate: Run, existing: Run): boolean {
  const a = new Date(candidate.start_time).getTime();
  const b = new Date(existing.start_time).getTime();
  if (Math.abs(a - b) < 5000 && Math.abs(candidate.distance_m - existing.distance_m) < 5) {
    return true;
  }
  return false;
}

export function toGpx(run: Run): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RunTracker" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${run.start_time}</name>
    <trkseg>`;
  const points = run.polyline
    .map(
      (p) =>
        `      <trkpt lat="${p.lat}" lon="${p.lng}">${
          p.alt != null ? `<ele>${p.alt}</ele>` : ''
        }<time>${new Date(p.ts).toISOString()}</time></trkpt>`,
    )
    .join('\n');
  const footer = `
    </trkseg>
  </trk>
</gpx>`;
  return header + '\n' + points + footer;
}

async function ensureImportDir(): Promise<Directory> {
  const dir = new Directory(Paths.cache, 'runtracker_import');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}
