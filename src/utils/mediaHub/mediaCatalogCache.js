/** Media Hub Discover catalog freshness — one TTL shared by the space and cache registry. */
export const MEDIA_CATALOG_TTL_MS = 6 * 60 * 60 * 1000;

/** True when a persisted `catalogCache[mode]` entry is fresh enough to skip the network. */
export function isCatalogCacheFresh(entry, now = Date.now()) {
  if (!entry || !Array.isArray(entry.items) || entry.items.length === 0) return false;
  const fetchedAt = Number(entry.fetchedAt);
  if (!Number.isFinite(fetchedAt) || fetchedAt <= 0) return false;
  return now - fetchedAt < MEDIA_CATALOG_TTL_MS;
}
