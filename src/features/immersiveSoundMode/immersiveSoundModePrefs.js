/**
 * Immersive Sound Mode prefs — isolated beta feature.
 * Delete with `src/features/immersiveSoundMode/` (see README).
 */

export const IMMERSIVE_SOUND_INTENSITIES = Object.freeze(['calm', 'focus', 'club']);

export const DEFAULT_IMMERSIVE_SOUND_MODE = Object.freeze({
  /** Master gate — when false, stage never mounts work beyond prefs UI. */
  enabled: false,
  /** Visual intensity preset. */
  intensity: 'focus',
  /** Enter stage when music plays and Home idle reaches ambient/attract. */
  autoIdle: true,
  /** Show blurred album art as the session backdrop. */
  coverBackdrop: true,
  /** How strongly the stage dims the home board (0–1). */
  boardDim: 0.78,
});

/** Per-intensity visual knobs consumed only by the stage (not global tokens). */
export const IMMERSIVE_SOUND_INTENSITY_LOOK = Object.freeze({
  calm: Object.freeze({
    artBlurPx: 48,
    artScale: 1.08,
    coverSizeRem: 14,
    glowStrength: 0.28,
    showBars: false,
    breathAmount: 0.012,
    particleCount: 0,
  }),
  focus: Object.freeze({
    artBlurPx: 36,
    artScale: 1.12,
    coverSizeRem: 16,
    glowStrength: 0.42,
    showBars: true,
    breathAmount: 0.018,
    particleCount: 18,
  }),
  club: Object.freeze({
    artBlurPx: 28,
    artScale: 1.16,
    coverSizeRem: 17.5,
    glowStrength: 0.62,
    showBars: true,
    breathAmount: 0.028,
    particleCount: 36,
  }),
});

/**
 * @param {unknown} raw
 * @returns {typeof DEFAULT_IMMERSIVE_SOUND_MODE}
 */
export function normalizeImmersiveSoundMode(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const intensity = IMMERSIVE_SOUND_INTENSITIES.includes(src.intensity)
    ? src.intensity
    : DEFAULT_IMMERSIVE_SOUND_MODE.intensity;
  const boardDim = Number(src.boardDim);
  return {
    enabled: Boolean(src.enabled),
    intensity,
    autoIdle: src.autoIdle !== false,
    coverBackdrop: src.coverBackdrop !== false,
    boardDim: Number.isFinite(boardDim)
      ? Math.min(0.92, Math.max(0.35, boardDim))
      : DEFAULT_IMMERSIVE_SOUND_MODE.boardDim,
  };
}

/**
 * @param {string} intensity
 * @returns {typeof IMMERSIVE_SOUND_INTENSITY_LOOK.focus}
 */
export function resolveImmersiveSoundLook(intensity) {
  return IMMERSIVE_SOUND_INTENSITY_LOOK[intensity] || IMMERSIVE_SOUND_INTENSITY_LOOK.focus;
}
