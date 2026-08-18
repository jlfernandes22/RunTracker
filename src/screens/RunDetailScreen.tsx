import React, { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native-paper';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme, useMapTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radii, overlayTokens } from '../theme/tokens';

import { db } from '../db/database';
import { Run } from '../types';
import {
  computeSplits,
  decimalToDMS,
  downsamplePolyline,
  formatDate,
  formatDistance,
  formatDuration,
  formatPace,
  formatTime,
  uuid,
} from '../lib/geo';
import { MapWebView } from '../components/MapWebView';
import { BigButton } from '../components/BigButton';
import { useDialog } from '../components/Dialog';
import { useSnackbar } from '../components/Snackbar';
import { audio } from '../services/AudioCue';
import { toGpx } from '../services/backup';
import { Skeleton } from '../components/Skeleton';
import { Card } from '../components/Card';
import { MetricCard } from '../components/MetricCard';
import { SavedRoute } from '../types';
import { HistoryStackParamList } from '../navigation/RootNavigator';

export function RunDetailScreen() {
  const { palette } = useTheme();
  const mapTheme = useMapTheme();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();
  const snackbar = useSnackbar();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<HistoryStackParamList, 'RunDetail'>>();
  const [run, setRun] = useState<Run | null | undefined>(undefined);
  const [showText, setShowText] = useState(false);
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setRun(undefined);
    db.getRun(route.params.runId).then((found) => {
      if (found) {
        setRun(found);
        setNotes(found.notes ?? '');
      } else {
        setRun(null);
      }
    }).catch(() => {
      setRun(null);
    });
  }, [route.params.runId]);

  const movingS = run ? run.duration_s - (run.paused_s ?? 0) : 0;
  const pace = run && movingS > 0 && run.distance_m > 0 ? movingS / (run.distance_m / 1000) : null;
  const splits = React.useMemo(() => (run ? computeSplits(run.polyline) : []), [run]);

  const summary = React.useMemo(() => {
    if (!run) return '';
    return (
      `Run on ${formatDate(run.start_time)} at ${formatTime(run.start_time)}. ` +
      `${formatDistance(run.distance_m)} in ${formatDuration(run.duration_s)}. ` +
      (pace != null ? `Average pace ${formatPace(pace)}. ` : '') +
      (run.paused_s > 0 ? `Paused for ${formatDuration(run.paused_s)}. ` : '') +
      `${run.polyline.length} GPS points recorded.`
    );
  }, [run, pace]);

  const describeRoute = () => {
    if (summary) audio.speak(summary);
  };

  const waypointText = React.useMemo(() => {
    if (!run) return '';
    return run.polyline
      .slice(0, 50)
      .map((p, i) => `Point ${i + 1}: ${decimalToDMS(p.lat, p.lng)}`)
      .join('\n');
  }, [run]);

  const saveAsRoute = async () => {
    if (!run) return;
    const newRoute: SavedRoute = {
      id: uuid(),
      name: `Route ${formatDistance(run.distance_m)}`,
      waypoints: downsamplePolyline(run.polyline, 100),
      distance_m: run.distance_m,
      created_at: new Date().toISOString(),
    };
    await db.insertRoute(newRoute);
    dialog.alert({
      title: 'Route saved',
      message: `${newRoute.name} was added to your planned routes.`,
      buttons: [
        { label: 'Close', variant: 'ghost' },
        {
          label: 'Start this route',
          onPress: () => (navigation.getParent() as any)?.navigate('Run', { routeId: newRoute.id }),
        },
      ],
    });
  };

  const exportGpx = async () => {
    if (!run) return;
    const { Directory, File, Paths } = require('expo-file-system');
    const dir = new Directory(Paths.document, 'runtracker_gpx');
    dir.create({ intermediates: true, idempotent: true });
    const file = new File(dir, `${run.id}.gpx`);
    file.write(toGpx(run));
    snackbar.showSnackbar('GPX file saved on this device');
  };

  if (run === undefined) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background, padding: spacing.lg, gap: spacing.md }]}>
        <Skeleton width="60%" height={24} />
        <Skeleton width="100%" height={96} />
        <Skeleton width="100%" height={280} radius={16} />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Skeleton style={{ flex: 1 }} height={88} />
          <Skeleton style={{ flex: 1 }} height={88} />
        </View>
      </View>
    );
  }

  if (run === null) {
    return (
      <View style={[styles.container, styles.notFound, { backgroundColor: palette.background }]}>
        <Text variant="titleLarge" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2}>
          Run not found
        </Text>
        <Text variant="bodyLarge" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
          This run may have been deleted.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" contentStyle={styles.summaryBox}>
          <Text variant="labelMedium" style={[styles.summaryTitle, { color: palette.primary }]} maxFontSizeMultiplier={2}>
            Route summary
          </Text>
          <Text variant="bodyLarge" style={{ color: palette.onSurface, lineHeight: 24 }} maxFontSizeMultiplier={2}>
            {summary}
          </Text>
          <View style={styles.actions}>
            <BigButton label="Read summary" icon="volume-up" onPress={describeRoute} style={{ flex: 1 }} />
            <BigButton label="Text list" icon="format-list-bulleted" onPress={() => setShowText(true)} variant="secondary" style={{ flex: 1 }} />
          </View>
        </Card>

        <View style={styles.metricRow}>
          <MetricCard label="Distance" value={formatDistance(run.distance_m)} />
          <MetricCard label="Duration" value={formatDuration(run.duration_s)} />
        </View>
        <View style={styles.metricRow}>
          <MetricCard label="Avg Pace" value={formatPace(pace)} />
          <MetricCard label="Paused" value={formatDuration(run.paused_s)} />
        </View>

        {splits.length > 0 ? (
          <Card variant="elevated" contentStyle={styles.splitsCard}>
            <Text variant="labelMedium" style={[styles.summaryTitle, { color: palette.primary }]} maxFontSizeMultiplier={2}>
              Kilometer Splits
            </Text>
            {splits.map((sp, idx) => (
              <View
                key={sp.km}
                style={[
                  styles.splitRow,
                  idx < splits.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.outlineVariant },
                ]}
              >
                <Text variant="labelLarge" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
                  Km {sp.km}
                </Text>
                <Text variant="bodyLarge" style={{ color: palette.onSurface, fontWeight: '600' }} maxFontSizeMultiplier={2}>
                  {formatDuration(sp.durationS)}
                </Text>
                <Text variant="labelLarge" style={{ color: palette.primary, fontWeight: '700' }} maxFontSizeMultiplier={2}>
                  {formatPace(sp.durationS)}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Card variant="elevated" contentStyle={styles.notes}>
          <Text variant="titleMedium" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2}>
            Notes
          </Text>
          <BigButton
            label={notes ? `Edit: ${notes}` : 'Add notes'}
            onPress={() => {
              setNotesDraft(notes);
              setShowNotesEditor(true);
            }}
            variant="ghost"
            style={{ width: '100%' }}
          />
        </Card>

        <BigButton label="Save as planned route" icon="route" onPress={saveAsRoute} variant="secondary" style={{ width: '100%' }} />
        <BigButton label="Export GPX file" icon="file-download" onPress={exportGpx} variant="ghost" style={{ width: '100%' }} />
      </ScrollView>

      <View style={[styles.mapWrap, { height: 280 + insets.bottom + spacing.sm, borderColor: palette.outlineVariant }]}>
        <MapWebView
          waypoints={run.polyline}
          onPressPoint={() => {}}
          mode="track"
          theme={mapTheme}
          height={280}
          fitOnMount
        />
      </View>

      <Modal
        visible={showNotesEditor}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotesEditor(false)}
      >
        <View style={styles.modalBackdrop}>
          <Card variant="elevated" style={styles.modal} contentStyle={styles.modalContent}>
            <Text variant="titleLarge" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2}>
              Notes
            </Text>
            <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
              How did the run feel?
            </Text>
            <TextInput
              accessibilityLabel="Run notes"
              label="Run notes"
              value={notesDraft}
              onChangeText={setNotesDraft}
              multiline
              placeholder="e.g. Felt great, strong finish"
              mode="outlined"
              outlineColor={palette.outlineVariant}
              activeOutlineColor={palette.primary}
              style={styles.notesInput}
            />
            <View style={styles.modalActions}>
              <BigButton label="Cancel" onPress={() => setShowNotesEditor(false)} variant="ghost" style={{ flex: 1 }} />
              <BigButton
                label="Save"
                onPress={() => {
                  const trimmed = notesDraft.trim();
                  setNotes(trimmed);
                  setShowNotesEditor(false);
                  const updated = { ...run, notes: trimmed || null };
                  setRun(updated);
                  db.insertRun(updated).catch(() => {});
                }}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      <Modal visible={showText} transparent animationType="fade" onRequestClose={() => setShowText(false)}>
        <View style={styles.modalBackdrop}>
          <Card variant="elevated" style={styles.modal} contentStyle={styles.modalContent}>
            <Text variant="titleLarge" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2}>
              Route as text
            </Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <Text variant="bodyMedium" style={{ color: palette.onSurface, lineHeight: 22 }} maxFontSizeMultiplier={2}>
                {waypointText}
              </Text>
            </ScrollView>
            <BigButton label="Close" onPress={() => setShowText(false)} />
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  notFound: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  mapWrap: {
    borderRadius: radii.large,
    overflow: 'hidden',
    borderWidth: 1,
  },
  summaryBox: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  notes: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  splitsCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: overlayTokens.scrimOverlayStrong,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modal: {
    borderRadius: radii.extraLarge,
  },
  modalContent: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  notesInput: {
    minHeight: 90,
    backgroundColor: 'transparent',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
