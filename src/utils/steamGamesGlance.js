/**
 * Shared helpers for Steam home-grid glance tiles (recent / most played).
 * Hidden titles share Game Hub SSOT: `gameHub.ui.hiddenGameIds` (`steam-{appId}`).
 */

/** Steam library portrait (2∶3) — same asset Game Hub shelves use. */
export const STEAM_CDN_LIBRARY_COVER = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;

/** Landscape header fallback when library portrait is missing. */
export const STEAM_CDN_HEADER = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

/** @deprecated Use STEAM_CDN_LIBRARY_COVER — kept for call-site compatibility. */
export const STEAM_CDN_CAPSULE = STEAM_CDN_LIBRARY_COVER;

/** Canonical Game Hub id for a Steam app (matches hub `normalizeSteamGame`). */
export function steamHubGameIdFromAppId(appId) {
  return `steam-${String(appId ?? '')}`;
}

/**
 * Drop titles the user hid in Game Hub. Filter before sort/slice so capacity stays full.
 * @param {unknown[]} games — enrichment rows with `appId`
 * @param {unknown} [hiddenGameIds] — `gameHub.ui.hiddenGameIds`
 * @returns {object[]}
 */
export function excludeHiddenSteamGames(games, hiddenGameIds) {
  const list = Array.isArray(games) ? games : [];
  if (!Array.isArray(hiddenGameIds) || hiddenGameIds.length === 0) return list;
  const hidden = new Set(hiddenGameIds.map(String).filter(Boolean));
  if (hidden.size === 0) return list;
  return list.filter((g) => {
    if (!g?.appId) return false;
    return !hidden.has(steamHubGameIdFromAppId(g.appId));
  });
}

/**
 * @param {unknown[]} games
 * @param {unknown} [hiddenGameIds]
 * @returns {object[]}
 */
export function sortRecentSteamGames(games, hiddenGameIds) {
  return excludeHiddenSteamGames(games, hiddenGameIds)
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
 * @param {unknown} [hiddenGameIds]
 * @returns {object[]}
 */
export function sortMostPlayedSteamGames(games, hiddenGameIds) {
  return excludeHiddenSteamGames(games, hiddenGameIds)
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
