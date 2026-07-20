/**
 * Scene FX Beta prefs — isolated Wallpaper Engine–inspired atmosphere.
 * Delete with `src/features/sceneFxBeta/` (see README).
 */

/** Effect module ids — delete one by removing its file + catalog entry + Root mount. */
export const SCENE_FX_BETA_EFFECT_IDS = Object.freeze([
  'parallax',
  'atmosphere',
  'cursorWake',
  'musicBloom',
]);

export const DEFAULT_SCENE_FX_BETA = Object.freeze({
  /** Master gate — when false, SceneFxBetaRoot mounts nothing. */
  enabled: false,
  /** Cursor parallax on the wallpaper shell (CSS vars; identity when off). */
  parallax: Object.freeze({
    enabled: true,
    /** 0–1 mapped to px offset strength */
    amount: 0.4,
  }),
  /** Soft vignette + drifting light shafts over the wallpaper. */
  atmosphere: Object.freeze({
    enabled: true,
    vignette: 0.38,
    shafts: 0.28,
  }),
  /** Click / move wake ripples (event-driven, not always-on heavy). */
  cursorWake: Object.freeze({
    enabled: true,
    intensity: 0.55,
  }),
  /** Subtle scene bloom while music is playing (opt-in within the beta). */
  musicBloom: Object.freeze({
    enabled: false,
    intensity: 0.32,
  }),
});

function clamp01(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(1, Math.max(0, v));
}

function normalizeToggleBlock(raw, defaults) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const next = { enabled: src.enabled !== false };
  Object.keys(defaults).forEach((key) => {
    if (key === 'enabled') return;
    next[key] = clamp01(src[key], defaults[key]);
  });
  return next;
}

/**
 * @param {unknown} raw
 * @returns {{
 *   enabled: boolean,
 *   parallax: { enabled: boolean, amount: number },
 *   atmosphere: { enabled: boolean, vignette: number, shafts: number },
 *   cursorWake: { enabled: boolean, intensity: number },
 *   musicBloom: { enabled: boolean, intensity: number },
 * }}
 */
export function normalizeSceneFxBeta(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: Boolean(src.enabled),
    parallax: normalizeToggleBlock(src.parallax, DEFAULT_SCENE_FX_BETA.parallax),
    atmosphere: normalizeToggleBlock(src.atmosphere, DEFAULT_SCENE_FX_BETA.atmosphere),
    cursorWake: normalizeToggleBlock(src.cursorWake, DEFAULT_SCENE_FX_BETA.cursorWake),
    musicBloom: {
      ...normalizeToggleBlock(src.musicBloom, DEFAULT_SCENE_FX_BETA.musicBloom),
      // music bloom stays opt-in even when nested defaults say enabled
      enabled: Boolean(src.musicBloom?.enabled),
    },
  };
}

/**
 * Whether a nested effect should run (master + module + not reduced-motion for continuous FX).
 * @param {ReturnType<typeof normalizeSceneFxBeta>} prefs
 * @param {string} effectId
 * @param {{ reducedMotion?: boolean }} [opts]
 */
export function isSceneFxEffectActive(prefs, effectId, { reducedMotion = false } = {}) {
  if (!prefs?.enabled) return false;
  const block = prefs[effectId];
  if (!block?.enabled) return false;
  // Cursor wake still allows a single soft click cue under reduced motion.
  if (reducedMotion && effectId !== 'cursorWake') return false;
  return true;
}
