/**
 * Display prefs for the Home Now Playing widget.
 * Persisted on `ui.homeNowPlayingWidget`.
 */

export const NOW_PLAYING_ART_LAYOUTS = Object.freeze({
  hero: Object.freeze({ id: 'hero', label: 'Hero' }),
  inline: Object.freeze({ id: 'inline', label: 'Inline' }),
});

/** Backdrop treatment behind the player chrome. */
export const NOW_PLAYING_BACKDROP_MODES = Object.freeze({
  atmosphere: Object.freeze({
    id: 'atmosphere',
    label: 'Atmosphere',
    title: 'Soft color wash from the album palette — wallpaper still peeks through',
  }),
  blur: Object.freeze({
    id: 'blur',
    label: 'Blur',
    title: 'Enlarged, blurred album cover behind the player',
  }),
});

export const DEFAULT_HOME_NOW_PLAYING_WIDGET = Object.freeze({
  showVisualizer: false,
  /** Floating cover above the panel vs square cover docked inside the panel. */
  artLayout: 'hero',
  /**
   * Single-row / wide tiles look best with atmosphere (no grainy cover wash).
   * Blur remains available for users who want the classic enlarged-art backdrop.
   */
  backdropMode: 'atmosphere',
  /** Backdrop blur of enlarged album art (px) — used when backdropMode is blur. */
  backdropBlur: 18,
  /** Black wash over the blur backdrop (0–1). */
  backdropDarken: 0.42,
});

const ART_LAYOUT_IDS = new Set(Object.keys(NOW_PLAYING_ART_LAYOUTS));
const BACKDROP_MODE_IDS = new Set(Object.keys(NOW_PLAYING_BACKDROP_MODES));

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
 *   backdropMode: 'atmosphere' | 'blur',
 *   backdropBlur: number,
 *   backdropDarken: number,
 * }}
 */
export function normalizeHomeNowPlayingWidget(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const layoutRaw = typeof src.artLayout === 'string' ? src.artLayout : '';
  const modeRaw = typeof src.backdropMode === 'string' ? src.backdropMode : '';
  return {
    showVisualizer: Boolean(src.showVisualizer),
    artLayout: ART_LAYOUT_IDS.has(layoutRaw) ? layoutRaw : DEFAULT_HOME_NOW_PLAYING_WIDGET.artLayout,
    backdropMode: BACKDROP_MODE_IDS.has(modeRaw)
      ? modeRaw
      : DEFAULT_HOME_NOW_PLAYING_WIDGET.backdropMode,
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
