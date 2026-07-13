/**
 * Pure power-profile resolution for decorative / background work.
 * Profiles: active | efficient | away
 */

/**
 * @param {{
 *   isAppActive: boolean,
 *   isVisible?: boolean,
 *   sessionPower?: 'normal' | 'away',
 *   lowPowerMode?: boolean,
 *   onBattery?: boolean,
 *   suspended?: boolean,
 * }} input
 * @returns {'active' | 'efficient' | 'away'}
 */
export function resolvePowerProfile(input = {}) {
  const sessionPower = input.sessionPower === 'away' ? 'away' : 'normal';
  const suspended = Boolean(input.suspended);

  // Suspended OS or intensive-launch away: deepest decorative pause (never minimize).
  if (sessionPower === 'away' || suspended) return 'away';

  if (!input.isAppActive || input.isVisible === false) {
    // Soft inactive — not deep away (casual Chrome/video blur).
    return input.lowPowerMode || input.onBattery ? 'efficient' : 'active';
  }

  // Focused: efficient when low-power or on battery.
  if (input.lowPowerMode || input.onBattery) return 'efficient';

  return 'active';
}

/**
 * @param {'active' | 'efficient' | 'away'} profile
 */
export function powerProfileFlags(profile) {
  const isAway = profile === 'away';
  const isEfficient = profile === 'efficient';
  return {
    profile,
    isAway,
    isEfficient,
    /** Decorative loops (particles, chrome FX, idle anims) — callers also gate on isAppActive */
    shouldAnimateDecorative: !isAway,
    /** BGM: callers must still require isAppActive; away forces pause even if briefly focused */
    shouldRunBgm: !isAway,
    shouldCycleWallpaper: !isAway,
    shouldExtractAmbient: !isAway,
    shouldPauseDecorativeVideo: isAway || isEfficient,
  };
}
