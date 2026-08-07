export interface GeoPoint {
  lat: number;
  lng: number;
  alt: number | null;
  accuracy: number | null;
  ts: number;
}

export interface Run {
  id: string;
  start_time: string;
  end_time: string;
  duration_s: number;
  distance_m: number;
  polyline: GeoPoint[];
  notes: string | null;
  paused_s: number;
}

export interface SavedRoute {
  id: string;
  name: string;
  waypoints: GeoPoint[];
  distance_m: number;
  created_at: string;
}

export type SettingsMap = Record<string, string | number | boolean | null>;

export type RunState = 'idle' | 'recording' | 'paused';

export type MergeStrategy = 'skip' | 'replace' | 'keep';

export interface BackupData {
  version: number;
  export_date: string;
  runs: Run[];
  routes: SavedRoute[];
  settings: SettingsMap;
}
