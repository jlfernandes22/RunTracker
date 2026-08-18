import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { elevation, radii, spacing } from '../theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';

export type CardVariant = 'elevated' | 'filled' | 'outlined';

export interface CardProps {
  children?: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'none';
  disabled?: boolean;
}

/**
 * Material Design 3 Card primitive.
 * Supports:
 * - elevated: surfaceContainerLow tint + level 1 shadow
 * - filled: surfaceContainerHighest fill, no border
 * - outlined: surface fill + 1dp outlineVariant border
 */
export function Card({
  children,
  variant = 'elevated',
  style,
  contentStyle,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  disabled,
}: CardProps) {
  const { palette } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: palette.surfaceContainerLow,
          shadowColor: elevation.level1.shadowColor,
          shadowOpacity: elevation.level1.shadowOpacity,
          shadowRadius: elevation.level1.shadowRadius,
          shadowOffset: elevation.level1.shadowOffset,
          elevation: elevation.level1.elevationAndroid,
        };
      case 'filled':
        return {
          backgroundColor: palette.surfaceContainerHighest,
        };
      case 'outlined':
        return {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          borderWidth: 1,
        };
    }
  };

  const containerStyle = [styles.card, getVariantStyles(), style];

  if (onPress || onLongPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole ?? 'button'}
        style={containerStyle}
      >
        <View style={[styles.content, contentStyle]}>{children}</View>
      </AnimatedPressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={containerStyle}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
  },
});
