import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/colors';
import { AppIcon } from './AppIcon';
import { MapWebViewHandle } from './MapWebView';

interface Props {
  mapHandle: React.RefObject<MapWebViewHandle | null>;
  onError?: (message: string) => void;
}

export function LocateButton({ mapHandle, onError }: Props) {
  const { palette } = useTheme();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const onPress = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const result = await mapHandle.current?.locate();
    busyRef.current = false;
    setBusy(false);
    if (result && !result.ok) {
      onError?.(result.message ?? 'Could not get your location');
    }
  }, [mapHandle, onError]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go to my location"
      accessibilityHint="Centers the map on your current position"
      accessibilityState={{ busy }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.glass,
          borderColor: palette.glassBorder,
        },
        pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={palette.primary} />
      ) : (
        <AppIcon name="my-location" size={22} color={palette.text} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.sm,
  },
});
