/**
 * Lean ribbon look fields for per-space / per-page Surfaces scope.
 * Button layouts stay on the live global `ribbon` slice.
 */

import {
  ambientPaletteToRibbonColors,
  peekWallpaperAmbientPalette,
} from '../theme/wallpaperAmbientPaletteCache.js';

export const RIBBON_LOOK_KEYS = Object.freeze([
  'ribbonColor',
  'ribbonGlowColor',
  'ribbonGlowStrength',
  'ribbonDockOpacity',
  'glassWiiRibbon',
  'glassOpacity',
  'glassBlur',
  'glassBorderOpacity',
  'glassShineOpacity',
]);

/** Scope keys stored on the space appearance ribbon snapshot. */
export const RIBBON_SCOPED_META_KEYS = Object.freeze(['ribbonScope', 'ribbonByPage']);

/**
 * @param {unknown} raw
 * @returns {'space' | 'perPage'}
 */
export function normalizeRibbonScope(raw) {
  return raw === 'perPage' ? 'perPage' : 'space';
}

/**
 * @param {unknown} raw
 * @returns {Record<string, object>}
 */
export function normalizeRibbonByPage(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object') continue;
    const partial = pickRibbonLook(value);
    if (Object.keys(partial).length > 0) out[key] = partial;
  }
  return out;
}

/**
 * @param {object|null|undefined} source
 * @returns {object}
 */
export function pickRibbonLook(source) {
  if (!source || typeof source !== 'object') return {};
  const out = {};
  for (const key of RIBBON_LOOK_KEYS) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

/**
 * Merge scoped ribbon meta onto a live ribbon capture so space switches / presets
 * do not wipe `ribbonByPage` / `ribbonScope`.
 *
 * @param {object} liveRibbon
 * @param {object|null|undefined} storedRibbon
 * @returns {object}
 */
export function mergeSpaceScopedRibbonFields(liveRibbon, storedRibbon) {
  const ribbon = { ...(liveRibbon && typeof liveRibbon === 'object' ? liveRibbon : {}) };
  const stored = storedRibbon && typeof storedRibbon === 'object' ? storedRibbon : {};

  ribbon.ribbonScope = normalizeRibbonScope(
    stored.ribbonScope !== undefined ? stored.ribbonScope : ribbon.ribbonScope
  );
  ribbon.ribbonByPage = normalizeRibbonByPage(
    stored.ribbonByPage !== undefined ? stored.ribbonByPage : ribbon.ribbonByPage
  );

  return ribbon;
}

/**
 * Resolve the effective ribbon look for the active space + page.
 * Prefer page override when `ribbonScope === 'perPage'`, else space snapshot look, else live.
 *
 * @param {{
 *   liveRibbon?: object,
 *   spaceRibbon?: object|null,
 *   currentPage?: number,
 *   supportsPerPage?: boolean,
 * }} args
 * @returns {object}
 */
export function resolveEffectiveRibbonLook({
  liveRibbon = {},
  spaceRibbon = null,
  currentPage = 0,
  supportsPerPage = true,
} = {}) {
  const live = liveRibbon && typeof liveRibbon === 'object' ? liveRibbon : {};
  const space = spaceRibbon && typeof spaceRibbon === 'object' ? spaceRibbon : {};
  const scope = supportsPerPage
    ? normalizeRibbonScope(space.ribbonScope ?? live.ribbonScope)
    : 'space';
  const byPage = normalizeRibbonByPage(space.ribbonByPage ?? live.ribbonByPage);
  const pageKey = String(Math.max(0, Math.floor(Number(currentPage) || 0)));
  const pageLook =
    scope === 'perPage' ? byPage[pageKey] || byPage[Number(pageKey)] || null : null;

  const baseLook = {
    ...pickRibbonLook(live),
    ...pickRibbonLook(space),
  };
  if (pageLook) {
    return { ...baseLook, ...pickRibbonLook(pageLook) };
  }
  return baseLook;
}

/**
 * @param {{
 *   spaceRibbon?: object|null,
 *   liveRibbon?: object,
 *   currentPage?: number,
 *   supportsPerPage?: boolean,
 * }} args
 * @returns {boolean}
 */
export function hasExplicitPageRibbonLook({
  spaceRibbon = null,
  liveRibbon = {},
  currentPage = 0,
  supportsPerPage = true,
} = {}) {
  if (!supportsPerPage) return false;
  const live = liveRibbon && typeof liveRibbon === 'object' ? liveRibbon : {};
  const space = spaceRibbon && typeof spaceRibbon === 'object' ? spaceRibbon : {};
  const scope = normalizeRibbonScope(space.ribbonScope ?? live.ribbonScope);
  if (scope !== 'perPage') return false;
  const byPage = normalizeRibbonByPage(space.ribbonByPage ?? live.ribbonByPage);
  const pageKey = String(Math.max(0, Math.floor(Number(currentPage) || 0)));
  return Boolean(byPage[pageKey] || byPage[Number(pageKey)]);
}

/**
 * Paint target for WiiRibbon tween: explicit page look > wallpaper-match cache > space/live.
 * Spotify is handled separately in the ribbon paint path (ambientOverride).
 *
 * @param {{
 *   liveRibbon?: object,
 *   spaceRibbon?: object|null,
 *   currentPage?: number,
 *   supportsPerPage?: boolean,
 *   wallpaperMatchEnabled?: boolean,
 *   wallpaperUrl?: string|null,
 * }} args
 * @returns {object}
 */
export function resolveRibbonPaintTarget({
  liveRibbon = {},
  spaceRibbon = null,
  currentPage = 0,
  supportsPerPage = true,
  wallpaperMatchEnabled = false,
  wallpaperUrl = null,
} = {}) {
  const baseLook = resolveEffectiveRibbonLook({
    liveRibbon,
    spaceRibbon,
    currentPage,
    supportsPerPage,
  });

  if (
    hasExplicitPageRibbonLook({
      spaceRibbon,
      liveRibbon,
      currentPage,
      supportsPerPage,
    })
  ) {
    return baseLook;
  }

  if (wallpaperMatchEnabled && wallpaperUrl) {
    const cached = peekWallpaperAmbientPalette(wallpaperUrl);
    const fromCache = ambientPaletteToRibbonColors(cached?.palette);
    if (fromCache) {
      return { ...baseLook, ...fromCache };
    }
  }

  return baseLook;
}

export default resolveEffectiveRibbonLook;
