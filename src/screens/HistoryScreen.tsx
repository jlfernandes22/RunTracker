import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radii } from '../theme/colors';
import { db } from '../db/database';
import { Run } from '../types';
import {
  currentStreakDays,
  formatDate,
  formatDistance,
  formatDuration,
  formatPace,
  startOfWeek,
  weekDistanceM,
} from '../lib/geo';
import { EmptyState } from '../components/EmptyState';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppIcon } from '../components/AppIcon';
import { ProgressRing } from '../components/ProgressRing';
import { useDialog } from '../components/Dialog';
import { HistoryStackParamList } from '../navigation/RootNavigator';

export function HistoryScreen() {
  const { palette, typography } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
  const dialog = useDialog();
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [weekKm, setWeekKm] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [weekCount, setWeekCount] = useState(0);

  const load = useCallback(() => {
    db.getAllRuns().then((all) => {
      setRuns(all);
      setWeekKm(weekDistanceM(all) / 1000);
      setStreakDays(currentStreakDays(all.map((r) => new Date(r.start_time).getTime())));
      const monday = startOfWeek(new Date()).getTime();
      setWeekCount(all.filter((r) => new Date(r.start_time).getTime() >= monday).length);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmDelete = useCallback(
    (run: Run) => {
      dialog.alert({
        title: 'Delete run?',
        message: `${formatDistance(run.distance_m)} on ${formatDate(run.start_time)}`,
        buttons: [
          { label: 'Cancel', variant: 'ghost' },
          {
            label: 'Delete',
            variant: 'danger',
            onPress: async () => {
              await db.deleteRun(run.id);
              load();
            },
          },
        ],
      });
    },
    [dialog, load],
  );

  if (runs === null) return null;

  const sorted = [...runs].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  const ringProgress = Math.min(1, weekKm / 30);
  const streakProgress = Math.min(1, streakDays / 7);

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: palette.background }]}>
      <ScreenHeader title="History">
        {runs.length > 0 ? (
          <View style={[styles.chip, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <AppIcon name="calendar-today" size={13} color={palette.textMuted} />
            <Text style={[typography.label, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
              {weekCount} this week
            </Text>
          </View>
        ) : null}
      </ScreenHeader>

      <FlatList
        data={sorted}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          runs.length > 0 ? (
            <View style={styles.widgetRow}>
              <View style={[styles.widget, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <ProgressRing progress={ringProgress} color={palette.accent} trackColor={palette.surfaceVariant}>
                  <View style={styles.ringCenter}>
                    <Text style={[typography.headlineMobile, { color: palette.text }]} maxFontSizeMultiplier={2} numberOfLines={1} adjustsFontSizeToFit>
                      {weekKm.toFixed(1)}
                    </Text>
                    <Text style={[typography.label, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
                      km
                    </Text>
                  </View>
                </ProgressRing>
                <Text style={[typography.label, styles.widgetLabel, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
                  Weekly Distance
                </Text>
                <Text style={[typography.bodySmall, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
                  {weekKm >= 30 ? 'Goal reached!' : `${(30 - weekKm).toFixed(1)} km to goal`}
                </Text>
              </View>

              <View style={[styles.widget, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <ProgressRing progress={streakProgress} color={palette.primary} trackColor={palette.surfaceVariant}>
                  <View style={styles.ringCenter}>
                    <AppIcon name="local-fire-department" size={22} color={palette.primary} />
                    <Text style={[typography.headlineMobile, { color: palette.text }]} maxFontSizeMultiplier={2} numberOfLines={1} adjustsFontSizeToFit>
                      {streakDays}
                    </Text>
                    <Text style={[typography.label, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
                      days
                    </Text>
                  </View>
                </ProgressRing>
                <Text style={[typography.label, styles.widgetLabel, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
                  Current Streak
                </Text>
                <Text style={[typography.bodySmall, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
                  {streakDays > 0 ? 'Keep the momentum!' : 'Go for a run today'}
                </Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="directions-run"
            title="No runs yet"
            subtitle="Go for your first run using the Run tab."
          />
        }
        renderItem={({ item, index }) => {
          const prev = sorted[index + 1];
          const moving = item.duration_s - (item.paused_s ?? 0);
          const prevMoving = prev ? prev.duration_s - (prev.paused_s ?? 0) : 0;
          const pace = moving > 0 && item.distance_m > 0 ? moving / (item.distance_m / 1000) : null;
          const prevPace =
            prev && prevMoving > 0 && prev.distance_m > 0 ? prevMoving / (prev.distance_m / 1000) : null;
          const improved = pace != null && prevPace != null && pace < prevPace - 2;
          const isThisWeek = new Date(item.start_time).getTime() >= startOfWeek(new Date()).getTime();

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Run on ${formatDate(item.start_time)}, ${formatDistance(item.distance_m)}, ${formatDuration(item.duration_s)}`}
              onPress={() => navigation.navigate('RunDetail', { runId: item.id })}
              onLongPress={() => confirmDelete(item)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.cardMain}>
                <Text style={[typography.metricMobile, { color: palette.text }]} maxFontSizeMultiplier={2} numberOfLines={1} adjustsFontSizeToFit>
                  {formatDistance(item.distance_m)}
                </Text>
                <Text style={[typography.bodySmall, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
                  {formatDate(item.start_time)} · {formatDuration(item.duration_s)}
                </Text>
                <Text style={[typography.label, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
                  {formatPace(pace)}
                </Text>
              </View>
              <View style={styles.cardSide}>
                {improved ? (
                  <View style={[styles.badge, { backgroundColor: palette.primary }]}>
                    <AppIcon name="trending-up" size={12} color={palette.onPrimary} />
                    <Text style={[typography.label, { color: palette.onPrimary, fontSize: 11 }]} maxFontSizeMultiplier={2}>
                      Pace improved
                    </Text>
                  </View>
                ) : null}
                {isThisWeek ? (
                  <View style={[styles.weekDot, { backgroundColor: palette.primary }]} accessibilityLabel="This week" />
                ) : null}
                <Text style={{ color: palette.textMuted, fontSize: 18 }}>›</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  widgetRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  widget: {
    flex: 1,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  ringCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  widgetLabel: {
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    minHeight: 96,
  },
  cardMain: {
    flex: 1,
    gap: 2,
  },
  cardSide: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
