import React, { useEffect, useState } from 'react';
import { Text } from 'react-native-paper';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme, useMapTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/colors';import { overlayTokens } from '../theme/tokens';

import { db } from '../db/database';
import { SavedRoute } from '../types';
import { decimalToDMS, formatDistance } from '../lib/geo';
import { MapWebView } from '../components/MapWebView';
import { BigButton } from '../components/BigButton';
import { audio } from '../services/AudioCue';
import { PlanStackParamList } from '../navigation/RootNavigator';

export function RouteDetailScreen() {
  const { palette } = useTheme();
  const mapTheme = useMapTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PlanStackParamList, 'RouteDetail'>>();
  const [saved, setSaved] = useState<SavedRoute | null>(null);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    db.getAllRoutes().then((all) => {
      setSaved(all.find((r) => r.id === route.params.routeId) ?? null);
    });
  }, [route.params.routeId]);

  if (!saved) return null;

  const summary =
    `Route ${saved.name}. ${formatDistance(saved.distance_m)} straight-line distance, ${saved.waypoints.length} waypoints. ` +
    'Straight-line distance only — no time estimate.';

  const waypointText = saved.waypoints
    .map((p, i) => `Point ${i + 1}: ${decimalToDMS(p.lat, p.lng)}`)
    .join('\n');

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <BigButton
          label="Start run with this route"
          icon="directions-run"
          onPress={() => (navigation.getParent() as any)?.navigate('Run', { routeId: saved.id })}
          accessibilityHint="Opens the Run screen with this route shown on the map"
          style={{ width: '100%' }}
        />

        <View style={[styles.summaryBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text variant="labelMedium" style={[styles.summaryTitle, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
            Route summary
          </Text>
          <Text variant="bodyLarge" style={[styles.summaryText, { color: palette.text }]} maxFontSizeMultiplier={2}>
            {summary}
          </Text>
          <View style={styles.actions}>
            <BigButton label="Read summary" icon="volume-up" onPress={() => audio.speak(summary)} style={{ flex: 1 }} />
            <BigButton label="Text list" icon="format-list-bulleted" onPress={() => setShowText(true)} variant="secondary" style={{ flex: 1 }} />
          </View>
        </View>

        <View style={[styles.metric, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>Distance (straight-line)</Text>
          <Text variant="displayMedium" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
            {formatDistance(saved.distance_m)}
          </Text>
          <Text variant="bodyMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
            This is an approximate distance between waypoints. No time estimate is provided.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.mapWrap, { height: 280 + insets.bottom + spacing.sm, borderColor: palette.outlineVariant }]}>
        <MapWebView
          waypoints={saved.waypoints}
          onPressPoint={() => {}}
          theme={mapTheme}
          height={280}
          fitOnMount
        />
      </View>

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
    color: '#fff',
  },
  summaryText: {
    lineHeight: 24,
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  mapWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  metric: {
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: overlayTokens.scrimOverlayStrong,
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
});
