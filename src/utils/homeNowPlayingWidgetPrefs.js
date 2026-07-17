/**
 * Display prefs for the Home Now Playing widget.
 * Persisted on `ui.homeNowPlayingWidget`.
 */

export const DEFAULT_HOME_NOW_PLAYING_WIDGET = Object.freeze({
  showVisualizer: false,
});

/**
 * @param {unknown} raw
 * @returns {{ showVisualizer: boolean }}
 */
export function normalizeHomeNowPlayingWidget(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    showVisualizer: Boolean(src.showVisualizer),
  };
}
