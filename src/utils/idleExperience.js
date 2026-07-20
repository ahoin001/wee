/**
 * Unified Home idle experience config — one owner for grid auto-fade,
 * tile micro-delights, and attract mode.
 *
 * SSOT stays in `channels.settings` (legacy keys preserved):
 * - `idleExperienceMode`: 'off' | 'subtle' | 'attract' (new canonical mode)
 * - `autoFadeTimeout`: seconds of no interaction before the ambient stage (fade)
 * - `idleAttractDelaySec`: extra seconds in ambient before the attract stage
 * - `idleAnimationEnabled` / `idleAnimationTypes` / `idleAnimationInterval`: micro-delights
 * - `idleDelightsWhileActive`: when true, micro-delights run on Home without waiting for idle
 *   (and keep running if the window briefly loses focus)
 */

export const IDLE_EXPERIENCE_MODES = Object.freeze(['off', 'subtle', 'attract']);

export const DEFAULT_IDLE_ATTRACT_DELAY_SEC = 120;

/** Idle personality presets — restrained subsets of the tile micro-delight types. */
export const IDLE_PERSONALITY_PACKS = Object.freeze({
  restrained: Object.freeze(['pulse']),
  playful: Object.freeze(['pulse', 'bounce', 'glow', 'wiggle']),
  showy: Object.freeze(['pulse', 'bounce', 'glow', 'heartbeat', 'shake', 'wiggle']),
});

/**
 * Match current delight types to a personality pack id ('' when custom).
 * @param {string[]} types
 */
export function matchIdlePersonality(types) {
  const sorted = [...(Array.isArray(types) ? types : [])].sort().join(',');
  const match = Object.entries(IDLE_PERSONALITY_PACKS).find(
    ([, packTypes]) => [...packTypes].sort().join(',') === sorted
  );
  return match ? match[0] : '';
}

/**
 * @param {Record<string, unknown>} channelSettings — `channels.settings`
 * @returns {{
 *   mode: 'off' | 'subtle' | 'attract',
 *   idleDelaySec: number,
 *   attractDelaySec: number,
 *   delightsEnabled: boolean,
 *   delightsWhileActive: boolean,
 *   delightTypes: string[],
 *   delightIntervalSec: number,
 * }}
 */
export function normalizeIdleExperienceSettings(channelSettings = {}) {
  const s = channelSettings && typeof channelSettings === 'object' ? channelSettings : {};

  let mode = IDLE_EXPERIENCE_MODES.includes(s.idleExperienceMode) ? s.idleExperienceMode : null;
  if (!mode) {
    // Migrate from legacy split toggles: any idle behavior → subtle, else off.
    const hadFade = (Number(s.autoFadeTimeout) || 0) > 0;
    const hadDelights = Boolean(s.idleAnimationEnabled);
    mode = hadFade || hadDelights ? 'subtle' : 'off';
  }

  const idleDelaySec = Math.min(60, Math.max(1, Number(s.autoFadeTimeout) || 5));
  const attractDelaySec = Math.min(
    900,
    Math.max(30, Number(s.idleAttractDelaySec) || DEFAULT_IDLE_ATTRACT_DELAY_SEC)
  );
  const delightsEnabled = mode !== 'off' && Boolean(s.idleAnimationEnabled);

  return {
    mode,
    idleDelaySec,
    attractDelaySec,
    delightsEnabled,
    /** Play tile micro-delights while browsing Home — not only after idle timeout. */
    delightsWhileActive: delightsEnabled && Boolean(s.idleDelightsWhileActive),
    delightTypes: Array.isArray(s.idleAnimationTypes) && s.idleAnimationTypes.length > 0
      ? s.idleAnimationTypes
      : ['pulse', 'bounce', 'glow'],
    delightIntervalSec: Math.min(60, Math.max(2, Number(s.idleAnimationInterval) || 8)),
  };
}
