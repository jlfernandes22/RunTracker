import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon } from './AppIcon';
import { spacing } from '../theme/colors';

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: Props) {
  const { palette, typography } = useTheme();

  return (
    <View style={styles.wrap} accessibilityLabel={`${title}. ${subtitle ?? ''}`}>
      <AppIcon name={icon as any} size={48} color={palette.textMuted} />
      <Text style={[typography.headlineMobile, styles.title, { color: palette.text }]} maxFontSizeMultiplier={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[typography.bodySmall, styles.sub, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    padding: spacing.xl * 2,
    gap: spacing.md,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
  },
});
