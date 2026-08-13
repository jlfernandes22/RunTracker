import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { GeoPoint, Run, RunState } from '../types';
import { haversine, speedFromRecentPoints, uuid } from '../lib/geo';
import { audio, isScreenReaderOn, setSoundEnabled, setVibrationEnabled } from './AudioCue';
import { db } from '../db/database';
import { showRunStatsNotification, hideRunStatsNotification } from './notifications';
import { formatDistance, formatDuration, formatPace } from '../lib/geo';

const AUTO_PAUSE_SPEED_MS = 0.45;
const AUTO_PAUSE_DELAY_MS = 6000;
const AUTO_RESUME_SPEED_MS = 1.2;
const KM = 1000;
const CHECKPOINT_KEY = 'session.checkpoint';

export interface Snapshot {
  state: RunState;
  distanceM: number;
  elapsedS: number;
  pausedS: number;
  currentPaceS: number | null;
  lastKmDurationS: number | null;
  pointCount: number;
  autoPaused: boolean;
  gpsAccuracy: number | null;
  /** Recording but the clock has not started yet — waiting for the first GPS fix. */
  gpsAcquiring: boolean;
}

interface Checkpoint {
  run: Run;
  lastActiveTs: number;
  nextKmBoundary: number;
  pausedSince: number | null;
}

type Listener = (snap: Snapshot) => void;

class RunSession {
  private state: RunState = 'idle';
  private points: GeoPoint[] = [];
  private startTs: number | null = null;
  private pausedAccumS = 0;
  private pausedSince: number | null = null;
  private watchSub: Location.LocationSubscription | null = null;
  private fgActive = false;
  private tickId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private nextKmBoundary = KM;
  private autoPaused = false;
  private stationaryMs = 0;
  private currentPaceS: number | null = null;
  private lastKmDurationS: number | null = null;
  private lastKmCompletedAt: number | null = null;
  private prevKmCompletedAt: number | null = null;
  private checkId: ReturnType<typeof setInterval> | null = null;
  private statsNotifId: ReturnType<typeof setInterval> | null = null;
  private autoPauseEnabled = true;
  private speechEnabled = true;
  private lastAccuracy: number | null = null;

  getState(): RunState {
    return this.state;
  }

  getPoints(): GeoPoint[] {
    return [...this.points];
  }

  isAutoPaused(): boolean {
    return this.autoPaused;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  private emit() {
    const snap = this.snapshot();
    this.listeners.forEach((l) => l(snap));
  }

  snapshot(): Snapshot {
    return {
      state: this.state,
      distanceM: this.totalDistance(),
      elapsedS: this.elapsedS(),
      pausedS: this.pausedS(),
      currentPaceS: this.currentPaceS,
      lastKmDurationS: this.lastKmDurationS,
      pointCount: this.points.length,
      autoPaused: this.autoPaused,
      gpsAccuracy: this.lastAccuracy,
      gpsAcquiring: this.state === 'recording' && this.startTs == null,
    };
  }

  private totalDistance(): number {
    let total = 0;
    for (let i = 1; i < this.points.length; i++) {
      total += haversine(this.points[i - 1], this.points[i]);
    }
    return total;
  }

  private elapsedS(): number {
    if (this.startTs == null) return 0;
    if (this.state === 'paused' && this.pausedSince != null) {
      return (this.pausedSince - this.startTs) / 1000 - this.pausedAccumS;
    }
    return Date.now() / 1000 - this.startTs / 1000 - this.pausedAccumS;
  }

  private pausedS(): number {
    if (this.pausedSince != null) {
      return this.pausedAccumS + (Date.now() - this.pausedSince) / 1000;
    }
    return this.pausedAccumS;
  }

  private startTicking() {
    this.stopTicking();
    this.tickId = setInterval(() => {
      this.detectAutoPause();
      this.emit();
    }, 1000);
  }

  private detectAutoPause() {
    if (!this.autoPauseEnabled || this.state !== 'recording') return;
    if (this.points.length === 0) return;
    const last = this.points[this.points.length - 1];
    const sinceFix = Date.now() - last.ts;
    if (sinceFix > 5000) {
      this.stationaryMs += 1000;
    } else if (this.points.length >= 2) {
      const speed = speedFromRecentPoints(this.points, 20000);
      if (speed == null || speed < AUTO_PAUSE_SPEED_MS) {
        this.stationaryMs += 1000;
      } else {
        this.stationaryMs = 0;
      }
    } else {
      this.stationaryMs = 0;
    }
    if (this.stationaryMs > AUTO_PAUSE_DELAY_MS) {
      this.stationaryMs = 0;
      this.autoPaused = true;
      this.pauseInternal(true);
    }
  }

  private stopTicking() {
    if (this.tickId) {
      clearInterval(this.tickId);
      this.tickId = null;
    }
  }

  private async ensureWatch() {
    if (this.watchSub != null) return;
    try {
      this.watchSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 3,
          timeInterval: 2000,
        },
        (pos) => this.onPosition(pos),
      );
    } catch (e) {
      console.warn('GPS watch failed', e);
    }
  }

  private stopWatch() {
    if (this.watchSub != null) {
      this.watchSub.remove();
      this.watchSub = null;
    }
  }

  private onPosition(pos: Location.LocationObject) {
    const { latitude, longitude, altitude, accuracy } = pos.coords;
    this.lastAccuracy = accuracy ?? null;

    if (this.state === 'paused' && this.autoPaused) {
      const probe = [...this.points, {
        lat: latitude,
        lng: longitude,
        alt: altitude ?? null,
        accuracy: accuracy ?? null,
        ts: pos.timestamp ?? Date.now(),
      }];
      const speed = speedFromRecentPoints(probe, 20000);
      if (speed != null && speed > AUTO_RESUME_SPEED_MS) {
        this.autoPaused = false;
        this.stationaryMs = 0;
        this.resume();
      }
      return;
    }

    if (this.state !== 'recording') return;

    if (this.startTs == null) {
      // No usable fix yet — wait for the first reported position before
      // starting the clock (avoids inflating time-per-km).
      if (accuracy == null) {
        this.emit();
        return;
      }
      this.startTs = pos.timestamp ?? Date.now();
      this.startCheckpointing();
      this.startStatsNotification();
      audio.cue('start');
    }

    const point: GeoPoint = {
      lat: latitude,
      lng: longitude,
      alt: altitude ?? null,
      accuracy: accuracy ?? null,
      ts: pos.timestamp ?? Date.now(),
    };

    if (this.points.length > 0) {
      const prev = this.points[this.points.length - 1];
      if (haversine(prev, point) < 1) return;
    }
    this.points.push(point);

    const distance = this.totalDistance();
    if (distance >= this.nextKmBoundary) {
      this.prevKmCompletedAt = this.lastKmCompletedAt;
      this.lastKmCompletedAt = Date.now();
      if (this.prevKmCompletedAt != null) {
        this.lastKmDurationS = (this.lastKmCompletedAt - this.prevKmCompletedAt) / 1000;
      } else if (this.startTs != null) {
        this.lastKmDurationS = (this.lastKmCompletedAt - this.startTs) / 1000 - this.pausedAccumS;
      }
      audio.cue('lap');
      if (this.speechEnabled && !isScreenReaderOn()) {
        const km = formatKmText(distance);
        audio.speak(`${km} kilometer${Number(km) > 1 ? 's' : ''}`);
      }
      this.nextKmBoundary += KM;
    }

    const speed = speedFromRecentPoints(this.points, 20000);
    if (speed != null && speed > 0.1) {
      this.currentPaceS = speed > 0 ? 1000 / speed : null;
    } else if (this.points.length > 5) {
      this.currentPaceS = null;
    }

    this.emit();
  }

  private async pauseInternal(keepWatch = false) {
    if (this.state !== 'recording') return;
    this.pausedSince = Date.now();
    this.state = 'paused';
    if (!keepWatch) this.stopWatch();
    audio.cue('pause');
    this.emit();
  }

  private async startBackground() {
    if (Platform.OS !== 'android' || this.fgActive) return;
    try {
      const { NativeModules } = require('react-native');
      // Starts a native foreground service (with the run-stats notification)
      // so the session keeps recording with the screen locked.
      await NativeModules.RunStatsNotifier?.show(
        `${formatDistance(this.totalDistance())} · ${formatDuration(this.elapsedS())} · ${formatPace(this.currentPaceS)}`,
      );
      this.fgActive = true;
    } catch (e) {
      console.warn('foreground service start failed', e);
    }
  }

  private async stopBackground() {
    if (!this.fgActive) return;
    try {
      const { NativeModules } = require('react-native');
      await NativeModules.RunStatsNotifier?.hide();
    } catch (e) {
      console.warn('foreground service stop failed', e);
    }
    this.fgActive = false;
  }

  addLocatedPoint(lat: number, lng: number, accuracy: number | null): void {
    if (this.state !== 'recording') return;
    const point: GeoPoint = {
      lat,
      lng,
      alt: null,
      accuracy,
      ts: Date.now(),
    };
    const last = this.points[this.points.length - 1];
    if (last && haversine(last, point) < 1) return;
    this.points.push(point);
    this.lastAccuracy = accuracy;
    const speed = speedFromRecentPoints(this.points, 20000);
    if (speed != null && speed > 0.1) {
      this.currentPaceS = speed > 0 ? 1000 / speed : null;
    }
    this.emit();
  }

  async start(): Promise<void> {
    console.log('[RunSession] start() called, state=', this.state);
    if (this.state !== 'idle') return;
    const hasPermission = await this.ensurePermissions();
    if (!hasPermission) throw new Error('LOCATION_PERMISSION_DENIED');

    this.state = 'recording';
    this.points = [];
    this.lastAccuracy = null;
    // The clock starts on the first GPS fix so pre-fix time never pollutes pace.
    this.startTs = null;
    this.pausedAccumS = 0;
    this.pausedSince = null;
    this.nextKmBoundary = KM;
    this.lastKmDurationS = null;
    this.lastKmCompletedAt = null;
    this.prevKmCompletedAt = null;
    this.currentPaceS = null;
    this.stationaryMs = 0;
    this.autoPaused = false;

    try {
      const cfg = await this.loadSettings();
      this.autoPauseEnabled = cfg.autoPause;
      this.speechEnabled = cfg.speech;
    } catch (e) {
      console.warn('failed to load settings, using defaults', e);
    }

    if (Platform.OS === 'android') {
      await this.startBackground();
    }

    this.ensureWatch();
    this.startTicking();
    // Checkpointing, the stats notification and the start cue kick in once the
    // first GPS fix arrives (startTs is set there).
    this.deleteCheckpoint();
    this.emit();
  }

  async pause(): Promise<void> {
    if (this.startTs == null) return; // nothing running yet (no GPS fix)
    this.autoPaused = false;
    this.stationaryMs = 0;
    await this.pauseInternal();
  }

  async resume(): Promise<void> {
    if (this.state !== 'paused') return;
    if (this.pausedSince != null) {
      this.pausedAccumS += (Date.now() - this.pausedSince) / 1000;
    }
    this.pausedSince = null;
    this.state = 'recording';
    this.stationaryMs = 0;
    this.ensureWatch();
    audio.cue('resume');
    this.emit();
  }

  async stop(): Promise<Run | null> {
    if (this.state === 'idle') return null;
    const wasPaused = this.state === 'paused';
    if (wasPaused && this.pausedSince != null) {
      this.pausedAccumS += (Date.now() - this.pausedSince) / 1000;
    }
    this.pausedSince = null;

    const run: Run = {
      id: uuid(),
      start_time: new Date(this.startTs ?? Date.now()).toISOString(),
      end_time: new Date().toISOString(),
      duration_s: Math.round(this.elapsedS()),
      distance_m: Math.round(this.totalDistance()),
      polyline: this.points,
      notes: null,
      paused_s: Math.round(this.pausedS()),
    };

    this.stopWatch();
    this.stopTicking();
    this.stopCheckpointing();
    this.stopStatsNotification();
    hideRunStatsNotification().catch(() => {});

    if (run.distance_m > 0 && run.polyline.length > 1) {
      await db.insertRun(run);
    }
    await this.deleteCheckpoint();

    await this.stopBackground();

    this.state = 'idle';
    this.points = [];
    this.startTs = null;
    this.pausedAccumS = 0;
    audio.cue('stop');
    this.emit();
    return run.distance_m > 0 ? run : null;
  }

  private async ensurePermissions(): Promise<boolean> {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      return perm.granted;
    } catch {
      return false;
    }
  }

  private async loadSettings(): Promise<{ autoPause: boolean; speech: boolean }> {
    const autoPause = await db.getSetting('run.autoPause');
    const speech = await db.getSetting('run.speechCues');
    const sound = await db.getSetting('run.soundCues');
    const vibration = await db.getSetting('run.vibration');
    setSoundEnabled(sound == null ? true : sound === 'true');
    setVibrationEnabled(vibration == null ? true : vibration === 'true');
    return {
      autoPause: autoPause == null ? true : autoPause === 'true',
      speech: speech == null ? true : speech === 'true',
    };
  }

  private startStatsNotification() {
    this.stopStatsNotification();
    this.updateStatsNotification();
    this.statsNotifId = setInterval(() => this.updateStatsNotification(), 5000);
  }

  private stopStatsNotification() {
    if (this.statsNotifId) {
      clearInterval(this.statsNotifId);
      this.statsNotifId = null;
    }
  }

  private updateStatsNotification() {
    if (this.state === 'idle' || this.startTs == null) return;
    const text = `${formatDistance(this.totalDistance())} · ${formatDuration(this.elapsedS())} · ${formatPace(this.currentPaceS)}`;
    showRunStatsNotification(text).catch(() => {});
  }

  private startCheckpointing() {
    this.stopCheckpointing();
    this.checkId = setInterval(() => this.saveCheckpoint(), 15000);
  }

  private stopCheckpointing() {
    if (this.checkId) {
      clearInterval(this.checkId);
      this.checkId = null;
    }
  }

  private async saveCheckpoint() {
    if (this.state === 'idle' || this.startTs == null) return;
    const cp: Checkpoint = {
      run: {
        id: uuid(),
        start_time: new Date(this.startTs).toISOString(),
        end_time: new Date().toISOString(),
        duration_s: Math.round(this.elapsedS()),
        distance_m: Math.round(this.totalDistance()),
        polyline: this.points,
        notes: null,
        paused_s: Math.round(this.pausedS()),
      },
      lastActiveTs: Date.now(),
      nextKmBoundary: this.nextKmBoundary,
      pausedSince: this.pausedSince,
    };
    await db.setSetting(CHECKPOINT_KEY, JSON.stringify(cp));
  }

  private async deleteCheckpoint() {
    await db.deleteSetting(CHECKPOINT_KEY);
  }

  async recoverCheckpoint(): Promise<Checkpoint | null> {
    const raw = await db.getSetting(CHECKPOINT_KEY);
    if (!raw) return null;
    try {
      const cp = JSON.parse(raw) as Checkpoint;
      if (Date.now() - cp.lastActiveTs > 12 * 3600 * 1000) {
        await this.deleteCheckpoint();
        return null;
      }
      return cp;
    } catch {
      await this.deleteCheckpoint();
      return null;
    }
  }

  async discardCheckpoint() {
    await this.deleteCheckpoint();
  }

  async resumeFromCheckpoint(cp: Checkpoint) {
    this.points = cp.run.polyline;
    this.startTs = new Date(cp.run.start_time).getTime();
    // cp.run.paused_s includes the in-flight pause (saved while paused); strip it
    // here so the ongoing pause is not counted twice when it is later resumed.
    this.pausedAccumS =
      cp.pausedSince != null
        ? Math.max(0, cp.run.paused_s - (cp.lastActiveTs - cp.pausedSince) / 1000)
        : cp.run.paused_s;
    this.pausedSince = cp.pausedSince;
    this.nextKmBoundary = cp.nextKmBoundary;
    this.lastKmDurationS = null;
    this.lastKmCompletedAt = null;
    this.prevKmCompletedAt = null;
    const wasPaused = cp.pausedSince != null;
    this.state = wasPaused ? 'paused' : 'recording';
    this.autoPaused = wasPaused;
    this.stationaryMs = 0;
    const cfg = await this.loadSettings();
    this.autoPauseEnabled = cfg.autoPause;
    this.speechEnabled = cfg.speech;

    if (Platform.OS === 'android' && !this.fgActive && this.state === 'recording') {
      await this.startBackground();
    }
    if (!wasPaused) this.ensureWatch();
    this.startTicking();
    this.startCheckpointing();
    this.startStatsNotification();
    this.emit();
  }
}

function formatKmText(distanceM: number): string {
  return (distanceM / KM).toFixed(0);
}

export const session = new RunSession();
