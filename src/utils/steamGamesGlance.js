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
 * Resolve enriched (or stub) rows for favorite app ids.
 * Preserves favorite order; fills gaps with CDN stubs when enrichment is missing.
 * @param {unknown[]} games
 * @param {unknown[]} favoriteAppIds — raw Steam app ids
 * @param {unknown} [hiddenGameIds]
 * @returns {object[]}
 */
export function sortFavoriteSteamGames(games, favoriteAppIds, hiddenGameIds) {
  const ids = Array.isArray(favoriteAppIds)
    ? favoriteAppIds.map((id) => String(id || '').trim()).filter(Boolean)
    : [];
  if (ids.length === 0) return [];

  const byAppId = new Map();
  for (const g of excludeHiddenSteamGames(games, hiddenGameIds)) {
    if (!g?.appId) continue;
    byAppId.set(String(g.appId), g);
  }

  const out = [];
  for (const appId of ids) {
    const hubId = steamHubGameIdFromAppId(appId);
    if (Array.isArray(hiddenGameIds) && hiddenGameIds.map(String).includes(hubId)) continue;
    const known = byAppId.get(appId);
    if (known) {
      out.push(known);
      continue;
    }
    out.push({
      appId,
      name: `Steam ${appId}`,
      imageUrl: STEAM_CDN_LIBRARY_COVER(appId),
      playtimeForever: 0,
      playtimeRecent: 0,
      lastPlayedAt: 0,
    });
  }
  return out;
}

/**
 * Extract Steam app ids from Wee Game Hub favorite ids (`steam-{appId}`).
 * Non-Steam hub ids are skipped. Preserves Wee favorite order.
 * @param {unknown[]} favoriteGameIds — `gameHub.ui.favoriteGameIds`
 * @returns {string[]}
 */
export function appIdsFromWeeFavoriteGameIds(favoriteGameIds) {
  const list = Array.isArray(favoriteGameIds) ? favoriteGameIds : [];
  const out = [];
  for (const raw of list) {
    const id = String(raw || '').trim();
    if (!id) continue;
    if (id.startsWith('steam-')) {
      const appId = id.slice('steam-'.length).trim();
      if (appId) out.push(appId);
      continue;
    }
    // Legacy / accidental bare app ids
    if (/^\d+$/.test(id)) out.push(id);
  }
  return out;
}

/**
 * Home Favorites shelf — Wee Game Hub stars (`favoriteGameIds`) as SSOT.
 * @param {unknown[]} games
 * @param {unknown[]} favoriteGameIds — hub ids like `steam-{appId}`
 * @param {unknown} [hiddenGameIds]
 * @returns {object[]}
 */
export function sortWeeFavoriteSteamGames(games, favoriteGameIds, hiddenGameIds) {
  return sortFavoriteSteamGames(
    games,
    appIdsFromWeeFavoriteGameIds(favoriteGameIds),
    hiddenGameIds
  );
}

/**
 * Games that carry a Steam client tag (case-insensitive match).
 * @param {unknown[]} games
 * @param {string} tag
 * @param {Record<string, string[]> | null | undefined} appIdToTags
 * @param {unknown} [hiddenGameIds]
 * @returns {object[]}
 */
export function sortTaggedSteamGames(games, tag, appIdToTags, hiddenGameIds) {
  const needle = String(tag || '').trim().toLowerCase();
  if (!needle || !appIdToTags || typeof appIdToTags !== 'object') return [];

  const taggedIds = new Set();
  for (const [appId, tags] of Object.entries(appIdToTags)) {
    if (!Array.isArray(tags)) continue;
    if (tags.some((t) => String(t || '').trim().toLowerCase() === needle)) {
      taggedIds.add(String(appId));
    }
  }
  if (taggedIds.size === 0) return [];

  return sortFavoriteSteamGames(games, [...taggedIds], hiddenGameIds).sort((a, b) => {
    const pt = Number(b.playtimeForever || 0) - Number(a.playtimeForever || 0);
    if (pt !== 0) return pt;
    return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
      sensitivity: 'base',
    });
  });
}

/**
 * Unique Steam client tags across the library (sorted A–Z).
 * @param {Record<string, string[]> | null | undefined} appIdToTags
 * @returns {string[]}
 */
export function listSteamClientTags(appIdToTags) {
  if (!appIdToTags || typeof appIdToTags !== 'object') return [];
  const set = new Set();
  for (const tags of Object.values(appIdToTags)) {
    if (!Array.isArray(tags)) continue;
    for (const t of tags) {
      const label = String(t || '').trim();
      if (label) set.add(label);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
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
