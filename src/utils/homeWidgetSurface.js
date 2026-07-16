/**
 * Per-widget board surface: glass chrome vs wallpaper-clear.
 * Persisted on `slots[].surface` (Home grid SSOT).
 */

export const HOME_WIDGET_SURFACES = Object.freeze(['glass', 'clear']);

export const DEFAULT_HOME_WIDGET_SURFACE = 'glass';

/**
 * @param {unknown} value
 * @returns {'glass' | 'clear'}
 */
export function normalizeHomeWidgetSurface(value) {
  return value === 'clear' ? 'clear' : DEFAULT_HOME_WIDGET_SURFACE;
}
