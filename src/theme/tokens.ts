/**
 * MD3 design tokens — single source of truth for RunTracker.
 *
 * No raw hex, duration, easing, or spring value may live outside this file.
 * The tonal palettes are generated from the brand seed #32D74B using
 * Material Color Utilities (HCT, SchemeTonalSpot).
 */

// ---------------------------------------------------------------------------
// Color tokens (MD3 roles)
// ---------------------------------------------------------------------------

export interface MD3RoleColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
}

/** Brand seed — the single source color for the tonal palettes. */
export const brandSeed = '#32D74B';

export const lightColors: MD3RoleColors = {
  primary: '#3B6939',
  onPrimary: '#FFFFFF',
  primaryContainer: '#BCF0B4',
  onPrimaryContainer: '#235024',
  secondary: '#52634F',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#D5E8CE',
  onSecondaryContainer: '#3B4B38',
  tertiary: '#38656A',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#BCEBF0',
  onTertiaryContainer: '#1F4D52',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',
  background: '#F7FBF1',
  onBackground: '#191D17',
  surface: '#F7FBF1',
  onSurface: '#191D17',
  surfaceVariant: '#DEE5D8',
  onSurfaceVariant: '#424940',
  outline: '#72796F',
  outlineVariant: '#C2C9BD',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2D322C',
  inverseOnSurface: '#EFF2E9',
  inversePrimary: '#A1D39A',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F1F5EC',
  surfaceContainer: '#ECEFE6',
  surfaceContainerHigh: '#E6E9E0',
  surfaceContainerHighest: '#E0E4DB',
};

export const darkColors: MD3RoleColors = {
  primary: '#A1D39A',
  onPrimary: '#0A390F',
  primaryContainer: '#235024',
  onPrimaryContainer: '#BCF0B4',
  secondary: '#BACCB3',
  onSecondary: '#253423',
  secondaryContainer: '#3B4B38',
  onSecondaryContainer: '#D5E8CE',
  tertiary: '#A0CFD4',
  onTertiary: '#00363B',
  tertiaryContainer: '#1F4D52',
  onTertiaryContainer: '#BCEBF0',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#10140F',
  onBackground: '#E0E4DB',
  surface: '#10140F',
  onSurface: '#E0E4DB',
  surfaceVariant: '#424940',
  onSurfaceVariant: '#C2C9BD',
  outline: '#8C9388',
  outlineVariant: '#424940',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E0E4DB',
  inverseOnSurface: '#2D322C',
  inversePrimary: '#3B6939',
  surfaceContainerLowest: '#0B0F0A',
  surfaceContainerLow: '#191D17',
  surfaceContainer: '#1D211B',
  surfaceContainerHigh: '#272B25',
  surfaceContainerHighest: '#323630',
};

export const highContrastLightColors: MD3RoleColors = {
  primary: '#05340B',
  onPrimary: '#FFFFFF',
  primaryContainer: '#265326',
  onPrimaryContainer: '#FFFFFF',
  secondary: '#21301F',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#3E4D3B',
  onSecondaryContainer: '#FFFFFF',
  tertiary: '#003236',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#215055',
  onTertiaryContainer: '#FFFFFF',
  error: '#600004',
  onError: '#FFFFFF',
  errorContainer: '#98000A',
  onErrorContainer: '#FFFFFF',
  background: '#F7FBF1',
  onBackground: '#191D17',
  surface: '#F7FBF1',
  onSurface: '#000000',
  surfaceVariant: '#DEE5D8',
  onSurfaceVariant: '#000000',
  outline: '#282E26',
  outlineVariant: '#454B42',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2D322C',
  inverseOnSurface: '#FFFFFF',
  inversePrimary: '#A1D39A',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#EFF2E9',
  surfaceContainer: '#E0E4DB',
  surfaceContainerHigh: '#D2D6CD',
  surfaceContainerHighest: '#C4C8BF',
};

export const highContrastDarkColors: MD3RoleColors = {
  primary: '#C9FEC1',
  onPrimary: '#000000',
  primaryContainer: '#9DCF96',
  onPrimaryContainer: '#000F01',
  secondary: '#E3F5DC',
  onSecondary: '#000000',
  secondaryContainer: '#B6C8B0',
  onSecondaryContainer: '#030E03',
  tertiary: '#C9F8FE',
  onTertiary: '#000000',
  tertiaryContainer: '#9DCBD0',
  onTertiaryContainer: '#000E0F',
  error: '#FFECE9',
  onError: '#000000',
  errorContainer: '#FFAEA4',
  onErrorContainer: '#220001',
  background: '#10140F',
  onBackground: '#E0E4DB',
  surface: '#10140F',
  onSurface: '#FFFFFF',
  surfaceVariant: '#424940',
  onSurfaceVariant: '#FFFFFF',
  outline: '#ECF2E6',
  outlineVariant: '#BEC5B9',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E0E4DB',
  inverseOnSurface: '#000000',
  inversePrimary: '#255125',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#1D211B',
  surfaceContainer: '#2D322C',
  surfaceContainerHigh: '#383D36',
  surfaceContainerHighest: '#444841',
};

/** Scrim overlays, press state layers, and map canvas colors (non-MD3 semantic tokens). */
export const overlayTokens = {
  scrimOverlay: 'rgba(0,0,0,0.55)',
  scrimOverlayStrong: 'rgba(0,0,0,0.6)',
  pressOverlay: 'rgba(128,128,128,0.15)',
  onDanger: '#FFFFFF',
  iconFallback: '#FFFFFF',
  mapCanvasLight: '#E8EAED',
  mapCanvasDark: '#14171A',
} as const;

/** Non-MD3 informational status tokens (GPS/pace indicators). */
export const statusColors = {
  success: '#2FBF4F',
  successOnDark: '#30D158',
  warning: '#B26A00',
  warningOnDark: '#FFD60A',
};

// ---------------------------------------------------------------------------
// Typography tokens (MD3 type roles)
// ---------------------------------------------------------------------------

export interface TypeRole {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  letterSpacing: number;
}

const DISPLAY = 'Hanken Grotesk';
const BODY = 'Inter';
const LABEL = 'JetBrains Mono';

export const typeScale: Record<
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'headlineLarge'
  | 'headlineMedium'
  | 'headlineSmall'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall',
  TypeRole
> = {
  displayLarge: { fontFamily: DISPLAY, fontSize: 57, lineHeight: 64, fontWeight: '700', letterSpacing: -0.25 },
  displayMedium: { fontFamily: DISPLAY, fontSize: 45, lineHeight: 52, fontWeight: '700', letterSpacing: 0 },
  displaySmall: { fontFamily: DISPLAY, fontSize: 36, lineHeight: 44, fontWeight: '700', letterSpacing: 0 },
  headlineLarge: { fontFamily: DISPLAY, fontSize: 32, lineHeight: 40, fontWeight: '700', letterSpacing: 0 },
  headlineMedium: { fontFamily: DISPLAY, fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: 0 },
  headlineSmall: { fontFamily: DISPLAY, fontSize: 24, lineHeight: 32, fontWeight: '700', letterSpacing: 0 },
  titleLarge: { fontFamily: DISPLAY, fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0 },
  titleMedium: { fontFamily: DISPLAY, fontSize: 16, lineHeight: 24, fontWeight: '600', letterSpacing: 0.15 },
  titleSmall: { fontFamily: DISPLAY, fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: 0.1 },
  bodyLarge: { fontFamily: BODY, fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0.5 },
  bodyMedium: { fontFamily: BODY, fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0.25 },
  bodySmall: { fontFamily: BODY, fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.4 },
  labelLarge: { fontFamily: LABEL, fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.1 },
  labelMedium: { fontFamily: LABEL, fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.5 },
  labelSmall: { fontFamily: LABEL, fontSize: 11, lineHeight: 16, fontWeight: '500', letterSpacing: 0.5 },
};

// ---------------------------------------------------------------------------
// Shape tokens
// ---------------------------------------------------------------------------

export const shape = {
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  pill: 999,
} as const;

export const radii = {
  ...shape,
  sm: shape.small,
  md: shape.medium,
  lg: shape.large,
  xl: shape.extraLarge,
} as const;

// ---------------------------------------------------------------------------
// Elevation tokens (tonal — MD3 elevation is a surface tint, not just shadow)
// ---------------------------------------------------------------------------

export type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const elevation = {
  level0: { shadowColor: '#000000', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevationAndroid: 0, surfaceTone: 'surfaceContainerLowest' as const },
  level1: { shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevationAndroid: 2, surfaceTone: 'surfaceContainerLow' as const },
  level2: { shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevationAndroid: 4, surfaceTone: 'surfaceContainer' as const },
  level3: { shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevationAndroid: 6, surfaceTone: 'surfaceContainerHigh' as const },
  level4: { shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevationAndroid: 8, surfaceTone: 'surfaceContainerHigh' as const },
  level5: { shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevationAndroid: 10, surfaceTone: 'surfaceContainerHighest' as const },
} as const;

// ---------------------------------------------------------------------------
// Layout tokens
// ---------------------------------------------------------------------------

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ---------------------------------------------------------------------------
// Motion tokens — official MD3 values
// ---------------------------------------------------------------------------

export const Easing = {
  emphasized: { x1: 0.2, y1: 0.0, x2: 0, y2: 1.0 },
  emphasizedDecelerate: { x1: 0.05, y1: 0.7, x2: 0.1, y2: 1.0 },
  emphasizedAccelerate: { x1: 0.3, y1: 0.0, x2: 0.8, y2: 0.15 },
  standard: { x1: 0.2, y1: 0.0, x2: 0, y2: 1.0 },
  standardDecelerate: { x1: 0.0, y1: 0.0, x2: 0.0, y2: 1.0 },
  standardAccelerate: { x1: 0.3, y1: 0.0, x2: 1.0, y2: 1.0 },
} as const;

export type EasingName = keyof typeof Easing;

export const Duration = {
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
  long1: 450,
  long2: 500,
  long3: 550,
  long4: 600,
  extraLong1: 700,
  extraLong2: 800,
  extraLong3: 900,
  extraLong4: 1000,
} as const;

export type DurationName = keyof typeof Duration;

/**
 * M3 Expressive spring presets.
 * dampingRatio = bounciness, stiffness = speed.
 * `toReanimated` converts to Reanimated's absolute damping:
 *   damping = dampingRatio * 2 * sqrt(stiffness * mass)
 */
export const Spring = {
  // Spatial specs (position/size/rotation) — overshoot allowed.
  spatialDefault: { dampingRatio: 0.6, stiffness: 700, mass: 1 },
  spatialFast: { dampingRatio: 0.6, stiffness: 1400, mass: 1 },
  spatialSlow: { dampingRatio: 0.6, stiffness: 350, mass: 1 },
  // Effect specs (color/opacity) — no overshoot.
  effectDefault: { dampingRatio: 1.0, stiffness: 1600, mass: 1 },
  effectFast: { dampingRatio: 1.0, stiffness: 3800, mass: 1 },
  effectSlow: { dampingRatio: 1.0, stiffness: 800, mass: 1 },
  // Standard scheme (less bounce, utilitarian flows).
  spatialStandard: { dampingRatio: 0.9, stiffness: 700, mass: 1 },
} as const;

export type SpringName = keyof typeof Spring;

export interface SpringSpec {
  dampingRatio: number;
  stiffness: number;
  mass: number;
}

export function toReanimatedSpring(spec: SpringSpec) {
  return {
    damping: spec.dampingRatio * 2 * Math.sqrt(spec.stiffness * spec.mass),
    stiffness: spec.stiffness,
    mass: spec.mass,
  };
}

/**
 * Recommended pairing table (MD3 motion): use case → token.
 */
export const motionPairing = {
  smallElementEnterExit: { easing: Easing.standard, duration: Duration.short3, spring: Spring.spatialFast },
  buttonPress: { spring: Spring.spatialFast },
  fabToSheetExpand: { easing: Easing.emphasized, duration: Duration.medium4, spring: Spring.spatialDefault },
  cardToFullScreen: { easing: Easing.emphasized, duration: Duration.long2, spring: Spring.spatialDefault },
  screenContentFade: { easing: Easing.emphasizedDecelerate, duration: Duration.medium2, spring: Spring.effectDefault },
  snackbarSlideIn: { easing: Easing.emphasizedDecelerate, duration: Duration.medium2 },
  navTabSwitch: { easing: Easing.standard, duration: Duration.short4, spring: Spring.spatialFast },
  ambientCarousel: { easing: Easing.emphasized, duration: Duration.extraLong4 },
  shimmerSweep: { easing: 'linear', duration: 1200 },
} as const;

// ---------------------------------------------------------------------------
// Loading tokens (MD3 loading patterns)
// ---------------------------------------------------------------------------

export const loading = {
  /** Indeterminate waits 200ms–5s → M3 Expressive LoadingIndicator. */
  loadingIndicator: {
    size: 48,
    minSize: 24,
    maxSize: 240,
    loopDuration: 1400,
    /** Continuous morph ease (inOut(sin) per MD3). */
    easing: 'inOutSin' as const,
  },
  /** Skeleton shimmer (full-page / list loads). */
  shimmer: {
    sweepAngle: 45,
    duration: 1200,
    /** Continuous sweep, not a transition. */
    easing: 'linear' as const,
    baseColorRole: 'surfaceVariant' as const,
    highlightColorRole: 'surfaceContainerHighest' as const,
    cornerRadius: 12,
  },
  /** Determinate / indeterminate bar (>5s waits). */
  progressBar: {
    height: 4,
  },
} as const;
