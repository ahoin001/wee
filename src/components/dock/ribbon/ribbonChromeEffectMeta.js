/**
 * Ribbon chrome FX catalog — single source of truth for ids, labels, and
 * per-effect intensity/speed defaults (applied when the user picks a new mode).
 */

export const RIBBON_CHROME_EFFECTS = [
  'none',
  'shimmer',
  'pulse',
  'neonTrace',
  'aurora',
  'ripple',
  'edgeEmber',
  'scanline',
  'sparkle',
  'frost',
  'spectrum',
];

/** @type {Record<string, { id: string, label: string, defaultIntensity: number, defaultSpeed: number }>} */
const META_BY_ID = {
  none: { id: 'none', label: 'None', defaultIntensity: 0.55, defaultSpeed: 1 },
  shimmer: { id: 'shimmer', label: 'Shimmer', defaultIntensity: 0.55, defaultSpeed: 1 },
  pulse: { id: 'pulse', label: 'Pulse', defaultIntensity: 0.6, defaultSpeed: 0.85 },
  neonTrace: { id: 'neonTrace', label: 'Neon trace', defaultIntensity: 0.65, defaultSpeed: 0.7 },
  aurora: { id: 'aurora', label: 'Aurora', defaultIntensity: 0.5, defaultSpeed: 0.75 },
  ripple: { id: 'ripple', label: 'Ripple', defaultIntensity: 0.45, defaultSpeed: 0.65 },
  edgeEmber: { id: 'edgeEmber', label: 'Edge ember', defaultIntensity: 0.55, defaultSpeed: 0.8 },
  scanline: { id: 'scanline', label: 'Scanline', defaultIntensity: 0.35, defaultSpeed: 0.55 },
  sparkle: { id: 'sparkle', label: 'Sparkle', defaultIntensity: 0.5, defaultSpeed: 1.1 },
  frost: { id: 'frost', label: 'Frost', defaultIntensity: 0.45, defaultSpeed: 0.7 },
  spectrum: { id: 'spectrum', label: 'Spectrum', defaultIntensity: 0.5, defaultSpeed: 0.6 },
};

/** Milliseconds after unhover before Idle-only FX start animating. */
export const RIBBON_CHROME_IDLE_DELAY_MS = 2500;

/** Hover dampen multiplier when Idle only is off (keeps FX from fighting gooey buttons). */
export const RIBBON_CHROME_HOVER_DAMPEN = 0.55;

/**
 * @param {string} [id]
 * @returns {{ id: string, label: string, defaultIntensity: number, defaultSpeed: number }}
 */
export function getRibbonChromeEffectMeta(id) {
  return META_BY_ID[id] || META_BY_ID.none;
}

/** Options for WeeSegmentedControl / pickers (excludes nothing — includes None). */
export function getRibbonChromeEffectOptions() {
  return RIBBON_CHROME_EFFECTS.map((id) => ({
    value: id,
    label: META_BY_ID[id].label,
  }));
}

export function isRibbonChromeEffectId(id) {
  return RIBBON_CHROME_EFFECTS.includes(id);
}
