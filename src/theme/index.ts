/**
 * Paper (MD3) theme builders — derive themes exclusively from src/theme/tokens.ts.
 */
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import {
  darkColors,
  highContrastDarkColors,
  highContrastLightColors,
  lightColors,
  typeScale,
  shape,
  elevation,
  MD3RoleColors,
} from './tokens';

type MD3Fonts = MD3Theme['fonts'];

const fonts: MD3Fonts = {
  // Paper requires a `default` font (family/weight/letter-spacing only).
  default: {
    fontFamily: typeScale.bodyLarge.fontFamily,
    fontWeight: typeScale.bodyLarge.fontWeight,
    letterSpacing: typeScale.bodyLarge.letterSpacing,
  },
  displayLarge: typeScale.displayLarge,
  displayMedium: typeScale.displayMedium,
  displaySmall: typeScale.displaySmall,
  headlineLarge: typeScale.headlineLarge,
  headlineMedium: typeScale.headlineMedium,
  headlineSmall: typeScale.headlineSmall,
  titleLarge: typeScale.titleLarge,
  titleMedium: typeScale.titleMedium,
  titleSmall: typeScale.titleSmall,
  bodyLarge: typeScale.bodyLarge,
  bodyMedium: typeScale.bodyMedium,
  bodySmall: typeScale.bodySmall,
  labelLarge: typeScale.labelLarge,
  labelMedium: typeScale.labelMedium,
  labelSmall: typeScale.labelSmall,
};

function buildTheme(dark: boolean, colors: MD3RoleColors): MD3Theme {
  const base = dark ? MD3DarkTheme : MD3LightTheme;
  const containerTones = {
    surfaceContainerLowest: colors.surfaceContainerLowest,
    surfaceContainerLow: colors.surfaceContainerLow,
    surfaceContainer: colors.surfaceContainer,
    surfaceContainerHigh: colors.surfaceContainerHigh,
    surfaceContainerHighest: colors.surfaceContainerHighest,
  };
  // Paper 5.15's MD3Colors type predates surfaceContainer* roles; the spread
  // below carries them through for our own Surface/elevation usage.
  const colorOverrides = {
    ...base.colors,
    primary: colors.primary,
      onPrimary: colors.onPrimary,
      primaryContainer: colors.primaryContainer,
      onPrimaryContainer: colors.onPrimaryContainer,
      secondary: colors.secondary,
      onSecondary: colors.onSecondary,
      secondaryContainer: colors.secondaryContainer,
      onSecondaryContainer: colors.onSecondaryContainer,
      tertiary: colors.tertiary,
      onTertiary: colors.onTertiary,
      tertiaryContainer: colors.tertiaryContainer,
      onTertiaryContainer: colors.onTertiaryContainer,
      error: colors.error,
      onError: colors.onError,
      errorContainer: colors.errorContainer,
      onErrorContainer: colors.onErrorContainer,
      background: colors.background,
      onBackground: colors.onBackground,
      surface: colors.surface,
      onSurface: colors.onSurface,
      surfaceVariant: colors.surfaceVariant,
      onSurfaceVariant: colors.onSurfaceVariant,
      outline: colors.outline,
      outlineVariant: colors.outlineVariant,
      shadow: colors.shadow,
      scrim: colors.scrim,
      inverseSurface: colors.inverseSurface,
      inverseOnSurface: colors.inverseOnSurface,
      inversePrimary: colors.inversePrimary,
      ...containerTones,
      surfaceDisabled: colors.surfaceVariant,
      onSurfaceDisabled: colors.onSurfaceVariant,
      backdrop: colors.scrim,
      elevation: {
        level0: colors.surface,
        level1: containerTones.surfaceContainerLow,
        level2: containerTones.surfaceContainer,
        level3: containerTones.surfaceContainerHigh,
        level4: containerTones.surfaceContainerHighest,
        level5: containerTones.surfaceContainerHighest,
      },
  };
  return {
    ...base,
    version: 3,
    isV3: true,
    dark,
    roundness: shape.medium,
    animation: { scale: 1 },
    colors: colorOverrides as MD3Theme['colors'],
    fonts,
  };
}

export const lightTheme = buildTheme(false, lightColors);
export const darkTheme = buildTheme(true, darkColors);
export const highContrastLightTheme = buildTheme(false, highContrastLightColors);
export const highContrastDarkTheme = buildTheme(true, highContrastDarkColors);

export type { MD3Theme };
export { elevation };
