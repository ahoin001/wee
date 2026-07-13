import {
  ALBUM_ART_TEXT_ON_DARK,
  ALBUM_ART_TEXT_ON_DARK_SECONDARY,
  ALBUM_ART_TEXT_ON_LIGHT,
  ALBUM_ART_TEXT_ON_LIGHT_SECONDARY,
} from '../design/albumArtContrastColors.js';
import { extractImagePalette } from './theme/extractImagePalette.js';

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
  return extractImagePalette(imageUrl).then((result) => {
    if (!result) return null;
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
  });
}

// Re-export contrast constants for callers that imported via this module historically.
export {
  ALBUM_ART_TEXT_ON_DARK,
  ALBUM_ART_TEXT_ON_DARK_SECONDARY,
  ALBUM_ART_TEXT_ON_LIGHT,
  ALBUM_ART_TEXT_ON_LIGHT_SECONDARY,
};
