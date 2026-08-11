import React, { useEffect, useState } from 'react';
import { Text } from 'react-native-paper';
import { Modal, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme, useMapTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/colors';
import { db } from '../db/database';
import { Run } from '../types';
import { decimalToDMS, formatDate, formatDistance, formatDuration, formatPace, formatTime, uuid } from '../lib/geo';
import { MapWebView } from '../components/MapWebView';
import { BigButton } from '../components/BigButton';
import { useDialog } from '../components/Dialog';
import { audio } from '../services/AudioCue';
import { toGpx } from '../services/backup';
import { SavedRoute } from '../types';
import { HistoryStackParamList } from '../navigation/RootNavigator';

export function RunDetailScreen() {
  const { palette } = useTheme();
  const mapTheme = useMapTheme();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<HistoryStackParamList, 'RunDetail'>>();
  const [run, setRun] = useState<Run | null>(null);
  const [showText, setShowText] = useState(false);
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    db.getAllRuns().then((all) => {
      const found = all.find((r) => r.id === route.params.runId);
      if (found) {
        setRun(found);
        setNotes(found.notes ?? '');
      }
    });
  }, [route.params.runId]);

  if (!run) return null;

  const movingS = run.duration_s - (run.paused_s ?? 0);
  const pace = movingS > 0 && run.distance_m > 0 ? movingS / (run.distance_m / 1000) : null;

  const summary =
    `Run on ${formatDate(run.start_time)} at ${formatTime(run.start_time)}. ` +
    `${formatDistance(run.distance_m)} in ${formatDuration(run.duration_s)}. ` +
    (pace != null ? `Average pace ${formatPace(pace)}. ` : '') +
    (run.paused_s > 0 ? `Paused for ${formatDuration(run.paused_s)}. ` : '') +
    `${run.polyline.length} GPS points recorded.`;

  const describeRoute = () => {
    audio.speak(summary);
  };

  const waypointText = run.polyline
    .slice(0, 50)
    .map((p, i) => `Point ${i + 1}: ${decimalToDMS(p.lat, p.lng)}`)
    .join('\n');

  const saveAsRoute = async () => {
    const route: SavedRoute = {
      id: uuid(),
      name: `Route ${formatDistance(run.distance_m)}`,
      waypoints: run.polyline,
      distance_m: run.distance_m,
      created_at: new Date().toISOString(),
    };
    await db.insertRoute(route);
    dialog.alert({
      title: 'Route saved',
      message: `${route.name} was added to your planned routes.`,
      buttons: [
        { label: 'Close', variant: 'ghost' },
        {
          label: 'Start this route',
          onPress: () => (navigation.getParent() as any)?.navigate('Run', { routeId: route.id }),
        },
      ],
    });
  };

  const exportGpx = async () => {
    const { Directory, File, Paths } = require('expo-file-system');
    const dir = new Directory(Paths.document, 'runtracker_gpx');
    dir.create({ intermediates: true, idempotent: true });
    const file = new File(dir, `${run.id}.gpx`);
    file.write(toGpx(run));
    dialog.alert({ title: 'GPX exported', message: `Saved to ${file.uri}`, buttons: [{ label: 'OK' }] });
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text variant="labelMedium" style={[styles.summaryTitle, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
            Route summary
          </Text>
          <Text variant="bodyLarge" style={[styles.summaryText, { color: palette.text }]} maxFontSizeMultiplier={2}>
            {summary}
          </Text>
          <View style={styles.actions}>
            <BigButton label="Read summary" icon="volume-up" onPress={describeRoute} style={{ flex: 1 }} />
            <BigButton label="Text list" icon="format-list-bulleted" onPress={() => setShowText(true)} variant="secondary" style={{ flex: 1 }} />
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={[styles.metric, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>Distance</Text>
            <Text variant="titleLarge" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
              {formatDistance(run.distance_m)}
            </Text>
          </View>
          <View style={[styles.metric, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>Duration</Text>
            <Text variant="titleLarge" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
              {formatDuration(run.duration_s)}
            </Text>
          </View>
        </View>
        <View style={styles.metricRow}>
          <View style={[styles.metric, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>Avg pace</Text>
            <Text variant="titleLarge" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
              {formatPace(pace)}
            </Text>
          </View>
          <View style={[styles.metric, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>Paused</Text>
            <Text variant="titleLarge" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
              {formatDuration(run.paused_s)}
            </Text>
          </View>
        </View>

        <View style={[styles.notes, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text variant="titleMedium" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
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
        </View>

        <BigButton label="Save as planned route" icon="route" onPress={saveAsRoute} variant="secondary" style={{ width: '100%' }} />
<BigButton label="Export GPX file" icon="file-download" onPress={exportGpx} variant="ghost" style={{ width: '100%' }} />
      </ScrollView>

      <View style={[styles.mapWrap, { height: 280 + insets.bottom + spacing.sm }]}>
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
          <View style={[styles.modal, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]} maxFontSizeMultiplier={2}>
              Notes
            </Text>
            <Text variant="bodyMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
              How did the run feel?
            </Text>
            <TextInput
              accessibilityLabel="Run notes"
              value={notesDraft}
              onChangeText={setNotesDraft}
              multiline
              placeholder="e.g. Felt great, strong finish"
              placeholderTextColor={palette.textMuted}
              style={[
                styles.notesInput,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.surfaceVariant },
              ]}
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
          </View>
        </View>
      </Modal>

      <Modal visible={showText} transparent animationType="fade" onRequestClose={() => setShowText(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]} maxFontSizeMultiplier={2}>
              Route as text
            </Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <Text variant="bodyMedium" style={{ color: palette.text, lineHeight: 22 }} maxFontSizeMultiplier={2}>
                {waypointText}
              </Text>
            </ScrollView>
            <BigButton label="Close" onPress={() => setShowText(false)} />
          </View>
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
  mapWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  summaryBox: {
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryText: {
    lineHeight: 24,
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
  metric: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 88,
    justifyContent: 'center',
  },
  notes: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modal: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    fontWeight: '800',
  },
  notesInput: {
    minHeight: 90,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
