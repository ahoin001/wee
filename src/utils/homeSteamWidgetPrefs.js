/**
 * Shared display prefs for Home Steam widgets (Recent / Most Played / Friends).
 * Persisted on `ui.homeSteamWidget`. Uses free Steam Web API fields already enriched.
 *
 * Cover density is fixed to Dense (`S`) — no user tile-size control.
 * Gutters start at Roomy and step up (Wide / Spacious).
 */

/** Dense cover grid config (only size used by Steam Home shelves). */
export const HOME_STEAM_TILE_SIZES = Object.freeze({
  S: Object.freeze({
    id: 'S',
    label: 'Dense',
    columns: 5,
    tileMaxPx: 56,
    capacity: 30,
    horizontalRows: 2,
  }),
  // Legacy ids kept for older snapshots; normalize always coerces to S.
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

/**
 * Spacing between cover tiles. Scale starts at Roomy (legacy tight/default map up).
 */
export const HOME_STEAM_GUTTERS = Object.freeze({
  roomy: Object.freeze({ id: 'roomy', label: 'Roomy', gapClass: 'gap-2' }),
  wide: Object.freeze({ id: 'wide', label: 'Wide', gapClass: 'gap-3' }),
  spacious: Object.freeze({ id: 'spacious', label: 'Spacious', gapClass: 'gap-4' }),
});

/** Legacy gutter ids → current scale. */
const LEGACY_GUTTER_MAP = Object.freeze({
  tight: 'roomy',
  default: 'roomy',
});

export const DEFAULT_HOME_STEAM_WIDGET = Object.freeze({
  tileSize: 'S',
  gutter: 'roomy',
  showPlaytime: true,
  showName: true,
});

/**
 * @param {unknown} raw
 * @returns {{
 *   tileSize: 'S',
 *   gutter: 'roomy' | 'wide' | 'spacious',
 *   showPlaytime: boolean,
 *   showName: boolean,
 * }}
 */
export function normalizeHomeSteamWidget(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const rawGutter = typeof src.gutter === 'string' ? src.gutter : '';
  const mappedGutter = LEGACY_GUTTER_MAP[rawGutter] || rawGutter;
  const gutter = HOME_STEAM_GUTTERS[mappedGutter]
    ? mappedGutter
    : DEFAULT_HOME_STEAM_WIDGET.gutter;
  return {
    // Cover size control removed — always Dense.
    tileSize: 'S',
    gutter,
    showPlaytime: src.showPlaytime !== false,
    // Default on for readable cover docks; explicit false still disables.
    showName: src.showName !== false,
  };
}

/**
 * @param {'S'|'M'|'L'} [_tileSizeId]
 */
export function getHomeSteamTileSizeConfig(_tileSizeId) {
  return HOME_STEAM_TILE_SIZES.S;
}

/**
 * @param {'roomy'|'wide'|'spacious'|string} gutterId
 */
export function getHomeSteamGutterConfig(gutterId) {
  const mapped = LEGACY_GUTTER_MAP[gutterId] || gutterId;
  return HOME_STEAM_GUTTERS[mapped] || HOME_STEAM_GUTTERS.roomy;
}

/**
 * Taller / square widgets scroll vertically; wider widgets scroll horizontally.
 * Scroll axis is layout-driven (no manual toggle).
 * @param {unknown} _prefs
 * @param {{ colSpan?: number, rowSpan?: number }} span
 * @returns {'vertical' | 'horizontal'}
 */
export function resolveSteamShelfScrollAxis(_prefs, { colSpan = 2, rowSpan = 2 } = {}) {
  const cols = Math.max(1, Number(colSpan) || 1);
  const rows = Math.max(1, Number(rowSpan) || 1);
  // Single board-row shelves always scroll sideways (cinema strip).
  if (rows <= 1) return 'horizontal';
  return cols > rows ? 'horizontal' : 'vertical';
}

/**
 * Cover layout for Steam game shelves.
 * 1-row (H2/H3/H4) → height-filling cinema strip; taller boards keep Dense grid.
 * @param {{ colSpan?: number, rowSpan?: number }} span
 * @returns {{
 *   mode: 'shelf' | 'grid',
 *   horizontalRows: number,
 *   density: 'compact' | 'cozy' | 'roomy',
 *   capacityCap: number,
 *   tileMaxPx: number | null,
 *   columns: number,
 * }}
 */
export function resolveSteamShelfTileLayout({ colSpan = 2, rowSpan = 2 } = {}) {
  const rows = Math.max(1, Number(rowSpan) || 1);
  if (rows <= 1) {
    return {
      mode: 'shelf',
      horizontalRows: 1,
      density: 'cozy',
      capacityCap: 16,
      /** Height-driven covers — width comes from aspect-ratio, not a px cap. */
      tileMaxPx: null,
      columns: 1,
    };
  }
  const dense = HOME_STEAM_TILE_SIZES.S;
  return {
    mode: 'grid',
    horizontalRows: dense.horizontalRows,
    density: 'compact',
    capacityCap: dense.capacity,
    tileMaxPx: dense.tileMaxPx,
    columns: dense.columns,
  };
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
