/**
 * Shared image → ambient palette (wallpaper + album art).
 * Outputs hex for applyPrimaryAccentFromHex; rgb strings for Spotify UI compat.
 */

import {
  ALBUM_ART_TEXT_ON_DARK,
  ALBUM_ART_TEXT_ON_DARK_SECONDARY,
  ALBUM_ART_TEXT_ON_LIGHT,
  ALBUM_ART_TEXT_ON_LIGHT_SECONDARY,
} from '../../design/albumArtContrastColors.js';
import { rgbToHslComponents } from './applyPrimaryAccentFromHex.js';

export function rgbComponentsToHex(r, g, b) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;
}

export function colorStringToHex(color) {
  if (!color || typeof color !== 'string') return null;
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return rgbComponentsToHex(Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3]));
  }
  return null;
}

function rgbToCss(r, g, b) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function quantizeKey(r, g, b) {
  return `${r >> 4},${g >> 4},${b >> 4}`;
}

/**
 * @param {string} imageUrl
 * @returns {Promise<{
 *   seedHex: string,
 *   seeds: string[],
 *   palette: {
 *     primary: string,
 *     secondary: string,
 *     accent: string,
 *     surfaceHint: string,
 *     primaryRgb: string,
 *     secondaryRgb: string,
 *     accentRgb: string,
 *     text: string,
 *     textSecondary: string,
 *   },
 *   gradient: string,
 *   blurredBackground: string,
 * } | null>}
 */
export function extractImagePalette(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height) || 1;
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const buckets = new Map();
        const step = 5;

        for (let i = 0; i < data.length; i += step * 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          const sum = r + g + b;
          if (a <= 128 || sum <= 100 || sum >= 700) continue;

          const key = quantizeKey(r, g, b);
          const prev = buckets.get(key);
          if (prev) {
            prev.count += 1;
            prev.r += r;
            prev.g += g;
            prev.b += b;
          } else {
            buckets.set(key, { count: 1, r, g, b });
          }
        }

        if (buckets.size === 0) {
          resolve(null);
          return;
        }

        const ranked = [...buckets.values()]
          .map((bucket) => ({
            count: bucket.count,
            r: Math.round(bucket.r / bucket.count),
            g: Math.round(bucket.g / bucket.count),
            b: Math.round(bucket.b / bucket.count),
          }))
          .sort((a, b) => b.count - a.count);

        const boost = 1.3;
        const avg = ranked[0];
        const primaryR = Math.min(255, Math.round(avg.r * boost));
        const primaryG = Math.min(255, Math.round(avg.g * boost));
        const primaryB = Math.min(255, Math.round(avg.b * boost));

        const secondaryR = Math.max(0, primaryR - 40);
        const secondaryG = Math.max(0, primaryG - 40);
        const secondaryB = Math.max(0, primaryB - 40);

        const accentR = Math.min(255, primaryR + 50);
        const accentG = Math.min(255, primaryG + 50);
        const accentB = Math.min(255, primaryB + 50);

        const surfaceR = Math.min(255, Math.round(primaryR * 0.55 + 80));
        const surfaceG = Math.min(255, Math.round(primaryG * 0.55 + 80));
        const surfaceB = Math.min(255, Math.round(primaryB * 0.55 + 80));

        const brightness = (primaryR * 299 + primaryG * 587 + primaryB * 114) / 1000;
        const textColor =
          brightness > 128 ? ALBUM_ART_TEXT_ON_LIGHT : ALBUM_ART_TEXT_ON_DARK;
        const textSecondaryColor =
          brightness > 128
            ? ALBUM_ART_TEXT_ON_LIGHT_SECONDARY
            : ALBUM_ART_TEXT_ON_DARK_SECONDARY;

        const seedHex = rgbComponentsToHex(primaryR, primaryG, primaryB);
        const seeds = [];
        const seen = new Set([seedHex]);
        for (const candidate of ranked.slice(0, 8)) {
          const hex = rgbComponentsToHex(
            Math.min(255, Math.round(candidate.r * boost)),
            Math.min(255, Math.round(candidate.g * boost)),
            Math.min(255, Math.round(candidate.b * boost))
          );
          if (seen.has(hex)) continue;
          seen.add(hex);
          seeds.push(hex);
          if (seeds.length >= 5) break;
        }

        const gradient = `linear-gradient(135deg, 
              rgba(${primaryR}, ${primaryG}, ${primaryB}, 1) 0%, 
              rgba(${Math.max(0, primaryR - 60)}, ${Math.max(0, primaryG - 60)}, ${Math.max(0, primaryB - 60)}, 0.95) 30%,
              rgba(${Math.max(0, primaryR - 120)}, ${Math.max(0, primaryG - 120)}, ${Math.max(0, primaryB - 120)}, 0.9) 70%,
              rgba(${Math.max(0, primaryR - 180)}, ${Math.max(0, primaryG - 180)}, ${Math.max(0, primaryB - 180)}, 0.85) 100%)`;

        const blurredBackground = `linear-gradient(135deg, 
              rgba(${primaryR}, ${primaryG}, ${primaryB}, 0.8) 0%, 
              rgba(${Math.max(0, primaryR - 40)}, ${Math.max(0, primaryG - 40)}, ${Math.max(0, primaryB - 40)}, 0.6) 100%)`;

        resolve({
          seedHex,
          seeds,
          palette: {
            primary: seedHex,
            secondary: rgbComponentsToHex(secondaryR, secondaryG, secondaryB),
            accent: rgbComponentsToHex(accentR, accentG, accentB),
            surfaceHint: rgbComponentsToHex(surfaceR, surfaceG, surfaceB),
            primaryRgb: rgbToCss(primaryR, primaryG, primaryB),
            secondaryRgb: rgbToCss(secondaryR, secondaryG, secondaryB),
            accentRgb: rgbToCss(accentR, accentG, accentB),
            text: textColor,
            textSecondary: textSecondaryColor,
          },
          gradient,
          blurredBackground,
        });
      } catch (error) {
        console.error('[extractImagePalette] Failed to extract colors:', error);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = imageUrl;
  });
}

/**
 * Apply optional ambient secondary/accent CSS roles (HSL components).
 * @param {{ secondary?: string, accent?: string } | null} palette
 * @param {{ clear?: boolean }} [opts]
 */
export function applyAmbientRoleTokens(palette, opts = {}) {
  const root = document.documentElement;
  if (opts.clear || !palette) {
    root.style.removeProperty('--ambient-secondary');
    root.style.removeProperty('--ambient-accent');
    return;
  }

  const secondaryHex = colorStringToHex(palette.secondary);
  const accentHex = colorStringToHex(palette.accent);
  if (secondaryHex) {
    const rgb = secondaryHex.match(/^#([0-9a-f]{6})$/i);
    if (rgb) {
      const n = parseInt(rgb[1], 16);
      const hsl = rgbToHslComponents((n >> 16) & 255, (n >> 8) & 255, n & 255);
      root.style.setProperty('--ambient-secondary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
  }
  if (accentHex) {
    const rgb = accentHex.match(/^#([0-9a-f]{6})$/i);
    if (rgb) {
      const n = parseInt(rgb[1], 16);
      const hsl = rgbToHslComponents((n >> 16) & 255, (n >> 8) & 255, n & 255);
      root.style.setProperty('--ambient-accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
  }
}

export const DEFAULT_AMBIENT_COLOR = Object.freeze({
  wallpaperMatchEnabled: false,
  source: 'manual',
  seedHex: null,
  palette: null,
  cachedForUrl: null,
  seeds: [],
});
