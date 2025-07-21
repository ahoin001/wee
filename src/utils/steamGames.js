// Utility for loading, caching, and fuzzy searching Steam games

const GAMES_URL = 'https://api.steampowered.com/ISteamApps/GetAppList/v2/';
const POPULAR_GAMES_URL = '/steam-popular.json';
const CACHE_KEY = 'steamGamesCache';
const CACHE_TIMESTAMP_KEY = 'steamGamesCacheTimestamp';

let gamesCache = null;
let lastUpdated = null;
let lastError = null;

// Simple fuzzy search (case-insensitive substring match)
function fuzzySearch(games, query) {
  if (!query) return [];
  const q = query.toLowerCase();
  return games.filter(g => g.name.toLowerCase().includes(q)).slice(0, 10);
}

export async function loadGames() {
  lastError = null;
  console.log('[SteamGames] Fetching full Steam games list...');
  try {
    const resp = await fetch(GAMES_URL);
    if (!resp.ok) throw new Error('Steam API fetch failed: ' + resp.status);
    const data = await resp.json();
    // Format: { applist: { apps: [ { appid, name } ] } }
    const games = data.applist?.apps || [];
    gamesCache = games;
    lastUpdated = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify(games));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, lastUpdated);
    console.log(`[SteamGames] Fetched full list: ${games.length} games.`);
    return games;
  } catch (err) {
    lastError = err.message;
    console.error('[SteamGames] Failed to fetch full list:', err);
    // Fallback to popular games
    try {
      console.log('[SteamGames] Fetching fallback popular games...');
      const resp = await fetch(POPULAR_GAMES_URL);
      if (!resp.ok) throw new Error('Popular games fetch failed: ' + resp.status);
      const data = await resp.json();
      gamesCache = data;
      lastUpdated = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, lastUpdated);
      console.log(`[SteamGames] Fallback: loaded ${data.length} popular games.`);
      return data;
    } catch (fallbackErr) {
      lastError = fallbackErr.message;
      gamesCache = null;
      lastUpdated = null;
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.error('[SteamGames] Failed to fetch fallback popular games:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export function getCachedGames() {
  if (gamesCache) return gamesCache;
  const raw = localStorage.getItem(CACHE_KEY);
  if (raw) {
    gamesCache = JSON.parse(raw);
    lastUpdated = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY), 10) || null;
    return gamesCache;
  }
  return null;
}

export function clearGamesCache() {
  gamesCache = null;
  lastUpdated = null;
  lastError = null;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
}

export function searchGames(query) {
  const games = getCachedGames();
  if (!games) return [];
  return fuzzySearch(games, query);
}

export function getLastUpdated() {
  return lastUpdated;
}

export function getLastError() {
  return lastError;
} 