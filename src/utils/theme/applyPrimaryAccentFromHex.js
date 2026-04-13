/**
 * Maps the persisted ribbon "glow / accent" hex to global HSL CSS variables so primary
 * buttons, borders, tints, and scrollbar active color follow one themeable brand color.
 *
 * Default hex matches `DEFAULT_RIBBON_GLOW_HEX` / design-system `--wii-blue`.
 */
import { DEFAULT_RIBBON_GLOW_HEX } from '../../design/runtimeColorStrings.js';

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const normalized = hex.trim().replace('#', '');
  if (normalized.length !== 6) return null;
  const n = parseInt(normalized, 16);
  if (Number.isNaN(n)) return null;
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

/** @returns {{ h: number, s: number, l: number }} HSL in 0–360 / 0–100 / 0–100 */
export function rgbToHslComponents(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function fmt(hsl) {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

function adjustL(hsl, delta) {
  return { ...hsl, l: Math.max(0, Math.min(100, hsl.l + delta)) };
}

/**
 * Writes HSL components (space-separated, no `hsl()`) to :root for Tailwind + CSS use.
 * @param {string} [hex]
 * @param {{ isDarkMode?: boolean }} [opts]
 */
export function applyPrimaryAccentFromHex(hex, opts = {}) {
  const { isDarkMode = false } = opts;
  const rgb = hexToRgb(hex || DEFAULT_RIBBON_GLOW_HEX);
  const root = document.documentElement;

  if (!rgb) {
    applyPrimaryAccentFromHex(DEFAULT_RIBBON_GLOW_HEX, opts);
    return;
  }

  const base = rgbToHslComponents(rgb.r, rgb.g, rgb.b);
  const hover = adjustL(base, -5);
  const active = adjustL(base, -10);
  const textAccent = adjustL(base, isDarkMode ? 12 : 0);
  const linkHover = adjustL(base, isDarkMode ? 8 : -6);

  const baseStr = fmt(base);
  const hoverStr = fmt(hover);
  const activeStr = fmt(active);

  root.style.setProperty('--wii-blue', baseStr);
  root.style.setProperty('--wii-blue-hover', hoverStr);
  root.style.setProperty('--wii-blue-active', activeStr);
  root.style.setProperty('--primary', baseStr);
  root.style.setProperty('--primary-hover', hoverStr);
  root.style.setProperty('--primary-active', activeStr);
  root.style.setProperty('--border-accent', baseStr);
  root.style.setProperty('--text-accent', fmt(textAccent));
  root.style.setProperty('--scrollbar-thumb-active', fmt(adjustL(base, -4)));
  root.style.setProperty('--link', baseStr);
  root.style.setProperty('--link-hover', fmt(linkHover));

  if (isDarkMode) {
    root.style.setProperty('--surface-wii-tint', `${base.h} 40% 18%`);
  } else {
    root.style.setProperty('--surface-wii-tint', `${base.h} 100% 97%`);
  }
}
