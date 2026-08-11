import React from 'react';
import { Text } from 'react-native-paper';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/colors';

interface SettingRowProps {
  label: string;
  value: string;
  onPress: () => void;
  hint?: string;
  style?: ViewStyle;
}

export function SettingRow({ label, value, onPress, hint, style }: SettingRowProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        styles.rowShadow,
        { backgroundColor: palette.surface, borderColor: palette.border },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text variant="bodyLarge" style={{ color: palette.text }} maxFontSizeMultiplier={2}>
          {label}
        </Text>
      </View>
      <Text variant="bodyMedium" style={{ color: palette.textMuted, marginRight: spacing.sm }} maxFontSizeMultiplier={2}>
        {value}
      </Text>
      <Text variant="bodyLarge" style={{ color: palette.textMuted }}>›</Text>
    </Pressable>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  hint?: string;
}

export function ToggleRow({ label, value, onValueChange, hint }: ToggleRowProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.row,
        styles.rowShadow,
        { backgroundColor: palette.surface, borderColor: palette.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text variant="bodyLarge" style={[styles.flex, { color: palette.text }]} maxFontSizeMultiplier={2}>
        {label}
      </Text>
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? palette.primary : palette.surfaceVariant,
            borderColor: value ? palette.primary : palette.border,
          },
        ]}
      >
        <View
          style={[
            styles.thumb,
            { backgroundColor: value ? palette.onPrimary : palette.textMuted },
            value && { alignSelf: 'flex-end' },
          ]}
        />
      </View>
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <Text variant="labelMedium" style={{ color: palette.textMuted, fontWeight: '700' }} maxFontSizeMultiplier={2}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  rowShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  flex: {
    flex: 1,
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    borderWidth: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
