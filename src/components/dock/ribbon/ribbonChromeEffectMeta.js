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

/** Soft atmospheric modes that need a glass intensity boost to stay readable. */
export const RIBBON_CHROME_GLASS_SOFT_MODES = [
  'shimmer',
  'pulse',
  'aurora',
  'ripple',
  'scanline',
  'frost',
];

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   description: string,
 *   defaultIntensity: number,
 *   defaultSpeed: number,
 *   defaultIntensityGlass?: number,
 *   defaultSpeedGlass?: number,
 *   defaultGlowStrength?: number,
 * }} RibbonChromeEffectMeta
 */

/** @type {Record<string, RibbonChromeEffectMeta>} */
const META_BY_ID = {
  none: {
    id: 'none',
    label: 'None',
    description: 'No chrome surface effect.',
    defaultIntensity: 0.55,
    defaultSpeed: 1,
  },
  shimmer: {
    id: 'shimmer',
    label: 'Shimmer',
    description: 'A soft highlight sweep across the ribbon face.',
    defaultIntensity: 0.55,
    defaultSpeed: 1,
    defaultIntensityGlass: 0.7,
  },
  pulse: {
    id: 'pulse',
    label: 'Pulse',
    description: 'Gentle heartbeat glow that fills the silhouette.',
    defaultIntensity: 0.65,
    defaultSpeed: 0.85,
    defaultIntensityGlass: 0.8,
  },
  neonTrace: {
    id: 'neonTrace',
    label: 'Neon trace',
    description: 'A light traces left→right along the ribbon bow, leaving a neon trail.',
    defaultIntensity: 0.65,
    defaultSpeed: 0.7,
    /** Bloom / tip glow (0–1); separate from overall intensity. */
    defaultGlowStrength: 0.7,
  },
  aurora: {
    id: 'aurora',
    label: 'Aurora',
    description: 'Drifting color bands layered over the ribbon.',
    defaultIntensity: 0.65,
    defaultSpeed: 0.9,
    defaultIntensityGlass: 0.8,
    defaultSpeedGlass: 0.95,
  },
  ripple: {
    id: 'ripple',
    label: 'Ripple',
    description: 'Soft caustic pools that slowly breathe.',
    defaultIntensity: 0.55,
    defaultSpeed: 0.7,
    defaultIntensityGlass: 0.72,
  },
  edgeEmber: {
    id: 'edgeEmber',
    label: 'Edge ember',
    description: 'Warm ember glow pooled toward the ribbon edge.',
    defaultIntensity: 0.55,
    defaultSpeed: 0.8,
  },
  scanline: {
    id: 'scanline',
    label: 'Scanline',
    description: 'A thin scan bar sweeping the ribbon body.',
    defaultIntensity: 0.5,
    defaultSpeed: 0.6,
    defaultIntensityGlass: 0.65,
  },
  sparkle: {
    id: 'sparkle',
    label: 'Sparkle',
    description: 'Twinkling points along the top ribbon edge.',
    defaultIntensity: 0.5,
    defaultSpeed: 1.1,
  },
  frost: {
    id: 'frost',
    label: 'Frost',
    description: 'Soft ice veil with a cool crystalline rim.',
    defaultIntensity: 0.6,
    defaultSpeed: 0.75,
    defaultIntensityGlass: 0.78,
    defaultSpeedGlass: 0.8,
  },
  spectrum: {
    id: 'spectrum',
    label: 'Spectrum',
    description: 'Slow hue shift across the ribbon fill and edge.',
    defaultIntensity: 0.5,
    defaultSpeed: 0.6,
  },
};

/** Milliseconds after unhover before Idle-only FX start animating. */
export const RIBBON_CHROME_IDLE_DELAY_MS = 2500;

/** Hover dampen multiplier when Idle only is off (keeps FX from fighting gooey buttons). */
export const RIBBON_CHROME_HOVER_DAMPEN = 0.55;

/** Runtime glass intensity multiplier applied on top of user intensity for soft modes. */
export const RIBBON_CHROME_GLASS_INTENSITY_MULT = 1.4;

/**
 * @param {string} [id]
 * @returns {RibbonChromeEffectMeta}
 */
export function getRibbonChromeEffectMeta(id) {
  return META_BY_ID[id] || META_BY_ID.none;
}

/** Default neon-trace bloom when unset (0–1). */
export const RIBBON_CHROME_DEFAULT_GLOW_STRENGTH = 0.7;

/**
 * Defaults applied when the user picks a chrome mode.
 * Soft modes use glass-aware intensity/speed when glass ribbon is on.
 * @param {string} [id]
 * @param {{ glass?: boolean }} [opts]
 * @returns {{ intensity: number, speed: number, glowStrength: number }}
 */
export function getRibbonChromeEffectDefaults(id, { glass = false } = {}) {
  const meta = getRibbonChromeEffectMeta(id);
  const useGlass = Boolean(glass) && RIBBON_CHROME_GLASS_SOFT_MODES.includes(meta.id);
  return {
    intensity: useGlass
      ? (meta.defaultIntensityGlass ?? meta.defaultIntensity)
      : meta.defaultIntensity,
    speed: useGlass ? (meta.defaultSpeedGlass ?? meta.defaultSpeed) : meta.defaultSpeed,
    glowStrength: meta.defaultGlowStrength ?? RIBBON_CHROME_DEFAULT_GLOW_STRENGTH,
  };
}

export function isRibbonChromeGlassSoftMode(id) {
  return RIBBON_CHROME_GLASS_SOFT_MODES.includes(id);
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
