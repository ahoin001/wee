/**
 * Single accent choke point: Spotify → wallpaper → manual ribbon glow → default.
 */

import { DEFAULT_RIBBON_GLOW_HEX } from '../../design/runtimeColorStrings.js';
import { colorStringToHex } from './extractImagePalette.js';

/**
 * @param {{
 *   wallpaperMatchEnabled?: boolean,
 *   ambientPalette?: { primary?: string, accent?: string } | null,
 *   spotifyMatchEnabled?: boolean,
 *   spotifyColors?: { accent?: string, primary?: string } | null,
 *   dynamicRibbonColorEnabled?: boolean,
 *   ribbonGlowColor?: string | null,
 * }} input
 * @returns {{ hex: string, source: 'spotify' | 'wallpaper' | 'manual' | 'default' }}
 */
export function resolveEffectiveAccent(input = {}) {
  const {
    wallpaperMatchEnabled = false,
    ambientPalette = null,
    spotifyMatchEnabled = false,
    spotifyColors = null,
    dynamicRibbonColorEnabled = false,
    ribbonGlowColor = null,
  } = input;

  if (spotifyMatchEnabled && spotifyColors) {
    const fromSpotify =
      colorStringToHex(spotifyColors.accent) || colorStringToHex(spotifyColors.primary);
    if (fromSpotify) {
      return { hex: fromSpotify, source: 'spotify' };
    }
  }

  if (wallpaperMatchEnabled && ambientPalette) {
    const fromWallpaper =
      colorStringToHex(ambientPalette.primary) || colorStringToHex(ambientPalette.accent);
    if (fromWallpaper) {
      return { hex: fromWallpaper, source: 'wallpaper' };
    }
  }

  if (dynamicRibbonColorEnabled && ribbonGlowColor) {
    const fromRibbon = colorStringToHex(ribbonGlowColor);
    if (fromRibbon) {
      return { hex: fromRibbon, source: 'manual' };
    }
  }

  return { hex: DEFAULT_RIBBON_GLOW_HEX, source: 'default' };
}

/**
 * Resolve display wallpaper URL the same way as IsolatedWallpaperBackground.
 */
export function resolveDisplayWallpaperUrl({
  activeSpaceId,
  wallpaperCurrent,
  appearanceBySpace,
  wallpaperEntryUrlKey,
}) {
  const activeSpaceAppearance = appearanceBySpace?.[activeSpaceId]?.wallpaper || null;
  const useGlobalWallpaper = activeSpaceAppearance?.useGlobalWallpaper !== false;
  const isHomeShellSpace = activeSpaceId === 'home';
  const spaceWallpaperUrl =
    isHomeShellSpace
      ? null
      : !useGlobalWallpaper && typeof activeSpaceAppearance?.spaceWallpaperUrl === 'string'
        ? activeSpaceAppearance.spaceWallpaperUrl
        : null;
  const globalWallpaperUrl = wallpaperCurrent
    ? wallpaperEntryUrlKey(wallpaperCurrent) || null
    : null;
  return spaceWallpaperUrl || globalWallpaperUrl || null;
}
