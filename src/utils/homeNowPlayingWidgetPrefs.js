/**
 * Display prefs for the Home Now Playing widget.
 * Persisted on `ui.homeNowPlayingWidget`.
 */

export const NOW_PLAYING_ART_LAYOUTS = Object.freeze({
  hero: Object.freeze({ id: 'hero', label: 'Hero' }),
  inline: Object.freeze({ id: 'inline', label: 'Inline' }),
});

export const DEFAULT_HOME_NOW_PLAYING_WIDGET = Object.freeze({
  showVisualizer: false,
  /** Floating cover above the panel vs square cover docked inside the panel. */
  artLayout: 'hero',
  /** Backdrop blur of enlarged album art (px). */
  backdropBlur: 18,
  /** Black wash over the backdrop (0–1). */
  backdropDarken: 0.42,
});

const ART_LAYOUT_IDS = new Set(Object.keys(NOW_PLAYING_ART_LAYOUTS));

/**
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 */
function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {unknown} raw
 * @returns {{
 *   showVisualizer: boolean,
 *   artLayout: 'hero' | 'inline',
 *   backdropBlur: number,
 *   backdropDarken: number,
 * }}
 */
export function normalizeHomeNowPlayingWidget(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const layoutRaw = typeof src.artLayout === 'string' ? src.artLayout : '';
  return {
    showVisualizer: Boolean(src.showVisualizer),
    artLayout: ART_LAYOUT_IDS.has(layoutRaw) ? layoutRaw : DEFAULT_HOME_NOW_PLAYING_WIDGET.artLayout,
    backdropBlur: clampNumber(
      src.backdropBlur,
      0,
      40,
      DEFAULT_HOME_NOW_PLAYING_WIDGET.backdropBlur
    ),
    backdropDarken: clampNumber(
      src.backdropDarken,
      0,
      0.85,
      DEFAULT_HOME_NOW_PLAYING_WIDGET.backdropDarken
    ),
  };
}
