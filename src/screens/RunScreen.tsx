import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from 'react-native-paper';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useIsFocused, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useMapTheme } from '../theme/ThemeContext';
import { spacing, radii } from '../theme/colors';import { overlayTokens } from '../theme/tokens';

import { session, Snapshot } from '../services/RunSession';
import { RunState } from '../types';
import { db } from '../db/database';
import { SavedRoute } from '../types';
import { RootTabParamList } from '../navigation/RootNavigator';
import { audio } from '../services/AudioCue';
import { formatDistance, formatDuration, formatPace } from '../lib/geo';
import { BigButton } from '../components/BigButton';
import { MapWebView, MapWebViewHandle } from '../components/MapWebView';
import { AppIcon } from '../components/AppIcon';
import { LocateButton } from '../components/LocateButton';
import { createAnimatedComponent } from 'react-native-reanimated';
import { useDialog } from '../components/Dialog';
import { useM3PressScale } from '../hooks/useM3PressScale';

const IDLE_SNAP: Snapshot = {
  state: 'idle',
  distanceM: 0,
  elapsedS: 0,
  pausedS: 0,
  currentPaceS: null,
  lastKmDurationS: null,
  pointCount: 0,
  autoPaused: false,
  gpsAccuracy: null,
};

export function RunScreen() {
  const { palette } = useTheme();
  const mapTheme = useMapTheme();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootTabParamList, 'Run'>>();
  const dialog = useDialog();
  const mapHandle = useRef<MapWebViewHandle>(null);
  const { animatedStyle, onPressIn, onPressOut } = useM3PressScale(0.9);
  const AnimatedPressable = useMemo(() => createAnimatedComponent(Pressable), []);
  const [plannedRoute, setPlannedRoute] = useState<SavedRoute | null>(null);
  const [snap, setSnap] = useState<Snapshot>(IDLE_SNAP);
  const [checkpointVisible, setCheckpointVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trackPoints, setTrackPoints] = useState(session.getPoints());
  const snapRef = useRef<Snapshot>(IDLE_SNAP);
  const prevStateRef = useRef<RunState>('idle');
  const prevPointCountRef = useRef(0);

  useEffect(() => {
    const routeId = route.params?.routeId;
    if (routeId) {
      db.getAllRoutes().then((routes) => {
        setPlannedRoute(routes.find((r) => r.id === routeId) ?? null);
      });
    }
  }, [route.params?.routeId]);

  useEffect(() => {
    const unsub = session.subscribe((s) => {
      const prevState = prevStateRef.current;
      const prevCount = prevPointCountRef.current;
      setSnap(s);
      if (s.pointCount !== prevCount) {
        setTrackPoints(session.getPoints());
        if (prevCount === 0 && s.pointCount > 0 && s.state === 'recording') {
          const pts = session.getPoints();
          const last = pts[pts.length - 1];
          if (last) {
            mapHandle.current?.centerOn(last.lat, last.lng);
          }
        }
        prevPointCountRef.current = s.pointCount;
      }
      if (prevState !== s.state && s.state === 'recording') {
        mapHandle.current?.locate();
      }
      prevStateRef.current = s.state;
      snapRef.current = s;
    });
    if (isFocused && session.getState() === 'idle') {
      // Only offer recovery when no run is in progress: the checkpoint is
      // saved every 15s during a recording, so tab focus changes must not
      // pop the "unfinished run" dialog over a live run.
      session.recoverCheckpoint().then((cp) => {
        if (cp) setCheckpointVisible(true);
      });
    }
    return unsub;
  }, [isFocused]);

  const speaking = useRef(false);
  const onSpeak = useCallback(() => {
    if (speaking.current) return;
    speaking.current = true;
    audio.speak(
      `Distance ${formatDistance(snap.distanceM)}. Time ${formatDuration(snap.elapsedS)}. ${
        snap.currentPaceS != null ? `Current pace ${formatPace(snap.currentPaceS)}.` : ''
      } ${snap.pausedS > 0 ? `Paused ${formatDuration(snap.pausedS)}.` : ''}`,
    );
    setTimeout(() => {
      speaking.current = false;
    }, 1500);
  }, [snap]);

  const onStart = useCallback(async () => {
    try {
      await session.start();
    } catch {
      dialog.alert({
        title: 'Location permission needed',
        message: 'RunTracker needs location permission to record your run. Enable it in Settings and try again.',
        buttons: [{ label: 'OK' }],
      });
    }
  }, [dialog]);

  const onStop = useCallback(() => {
    dialog.alert({
      title: 'Finish run?',
      message: 'Your run will be saved to history.',
      buttons: [
        { label: 'Cancel', variant: 'ghost' },
        {
          label: 'Finish run',
          variant: 'danger',
          onPress: async () => {
            setSaving(true);
            const run = await session.stop();
            setSaving(false);
            if (run) {
              dialog.alert({
                title: 'Run saved',
                message: `${formatDistance(run.distance_m)} in ${formatDuration(run.duration_s)}`,
                buttons: [{ label: 'OK' }],
              });
            } else {
              dialog.alert({
                title: 'Nothing to save',
                message: 'No movement was detected during this run.',
                buttons: [{ label: 'OK' }],
              });
            }
            setSnap(IDLE_SNAP);
          },
        },
      ],
    });
  }, [dialog]);

  const resumeCheckpoint = useCallback(async () => {
    const cp = await session.recoverCheckpoint();
    if (!cp) return;
    setCheckpointVisible(false);
    await session.resumeFromCheckpoint(cp);
  }, []);

  const discardCheckpoint = useCallback(async () => {
    setCheckpointVisible(false);
    await session.discardCheckpoint();
  }, []);

  const recording = snap.state === 'recording';
  const paused = snap.state === 'paused';
  const active = recording || paused;

  const gpsAccuracy = snap.gpsAccuracy;
  const gpsGood = gpsAccuracy != null && gpsAccuracy <= 15;
  const gpsMid = gpsAccuracy != null && gpsAccuracy > 15 && gpsAccuracy <= 30;
  const gpsColor = gpsGood ? palette.success : gpsMid ? palette.warning : palette.danger;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <MapWebView
          ref={mapHandle}
          waypoints={active ? trackPoints : []}
          plannedRoute={plannedRoute?.waypoints ?? []}
          mode={active ? 'track' : 'plan'}
          theme={mapTheme}
          fitOnMount
        />
      </View>

      <View style={[styles.topOverlay, { paddingTop: insets.top + spacing.lg }]} pointerEvents="box-none">
        {plannedRoute ? (
          <View style={[styles.routeBanner, { backgroundColor: palette.glass, borderColor: palette.glassBorder }]}>
            <AppIcon name="route" size={15} color={palette.primary} />
            <Text variant="labelMedium" style={{ color: palette.text, flex: 1 }} numberOfLines={1} maxFontSizeMultiplier={2}>
              {plannedRoute.name}
            </Text>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Clear planned route"
              onPress={() => setPlannedRoute(null)}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              hitSlop={8}
              style={animatedStyle}
            >
              <AppIcon name="close" size={16} color={palette.textMuted} />
            </AnimatedPressable>
          </View>
        ) : null}
        <View style={styles.metricRow}>
          <View style={[styles.glassCard, { backgroundColor: palette.glass, borderColor: palette.glassBorder }]}>
            <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
              Distance
            </Text>
            <Text variant="displayMedium" style={{ color: palette.text }} maxFontSizeMultiplier={2} adjustsFontSizeToFit numberOfLines={1}>
              {formatDistance(snap.distanceM)}
            </Text>
          </View>
          <View style={[styles.glassCard, { backgroundColor: palette.glass, borderColor: palette.glassBorder }]}>
            <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
              Time
            </Text>
            <Text variant="displayMedium" style={{ color: palette.text }} maxFontSizeMultiplier={2} adjustsFontSizeToFit numberOfLines={1}>
              {formatDuration(snap.elapsedS)}
            </Text>
          </View>
        </View>

        {active ? (
          <View style={styles.metricRow}>
            <View style={[styles.glassCardSmall, { backgroundColor: palette.glass, borderColor: palette.glassBorder }]}>
              <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
                Pace
              </Text>
              <Text variant="titleLarge" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
                {formatPace(snap.currentPaceS)}
              </Text>
            </View>
            <View style={[styles.glassCardSmall, { backgroundColor: palette.glass, borderColor: palette.glassBorder }]}>
              <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
                Last km
              </Text>
              <Text variant="titleLarge" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
                {snap.lastKmDurationS != null ? formatPace(snap.lastKmDurationS) : '--:--'}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomControls}>
        <View style={styles.bottomStatusRow}>
          <View style={styles.pillRow}>
            {active ? (
              <>
                <View style={[styles.glassPill, { backgroundColor: palette.glass, borderColor: gpsColor }]}>
                  <AppIcon name="gps-fixed" size={14} color={gpsColor} />
                  <Text variant="labelMedium" style={{ color: gpsColor }} maxFontSizeMultiplier={2}>
                    {gpsAccuracy != null ? `GPS ±${Math.round(gpsAccuracy)} m` : 'Searching…'}
                  </Text>
                </View>
                {snap.autoPaused ? (
                  <View style={[styles.glassPill, { backgroundColor: palette.glass, borderColor: palette.warning }]}>
                    <Text variant="labelMedium" style={{ color: palette.warning }} maxFontSizeMultiplier={2}>
                      Auto-paused
                    </Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
          <LocateButton
            mapHandle={mapHandle}
            onError={(msg) => dialog.alert({ title: 'Location', message: msg, buttons: [{ label: 'OK' }] })}
          />
        </View>
        {snap.state === 'idle' ? (
          <>
            <BigButton
              label="Start Run"
              onPress={onStart}
              size="large"
              accessibilityHint="Begins tracking your run with GPS"
              style={styles.bottomButton}
            />
            <Text variant="labelMedium" style={[styles.hint, { color: palette.textMuted }]}>
              Recorded entirely on your device
            </Text>
          </>
        ) : null}

        {recording ? (
          <>
            <BigButton label="Pause" icon="pause" onPress={() => session.pause()} variant="secondary" size="large" style={styles.bottomButton} />
            <BigButton label="Speak stats" icon="volume-up" onPress={onSpeak} variant="ghost" style={styles.bottomButton} />
            <BigButton label="Finish run" icon="stop" onPress={onStop} variant="danger" size="large" disabled={saving} style={styles.bottomButton} />
          </>
        ) : null}

        {paused ? (
          <>
            <BigButton label="Resume" icon="play-arrow" onPress={() => session.resume()} size="large" style={styles.bottomButton} />
            <BigButton label="Speak stats" icon="volume-up" onPress={onSpeak} variant="ghost" style={styles.bottomButton} />
            <BigButton label="Finish run" icon="stop" onPress={onStop} variant="danger" size="large" disabled={saving} style={styles.bottomButton} />
          </>
        ) : null}
      </View>

      <Modal
        visible={checkpointVisible}
        transparent
        animationType="fade"
        onRequestClose={discardCheckpoint}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text variant="titleLarge" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
              Unfinished run found
            </Text>
            <Text variant="bodyLarge" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
              You had a run in progress. Resume it or discard the recording.
            </Text>
            <BigButton label="Resume run" onPress={resumeCheckpoint} style={{ width: '100%' }} />
            <BigButton
              label="Discard recording"
              onPress={discardCheckpoint}
              variant="danger"
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pillRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  glassCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 2,
    minHeight: 116,
    justifyContent: 'center',
  },
  glassCardSmall: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
    minHeight: 72,
    justifyContent: 'center',
  },
  bottomControls: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.md,
  },
  routeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  bottomStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  bottomButton: {
    width: '100%',
  },
  hint: {
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: overlayTokens.scrimOverlayStrong,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modal: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
});
