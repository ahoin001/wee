/**
 * Maps the persisted ribbon "glow / accent" hex to global HSL CSS variables so primary
 * buttons, borders, tints, and scrollbar active color follow one themeable brand color.
 *
 * Default hex matches `DEFAULT_RIBBON_GLOW_HEX` / design-system `--wii-blue`.
 *
 * Bright extractions (pale yellow, mint) are clamped for contrast against white
 * `--text-on-accent` before writing UI tokens — ribbon/ambient washes stay raw.
 */
import { DEFAULT_RIBBON_GLOW_HEX } from '../../design/runtimeColorStrings.js';

/** Floor so near-black extractions stay lively as button fills. */
const ACCENT_L_FLOOR = 28;
/** Soft floor so washed-out greys still read as an accent. */
const ACCENT_S_FLOOR = 32;
/** Dark-mode accent text / link hover must stay readable on dark surfaces. */
const TEXT_ACCENT_L_FLOOR_DARK = 58;

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

/** @returns {{ r: number, g: number, b: number }} */
function hslToRgb(h, s, l) {
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) {
    rp = c;
    gp = x;
  } else if (h < 120) {
    rp = x;
    gp = c;
  } else if (h < 180) {
    gp = c;
    bp = x;
  } else if (h < 240) {
    gp = x;
    bp = c;
  } else if (h < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function srgbChannelToLinear(channel) {
  const n = channel / 255;
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(r, g, b) {
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  );
}

/** Contrast ratio of `rgb` against pure white (WCAG). */
function contrastVsWhite(r, g, b) {
  const L = relativeLuminance(r, g, b);
  return (1.05) / (L + 0.05);
}

/**
 * Target contrast vs white — match default Console Cyan so that hue is untouched
 * when it already passes (default / most blues / reds / purples).
 */
const DEFAULT_ACCENT_RGB = hexToRgb(DEFAULT_RIBBON_GLOW_HEX) || { r: 0, g: 153, b: 255 };
const MIN_ACCENT_CONTRAST_VS_WHITE = contrastVsWhite(
  DEFAULT_ACCENT_RGB.r,
  DEFAULT_ACCENT_RGB.g,
  DEFAULT_ACCENT_RGB.b
);

/**
 * Darken (and lightly re-saturate) an accent until white label text is at least
 * as readable as on the default Console Cyan fill. Hue-aware — HSL L caps alone
 * leave yellow/mint illegible.
 *
 * @param {{ h: number, s: number, l: number }} hsl
 * @returns {{ h: number, s: number, l: number }}
 */
export function ensureAccentContrast(hsl) {
  const next = {
    h: ((hsl.h % 360) + 360) % 360,
    s: Math.max(0, Math.min(100, hsl.s)),
    // Raise near-black so button fills stay lively; do not change passing hues otherwise.
    l: Math.max(ACCENT_L_FLOOR, Math.min(100, hsl.l)),
  };

  let rgb = hslToRgb(next.h, next.s, next.l);
  if (contrastVsWhite(rgb.r, rgb.g, rgb.b) >= MIN_ACCENT_CONTRAST_VS_WHITE) {
    return next;
  }

  // Failed contrast — soft S floor then step L down until white text is readable.
  next.s = Math.max(ACCENT_S_FLOOR, next.s);
  rgb = hslToRgb(next.h, next.s, next.l);
  let guard = 0;
  while (
    contrastVsWhite(rgb.r, rgb.g, rgb.b) < MIN_ACCENT_CONTRAST_VS_WHITE &&
    next.l > ACCENT_L_FLOOR &&
    guard < 100
  ) {
    next.l -= 1;
    rgb = hslToRgb(next.h, next.s, next.l);
    guard += 1;
  }

  return next;
}

function fmt(hsl) {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

function adjustL(hsl, delta) {
  return { ...hsl, l: Math.max(0, Math.min(100, hsl.l + delta)) };
}

function fmtRgb({ r, g, b }) {
  return `${r} ${g} ${b}`;
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

  const raw = rgbToHslComponents(rgb.r, rgb.g, rgb.b);
  const base = ensureAccentContrast(raw);
  const baseRgb = hslToRgb(base.h, base.s, base.l);

  const hover = adjustL(base, -5);
  const active = adjustL(base, -10);
  let textAccent = adjustL(base, isDarkMode ? 12 : 0);
  let linkHover = adjustL(base, isDarkMode ? 8 : -6);
  if (isDarkMode) {
    if (textAccent.l < TEXT_ACCENT_L_FLOOR_DARK) {
      textAccent = { ...textAccent, l: TEXT_ACCENT_L_FLOOR_DARK };
    }
    if (linkHover.l < TEXT_ACCENT_L_FLOOR_DARK) {
      linkHover = { ...linkHover, l: TEXT_ACCENT_L_FLOOR_DARK };
    }
  }

  const baseStr = fmt(base);
  const hoverStr = fmt(hover);
  const activeStr = fmt(active);
  const primaryRgb = fmtRgb(baseRgb);

  root.style.setProperty('--wii-blue', baseStr);
  root.style.setProperty('--wii-blue-hover', hoverStr);
  root.style.setProperty('--wii-blue-active', activeStr);
  root.style.setProperty('--primary', baseStr);
  root.style.setProperty('--primary-hover', hoverStr);
  root.style.setProperty('--primary-active', activeStr);
  root.style.setProperty('--primary-rgb', primaryRgb);
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
