/**
 * Bounds for keyed caches that ride along in unified-data.json (Media Hub streams /
 * series meta). Standalone module so Node test suites can import it without the full
 * persistence-contract dependency tree.
 */

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Persisted growth bound for Media Hub keyed caches (streams / series meta). */
export const MEDIA_HUB_PERSISTED_CACHE_MAX_ENTRIES = 40;

/**
 * Bound a keyed cache map for persistence: drop in-flight entries, keep the newest
 * `maxEntries` (by `fetchedAt` when present, otherwise insertion order — later = newer).
 * Same idea as sanitizeRecentLaunches: unified-data.json must not grow forever.
 */
export const pruneKeyedCacheForPersistence = (
  map,
  maxEntries = MEDIA_HUB_PERSISTED_CACHE_MAX_ENTRIES
) => {
  if (!isPlainObject(map)) return {};
  const entries = Object.entries(map).filter(
    ([, entry]) => isPlainObject(entry) && entry.loading !== true
  );
  if (entries.length <= maxEntries) return Object.fromEntries(entries);

  const scored = entries.map(([key, entry], index) => ({
    key,
    entry,
    score: Number.isFinite(Number(entry.fetchedAt)) ? Number(entry.fetchedAt) : index,
  }));
  scored.sort((a, b) => b.score - a.score);
  return Object.fromEntries(scored.slice(0, maxEntries).map(({ key, entry }) => [key, entry]));
};
