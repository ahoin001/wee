/**
 * Lean ribbon look fields for per-space / per-page Surfaces scope.
 * Button layouts stay on the live global `ribbon` slice.
 *
 * Live paint precedence (SSOT with resolveEffectiveAccent):
 *   Spotify Match → explicit per-page look → Wallpaper match → space/live manual
 */

import { colorStringToHex } from '../theme/extractImagePalette.js';
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

/** @typedef {'spotify' | 'page' | 'wallpaper' | 'manual'} RibbonPaintSource */

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
 * Map Now Playing / Spotify extracted colors → ribbon fill + glow (hex).
 * @param {{ accent?: string, primary?: string, secondary?: string } | null | undefined} spotifyColors
 * @returns {{ ribbonColor: string, ribbonGlowColor: string } | null}
 */
export function spotifyColorsToRibbonLook(spotifyColors) {
  if (!spotifyColors || typeof spotifyColors !== 'object') return null;
  const ribbonGlowColor =
    colorStringToHex(spotifyColors.accent) || colorStringToHex(spotifyColors.primary);
  const ribbonColor =
    colorStringToHex(spotifyColors.primary) ||
    colorStringToHex(spotifyColors.secondary) ||
    ribbonGlowColor;
  if (!ribbonColor && !ribbonGlowColor) return null;
  return {
    ...(ribbonColor ? { ribbonColor } : {}),
    ...(ribbonGlowColor ? { ribbonGlowColor } : {}),
  };
}

/**
 * Wallpaper ambient → ribbon colors. Prefers live store palette when it matches the
 * display URL (seed picks), else session LRU cache.
 *
 * @param {{
 *   wallpaperUrl?: string|null,
 *   ambientPalette?: object|null,
 *   ambientCachedForUrl?: string|null,
 * }} args
 * @returns {{ ribbonColor?: string, ribbonGlowColor?: string } | null}
 */
export function resolveWallpaperRibbonOverlay({
  wallpaperUrl = null,
  ambientPalette = null,
  ambientCachedForUrl = null,
} = {}) {
  if (!wallpaperUrl) return null;
  const storePalette =
    ambientPalette && ambientCachedForUrl && ambientCachedForUrl === wallpaperUrl
      ? ambientPalette
      : null;
  const cached = peekWallpaperAmbientPalette(wallpaperUrl);
  return ambientPaletteToRibbonColors(storePalette || cached?.palette);
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
 * Paint target for WiiRibbon tween.
 * Precedence: Spotify Match → explicit per-page → Wallpaper match → space/live manual.
 *
 * @param {{
 *   liveRibbon?: object,
 *   spaceRibbon?: object|null,
 *   currentPage?: number,
 *   supportsPerPage?: boolean,
 *   wallpaperMatchEnabled?: boolean,
 *   wallpaperUrl?: string|null,
 *   ambientPalette?: object|null,
 *   ambientCachedForUrl?: string|null,
 *   spotifyMatchEnabled?: boolean,
 *   spotifyColors?: object|null,
 * }} args
 * @returns {{ look: object, source: RibbonPaintSource }}
 */
export function resolveRibbonPaintTarget({
  liveRibbon = {},
  spaceRibbon = null,
  currentPage = 0,
  supportsPerPage = true,
  wallpaperMatchEnabled = false,
  wallpaperUrl = null,
  ambientPalette = null,
  ambientCachedForUrl = null,
  spotifyMatchEnabled = false,
  spotifyColors = null,
} = {}) {
  const baseLook = resolveEffectiveRibbonLook({
    liveRibbon,
    spaceRibbon,
    currentPage,
    supportsPerPage,
  });

  if (spotifyMatchEnabled) {
    const fromSpotify = spotifyColorsToRibbonLook(spotifyColors);
    if (fromSpotify) {
      return { look: { ...baseLook, ...fromSpotify }, source: 'spotify' };
    }
  }

  if (
    hasExplicitPageRibbonLook({
      spaceRibbon,
      liveRibbon,
      currentPage,
      supportsPerPage,
    })
  ) {
    return { look: baseLook, source: 'page' };
  }

  if (wallpaperMatchEnabled && wallpaperUrl) {
    const fromWallpaper = resolveWallpaperRibbonOverlay({
      wallpaperUrl,
      ambientPalette,
      ambientCachedForUrl,
    });
    if (fromWallpaper) {
      return { look: { ...baseLook, ...fromWallpaper }, source: 'wallpaper' };
    }
  }

  return { look: baseLook, source: 'manual' };
}

/**
 * Colors to persist when the user saves “current look” while live match is on.
 * Same overlay stack as paint (Spotify → wallpaper), without page/space merge.
 *
 * @param {{
 *   wallpaperMatchEnabled?: boolean,
 *   wallpaperUrl?: string|null,
 *   ambientPalette?: object|null,
 *   ambientCachedForUrl?: string|null,
 *   spotifyMatchEnabled?: boolean,
 *   spotifyColors?: object|null,
 * }} args
 * @returns {{ ribbonColor?: string, ribbonGlowColor?: string } | null}
 */
export function resolveLiveMatchRibbonOverlay({
  wallpaperMatchEnabled = false,
  wallpaperUrl = null,
  ambientPalette = null,
  ambientCachedForUrl = null,
  spotifyMatchEnabled = false,
  spotifyColors = null,
} = {}) {
  if (spotifyMatchEnabled) {
    const fromSpotify = spotifyColorsToRibbonLook(spotifyColors);
    if (fromSpotify) return fromSpotify;
  }
  if (wallpaperMatchEnabled && wallpaperUrl) {
    return resolveWallpaperRibbonOverlay({
      wallpaperUrl,
      ambientPalette,
      ambientCachedForUrl,
    });
  }
  return null;
}

export default resolveEffectiveRibbonLook;
