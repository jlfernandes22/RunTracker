import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { List, Switch } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/colors';

interface SettingRowProps {
  label: string;
  value: string;
  onPress: () => void;
  hint?: string;
  style?: ViewStyle;
}

export function SettingRow({ label, onPress, hint, style }: SettingRowProps) {
  const { palette } = useTheme();
  return (
    <List.Item
      title={label}
      description={hint}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityHint={hint}
      titleStyle={{ color: palette.text }}
      descriptionStyle={{ color: palette.onSurfaceVariant }}
      right={() => (
        <View style={styles.rowRight}>
          <List.Icon icon="chevron-right" color={palette.onSurfaceVariant} />
        </View>
      )}
      style={[
        styles.row,
        { backgroundColor: palette.surface, borderColor: palette.outlineVariant, borderRadius: radii.md },
        style,
      ]}
    />
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
    <List.Item
      title={label}
      description={hint}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      titleStyle={{ color: palette.text }}
      descriptionStyle={{ color: palette.onSurfaceVariant }}
      right={() => (
        <Switch
          value={value}
          onValueChange={onValueChange}
          color={palette.primary}
          accessibilityLabel={`Toggle ${label}`}
        />
      )}
      style={[
        styles.row,
        { backgroundColor: palette.surface, borderColor: palette.outlineVariant, borderRadius: radii.md },
      ]}
    />
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <List.Subheader style={[styles.section, { color: palette.onSurfaceVariant }]}>{children}</List.Subheader>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  rowRight: {
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg - 8,
    fontWeight: '700',
  },
});
