import { startTransition } from 'react';
import { createFloatingWidgetManager } from './floatingWidgetManager';
import { createPerformanceManager } from './performanceManager';
import { filterSteamToolEntries } from '../steamLibraryFilter.js';
import { collectWarmMediaUrlsFromStore } from '../mediaWarmCache.js';
import { scheduleMediaWarmPass } from '../mediaWarmScheduler.js';
import { markAppLibraryBackgroundPrefetchScheduled } from '../appLibraryStartupCoordinator.js';
import { weeMarkAppLibraryPrefetchScheduled } from '../weePerformanceMarks.js';

export const createStoreManagers = (getStore) => {
  const setAppLibraryPatch = (store, patch, silent) => {
    if (silent) {
      startTransition(() => {
        store.actions.setAppLibraryState(patch);
      });
    } else {
      store.actions.setAppLibraryState(patch);
    }
  };

  const appLibraryManager = {
    _cache: {
      /** Align with main-process apps cache (see electron APPS_CACHE_TTL) to avoid redundant full scans */
      installedApps: { data: null, timestamp: 0, ttl: 24 * 60 * 60 * 1000 },
      steamGames: { data: null, timestamp: 0, ttl: 10 * 60 * 1000 },
      epicGames: { data: null, timestamp: 0, ttl: 10 * 60 * 1000 },
      uwpApps: { data: null, timestamp: 0, ttl: 15 * 60 * 1000 },
    },
    _backgroundPrefetchScheduled: false,
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
    /**
     * @param {boolean} forceRefresh - Bypass renderer cache; for PC apps also forces main-process rescan when available
     * @param {{ silent?: boolean }} [options] - silent: do not toggle appsLoading (for idle/background prefetch)
     */
    async fetchInstalledApps(forceRefresh = false, options = {}) {
      const silent = options.silent === true;
      const store = getStore();

      if (!forceRefresh && appLibraryManager._isCacheValid('installedApps')) {
        const cachedData = appLibraryManager._cache.installedApps.data;
        setAppLibraryPatch(
          store,
          {
            installedApps: cachedData,
            appsLoading: false,
          },
          silent
        );
        return { success: true, apps: cachedData };
      }

      if (store.appLibrary.appsLoading && !silent) {
        return { success: false, error: 'Already loading' };
      }
      if (silent && store.appLibrary.appsLoading) {
        return { success: false, skipped: true };
      }

      if (!silent) {
        store.actions.setAppLibraryState({ appsLoading: true, appsError: null });
      }

      try {
        if (window.api && window.api.apps) {
          let result;
          if (forceRefresh && window.api.apps.rescanInstalled) {
            result = await window.api.apps.rescanInstalled();
          } else if (window.api.apps.getInstalled) {
            result = await window.api.apps.getInstalled();
          } else {
            result = [];
          }
          const apps = Array.isArray(result) ? result : [];
          appLibraryManager._setCache('installedApps', apps);
          setAppLibraryPatch(store, { installedApps: apps, appsLoading: false }, silent);
          return { success: true, apps };
        }

        const apps = [];
        appLibraryManager._setCache('installedApps', apps);
        setAppLibraryPatch(store, { installedApps: apps, appsLoading: false }, silent);
        return { success: true, apps };
      } catch (error) {
        if (silent) {
          console.debug('[fetchInstalledApps] background:', error?.message || error);
        } else {
          console.warn('[fetchInstalledApps]', error);
        }
        setAppLibraryPatch(
          store,
          {
            appsLoading: false,
            ...(silent
              ? {}
              : { appsError: error.message || 'Failed to fetch installed apps' }),
          },
          silent
        );
        return { success: false, error: error.message };
      }
    },
    async fetchSteamGames(forceRefresh = false, options = {}) {
      const silent = options.silent === true;
      const store = getStore();

      if (!forceRefresh && appLibraryManager._isCacheValid('steamGames')) {
        const cachedData = appLibraryManager._cache.steamGames.data;
        setAppLibraryPatch(store, { steamGames: cachedData, steamLoading: false }, silent);
        return { success: true, games: cachedData };
      }

      if (store.appLibrary.steamLoading && !silent) {
        return { success: false, error: 'Already loading' };
      }
      if (silent && store.appLibrary.steamLoading) {
        return { success: false, skipped: true };
      }

      if (!silent) {
        store.actions.setAppLibraryState({ steamLoading: true, steamError: null });
      }

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
          const games = filterSteamToolEntries(result?.games || []);
          appLibraryManager._setCache('steamGames', games);
          setAppLibraryPatch(store, { steamGames: games, steamLoading: false }, silent);
          return { success: true, games };
        }

        const games = [];
        appLibraryManager._setCache('steamGames', games);
        setAppLibraryPatch(store, { steamGames: games, steamLoading: false }, silent);
        return { success: true, games };
      } catch (error) {
        if (silent) {
          console.debug('[fetchSteamGames] background:', error?.message || error);
        } else {
          console.warn('[fetchSteamGames]', error);
        }
        setAppLibraryPatch(
          store,
          {
            steamLoading: false,
            ...(silent
              ? {}
              : { steamError: error.message || 'Failed to fetch Steam games' }),
          },
          silent
        );
        return { success: false, error: error.message };
      }
    },
    async fetchEpicGames(forceRefresh = false, options = {}) {
      const silent = options.silent === true;
      const store = getStore();

      if (!forceRefresh && appLibraryManager._isCacheValid('epicGames')) {
        const cachedData = appLibraryManager._cache.epicGames.data;
        setAppLibraryPatch(store, { epicGames: cachedData, epicLoading: false }, silent);
        return { success: true, games: cachedData };
      }

      if (store.appLibrary.epicLoading && !silent) {
        return { success: false, error: 'Already loading' };
      }
      if (silent && store.appLibrary.epicLoading) {
        return { success: false, skipped: true };
      }

      if (!silent) {
        store.actions.setAppLibraryState({ epicLoading: true, epicError: null });
      }

      try {
        if (window.api && window.api.epic && window.api.epic.getInstalledGames) {
          const result = await window.api.epic.getInstalledGames();
          const games = result?.games || [];
          appLibraryManager._setCache('epicGames', games);
          setAppLibraryPatch(store, { epicGames: games, epicLoading: false }, silent);
          return { success: true, games };
        }

        const games = [];
        appLibraryManager._setCache('epicGames', games);
        setAppLibraryPatch(store, { epicGames: games, epicLoading: false }, silent);
        return { success: true, games };
      } catch (error) {
        if (silent) {
          console.debug('[fetchEpicGames] background:', error?.message || error);
        } else {
          console.warn('[fetchEpicGames]', error);
        }
        setAppLibraryPatch(
          store,
          {
            epicLoading: false,
            ...(silent
              ? {}
              : { epicError: error.message || 'Failed to fetch Epic games' }),
          },
          silent
        );
        return { success: false, error: error.message };
      }
    },
    async fetchUwpApps(forceRefresh = false, options = {}) {
      const silent = options.silent === true;
      const store = getStore();

      if (!forceRefresh && appLibraryManager._isCacheValid('uwpApps')) {
        const cachedData = appLibraryManager._cache.uwpApps.data;
        setAppLibraryPatch(store, { uwpApps: cachedData, uwpLoading: false }, silent);
        return { success: true, apps: cachedData };
      }

      if (store.appLibrary.uwpLoading && !silent) {
        return { success: false, error: 'Already loading' };
      }
      if (silent && store.appLibrary.uwpLoading) {
        return { success: false, skipped: true };
      }

      if (!silent) {
        store.actions.setAppLibraryState({ uwpLoading: true, uwpError: null });
      }

      try {
        if (window.api && window.api.uwp && window.api.uwp.listApps) {
          const result = await window.api.uwp.listApps();
          const apps = Array.isArray(result) ? result : [];
          appLibraryManager._setCache('uwpApps', apps);
          setAppLibraryPatch(store, { uwpApps: apps, uwpLoading: false }, silent);
          return { success: true, apps };
        }

        const apps = [];
        appLibraryManager._setCache('uwpApps', apps);
        setAppLibraryPatch(store, { uwpApps: apps, uwpLoading: false }, silent);
        return { success: true, apps };
      } catch (error) {
        if (silent) {
          console.debug('[fetchUwpApps] background:', error?.message || error);
        } else {
          console.warn('[fetchUwpApps]', error);
        }
        setAppLibraryPatch(
          store,
          {
            uwpLoading: false,
            ...(silent ? {} : { uwpError: error.message || 'Failed to fetch UWP apps' }),
          },
          silent
        );
        return { success: false, error: error.message };
      }
    },
    setCustomSteamPath(path) {
      const store = getStore();
      store.actions.setAppLibraryState({ customSteamPath: path });
      appLibraryManager._clearCache('steamGames');
    },
    /**
     * Staggered idle prefetch: fills store without toggling per-source loading flags.
     * Call once after shell is ready (e.g. appReady) so channel modal opens warm.
     */
    scheduleAppLibraryBackgroundPrefetch() {
      if (typeof window === 'undefined' || !window.api || appLibraryManager._backgroundPrefetchScheduled) {
        return;
      }
      appLibraryManager._backgroundPrefetchScheduled = true;
      markAppLibraryBackgroundPrefetchScheduled();
      weeMarkAppLibraryPrefetchScheduled();

      const coldScan =
        !appLibraryManager._isCacheValid('installedApps') ||
        !appLibraryManager._isCacheValid('steamGames') ||
        !appLibraryManager._isCacheValid('epicGames') ||
        !appLibraryManager._isCacheValid('uwpApps');

      const staggerMs = coldScan ? 520 : 350;
      const initialDelayMs = coldScan ? 1200 : 700;
      const idleCallbackTimeoutMs = coldScan ? 18000 : 12000;

      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const runChain = async () => {
        try {
          await appLibraryManager.fetchInstalledApps(false, { silent: true });
          await pause(staggerMs);
          await appLibraryManager.fetchSteamGames(false, { silent: true });
          await pause(staggerMs);
          await appLibraryManager.fetchEpicGames(false, { silent: true });
          await pause(staggerMs);
          await appLibraryManager.fetchUwpApps(false, { silent: true });
          await pause(400);
          try {
            scheduleMediaWarmPass({
              urls: collectWarmMediaUrlsFromStore(getStore()),
              max: 48,
              chunkSize: 6,
              tier: 'normal',
            });
          } catch {
            /* ignore */
          }
        } catch (e) {
          console.warn('[appLibraryManager] Background prefetch:', e);
        }
      };

      const start = () => {
        setTimeout(runChain, initialDelayMs);
      };

      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(start, { timeout: idleCallbackTimeoutMs });
      } else {
        setTimeout(start, 2000);
      }
    },
    rescanInstalledApps: () => appLibraryManager.fetchInstalledApps(true),
    rescanSteamGames: () => appLibraryManager.fetchSteamGames(true),
    rescanEpicGames: () => appLibraryManager.fetchEpicGames(true),
    rescanUwpApps: () => appLibraryManager.fetchUwpApps(true),
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

  const normalizeUnifiedAppName = (name) =>
    String(name || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const isLikelyStoreAppId = (appId) => {
    if (typeof appId !== 'string') return false;
    const normalized = appId.trim();
    if (!normalized.includes('!')) return false;
    if (!/^[^\s!]+![^\s!]+$/.test(normalized)) return false;
    if (/\.exe/i.test(normalized)) return false;
    if (normalized.includes('\\') || normalized.includes('/')) return false;
    return true;
  };

  /** Lower = better when the same display name exists from multiple sources. */
  const UNIFIED_TYPE_PRIORITY = { exe: 0, steam: 1, epic: 2, microsoft: 3 };

  const pickPreferredUnifiedApp = (a, b) => {
    const pa = UNIFIED_TYPE_PRIORITY[a.type] ?? 99;
    const pb = UNIFIED_TYPE_PRIORITY[b.type] ?? 99;
    if (pa !== pb) return pa < pb ? a : b;
    return a;
  };

  const dedupeUnifiedApps = (apps) => {
    const byId = new Map();
    apps.forEach((app) => {
      const idKey = String(app.id || `${app.type}:${app.path || app.name || ''}`);
      const existing = byId.get(idKey);
      if (!existing) {
        byId.set(idKey, app);
        return;
      }
      if (existing.type === 'microsoft' && app.type === 'exe') {
        byId.set(idKey, app);
      }
    });

    const byName = new Map();
    byId.forEach((app) => {
      const normalizedName = normalizeUnifiedAppName(app.name);
      const groupKey = normalizedName || `__id__:${String(app.id || app.path || '')}`;
      const prev = byName.get(groupKey);
      if (!prev) {
        byName.set(groupKey, app);
        return;
      }
      byName.set(groupKey, pickPreferredUnifiedApp(prev, app));
    });

    return [...byName.values()];
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
          const uwpApps = (uwpResult.value.apps || []).filter((app) => isLikelyStoreAppId(app?.appId));
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

        const dedupedApps = dedupeUnifiedApps(allApps);
        store.actions.setUnifiedAppsState({ apps: dedupedApps, loading: false });
        return { success: true, apps: dedupedApps };
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
          currentUser: null,
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

        if (playback && playback._playerWebApiForbidden) {
          store.actions.setSpotifyState({
            playerWebApiForbidden: true,
            currentTrack: null,
            isPlaying: false,
            progress: 0,
            duration: 0,
          });
          return null;
        }

        if (playback && playback.item) {
          store.actions.setSpotifyState({
            playerWebApiForbidden: false,
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
          playerWebApiForbidden: false,
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
    /** Refreshes `currentUser` (including `product` tier) in the consolidated store. */
    async syncUserProfile() {
      const store = getStore();
      try {
        const spotifyService = (await import('../spotifyService')).default;
        const profile = await spotifyService.getUserProfile();
        if (profile) {
          spotifyService.currentUser = profile;
          store.actions.setSpotifyState({ currentUser: profile });
          return profile;
        }
      } catch (error) {
        console.error('[SpotifyManager] Sync user profile error:', error);
      }
      return null;
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
        let savedIcons = [];
        if (window.api?.icons?.list) {
          const result = await window.api.icons.list();
          savedIcons = Array.isArray(result?.icons) ? result.icons : [];
        }
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
        if (!window.api?.selectIconFile || !window.api?.icons?.add) {
          throw new Error('Icon upload API not available');
        }

        const selected = await window.api.selectIconFile();
        if (!selected?.success || !selected?.file) {
          return { success: false, error: 'No file selected' };
        }

        const result = await window.api.icons.add({
          filePath: selected.file.path,
          filename: selected.file.name,
        });

        if (result.success) {
          const currentIcons = Array.isArray(store.icons.savedIcons) ? store.icons.savedIcons : [];
          const newIcons = [...currentIcons, result.icon];
          store.actions.setIconState({ savedIcons: newIcons, uploading: false });
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
        if (window.api?.icons?.delete) {
          const result = await window.api.icons.delete(iconUrl);
          if (!result?.success) {
            return { success: false, error: result?.error || 'Failed to delete icon' };
          }
        }

        const currentIcons = store.icons.savedIcons;
        const newIcons = currentIcons.filter((icon) => icon.url !== iconUrl);
        store.actions.setIconState({ savedIcons: newIcons });
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
