import React from 'react';
import { Text } from 'react-native-paper';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/colors';

interface Props {
  label: string;
  value: string;
  unit?: string;
  emphasis?: boolean;
  style?: ViewStyle;
  glass?: boolean;
}

export function MetricCard({ label, value, unit, emphasis, style, glass }: Props) {
  const { palette, typography } = useTheme();

  const bg = glass ? palette.glass : palette.surface;

  return (
    <View
      accessibilityLabel={`${label}: ${value}${unit ? ' ' + unit : ''}`}
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: glass ? palette.glassBorder : palette.border,
        },
        style,
      ]}
    >
      <Text
        variant="labelMedium" style={{ color: palette.textMuted }}
        maxFontSizeMultiplier={2}
      >
        {label}
      </Text>
      <Text
        style={[
          emphasis ? typography.metricMobile : { ...typography.headline, fontSize: undefined, fontFamily: typography.headline.fontFamily, fontWeight: '600' },
          { color: palette.text },
        ]}
        maxFontSizeMultiplier={2}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
        {unit ? (
          <Text variant="bodyMedium" style={{ color: palette.textMuted }}>
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
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
