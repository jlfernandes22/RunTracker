/**
 * Skeleton shimmer for full-page / list loads (MD3 loading pattern).
 *
 * - Gradient sweep at 45° (upper-left → lower-right), linear ease, 1200ms loop.
 * - Colors: base = surfaceVariant, highlight = surfaceContainerHighest.
 * - Shape fidelity: callers match the final content's layout exactly
 *   (zero layout shift on reveal).
 * - All shimmers on a screen share a single Reanimated clock (`ShimmerClock`).
 * - reduce-motion: static surfaceVariant blocks.
 */
import React, { createContext, useContext } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { Shimmer } from 'react-native-fast-shimmer';
import { useTheme } from '../theme/ThemeContext';
import { loading } from '../theme/tokens';

// Single shared clock per screen subtree (all shimmers sweep in sync).
export const ShimmerClock = createContext<number>(0);

export function useShimmerClock(): number {
  return useContext(ShimmerClock);
}

export interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
}

const noStyle: ViewStyle = {};

/** A single shimmering placeholder block. */
export function Skeleton({ width = '100%', height, radius = 12, style }: SkeletonProps) {
  const { palette, settings } = useTheme();
  const base = palette.surfaceVariant;
  const highlight = palette.surfaceContainerHighest;

  if (settings.reduceMotion) {
    return (
      <View
        style={[
          { width, height, borderRadius: radius, backgroundColor: base },
          style,
        ]}
      />
    );
  }

  return (
    <Shimmer
      style={[{ width, height, borderRadius: radius, backgroundColor: base }, style ?? noStyle]}
      linearGradients={[base, highlight, base]}
      gradientStart={{ x: 0, y: 0 }}
      gradientEnd={{ x: 1, y: 1 }}
      easing={Easing.linear}
      speed={loading.shimmer.duration}
    />
  );
}

/** List skeleton: rows of skeleton cards matching the app's run/route cards. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  const { spacing } = require('../theme/colors');
  const S = () => (
    <View style={styles.skeletonCard}>
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="40%" height={22} />
        <Skeleton width="70%" height={14} />
        <Skeleton width="30%" height={12} />
      </View>
      <Skeleton width={28} height={28} radius={14} />
    </View>
  );
  void spacing;
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }, (_, i) => (
        <S key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    minHeight: 96,
  },
});
