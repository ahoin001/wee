/**
 * Ribbon dock FX catalog — single source of truth for ids, labels, and
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
  'spectrum',
  'musicBand',
];

/** Soft atmospheric modes that need a glass intensity boost to stay readable. */
export const RIBBON_CHROME_GLASS_SOFT_MODES = [
  'shimmer',
  'pulse',
  'aurora',
  'ripple',
  'scanline',
  'edgeEmber',
  'sparkle',
  'musicBand',
];

/** Neon race color modes — mono glow, dual opposite comets, or spectrum chase. */
export const RIBBON_NEON_COLOR_MODES = ['mono', 'duo', 'spectrum'];

export const RIBBON_NEON_COLOR_MODE_OPTIONS = [
  { value: 'mono', label: 'Mono' },
  { value: 'duo', label: 'Duo' },
  { value: 'spectrum', label: 'Spectrum' },
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
 *   defaultNeonColorMode?: string,
 * }} RibbonChromeEffectMeta
 */

/** @type {Record<string, RibbonChromeEffectMeta>} */
const META_BY_ID = {
  none: {
    id: 'none',
    label: 'None',
    description: 'No ribbon dock surface effect.',
    defaultIntensity: 0.55,
    defaultSpeed: 1,
  },
  shimmer: {
    id: 'shimmer',
    label: 'Shimmer',
    description: 'A soft highlight that tiles seamlessly across the ribbon face.',
    defaultIntensity: 0.55,
    defaultSpeed: 1,
    defaultIntensityGlass: 0.7,
  },
  pulse: {
    id: 'pulse',
    label: 'Pulse',
    description: 'A calm breathing glow — soft band, not a hard metronome.',
    defaultIntensity: 0.65,
    defaultSpeed: 0.75,
    defaultIntensityGlass: 0.8,
  },
  neonTrace: {
    id: 'neonTrace',
    label: 'Neon race',
    description:
      'A neon segment races the ribbon outline forever — dim baseline, bright comet, seamless loop.',
    defaultIntensity: 0.6,
    defaultSpeed: 0.7,
    defaultGlowStrength: 0.6,
    defaultNeonColorMode: 'mono',
  },
  aurora: {
    id: 'aurora',
    label: 'Aurora',
    description: 'Drifting color curtains across the ribbon — living field, not a short ping-pong.',
    defaultIntensity: 0.72,
    defaultSpeed: 0.85,
    defaultIntensityGlass: 0.85,
    defaultSpeedGlass: 0.9,
    defaultGlowStrength: 0.65,
  },
  ripple: {
    id: 'ripple',
    label: 'Ripple',
    description: 'Soft expanding caustics across the ribbon face.',
    defaultIntensity: 0.6,
    defaultSpeed: 0.7,
    defaultIntensityGlass: 0.75,
  },
  edgeEmber: {
    id: 'edgeEmber',
    label: 'Edge ember',
    description: 'Warm embers drift along the ribbon edge.',
    defaultIntensity: 0.6,
    defaultSpeed: 0.8,
    defaultIntensityGlass: 0.75,
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
    description: 'Soft light motes rising from the bow — continuous fairy-particle field.',
    defaultIntensity: 0.55,
    defaultSpeed: 0.75,
    defaultIntensityGlass: 0.7,
  },
  spectrum: {
    id: 'spectrum',
    label: 'Spectrum',
    description: 'Slow hue shift across the ribbon fill and edge.',
    defaultIntensity: 0.5,
    defaultSpeed: 0.6,
  },
  musicBand: {
    id: 'musicBand',
    label: 'Music band',
    description: 'Soft reactive bars while music is playing — idle when paused.',
    defaultIntensity: 0.55,
    defaultSpeed: 1,
    defaultIntensityGlass: 0.72,
  },
};

/** Milliseconds after unhover before Idle-only FX start animating. */
export const RIBBON_CHROME_IDLE_DELAY_MS = 2500;

/** Hover dampen multiplier when Idle only is off (CSS opacity wrapper — no filter rebuild). */
export const RIBBON_CHROME_HOVER_DAMPEN = 0.55;

/** Runtime glass intensity multiplier applied on top of user intensity for soft modes. */
export const RIBBON_CHROME_GLASS_INTENSITY_MULT = 1.4;

/**
 * Coerce unknown / removed effect ids (e.g. legacy `frost`) to `none`.
 * @param {unknown} id
 * @returns {string}
 */
export function normalizeRibbonChromeEffectId(id) {
  const raw = typeof id === 'string' ? id : 'none';
  return RIBBON_CHROME_EFFECTS.includes(raw) ? raw : 'none';
}

/**
 * @param {string} [id]
 * @returns {RibbonChromeEffectMeta}
 */
export function getRibbonChromeEffectMeta(id) {
  const normalized = normalizeRibbonChromeEffectId(id);
  return META_BY_ID[normalized] || META_BY_ID.none;
}

/** Default neon bloom when unset (0–1). */
export const RIBBON_CHROME_DEFAULT_GLOW_STRENGTH = 0.6;

export const RIBBON_CHROME_DEFAULT_NEON_COLOR_MODE = 'mono';

export function isRibbonNeonColorMode(id) {
  return RIBBON_NEON_COLOR_MODES.includes(id);
}

/**
 * Defaults applied when the user picks a chrome mode.
 * Soft modes use glass-aware intensity/speed when glass ribbon is on.
 * @param {string} [id]
 * @param {{ glass?: boolean }} [opts]
 * @returns {{ intensity: number, speed: number, glowStrength: number, neonColorMode: string }}
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
    neonColorMode: meta.defaultNeonColorMode ?? RIBBON_CHROME_DEFAULT_NEON_COLOR_MODE,
  };
}

export function isRibbonChromeGlassSoftMode(id) {
  return RIBBON_CHROME_GLASS_SOFT_MODES.includes(normalizeRibbonChromeEffectId(id));
}

/** Options for pickers (includes None). */
export function getRibbonChromeEffectOptions() {
  return RIBBON_CHROME_EFFECTS.map((id) => ({
    value: id,
    label: META_BY_ID[id].label,
  }));
}

export function isRibbonChromeEffectId(id) {
  return RIBBON_CHROME_EFFECTS.includes(id);
}
