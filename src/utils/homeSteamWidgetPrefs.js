/**
 * Shared display prefs for Home Steam widgets (Recent / Most Played / Friends).
 * Persisted on `ui.homeSteamWidget`. Uses free Steam Web API fields already enriched.
 */

export const HOME_STEAM_TILE_SIZES = Object.freeze({
  S: Object.freeze({
    id: 'S',
    label: 'Dense',
    columns: 5,
    tileMaxPx: 56,
    capacity: 30,
    horizontalRows: 2,
  }),
  M: Object.freeze({
    id: 'M',
    label: 'Medium',
    columns: 4,
    tileMaxPx: 68,
    capacity: 24,
    horizontalRows: 2,
  }),
  L: Object.freeze({
    id: 'L',
    label: 'Large',
    columns: 3,
    tileMaxPx: 84,
    capacity: 18,
    horizontalRows: 1,
  }),
});

export const HOME_STEAM_SCROLL_AXES = Object.freeze({
  auto: 'auto',
  vertical: 'vertical',
  horizontal: 'horizontal',
});

/** Spacing between cover tiles in the Steam shelf grid. */
export const HOME_STEAM_GUTTERS = Object.freeze({
  tight: Object.freeze({ id: 'tight', label: 'Tight', gapClass: 'gap-0.5' }),
  default: Object.freeze({ id: 'default', label: 'Default', gapClass: 'gap-1' }),
  roomy: Object.freeze({ id: 'roomy', label: 'Roomy', gapClass: 'gap-2' }),
});

export const DEFAULT_HOME_STEAM_WIDGET = Object.freeze({
  tileSize: 'M',
  scrollAxis: 'auto',
  gutter: 'default',
  showPlaytime: true,
  showName: false,
});

/**
 * @param {unknown} raw
 * @returns {{
 *   tileSize: 'S' | 'M' | 'L',
 *   scrollAxis: 'auto' | 'vertical' | 'horizontal',
 *   gutter: 'tight' | 'default' | 'roomy',
 *   showPlaytime: boolean,
 *   showName: boolean,
 * }}
 */
export function normalizeHomeSteamWidget(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const tileSize = HOME_STEAM_TILE_SIZES[src.tileSize] ? src.tileSize : DEFAULT_HOME_STEAM_WIDGET.tileSize;
  const scrollAxis = HOME_STEAM_SCROLL_AXES[src.scrollAxis]
    ? src.scrollAxis
    : DEFAULT_HOME_STEAM_WIDGET.scrollAxis;
  const gutter = HOME_STEAM_GUTTERS[src.gutter] ? src.gutter : DEFAULT_HOME_STEAM_WIDGET.gutter;
  return {
    tileSize,
    scrollAxis,
    gutter,
    showPlaytime: src.showPlaytime !== false,
    showName: Boolean(src.showName),
  };
}

/**
 * @param {'S'|'M'|'L'} tileSizeId
 */
export function getHomeSteamTileSizeConfig(tileSizeId) {
  return HOME_STEAM_TILE_SIZES[tileSizeId] || HOME_STEAM_TILE_SIZES.M;
}

/**
 * @param {'tight'|'default'|'roomy'} gutterId
 */
export function getHomeSteamGutterConfig(gutterId) {
  return HOME_STEAM_GUTTERS[gutterId] || HOME_STEAM_GUTTERS.default;
}

/**
 * Taller / square widgets scroll vertically; wider widgets scroll horizontally.
 * @param {{ scrollAxis: string }} prefs
 * @param {{ colSpan?: number, rowSpan?: number }} span
 * @returns {'vertical' | 'horizontal'}
 */
export function resolveSteamShelfScrollAxis(prefs, { colSpan = 2, rowSpan = 2 } = {}) {
  const axis = prefs?.scrollAxis;
  if (axis === HOME_STEAM_SCROLL_AXES.horizontal) return 'horizontal';
  if (axis === HOME_STEAM_SCROLL_AXES.vertical) return 'vertical';
  const cols = Math.max(1, Number(colSpan) || 1);
  const rows = Math.max(1, Number(rowSpan) || 1);
  return cols > rows ? 'horizontal' : 'vertical';
}

/**
 * Compact playtime badge from Steam minutes (free API field).
 * @param {number} minutes
 * @returns {string}
 */
export function formatSteamPlaytimeShort(minutes) {
  const m = Number(minutes) || 0;
  if (m <= 0) return '';
  if (m < 60) return `${Math.max(1, Math.round(m))}m`;
  const hours = m / 60;
  if (hours < 10) return `${hours.toFixed(1).replace(/\.0$/, '')}h`;
  return `${Math.round(hours)}h`;
}
