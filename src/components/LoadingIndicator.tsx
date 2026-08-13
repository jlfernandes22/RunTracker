/**
 * M3 Expressive LoadingIndicator — 7-shape morph.
 *
 * Loops a continuous morph through 7 Material 3 shapes (circle → rounded
 * square → square → triangle → diamond → bar → circle) over 1400ms with an
 * inOut(sin) ease. All animation runs on the UI thread via Reanimated.
 *
 * Fallbacks (mandatory):
 *  - reduce-motion: static first shape.
 *  - SVG unavailable: Paper ActivityIndicator (see `LoadingIndicator` export).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing as ReEasing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { loading } from '../theme/tokens';

const SEGMENTS = 8;

/**
 * Parametric shape sampler. Each shape returns radius (from center) for a
 * normalized angle t in [0, 1). Superellipse with moving vertices:
 *   s=1 circle, s=2 rounded square, s=3 square, s=4 triangle, s=5 diamond,
 *   s=6 horizontal bar, s=0 circle (loop close).
 */
function radiusAt(s: number, t: number): [number, number] {
  const a = t * 2 * Math.PI;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  if (s === 4) {
    // Triangle: three vertices at 90°, 210°, 330°.
    const sectors = [0.25, 0.75, 0.0];
    const sector = t < 1 / 3 ? sectors[0] : t < 2 / 3 ? sectors[1] : sectors[2];
    const ang = a - sector * 2 * Math.PI;
    const r = 0.5 / (Math.cos(ang) * Math.cos(Math.PI / 3) + 1) * 1.9;
    return [r * Math.cos(a), r * Math.sin(a)];
  }
  if (s === 5) {
    // Diamond: radius varies with |cos|+|sin| (L1 ball).
    const r = 0.46 / (Math.abs(cos) + Math.abs(sin));
    return [r * cos, r * sin];
  }
  if (s === 6) {
    // Horizontal bar: squeeze the y radius.
    return [0.46 * cos, 0.14 * sin];
  }
  // Superellipse: circle (n=2) → square (n=10).
  const n = interpolate(s, [0, 1, 2, 3], [2, 2, 6, 12]);
  const r = 0.46 / Math.pow(Math.pow(Math.abs(cos), n) + Math.pow(Math.abs(sin), n), 1 / n);
  return [r * cos, r * sin];
}

function shapePath(s: number, size: number): string {
  const cx = size / 2;
  const cy = size / 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const [x, y] = radiusAt(s, i / SEGMENTS);
    pts.push([cx + x * size, cy + y * size]);
  }
  return buildPathFromInterp(pts);
}

// Precompute keyframe point arrays for interpolation on the UI thread.
const KEY_POINTS = [1, 2, 3, 4, 5, 6, 1].map((s) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const [x, y] = radiusAt(s, i / SEGMENTS);
    pts.push([x, y]);
  }
  return pts;
});

function buildPathFromInterp(points: [number, number][]): string {
  'worklet';
  const P = points.concat(points.slice(0, 3));
  const d: string[] = [];
  for (let i = 1; i < points.length + 1; i++) {
    const p0 = P[i - 1];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = P[i + 2];
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    if (i === 1) d.push(`M ${p1[0]} ${p1[1]}`);
    d.push(`C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`);
  }
  d.push('Z');
  return d.join(' ');
}

interface Props {
  size?: number;
  /** Color of the indicator (defaults to theme primary). */
  color?: string;
  /** Overlay style: flips colors to primary-on-container when placed over content. */
  overlay?: boolean;
}

/**
 * Primary export: falls back to Paper ActivityIndicator when SVG is not
 * available; static shape when reduce-motion is enabled.
 */
export function LoadingIndicator({ size = 48, color, overlay }: Props) {
  const { palette, settings } = useTheme();
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (settings.reduceMotion) return;
    progress.value = withRepeat(
      withTiming(KEY_POINTS.length - 1, {
        duration: loading.loadingIndicator.loopDuration,
        easing: ReEasing.inOut(ReEasing.sin),
      }),
      -1,
      false,
    );
  }, [progress, settings.reduceMotion]);

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const p = Math.min(progress.value, KEY_POINTS.length - 1.0001);
    const idx = Math.floor(p);
    const frac = p - idx;
    const a = KEY_POINTS[idx];
    const b = KEY_POINTS[Math.min(idx + 1, KEY_POINTS.length - 1)];
    const scale = size * 0.8;
    const cx = size / 2;
    const cy = size / 2;
    const pts: [number, number][] = a.map((_, i) => {
      const av = a[i];
      const bv = b[i];
      const rx = av[0] + (bv[0] - av[0]) * frac;
      const ry = av[1] + (bv[1] - av[1]) * frac;
      return [cx + rx * scale, cy + ry * scale];
    });
    return { d: buildPathFromInterp(pts) };
  });

  const indicatorColor = overlay ? palette.onPrimaryContainer : color ?? palette.primary;

  if (settings.reduceMotion) {
    return (
      <View style={{ width: size, height: size }} accessibilityLabel="Loading">
        <Svg width={size} height={size}>
          <Path d={shapePath(1, size)} fill={indicatorColor} />
        </Svg>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size }} accessibilityLabel="Loading">
      <Svg width={size} height={size}>
        <AnimatedPath animatedProps={animatedProps} fill={indicatorColor} />
      </Svg>
    </View>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Simple fallback for short waits where SVG is unavailable or unwelcome. */
export function PaperSpinner({ size = 24, color }: { size?: number; color?: string }) {
  const { palette } = useTheme();
  return <ActivityIndicator size={size} color={color ?? palette.primary} />;
}

export const loadingStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
