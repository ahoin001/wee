import { create } from 'zustand';

const useMonitorStore = create((set, get) => ({
  // Monitor state
  displays: [],
  currentDisplay: null,
  primaryDisplay: null,
  isLoading: false,
  error: null,

  // Monitor settings
  preferredMonitor: 'primary', // 'primary', 'secondary', 'last-used', 'specific'
  specificMonitorId: null,
  rememberLastMonitor: true,
  lastUsedMonitorId: null,
  
  // Monitor-specific wallpaper and settings
  currentMonitorWallpaper: null,
  currentMonitorSettings: null,

  // Actions
  setDisplays: (displays) => set({ displays }),
  
  setCurrentDisplay: (display) => set({ currentDisplay: display }),
  
  setPrimaryDisplay: (display) => set({ primaryDisplay: display }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  setPreferredMonitor: (preference) => set({ preferredMonitor: preference }),
  
  setSpecificMonitorId: (monitorId) => set({ specificMonitorId: monitorId }),
  
  setRememberLastMonitor: (remember) => set({ rememberLastMonitor: remember }),
  
  setLastUsedMonitorId: (monitorId) => set({ lastUsedMonitorId: monitorId }),
  
  // Monitor-specific wallpaper and settings actions
  setCurrentMonitorWallpaper: (wallpaper) => set({ currentMonitorWallpaper: wallpaper }),
  setCurrentMonitorSettings: (settings) => set({ currentMonitorSettings: settings }),

  // Fetch all displays
  fetchDisplays: async () => {
    set({ isLoading: true, error: null });
    try {
      // Check if monitor APIs are available
      if (!window.api?.monitors) {
        console.warn('[MonitorStore] Monitor APIs not available');
        set({ error: 'Monitor APIs not available', isLoading: false });
        return [];
      }
      
      const displays = await window.api.monitors.getDisplays();
      set({ displays, isLoading: false });
      return displays;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('[MonitorStore] Error fetching displays:', error);
      return [];
    }
  },

  // Fetch primary display
  fetchPrimaryDisplay: async () => {
    try {
      // Check if monitor APIs are available
      if (!window.api?.monitors) {
        console.warn('[MonitorStore] Monitor APIs not available');
        return null;
      }
      
      const primaryDisplay = await window.api.monitors.getPrimaryDisplay();
      set({ primaryDisplay });
      return primaryDisplay;
    } catch (error) {
      set({ error: error.message });
      console.error('[MonitorStore] Error fetching primary display:', error);
      return null;
    }
  },

  // Fetch current display
  fetchCurrentDisplay: async () => {
    try {
      // Check if monitor APIs are available
      if (!window.api?.monitors) {
        console.warn('[MonitorStore] Monitor APIs not available');
        return null;
      }
      
      const currentDisplay = await window.api.monitors.getCurrentDisplay();
      set({ currentDisplay });
      return currentDisplay;
    } catch (error) {
      set({ error: error.message });
      console.error('[MonitorStore] Error fetching current display:', error);
      return null;
    }
  },

  // Move to specific display
  moveToDisplay: async (displayId) => {
    try {
      // Check if monitor APIs are available
      if (!window.api?.monitors) {
        console.warn('[MonitorStore] Monitor APIs not available');
        return { success: false, error: 'Monitor APIs not available' };
      }
      
      const result = await window.api.monitors.moveToDisplay(displayId);
      if (result.success) {
        // Update current display after moving
        await get().fetchCurrentDisplay();
        // Remember this monitor if enabled
        if (get().rememberLastMonitor) {
          set({ lastUsedMonitorId: displayId });
        }
        
        // Load monitor-specific wallpaper and settings
        await get().loadMonitorSpecificData(displayId);
      }
      return result;
    } catch (error) {
      set({ error: error.message });
      console.error('[MonitorStore] Error moving to display:', error);
      return { success: false, error: error.message };
    }
  },

  // Load monitor-specific wallpaper and settings
  loadMonitorSpecificData: async (monitorId) => {
    try {
      if (!window.api?.wallpapers) {
        console.warn('[MonitorStore] Wallpaper APIs not available');
        return;
      }
      
      // Load monitor-specific wallpaper
      const wallpaper = await window.api.wallpapers.getMonitorWallpaper(monitorId);
      get().setCurrentMonitorWallpaper(wallpaper);
      
      // Load monitor-specific settings
      const settings = await window.api.wallpapers.getMonitorSettings(monitorId);
      get().setCurrentMonitorSettings(settings);
      
      console.log('[MonitorStore] Loaded monitor-specific data for:', monitorId);
    } catch (error) {
      console.error('[MonitorStore] Error loading monitor-specific data:', error);
    }
  },

  // Save monitor-specific wallpaper
  saveMonitorWallpaper: async (monitorId, wallpaperData) => {
    try {
      if (!window.api?.wallpapers) {
        console.warn('[MonitorStore] Wallpaper APIs not available');
        return false;
      }
      
      await window.api.wallpapers.setMonitorWallpaper(monitorId, wallpaperData);
      console.log('[MonitorStore] Saved monitor wallpaper for:', monitorId);
      return true;
    } catch (error) {
      console.error('[MonitorStore] Error saving monitor wallpaper:', error);
      return false;
    }
  },

  // Save monitor-specific settings
  saveMonitorSettings: async (monitorId, settings) => {
    try {
      if (!window.api?.wallpapers) {
        console.warn('[MonitorStore] Wallpaper APIs not available');
        return false;
      }
      
      await window.api.wallpapers.setMonitorSettings(monitorId, settings);
      console.log('[MonitorStore] Saved monitor settings for:', monitorId);
      return true;
    } catch (error) {
      console.error('[MonitorStore] Error saving monitor settings:', error);
      return false;
    }
  },

  // Get target display based on preferences
  getTargetDisplay: () => {
    const { displays, preferredMonitor, specificMonitorId, lastUsedMonitorId } = get();
    
    if (displays.length === 0) return null;
    
    switch (preferredMonitor) {
      case 'primary':
        return displays.find(d => d.primary) || displays[0];
      case 'secondary':
        const nonPrimary = displays.filter(d => !d.primary);
        return nonPrimary.length > 0 ? nonPrimary[0] : displays[0];
      case 'specific':
        return displays.find(d => d.id === specificMonitorId) || displays[0];
      case 'last-used':
        if (lastUsedMonitorId) {
          return displays.find(d => d.id === lastUsedMonitorId) || displays[0];
        }
        return displays.find(d => d.primary) || displays[0];
      default:
        return displays.find(d => d.primary) || displays[0];
    }
  },

  // Initialize monitor system
  initialize: async () => {
    console.log('[MonitorStore] Initializing monitor system...');
    
    // Check if monitor APIs are available
    if (!window.api?.monitors) {
      console.warn('[MonitorStore] Monitor APIs not available during initialization, will retry in 500ms');
      // Retry after a delay in case APIs are still loading
      setTimeout(() => {
        get().initialize();
      }, 500);
      return;
    }
    
    // Fetch all displays
    await get().fetchDisplays();
    
    // Fetch primary display
    await get().fetchPrimaryDisplay();
    
    // Fetch current display
    const currentDisplay = await get().fetchCurrentDisplay();
    
    // Load monitor-specific data for current display
    if (currentDisplay) {
      await get().loadMonitorSpecificData(currentDisplay.id);
    }
    
    // Set up event listeners
    if (window.api.monitors) {
      window.api.monitors.onDisplayAdded((display) => {
        console.log('[MonitorStore] Display added:', display.id);
        get().fetchDisplays();
      });
      
      window.api.monitors.onDisplayRemoved((display) => {
        console.log('[MonitorStore] Display removed:', display.id);
        get().fetchDisplays();
      });
      
      window.api.monitors.onDisplayMetricsChanged(({ display, changedMetrics }) => {
        console.log('[MonitorStore] Display metrics changed:', display.id, changedMetrics);
        get().fetchDisplays();
        get().fetchCurrentDisplay();
      });
    }
    
    console.log('[MonitorStore] Monitor system initialized');
  },

  // Clean up event listeners
  cleanup: () => {
    if (window.api.monitors) {
      window.api.monitors.onDisplayAdded(null);
      window.api.monitors.onDisplayRemoved(null);
      window.api.monitors.onDisplayMetricsChanged(null);
    }
  }
}));

export default useMonitorStore; 