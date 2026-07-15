import {
  ALBUM_ART_TEXT_ON_DARK,
  ALBUM_ART_TEXT_ON_DARK_SECONDARY,
  ALBUM_ART_TEXT_ON_LIGHT,
  ALBUM_ART_TEXT_ON_LIGHT_SECONDARY,
} from '../design/albumArtContrastColors.js';
import { extractImagePalette } from './theme/extractImagePalette.js';

/**
 * Per-URL memo — multiple consumers (ribbon + floating widget) extract the same
 * album art on every track change; the canvas decode + pixel scan runs once.
 * Bounded LRU; promise is cached so concurrent callers share one extraction.
 */
const ALBUM_ART_PALETTE_CACHE_MAX = 12;
const albumArtPaletteCache = new Map();

export function clearAlbumArtPaletteCache() {
  albumArtPaletteCache.clear();
}

/** @returns {number} current memo size (test/diagnostics) */
export function getAlbumArtPaletteCacheSize() {
  return albumArtPaletteCache.size;
}

/**
 * Sample album art and derive gradient + text-friendly palette for Spotify UI.
 * Thin wrapper over extractImagePalette (shared wallpaper / ambient pipeline).
 *
 * @param {string} imageUrl
 * @returns {Promise<{
 *   gradient: string,
 *   blurredBackground: string,
 *   colors: { primary: string, secondary: string, accent: string, text: string, textSecondary: string }
 * } | null>}
 */
export function extractColorsFromAlbumArt(imageUrl) {
  const key = String(imageUrl || '');
  if (!key) return Promise.resolve(null);

  const cached = albumArtPaletteCache.get(key);
  if (cached) {
    // LRU touch — re-insert so the oldest entry is evicted first.
    albumArtPaletteCache.delete(key);
    albumArtPaletteCache.set(key, cached);
    return cached;
  }

  const request = extractImagePalette(imageUrl).then((result) => {
    if (!result) {
      // Do not memoize failures — a transient load error should retry next time.
      albumArtPaletteCache.delete(key);
      return null;
    }
    return {
      gradient: result.gradient,
      blurredBackground: result.blurredBackground,
      colors: {
        primary: result.palette.primaryRgb,
        secondary: result.palette.secondaryRgb,
        accent: result.palette.accentRgb,
        text: result.palette.text || ALBUM_ART_TEXT_ON_DARK,
        textSecondary: result.palette.textSecondary || ALBUM_ART_TEXT_ON_DARK_SECONDARY,
      },
    };
  }).catch((error) => {
    albumArtPaletteCache.delete(key);
    throw error;
  });

  albumArtPaletteCache.set(key, request);
  while (albumArtPaletteCache.size > ALBUM_ART_PALETTE_CACHE_MAX) {
    albumArtPaletteCache.delete(albumArtPaletteCache.keys().next().value);
  }
  return request;
}

// Re-export contrast constants for callers that imported via this module historically.
export {
  ALBUM_ART_TEXT_ON_DARK,
  ALBUM_ART_TEXT_ON_DARK_SECONDARY,
  ALBUM_ART_TEXT_ON_LIGHT,
  ALBUM_ART_TEXT_ON_LIGHT_SECONDARY,
};
