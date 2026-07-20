/**
 * Always-on album-art paint for Now Playing chrome + Listening Stage.
 * Uses `spotify.extractedColors` (from useNowPlayingColorMatch) — not toggleable.
 */
import {
  ALBUM_ART_TEXT_ON_DARK,
  ALBUM_ART_TEXT_ON_DARK_SECONDARY,
} from '../design/albumArtContrastColors.js';

/**
 * @param {unknown} textColor
 * @returns {boolean}
 */
export function isAlbumArtLightText(textColor) {
  const t = String(textColor || '').trim().toLowerCase();
  return (
    t === '#ffffff' ||
    t === '#fff' ||
    t === ALBUM_ART_TEXT_ON_DARK.toLowerCase() ||
    t === ALBUM_ART_TEXT_ON_DARK_SECONDARY.toLowerCase()
  );
}

/**
 * @typedef {object} NowPlayingAlbumPaint
 * @property {string} primary
 * @property {string} secondary
 * @property {string} accent
 * @property {string} text
 * @property {string} textSecondary
 * @property {string} textTertiary
 * @property {string} textShadow
 * @property {Record<string, string>} cssVars
 */

/**
 * @param {{ primary?: string, secondary?: string, accent?: string, text?: string, textSecondary?: string } | null | undefined} extractedColors
 * @returns {NowPlayingAlbumPaint | null}
 */
export function resolveNowPlayingAlbumPaint(extractedColors) {
  if (!extractedColors || typeof extractedColors !== 'object') return null;
  const primary = typeof extractedColors.primary === 'string' ? extractedColors.primary.trim() : '';
  if (!primary) return null;

  const secondary =
    (typeof extractedColors.secondary === 'string' && extractedColors.secondary.trim()) ||
    primary;
  const accent =
    (typeof extractedColors.accent === 'string' && extractedColors.accent.trim()) || primary;
  const text =
    (typeof extractedColors.text === 'string' && extractedColors.text.trim()) ||
    ALBUM_ART_TEXT_ON_DARK;
  const textSecondary =
    (typeof extractedColors.textSecondary === 'string' &&
      extractedColors.textSecondary.trim()) ||
    ALBUM_ART_TEXT_ON_DARK_SECONDARY;
  const light = isAlbumArtLightText(text);

  return {
    primary,
    secondary,
    accent,
    text,
    textSecondary,
    // Soft meta line — still keyed off album contrast heuristic (hex OK in design paint path).
    textTertiary: light ? 'rgba(255, 255, 255, 0.68)' : 'rgba(0, 0, 0, 0.58)',
    textShadow: light
      ? '0 1px 18px rgba(0, 0, 0, 0.55), 0 0 2px rgba(0, 0, 0, 0.4)'
      : '0 1px 16px rgba(255, 255, 255, 0.4), 0 0 1px rgba(255, 255, 255, 0.25)',
    cssVars: {
      '--np-accent': primary,
      '--np-accent-secondary': secondary,
      '--np-accent-glow': accent,
      '--np-text': text,
      '--np-text-secondary': textSecondary,
    },
  };
}

/**
 * Fallback when art has not been sampled yet — keeps light UI readable.
 * @returns {NowPlayingAlbumPaint}
 */
export function defaultNowPlayingAlbumPaint() {
  return {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--ambient-secondary, var(--primary)))',
    accent: 'hsl(var(--primary))',
    text: 'hsl(var(--text-primary))',
    textSecondary: 'hsl(var(--text-secondary))',
    textTertiary: 'hsl(var(--text-tertiary))',
    textShadow: 'none',
    cssVars: {},
  };
}

