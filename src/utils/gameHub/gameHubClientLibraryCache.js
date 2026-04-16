/** In-memory cache for Steam client library metadata (tags/favorites) — avoids refetch on every hub mount. */
const TTL_MS = 15 * 60 * 1000;

let cache = {
  steamId: null,
  fetchedAt: 0,
  value: null,
};

export function getCachedSteamClientLibrary(steamId) {
  if (!steamId || cache.steamId !== String(steamId)) return null;
  if (!cache.value || Date.now() - cache.fetchedAt > TTL_MS) return null;
  return cache.value;
}

export function setCachedSteamClientLibrary(steamId, value) {
  cache = {
    steamId: steamId ? String(steamId) : null,
    fetchedAt: Date.now(),
    value,
  };
}
