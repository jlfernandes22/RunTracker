import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TextStyle, useColorScheme } from 'react-native';
import {
  Palette,
  darkPalette,
  highContrastDarkPalette,
  highContrastLightPalette,
  lightPalette,
} from './colors';

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

export interface Theme {
  palette: Palette;
  typography: Typography;
  settings: ThemeSettings;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setFontScale: (v: number) => void;
}

const ThemeContext = createContext<Theme | null>(null);

const SETTINGS_KEY = 'ui.theme';

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

  const palette = useMemo(() => {
    if (settings.highContrast) {
      return systemScheme === 'dark' ? highContrastDarkPalette : highContrastLightPalette;
    }
    return systemScheme === 'dark' ? darkPalette : lightPalette;
  }, [settings.highContrast, systemScheme]);

  const typography = useMemo<Typography>(() => {
    const isDark = systemScheme === 'dark';
    const fs = settings.fontScale;
    const hanken = 'Hanken Grotesk';
    const body = isDark ? hanken : 'Inter';
    return {
      metric: {
        fontFamily: hanken,
        fontSize: Math.round(48 * fs),
        fontWeight: isDark ? '800' : '700',
        lineHeight: Math.round(56 * fs),
        letterSpacing: -0.5,
      },
      metricMobile: {
        fontFamily: hanken,
        fontSize: Math.round(34 * fs),
        fontWeight: isDark ? '800' : '700',
        lineHeight: Math.round(40 * fs),
        letterSpacing: -0.5,
      },
      headline: {
        fontFamily: hanken,
        fontSize: Math.round(24 * fs),
        fontWeight: '700',
        lineHeight: Math.round(32 * fs),
      },
      headlineMobile: {
        fontFamily: hanken,
        fontSize: Math.round(20 * fs),
        fontWeight: '700',
        lineHeight: Math.round(26 * fs),
      },
      body: {
        fontFamily: body,
        fontSize: Math.round(16 * fs),
        fontWeight: '400',
        lineHeight: Math.round(24 * fs),
      },
      bodySmall: {
        fontFamily: body,
        fontSize: Math.round(14 * fs),
        fontWeight: '400',
        lineHeight: Math.round(20 * fs),
      },
      label: {
        fontFamily: 'JetBrains Mono',
        fontSize: Math.round(12 * fs),
        fontWeight: '500',
        lineHeight: Math.round(16 * fs),
        letterSpacing: 0.6,
        textTransform: 'uppercase',
      },
      button: {
        fontFamily: hanken,
        fontSize: Math.round(16 * fs),
        fontWeight: '700',
      },
    };
  }, [systemScheme, settings.fontScale]);

  const value = useMemo(
    () => ({ palette, typography, settings, setHighContrast, setReduceMotion, setFontScale }),
    [palette, typography, settings, setHighContrast, setReduceMotion, setFontScale],
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
