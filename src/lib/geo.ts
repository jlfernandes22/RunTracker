import { GeoPoint } from '../types';

const EARTH_RADIUS_M = 6371008.8;

export function haversine(a: GeoPoint, b: GeoPoint): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function polylineLength(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1], points[i]);
  }
  return total;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${m}:${ss}`;
}

export function formatPace(secondsPerKm: number | null): string {
  if (secondsPerKm == null || !isFinite(secondsPerKm) || secondsPerKm < 0) return '--:--';
  const total = Math.round(secondsPerKm);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, '0')} /km`;
}

export function speedFromRecentPoints(points: GeoPoint[], lookbackMs: number): number | null {
  if (points.length < 2) return null;
  const now = points[points.length - 1].ts;
  let startIdx = points.length - 1;
  for (let i = points.length - 1; i >= 0; i--) {
    if (now - points[i].ts > lookbackMs) break;
    startIdx = i;
  }
  if (startIdx >= points.length - 1) return null;
  const dist = polylineLength(points.slice(startIdx));
  const dt = (now - points[startIdx].ts) / 1000;
  if (dt <= 0) return null;
  return dist / dt;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function decimalToDMS(lat: number, lng: number): string {
  const dir = lat >= 0 ? 'N' : 'S';
  const ldir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}°${dir}, ${Math.abs(lng).toFixed(5)}°${ldir}`;
}

export function uuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function currentStreakDays(runStartTimes: number[]): number {
  if (runStartTimes.length === 0) return 0;
  const days = new Set<number>();
  for (const ts of runStartTimes) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    days.add(Math.floor(d.getTime() / 86400000));
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const today = Math.floor(now.getTime() / 86400000);
  if (!days.has(today) && !days.has(today - 1)) return 0;
  let streak = 0;
  let day = days.has(today) ? today : today - 1;
  while (days.has(day)) {
    streak++;
    day--;
  }
  return streak;
}

export function weekDistanceM(runs: { start_time: string; distance_m: number }[]): number {
  const monday = startOfWeek(new Date());
  return runs
    .filter((r) => new Date(r.start_time).getTime() >= monday.getTime())
    .reduce((sum, r) => sum + r.distance_m, 0);
}

/**
 * Downsamples a polyline to at most `max` points (always keeps first & last).
 * Used when turning a full run track into a planned route so the planner map
 * stays fast.
 */
export function downsamplePolyline(points: GeoPoint[], max: number): GeoPoint[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out: GeoPoint[] = [];
  for (let i = 0; i < max; i++) {
    out.push(points[Math.round(i * step)]);
  }
  return out;
}

/**
 * Computes per-km splits from a run polyline. Split durations come from the
 * point timestamps, so paused time (no points recorded) is naturally excluded.
 */
export function computeSplits(polyline: GeoPoint[]): { km: number; durationS: number }[] {
  const splits: { km: number; durationS: number }[] = [];
  if (polyline.length < 2) return splits;
  let acc = 0;
  let segStartIdx = 0;
  for (let i = 1; i < polyline.length; i++) {
    acc += haversine(polyline[i - 1], polyline[i]);
    if (acc >= 1000) {
      const dt = (polyline[i].ts - polyline[segStartIdx].ts) / 1000;
      if (dt > 0) {
        splits.push({ km: splits.length + 1, durationS: dt });
      }
      acc -= 1000;
      segStartIdx = i;
    }
  }
  return splits;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}
