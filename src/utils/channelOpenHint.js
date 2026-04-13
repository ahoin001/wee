/**
 * Transient “recent use” hint after launching from a channel (not persisted).
 * Single TTL — lightweight; no process polling or live tracking.
 */
export const CHANNEL_RECENT_LAUNCH_HINT_MS = 120_000;

export function getRecentLaunchHintTtlMs() {
  return CHANNEL_RECENT_LAUNCH_HINT_MS;
}
