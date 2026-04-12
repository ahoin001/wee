import { createFloatingWidgetManager } from './floatingWidgetManager';
import { createPerformanceManager } from './performanceManager';

export const createStoreManagers = (getStore) => {
  const appLibraryManager = {
    _cache: {
      installedApps: { data: null, timestamp: 0, ttl: 5 * 60 * 1000 },
      steamGames: { data: null, timestamp: 0, ttl: 10 * 60 * 1000 },
      epicGames: { data: null, timestamp: 0, ttl: 10 * 60 * 1000 },
      uwpApps: { data: null, timestamp: 0, ttl: 15 * 60 * 1000 },
    },
    _debounceTimers: {
      installedApps: null,
      steamGames: null,
      epicGames: null,
      uwpApps: null,
    },
    _isCacheValid(cacheKey) {
      const cache = appLibraryManager._cache[cacheKey];
      return cache && cache.data && (Date.now() - cache.timestamp) < cache.ttl;
    },
    _setCache(cacheKey, data) {
      appLibraryManager._cache[cacheKey] = {
        data,
        timestamp: Date.now(),
        ttl: appLibraryManager._cache[cacheKey].ttl,
      };
    },
    _clearCache(cacheKey) {
      if (cacheKey) {
        appLibraryManager._cache[cacheKey] = {
          data: null,
          timestamp: 0,
          ttl: appLibraryManager._cache[cacheKey].ttl,
        };
        return;
      }

      Object.keys(appLibraryManager._cache).forEach((key) => {
        appLibraryManager._cache[key] = {
          data: null,
          timestamp: 0,
          ttl: appLibraryManager._cache[key].ttl,
        };
      });
    },
    _debouncedFetch(cacheKey, fetchFunction, delay = 1000) {
      return new Promise((resolve, reject) => {
        if (appLibraryManager._debounceTimers[cacheKey]) {
          clearTimeout(appLibraryManager._debounceTimers[cacheKey]);
        }

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
    async fetchInstalledApps(forceRefresh = false) {
      const store = getStore();

      if (!forceRefresh && appLibraryManager._isCacheValid('installedApps')) {
        const cachedData = appLibraryManager._cache.installedApps.data;
        store.actions.setAppLibraryState({
          installedApps: cachedData,
          appsLoading: false,
        });
        return { success: true, apps: cachedData };
      }

      if (store.appLibrary.appsLoading) {
        return { success: false, error: 'Already loading' };
      }

      store.actions.setAppLibraryState({ appsLoading: true, appsError: null });

      try {
        if (window.api && window.api.apps && window.api.apps.getInstalled) {
          const result = await window.api.apps.getInstalled();
          const apps = Array.isArray(result) ? result : [];
          appLibraryManager._setCache('installedApps', apps);
          store.actions.setAppLibraryState({ installedApps: apps, appsLoading: false });
          return { success: true, apps };
        }

        const apps = [];
        appLibraryManager._setCache('installedApps', apps);
        store.actions.setAppLibraryState({ installedApps: apps, appsLoading: false });
        return { success: true, apps };
      } catch (error) {
        store.actions.setAppLibraryState({
          appsLoading: false,
          appsError: error.message || 'Failed to fetch installed apps',
        });
        return { success: false, error: error.message };
      }
    },
    async fetchSteamGames(forceRefresh = false) {
      const store = getStore();

      if (!forceRefresh && appLibraryManager._isCacheValid('steamGames')) {
        const cachedData = appLibraryManager._cache.steamGames.data;
        store.actions.setAppLibraryState({ steamGames: cachedData, steamLoading: false });
        return { success: true, games: cachedData };
      }

      if (store.appLibrary.steamLoading) {
        return { success: false, error: 'Already loading' };
      }

      store.actions.setAppLibraryState({ steamLoading: true, steamError: null });

      try {
        if (window.api && window.api.steam && window.api.steam.scanGames) {
          let steamPath = null;
          if (window.api.steam.detectInstallation) {
            try {
              const detectionResult = await window.api.steam.detectInstallation();
              steamPath = detectionResult.steamPath;
            } catch (error) {
              console.warn('Failed to detect Steam installation:', error);
            }
          }

          let libraryPaths = [];
          if (steamPath && window.api.steam.getLibraries) {
            try {
              const librariesResult = await window.api.steam.getLibraries({ steamPath });
              libraryPaths = librariesResult.libraries || [];
            } catch (error) {
              console.warn('Failed to get Steam libraries, using defaults:', error);
            }
          }

          if (libraryPaths.length === 0) {
            libraryPaths = [
              'C:\\Program Files (x86)\\Steam\\steamapps',
              'C:\\Steam\\steamapps',
              'D:\\Steam\\steamapps',
            ];
          }

          const result = await window.api.steam.scanGames({ libraryPaths });
          const games = result?.games || [];
          appLibraryManager._setCache('steamGames', games);
          store.actions.setAppLibraryState({ steamGames: games, steamLoading: false });
          return { success: true, games };
        }

        const games = [];
        appLibraryManager._setCache('steamGames', games);
        store.actions.setAppLibraryState({ steamGames: games, steamLoading: false });
        return { success: true, games };
      } catch (error) {
        store.actions.setAppLibraryState({
          steamLoading: false,
          steamError: error.message || 'Failed to fetch Steam games',
        });
        return { success: false, error: error.message };
      }
    },
    async fetchEpicGames(forceRefresh = false) {
      const store = getStore();

      if (!forceRefresh && appLibraryManager._isCacheValid('epicGames')) {
        const cachedData = appLibraryManager._cache.epicGames.data;
        store.actions.setAppLibraryState({ epicGames: cachedData, epicLoading: false });
        return { success: true, games: cachedData };
      }

      if (store.appLibrary.epicLoading) {
        return { success: false, error: 'Already loading' };
      }

      store.actions.setAppLibraryState({ epicLoading: true, epicError: null });

      try {
        if (window.api && window.api.epic && window.api.epic.getInstalledGames) {
          const result = await window.api.epic.getInstalledGames();
          const games = result?.games || [];
          appLibraryManager._setCache('epicGames', games);
          store.actions.setAppLibraryState({ epicGames: games, epicLoading: false });
          return { success: true, games };
        }

        const games = [];
        appLibraryManager._setCache('epicGames', games);
        store.actions.setAppLibraryState({ epicGames: games, epicLoading: false });
        return { success: true, games };
      } catch (error) {
        store.actions.setAppLibraryState({
          epicLoading: false,
          epicError: error.message || 'Failed to fetch Epic games',
        });
        return { success: false, error: error.message };
      }
    },
    async fetchUwpApps(forceRefresh = false) {
      const store = getStore();

      if (!forceRefresh && appLibraryManager._isCacheValid('uwpApps')) {
        const cachedData = appLibraryManager._cache.uwpApps.data;
        store.actions.setAppLibraryState({ uwpApps: cachedData, uwpLoading: false });
        return { success: true, apps: cachedData };
      }

      if (store.appLibrary.uwpLoading) {
        return { success: false, error: 'Already loading' };
      }

      store.actions.setAppLibraryState({ uwpLoading: true, uwpError: null });

      try {
        if (window.api && window.api.uwp && window.api.uwp.listApps) {
          const result = await window.api.uwp.listApps();
          const apps = Array.isArray(result) ? result : [];
          appLibraryManager._setCache('uwpApps', apps);
          store.actions.setAppLibraryState({ uwpApps: apps, uwpLoading: false });
          return { success: true, apps };
        }

        const apps = [];
        appLibraryManager._setCache('uwpApps', apps);
        store.actions.setAppLibraryState({ uwpApps: apps, uwpLoading: false });
        return { success: true, apps };
      } catch (error) {
        store.actions.setAppLibraryState({
          uwpLoading: false,
          uwpError: error.message || 'Failed to fetch UWP apps',
        });
        return { success: false, error: error.message };
      }
    },
    setCustomSteamPath(path) {
      const store = getStore();
      store.actions.setAppLibraryState({ customSteamPath: path });
      appLibraryManager._clearCache('steamGames');
    },
    async refreshAllApps() {
      appLibraryManager._clearCache();
      const results = await Promise.allSettled([
        appLibraryManager.fetchInstalledApps(true),
        appLibraryManager.fetchSteamGames(true),
        appLibraryManager.fetchEpicGames(true),
        appLibraryManager.fetchUwpApps(true),
      ]);

      return results.map((result, index) => ({
        type: ['installedApps', 'steamGames', 'epicGames', 'uwpApps'][index],
        success: result.status === 'fulfilled',
        error: result.status === 'rejected' ? result.reason : null,
      }));
    },
  };

  const unifiedAppManager = {
    async fetchUnifiedApps() {
      const store = getStore();
      store.actions.setUnifiedAppsState({ loading: true, error: null });

      try {
        const allApps = [];
        const [installedResult, steamResult, epicResult, uwpResult] = await Promise.allSettled([
          appLibraryManager.fetchInstalledApps(),
          appLibraryManager.fetchSteamGames(),
          appLibraryManager.fetchEpicGames(),
          appLibraryManager.fetchUwpApps(),
        ]);

        if (installedResult.status === 'fulfilled' && installedResult.value?.success) {
          const installedApps = installedResult.value.apps || [];
          allApps.push(...installedApps.map((app) => ({
            ...app,
            type: 'exe',
            id: app.id || `exe-${app.path || app.name}`,
            category: 'Installed App',
          })));
        } else if (installedResult.status === 'rejected') {
          console.error('[UnifiedAppManager] Installed apps fetch failed:', installedResult.reason);
        }

        if (steamResult.status === 'fulfilled' && steamResult.value?.success) {
          const steamGames = steamResult.value.games || [];
          allApps.push(...steamGames.map((game) => ({
            ...game,
            type: 'steam',
            id: game.id || `steam-${game.appId || game.name}`,
            category: 'Steam Game',
            path: `steam://rungameid/${game.appId || game.appid}`,
          })));
        } else if (steamResult.status === 'rejected') {
          console.error('[UnifiedAppManager] Steam games fetch failed:', steamResult.reason);
        }

        if (epicResult.status === 'fulfilled' && epicResult.value?.success) {
          const epicGames = epicResult.value.games || [];
          allApps.push(...epicGames.map((game) => ({
            ...game,
            type: 'epic',
            id: game.id || `epic-${game.appName || game.name}`,
            category: 'Epic Game',
            path: `com.epicgames.launcher://apps/${game.appName || game.name}?action=launch&silent=true`,
          })));
        } else if (epicResult.status === 'rejected') {
          console.error('[UnifiedAppManager] Epic games fetch failed:', epicResult.reason);
        }

        if (uwpResult.status === 'fulfilled' && uwpResult.value?.success) {
          const uwpApps = uwpResult.value.apps || [];
          allApps.push(...uwpApps.map((app) => ({
            ...app,
            type: 'microsoft',
            id: app.id || `microsoft-${app.appId || app.name}`,
            category: 'Microsoft Store App',
            path: app.appId || app.name,
          })));
        } else if (uwpResult.status === 'rejected') {
          console.error('[UnifiedAppManager] UWP apps fetch failed:', uwpResult.reason);
        }

        store.actions.setUnifiedAppsState({ apps: allApps, loading: false });
        return { success: true, apps: allApps };
      } catch (error) {
        store.actions.setUnifiedAppsState({
          loading: false,
          error: error.message || 'Failed to fetch unified apps',
        });
        return { success: false, error: error.message };
      }
    },
    setSelectedApp(app) {
      const store = getStore();
      store.actions.setUnifiedAppsState({ selectedApp: app });
    },
    setSearchQuery(query) {
      const store = getStore();
      store.actions.setUnifiedAppsState({ searchQuery: query });
    },
    setSelectedAppType(type) {
      const store = getStore();
      store.actions.setUnifiedAppsState({ selectedAppType: type });
    },
    clearSelection() {
      const store = getStore();
      store.actions.setUnifiedAppsState({ selectedApp: null });
    },
    generatePathFromApp(app) {
      return app?.path || '';
    },
    getFilteredApps() {
      const store = getStore();
      const { apps, searchQuery, selectedAppType } = store.unifiedApps;
      return apps.filter((app) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedAppType === 'all' || app.type === selectedAppType)
      );
    },
    async rescanUnifiedApps() {
      return unifiedAppManager.fetchUnifiedApps();
    },
  };

  const spotifyManager = {
    async connect() {
      const store = getStore();
      store.actions.setSpotifyState({ loading: true, error: null });

      try {
        const spotifyService = (await import('../spotifyService')).default;
        const isInitialized = await spotifyService.initialize();

        if (isInitialized) {
          store.actions.setSpotifyState({ isConnected: true, loading: false, error: null });
          return { success: true };
        }

        spotifyService.authenticate();

        const handleAuthSuccess = () => {
          store.actions.setSpotifyState({ isConnected: true, loading: false, error: null });
        };

        const handleAuthError = (error) => {
          store.actions.setSpotifyState({
            isConnected: false,
            loading: false,
            error: error.message || 'Authentication failed',
          });
        };

        if (window.api?.onSpotifyAuthSuccess) {
          window.api.onSpotifyAuthSuccess(handleAuthSuccess);
        }
        if (window.api?.onSpotifyAuthError) {
          window.api.onSpotifyAuthError(handleAuthError);
        }

        return { success: true, message: 'OAuth flow initiated' };
      } catch (error) {
        store.actions.setSpotifyState({
          loading: false,
          error: error.message || 'Failed to connect to Spotify',
        });
        return { success: false, error: error.message };
      }
    },
    async disconnect() {
      const store = getStore();

      try {
        const spotifyService = (await import('../spotifyService')).default;
        spotifyService.logout();
        store.actions.setSpotifyState({
          isConnected: false,
          accessToken: null,
          refreshToken: null,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('[SpotifyManager] Disconnect error:', error);
        store.actions.setSpotifyState({ isConnected: false, loading: false, error: error.message });
      }
    },
    async refreshToken() {
      const store = getStore();
      const { refreshToken } = store.spotify;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      try {
        const spotifyService = (await import('../spotifyService')).default;
        const result = await spotifyService.refreshAccessToken(refreshToken);
        if (result.success) {
          store.actions.setSpotifyState({
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
          });
          return { success: true };
        }
        throw new Error(result.error || 'Failed to refresh token');
      } catch (error) {
        store.actions.setSpotifyState({
          isConnected: false,
          accessToken: null,
          refreshToken: null,
          error: error.message,
        });
        return { success: false, error: error.message };
      }
    },
    async getCurrentPlayback() {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.getCurrentPlayback();
      } catch (error) {
        console.error('[SpotifyManager] Get current playback error:', error);
        return null;
      }
    },
    async togglePlayback() {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.togglePlayback();
      } catch (error) {
        console.error('[SpotifyManager] Toggle playback error:', error);
        throw error;
      }
    },
    async skipToNext() {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.skipToNext();
      } catch (error) {
        console.error('[SpotifyManager] Skip to next error:', error);
        throw error;
      }
    },
    async skipToPrevious() {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.skipToPrevious();
      } catch (error) {
        console.error('[SpotifyManager] Skip to previous error:', error);
        throw error;
      }
    },
    async refreshPlaybackState() {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        const playback = await spotifyService.getCurrentPlayback();
        const store = getStore();

        if (playback && playback.item) {
          store.actions.setSpotifyState({
            currentTrack: playback.item,
            isPlaying: playback.is_playing,
            progress: playback.progress_ms,
            duration: playback.duration_ms,
            deviceId: playback.device?.id,
            shuffleState: playback.shuffle_state,
            repeatState: playback.repeat_state,
          });
          return playback;
        }

        store.actions.setSpotifyState({
          currentTrack: null,
          isPlaying: false,
          progress: 0,
          duration: 0,
        });
        return null;
      } catch (error) {
        console.error('[SpotifyManager] Refresh playback state error:', error);
        return null;
      }
    },
    async loadPlaylists() {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.getUserPlaylists();
      } catch (error) {
        console.error('[SpotifyManager] Load playlists error:', error);
        return [];
      }
    },
    async loadSavedTracks() {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.getSavedTracks();
      } catch (error) {
        console.error('[SpotifyManager] Load saved tracks error:', error);
        return [];
      }
    },
    async getUserProfile() {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.getUserProfile();
      } catch (error) {
        console.error('[SpotifyManager] Get user profile error:', error);
        return null;
      }
    },
    async searchTracks(query, limit = 20) {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.searchTracks(query, limit);
      } catch (error) {
        console.error('[SpotifyManager] Search tracks error:', error);
        return [];
      }
    },
    async playTrack(trackId) {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.playTrack(trackId);
      } catch (error) {
        console.error('[SpotifyManager] Play track error:', error);
        throw error;
      }
    },
    async playPlaylist(playlistId) {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.playPlaylist(playlistId);
      } catch (error) {
        console.error('[SpotifyManager] Play playlist error:', error);
        throw error;
      }
    },
    async seekToPosition(positionMs) {
      try {
        const spotifyService = (await import('../spotifyService')).default;
        return await spotifyService.seekToPosition(positionMs);
      } catch (error) {
        console.error('[SpotifyManager] Seek to position error:', error);
        throw error;
      }
    },
    updateSpotifySettings(settings) {
      const store = getStore();
      store.actions.setSpotifyState({
        settings: { ...store.spotify.settings, ...settings },
      });
    },
  };

  const iconManager = {
    async fetchIcons() {
      const store = getStore();
      store.actions.setIconState({ loading: true, error: null });
      try {
        const savedIcons = JSON.parse(localStorage.getItem('savedIcons') || '[]');
        store.actions.setIconState({ savedIcons, loading: false });
        return { success: true, icons: savedIcons };
      } catch (error) {
        store.actions.setIconState({ loading: false, error: error.message || 'Failed to fetch icons' });
        return { success: false, error: error.message };
      }
    },
    async uploadIcon() {
      const store = getStore();
      store.actions.setIconState({ uploading: true, uploadError: null });
      try {
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
            reader.onload = (event) => {
              const icon = {
                id: Date.now().toString(),
                name: file.name,
                url: event.target.result,
                size: file.size,
                type: file.type,
              };
              resolve({ success: true, icon });
            };
            reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
            reader.readAsDataURL(file);
          };
          input.click();
        });

        if (result.success) {
          const currentIcons = store.icons.savedIcons;
          const newIcons = [...currentIcons, result.icon];
          store.actions.setIconState({ savedIcons: newIcons, uploading: false });
          localStorage.setItem('savedIcons', JSON.stringify(newIcons));
        } else {
          store.actions.setIconState({ uploading: false, uploadError: result.error });
        }
        return result;
      } catch (error) {
        store.actions.setIconState({ uploading: false, uploadError: error.message || 'Upload failed' });
        return { success: false, error: error.message };
      }
    },
    async deleteIcon(iconUrl) {
      const store = getStore();
      try {
        const currentIcons = store.icons.savedIcons;
        const newIcons = currentIcons.filter((icon) => icon.url !== iconUrl);
        store.actions.setIconState({ savedIcons: newIcons });
        localStorage.setItem('savedIcons', JSON.stringify(newIcons));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    clearIconError() {
      const store = getStore();
      store.actions.setIconState({ error: null, uploadError: null });
    },
  };

  const navigationManager = {
    openNavigationModal() {
      const store = getStore();
      store.actions.setNavigationState({ showNavigationModal: true });
    },
    closeNavigationModal() {
      const store = getStore();
      store.actions.setNavigationState({ showNavigationModal: false });
    },
    addCustomButton(button) {
      const store = getStore();
      const { customButtons } = store.navigation;
      const newButton = {
        id: `custom-${Date.now()}`,
        ...button,
        type: button.type || 'icon',
        icon: button.icon || 'star',
        label: button.label || 'Custom Button',
        action: button.action || 'custom',
      };
      store.actions.setNavigationState({
        customButtons: [...customButtons, newButton],
        buttonOrder: [...store.navigation.buttonOrder, newButton.id],
      });
    },
    removeCustomButton(buttonId) {
      const store = getStore();
      const { customButtons, buttonOrder } = store.navigation;
      store.actions.setNavigationState({
        customButtons: customButtons.filter((btn) => btn.id !== buttonId),
        buttonOrder: buttonOrder.filter((id) => id !== buttonId),
      });
    },
    updateButtonOrder(newOrder) {
      const store = getStore();
      store.actions.setNavigationState({ buttonOrder: newOrder });
    },
    updateButtonConfig(buttonId, config) {
      const store = getStore();
      const { buttonConfigs } = store.navigation;
      store.actions.setNavigationState({
        buttonConfigs: {
          ...buttonConfigs,
          [buttonId]: { ...buttonConfigs[buttonId], ...config },
        },
      });
    },
    getVisibleButtons() {
      const store = getStore();
      const { defaultButtons, customButtons, buttonOrder } = store.navigation;
      const allButtons = [...defaultButtons, ...customButtons];
      if (!buttonOrder.length) {
        return allButtons;
      }
      return buttonOrder.map((id) => allButtons.find((btn) => btn.id === id)).filter(Boolean);
    },
    resetToDefaults() {
      const store = getStore();
      store.actions.setNavigationState({
        customButtons: [],
        buttonOrder: [],
        buttonConfigs: {},
        showNavigationModal: false,
      });
    },
  };

  const performanceManager = createPerformanceManager(getStore);
  const floatingWidgetManager = createFloatingWidgetManager(getStore);

  return {
    appLibraryManager,
    unifiedAppManager,
    spotifyManager,
    iconManager,
    navigationManager,
    performanceManager,
    floatingWidgetManager,
  };
};
