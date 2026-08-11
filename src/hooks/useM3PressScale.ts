import { useCallback } from 'react';
import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { Spring, toReanimatedSpring } from '../theme/tokens';

/**
 * MD3 press feedback: scale to `targetScale` with the M3 Expressive spatial
 * spring (no overshoot disabled — spatialFast), gated by reduce-motion.
 */
export function useM3PressScale(targetScale = 0.96) {
  const { settings } = useTheme();
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    if (settings.reduceMotion) return;
    scale.value = withSpring(targetScale, toReanimatedSpring(Spring.spatialFast));
  }, [settings.reduceMotion, targetScale, scale]);

  const onPressOut = useCallback(() => {
    if (settings.reduceMotion) return;
    scale.value = withSpring(1, toReanimatedSpring(Spring.spatialFast));
  }, [settings.reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}
