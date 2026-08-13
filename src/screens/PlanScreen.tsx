import React, { useCallback, useState } from 'react';
import { Text } from 'react-native-paper';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/colors';
import { db } from '../db/database';
import { SavedRoute } from '../types';
import { formatDistance } from '../lib/geo';
import { EmptyState } from '../components/EmptyState';
import { ScreenHeader } from '../components/ScreenHeader';
import { BigButton } from '../components/BigButton';
import { useDialog } from '../components/Dialog';
import { useSnackbar } from '../components/Snackbar';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { ListSkeleton } from '../components/Skeleton';
import { PlanStackParamList } from '../navigation/RootNavigator';

export function PlanScreen() {
  const { palette } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
  const dialog = useDialog();
  const snackbar = useSnackbar();
  const [routes, setRoutes] = useState<SavedRoute[] | null>(null);

  const load = useCallback(() => {
    db.getAllRoutes()
      .then(setRoutes)
      .catch((e) => {
        console.warn('failed to load routes', e);
        setRoutes([]);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const removeRoute = useCallback(
    (route: SavedRoute) => {
      dialog.alert({
        title: 'Delete route?',
        message: route.name,
        buttons: [
          { label: 'Cancel', variant: 'ghost' },
          {
            label: 'Delete',
            variant: 'danger',
            onPress: async () => {
              await db.deleteRoute(route.id);
              snackbar.showSnackbar('Route deleted');
              load();
            },
          },
        ],
      });
    },
    [dialog, load, snackbar],
  );


  if (routes === null) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: palette.background }]}>
        <ScreenHeader title="Plan" />
        <View style={{ padding: spacing.lg }}>
          <ListSkeleton rows={4} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: palette.background }]}>
      <ScreenHeader title="Plan">
        <BigButton
          label="New route"
          icon="add"
          onPress={() => navigation.navigate('MapPlanner')}
          variant="secondary"
          accessibilityHint="Open the map to plan a route by tapping waypoints"
        />
      </ScreenHeader>

      <FlatList
        data={routes}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListEmptyComponent={
          <EmptyState
            icon="map"
            title="No planned routes"
            subtitle="Tap “New route” and tap waypoints on the map. Distance is straight-line only."
          />
        }
        renderItem={({ item }) => (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={`Route ${item.name}, ${formatDistance(item.distance_m)} straight-line, ${item.waypoints.length} waypoints`}
            onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
            onLongPress={() => removeRoute(item)}
            style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text variant="titleLarge" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
                {item.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
                {formatDistance(item.distance_m)} (straight-line) · {item.waypoints.length} points
              </Text>
            </View>
            <Text variant="bodyLarge" style={{ color: palette.textMuted }}>›</Text>
          </AnimatedPressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
    minHeight: 80,
  },
});
