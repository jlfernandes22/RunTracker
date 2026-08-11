import React, { useCallback, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native-paper';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useMapTheme } from '../theme/ThemeContext';
import { spacing, radii } from '../theme/colors';
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

      <View style={[styles.panel, { backgroundColor: palette.glass, borderColor: palette.glassBorder, marginBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.statsRow}>
          <View style={{ flex: 1 }}>
            <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
              Tap the map to add waypoints
            </Text>
            <Text variant="displayMedium" style={{ color: palette.text }} maxFontSizeMultiplier={2} numberOfLines={1} adjustsFontSizeToFit>
              {formatDistance(distance())}
            </Text>
            <Text variant="bodyMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
              {waypoints.length} point{waypoints.length === 1 ? '' : 's'} · straight-line only
            </Text>
          </View>
          <View style={styles.pointButtons}>
            <BigButton label="Undo" icon="undo" onPress={undo} variant="secondary" accessibilityLabel="Undo last point" disabled={waypoints.length === 0} />
            <BigButton label="Clear" icon="close" onPress={() => setWaypoints([])} variant="secondary" accessibilityLabel="Clear all points" disabled={waypoints.length === 0} />
          </View>
        </View>

        <View style={styles.actions}>
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
          <BigButton
            label="Save Route"
            onPress={save}
            disabled={waypoints.length < 2}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  panel: {
    marginHorizontal: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pointButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 2,
    backgroundColor: 'transparent',
  },
});
