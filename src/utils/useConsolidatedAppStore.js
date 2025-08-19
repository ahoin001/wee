import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { DEFAULT_SHORTCUTS } from './keyboardShortcuts';

// App library management functions - moved outside store to prevent recreation
const appLibraryManager = {
  // Cache for app scanning results
  _cache: {
    installedApps: { data: null, timestamp: 0, ttl: 5 * 60 * 1000 }, // 5 minutes
    steamGames: { data: null, timestamp: 0, ttl: 10 * 60 * 1000 }, // 10 minutes
    epicGames: { data: null, timestamp: 0, ttl: 10 * 60 * 1000 }, // 10 minutes
    uwpApps: { data: null, timestamp: 0, ttl: 15 * 60 * 1000 }, // 15 minutes
  },

  // Debounce timers
  _debounceTimers: {
    installedApps: null,
    steamGames: null,
    epicGames: null,
    uwpApps: null,
  },

  // Check if cache is valid
  _isCacheValid: (cacheKey) => {
    const cache = appLibraryManager._cache[cacheKey];
    return cache && cache.data && (Date.now() - cache.timestamp) < cache.ttl;
  },

  // Set cache data
  _setCache: (cacheKey, data) => {
    appLibraryManager._cache[cacheKey] = {
      data,
      timestamp: Date.now(),
      ttl: appLibraryManager._cache[cacheKey].ttl
    };
  },

  // Clear cache
  _clearCache: (cacheKey) => {
    if (cacheKey) {
      appLibraryManager._cache[cacheKey] = { data: null, timestamp: 0, ttl: appLibraryManager._cache[cacheKey].ttl };
    } else {
      // Clear all caches
      Object.keys(appLibraryManager._cache).forEach(key => {
        appLibraryManager._cache[key] = { data: null, timestamp: 0, ttl: appLibraryManager._cache[key].ttl };
      });
    }
  },

  // Debounced fetch function
  _debouncedFetch: (cacheKey, fetchFunction, delay = 1000) => {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (appLibraryManager._debounceTimers[cacheKey]) {
        clearTimeout(appLibraryManager._debounceTimers[cacheKey]);
      }

      // Set new timer
      appLibraryManager._debounceTimers[cacheKey] = setTimeout(async () => {
        try {
          const result = await fetchFunction();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  },

  fetchInstalledApps: async (forceRefresh = false) => {
    const store = useConsolidatedAppStore.getState();
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && appLibraryManager._isCacheValid('installedApps')) {
      console.log('[AppLibrary] Using cached installed apps');
      const cachedData = appLibraryManager._cache.installedApps.data;
      store.actions.setAppLibraryState({ 
        installedApps: cachedData, 
        appsLoading: false 
      });
      return { success: true, apps: cachedData };
    }

    // Don't start loading if already loading
    if (store.appLibrary.appsLoading) {
      console.log('[AppLibrary] Installed apps already loading, skipping...');
      return { success: false, error: 'Already loading' };
    }

    store.actions.setAppLibraryState({ appsLoading: true, appsError: null });
    
    try {
      // Real implementation - scan for installed apps
      if (window.api && window.api.apps && window.api.apps.getInstalled) {
        const result = await window.api.apps.getInstalled();
        // The API returns the apps array directly, not wrapped in success/error
        const apps = Array.isArray(result) ? result : [];
        
        // Cache the result
        appLibraryManager._setCache('installedApps', apps);
        
        store.actions.setAppLibraryState({ 
          installedApps: apps, 
          appsLoading: false 
        });
        return { success: true, apps };
      } else {
        // Fallback to mock if API not available
        const apps = [];
        appLibraryManager._setCache('installedApps', apps);
        store.actions.setAppLibraryState({ installedApps: apps, appsLoading: false });
        return { success: true, apps };
      }
    } catch (error) {
      store.actions.setAppLibraryState({ 
        appsLoading: false, 
        appsError: error.message || 'Failed to fetch installed apps' 
      });
      return { success: false, error: error.message };
    }
  },

  fetchSteamGames: async (forceRefresh = false) => {
    const store = useConsolidatedAppStore.getState();
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && appLibraryManager._isCacheValid('steamGames')) {
      console.log('[AppLibrary] Using cached Steam games');
      const cachedData = appLibraryManager._cache.steamGames.data;
      store.actions.setAppLibraryState({ 
        steamGames: cachedData, 
        steamLoading: false 
      });
      return { success: true, games: cachedData };
    }

    // Don't start loading if already loading
    if (store.appLibrary.steamLoading) {
      console.log('[AppLibrary] Steam games already loading, skipping...');
      return { success: false, error: 'Already loading' };
    }

    store.actions.setAppLibraryState({ steamLoading: true, steamError: null });
    
    try {
      // Real implementation - scan Steam library
      if (window.api && window.api.steam && window.api.steam.scanGames) {
        // First, detect Steam installation
        let steamPath = null;
        if (window.api.steam.detectInstallation) {
          try {
            const detectionResult = await window.api.steam.detectInstallation();
            steamPath = detectionResult.steamPath;
          } catch (error) {
            console.warn('Failed to detect Steam installation:', error);
          }
        }
        
        // Then, get Steam libraries
        let libraryPaths = [];
        if (steamPath && window.api.steam.getLibraries) {
          try {
            const librariesResult = await window.api.steam.getLibraries({ steamPath });
            libraryPaths = librariesResult.libraries || [];
          } catch (error) {
            console.warn('Failed to get Steam libraries, using defaults:', error);
          }
        }
        
        // Fallback to common Steam library paths if no libraries found
        if (libraryPaths.length === 0) {
          libraryPaths = [
            'C:\\Program Files (x86)\\Steam\\steamapps',
            'C:\\Steam\\steamapps',
            'D:\\Steam\\steamapps'
          ];
        }
        
        // Call scanGames with library paths
        const result = await window.api.steam.scanGames({ libraryPaths });
        // The API returns { games: [...] } format
        const games = result?.games || [];
        
        // Cache the result
        appLibraryManager._setCache('steamGames', games);
        
        store.actions.setAppLibraryState({ 
          steamGames: games, 
          steamLoading: false 
        });
        return { success: true, games };
      } else {
        // Fallback to mock if API not available
        const games = [];
        appLibraryManager._setCache('steamGames', games);
        store.actions.setAppLibraryState({ steamGames: games, steamLoading: false });
        return { success: true, games };
      }
    } catch (error) {
      store.actions.setAppLibraryState({ 
        steamLoading: false, 
        steamError: error.message || 'Failed to fetch Steam games' 
      });
      return { success: false, error: error.message };
    }
  },

  fetchEpicGames: async (forceRefresh = false) => {
    const store = useConsolidatedAppStore.getState();
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && appLibraryManager._isCacheValid('epicGames')) {
      console.log('[AppLibrary] Using cached Epic games');
      const cachedData = appLibraryManager._cache.epicGames.data;
      store.actions.setAppLibraryState({ 
        epicGames: cachedData, 
        epicLoading: false 
      });
      return { success: true, games: cachedData };
    }

    // Don't start loading if already loading
    if (store.appLibrary.epicLoading) {
      console.log('[AppLibrary] Epic games already loading, skipping...');
      return { success: false, error: 'Already loading' };
    }

    store.actions.setAppLibraryState({ epicLoading: true, epicError: null });
    
    try {
      // Real implementation - scan Epic library
      if (window.api && window.api.epic && window.api.epic.getInstalledGames) {
        const result = await window.api.epic.getInstalledGames();
        // The API returns { games: [...] } format
        const games = result?.games || [];
        
        // Cache the result
        appLibraryManager._setCache('epicGames', games);
        
        store.actions.setAppLibraryState({ 
          epicGames: games, 
          epicLoading: false 
        });
        return { success: true, games };
      } else {
        // Fallback to mock if API not available
        const games = [];
        appLibraryManager._setCache('epicGames', games);
        store.actions.setAppLibraryState({ epicGames: games, epicLoading: false });
        return { success: true, games };
      }
    } catch (error) {
      store.actions.setAppLibraryState({ 
        epicLoading: false, 
        epicError: error.message || 'Failed to fetch Epic games' 
      });
      return { success: false, error: error.message };
    }
  },

  fetchUwpApps: async (forceRefresh = false) => {
    const store = useConsolidatedAppStore.getState();
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && appLibraryManager._isCacheValid('uwpApps')) {
      console.log('[AppLibrary] Using cached UWP apps');
      const cachedData = appLibraryManager._cache.uwpApps.data;
      store.actions.setAppLibraryState({ 
        uwpApps: cachedData, 
        uwpLoading: false 
      });
      return { success: true, apps: cachedData };
    }

    // Don't start loading if already loading
    if (store.appLibrary.uwpLoading) {
      console.log('[AppLibrary] UWP apps already loading, skipping...');
      return { success: false, error: 'Already loading' };
    }

    store.actions.setAppLibraryState({ uwpLoading: true, uwpError: null });
    
    try {
      // Real implementation - scan UWP apps
      if (window.api && window.api.uwp && window.api.uwp.listApps) {
        const result = await window.api.uwp.listApps();
        // The API returns the apps array directly, not wrapped in success/error
        const apps = Array.isArray(result) ? result : [];
        
        // Cache the result
        appLibraryManager._setCache('uwpApps', apps);
        
        store.actions.setAppLibraryState({ 
          uwpApps: apps, 
          uwpLoading: false 
        });
        return { success: true, apps };
      } else {
        // Fallback to mock if API not available
        const apps = [];
        appLibraryManager._setCache('uwpApps', apps);
        store.actions.setAppLibraryState({ uwpApps: apps, uwpLoading: false });
        return { success: true, apps };
      }
    } catch (error) {
      store.actions.setAppLibraryState({ 
        uwpLoading: false, 
        uwpError: error.message || 'Failed to fetch UWP apps' 
      });
      return { success: false, error: error.message };
    }
  },

  setCustomSteamPath: (path) => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setAppLibraryState({ customSteamPath: path });
    // Clear Steam cache when path changes
    appLibraryManager._clearCache('steamGames');
  },

  // Force refresh all app data
  refreshAllApps: async () => {
    console.log('[AppLibrary] Force refreshing all app data...');
    appLibraryManager._clearCache();
    
    const results = await Promise.allSettled([
      appLibraryManager.fetchInstalledApps(true),
      appLibraryManager.fetchSteamGames(true),
      appLibraryManager.fetchEpicGames(true),
      appLibraryManager.fetchUwpApps(true)
    ]);
    
    return results.map((result, index) => ({
      type: ['installedApps', 'steamGames', 'epicGames', 'uwpApps'][index],
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason : null
    }));
  }
};

// Unified app management functions - moved outside store to prevent recreation
const unifiedAppManager = {
  fetchUnifiedApps: async () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setUnifiedAppsState({ loading: true, error: null });
    
    try {
      // Real implementation - combine all app sources
      const allApps = [];
      
      // Fetch from all sources
      const [installedResult, steamResult, epicResult, uwpResult] = await Promise.allSettled([
        appLibraryManager.fetchInstalledApps(),
        appLibraryManager.fetchSteamGames(),
        appLibraryManager.fetchEpicGames(),
        appLibraryManager.fetchUwpApps()
      ]);
      
      // Combine results with proper data mapping and error handling
      console.log('[UnifiedAppManager] Processing fetch results:', {
        installed: { status: installedResult.status, success: installedResult.value?.success, count: installedResult.value?.apps?.length },
        steam: { status: steamResult.status, success: steamResult.value?.success, count: steamResult.value?.games?.length },
        epic: { status: epicResult.status, success: epicResult.value?.success, count: epicResult.value?.games?.length },
        uwp: { status: uwpResult.status, success: uwpResult.value?.success, count: uwpResult.value?.apps?.length }
      });
      
      if (installedResult.status === 'fulfilled' && installedResult.value?.success) {
        const installedApps = installedResult.value.apps || [];
        console.log('[UnifiedAppManager] Adding installed apps:', installedApps.length);
        allApps.push(...installedApps.map(app => ({ 
          ...app, 
          type: 'exe', // Map to 'exe' type for consistency
          id: app.id || `exe-${app.path || app.name}`,
          category: 'Installed App'
        })));
      } else if (installedResult.status === 'rejected') {
        console.error('[UnifiedAppManager] Installed apps fetch failed:', installedResult.reason);
      }
      
      if (steamResult.status === 'fulfilled' && steamResult.value?.success) {
        const steamGames = steamResult.value.games || [];
        console.log('[UnifiedAppManager] Adding Steam games:', steamGames.length);
        allApps.push(...steamGames.map(game => ({ 
          ...game, 
          type: 'steam',
          id: game.id || `steam-${game.appId || game.name}`,
          category: 'Steam Game',
          path: `steam://rungameid/${game.appId || game.appid}`
        })));
      } else if (steamResult.status === 'rejected') {
        console.error('[UnifiedAppManager] Steam games fetch failed:', steamResult.reason);
      }
      
      if (epicResult.status === 'fulfilled' && epicResult.value?.success) {
        const epicGames = epicResult.value.games || [];
        console.log('[UnifiedAppManager] Adding Epic games:', epicGames.length);
        allApps.push(...epicGames.map(game => ({ 
          ...game, 
          type: 'epic',
          id: game.id || `epic-${game.appName || game.name}`,
          category: 'Epic Game',
          path: `com.epicgames.launcher://apps/${game.appName || game.name}?action=launch&silent=true`
        })));
      } else if (epicResult.status === 'rejected') {
        console.error('[UnifiedAppManager] Epic games fetch failed:', epicResult.reason);
      }
      
      if (uwpResult.status === 'fulfilled' && uwpResult.value?.success) {
        const uwpApps = uwpResult.value.apps || [];
        console.log('[UnifiedAppManager] Adding UWP apps:', uwpApps.length);
        allApps.push(...uwpApps.map(app => ({ 
          ...app, 
          type: 'microsoft',
          id: app.id || `microsoft-${app.appId || app.name}`,
          category: 'Microsoft Store App',
          path: app.appId || app.name // UWP apps use AppID as path
        })));
      } else if (uwpResult.status === 'rejected') {
        console.error('[UnifiedAppManager] UWP apps fetch failed:', uwpResult.reason);
      }
      
      console.log('[UnifiedAppManager] Total combined apps:', allApps.length);
      console.log('[UnifiedAppManager] Apps by type:', {
        exe: allApps.filter(app => app.type === 'exe').length,
        steam: allApps.filter(app => app.type === 'steam').length,
        epic: allApps.filter(app => app.type === 'epic').length,
        microsoft: allApps.filter(app => app.type === 'microsoft').length
      });
      
      store.actions.setUnifiedAppsState({ apps: allApps, loading: false });
      return { success: true, apps: allApps };
    } catch (error) {
      store.actions.setUnifiedAppsState({ 
        loading: false, 
        error: error.message || 'Failed to fetch unified apps' 
      });
      return { success: false, error: error.message };
    }
  },

  setSelectedApp: (app) => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setUnifiedAppsState({ selectedApp: app });
  },

  setSearchQuery: (query) => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setUnifiedAppsState({ searchQuery: query });
  },

  setSelectedAppType: (type) => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setUnifiedAppsState({ selectedAppType: type });
  },

  clearSelection: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setUnifiedAppsState({ selectedApp: null });
  },

  generatePathFromApp: (app) => {
    return app?.path || '';
  },

  getFilteredApps: () => {
    const store = useConsolidatedAppStore.getState();
    const { apps, searchQuery, selectedAppType } = store.unifiedApps;
    
    return apps.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedAppType === 'all' || app.type === selectedAppType)
    );
  },

  rescanUnifiedApps: async () => {
    return unifiedAppManager.fetchUnifiedApps();
  }
};

// Spotify management functions - moved outside store to prevent recreation
const spotifyManager = {
  connect: async () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setSpotifyState({ loading: true, error: null });
    
    try {
      // Import and use the real Spotify service
      const spotifyService = (await import('./spotifyService')).default;
      
      // Initialize the service
      const isInitialized = await spotifyService.initialize();
      
      if (isInitialized) {
        // Already authenticated
        store.actions.setSpotifyState({
          isConnected: true,
          loading: false,
          error: null
        });
        return { success: true };
      } else {
        // Start OAuth flow
        spotifyService.authenticate();
        
        // Set up listeners for auth success/failure
        const handleAuthSuccess = () => {
          store.actions.setSpotifyState({
            isConnected: true,
            loading: false,
            error: null
          });
        };
        
        const handleAuthError = (error) => {
          store.actions.setSpotifyState({
            isConnected: false,
            loading: false,
            error: error.message || 'Authentication failed'
          });
        };
        
        // Listen for auth callbacks
        if (window.api && window.api.onSpotifyAuthSuccess) {
          window.api.onSpotifyAuthSuccess(handleAuthSuccess);
        }
        if (window.api && window.api.onSpotifyAuthError) {
          window.api.onSpotifyAuthError(handleAuthError);
        }
        
        return { success: true, message: 'OAuth flow initiated' };
      }
    } catch (error) {
      store.actions.setSpotifyState({
        loading: false,
        error: error.message || 'Failed to connect to Spotify'
      });
      return { success: false, error: error.message };
    }
  },

  disconnect: async () => {
    const store = useConsolidatedAppStore.getState();
    
    try {
      // Import and use the real Spotify service
      const spotifyService = (await import('./spotifyService')).default;
      spotifyService.logout();
      
      store.actions.setSpotifyState({
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('[SpotifyManager] Disconnect error:', error);
      store.actions.setSpotifyState({
        isConnected: false,
        loading: false,
        error: error.message
      });
    }
  },

  refreshToken: async () => {
    const store = useConsolidatedAppStore.getState();
    const { refreshToken } = store.spotify;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const spotifyService = (await import('./spotifyService')).default;
      const result = await spotifyService.refreshAccessToken(refreshToken);
      
      if (result.success) {
        store.actions.setSpotifyState({
          accessToken: result.access_token,
          refreshToken: result.refresh_token
        });
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to refresh token');
      }
    } catch (error) {
      store.actions.setSpotifyState({
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  },

  getCurrentPlayback: async () => {
    try {
      const spotifyService = (await import('./spotifyService')).default;
      return await spotifyService.getCurrentPlayback();
    } catch (error) {
      console.error('[SpotifyManager] Get current playback error:', error);
      return null;
    }
  },

  togglePlayback: async () => {
    try {
      const spotifyService = (await import('./spotifyService')).default;
      return await spotifyService.togglePlayback();
    } catch (error) {
      console.error('[SpotifyManager] Toggle playback error:', error);
      throw error;
    }
  },

  skipToNext: async () => {
    try {
      const spotifyService = (await import('./spotifyService')).default;
      return await spotifyService.skipToNext();
    } catch (error) {
      console.error('[SpotifyManager] Skip to next error:', error);
      throw error;
    }
  },

  skipToPrevious: async () => {
    try {
      const spotifyService = (await import('./spotifyService')).default;
      return await spotifyService.skipToPrevious();
    } catch (error) {
      console.error('[SpotifyManager] Skip to previous error:', error);
      throw error;
    }
  }
};

console.log('[DEBUG] 🏪 Creating consolidated app store...');
// Consolidated app store - single source of truth for all app state
const useConsolidatedAppStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Core app state
        app: {
          version: '2.9.4',
          isInitialized: false,
          isLoading: true,
          splashFading: false,
          appReady: false,
          hasInitialized: false,
          isEditMode: false,
          showDragRegion: false,
          showAdminMenu: false,
          showCountdown: false,
          isScreenshotInProgress: false,
          updateAvailable: false,
        },

        // UI state
        ui: {
          isDarkMode: false,
          useCustomCursor: true,
          cursorStyle: 'classic', // 'classic', 'minimal', 'glowing', 'retro'
          startInFullscreen: false,
          showPresetsButton: false,
          startOnBoot: false,
          settingsShortcut: '',
          // New shortcut properties for enhanced shortcuts tab
          spotifyWidgetShortcut: '',
          systemInfoWidgetShortcut: '',
          adminPanelWidgetShortcut: '',
          performanceMonitorShortcut: '',
          nextPageShortcut: '',
          prevPageShortcut: '',
          toggleDockShortcut: '',
          toggleDarkModeShortcut: '',
          toggleCustomCursorShortcut: '',
          immersivePip: false,
          showDock: true,
          classicMode: false,
          channelOpacity: 1,
          lastChannelHoverTime: Date.now(),
          // Modal states
          showPresetsModal: false,
          showSettingsModal: false,
          showSettingsActionMenu: false, // Settings action menu state
          showWallpaperModal: false,
          showSoundModal: false,
          showChannelSettingsModal: false,
          showAppShortcutsModal: false,
          showTimeSettingsModal: false,
          showRibbonSettingsModal: false,
          showUpdateModal: false,
          showPrimaryActionsModal: false,
          showImageSearchModal: false,
          showNavigationCustomizationModal: false,
          showMonitorSelectionModal: false,
          settingsActiveTab: 'channels', // Default active tab for settings modal
          // Keyboard shortcuts
          keyboardShortcuts: DEFAULT_SHORTCUTS.map(shortcut => ({
            ...shortcut,
            key: shortcut.defaultKey,
            modifier: shortcut.defaultModifier,
            enabled: true
          })),
        },

        // Ribbon state
        ribbon: {
          glassWiiRibbon: false,
          glassOpacity: 0.18,
          glassBlur: 2.5,
          glassBorderOpacity: 0.5,
          glassShineOpacity: 0.7,
          ribbonColor: '#e0e6ef',
          recentRibbonColors: [],
          ribbonGlowColor: '#0099ff',
          recentRibbonGlowColors: [],
          ribbonGlowStrength: 16,
          ribbonGlowStrengthHover: 20,
          ribbonDockOpacity: 1,
          ribbonButtonConfigs: [],
          presetsButtonConfig: {
            type: 'icon',
            icon: 'star',
            useAdaptiveColor: false,
            useGlowEffect: false,
            glowStrength: 20,
            useGlassEffect: false,
            glassOpacity: 0.18,
            glassBlur: 2.5,
            glassBorderOpacity: 0.5,
            glassShineOpacity: 0.7
          },
        },

        // Wallpaper state
        wallpaper: {
          current: null,
          next: null,
          opacity: 1,
          blur: 0,
          savedWallpapers: [],
          likedWallpapers: [],
          isTransitioning: false,
          slideDirection: 'right',
          crossfadeProgress: 0,
          slideProgress: 0,
          cycleWallpapers: false,
          cycleInterval: 30,
          cycleAnimation: 'fade',
          crossfadeDuration: 1.2,
          crossfadeEasing: 'ease-out',
          slideRandomDirection: false,
          slideDuration: 1.5,
          slideEasing: 'ease-out',
        },

        // Overlay effects
        overlay: {
          enabled: false,
          effect: 'snow',
          intensity: 50,
          speed: 1,
          wind: 0.02,
          gravity: 0.1,
        },

        // Time display
        time: {
          color: '#ffffff',
          recentColors: [],
          enablePill: true,
          pillBlur: 8,
          pillOpacity: 0.05,
          font: 'default',
        },

        // Channel state - unified data layer for all channel operations
        channels: {
          // Channel settings
          settings: {
            autoFadeTimeout: 5,
            animation: null,
            adaptiveEmptyChannels: true,
            animatedOnHover: false,
            idleAnimationEnabled: false,
            idleAnimationTypes: ['pulse', 'bounce', 'glow'],
            idleAnimationInterval: 8,
            kenBurnsEnabled: false,
            kenBurnsMode: 'hover',
            kenBurnsHoverScale: 1.1,
            kenBurnsAutoplayScale: 1.15,
            kenBurnsSlideshowScale: 1.08,
            kenBurnsHoverDuration: 8000,
            kenBurnsAutoplayDuration: 12000,
            kenBurnsSlideshowDuration: 10000,
            kenBurnsCrossfadeDuration: 1000,
            kenBurnsForGifs: false,
            kenBurnsForVideos: false,
            kenBurnsEasing: 'ease-out',
            kenBurnsAnimationType: 'both',
            kenBurnsCrossfadeReturn: true,
            kenBurnsTransitionType: 'cross-dissolve',
          },
          
          // Channel data - actual channel configurations
          data: {
            // Grid configuration - Wii-style 4x3 grid per page
            gridColumns: 4,
            gridRows: 3,
            totalChannels: 36, // 3 pages × 12 channels per page
            
            // Channel configurations by ID
            configuredChannels: {},
            
            // Media mappings
            mediaMap: {},
            
            // App path mappings
            appPathMap: {},
            
            // Channel configurations
            channelConfigs: {},
            
            // Navigation state
            navigation: {
              currentPage: 0,
              totalPages: 3, // 3 pages for 36 channels
              mode: 'wii', // 'simple' or 'wii'
              isAnimating: false,
              animationDirection: 'none',
              animationType: 'slide', // slide, fade, none
              animationDuration: 500,
              animationEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
              enableSlideAnimation: true
            }
          },
          
          // Channel operations state
          operations: {
            isLoading: false,
            isSaving: false,
            lastSaved: null,
            error: null
          }
        },

        // Dock state
        dock: {
          // Dock base colors
          dockBaseGradientStart: '#BDBEC2',
          dockBaseGradientEnd: '#DADDE6',
          dockAccentColor: '#33BEED',
          
          // SD Card colors
          sdCardBodyColor: '#B9E1F2',
          sdCardBorderColor: '#33BEED',
          sdCardLabelColor: 'white',
          sdCardLabelBorderColor: '#F4F0EE',
          sdCardBottomColor: '#31BEED',
          
          // Pod colors
          leftPodBaseColor: '#D2D3DA',
          leftPodAccentColor: '#B6B6BB',
          leftPodDetailColor: '#D7D8DA',
          rightPodBaseColor: '#DCDCDF',
          rightPodAccentColor: '#E4E4E4',
          rightPodDetailColor: '#B6B6BB',
          
          // Button colors
          buttonBorderColor: '#22BEF3',
          buttonGradientStart: '#E0DCDC',
          buttonGradientEnd: '#CBCBCB',
          buttonIconColor: '#979796',
          rightButtonIconColor: '#A4A4A4',
          buttonHighlightColor: 'rgba(255, 255, 255, 0.5)',
          
          // Glass effects
          glassEnabled: false,
          glassOpacity: 0.18,
          glassBlur: 2.5,
          glassBorderOpacity: 0.5,
          glassShineOpacity: 0.7,
          
          // Size settings
          dockScale: 1.0,
          buttonSize: 1.0,
          sdCardSize: 1.0,
          
          // SD Card icon
          sdCardIcon: 'default',
          
          // Recent colors
          recentColors: [],
          
          // Custom themes
          customThemes: {},
        },

        // Particle effects
        particles: {
          enabled: false,
          effectType: 'normal',
          direction: 'upward',
          speed: 2,
          particleCount: 3,
          spawnRate: 60,
          size: 3,
          gravity: 0.02,
          fadeSpeed: 0.008,
          sizeDecay: 0.02,
          useAdaptiveColor: false,
          colorIntensity: 1.0,
          colorVariation: 0.3,
          rotationSpeed: 0.05,
          particleLifetime: 3.0
        },

        // Audio state
        audio: {
          settings: null,
          backgroundAudio: null,
          lastMusicId: null,
          lastMusicUrl: null,
          lastMusicEnabled: false,
          lastBgmEnabled: true,
          lastPlaylistMode: false,
        },

        // Sounds state
        sounds: {
          backgroundMusicEnabled: true,
          backgroundMusicLooping: true,
          backgroundMusicPlaylistMode: false,
          channelClickEnabled: true,
          channelClickVolume: 0.5,
          channelHoverEnabled: true,
          channelHoverVolume: 0.5,
        },

        // Icon management state
        icons: {
          savedIcons: [],
          loading: false,
          error: null,
          uploading: false,
          uploadError: null,
        },

        // App library state
        appLibrary: {
          installedApps: [],
          appsLoading: false,
          appsError: null,
          steamGames: [],
          steamLoading: false,
          steamError: null,
          epicGames: [],
          epicLoading: false,
          epicError: null,
          uwpApps: [],
          uwpLoading: false,
          uwpError: null,
          customSteamPath: '',
        },

        // Unified app state
        unifiedApps: {
          apps: [],
          selectedApp: null,
          searchQuery: '',
          selectedAppType: 'all',
          loading: false,
          error: null,
        },

        // Spotify state
        spotify: {
          isConnected: false,
          accessToken: null,
          refreshToken: null,
          currentTrack: null,
          isPlaying: false,
          volume: 50,
          deviceId: null,
          error: null,
          loading: false,
        },

        // Navigation state
        navigation: {
          showNavigationModal: false,
          customButtons: [],
          buttonOrder: [],
          defaultButtons: [
            { id: 'settings', type: 'icon', icon: 'settings', label: 'Settings', action: 'open-settings' },
            { id: 'presets', type: 'icon', icon: 'star', label: 'Presets', action: 'open-presets' },
            { id: 'spotify', type: 'icon', icon: 'music', label: 'Spotify', action: 'toggle-spotify' }
          ],
          buttonConfigs: {},
          loading: false,
          error: null,
        },

        // Performance monitoring state
        performance: {
          isMonitoring: false,
          metrics: {
            renderTimes: {},
            reRenderCounts: {},
            memoryUsage: [],
            fps: [],
            componentLoadTimes: {}
          },
          thresholds: {
            maxRenderTime: 16, // 60fps target
            maxMemoryUsage: 100 * 1024 * 1024, // 100MB
            minFps: 30
          },
          alerts: [],
          history: [],
          loading: false,
          error: null,
        },

        // Floating widgets state
        floatingWidgets: {
          spotify: {
            visible: false,
            position: { x: 20, y: 20 },
            settings: {
              autoShowWidget: false,
              autoHideWidget: true,
              dynamicColors: false,
            },
          },
          systemInfo: {
            visible: false,
            position: { x: 20, y: 100 },
            updateInterval: 5, // Default 5 seconds
            // Particle system settings
            particleEnabled: false,
            particleEffectType: 'normal',
            particleCount: 3,
            particleSpeed: 2,
          },
          adminPanel: {
            visible: false,
            position: { x: 20, y: 180 },
          },
          performanceMonitor: {
            visible: false,
            position: { x: 20, y: 260 },
          },
        },

        // Presets
        presets: [],

        // Actions
        actions: {
          // App actions
          setAppState: (updates) => set((state) => ({
            app: { ...state.app, ...updates }
          })),

          // UI actions
          setUIState: (updates) => set((state) => ({
            ui: { ...state.ui, ...updates }
          })),

          // Ribbon actions
          setRibbonState: (updates) => set((state) => ({
            ribbon: { ...state.ribbon, ...updates }
          })),

          // Wallpaper actions
          setWallpaperState: (updates) => set((state) => ({
            wallpaper: { ...state.wallpaper, ...updates }
          })),

          // Overlay actions
          setOverlayState: (updates) => set((state) => ({
            overlay: { ...state.overlay, ...updates }
          })),

          // Time actions
          setTimeState: (updates) => set((state) => ({
            time: { ...state.time, ...updates }
          })),

          // Channel actions
          setChannelState: (updates) => set((state) => ({
            channels: { ...state.channels, ...updates }
          })),
          
          // Channel data actions
          setChannelData: (updates) => set((state) => ({
            channels: {
              ...state.channels,
              data: { ...state.channels.data, ...updates }
            }
          })),
          
          // Channel settings actions
          setChannelSettings: (updates) => set((state) => ({
            channels: {
              ...state.channels,
              settings: { ...state.channels.settings, ...updates }
            }
          })),
          
          // Channel operations actions
          setChannelOperations: (updates) => set((state) => ({
            channels: {
              ...state.channels,
              operations: { ...state.channels.operations, ...updates }
            }
          })),
          
          // Individual channel actions
          updateChannel: (channelId, channelData) => set((state) => {
            // Ensure the channels data structure exists
            const channelsData = state.channels?.data || {};
            const configuredChannels = channelsData.configuredChannels || {};
            
            return {
              channels: {
                ...state.channels,
                data: {
                  ...channelsData,
                  configuredChannels: {
                    ...configuredChannels,
                    [channelId]: channelData === null 
                      ? undefined // Remove channel if null is passed
                      : {
                          ...configuredChannels[channelId],
                          ...channelData
                        }
                  }
                }
              }
            };
          }),
          
          // Navigation actions
          setChannelNavigation: (updates) => set((state) => ({
            channels: {
              ...state.channels,
              data: {
                ...state.channels.data,
                navigation: { ...state.channels.data.navigation, ...updates }
              }
            }
          })),

          // Dock actions
          setDockState: (updates) => set((state) => ({
            dock: { ...state.dock, ...updates }
          })),

          // Particle actions
          setParticleState: (updates) => set((state) => ({
            particles: { ...state.particles, ...updates }
          })),

          // Audio actions
          setAudioState: (updates) => set((state) => ({
            audio: { ...state.audio, ...updates }
          })),

          // Sounds actions
          setSoundsState: (updates) => set((state) => ({
            sounds: { ...state.sounds, ...updates }
          })),

          // Icon actions
          setIconState: (updates) => set((state) => ({
            icons: { ...state.icons, ...updates }
          })),

          // App library actions
          setAppLibraryState: (updates) => set((state) => ({
            appLibrary: { ...state.appLibrary, ...updates }
          })),

          // Unified app actions
          setUnifiedAppsState: (updates) => set((state) => ({
            unifiedApps: { ...state.unifiedApps, ...updates }
          })),

          // Spotify actions
          setSpotifyState: (updates) => set((state) => ({
            spotify: { ...state.spotify, ...updates }
          })),
          
          // Spotify manager
          spotifyManager,
          
          // Widget toggle actions
          toggleSpotifyWidget: () => {
            const store = useConsolidatedAppStore.getState();
            const isVisible = store.floatingWidgets.spotify.visible;
            store.actions.setFloatingWidgetsState({
              spotify: { ...store.floatingWidgets.spotify, visible: !isVisible }
            });
          },

          // Navigation actions
          setNavigationState: (updates) => set((state) => ({
            navigation: { ...state.navigation, ...updates }
          })),

          // Performance actions
          setPerformanceState: (updates) => set((state) => ({
            performance: { ...state.performance, ...updates }
          })),

          // Floating widgets actions
          setFloatingWidgetsState: (updates) => set((state) => ({
            floatingWidgets: { ...state.floatingWidgets, ...updates }
          })),

          // Keyboard shortcuts actions
          resetKeyboardShortcuts: () => set((state) => ({
            ui: {
              ...state.ui,
              keyboardShortcuts: DEFAULT_SHORTCUTS.map(shortcut => ({
                ...shortcut,
                key: shortcut.defaultKey,
                modifier: shortcut.defaultModifier,
                enabled: true
              }))
            }
          })),

          // Preset actions
          setPresets: (presets) => set({ presets }),

          // Bulk update
          updateState: (updates) => set((state) => ({
            ...state,
            ...updates
          })),

          // Reset to defaults
          resetToDefaults: () => set({
            app: {
              version: '2.9.4',
              isInitialized: false,
              isLoading: true,
              splashFading: false,
              appReady: false,
              hasInitialized: false,
              isEditMode: false,
              showDragRegion: false,
              showAdminMenu: false,
              showCountdown: false,
              isScreenshotInProgress: false,
              updateAvailable: false,
            },
            ui: {
              isDarkMode: false,
              useCustomCursor: true,
              startInFullscreen: true,
              showPresetsButton: false,
              startOnBoot: false,
              settingsShortcut: '',
              immersivePip: false,
              showDock: true,
              classicMode: false,
              channelOpacity: 1,
              lastChannelHoverTime: Date.now(),
            },
            ribbon: {
              glassWiiRibbon: false,
              glassOpacity: 0.18,
              glassBlur: 2.5,
              glassBorderOpacity: 0.5,
              glassShineOpacity: 0.7,
              ribbonColor: '#e0e6ef',
              recentRibbonColors: [],
              ribbonGlowColor: '#0099ff',
              recentRibbonGlowColors: [],
              ribbonGlowStrength: 16,
              ribbonGlowStrengthHover: 20,
              ribbonDockOpacity: 1,
              ribbonButtonConfigs: [],
              presetsButtonConfig: {
                type: 'icon',
                icon: 'star',
                useAdaptiveColor: false,
                useGlowEffect: false,
                glowStrength: 20,
                useGlassEffect: false,
                glassOpacity: 0.18,
                glassBlur: 2.5,
                glassBorderOpacity: 0.5,
                glassShineOpacity: 0.7
              },
            },
            wallpaper: {
              current: null,
              next: null,
              opacity: 1,
              blur: 0,
              savedWallpapers: [],
              likedWallpapers: [],
              isTransitioning: false,
              slideDirection: 'right',
              crossfadeProgress: 0,
              slideProgress: 0,
              cycleWallpapers: false,
              cycleInterval: 30,
              cycleAnimation: 'fade',
              crossfadeDuration: 1.2,
              crossfadeEasing: 'ease-out',
              slideRandomDirection: false,
              slideDuration: 1.5,
              slideEasing: 'ease-out',
            },
            overlay: {
              enabled: false,
              effect: 'snow',
              intensity: 50,
              speed: 1,
              wind: 0.02,
              gravity: 0.1,
            },
            time: {
              color: '#ffffff',
              recentColors: [],
              format24hr: false,
              enablePill: true,
              pillBlur: 8,
              pillOpacity: 0.05,
              font: 'default',
            },
            channels: {
              autoFadeTimeout: 5,
              animation: null,
              adaptiveEmptyChannels: true,
              animatedOnHover: false,
              idleAnimationEnabled: false,
              idleAnimationTypes: ['pulse', 'bounce', 'glow'],
              idleAnimationInterval: 8,
              kenBurnsEnabled: false,
              kenBurnsMode: 'hover',
              kenBurnsHoverScale: 1.1,
              kenBurnsAutoplayScale: 1.15,
              kenBurnsSlideshowScale: 1.08,
              kenBurnsHoverDuration: 8000,
              kenBurnsAutoplayDuration: 12000,
              kenBurnsSlideshowDuration: 10000,
              kenBurnsCrossfadeDuration: 1000,
              kenBurnsForGifs: false,
              kenBurnsForVideos: false,
              kenBurnsEasing: 'ease-out',
              kenBurnsAnimationType: 'both',
              kenBurnsCrossfadeReturn: true,
              kenBurnsTransitionType: 'cross-dissolve',
            },
            dock: {
              dockBaseGradientStart: '#BDBEC2',
              dockBaseGradientEnd: '#DADDE6',
              dockAccentColor: '#33BEED',
              sdCardBodyColor: '#B9E1F2',
              sdCardBorderColor: '#33BEED',
              sdCardLabelColor: 'white',
              sdCardLabelBorderColor: '#F4F0EE',
              sdCardBottomColor: '#31BEED',
              leftPodBaseColor: '#D2D3DA',
              leftPodAccentColor: '#B6B6BB',
              leftPodDetailColor: '#D7D8DA',
              rightPodBaseColor: '#DCDCDF',
              rightPodAccentColor: '#E4E4E4',
              rightPodDetailColor: '#B6B6BB',
              buttonBorderColor: '#22BEF3',
              buttonGradientStart: '#E0DCDC',
              buttonGradientEnd: '#CBCBCB',
              buttonIconColor: '#979796',
              rightButtonIconColor: '#A4A4A4',
              buttonHighlightColor: '#E4E4E4',
              glassEnabled: false,
              glassOpacity: 0.18,
              glassBlur: 2.5,
              glassBorderOpacity: 0.5,
              glassShineOpacity: 0.7,
              sdCardIcon: 'default',
              dockScale: 1.0,
              buttonSize: 1.0,
              sdCardSize: 1.0,
              recentColors: []
            },
            particles: {
              enabled: false,
              effectType: 'normal',
              direction: 'upward',
              speed: 2,
              particleCount: 3,
              spawnRate: 60,
              size: 3,
              gravity: 0.02,
              fadeSpeed: 0.008,
              sizeDecay: 0.02,
              useAdaptiveColor: false,
              colorIntensity: 1.0,
              colorVariation: 0.3,
              rotationSpeed: 0.05,
              particleLifetime: 3.0
            },
            audio: {
              settings: null,
              backgroundAudio: null,
              lastMusicId: null,
              lastMusicUrl: null,
              lastMusicEnabled: false,
              lastBgmEnabled: true,
              lastPlaylistMode: false,
            },
            presets: [],
          }),
        },
      }),
      {
        name: 'consolidated-app-store',
        partialize: (state) => ({
          ui: state.ui,
          ribbon: state.ribbon,
          wallpaper: state.wallpaper,
          overlay: state.overlay,
          time: state.time,
          channels: state.channels,
          dock: state.dock,
          particles: state.particles,
          presets: state.presets,
        }),
      }
    )
  )
);

// Icon management functions
const iconManager = {
  fetchIcons: async () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setIconState({ loading: true, error: null });
    
    try {
      // Simulate fetching icons from storage
      const savedIcons = JSON.parse(localStorage.getItem('savedIcons') || '[]');
      store.actions.setIconState({ savedIcons, loading: false });
      return { success: true, icons: savedIcons };
    } catch (error) {
      store.actions.setIconState({ 
        loading: false, 
        error: error.message || 'Failed to fetch icons' 
      });
      return { success: false, error: error.message };
    }
  },

  uploadIcon: async () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setIconState({ uploading: true, uploadError: null });
    
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      const result = await new Promise((resolve) => {
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) {
            resolve({ success: false, error: 'No file selected' });
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (e) => {
            const icon = {
              id: Date.now().toString(),
              name: file.name,
              url: e.target.result,
              size: file.size,
              type: file.type
            };
            resolve({ success: true, icon });
          };
          reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
          reader.readAsDataURL(file);
        };
        input.click();
      });
      
      if (result.success) {
        // Add to saved icons
        const currentIcons = store.icons.savedIcons;
        const newIcons = [...currentIcons, result.icon];
        store.actions.setIconState({ 
          savedIcons: newIcons, 
          uploading: false 
        });
        
        // Save to localStorage
        localStorage.setItem('savedIcons', JSON.stringify(newIcons));
      } else {
        store.actions.setIconState({ 
          uploading: false, 
          uploadError: result.error 
        });
      }
      
      return result;
    } catch (error) {
      store.actions.setIconState({ 
        uploading: false, 
        uploadError: error.message || 'Upload failed' 
      });
      return { success: false, error: error.message };
    }
  },

  deleteIcon: async (iconUrl) => {
    const store = useConsolidatedAppStore.getState();
    
    try {
      const currentIcons = store.icons.savedIcons;
      const newIcons = currentIcons.filter(icon => icon.url !== iconUrl);
      store.actions.setIconState({ savedIcons: newIcons });
      
      // Save to localStorage
      localStorage.setItem('savedIcons', JSON.stringify(newIcons));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  clearIconError: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setIconState({ error: null, uploadError: null });
  }
};

// Navigation management functions
const navigationManager = {
  openNavigationModal: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setNavigationState({ showNavigationModal: true });
  },

  closeNavigationModal: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setNavigationState({ showNavigationModal: false });
  },

  addCustomButton: (button) => {
    const store = useConsolidatedAppStore.getState();
    const { customButtons } = store.navigation;
    const newButton = {
      id: `custom-${Date.now()}`,
      ...button,
      type: button.type || 'icon',
      icon: button.icon || 'star',
      label: button.label || 'Custom Button',
      action: button.action || 'custom'
    };
    
    store.actions.setNavigationState({
      customButtons: [...customButtons, newButton],
      buttonOrder: [...store.navigation.buttonOrder, newButton.id]
    });
  },

  removeCustomButton: (buttonId) => {
    const store = useConsolidatedAppStore.getState();
    const { customButtons, buttonOrder } = store.navigation;
    
    store.actions.setNavigationState({
      customButtons: customButtons.filter(btn => btn.id !== buttonId),
      buttonOrder: buttonOrder.filter(id => id !== buttonId)
    });
  },

  updateButtonOrder: (newOrder) => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setNavigationState({ buttonOrder: newOrder });
  },

  updateButtonConfig: (buttonId, config) => {
    const store = useConsolidatedAppStore.getState();
    const { buttonConfigs } = store.navigation;
    
    store.actions.setNavigationState({
      buttonConfigs: {
        ...buttonConfigs,
        [buttonId]: { ...buttonConfigs[buttonId], ...config }
      }
    });
  },

  getVisibleButtons: () => {
    const store = useConsolidatedAppStore.getState();
    const { defaultButtons, customButtons, buttonOrder } = store.navigation;
    
    // Combine default and custom buttons
    const allButtons = [...defaultButtons, ...customButtons];
    
    // If no custom order, return all buttons
    if (!buttonOrder.length) {
      return allButtons;
    }
    
    // Sort by custom order
    return buttonOrder
      .map(id => allButtons.find(btn => btn.id === id))
      .filter(Boolean);
  },

  resetToDefaults: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setNavigationState({
      customButtons: [],
      buttonOrder: [],
      buttonConfigs: {},
      showNavigationModal: false
    });
  }
};

// Performance monitoring functions
const performanceManager = {
  startMonitoring: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setPerformanceState({ isMonitoring: true, loading: false });
    
    // Start monitoring intervals
    performanceManager.startFpsMonitoring();
    performanceManager.startMemoryMonitoring();
  },

  stopMonitoring: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setPerformanceState({ isMonitoring: false });
    
    // Stop monitoring intervals
    if (performanceManager.fpsInterval) {
      clearInterval(performanceManager.fpsInterval);
    }
    if (performanceManager.memoryInterval) {
      clearInterval(performanceManager.memoryInterval);
    }
  },

  startFpsMonitoring: () => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    performanceManager.fpsInterval = setInterval(() => {
      const currentTime = performance.now();
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      
      const store = useConsolidatedAppStore.getState();
      const { metrics, thresholds } = store.performance;
      
      // Update FPS metrics
      const newFps = [...metrics.fps, fps].slice(-60); // Keep last 60 samples
      
      // Check for performance alerts
      const alerts = [...store.performance.alerts];
      if (fps < thresholds.minFps) {
        alerts.push({
          type: 'fps',
          message: `Low FPS detected: ${fps}`,
          timestamp: Date.now(),
          severity: 'warning'
        });
      }
      
      store.actions.setPerformanceState({
        metrics: { ...metrics, fps: newFps },
        alerts: alerts.slice(-10) // Keep last 10 alerts
      });
      
      frameCount = 0;
      lastTime = currentTime;
    }, 1000);
    
    // Count frames
    const countFrame = () => {
      frameCount++;
      requestAnimationFrame(countFrame);
    };
    requestAnimationFrame(countFrame);
  },

  startMemoryMonitoring: () => {
    performanceManager.memoryInterval = setInterval(() => {
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize;
        
        const store = useConsolidatedAppStore.getState();
        const { metrics, thresholds } = store.performance;
        
        // Update memory metrics
        const newMemoryUsage = [...metrics.memoryUsage, memoryUsage].slice(-60);
        
        // Check for memory alerts
        const alerts = [...store.performance.alerts];
        if (memoryUsage > thresholds.maxMemoryUsage) {
          alerts.push({
            type: 'memory',
            message: `High memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`,
            timestamp: Date.now(),
            severity: 'warning'
          });
        }
        
        store.actions.setPerformanceState({
          metrics: { ...metrics, memoryUsage: newMemoryUsage },
          alerts: alerts.slice(-10)
        });
      }
    }, 5000); // Check every 5 seconds
  },

  recordRenderTime: (componentName, renderTime) => {
    const store = useConsolidatedAppStore.getState();
    const { metrics, thresholds } = store.performance;
    
    // Update render times
    const renderTimes = {
      ...metrics.renderTimes,
      [componentName]: renderTime
    };
    
    // Check for slow renders
    const alerts = [...store.performance.alerts];
    if (renderTime > thresholds.maxRenderTime) {
      alerts.push({
        type: 'render',
        message: `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`,
        timestamp: Date.now(),
        severity: 'warning'
      });
    }
    
    store.actions.setPerformanceState({
      metrics: { ...metrics, renderTimes },
      alerts: alerts.slice(-10)
    });
  },

  recordReRender: (componentName) => {
    const store = useConsolidatedAppStore.getState();
    const { metrics } = store.performance;
    
    const reRenderCounts = {
      ...metrics.reRenderCounts,
      [componentName]: (metrics.reRenderCounts[componentName] || 0) + 1
    };
    
    store.actions.setPerformanceState({
      metrics: { ...metrics, reRenderCounts }
    });
  },

  clearAlerts: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setPerformanceState({ alerts: [] });
  },

  getPerformanceReport: () => {
    const store = useConsolidatedAppStore.getState();
    const { metrics, alerts } = store.performance;
    
    const avgFps = metrics.fps.length > 0 
      ? metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length 
      : 0;
    
    const avgMemory = metrics.memoryUsage.length > 0
      ? metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length
      : 0;
    
    return {
      averageFps: Math.round(avgFps),
      averageMemory: Math.round(avgMemory / 1024 / 1024), // MB
      totalAlerts: alerts.length,
      slowestComponent: Object.entries(metrics.renderTimes)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None',
      mostReRendered: Object.entries(metrics.reRenderCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
    };
  }
};

// Floating widget manager
const floatingWidgetManager = {
  showSpotifyWidget: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      spotify: { ...store.floatingWidgets.spotify, visible: true }
    });
  },

  hideSpotifyWidget: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      spotify: { ...store.floatingWidgets.spotify, visible: false }
    });
  },

  setSpotifyWidgetPosition: (position) => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      spotify: { ...store.floatingWidgets.spotify, position }
    });
  },

  showSystemInfoWidget: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      systemInfo: { ...store.floatingWidgets.systemInfo, visible: true }
    });
  },

  hideSystemInfoWidget: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      systemInfo: { ...store.floatingWidgets.systemInfo, visible: false }
    });
  },

  setSystemInfoWidgetPosition: (position) => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      systemInfo: { ...store.floatingWidgets.systemInfo, position }
    });
  },

  showAdminPanelWidget: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      adminPanel: { ...store.floatingWidgets.adminPanel, visible: true }
    });
  },

  hideAdminPanelWidget: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      adminPanel: { ...store.floatingWidgets.adminPanel, visible: false }
    });
  },

  setAdminPanelWidgetPosition: (position) => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      adminPanel: { ...store.floatingWidgets.adminPanel, position }
    });
  },

  showPerformanceMonitorWidget: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      performanceMonitor: { ...store.floatingWidgets.performanceMonitor, visible: true }
    });
  },

  hidePerformanceMonitorWidget: () => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      performanceMonitor: { ...store.floatingWidgets.performanceMonitor, visible: false }
    });
  },

  setPerformanceMonitorWidgetPosition: (position) => {
    const store = useConsolidatedAppStore.getState();
    store.actions.setFloatingWidgetsState({
      performanceMonitor: { ...store.floatingWidgets.performanceMonitor, position }
    });
  },

  toggleSystemInfoWidget: () => {
    const store = useConsolidatedAppStore.getState();
    const isVisible = store.floatingWidgets.systemInfo.visible;
    store.actions.setFloatingWidgetsState({
      systemInfo: { ...store.floatingWidgets.systemInfo, visible: !isVisible }
    });
  },

  toggleAdminPanelWidget: () => {
    const store = useConsolidatedAppStore.getState();
    const isVisible = store.floatingWidgets.adminPanel.visible;
    store.actions.setFloatingWidgetsState({
      adminPanel: { ...store.floatingWidgets.adminPanel, visible: !isVisible }
    });
  },

  togglePerformanceMonitorWidget: () => {
    const store = useConsolidatedAppStore.getState();
    const isVisible = store.floatingWidgets.performanceMonitor.visible;
    store.actions.setFloatingWidgetsState({
      performanceMonitor: { ...store.floatingWidgets.performanceMonitor, visible: !isVisible }
    });
  }
};

// Attach managers to store
useConsolidatedAppStore.setState((state) => ({
  iconManager,
  appLibraryManager,
  unifiedAppManager,
  spotifyManager,
  navigationManager,
  performanceManager,
  floatingWidgetManager
}));

// Make store available globally for services that need it
if (typeof window !== 'undefined') {
  window.useConsolidatedAppStore = useConsolidatedAppStore;
}

export default useConsolidatedAppStore;
