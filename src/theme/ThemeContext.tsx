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
import { isDarkHex } from './colors';
import {
  amoledDarkColors,
  darkColors,
  highContrastAmoledDarkColors,
  highContrastDarkColors,
  highContrastLightColors,
  lightColors,
  statusColors,
  typeScale,
} from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeSettings {
  highContrast: boolean;
  reduceMotion: boolean;
  fontScale: number;
  /** Manual theme override (default: follow the device). */
  themeMode: ThemeMode;
  /** Pure pitch-black OLED background for dark mode. */
  amoledBlack: boolean;
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
  setThemeMode: (v: ThemeMode) => void;
  setAmoledBlack: (v: boolean) => void;
}

const ThemeContext = createContext<Theme | null>(null);

const SETTINGS_KEY = 'ui.theme';

const DEFAULT_SETTINGS: ThemeSettings = {
  highContrast: false,
  reduceMotion: false,
  fontScale: 1,
  themeMode: 'system',
  amoledBlack: false,
};

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

function scalePaperFonts<T extends { fonts: Record<string, any> }>(
  theme: T,
  fs: number,
): T {
  if (fs === 1) return theme;
  const fonts: Record<string, any> = {};
  for (const key of Object.keys(theme.fonts)) {
    const f = theme.fonts[key];
    const scaled: Record<string, any> = { ...f };
    if (typeof f.fontSize === 'number') {
      scaled.fontSize = Math.round(f.fontSize * fs);
    }
    if (typeof f.lineHeight === 'number') {
      scaled.lineHeight = Math.round(f.lineHeight * fs);
    }
    fonts[key] = scaled;
  }
  return { ...theme, fonts };
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
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const { db } = require('../db/database');
    db.getSetting(SETTINGS_KEY).then((raw: string | null) => {
      if (raw) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
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
  const setThemeMode = useCallback(
    (v: ThemeMode) => persist({ ...settings, themeMode: v }),
    [persist, settings],
  );
  const setAmoledBlack = useCallback(
    (v: boolean) => persist({ ...settings, amoledBlack: v }),
    [persist, settings],
  );

  const isDark =
    settings.themeMode === 'system' ? systemScheme === 'dark' : settings.themeMode === 'dark';
  const { paperTheme, palette } = useMemo(() => {
    if (settings.highContrast) {
      const { highContrastDarkTheme, highContrastLightTheme, highContrastAmoledDarkTheme } = require('./index');
      const colors = isDark
        ? settings.amoledBlack
          ? highContrastAmoledDarkColors
          : highContrastDarkColors
        : highContrastLightColors;
      const status = isDark
        ? { success: statusColors.successOnDark, warning: statusColors.warningOnDark }
        : { success: statusColors.success, warning: statusColors.warning };
      const theme = isDark
        ? settings.amoledBlack
          ? highContrastAmoledDarkTheme
          : highContrastDarkTheme
        : highContrastLightTheme;
      const scaled = scalePaperFonts(theme, settings.fontScale);
      return {
        paperTheme: scaled,
        palette: buildPalette(colors, status),
      };
    }
    const { darkTheme, lightTheme, amoledDarkTheme } = require('./index');
    const colors = isDark
      ? settings.amoledBlack
        ? amoledDarkColors
        : darkColors
      : lightColors;
    const status = isDark
      ? { success: statusColors.successOnDark, warning: statusColors.warningOnDark }
      : { success: statusColors.success, warning: statusColors.warning };
    const theme = isDark
      ? settings.amoledBlack
        ? amoledDarkTheme
        : darkTheme
      : lightTheme;
    const scaled = scalePaperFonts(theme, settings.fontScale);
    return {
      paperTheme: scaled,
      palette: buildPalette(colors, status),
    };
  }, [isDark, settings.highContrast, settings.amoledBlack, settings.fontScale]);

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
      setThemeMode,
      setAmoledBlack,
    }),
    [
      palette,
      typography,
      paperTheme,
      settings,
      setHighContrast,
      setReduceMotion,
      setFontScale,
      setThemeMode,
      setAmoledBlack,
    ],
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
  return isDarkHex(palette.background) ? 'dark' : 'light';
}
