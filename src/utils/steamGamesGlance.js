/**
 * Shared helpers for Steam home-grid glance tiles (recent / most played).
 */

/** Steam library portrait (2∶3) — same asset Game Hub shelves use. */
export const STEAM_CDN_LIBRARY_COVER = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;

/** Landscape header fallback when library portrait is missing. */
export const STEAM_CDN_HEADER = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

/** @deprecated Use STEAM_CDN_LIBRARY_COVER — kept for call-site compatibility. */
export const STEAM_CDN_CAPSULE = STEAM_CDN_LIBRARY_COVER;

/**
 * @param {unknown[]} games
 * @returns {object[]}
 */
export function sortRecentSteamGames(games) {
  return [...(games || [])]
    .filter((g) => g?.appId)
    .sort((a, b) => {
      const recentA = Number(a.playtimeRecent || 0);
      const recentB = Number(b.playtimeRecent || 0);
      if (recentB !== recentA) return recentB - recentA;
      return Number(b.lastPlayedAt || 0) - Number(a.lastPlayedAt || 0);
    })
    .filter((g) => Number(g.playtimeRecent || 0) > 0 || Number(g.lastPlayedAt || 0) > 0);
}

/**
 * @param {unknown[]} games
 * @returns {object[]}
 */
export function sortMostPlayedSteamGames(games) {
  return [...(games || [])]
    .filter((g) => g?.appId && Number(g.playtimeForever || 0) > 0)
    .sort((a, b) => {
      const pt = Number(b.playtimeForever || 0) - Number(a.playtimeForever || 0);
      if (pt !== 0) return pt;
      return Number(b.playtimeRecent || 0) - Number(a.playtimeRecent || 0);
    });
}

/**
 * Args for `window.api.steam.getEnrichedGames` from current store profile.
 * @param {{ steamId?: string, steamWebApiKey?: string } | null | undefined} profile
 * @returns {{ steamId: string, apiKey?: string } | null}
 */
export function steamEnrichmentIpcArgs(profile) {
  const steamId = typeof profile?.steamId === 'string' ? profile.steamId.trim() : '';
  if (!steamId) return null;
  const apiKey =
    typeof profile?.steamWebApiKey === 'string' ? profile.steamWebApiKey.trim() : '';
  return apiKey ? { steamId, apiKey } : { steamId };
}
