import React, { useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { createAnimatedComponent } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/colors';
import { AppIcon, AppIconName } from './AppIcon';
import { useM3PressScale } from '../hooks/useM3PressScale';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'regular' | 'large';
  icon?: AppIconName;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  loading?: boolean;
  /** Compact (min-width auto) — for buttons in tight rows. */
  compact?: boolean;
}

/**
 * App button primitive built on Paper's `Button` (MD3 modes):
 * primary → contained, secondary → tonal, danger → contained(error), ghost → text.
 */
export function BigButton({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  icon,
  disabled,
  style,
  accessibilityHint,
  accessibilityLabel,
  loading,
  compact,
}: Props) {
  const { palette } = useTheme();
  const { Button } = require('react-native-paper');
  const AnimatedButton = useMemo(
    () => createAnimatedComponent(Button),
    [Button],
  );
  const { animatedStyle, onPressIn, onPressOut } = useM3PressScale();

  const mode =
    variant === 'primary' || variant === 'danger'
      ? 'contained'
      : variant === 'secondary'
        ? 'contained-tonal'
        : 'text';
  const buttonColor = variant === 'danger' ? palette.error : undefined;
  const textColor = variant === 'danger' ? palette.onError : undefined;
  // Ghost buttons sit over maps and glass panels; give them a subtle
  // container fill so they stay visible (MD3 text-mode is transparent).
  const ghostStyle =
    variant === 'ghost'
      ? { backgroundColor: palette.surfaceContainerHighest, borderColor: palette.outlineVariant }
      : undefined;

  return (
    <AnimatedButton
      mode={mode}
      buttonColor={buttonColor}
      textColor={textColor}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      loading={loading}
      compact={compact}
      icon={icon ? () => <AppIcon name={icon} size={20} color={disabled ? palette.onSurfaceVariant : undefined} /> : undefined}
      contentStyle={[styles.content, compact && styles.contentCompact, size === 'large' && styles.contentLarge]}
      style={[{ borderRadius: radii.pill }, ghostStyle, animatedStyle, style]}
      labelStyle={size === 'large' ? styles.labelLarge : undefined}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
    >
      {label}
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  contentCompact: {
    paddingHorizontal: spacing.md,
  },
  contentLarge: {
    minHeight: 64,
  },
  labelLarge: {
    fontWeight: '700',
  },
});
