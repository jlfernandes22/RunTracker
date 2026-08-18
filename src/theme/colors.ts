/**
 * Layout tokens — thin alias for the single source of truth (src/theme/tokens.ts).
 * `radii` maps the app's shorthand (sm/md/lg/xl) onto the MD3 shape scale.
 */
import { shape, spacing } from './tokens';

export const radii = {
  ...shape,
  sm: shape.small,
  md: shape.medium,
  lg: shape.large,
  xl: shape.extraLarge,
  pill: shape.pill,
};

/**
 * True when a `#RRGGBB` color is perceptually dark (luma < 128, using the
 * same 0.3/0.6/0.1 weighting as `luminance`). Shared by the status bar and
 * map theme pickers.
 */
export function isDarkHex(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.3 * r + 0.6 * g + 0.1 * b < 128;
}

export { spacing };
