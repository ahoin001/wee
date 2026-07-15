/**
 * Launch cinematic — non-blocking board choreography while an app launch is in flight.
 *
 * One owner per concern:
 * - Preference lives in `ui.motionFeedback.launch` ('off' | 'subtle' | 'cinematic').
 * - Transient origin state lives in `ui.launchCinematic` ({ token, channelId, source, startedAt } | null),
 *   written only by LaunchFeedbackContext. It is never persisted.
 * - The launch-domain clock is LAUNCH_CINEMATIC_MS here; `--wee-launch-duration` in
 *   design-system.css and the `launch` intent in weeMotion.js mirror it (same pattern as
 *   CHANNEL_PAGE_FLIP_MS). Do not introduce another timing source for launch choreography.
 */

export const LAUNCH_FEEDBACK_MODES = Object.freeze(['off', 'subtle', 'cinematic']);

export const DEFAULT_LAUNCH_FEEDBACK_MODE = 'subtle';

/** Single clock for tile settle / board recede / dock yield (mirrored by --wee-launch-duration). */
export const LAUNCH_CINEMATIC_MS = 360;

/**
 * Safety ceiling: choreography stops even if the launch promise hangs. The real end signal
 * is endLaunchFeedback (launch resolved) or window blur (the launched app took focus).
 */
export const LAUNCH_CINEMATIC_MAX_MS = 2600;

export function normalizeLaunchFeedbackMode(value) {
  return LAUNCH_FEEDBACK_MODES.includes(value) ? value : DEFAULT_LAUNCH_FEEDBACK_MODE;
}
