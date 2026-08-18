import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { List, Switch, Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/tokens';
import { AppIcon, AppIconName } from './AppIcon';
import { Card } from './Card';

export interface SettingsGroupProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * MD3 Settings Group Container (Card with rounded corners).
 */
export function SettingsGroup({ children, style }: SettingsGroupProps) {
  return (
    <Card variant="outlined" style={[styles.groupCard, style]} contentStyle={styles.groupContent}>
      {children}
    </Card>
  );
}

interface SettingRowProps {
  label: string;
  value?: string;
  onPress: () => void;
  hint?: string;
  icon?: AppIconName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function SettingRow({
  label,
  value,
  onPress,
  hint,
  icon,
  style,
  disabled,
}: SettingRowProps) {
  const { palette } = useTheme();
  return (
    <List.Item
      title={label}
      description={hint}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      titleStyle={{ color: palette.onSurface, fontWeight: '600' }}
      descriptionStyle={{ color: palette.onSurfaceVariant }}
      left={
        icon
          ? (props) => (
              <View style={styles.iconWrap}>
                <AppIcon name={icon} size={22} color={palette.onSurfaceVariant} />
              </View>
            )
          : undefined
      }
      right={() => (
        <View style={styles.rowRight}>
          {value ? (
            <Text variant="bodyLarge" style={{ color: palette.onSurfaceVariant }}>
              {value}
            </Text>
          ) : null}
          <AppIcon name="navigate-next" size={22} color={palette.onSurfaceVariant} />
        </View>
      )}
      style={[styles.row, style]}
    />
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  hint?: string;
  icon?: AppIconName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function ToggleRow({
  label,
  value,
  onValueChange,
  hint,
  icon,
  style,
  disabled,
}: ToggleRowProps) {
  const { palette } = useTheme();
  return (
    <List.Item
      title={label}
      description={hint}
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      titleStyle={{ color: palette.onSurface, fontWeight: '600' }}
      descriptionStyle={{ color: palette.onSurfaceVariant }}
      left={
        icon
          ? () => (
              <View style={styles.iconWrap}>
                <AppIcon name={icon} size={22} color={palette.onSurfaceVariant} />
              </View>
            )
          : undefined
      }
      right={() => (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          color={palette.primary}
          accessibilityLabel={`Toggle ${label}`}
        />
      )}
      style={[styles.row, style]}
    />
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <Text
      variant="labelLarge"
      style={[styles.section, { color: palette.primary }]}
      maxFontSizeMultiplier={1.5}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    borderRadius: radii.large,
    overflow: 'hidden',
  },
  groupContent: {
    padding: 0,
  },
  row: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
