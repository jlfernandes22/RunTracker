import React from 'react';
import { Text } from 'react-native-paper';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing, elevation } from '../theme/tokens';

interface Props {
  label: string;
  value: string;
  unit?: string;
  emphasis?: boolean;
  style?: StyleProp<ViewStyle>;
  glass?: boolean;
}

/**
 * Material Design 3 Metric Card.
 * Displays key statistical metrics with clear typographic hierarchy.
 */
export function MetricCard({ label, value, unit, emphasis, style, glass }: Props) {
  const { palette, typography } = useTheme();

  const bg = glass ? palette.glass : palette.surfaceContainerLow;
  const borderColor = glass ? palette.glassBorder : palette.outlineVariant;

  return (
    <View
      accessibilityLabel={`${label}: ${value}${unit ? ' ' + unit : ''}`}
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: 1,
          shadowColor: glass ? 'transparent' : elevation.level1.shadowColor,
          shadowOpacity: glass ? 0 : elevation.level1.shadowOpacity,
          shadowRadius: glass ? 0 : elevation.level1.shadowRadius,
          shadowOffset: glass ? { width: 0, height: 0 } : elevation.level1.shadowOffset,
          elevation: glass ? 0 : elevation.level1.elevationAndroid,
        },
        style,
      ]}
    >
      <Text
        variant="labelMedium"
        style={{ color: palette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 }}
        maxFontSizeMultiplier={2}
      >
        {label}
      </Text>
      <Text
        variant={emphasis ? 'displaySmall' : 'headlineSmall'}
        style={[
          { color: palette.onSurface, fontWeight: '700' },
        ]}
        maxFontSizeMultiplier={2}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
        {unit ? (
          <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant, fontWeight: '400' }}>
            {' '}{unit}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
    borderRadius: radii.large,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
