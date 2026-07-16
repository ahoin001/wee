/**
 * Session LRU of wallpaper URL → ambient palette.
 * Page flips with wallpaper match hit this cache so ribbon colors can tween
 * immediately instead of waiting for a fresh canvas extract.
 */

import { extractImagePalette } from './extractImagePalette.js';

const WALLPAPER_AMBIENT_PALETTE_CACHE_MAX = 24;

/** @type {Map<string, Promise<{ seedHex: string, palette: object, seeds: string[] } | null>>} */
const inflight = new Map();

/** @type {Map<string, { seedHex: string, palette: object, seeds: string[] }>} */
const resolved = new Map();

function touchResolved(key, entry) {
  resolved.delete(key);
  resolved.set(key, entry);
  while (resolved.size > WALLPAPER_AMBIENT_PALETTE_CACHE_MAX) {
    resolved.delete(resolved.keys().next().value);
  }
}

/**
 * Synchronous peek for paint resolvers (page-flip same render).
 * @param {string|null|undefined} imageUrl
 * @returns {{ seedHex: string, palette: object, seeds: string[] } | null}
 */
export function peekWallpaperAmbientPalette(imageUrl) {
  const key = typeof imageUrl === 'string' ? imageUrl : '';
  if (!key) return null;
  const hit = resolved.get(key);
  if (!hit) return null;
  touchResolved(key, hit);
  return hit;
}

/**
 * Map ambient palette → ribbon color fields (same mapping as legacy ambient hook).
 * @param {{ accent?: string, primary?: string, surfaceHint?: string, secondary?: string } | null | undefined} palette
 * @returns {{ ribbonColor: string, ribbonGlowColor: string } | null}
 */
export function ambientPaletteToRibbonColors(palette) {
  if (!palette || typeof palette !== 'object') return null;
  const ribbonGlowColor = palette.accent || palette.primary;
  const ribbonColor = palette.surfaceHint || palette.secondary;
  if (!ribbonGlowColor && !ribbonColor) return null;
  return {
    ...(ribbonColor ? { ribbonColor } : {}),
    ...(ribbonGlowColor ? { ribbonGlowColor } : {}),
  };
}

/**
 * Get or extract a wallpaper ambient palette. Concurrent callers share one Promise.
 * Failures are not memoized.
 *
 * @param {string|null|undefined} imageUrl
 * @returns {Promise<{ seedHex: string, palette: object, seeds: string[] } | null>}
 */
export function getWallpaperAmbientPalette(imageUrl) {
  const key = typeof imageUrl === 'string' ? imageUrl : '';
  if (!key) return Promise.resolve(null);

  const existing = peekWallpaperAmbientPalette(key);
  if (existing) return Promise.resolve(existing);

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = extractImagePalette(key)
    .then((result) => {
      inflight.delete(key);
      if (!result?.palette) return null;
      const entry = {
        seedHex: result.seedHex,
        palette: {
          primary: result.palette.primary,
          secondary: result.palette.secondary,
          accent: result.palette.accent,
          surfaceHint: result.palette.surfaceHint,
        },
        seeds: Array.isArray(result.seeds) ? result.seeds : [],
      };
      touchResolved(key, entry);
      return entry;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, request);
  return request;
}

/** Warm-extract without applying — used for neighbor page prefetch. */
export function prefetchWallpaperAmbientPalette(imageUrl) {
  return getWallpaperAmbientPalette(imageUrl).catch(() => null);
}

export function clearWallpaperAmbientPaletteCache() {
  inflight.clear();
  resolved.clear();
}

/** @returns {number} */
export function getWallpaperAmbientPaletteCacheSize() {
  return resolved.size;
}
