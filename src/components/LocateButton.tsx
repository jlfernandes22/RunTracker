import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { createAnimatedComponent } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/colors';
import { AppIcon } from './AppIcon';
import { MapWebViewHandle } from './MapWebView';
import { useM3PressScale } from '../hooks/useM3PressScale';

interface Props {
  mapHandle: React.RefObject<MapWebViewHandle | null>;
  onError?: (message: string) => void;
}

export function LocateButton({ mapHandle, onError }: Props) {
  const { palette } = useTheme();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const { animatedStyle, onPressIn, onPressOut } = useM3PressScale(0.9);
  const AnimatedPressable = useMemo(() => createAnimatedComponent(Pressable), []);

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
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Go to my location"
      accessibilityHint="Centers the map on your current position"
      accessibilityState={{ busy }}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.button,
        {
          backgroundColor: palette.glass,
          borderColor: palette.glassBorder,
        },
        animatedStyle,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={palette.primary} />
      ) : (
        <AppIcon name="my-location" size={22} color={palette.text} />
      )}
    </AnimatedPressable>
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
