import React, { useCallback, useMemo, useState } from 'react';
import { Chip, Text } from 'react-native-paper';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radii } from '../theme/tokens';
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
import { useSnackbar } from '../components/Snackbar';
import { Card } from '../components/Card';
import { ListSkeleton } from '../components/Skeleton';
import { HistoryStackParamList } from '../navigation/RootNavigator';

interface RunCardItemProps {
  item: Run;
  improved: boolean;
  isThisWeek: boolean;
  pace: number | null;
  palette: any;
  onPress: () => void;
  onLongPress: () => void;
}

const RunCardItem = React.memo(function RunCardItem({
  item,
  improved,
  isThisWeek,
  pace,
  palette,
  onPress,
  onLongPress,
}: RunCardItemProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Card
        variant="elevated"
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityLabel={`Run on ${formatDate(item.start_time)}, ${formatDistance(item.distance_m)}, ${formatDuration(item.duration_s)}`}
        contentStyle={styles.cardContent}
      >
        <View style={styles.cardMain}>
          <Text variant="headlineMedium" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2} numberOfLines={1} adjustsFontSizeToFit>
            {formatDistance(item.distance_m)}
          </Text>
          <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
            {formatDate(item.start_time)} · {formatDuration(item.duration_s)}
          </Text>
          <Text variant="labelMedium" style={{ color: palette.primary, fontWeight: '600' }} maxFontSizeMultiplier={2}>
            {formatPace(pace)}
          </Text>
        </View>
        <View style={styles.cardSide}>
          {improved ? (
            <View style={[styles.badge, { backgroundColor: palette.primaryContainer }]}>
              <AppIcon name="trending-up" size={13} color={palette.onPrimaryContainer} />
              <Text variant="labelSmall" style={{ color: palette.onPrimaryContainer, fontWeight: '700' }} maxFontSizeMultiplier={2}>
                Pace improved
              </Text>
            </View>
          ) : null}
          {isThisWeek ? (
            <View style={[styles.weekDot, { backgroundColor: palette.primary }]} accessibilityLabel="This week" />
          ) : null}
          <AppIcon name="navigate-next" size={24} color={palette.onSurfaceVariant} />
        </View>
      </Card>
    </Animated.View>
  );
});

export function HistoryScreen() {
  const { palette } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
  const dialog = useDialog();
  const snackbar = useSnackbar();
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [weekKm, setWeekKm] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [month, setMonth] = useState<string>('all');

  const load = useCallback(() => {
    db.getAllRuns()
      .then((all) => {
        setRuns(all);
        setWeekKm(weekDistanceM(all) / 1000);
        setStreakDays(currentStreakDays(all.map((r) => Date.parse(r.start_time))));
        const monday = startOfWeek(new Date()).getTime();
        setWeekCount(all.filter((r) => Date.parse(r.start_time) >= monday).length);
      })
      .catch((e) => {
        console.warn('failed to load runs', e);
        setRuns([]);
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
              snackbar.showSnackbar('Run deleted');
              load();
            },
          },
        ],
      });
    },
    [dialog, load, snackbar],
  );

  const sorted = useMemo(() => {
    if (!runs) return [];
    return [...runs].sort((a, b) => Date.parse(b.start_time) - Date.parse(a.start_time));
  }, [runs]);

  const months = useMemo(() => {
    return Array.from(
      new Set(
        sorted.map((r) => {
          const d = new Date(r.start_time);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }),
      ),
    );
  }, [sorted]);

  const monthLabel = useCallback((m: string) => {
    const [y, mo] = m.split('-');
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const filtered = useMemo(() => {
    if (month === 'all') return sorted;
    return sorted.filter((r) => {
      const d = new Date(r.start_time);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === month;
    });
  }, [sorted, month]);

  const mondayTs = useMemo(() => startOfWeek(new Date()).getTime(), []);
  const ringProgress = Math.min(1, weekKm / 30);
  const streakProgress = Math.min(1, streakDays / 7);

  const renderRunItem = useCallback(
    ({ item, index }: { item: Run; index: number }) => {
      const prev = sorted[index + 1];
      const moving = item.duration_s - (item.paused_s ?? 0);
      const prevMoving = prev ? prev.duration_s - (prev.paused_s ?? 0) : 0;
      const pace = moving > 0 && item.distance_m > 0 ? moving / (item.distance_m / 1000) : null;
      const prevPace =
        prev && prevMoving > 0 && prev.distance_m > 0 ? prevMoving / (prev.distance_m / 1000) : null;
      const improved = pace != null && prevPace != null && pace < prevPace - 2;
      const isThisWeek = Date.parse(item.start_time) >= mondayTs;

      return (
        <RunCardItem
          item={item}
          improved={improved}
          isThisWeek={isThisWeek}
          pace={pace}
          palette={palette}
          onPress={() => navigation.navigate('RunDetail', { runId: item.id })}
          onLongPress={() => confirmDelete(item)}
        />
      );
    },
    [sorted, mondayTs, palette, navigation, confirmDelete],
  );

  if (runs === null) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: palette.background }]}>
        <ScreenHeader title="History" />
        <View style={styles.listContent}>
          <ListSkeleton rows={6} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: palette.background }]}>
      <ScreenHeader title="History">
        {runs.length > 0 ? (
          <View style={[styles.chip, { backgroundColor: palette.surfaceContainerHigh }]}>
            <AppIcon name="calendar-today" size={14} color={palette.primary} />
            <Text variant="labelMedium" style={{ color: palette.onSurfaceVariant, fontWeight: '600' }} maxFontSizeMultiplier={2}>
              {weekCount} this week
            </Text>
          </View>
        ) : null}
      </ScreenHeader>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={8}
        updateCellsBatchingPeriod={50}
        ListHeaderComponent={
          runs.length > 0 ? (
            <>
              <View style={styles.widgetRow}>
                <Card variant="elevated" style={styles.widget} contentStyle={styles.widgetContent}>
                  <ProgressRing progress={ringProgress} color={palette.primary} trackColor={palette.surfaceContainerHighest}>
                    <View style={styles.ringCenter}>
                      <Text variant="titleLarge" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2} numberOfLines={1} adjustsFontSizeToFit>
                        {weekKm.toFixed(1)}
                      </Text>
                      <Text variant="labelSmall" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
                        km
                      </Text>
                    </View>
                  </ProgressRing>
                  <Text variant="labelMedium" style={[styles.widgetLabel, { color: palette.onSurface }]} maxFontSizeMultiplier={2}>
                    Weekly Distance
                  </Text>
                  <Text variant="bodySmall" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
                    {weekKm >= 30 ? 'Goal reached!' : `${(30 - weekKm).toFixed(1)} km to goal`}
                  </Text>
                </Card>

                <Card variant="elevated" style={styles.widget} contentStyle={styles.widgetContent}>
                  <ProgressRing progress={streakProgress} color={palette.tertiary} trackColor={palette.surfaceContainerHighest}>
                    <View style={styles.ringCenter}>
                      <AppIcon name="local-fire-department" size={20} color={palette.tertiary} />
                      <Text variant="titleLarge" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2} numberOfLines={1} adjustsFontSizeToFit>
                        {streakDays}
                      </Text>
                      <Text variant="labelSmall" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
                        days
                      </Text>
                    </View>
                  </ProgressRing>
                  <Text variant="labelMedium" style={[styles.widgetLabel, { color: palette.onSurface }]} maxFontSizeMultiplier={2}>
                    Current Streak
                  </Text>
                  <Text variant="bodySmall" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
                    {streakDays > 0 ? 'Keep it up!' : 'Run today'}
                  </Text>
                </Card>
              </View>

              <View style={styles.monthRow}>
                <Chip
                  selected={month === 'all'}
                  onPress={() => setMonth('all')}
                  icon={month === 'all' ? () => <AppIcon name="check" size={16} color={palette.onSecondaryContainer} /> : undefined}
                  style={[
                    styles.filterChip,
                    month === 'all' && { backgroundColor: palette.secondaryContainer },
                  ]}
                  textStyle={{
                    color: month === 'all' ? palette.onSecondaryContainer : palette.onSurfaceVariant,
                    fontWeight: month === 'all' ? '700' : '500',
                  }}
                >
                  All
                </Chip>
                {months.map((m) => {
                  const isSelected = month === m;
                  return (
                    <Chip
                      key={m}
                      selected={isSelected}
                      onPress={() => setMonth(m)}
                      icon={isSelected ? () => <AppIcon name="check" size={16} color={palette.onSecondaryContainer} /> : undefined}
                      style={[
                        styles.filterChip,
                        isSelected && { backgroundColor: palette.secondaryContainer },
                      ]}
                      textStyle={{
                        color: isSelected ? palette.onSecondaryContainer : palette.onSurfaceVariant,
                        fontWeight: isSelected ? '700' : '500',
                      }}
                    >
                      {monthLabel(m)}
                    </Chip>
                  );
                })}
              </View>
            </>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="directions-run"
            title="No runs yet"
            subtitle="Record your first run from the Run tab. Distance, pace, and splits will show up here."
            iconSize={56}
          />
        }
        renderItem={renderRunItem}
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
  },
  widgetRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  widget: {
    flex: 1,
    borderRadius: radii.large,
  },
  widgetContent: {
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.xs,
  },
  ringCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetLabel: {
    marginTop: spacing.xs,
    fontWeight: '700',
  },
  monthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    borderRadius: radii.small,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: 96,
  },
  cardMain: {
    flex: 1,
    gap: 4,
  },
  cardSide: {
    alignItems: 'flex-end',
    justifyContent: 'center',
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
