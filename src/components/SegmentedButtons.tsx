import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/tokens';
import { AppIcon, AppIconName } from './AppIcon';
import { AnimatedPressable } from './AnimatedPressable';

export interface SegmentedButtonItem<T extends string = string> {
  value: T;
  label: string;
  icon?: AppIconName;
  accessibilityLabel?: string;
}

export interface SegmentedButtonsProps<T extends string = string> {
  value: T;
  onValueChange: (value: T) => void;
  buttons: SegmentedButtonItem<T>[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Material Design 3 Segmented Buttons.
 * Used to select a single option from a set.
 */
export function SegmentedButtons<T extends string = string>({
  value,
  onValueChange,
  buttons,
  style,
}: SegmentedButtonsProps<T>) {
  const { palette } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: palette.outlineVariant,
          backgroundColor: palette.surface,
        },
        style,
      ]}
    >
      {buttons.map((btn, index) => {
        const isSelected = btn.value === value;
        const isFirst = index === 0;
        const isLast = index === buttons.length - 1;

        return (
          <AnimatedPressable
            key={btn.value}
            onPress={() => onValueChange(btn.value)}
            scaleTo={0.96}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={btn.accessibilityLabel ?? btn.label}
            style={[
              styles.button,
              {
                backgroundColor: isSelected
                  ? palette.secondaryContainer
                  : 'transparent',
                borderLeftWidth: isFirst ? 0 : 1,
                borderLeftColor: palette.outlineVariant,
                borderTopLeftRadius: isFirst ? radii.pill : 0,
                borderBottomLeftRadius: isFirst ? radii.pill : 0,
                borderTopRightRadius: isLast ? radii.pill : 0,
                borderBottomRightRadius: isLast ? radii.pill : 0,
              },
            ]}
          >
            <View style={styles.buttonContent}>
              {isSelected ? (
                <AppIcon
                  name="check"
                  size={16}
                  color={palette.onSecondaryContainer}
                />
              ) : btn.icon ? (
                <AppIcon
                  name={btn.icon}
                  size={16}
                  color={palette.onSurfaceVariant}
                />
              ) : null}
              <Text
                variant="labelLarge"
                style={{
                  color: isSelected
                    ? palette.onSecondaryContainer
                    : palette.onSurface,
                  fontWeight: isSelected ? '700' : '500',
                }}
                maxFontSizeMultiplier={1.5}
                numberOfLines={1}
              >
                {btn.label}
              </Text>
            </View>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
