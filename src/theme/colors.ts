export interface Palette {
  primary: string;
  onPrimary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
  accent: string;
  focusRing: string;
  glass: string;
  glassBorder: string;
  cardShadow: string;
}

// Lumina Pro — high-clarity light mode
export const lightPalette: Palette = {
  primary: '#32D74B',
  onPrimary: '#1A1A1A',
  background: '#F9F9FB',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F7',
  text: '#1A1A1A',
  textMuted: '#646464',
  border: '#E5E5E7',
  success: '#2FBF4F',
  danger: '#BA1A1A',
  warning: '#B26A00',
  accent: '#3E90FF',
  focusRing: '#1A1A1A',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(26,26,26,0.08)',
  cardShadow: 'rgba(0,0,0,0.04)',
};

// Pro Dark — nocturnal performance
export const darkPalette: Palette = {
  primary: '#32D74B',
  onPrimary: '#0A0F0A',
  background: '#131315',
  surface: '#1F1F21',
  surfaceVariant: '#2C2C2E',
  text: '#F2F2F2',
  textMuted: '#9A9AA0',
  border: '#333336',
  success: '#30D158',
  danger: '#FF6B6B',
  warning: '#FFD60A',
  accent: '#3E90FF',
  focusRing: '#FFFFFF',
  glass: 'rgba(31,31,33,0.82)',
  glassBorder: 'rgba(255,255,255,0.15)',
  cardShadow: 'rgba(0,0,0,0.4)',
};

export const highContrastLightPalette: Palette = {
  ...lightPalette,
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F0F0',
  text: '#000000',
  textMuted: '#111111',
  border: '#000000',
  accent: '#0033AA',
  focusRing: '#000000',
  glass: 'rgba(255,255,255,0.9)',
  glassBorder: 'rgba(0,0,0,0.35)',
};

export const highContrastDarkPalette: Palette = {
  ...darkPalette,
  background: '#000000',
  surface: '#000000',
  surfaceVariant: '#141414',
  text: '#FFFFFF',
  textMuted: '#E0E0E0',
  border: '#FFFFFF',
  primary: '#70FF76',
  focusRing: '#FFFFFF',
  glass: 'rgba(0,0,0,0.9)',
  glassBorder: 'rgba(255,255,255,0.4)',
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};
