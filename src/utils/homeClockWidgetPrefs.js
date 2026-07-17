/**
 * Display prefs for the Home Clock widget.
 * Persisted on `ui.homeClockWidget`.
 */

import { colorStringToHex } from './theme/extractImagePalette.js';

export const HOME_CLOCK_DATE_STACK = Object.freeze({
  above: 'above',
  below: 'below',
});

export const HOME_CLOCK_ALIGN = Object.freeze({
  left: 'left',
  center: 'center',
  right: 'right',
});

export const DEFAULT_HOME_CLOCK_WIDGET = Object.freeze({
  dateStack: HOME_CLOCK_DATE_STACK.below,
  align: HOME_CLOCK_ALIGN.center,
  /** null → use ribbon Time color from settings */
  color: null,
});

/**
 * @param {unknown} raw
 * @returns {{
 *   dateStack: 'above' | 'below',
 *   align: 'left' | 'center' | 'right',
 *   color: string | null,
 * }}
 */
export function normalizeHomeClockWidget(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const dateStack =
    src.dateStack === HOME_CLOCK_DATE_STACK.above
      ? HOME_CLOCK_DATE_STACK.above
      : HOME_CLOCK_DATE_STACK.below;
  const align =
    src.align === HOME_CLOCK_ALIGN.left || src.align === HOME_CLOCK_ALIGN.right
      ? src.align
      : HOME_CLOCK_ALIGN.center;
  const hex = typeof src.color === 'string' ? colorStringToHex(src.color) : null;
  return {
    dateStack,
    align,
    color: hex || null,
  };
}
