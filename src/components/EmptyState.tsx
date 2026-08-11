import React from 'react';
import { Text } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon } from './AppIcon';
import { spacing } from '../theme/colors';

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: Props) {
  const { palette } = useTheme();

  return (
    <View style={styles.wrap} accessibilityLabel={`${title}. ${subtitle ?? ''}`}>
      <AppIcon name={icon as any} size={48} color={palette.textMuted} />
      <Text variant="titleLarge" style={[styles.title, { color: palette.text }]} maxFontSizeMultiplier={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyMedium" style={[styles.sub, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
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
