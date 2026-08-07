import {
  haversine,
  speedFromRecentPoints,
  formatDistance,
  formatDuration,
  formatPace,
  currentStreakDays,
  weekDistanceM,
  startOfWeek,
} from '../src/lib/geo';
import { GeoPoint } from '../src/types';

function pt(lat: number, lng: number, ts: number): GeoPoint {
  return { lat, lng, alt: null, accuracy: null, ts };
}

describe('haversine', () => {
  test('zero distance for identical points', () => {
    expect(haversine(pt(38.7, -9.1, 0), pt(38.7, -9.1, 0))).toBe(0);
  });

  test('approximate 1 degree of latitude', () => {
    const d = haversine(pt(0, 0, 0), pt(1, 0, 0));
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });
});

describe('speedFromRecentPoints', () => {
  test('null with fewer than 2 points', () => {
    expect(speedFromRecentPoints([pt(0, 0, 0)], 20000)).toBeNull();
  });

  test('constant speed within lookback', () => {
    const pts = [
      pt(0, 0, 0),
      pt(0.001, 0, 1000),
      pt(0.002, 0, 2000),
    ];
    const speed = speedFromRecentPoints(pts, 20000);
    expect(speed).not.toBeNull();
    expect(speed!).toBeGreaterThan(0);
  });
});

describe('formatDistance', () => {
  test('meters below 1km', () => expect(formatDistance(950)).toBe('950 m'));
  test('kilometers above 1km', () => expect(formatDistance(1250)).toBe('1.25 km'));
});

describe('formatDuration', () => {
  test('under a minute', () => expect(formatDuration(45)).toBe('0:45'));
  test('over an hour', () => expect(formatDuration(3725)).toBe('1:02:05'));
});

describe('formatPace', () => {
  test('null pace', () => expect(formatPace(null)).toBe('--:--'));
  test('pace value', () => expect(formatPace(92)).toBe('1:32 /km'));
});

describe('currentStreakDays', () => {
  const day = (offset: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d.getTime();
  };

  test('zero for no runs', () => expect(currentStreakDays([])).toBe(0));

  test('counts consecutive days ending today', () => {
    expect(currentStreakDays([day(0), day(-1), day(-2), day(-4)])).toBe(3);
  });

  test('counts a streak ending yesterday', () => {
    expect(currentStreakDays([day(-1), day(-2)])).toBe(2);
  });
});

describe('weekDistanceM', () => {
  const run = (offsetDays: number, distance: number) => ({
    start_time: new Date(Date.now() + offsetDays * 86400000).toISOString(),
    distance_m: distance,
  });

  test('sums only this week', () => {
    const monday = startOfWeek(new Date());
    const offset = Math.max(0, (Date.now() - monday.getTime()) / 86400000);
    const older = run(-(offset + 8), 100);
    const thisWeek = run(0, 250);
    expect(weekDistanceM([older, thisWeek])).toBe(250);
  });
});
