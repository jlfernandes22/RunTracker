/**
 * Layout tokens — thin alias for the single source of truth (src/theme/tokens.ts).
 * `radii` maps the app's shorthand (sm/md/lg/xl) onto the MD3 shape scale.
 */
import { shape, spacing } from './tokens';

export const radii = {
  sm: shape.small,
  md: shape.medium,
  lg: shape.large,
  xl: shape.extraLarge,
  pill: shape.pill,
};

export { spacing };
