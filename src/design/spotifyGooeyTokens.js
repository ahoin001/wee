/**
 * Runtime CSS variables for the gooey Spotify floating widget (hub-widget parity).
 * Non-dynamic: Classic Mint (app dark) / Daylight Mint (app light) from gooeyHubMintPalettes.
 */
import { CSS_COLOR_PURE_BLACK } from './runtimeColorStrings.js';
import { SPOTIFY_WIDGET_DEFAULT_DYNAMIC_COLORS } from '../utils/spotifyWidgetSettings.js';
import { getGooeyMintPalette } from './gooeyHubMintPalettes.js';

/** @param {string} rgbStr e.g. rgb(29, 185, 84) */
function glowFromPrimary(rgbStr) {
  const m = String(rgbStr).match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (!m) return 'rgba(29, 185, 84, 0.3)';
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, 0.3)`;
}

/**
 * @param {object} opts
 * @param {boolean} opts.dynamicColorsEnabled
 * @param {'player'|'browse'|'settings'} opts.currentPage
 * @param {{ primary?: string, secondary?: string, accent?: string, text?: string, textSecondary?: string } | null} opts.dynamicColors
 * @param {boolean} opts.hasAlbumArt
 * @param {boolean} opts.isDarkMode — app theme; when not using extracted colors, picks Classic vs Daylight mint
 * @returns {React.CSSProperties}
 */
export function buildSpotifyGooeyStyleVars({
  dynamicColorsEnabled,
  currentPage,
  dynamicColors,
  hasAlbumArt,
  isDarkMode,
}) {
  const defaults = SPOTIFY_WIDGET_DEFAULT_DYNAMIC_COLORS;
  const mint = getGooeyMintPalette(isDarkMode);
  const useExtracted = Boolean(
    dynamicColorsEnabled && hasAlbumArt && dynamicColors?.primary && currentPage === 'player'
  );

  if (useExtracted && dynamicColors) {
    const primary = dynamicColors.primary;
    const glow = glowFromPrimary(primary);
    return {
      '--spotify-gooey-bg': dynamicColors.secondary || mint.bg,
      '--spotify-gooey-primary': primary,
      '--spotify-gooey-secondary': dynamicColors.secondary || primary,
      '--spotify-gooey-accent': dynamicColors.accent || defaults.accent,
      '--spotify-gooey-text': dynamicColors.text || defaults.text,
      '--spotify-gooey-text-secondary': dynamicColors.textSecondary || defaults.textSecondary,
      '--spotify-gooey-glow': glow,
      '--spotify-gooey-surface': 'hsl(var(--color-pure-white) / 0.08)',
      '--spotify-gooey-surface-hover': 'hsl(var(--color-pure-white) / 0.12)',
      '--spotify-gooey-border': 'hsl(var(--color-pure-white) / 0.1)',
      '--spotify-gooey-contrast-on-primary': CSS_COLOR_PURE_BLACK,
      '--spotify-gooey-play-fill': dynamicColors.text || mint.textPrimary,
      '--spotify-gooey-play-color': mint.bg,
      '--spotify-dyn-primary': primary,
      '--spotify-dyn-accent': dynamicColors.accent || defaults.accent,
      '--spotify-dyn-text': dynamicColors.text || defaults.text,
      '--glow-primary': primary,
      '--glow-secondary': dynamicColors.secondary || primary,
    };
  }

  return {
    '--spotify-gooey-bg': mint.bg,
    '--spotify-gooey-primary': mint.primary,
    '--spotify-gooey-secondary': mint.primary,
    '--spotify-gooey-accent': mint.primary,
    '--spotify-gooey-text': mint.textPrimary,
    '--spotify-gooey-text-secondary': mint.textSecondary,
    '--spotify-gooey-glow': mint.glow,
    '--spotify-gooey-surface': mint.surface,
    '--spotify-gooey-surface-hover': mint.surfaceHover,
    '--spotify-gooey-border': mint.border,
    '--spotify-gooey-contrast-on-primary': mint.contrastOnPrimary,
    /** Hub player CTA: fill = textPrimary, icon = bg */
    '--spotify-gooey-play-fill': mint.textPrimary,
    '--spotify-gooey-play-color': mint.bg,
    '--spotify-dyn-primary': mint.primary,
    '--spotify-dyn-accent': mint.primary,
    '--spotify-dyn-text': mint.textPrimary,
    '--glow-primary': mint.primary,
    '--glow-secondary': mint.primary,
  };
}

/**
 * Shell background for GooeyFloatingPanel (solid mint / gradient when dynamic).
 */
export function getSpotifyGooeyShellBackground({
  currentPage,
  dynamicColorsEnabled,
  dynamicBackgroundGradient,
  hasAlbumArt,
  dynamicColors,
  isDarkMode,
}) {
  const useExtracted = Boolean(
    dynamicColorsEnabled && hasAlbumArt && dynamicColors?.primary && currentPage === 'player'
  );

  if (useExtracted && dynamicBackgroundGradient) {
    return dynamicBackgroundGradient;
  }
  if (useExtracted && dynamicColors?.primary && dynamicColors?.secondary) {
    return `linear-gradient(135deg, ${dynamicColors.primary} 0%, ${dynamicColors.secondary} 100%)`;
  }
  return getGooeyMintPalette(isDarkMode).bg;
}
