import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/colors';
import { AppIcon, AppIconName } from './AppIcon';

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
}: Props) {
  const { palette } = useTheme();
  const { Button } = require('react-native-paper');

  const mode =
    variant === 'primary' ? 'contained' : variant === 'secondary' ? 'tonal' : variant === 'danger' ? 'contained' : 'text';
  const buttonColor = variant === 'danger' ? palette.error : undefined;
  const textColor = variant === 'danger' ? palette.onError : undefined;

  return (
    <Button
      mode={mode}
      buttonColor={buttonColor}
      textColor={textColor}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon ? () => <AppIcon name={icon} size={20} color={disabled ? palette.onSurfaceVariant : undefined} /> : undefined}
      contentStyle={[styles.content, size === 'large' && styles.contentLarge]}
      style={[{ borderRadius: radii.pill }, style]}
      labelStyle={size === 'large' ? styles.labelLarge : undefined}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  contentLarge: {
    minHeight: 64,
  },
  labelLarge: {
    fontWeight: '700',
  },
});
