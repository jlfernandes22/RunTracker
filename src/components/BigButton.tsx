import React from 'react';
import { Text } from 'react-native-paper';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/colors';
import { AppIcon, AppIconName } from './AppIcon';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'regular' | 'large';
  icon?: AppIconName;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  accessibilityLabel?: string;
}

export function BigButton({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  icon,
  disabled,
  style,
  accessibilityHint,
  accessibilityLabel,
}: Props) {
  const { palette } = useTheme();

  const bg =
    variant === 'primary'
      ? palette.primary
      : variant === 'danger'
        ? palette.danger
        : palette.surfaceVariant;
  const fg =
    variant === 'primary'
      ? palette.onPrimary
      : variant === 'danger'
        ? '#FFFFFF'
        : palette.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'large' && styles.large,
        variant === 'ghost' && styles.ghost,
        { backgroundColor: bg, borderColor: variant === 'ghost' || variant === 'secondary' ? palette.border : 'transparent' },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <View style={styles.inner}>
        {icon ? <AppIcon name={icon} size={20} color={disabled ? palette.textMuted : fg} /> : null}
        <Text
          variant="labelLarge"
          style={[
            { color: fg },
            size === 'large' && { fontWeight: '700' },
            disabled && { color: palette.textMuted },
          ]}
          maxFontSizeMultiplier={2}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    minWidth: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
  },
  large: {
    minHeight: 64,
    minWidth: 64,
    borderRadius: radii.pill,
  },
  ghost: {
    borderWidth: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
