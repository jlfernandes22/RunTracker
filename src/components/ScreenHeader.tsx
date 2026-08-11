import React from 'react';
import { Text } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/colors';

interface Props {
  title: string;
  children: React.ReactNode;
}

export function ScreenHeader({ title, children }: Props) {
  const { palette } = useTheme();
  return (
    <View style={styles.header}>
      <Text
        variant="headlineSmall" style={{ color: palette.text, flex: 1 }}
        maxFontSizeMultiplier={2}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
});
