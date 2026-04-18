const STEAM_TOOL_APP_ID = '228980';

/** Max games per shelf row in the collections expansion grid */
const MAX_COLLECTION_GAMES = 18;
/** Max Wee favorites on the hero rail (sorted by recent activity) */
const MAX_RAIL_FAVORITES = 4;
/** Max Steam client category/tag shelves + cap for user Wee shelves */
const MAX_CATEGORY_COLLECTIONS = 12;

function slugifyCategoryId(name) {
  const s = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'category';
}

function isReservedSteamTag(t) {
  const x = String(t).toLowerCase();
  return x === 'favorite' || x === 'favorites' || x === 'hidden';
}

/**
 * Steam API uses unix seconds; Wee stores hub launches as unix ms — align to seconds for ordering.
 */
export function effectiveRecentSeconds(game, lastLaunchedAt) {
  const steamSec = Number(game?.lastPlayedAt || 0);
  const ms = Number(lastLaunchedAt?.[game?.id] || 0);
  const weeSec = ms > 0 ? ms / 1000 : 0;
  return Math.max(steamSec, weeSec);
}

/**
 * Union of installed scan rows + any app present in API enrichment (owned but not installed).
 */
export function mergeSteamGamesWithEnrichment(steamGames, enrichmentMap) {
  const byApp = new Map();
  (steamGames || []).forEach((g) => {
    const id = String(g.appId);
    if (id === STEAM_TOOL_APP_ID) return;
    byApp.set(id, { ...g, appId: id });
  });
  Object.entries(enrichmentMap || {}).forEach(([appId, enrich]) => {
    if (appId === STEAM_TOOL_APP_ID) return;
    if (!byApp.has(appId)) {
      byApp.set(appId, {
        appId,
        name: enrich.name || '',
        installed: false,
      });
    } else {
      const cur = byApp.get(appId);
      if (enrich.name && !cur.name) cur.name = enrich.name;
    }
  });
  return Array.from(byApp.values());
}

const normalizeSteamGame = (game, enrichmentMap) => {
  const appId = String(game.appId || game.appid || '');
  const enrich = enrichmentMap?.[appId] || {};

  return {
    id: `steam-${appId || game.name}`,
    source: 'steam',
    appId,
    name: game.name || enrich.name || 'Unknown Steam Game',
    installed: Boolean(game.installed),
    imageUrl: appId
      ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`
      : null,
    headerUrl: appId
      ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_hero.jpg`
      : null,
    launchPath: appId ? `steam://rungameid/${appId}` : null,
    playtimeForever: Number(enrich.playtimeForever || 0),
    playtimeRecent: Number(enrich.playtimeRecent || 0),
    lastPlayedAt: Number(enrich.lastPlayedAt || 0),
    sizeOnDisk: Number(game.sizeOnDisk || 0),
    sizeGB: typeof game.sizeGB === 'number' ? game.sizeGB : null,
    collectionNames: [],
    collectionSource: 'none',
  };
};

const normalizeEpicGame = (game) => ({
  id: `epic-${game.appName || game.name}`,
  source: 'epic',
  appId: game.appName || game.name,
  name: game.name || 'Unknown Epic Game',
  imageUrl: game.image || null,
  headerUrl: game.image || null,
  launchPath: game.appName
    ? `com.epicgames.launcher://apps/${game.appName}?action=launch&silent=true`
    : null,
  playtimeForever: 0,
  playtimeRecent: 0,
  lastPlayedAt: 0,
  collectionNames: [],
  collectionSource: 'none',
});

/**
 * Apply persisted Supabase (or other) art URLs over Steam/Epic defaults.
 * @param {object} game
 * @param {Record<string, { url?: string, headerUrl?: string, type?: string }>} [customArtByGameId]
 */
export function applyCustomArtOverrides(game, customArtByGameId) {
  if (!game || !customArtByGameId) return game;
  const o = customArtByGameId[game.id];
  if (!o?.url) return game;
  const header = o.headerUrl || o.url;
  return { ...game, imageUrl: o.url, headerUrl: header };
}

/**
 * @param {object} opts
 * @param {object} [opts.clientLibrary] — Steam client metadata (tags only; favorites not used for hub shelves)
 * @param {object} [opts.weeMeta] — persisted Wee organization
 * @param {string[]} [opts.weeMeta.favoriteGameIds]
 * @param {{ id: string, label: string, gameIds: string[] }[]} [opts.weeMeta.weeCollections]
 * @param {Record<string, number>} [opts.weeMeta.lastLaunchedAt] — ms since epoch per `game.id`
 * @param {Record<string, { url?: string, headerUrl?: string }>} [opts.weeMeta.customArtByGameId]
 */
function buildDynamicCollections(installed, normalizedSteam, clientLibrary, weeMeta) {
  const favoriteGameIds = weeMeta?.favoriteGameIds || [];
  const weeCollections = weeMeta?.weeCollections || [];
  const lastLaunchedAt = weeMeta?.lastLaunchedAt || {};

  const favIdSet = new Set(favoriteGameIds.map(String));
  const gameById = new Map(installed.map((g) => [g.id, g]));

  /** Steam playtime can be 0 until enrichment syncs — still show a full shelf (playtime → recency → name). */
  const mostPlayed = [...installed]
    .sort((a, b) => {
      const pt = b.playtimeForever - a.playtimeForever;
      if (pt !== 0) return pt;
      const rec =
        effectiveRecentSeconds(b, lastLaunchedAt) - effectiveRecentSeconds(a, lastLaunchedAt);
      if (rec !== 0) return rec;
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    })
    .slice(0, MAX_COLLECTION_GAMES);

  const items = [{ id: 'hub-most-played', label: 'Most played', games: mostPlayed }];

  const favoritesGames = installed
    .filter((g) => favIdSet.has(g.id))
    .sort((a, b) => b.playtimeForever - a.playtimeForever)
    .slice(0, MAX_COLLECTION_GAMES);
  if (favoritesGames.length > 0) {
    items.push({ id: 'hub-favorites', label: 'Favorites', games: favoritesGames });
  }

  weeCollections.slice(0, MAX_CATEGORY_COLLECTIONS).forEach((col) => {
    const games = (col.gameIds || [])
      .map((id) => gameById.get(id))
      .filter(Boolean)
      .sort((a, b) => b.playtimeForever - a.playtimeForever || a.name.localeCompare(b.name))
      .slice(0, MAX_COLLECTION_GAMES);
    if (games.length === 0) return;
    items.push({
      id: col.id,
      label: col.label || 'Collection',
      games,
    });
  });

  const appIdToTags = clientLibrary?.appIdToTags && typeof clientLibrary.appIdToTags === 'object'
    ? clientLibrary.appIdToTags
    : {};
  const gameByAppId = new Map(normalizedSteam.map((g) => [g.appId, g]));

  const tagToGames = new Map();
  Object.entries(appIdToTags).forEach(([appId, tags]) => {
    const game = gameByAppId.get(appId);
    if (!game) return;
    (Array.isArray(tags) ? tags : []).forEach((raw) => {
      const tag = String(raw).trim();
      if (!tag || isReservedSteamTag(tag)) return;
      if (!tagToGames.has(tag)) tagToGames.set(tag, []);
      tagToGames.get(tag).push(game);
    });
  });

  const sortedTags = [...tagToGames.keys()].sort((a, b) => a.localeCompare(b));
  sortedTags.slice(0, MAX_CATEGORY_COLLECTIONS).forEach((tag) => {
    const games = tagToGames
      .get(tag)
      .sort((a, b) => b.playtimeForever - a.playtimeForever || a.name.localeCompare(b.name))
      .slice(0, MAX_COLLECTION_GAMES);
    if (games.length === 0) return;
    items.push({
      id: `cat-${slugifyCategoryId(tag)}`,
      label: tag,
      games,
    });
  });

  const hasClient = Boolean(clientLibrary?.ok);
  const hasCategories = sortedTags.length > 0;
  const hasWee = favIdSet.size > 0 || weeCollections.length > 0 || Object.keys(lastLaunchedAt).length > 0;
  const source = hasClient || hasCategories || hasWee ? 'steam-dynamic' : 'dynamic';

  return { source, items };
}

/**
 * @param {{ id: string, label: string, games: unknown[] }[]} items
 * @param {{ shelfOrderMode?: 'custom' | 'alphabetical', customShelfOrder?: string[] | null }} opts
 */
export function orderHubCollectionItems(items, opts = {}) {
  const { shelfOrderMode = 'custom', customShelfOrder = null } = opts;
  const list = Array.isArray(items) ? [...items] : [];
  if (shelfOrderMode === 'alphabetical') {
    return list.sort((a, b) =>
      (a.label || '').localeCompare(b.label || '', undefined, { sensitivity: 'base' })
    );
  }
  if (!Array.isArray(customShelfOrder) || customShelfOrder.length === 0) {
    return list;
  }
  const idx = new Map(customShelfOrder.map((id, i) => [id, i]));
  const max = customShelfOrder.length;
  return list.sort((a, b) => {
    const ia = idx.has(a.id) ? idx.get(a.id) : max + 1;
    const ib = idx.has(b.id) ? idx.get(b.id) : max + 1;
    if (ia !== ib) return ia - ib;
    return (a.label || '').localeCompare(b.label || '', undefined, { sensitivity: 'base' });
  });
}

export function sortHubGamesByName(games) {
  if (!Array.isArray(games)) return [];
  return [...games].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  );
}

export const formatPlaytime = (minutes = 0) => {
  if (!minutes || minutes <= 0) return 'No tracked playtime yet';
  const hours = Math.round(minutes / 60);
  return `${hours.toLocaleString()}h played`;
};

/** Steam `rtime_last_played` — seconds since epoch */
export function formatLastPlayed(unixSeconds = 0) {
  if (!unixSeconds || unixSeconds <= 0) return 'Never';
  const d = new Date(Number(unixSeconds) * 1000);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 0) return d.toLocaleDateString();
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} wk ago`;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function formatDiskSize(game) {
  if (!game) return null;
  if (game.sizeGB != null && game.sizeGB > 0) {
    return `${game.sizeGB % 1 === 0 ? game.sizeGB : game.sizeGB.toFixed(1)} GB`;
  }
  const bytes = Number(game.sizeOnDisk || 0);
  if (bytes > 0) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return null;
}

/**
 * @param {object} opts
 * @param {object} [opts.clientLibrary] — from steam:getClientLibraryMetadata: { ok, favoritesAppIds, appIdToTags } (tags only)
 * @param {object} [opts.weeMeta] — { favoriteGameIds, weeCollections, lastLaunchedAt }
 */
export function buildHubData({ steamGames, epicGames, enrichmentMap, clientLibrary, weeMeta }) {
  const mergedSteam = mergeSteamGamesWithEnrichment(steamGames, enrichmentMap);
  const normalizedSteam = mergedSteam.map((game) => normalizeSteamGame(game, enrichmentMap));
  const normalizedEpic = (epicGames || []).map(normalizeEpicGame);
  const customArtByGameId = weeMeta?.customArtByGameId || {};
  const installedRaw = [...normalizedSteam, ...normalizedEpic];
  const installed = installedRaw.map((g) => applyCustomArtOverrides(g, customArtByGameId));

  const favoriteGameIds = weeMeta?.favoriteGameIds || [];
  const lastLaunchedAt = weeMeta?.lastLaunchedAt || {};
  const favIdSet = new Set(favoriteGameIds.map(String));

  const favoritesOnly = installed
    .filter((g) => favIdSet.has(g.id))
    .sort((a, b) => b.playtimeForever - a.playtimeForever)
    .slice(0, 10);

  const railGames = installed
    .filter((g) => favIdSet.has(g.id))
    .sort(
      (a, b) =>
        effectiveRecentSeconds(b, lastLaunchedAt) - effectiveRecentSeconds(a, lastLaunchedAt) ||
        b.playtimeForever - a.playtimeForever
    )
    .slice(0, MAX_RAIL_FAVORITES);

  const collections = buildDynamicCollections(installed, normalizedSteam, clientLibrary, weeMeta);

  return {
    installed,
    favoritesOnly,
    railGames,
    collections,
  };
}
