import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { elevation, radii, spacing } from '../theme/tokens';
import { AppIcon, AppIconName } from './AppIcon';
import { AnimatedPressable } from './AnimatedPressable';

export type FABVariant = 'primary' | 'secondary' | 'tertiary' | 'surface';
export type FABSize = 'small' | 'standard' | 'large';

export interface FABProps {
  icon: AppIconName;
  onPress: () => void;
  variant?: FABVariant;
  size?: FABSize;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  accessibilityHint?: string;
  disabled?: boolean;
}

export interface ExtendedFABProps {
  icon?: AppIconName;
  label: string;
  onPress: () => void;
  variant?: FABVariant;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
}

/**
 * Standard Material Design 3 FAB (Floating Action Button).
 */
export function FAB({
  icon,
  onPress,
  variant = 'primary',
  size = 'standard',
  style,
  accessibilityLabel,
  accessibilityHint,
  disabled,
}: FABProps) {
  const { palette } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: palette.primaryContainer, fg: palette.onPrimaryContainer };
      case 'secondary':
        return { bg: palette.secondaryContainer, fg: palette.onSecondaryContainer };
      case 'tertiary':
        return { bg: palette.tertiaryContainer, fg: palette.onTertiaryContainer };
      case 'surface':
        return { bg: palette.surfaceContainerHigh, fg: palette.primary };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, borderRadius: radii.md, iconSize: 20 };
      case 'large':
        return { width: 96, height: 96, borderRadius: radii.xl, iconSize: 36 };
      case 'standard':
      default:
        return { width: 56, height: 56, borderRadius: radii.lg, iconSize: 24 };
    }
  };

  const colors = getColors();
  const dim = getSizeStyles();

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[
        styles.fab,
        {
          width: dim.width,
          height: dim.height,
          borderRadius: dim.borderRadius,
          backgroundColor: disabled ? palette.surfaceVariant : colors.bg,
          shadowColor: elevation.level3.shadowColor,
          shadowOpacity: elevation.level3.shadowOpacity,
          shadowRadius: elevation.level3.shadowRadius,
          shadowOffset: elevation.level3.shadowOffset,
          elevation: elevation.level3.elevationAndroid,
        },
        style,
      ]}
    >
      <AppIcon
        name={icon}
        size={dim.iconSize}
        color={disabled ? palette.onSurfaceVariant : colors.fg}
      />
    </AnimatedPressable>
  );
}

/**
 * Material Design 3 Extended FAB (Icon + Label).
 */
export function ExtendedFAB({
  icon,
  label,
  onPress,
  variant = 'primary',
  style,
  accessibilityLabel,
  accessibilityHint,
  disabled,
}: ExtendedFABProps) {
  const { palette } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: palette.primaryContainer, fg: palette.onPrimaryContainer };
      case 'secondary':
        return { bg: palette.secondaryContainer, fg: palette.onSecondaryContainer };
      case 'tertiary':
        return { bg: palette.tertiaryContainer, fg: palette.onTertiaryContainer };
      case 'surface':
        return { bg: palette.surfaceContainerHigh, fg: palette.primary };
    }
  };

  const colors = getColors();

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      style={[
        styles.extendedFab,
        {
          backgroundColor: disabled ? palette.surfaceVariant : colors.bg,
          shadowColor: elevation.level3.shadowColor,
          shadowOpacity: elevation.level3.shadowOpacity,
          shadowRadius: elevation.level3.shadowRadius,
          shadowOffset: elevation.level3.shadowOffset,
          elevation: elevation.level3.elevationAndroid,
        },
        style,
      ]}
    >
      <View style={styles.extendedContent}>
        {icon ? (
          <AppIcon
            name={icon}
            size={20}
            color={disabled ? palette.onSurfaceVariant : colors.fg}
          />
        ) : null}
        <Text
          variant="labelLarge"
          style={{
            color: disabled ? palette.onSurfaceVariant : colors.fg,
            fontWeight: '700',
          }}
          maxFontSizeMultiplier={2}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  extendedFab: {
    minHeight: 56,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extendedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
