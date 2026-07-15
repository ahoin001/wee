/**
 * Bounded launch history for the Recently Used home tile.
 * SSOT: `channels.recentLaunches` (persisted with the channels slice).
 * Recorded only through the channel/app launch path — transient
 * `ui.channelOpenHints` stay separate and are never treated as history.
 */

export const MAX_RECENT_LAUNCHES = 12;

/** Icons/labels are stored inline; skip oversized data-URL icons to keep history light. */
const MAX_ICON_LENGTH = 2048;

/**
 * @param {{ label?: string, path?: string, launchType?: string, icon?: string | null }} raw
 * @returns {{ key: string, label: string, path: string, launchType: string, icon: string | null, at: number, count: number } | null}
 */
export function normalizeRecentLaunchEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const path = typeof raw.path === 'string' ? raw.path.trim() : '';
  if (!path) return null;
  const launchType = typeof raw.launchType === 'string' && raw.launchType ? raw.launchType : 'app';
  const icon =
    typeof raw.icon === 'string' && raw.icon && raw.icon.length <= MAX_ICON_LENGTH ? raw.icon : null;
  return {
    key: `${launchType}:${path.toLowerCase()}`,
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim() : deriveLaunchLabel(path, launchType),
    path,
    launchType,
    icon,
    at: Date.now(),
    count: 1,
  };
}

/**
 * Fallback label from the path (file stem or URL host).
 * @param {string} path
 * @param {string} launchType
 */
export function deriveLaunchLabel(path, launchType) {
  if (launchType === 'url') {
    try {
      return new URL(path).hostname.replace(/^www\./, '');
    } catch {
      return path;
    }
  }
  const stem = path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || path;
  return stem.replace(/\.(exe|lnk|url|bat|cmd)$/i, '');
}

/**
 * Insert/refresh an entry at the front of a bounded, deduped history list.
 * @param {Array} list — existing `channels.recentLaunches`
 * @param {object} raw — see `normalizeRecentLaunchEntry`
 * @returns {Array} next list (new array; unchanged input returns same reference)
 */
export function recordRecentLaunchEntry(list, raw) {
  const entry = normalizeRecentLaunchEntry(raw);
  if (!entry) return Array.isArray(list) ? list : [];

  const current = Array.isArray(list) ? list : [];
  const existing = current.find((item) => item?.key === entry.key);
  const next = [
    existing
      ? { ...existing, ...entry, count: (Number(existing.count) || 0) + 1 }
      : entry,
    ...current.filter((item) => item?.key !== entry.key),
  ];
  return next.slice(0, MAX_RECENT_LAUNCHES);
}

/**
 * Sanitize a persisted history list (drop malformed rows, enforce bound).
 * @param {unknown} list
 */
export function sanitizeRecentLaunches(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === 'object' && typeof item.path === 'string' && item.path)
    .slice(0, MAX_RECENT_LAUNCHES);
}
