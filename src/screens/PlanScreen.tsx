import React, { useCallback, useState } from 'react';
import { Text } from 'react-native-paper';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/tokens';
import { db } from '../db/database';
import { SavedRoute } from '../types';
import { formatDistance } from '../lib/geo';
import { EmptyState } from '../components/EmptyState';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { ExtendedFAB } from '../components/FAB';
import { AppIcon } from '../components/AppIcon';
import { useDialog } from '../components/Dialog';
import { useSnackbar } from '../components/Snackbar';
import { ListSkeleton } from '../components/Skeleton';
import { PlanStackParamList } from '../navigation/RootNavigator';

interface RouteCardItemProps {
  item: SavedRoute;
  palette: any;
  onPress: () => void;
  onLongPress: () => void;
}

const RouteCardItem = React.memo(function RouteCardItem({
  item,
  palette,
  onPress,
  onLongPress,
}: RouteCardItemProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Card
        variant="elevated"
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityLabel={`Route ${item.name}, ${formatDistance(item.distance_m)} straight-line, ${item.waypoints.length} waypoints`}
        contentStyle={styles.cardContent}
      >
        <View style={styles.cardInfo}>
          <Text variant="titleMedium" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2}>
            {item.name}
          </Text>
          <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
            {formatDistance(item.distance_m)} (straight-line) · {item.waypoints.length} points
          </Text>
        </View>
        <AppIcon name="navigate-next" size={24} color={palette.onSurfaceVariant} />
      </Card>
    </Animated.View>
  );
});

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

  const renderRouteItem = useCallback(
    ({ item }: { item: SavedRoute }) => (
      <RouteCardItem
        item={item}
        palette={palette}
        onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
        onLongPress={() => removeRoute(item)}
      />
    ),
    [palette, navigation, removeRoute],
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
      <ScreenHeader title="Plan" />

      <FlatList
        data={routes}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={8}
        updateCellsBatchingPeriod={50}
        ListEmptyComponent={
          <EmptyState
            icon="map"
            title="No planned routes"
            subtitle="Tap “New route” and tap waypoints on the map. Distance is straight-line only."
          />
        }
        renderItem={renderRouteItem}
      />

      <View style={styles.fabContainer}>
        <ExtendedFAB
          label="New route"
          icon="add"
          onPress={() => navigation.navigate('MapPlanner')}
          variant="primary"
          accessibilityLabel="Plan a new route"
          accessibilityHint="Opens map to create waypoints"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 96,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    minHeight: 80,
  },
  cardInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
