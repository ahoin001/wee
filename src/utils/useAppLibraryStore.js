import { create } from 'zustand';
import cacheManager from './CacheManager.js';

// Cache keys for localStorage
const CACHE_KEYS = {
  INSTALLED_APPS: 'installedAppsCache',
  INSTALLED_APPS_TIMESTAMP: 'installedAppsCacheTimestamp',
  STEAM_GAMES: 'steamGamesCache',
  STEAM_GAMES_TIMESTAMP: 'steamGamesCacheTimestamp',
  EPIC_GAMES: 'epicGamesCache',
  EPIC_GAMES_TIMESTAMP: 'epicGamesCacheTimestamp',
  UWP_APPS: 'uwpAppsCache',
  UWP_APPS_TIMESTAMP: 'uwpAppsCacheTimestamp',
};

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Helper functions for cache management
const getCachedData = (key, timestampKey) => {
  try {
    const data = localStorage.getItem(key);
    const timestamp = localStorage.getItem(timestampKey);
    
    if (data && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(data);
      }
    }
  } catch (error) {
    console.warn('Failed to read cache:', key, error);
  }
  return null;
};

const setCachedData = (key, timestampKey, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(timestampKey, Date.now().toString());
  } catch (error) {
    console.warn('Failed to write cache:', key, error);
  }
};

const clearCache = (key, timestampKey) => {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(timestampKey);
  } catch (error) {
    console.warn('Failed to clear cache:', key, error);
  }
};

// Check if cache is valid (exists and not expired)
const isCacheValid = (key, timestampKey) => {
  try {
    const data = localStorage.getItem(key);
    const timestamp = localStorage.getItem(timestampKey);
    
    if (data && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      return age < CACHE_DURATION;
    }
  } catch (error) {
    console.warn('Error checking cache validity:', key, error);
  }
  return false;
};

const useAppLibraryStore = create((set, get) => ({
  // Installed Apps
  installedApps: [],
  appsLoading: false,
  appsError: '',
  fetchInstalledApps: async (forceRefresh = false) => {
    // console.log('[Zustand] fetchInstalledApps called', { forceRefresh });
    set({ appsLoading: true, appsError: '' });
    
    // Check if we have valid cache and don't need to force refresh
    if (!forceRefresh && isCacheValid(CACHE_KEYS.INSTALLED_APPS, CACHE_KEYS.INSTALLED_APPS_TIMESTAMP)) {
      const cachedApps = getCachedData(CACHE_KEYS.INSTALLED_APPS, CACHE_KEYS.INSTALLED_APPS_TIMESTAMP);
      if (cachedApps) {
        set({ installedApps: cachedApps, appsLoading: false });
        console.log('[Zustand] Using valid cached installed apps:', cachedApps.length);
        return; // Exit early - no need to fetch
      }
    }
    
    // Show cached data immediately if available (even if expired)
    const cachedApps = getCachedData(CACHE_KEYS.INSTALLED_APPS, CACHE_KEYS.INSTALLED_APPS_TIMESTAMP);
    if (cachedApps) {
      set({ installedApps: cachedApps, appsLoading: false });
      console.log('[Zustand] Using cached installed apps (will refresh):', cachedApps.length);
    }
    
    try {
      const api = window.api?.apps;
      const apps = await api?.getInstalled();
      // console.log('[Zustand] fetchInstalledApps result:', apps);
      
      if (apps && apps.length > 0) {
        set({ installedApps: apps, appsLoading: false });
        setCachedData(CACHE_KEYS.INSTALLED_APPS, CACHE_KEYS.INSTALLED_APPS_TIMESTAMP, apps);
        console.log('[Zustand] Updated installed apps cache:', apps.length);
      } else {
        set({ appsLoading: false });
      }
    } catch (err) {
      console.log('[Zustand] fetchInstalledApps error:', err);
      set({ appsLoading: false, appsError: err?.message || 'Failed to scan apps.' });
    }
  },
  rescanInstalledApps: async () => {
    set({ appsLoading: true, appsError: '' });
    try {
      const api = window.api?.apps;
      const apps = await api?.rescanInstalled();
      // console.log('[Zustand] rescanInstalledApps result:', apps);
      
      if (apps && apps.length > 0) {
        set({ installedApps: apps, appsLoading: false });
        setCachedData(CACHE_KEYS.INSTALLED_APPS, CACHE_KEYS.INSTALLED_APPS_TIMESTAMP, apps);
        console.log('[Zustand] Updated installed apps cache after rescan:', apps.length);
      } else {
        set({ appsLoading: false });
      }
    } catch (err) {
      console.log('[Zustand] rescanInstalledApps error:', err);
      set({ installedApps: [], appsLoading: false, appsError: err?.message || 'Failed to rescan apps.' });
    }
  },

  // Steam Games
  steamGames: [],
  steamLoading: false,
  steamError: '',
  fetchSteamGames: async (customSteamPath, forceRefresh = false) => {
    // console.log('[Zustand] fetchSteamGames called', { customSteamPath, forceRefresh });
    set({ steamLoading: true, steamError: '' });
    
    // Check if we have valid cache and don't need to force refresh (only for default path)
    if (!customSteamPath && !forceRefresh && isCacheValid(CACHE_KEYS.STEAM_GAMES, CACHE_KEYS.STEAM_GAMES_TIMESTAMP)) {
      const cachedGames = getCachedData(CACHE_KEYS.STEAM_GAMES, CACHE_KEYS.STEAM_GAMES_TIMESTAMP);
      if (cachedGames) {
        set({ steamGames: cachedGames, steamLoading: false });
        console.log('[Zustand] Using valid cached Steam games:', cachedGames.length);
        return; // Exit early - no need to fetch
      }
    }
    
    // Show cached data immediately if available (even if expired)
    if (!customSteamPath) {
      const cachedGames = getCachedData(CACHE_KEYS.STEAM_GAMES, CACHE_KEYS.STEAM_GAMES_TIMESTAMP);
      if (cachedGames) {
        set({ steamGames: cachedGames, steamLoading: false });
        console.log('[Zustand] Using cached Steam games (will refresh):', cachedGames.length);
      }
    }
    
    try {
      const api = window.api?.steam;
      const args = customSteamPath ? { customPath: customSteamPath } : undefined;
      const result = await api?.getInstalledGames(args);
      console.log('[Zustand] fetchSteamGames result:', result);
      
      if (result?.error) {
        set({ steamGames: [], steamLoading: false, steamError: result.error });
      } else if (result?.games && result.games.length > 0) {
        set({ steamGames: result.games, steamLoading: false });
        // Only cache if no custom path (custom paths might change)
        if (!customSteamPath) {
          setCachedData(CACHE_KEYS.STEAM_GAMES, CACHE_KEYS.STEAM_GAMES_TIMESTAMP, result.games);
          console.log('[Zustand] Updated Steam games cache:', result.games.length);
        }
      } else {
        set({ steamLoading: false });
      }
    } catch (err) {
      console.log('[Zustand] fetchSteamGames error:', err);
      set({ steamGames: [], steamLoading: false, steamError: err?.message || 'Failed to scan Steam games.' });
    }
  },
  rescanSteamGames: async (customSteamPath) => {
    await get().fetchSteamGames(customSteamPath, true); // Force refresh
  },

  // Epic Games
  epicGames: [],
  epicLoading: false,
  epicError: '',
  fetchEpicGames: async (forceRefresh = false) => {
    // console.log('[Zustand] fetchEpicGames called', { forceRefresh });
    set({ epicLoading: true, epicError: '' });
    
    // Check if we have valid cache and don't need to force refresh
    if (!forceRefresh && isCacheValid(CACHE_KEYS.EPIC_GAMES, CACHE_KEYS.EPIC_GAMES_TIMESTAMP)) {
      const cachedGames = getCachedData(CACHE_KEYS.EPIC_GAMES, CACHE_KEYS.EPIC_GAMES_TIMESTAMP);
      if (cachedGames) {
        set({ epicGames: cachedGames, epicLoading: false });
        console.log('[Zustand] Using valid cached Epic games:', cachedGames.length);
        return; // Exit early - no need to fetch
      }
    }
    
    // Show cached data immediately if available (even if expired)
    const cachedGames = getCachedData(CACHE_KEYS.EPIC_GAMES, CACHE_KEYS.EPIC_GAMES_TIMESTAMP);
    if (cachedGames) {
      set({ epicGames: cachedGames, epicLoading: false });
      console.log('[Zustand] Using cached Epic games (will refresh):', cachedGames.length);
    }
    
    try {
      const api = window.api?.epic;
      const result = await api?.getInstalledGames();
      console.log('[Zustand] fetchEpicGames result:', result);
      
      if (result?.error) {
        set({ epicGames: [], epicLoading: false, epicError: result.error });
      } else if (result?.games && result.games.length > 0) {
        set({ epicGames: result.games, epicLoading: false });
        setCachedData(CACHE_KEYS.EPIC_GAMES, CACHE_KEYS.EPIC_GAMES_TIMESTAMP, result.games);
        console.log('[Zustand] Updated Epic games cache:', result.games.length);
      } else {
        set({ epicLoading: false });
      }
    } catch (err) {
      console.log('[Zustand] fetchEpicGames error:', err);
      set({ epicGames: [], epicLoading: false, epicError: err?.message || 'Failed to scan Epic games.' });
    }
  },
  rescanEpicGames: async () => {
    await get().fetchEpicGames(true); // Force refresh
  },

  // UWP Apps
  uwpApps: [],
  uwpLoading: false,
  uwpError: '',
  fetchUwpApps: async (forceRefresh = false) => {
    // console.log('[Zustand] fetchUwpApps called', { forceRefresh });
    set({ uwpLoading: true, uwpError: '' });
    
    // Check if we have valid cache and don't need to force refresh
    if (!forceRefresh && isCacheValid(CACHE_KEYS.UWP_APPS, CACHE_KEYS.UWP_APPS_TIMESTAMP)) {
      const cachedApps = getCachedData(CACHE_KEYS.UWP_APPS, CACHE_KEYS.UWP_APPS_TIMESTAMP);
      if (cachedApps) {
        set({ uwpApps: cachedApps, uwpLoading: false });
        console.log('[Zustand] Using valid cached UWP apps:', cachedApps.length);
        return; // Exit early - no need to fetch
      }
    }
    
    // Show cached data immediately if available (even if expired)
    const cachedApps = getCachedData(CACHE_KEYS.UWP_APPS, CACHE_KEYS.UWP_APPS_TIMESTAMP);
    if (cachedApps) {
      set({ uwpApps: cachedApps, uwpLoading: false });
      console.log('[Zustand] Using cached UWP apps (will refresh):', cachedApps.length);
    }
    
    try {
      const api = window.api?.uwp;
      const apps = await api?.listApps();
      console.log('[Zustand] fetchUwpApps result:', apps);
      
      if (apps && apps.length > 0) {
        set({ uwpApps: apps, uwpLoading: false });
        setCachedData(CACHE_KEYS.UWP_APPS, CACHE_KEYS.UWP_APPS_TIMESTAMP, apps);
        console.log('[Zustand] Updated UWP apps cache:', apps.length);
      } else {
        set({ uwpLoading: false });
      }
    } catch (err) {
      console.log('[Zustand] fetchUwpApps error:', err);
      set({ uwpApps: [], uwpLoading: false, uwpError: err?.message || 'Failed to scan Microsoft Store apps.' });
    }
  },
  rescanUwpApps: async () => {
    await get().fetchUwpApps(true); // Force refresh
  },

  // Custom paths
  customSteamPath: localStorage.getItem('customSteamPath') || '',
  setCustomSteamPath: (path) => {
    set({ customSteamPath: path });
    localStorage.setItem('customSteamPath', path);
  },
  customEpicPath: localStorage.getItem('customEpicPath') || '',
  setCustomEpicPath: (path) => {
    set({ customEpicPath: path });
    localStorage.setItem('customEpicPath', path);
  },

  // Cache management
  clearAllCaches: () => {
    Object.values(CACHE_KEYS).forEach(key => {
      if (key.includes('TIMESTAMP')) {
        clearCache(key.replace('_TIMESTAMP', ''), key);
      }
    });
    console.log('[Zustand] Cleared all app library caches');
  },

  clearInstalledAppsCache: () => {
    clearCache(CACHE_KEYS.INSTALLED_APPS, CACHE_KEYS.INSTALLED_APPS_TIMESTAMP);
    console.log('[Zustand] Cleared installed apps cache');
  },

  clearSteamGamesCache: () => {
    clearCache(CACHE_KEYS.STEAM_GAMES, CACHE_KEYS.STEAM_GAMES_TIMESTAMP);
    console.log('[Zustand] Cleared Steam games cache');
  },

  clearEpicGamesCache: () => {
    clearCache(CACHE_KEYS.EPIC_GAMES, CACHE_KEYS.EPIC_GAMES_TIMESTAMP);
    console.log('[Zustand] Cleared Epic games cache');
  },

  clearUwpAppsCache: () => {
    clearCache(CACHE_KEYS.UWP_APPS, CACHE_KEYS.UWP_APPS_TIMESTAMP);
    console.log('[Zustand] Cleared UWP apps cache');
  },

  // Cache status helpers
  isInstalledAppsCacheValid: () => isCacheValid(CACHE_KEYS.INSTALLED_APPS, CACHE_KEYS.INSTALLED_APPS_TIMESTAMP),
  isSteamGamesCacheValid: () => isCacheValid(CACHE_KEYS.STEAM_GAMES, CACHE_KEYS.STEAM_GAMES_TIMESTAMP),
  isEpicGamesCacheValid: () => isCacheValid(CACHE_KEYS.EPIC_GAMES, CACHE_KEYS.EPIC_GAMES_TIMESTAMP),
  isUwpAppsCacheValid: () => isCacheValid(CACHE_KEYS.UWP_APPS, CACHE_KEYS.UWP_APPS_TIMESTAMP),
}));

export default useAppLibraryStore; 