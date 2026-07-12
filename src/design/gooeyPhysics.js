/**
 * Shared gooey expand/shrink physics derived from WeeGooeySpacePill.
 * Springs live in weeMotion.js; this module scales amplitude + damping by user intensity
 * and resolves hover target states for channels / ribbon.
 */

import { WEE_SPRINGS } from './weeMotion';

export const GOOEY_HOVER_MODES = Object.freeze({
  squash: 'squash',
  glow: 'glow',
  both: 'both',
});

export const DEFAULT_GOOEY_PHYSICS = Object.freeze({
  /** Global bounce amount: 0 = near-critically damped, 1 = pill-matched overshoot. */
  intensity: 1,
  surfaces: Object.freeze({
    modals: 1,
    channels: 1,
    ribbon: 1,
  }),
  /** Channel tile hover: squash | glow | both */
  channelHoverMode: GOOEY_HOVER_MODES.both,
  /** Ribbon floating buttons hover: squash | glow | both */
  ribbonHoverMode: GOOEY_HOVER_MODES.both,
});

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clampGooeyIntensity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

export function normalizeGooeyHoverMode(mode) {
  if (mode === GOOEY_HOVER_MODES.squash || mode === GOOEY_HOVER_MODES.glow || mode === GOOEY_HOVER_MODES.both) {
    return mode;
  }
  return GOOEY_HOVER_MODES.both;
}

/**
 * Deep-merge saved gooey prefs with defaults (safe for hydrate / migration).
 */
export function mergeGooeyPhysics(patch) {
  const p = patch && typeof patch === 'object' ? patch : {};
  const surfaces = p.surfaces && typeof p.surfaces === 'object' ? p.surfaces : {};
  return {
    intensity: clampGooeyIntensity(p.intensity ?? DEFAULT_GOOEY_PHYSICS.intensity),
    surfaces: {
      modals: clampGooeyIntensity(surfaces.modals ?? DEFAULT_GOOEY_PHYSICS.surfaces.modals),
      channels: clampGooeyIntensity(surfaces.channels ?? DEFAULT_GOOEY_PHYSICS.surfaces.channels),
      ribbon: clampGooeyIntensity(surfaces.ribbon ?? DEFAULT_GOOEY_PHYSICS.surfaces.ribbon),
    },
    channelHoverMode: normalizeGooeyHoverMode(p.channelHoverMode ?? DEFAULT_GOOEY_PHYSICS.channelHoverMode),
    ribbonHoverMode: normalizeGooeyHoverMode(p.ribbonHoverMode ?? DEFAULT_GOOEY_PHYSICS.ribbonHoverMode),
  };
}

export function resolveSurfaceIntensity(gooey, surfaceKey) {
  const g = mergeGooeyPhysics(gooey);
  const surface = g.surfaces?.[surfaceKey] ?? 1;
  return clampGooeyIntensity(g.intensity * surface);
}

/**
 * Scale a spring toward/away from pill bounce using intensity.
 * intensity 1 → spring unchanged; intensity 0 → more damping, less overshoot.
 */
export function scaleSpringByIntensity(spring, intensity) {
  if (!spring || typeof spring !== 'object') return spring;
  if (spring.type !== 'spring') return spring;
  const t = clampGooeyIntensity(intensity);
  const baseStiffness = Number(spring.stiffness) || 400;
  const baseDamping = Number(spring.damping) || 20;
  const baseMass = Number(spring.mass) || 0.85;
  return {
    ...spring,
    type: 'spring',
    stiffness: Math.round(lerp(baseStiffness * 0.9, baseStiffness, t)),
    damping: Math.round(lerp(baseDamping * 1.85, baseDamping, t) * 10) / 10,
    mass: Math.round(lerp(baseMass * 1.05, baseMass, t) * 100) / 100,
  };
}

export function createGooeyOpenSpring(intensity) {
  return scaleSpringByIntensity(WEE_SPRINGS.pillOpen, intensity);
}

export function createGooeyCloseSpring(intensity) {
  return scaleSpringByIntensity(WEE_SPRINGS.pillClose, intensity);
}

/**
 * Modal panel variants — asymmetric open/close like the space pill.
 */
export function createGooeyModalPanelVariants(intensity) {
  const openSpring = createGooeyOpenSpring(intensity);
  const closeSpring = createGooeyCloseSpring(intensity);
  const t = clampGooeyIntensity(intensity);
  const enterScale = lerp(0.94, 0.86, t);
  const enterY = lerp(18, 36, t);
  return {
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: openSpring,
    },
    closed: {
      opacity: 0,
      scale: enterScale,
      y: enterY,
      transition: closeSpring,
    },
  };
}

/**
 * Hover motion target for channel tiles / ribbon buttons.
 * @returns {{ whileHover: object|undefined, includeGlow: boolean, scale: number }}
 */
export function resolveGooeyHoverMotion(mode, intensity, { baseScale = 1.06, glowOnlyScale = 1 } = {}) {
  const t = clampGooeyIntensity(intensity);
  const normalized = normalizeGooeyHoverMode(mode);
  const squashScale = 1 + (baseScale - 1) * t;
  const includeGlow = normalized === GOOEY_HOVER_MODES.glow || normalized === GOOEY_HOVER_MODES.both;
  const includeSquash = normalized === GOOEY_HOVER_MODES.squash || normalized === GOOEY_HOVER_MODES.both;

  if (!includeSquash && !includeGlow) {
    return { whileHover: undefined, includeGlow: false, scale: 1 };
  }

  if (!includeSquash) {
    return {
      whileHover: { scale: glowOnlyScale },
      includeGlow: true,
      scale: glowOnlyScale,
    };
  }

  return {
    whileHover: { scale: squashScale },
    includeGlow,
    scale: squashScale,
  };
}
