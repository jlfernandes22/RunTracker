import React, { useCallback, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native-paper';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useMapTheme } from '../theme/ThemeContext';
import { spacing, radii, elevation } from '../theme/tokens';
import { db } from '../db/database';
import { GeoPoint, SavedRoute } from '../types';
import { formatDistance, haversine, uuid } from '../lib/geo';
import { MapWebView, MapWebViewHandle } from '../components/MapWebView';
import { BigButton } from '../components/BigButton';
import { LocateButton } from '../components/LocateButton';
import { useDialog } from '../components/Dialog';
import { audio } from '../services/AudioCue';

export function MapPlannerScreen() {
  const { palette } = useTheme();
  const mapTheme = useMapTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();
  const mapHandle = useRef<MapWebViewHandle>(null);
  const [waypoints, setWaypoints] = useState<GeoPoint[]>([]);
  const [name, setName] = useState('');

  const distance = useCallback(() => {
    let total = 0;
    for (let i = 1; i < waypoints.length; i++) {
      total += haversine(waypoints[i - 1], waypoints[i]);
    }
    return total;
  }, [waypoints]);

  const addPoint = useCallback((lat: number, lng: number) => {
    audio.cue('notify');
    setWaypoints((prev) => [...prev, { lat, lng, alt: null, accuracy: null, ts: Date.now() }]);
  }, []);

  const undo = useCallback(() => {
    setWaypoints((prev) => prev.slice(0, -1));
  }, []);

  const save = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      dialog.alert({ title: 'Name required', message: 'Give your route a name.', buttons: [{ label: 'OK' }] });
      return;
    }
    if (waypoints.length < 2) {
      dialog.alert({ title: 'Not enough points', message: 'Tap the map to add at least 2 waypoints.', buttons: [{ label: 'OK' }] });
      return;
    }
    const route: SavedRoute = {
      id: uuid(),
      name: trimmed,
      waypoints,
      distance_m: Math.round(distance()),
      created_at: new Date().toISOString(),
    };
    await db.insertRoute(route);
    audio.cue('start');
    navigation.goBack();
  }, [name, waypoints, distance, navigation, dialog]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1 }}>
        <View style={StyleSheet.absoluteFill}>
          <MapWebView
            ref={mapHandle}
            waypoints={waypoints}
            onPressPoint={addPoint}
            mode="plan"
            theme={mapTheme}
          />
        </View>
        <View style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg }}>
          <LocateButton
            mapHandle={mapHandle}
            onError={(msg) => dialog.alert({ title: 'Location', message: msg, buttons: [{ label: 'OK' }] })}
          />
        </View>
      </View>

      <View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: palette.surfaceContainerLow,
            borderTopColor: palette.outlineVariant,
            paddingBottom: insets.bottom + spacing.md,
            shadowColor: elevation.level2.shadowColor,
            shadowOpacity: elevation.level2.shadowOpacity,
            shadowRadius: elevation.level2.shadowRadius,
            shadowOffset: elevation.level2.shadowOffset,
            elevation: elevation.level2.elevationAndroid,
          },
        ]}
      >
        <View style={styles.dragHandleWrap}>
          <View style={[styles.dragHandle, { backgroundColor: palette.outlineVariant }]} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsText}>
            <Text variant="labelSmall" style={{ color: palette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 }} maxFontSizeMultiplier={2}>
              Tap the map to add waypoints
            </Text>
            <Text variant="displayMedium" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2} numberOfLines={1} adjustsFontSizeToFit>
              {formatDistance(distance())}
            </Text>
            <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
              {waypoints.length} point{waypoints.length === 1 ? '' : 's'} · straight-line only
            </Text>
          </View>
          <View style={styles.pointButtons}>
            <BigButton label="Undo" icon="undo" onPress={undo} variant="secondary" compact accessibilityLabel="Undo last point" disabled={waypoints.length === 0} />
            <BigButton label="Clear" icon="close" onPress={() => setWaypoints([])} variant="secondary" compact accessibilityLabel="Clear all points" disabled={waypoints.length === 0} />
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.inputWrap}>
            <TextInput
              accessibilityLabel="Route name"
              label="Route name"
              placeholder="e.g. Morning 5k"
              value={name}
              onChangeText={setName}
              mode="outlined"
              outlineColor={palette.outlineVariant}
              activeOutlineColor={palette.primary}
              style={styles.input}
            />
          </View>
          <View style={styles.buttonWrap}>
            <BigButton
              label="Save"
              compact
              icon="check"
              onPress={save}
              disabled={waypoints.length < 2}
              style={{ minWidth: 90 }}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bottomSheet: {
    borderTopLeftRadius: radii.extraLarge,
    borderTopRightRadius: radii.extraLarge,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statsText: {
    flex: 3,
    minWidth: 0,
    flexShrink: 1,
    gap: 2,
  },
  pointButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexShrink: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'transparent',
  },
  inputWrap: {
    flex: 2,
  },
  buttonWrap: {
    flex: 1,
  },
});
