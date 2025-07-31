import { create } from 'zustand';
import useAppLibraryStore from './useAppLibraryStore';

const useUnifiedAppStore = create((set, get) => ({
  // Unified app state
  unifiedApps: [],
  unifiedAppsLoading: false,
  unifiedAppsError: '',
  
  // Search state
  searchQuery: '',
  selectedAppType: 'all', // 'all', 'exe', 'steam', 'epic', 'microsoft'
  
  // Selected app for path generation
  selectedApp: null,
  customPath: '',
  
  // Actions
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  
  setSelectedAppType: (type) => {
    set({ selectedAppType: type });
  },
  
  setSelectedApp: (app) => {
    set({ selectedApp: app });
    
    // Auto-generate path based on app type
    if (app) {
      const path = get().generatePathFromApp(app);
      set({ customPath: path });
    }
  },
  
  setCustomPath: (path) => {
    set({ customPath: path });
  },
  
  // Generate path from selected app
  generatePathFromApp: (app) => {
    if (!app) return '';
    
    switch (app.type) {
      case 'steam':
        return `steam://rungameid/${app.appid}`;
      case 'epic':
        return `com.epicgames.launcher://apps/${app.appName}?action=launch&silent=true`;
      case 'microsoft':
        return app.appId;
      case 'exe':
      default:
        // For EXE apps, include arguments if they exist
        if (app.path) {
          if (app.args && app.args.trim()) {
            return `${app.path} ${app.args.trim()}`;
          }
          return app.path;
        }
        return '';
    }
  },
  
  // Fetch and unify all apps
  fetchUnifiedApps: async () => {
    console.log('[UnifiedAppStore] Fetching unified apps');
    set({ unifiedAppsLoading: true, unifiedAppsError: '' });
    
    try {
      // Fetch all app types in parallel
      await Promise.all([
        useAppLibraryStore.getState().fetchInstalledApps(),
        useAppLibraryStore.getState().fetchSteamGames(),
        useAppLibraryStore.getState().fetchEpicGames(),
        useAppLibraryStore.getState().fetchUwpApps()
      ]);
      
      // Get the fetched data
      const { installedApps, steamGames, epicGames, uwpApps } = useAppLibraryStore.getState();
      
      // Unify the apps
      const unified = get().unifyAppData(installedApps, steamGames, epicGames, uwpApps);
      
      console.log('[UnifiedAppStore] Unified apps:', unified.length);
      set({ unifiedApps: unified, unifiedAppsLoading: false });
      
    } catch (error) {
      console.error('[UnifiedAppStore] Error fetching unified apps:', error);
      set({ 
        unifiedApps: [], 
        unifiedAppsLoading: false, 
        unifiedAppsError: error?.message || 'Failed to fetch apps' 
      });
    }
  },
  
  // Force rescan all apps
  rescanUnifiedApps: async () => {
    console.log('[UnifiedAppStore] Rescanning unified apps');
    set({ unifiedAppsLoading: true, unifiedAppsError: '' });
    
    try {
      // Rescan all app types in parallel
      await Promise.all([
        useAppLibraryStore.getState().rescanInstalledApps(),
        useAppLibraryStore.getState().rescanSteamGames(),
        useAppLibraryStore.getState().rescanEpicGames(),
        useAppLibraryStore.getState().rescanUwpApps()
      ]);
      
      // Get the fresh data
      const { installedApps, steamGames, epicGames, uwpApps } = useAppLibraryStore.getState();
      
      // Unify the apps
      const unified = get().unifyAppData(installedApps, steamGames, epicGames, uwpApps);
      
      console.log('[UnifiedAppStore] Rescanned unified apps:', unified.length);
      set({ unifiedApps: unified, unifiedAppsLoading: false });
      
    } catch (error) {
      console.error('[UnifiedAppStore] Error rescanning unified apps:', error);
      set({ 
        unifiedApps: [], 
        unifiedAppsLoading: false, 
        unifiedAppsError: error?.message || 'Failed to rescan apps' 
      });
    }
  },
  
  // Unify app data from different sources
  unifyAppData: (installedApps, steamGames, epicGames, uwpApps) => {
    const unified = [];
    const seenNames = new Set();
    const seenPaths = new Set(); // Track paths to avoid duplicate EXE files
    
    // Helper function to add app if not already seen
    const addAppIfUnique = (app) => {
      const normalizedName = app.name.toLowerCase().trim();
      const normalizedPath = app.path ? app.path.toLowerCase().trim() : '';
      
      // For EXE apps, check both name and path to avoid duplicates
      if (app.type === 'exe') {
        if (!seenNames.has(normalizedName) && !seenPaths.has(normalizedPath)) {
          seenNames.add(normalizedName);
          seenPaths.add(normalizedPath);
          unified.push(app);
        }
      } else {
        // For other app types, just check name
        if (!seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          unified.push(app);
        }
      }
    };
    
    // Add Steam games (highest priority)
    steamGames.forEach(game => {
      addAppIfUnique({
        id: `steam-${game.appid}`,
        name: game.name,
        type: 'steam',
        appid: game.appid,
        path: `steam://rungameid/${game.appid}`,
        icon: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
        source: 'steam',
        category: 'Steam Game'
      });
    });
    
    // Add Epic games (high priority)
    epicGames.forEach(game => {
      addAppIfUnique({
        id: `epic-${game.appName}`,
        name: game.name,
        type: 'epic',
        appName: game.appName,
        path: `com.epicgames.launcher://apps/${game.appName}?action=launch&silent=true`,
        icon: game.image || null,
        source: 'epic',
        category: 'Epic Game'
      });
    });
    
    // Add regular exe apps (medium priority)
    installedApps.forEach(app => {
      addAppIfUnique({
        id: `exe-${app.path}`,
        name: app.name,
        type: 'exe',
        path: app.path,
        args: app.args || '', // Preserve arguments
        icon: app.icon,
        source: 'exe',
        category: 'Application'
      });
    });
    
    // Add Microsoft Store apps (lowest priority - only if not already seen)
    uwpApps.forEach(app => {
      addAppIfUnique({
        id: `microsoft-${app.appId}`,
        name: app.name,
        type: 'microsoft',
        appId: app.appId,
        path: app.appId,
        icon: null, // UWP apps don't have easy icon access
        source: 'microsoft',
        category: 'Store App'
      });
    });
    
    return unified;
  },
  
  // Get filtered apps based on search and type
  getFilteredApps: () => {
    const { unifiedApps, searchQuery, selectedAppType } = get();
    
    const filtered = unifiedApps.filter(app => {
      // Filter by type
      const matchesType = selectedAppType === 'all' || app.type === selectedAppType;
      
      // Filter by search query (fuzzy search)
      const matchesSearch = !searchQuery || 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesType && matchesSearch;
    });
    
    return filtered;
  },
  
  // Clear selection
  clearSelection: () => {
    set({ selectedApp: null, customPath: '' });
  },
  
  // Get current configuration
  getConfiguration: () => {
    const { selectedApp, customPath } = get();
    
    return {
      type: selectedApp ? 'application' : 'url',
      selectedApp,
      customPath,
      generatedPath: selectedApp ? get().generatePathFromApp(selectedApp) : ''
    };
  }
}));

export default useUnifiedAppStore; 