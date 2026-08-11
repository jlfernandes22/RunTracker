import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TextStyle, useColorScheme } from 'react-native';
import type { MD3Theme } from './index';
import {
  darkColors,
  highContrastDarkColors,
  highContrastLightColors,
  lightColors,
  statusColors,
  typeScale,
} from './tokens';

export interface ThemeSettings {
  highContrast: boolean;
  reduceMotion: boolean;
  fontScale: number;
}

export interface Typography {
  metric: TextStyle;
  metricMobile: TextStyle;
  headline: TextStyle;
  headlineMobile: TextStyle;
  body: TextStyle;
  bodySmall: TextStyle;
  label: TextStyle;
  button: TextStyle;
}

export interface Palette {
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
  // Semantic aliases used by screens.
  danger: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  accent: string;
  focusRing: string;
  glass: string;
  glassBorder: string;
  cardShadow: string;
}

export interface Theme {
  palette: Palette;
  typography: Typography;
  paperTheme: MD3Theme;
  settings: ThemeSettings;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setFontScale: (v: number) => void;
}

const ThemeContext = createContext<Theme | null>(null);

const SETTINGS_KEY = 'ui.theme';

function buildPalette(
  colors: typeof lightColors,
  status: { success: string; warning: string },
): Palette {
  const glass = `rgba(${hexToRgb(colors.surfaceContainerHigh)}, 0.86)`;
  return {
    ...colors,
    text: colors.onSurface,
    textMuted: colors.onSurfaceVariant,
    border: colors.outlineVariant,
    danger: colors.error,
    success: status.success,
    warning: status.warning,
    accent: colors.tertiary,
    focusRing: colors.onSurface,
    glass,
    glassBorder: colors.outlineVariant,
    cardShadow: colors.shadow,
  };
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function buildTypography(fs: number): Typography {
  const scale = (role: keyof typeof typeScale) => ({
    ...typeScale[role],
    fontSize: Math.round(typeScale[role].fontSize * fs),
    lineHeight: Math.round(typeScale[role].lineHeight * fs),
  });
  return {
    metric: scale('displayMedium'),
    metricMobile: scale('displaySmall'),
    headline: scale('headlineSmall'),
    headlineMobile: scale('titleLarge'),
    body: scale('bodyLarge'),
    bodySmall: scale('bodyMedium'),
    label: scale('labelMedium'),
    button: scale('labelLarge'),
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<ThemeSettings>({
    highContrast: false,
    reduceMotion: false,
    fontScale: 1,
  });

  useEffect(() => {
    const { db } = require('../db/database');
    db.getSetting(SETTINGS_KEY).then((raw: string | null) => {
      if (raw) {
        try {
          setSettings(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const persist = useCallback((next: ThemeSettings) => {
    setSettings(next);
    const { db } = require('../db/database');
    db.setSetting(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setHighContrast = useCallback(
    (v: boolean) => persist({ ...settings, highContrast: v }),
    [persist, settings],
  );
  const setReduceMotion = useCallback(
    (v: boolean) => persist({ ...settings, reduceMotion: v }),
    [persist, settings],
  );
  const setFontScale = useCallback(
    (v: number) => persist({ ...settings, fontScale: v }),
    [persist, settings],
  );

  const isDark = systemScheme === 'dark';
  const { paperTheme, palette } = useMemo(() => {
    if (settings.highContrast) {
      const { highContrastDarkTheme, highContrastLightTheme } = require('./index');
      const colors = isDark ? highContrastDarkColors : highContrastLightColors;
      const status = isDark
        ? { success: statusColors.successOnDark, warning: statusColors.warningOnDark }
        : { success: statusColors.success, warning: statusColors.warning };
      const theme = isDark ? highContrastDarkTheme : highContrastLightTheme;
      return {
        paperTheme: settings.reduceMotion
          ? { ...theme, animation: { ...theme.animation, scale: 0 } }
          : theme,
        palette: buildPalette(colors, status),
      };
    }
    const { darkTheme, lightTheme } = require('./index');
    const colors = isDark ? darkColors : lightColors;
    const status = isDark
      ? { success: statusColors.successOnDark, warning: statusColors.warningOnDark }
      : { success: statusColors.success, warning: statusColors.warning };
    const theme = isDark ? darkTheme : lightTheme;
    return {
      paperTheme: settings.reduceMotion
        ? { ...theme, animation: { ...theme.animation, scale: 0 } }
        : theme,
      palette: buildPalette(colors, status),
    };
  }, [isDark, settings.highContrast, settings.reduceMotion]);

  const typography = useMemo(() => buildTypography(settings.fontScale), [settings.fontScale]);

  const value = useMemo(
    () => ({
      palette,
      typography,
      paperTheme,
      settings,
      setHighContrast,
      setReduceMotion,
      setFontScale,
    }),
    [palette, typography, paperTheme, settings, setHighContrast, setReduceMotion, setFontScale],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export type MapTheme = 'light' | 'dark';

export function useMapTheme(): MapTheme {
  const { palette } = useTheme();
  const r = parseInt(palette.background.slice(1, 3), 16);
  const g = parseInt(palette.background.slice(3, 5), 16);
  const b = parseInt(palette.background.slice(5, 7), 16);
  return 0.3 * r + 0.6 * g + 0.1 * b > 128 ? 'light' : 'dark';
}
