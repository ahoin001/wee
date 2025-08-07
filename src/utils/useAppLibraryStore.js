import { create } from 'zustand';

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to get cache key
const getCacheKey = (type) => `app_cache_${type}`;

// Helper function to get cache timestamp key
const getCacheTimestampKey = (type) => `app_cache_timestamp_${type}`;

// Helper function to check if cache is valid
const isCacheValid = (type) => {
  const timestamp = localStorage.getItem(getCacheTimestampKey(type));
  if (!timestamp) return false;
  
  const cacheAge = Date.now() - parseInt(timestamp);
  return cacheAge < CACHE_DURATION;
};

// Helper function to get cached data
const getCachedData = (type) => {
  try {
    const cached = localStorage.getItem(getCacheKey(type));
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn(`[Cache] Failed to parse cached ${type} data:`, err);
    return null;
  }
};

// Helper function to set cached data
const setCachedData = (type, data) => {
  try {
    localStorage.setItem(getCacheKey(type), JSON.stringify(data));
    localStorage.setItem(getCacheTimestampKey(type), Date.now().toString());
  } catch (err) {
    console.warn(`[Cache] Failed to cache ${type} data:`, err);
  }
};

const useAppLibraryStore = create((set, get) => ({
  // Installed Apps
  installedApps: [],
  appsLoading: false,
  appsError: '',
  
  // Add loading states for individual app types
  steamLoading: false,
  epicLoading: false,
  uwpLoading: false,
  
  fetchInstalledApps: async () => {
    console.log('[Zustand] fetchInstalledApps called');
    
    // Check if already loading
    if (get().appsLoading) {
      console.log('[Zustand] Already loading installed apps, skipping');
      return;
    }
    
    set({ appsLoading: true, appsError: '' });
    
    // Check cache first
    if (isCacheValid('installedApps')) {
      const cachedApps = getCachedData('installedApps');
      if (cachedApps && cachedApps.length > 0) {
        console.log('[Zustand] Using cached installed apps:', cachedApps.length);
        set({ installedApps: cachedApps, appsLoading: false });
        return;
      } else if (cachedApps && cachedApps.length === 0) {
        // Clear empty cache to force fresh scan
        console.log('[Zustand] Clearing empty cache to force fresh scan');
        localStorage.removeItem(getCacheKey('installedApps'));
        localStorage.removeItem(getCacheTimestampKey('installedApps'));
      }
    }
    
    // Cache miss, expired, or empty cache - fetch from API
    try {
      const api = window.api?.apps;
      const apps = await api?.getInstalled();
      console.log('[Zustand] fetchInstalledApps result:', apps?.length || 0);
      
      const appsArray = apps || [];
      set({ installedApps: appsArray, appsLoading: false });
      
      // Cache the result
      setCachedData('installedApps', appsArray);
    } catch (err) {
      console.log('[Zustand] fetchInstalledApps error:', err);
      set({ installedApps: [], appsLoading: false, appsError: err?.message || 'Failed to scan apps.' });
    }
  },
  rescanInstalledApps: async () => {
    console.log('[Zustand] rescanInstalledApps called - forcing fresh scan');
    set({ appsLoading: true, appsError: '' });
    
    // Clear cache to force fresh scan
    localStorage.removeItem(getCacheKey('installedApps'));
    localStorage.removeItem(getCacheTimestampKey('installedApps'));
    
    try {
      const api = window.api?.apps;
      const apps = await api?.rescanInstalled();
      console.log('[Zustand] rescanInstalledApps result:', apps?.length || 0);
      
      const appsArray = apps || [];
      set({ installedApps: appsArray, appsLoading: false });
      
      // Cache the fresh result
      setCachedData('installedApps', appsArray);
    } catch (err) {
      console.log('[Zustand] rescanInstalledApps error:', err);
      set({ installedApps: [], appsLoading: false, appsError: err?.message || 'Failed to rescan apps.' });
    }
  },

  // Steam Games
  steamGames: [],
  steamLoading: false,
  steamError: '',
  fetchSteamGames: async (customSteamPath) => {
    console.log('[Zustand] fetchSteamGames called', customSteamPath);
    set({ steamLoading: true, steamError: '' });
    
    // Check cache first (only if no custom path is provided)
    if (!customSteamPath && isCacheValid('steamGames')) {
      const cachedGames = getCachedData('steamGames');
      if (cachedGames) {
        console.log('[Zustand] Using cached Steam games:', cachedGames.length);
        set({ steamGames: cachedGames, steamLoading: false });
        return;
      }
    }
    
    // Cache miss, expired, or custom path - fetch from API
    try {
      const api = window.api?.steam;
      console.log('[Zustand] Steam API available:', !!api);
      console.log('[Zustand] window.api available:', !!window.api);
      const args = customSteamPath ? { customPath: customSteamPath } : undefined;
      const result = await api?.getInstalledGames(args);
      console.log('[Zustand] fetchSteamGames result:', result);
      
      if (result?.error) {
        set({ steamGames: [], steamLoading: false, steamError: result.error });
      } else {
        const gamesArray = result?.games || [];
        set({ steamGames: gamesArray, steamLoading: false });
        
        // Cache the result (only if no custom path)
        if (!customSteamPath) {
          setCachedData('steamGames', gamesArray);
        }
      }
    } catch (err) {
      console.log('[Zustand] fetchSteamGames error:', err);
      set({ steamGames: [], steamLoading: false, steamError: err?.message || 'Failed to scan Steam games.' });
    }
  },
  rescanSteamGames: async (customSteamPath) => {
    console.log('[Zustand] rescanSteamGames called - forcing fresh scan');
    set({ steamLoading: true, steamError: '' });
    
    // Clear cache to force fresh scan
    localStorage.removeItem(getCacheKey('steamGames'));
    localStorage.removeItem(getCacheTimestampKey('steamGames'));
    
    try {
      const api = window.api?.steam;
      const args = customSteamPath ? { customPath: customSteamPath } : undefined;
      const result = await api?.getInstalledGames(args);
      console.log('[Zustand] rescanSteamGames result:', result);
      
      if (result?.error) {
        set({ steamGames: [], steamLoading: false, steamError: result.error });
      } else {
        const gamesArray = result?.games || [];
        set({ steamGames: gamesArray, steamLoading: false });
        
        // Cache the fresh result (only if no custom path)
        if (!customSteamPath) {
          setCachedData('steamGames', gamesArray);
        }
      }
    } catch (err) {
      console.log('[Zustand] rescanSteamGames error:', err);
      set({ steamGames: [], steamLoading: false, steamError: err?.message || 'Failed to scan Steam games.' });
    }
  },

  // Epic Games
  epicGames: [],
  epicLoading: false,
  epicError: '',
  fetchEpicGames: async () => {
    console.log('[Zustand] fetchEpicGames called');
    set({ epicLoading: true, epicError: '' });
    
    // Check cache first
    if (isCacheValid('epicGames')) {
      const cachedGames = getCachedData('epicGames');
      if (cachedGames) {
        console.log('[Zustand] Using cached Epic games:', cachedGames.length);
        set({ epicGames: cachedGames, epicLoading: false });
        return;
      }
    }
    
    // Cache miss or expired, fetch from API
    try {
      const api = window.api?.epic;
      const result = await api?.getInstalledGames();
      console.log('[Zustand] fetchEpicGames result:', result);
      
      if (result?.error) {
        set({ epicGames: [], epicLoading: false, epicError: result.error });
      } else {
        const gamesArray = result?.games || [];
        set({ epicGames: gamesArray, epicLoading: false });
        
        // Cache the result
        setCachedData('epicGames', gamesArray);
      }
    } catch (err) {
      console.log('[Zustand] fetchEpicGames error:', err);
      set({ epicGames: [], epicLoading: false, epicError: err?.message || 'Failed to scan Epic games.' });
    }
  },
  rescanEpicGames: async () => {
    console.log('[Zustand] rescanEpicGames called - forcing fresh scan');
    set({ epicLoading: true, epicError: '' });
    
    // Clear cache to force fresh scan
    localStorage.removeItem(getCacheKey('epicGames'));
    localStorage.removeItem(getCacheTimestampKey('epicGames'));
    
    try {
      const api = window.api?.epic;
      const result = await api?.getInstalledGames();
      console.log('[Zustand] rescanEpicGames result:', result);
      
      if (result?.error) {
        set({ epicGames: [], epicLoading: false, epicError: result.error });
      } else {
        const gamesArray = result?.games || [];
        set({ epicGames: gamesArray, epicLoading: false });
        
        // Cache the fresh result
        setCachedData('epicGames', gamesArray);
      }
    } catch (err) {
      console.log('[Zustand] rescanEpicGames error:', err);
      set({ epicGames: [], epicLoading: false, epicError: err?.message || 'Failed to scan Epic games.' });
    }
  },

  // UWP Apps
  uwpApps: [],
  uwpLoading: false,
  uwpError: '',
  fetchUwpApps: async () => {
    console.log('[Zustand] fetchUwpApps called');
    set({ uwpLoading: true, uwpError: '' });
    
    // Check cache first
    if (isCacheValid('uwpApps')) {
      const cachedApps = getCachedData('uwpApps');
      if (cachedApps) {
        console.log('[Zustand] Using cached UWP apps:', cachedApps.length);
        set({ uwpApps: cachedApps, uwpLoading: false });
        return;
      }
    }
    
    // Cache miss or expired, fetch from API
    try {
      const api = window.api?.uwp;
      const apps = await api?.listApps();
      console.log('[Zustand] fetchUwpApps result:', apps?.length || 0);
      
      const appsArray = apps || [];
      set({ uwpApps: appsArray, uwpLoading: false });
      
      // Cache the result
      setCachedData('uwpApps', appsArray);
    } catch (err) {
      console.log('[Zustand] fetchUwpApps error:', err);
      set({ uwpApps: [], uwpLoading: false, uwpError: err?.message || 'Failed to scan Microsoft Store apps.' });
    }
  },
  rescanUwpApps: async () => {
    console.log('[Zustand] rescanUwpApps called - forcing fresh scan');
    set({ uwpLoading: true, uwpError: '' });
    
    // Clear cache to force fresh scan
    localStorage.removeItem(getCacheKey('uwpApps'));
    localStorage.removeItem(getCacheTimestampKey('uwpApps'));
    
    try {
      const api = window.api?.uwp;
      const apps = await api?.listApps();
      console.log('[Zustand] rescanUwpApps result:', apps?.length || 0);
      
      const appsArray = apps || [];
      set({ uwpApps: appsArray, uwpLoading: false });
      
      // Cache the fresh result
      setCachedData('uwpApps', appsArray);
    } catch (err) {
      console.log('[Zustand] rescanUwpApps error:', err);
      set({ uwpApps: [], uwpLoading: false, uwpError: err?.message || 'Failed to scan Microsoft Store apps.' });
    }
  },

  // Steam library path (single source of truth)
  customSteamPath: localStorage.getItem('customSteamPath') || '',
  setCustomSteamPath: (path) => {
    localStorage.setItem('customSteamPath', path);
    set({ customSteamPath: path });
  },

  // Epic library path (single source of truth)
  customEpicPath: localStorage.getItem('customEpicPath') || '',
  setCustomEpicPath: (path) => {
    localStorage.setItem('customEpicPath', path);
    set({ customEpicPath: path });
  },

  // Cache management utilities
  clearAllCaches: () => {
    console.log('[Zustand] Clearing all app caches');
    const cacheTypes = ['installedApps', 'steamGames', 'epicGames', 'uwpApps'];
    cacheTypes.forEach(type => {
      localStorage.removeItem(getCacheKey(type));
      localStorage.removeItem(getCacheTimestampKey(type));
    });
  },
  
  getCacheInfo: () => {
    const cacheTypes = ['installedApps', 'steamGames', 'epicGames', 'uwpApps'];
    const info = {};
    
    cacheTypes.forEach(type => {
      const timestamp = localStorage.getItem(getCacheTimestampKey(type));
      const data = getCachedData(type);
      
      info[type] = {
        hasCache: !!data,
        isValid: isCacheValid(type),
        itemCount: data ? data.length : 0,
        age: timestamp ? Math.floor((Date.now() - parseInt(timestamp)) / (1000 * 60 * 60)) : null // hours
      };
    });
    
    return info;
  },
}));

export default useAppLibraryStore; 