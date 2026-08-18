import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/tokens';

interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  variant?: 'small' | 'large';
  style?: StyleProp<ViewStyle>;
}

/**
 * Material Design 3 Top App Bar / Screen Header.
 */
export function ScreenHeader({
  title,
  subtitle,
  children,
  variant = 'large',
  style,
}: Props) {
  const { palette } = useTheme();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.titleArea}>
        <Text
          variant={variant === 'large' ? 'headlineSmall' : 'titleLarge'}
          style={[styles.title, { color: palette.onSurface }]}
          maxFontSizeMultiplier={2}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="bodyMedium"
            style={{ color: palette.onSurfaceVariant }}
            maxFontSizeMultiplier={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  titleArea: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
