/**
 * Immersive Sound Mode (Listening Stage) prefs.
 * First-class Now Playing companion — controls live in Home widget Looks.
 */

export const IMMERSIVE_SOUND_INTENSITIES = Object.freeze(['calm', 'focus', 'club']);

export const DEFAULT_IMMERSIVE_SOUND_MODE = Object.freeze({
  /** Master gate — when false, stage never mounts work beyond prefs UI. */
  enabled: true,
  /** Visual intensity preset. Glow, cover size, and motion — not blur or darken. */
  intensity: 'focus',
  /** Enter stage after music plays with no interaction for `idleDelaySec`. */
  autoIdle: false,
  /** Seconds of no clicks or keys before passive takeover. */
  idleDelaySec: 20,
  /** Show blurred album art as the session backdrop. */
  coverBackdrop: true,
  /** Blur (px) of the scrim over Home, and of the album wash when that is on. */
  overlayBlurPx: 24,
  /** How strongly the stage darkens the home board (0–1). */
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
  const idleDelaySec = Math.round(Number(src.idleDelaySec));
  const overlayBlurPx = Math.round(Number(src.overlayBlurPx));
  return {
    enabled: typeof src.enabled === 'boolean' ? src.enabled : DEFAULT_IMMERSIVE_SOUND_MODE.enabled,
    intensity,
    autoIdle: Boolean(src.autoIdle),
    idleDelaySec: Number.isFinite(idleDelaySec)
      ? Math.min(180, Math.max(5, idleDelaySec))
      : DEFAULT_IMMERSIVE_SOUND_MODE.idleDelaySec,
    coverBackdrop: src.coverBackdrop !== false,
    overlayBlurPx: Number.isFinite(overlayBlurPx)
      ? Math.min(48, Math.max(0, overlayBlurPx))
      : DEFAULT_IMMERSIVE_SOUND_MODE.overlayBlurPx,
    boardDim: Number.isFinite(boardDim)
      ? Math.min(0.92, Math.max(0.12, boardDim))
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
