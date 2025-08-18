import { useMemo } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';

// Optimized hooks for selective state access
// These prevent unnecessary re-renders by only subscribing to specific state slices

export const useAppState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const app = useConsolidatedAppStore((state) => state.app);
  const setAppState = useConsolidatedAppStore((state) => state.actions.setAppState);
  
  return {
    app,
    setAppState,
  };
};

export const useUIState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const ui = useConsolidatedAppStore((state) => state.ui);
  const setUIState = useConsolidatedAppStore((state) => state.actions.setUIState);
  
  return {
    ui,
    setUIState,
  };
};

export const useRibbonState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const ribbon = useConsolidatedAppStore((state) => state.ribbon);
  const setRibbonState = useConsolidatedAppStore((state) => state.actions.setRibbonState);
  
  return {
    ribbon,
    setRibbonState,
  };
};

export const useWallpaperState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const wallpaper = useConsolidatedAppStore((state) => state.wallpaper);
  const setWallpaperState = useConsolidatedAppStore((state) => state.actions.setWallpaperState);
  
  return {
    wallpaper,
    setWallpaperState,
  };
};

export const useOverlayState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const overlay = useConsolidatedAppStore((state) => state.overlay);
  const setOverlayState = useConsolidatedAppStore((state) => state.actions.setOverlayState);
  
  return {
    overlay,
    setOverlayState,
  };
};

export const useTimeState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const time = useConsolidatedAppStore((state) => state.time);
  const setTimeState = useConsolidatedAppStore((state) => state.actions.setTimeState);
  
  return {
    time,
    setTimeState,
  };
};

export const useChannelState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const channels = useConsolidatedAppStore((state) => state.channels);
  const setChannelState = useConsolidatedAppStore((state) => state.actions.setChannelState);
  
  return {
    channels,
    setChannelState,
  };
};

export const useDockState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const dock = useConsolidatedAppStore((state) => state.dock);
  const setDockState = useConsolidatedAppStore((state) => state.actions.setDockState);
  
  return {
    dock,
    setDockState,
  };
};

export const useParticleState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const particles = useConsolidatedAppStore((state) => state.particles);
  const setParticleState = useConsolidatedAppStore((state) => state.actions.setParticleState);
  
  return {
    particles,
    setParticleState,
  };
};

export const useAudioState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const audio = useConsolidatedAppStore((state) => state.audio);
  const setAudioState = useConsolidatedAppStore((state) => state.actions.setAudioState);
  
  return {
    audio,
    setAudioState,
  };
};

export const useIconState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const icons = useConsolidatedAppStore((state) => state.icons);
  const setIconState = useConsolidatedAppStore((state) => state.actions.setIconState);
  const iconManager = useConsolidatedAppStore((state) => state.iconManager);
  
  return {
    icons,
    setIconState,
    iconManager,
  };
};

export const useAppLibraryState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const appLibrary = useConsolidatedAppStore((state) => state.appLibrary);
  const setAppLibraryState = useConsolidatedAppStore((state) => state.actions.setAppLibraryState);
  const appLibraryManager = useConsolidatedAppStore((state) => state.appLibraryManager);
  
  return {
    appLibrary,
    setAppLibraryState,
    appLibraryManager,
  };
};

export const useUnifiedAppsState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const unifiedApps = useConsolidatedAppStore((state) => state.unifiedApps);
  const setUnifiedAppsState = useConsolidatedAppStore((state) => state.actions.setUnifiedAppsState);
  
  return {
    unifiedApps,
    setUnifiedAppsState,
  };
};

export const useSpotifyState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const spotify = useConsolidatedAppStore((state) => state.spotify);
  const setSpotifyState = useConsolidatedAppStore((state) => state.actions.setSpotifyState);
  const spotifyManager = useConsolidatedAppStore((state) => state.spotifyManager);
  
  return {
    spotify,
    setSpotifyState,
    spotifyManager,
  };
};

export const useNavigationState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const navigation = useConsolidatedAppStore((state) => state.navigation);
  const setNavigationState = useConsolidatedAppStore((state) => state.actions.setNavigationState);
  const navigationManager = useConsolidatedAppStore((state) => state.navigationManager);
  
  return {
    navigation,
    setNavigationState,
    navigationManager,
  };
};

export const usePerformanceState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const performance = useConsolidatedAppStore((state) => state.performance);
  const setPerformanceState = useConsolidatedAppStore((state) => state.actions.setPerformanceState);
  const performanceManager = useConsolidatedAppStore((state) => state.performanceManager);
  
  return {
    performance,
    setPerformanceState,
    performanceManager,
  };
};

export const usePresetsState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const presets = useConsolidatedAppStore((state) => state.presets);
  const setPresets = useConsolidatedAppStore((state) => state.actions.setPresets);
  
  return {
    presets,
    setPresets,
  };
};

// Specific value hooks for even more granular access
export const useIsLoading = () => {
  return useConsolidatedAppStore((state) => state.app.isLoading);
};

export const useIsDarkMode = () => {
  return useConsolidatedAppStore((state) => state.ui.isDarkMode);
};

export const useUseCustomCursor = () => {
  return useConsolidatedAppStore((state) => state.ui.useCustomCursor);
};

export const useStartInFullscreen = () => {
  return useConsolidatedAppStore((state) => state.ui.startInFullscreen);
};

export const useShowPresetsButton = () => {
  return useConsolidatedAppStore((state) => state.ui.showPresetsButton);
};

export const useImmersivePip = () => {
  return useConsolidatedAppStore((state) => state.ui.immersivePip);
};

export const useShowDock = () => {
  return useConsolidatedAppStore((state) => state.ui.showDock);
};

export const useClassicMode = () => {
  return useConsolidatedAppStore((state) => state.ui.classicMode);
};

export const useChannelOpacity = () => {
  return useConsolidatedAppStore((state) => state.ui.channelOpacity);
};

export const useGlassWiiRibbon = () => {
  return useConsolidatedAppStore((state) => state.ribbon.glassWiiRibbon);
};

export const useGlassOpacity = () => {
  return useConsolidatedAppStore((state) => state.ribbon.glassOpacity);
};

export const useGlassBlur = () => {
  return useConsolidatedAppStore((state) => state.ribbon.glassBlur);
};

export const useGlassBorderOpacity = () => {
  return useConsolidatedAppStore((state) => state.ribbon.glassBorderOpacity);
};

export const useGlassShineOpacity = () => {
  return useConsolidatedAppStore((state) => state.ribbon.glassShineOpacity);
};

export const useRibbonColor = () => {
  return useConsolidatedAppStore((state) => state.ribbon.ribbonColor);
};

export const useRibbonGlowColor = () => {
  return useConsolidatedAppStore((state) => state.ribbon.ribbonGlowColor);
};

export const useRibbonGlowStrength = () => {
  return useConsolidatedAppStore((state) => state.ribbon.ribbonGlowStrength);
};

export const useRibbonGlowStrengthHover = () => {
  return useConsolidatedAppStore((state) => state.ribbon.ribbonGlowStrengthHover);
};

export const useRibbonDockOpacity = () => {
  return useConsolidatedAppStore((state) => state.ribbon.ribbonDockOpacity);
};

export const useWallpaper = () => {
  return useConsolidatedAppStore((state) => state.wallpaper.current);
};

export const useWallpaperOpacity = () => {
  return useConsolidatedAppStore((state) => state.wallpaper.opacity);
};

export const useWallpaperBlur = () => {
  return useConsolidatedAppStore((state) => state.wallpaper.blur);
};

export const useCycleWallpapers = () => {
  return useConsolidatedAppStore((state) => state.wallpaper.cycleWallpapers);
};

export const useCycleInterval = () => {
  return useConsolidatedAppStore((state) => state.wallpaper.cycleInterval);
};

export const useTimeColor = () => {
  return useConsolidatedAppStore((state) => state.time.color);
};

export const useTimeFormat24hr = () => {
  return useConsolidatedAppStore((state) => state.time.format24hr);
};

export const useEnableTimePill = () => {
  return useConsolidatedAppStore((state) => state.time.enablePill);
};

export const useTimePillBlur = () => {
  return useConsolidatedAppStore((state) => state.time.pillBlur);
};

export const useTimePillOpacity = () => {
  return useConsolidatedAppStore((state) => state.time.pillOpacity);
};

export const useTimeFont = () => {
  return useConsolidatedAppStore((state) => state.time.font);
};

export const useChannelAutoFadeTimeout = () => {
  return useConsolidatedAppStore((state) => state.channels.autoFadeTimeout);
};

export const useChannelAnimation = () => {
  return useConsolidatedAppStore((state) => state.channels.animation);
};

export const useAdaptiveEmptyChannels = () => {
  return useConsolidatedAppStore((state) => state.channels.adaptiveEmptyChannels);
};

export const useAnimatedOnHover = () => {
  return useConsolidatedAppStore((state) => state.channels.animatedOnHover);
};

export const useIdleAnimationEnabled = () => {
  return useConsolidatedAppStore((state) => state.channels.idleAnimationEnabled);
};

export const useKenBurnsEnabled = () => {
  return useConsolidatedAppStore((state) => state.channels.kenBurnsEnabled);
};

export const useDockSettings = () => {
  return useConsolidatedAppStore((state) => state.dock.settings);
};

export const useParticleSettings = () => {
  return useConsolidatedAppStore((state) => state.particles);
};

export const usePresets = () => {
  return useConsolidatedAppStore((state) => state.presets);
};

// Memoized selectors for complex state combinations
export const useRibbonStyles = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const glassWiiRibbon = useConsolidatedAppStore((state) => state.ribbon.glassWiiRibbon);
  const glassOpacity = useConsolidatedAppStore((state) => state.ribbon.glassOpacity);
  const glassBlur = useConsolidatedAppStore((state) => state.ribbon.glassBlur);
  const glassBorderOpacity = useConsolidatedAppStore((state) => state.ribbon.glassBorderOpacity);
  const glassShineOpacity = useConsolidatedAppStore((state) => state.ribbon.glassShineOpacity);
  const ribbonColor = useConsolidatedAppStore((state) => state.ribbon.ribbonColor);
  const ribbonGlowColor = useConsolidatedAppStore((state) => state.ribbon.ribbonGlowColor);
  const ribbonGlowStrength = useConsolidatedAppStore((state) => state.ribbon.ribbonGlowStrength);
  const ribbonGlowStrengthHover = useConsolidatedAppStore((state) => state.ribbon.ribbonGlowStrengthHover);
  const ribbonDockOpacity = useConsolidatedAppStore((state) => state.ribbon.ribbonDockOpacity);
  
  return {
    glassWiiRibbon,
    glassOpacity,
    glassBlur,
    glassBorderOpacity,
    glassShineOpacity,
    ribbonColor,
    ribbonGlowColor,
    ribbonGlowStrength,
    ribbonGlowStrengthHover,
    ribbonDockOpacity,
  };
};

export const useWallpaperStyles = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const current = useConsolidatedAppStore((state) => state.wallpaper.current);
  const opacity = useConsolidatedAppStore((state) => state.wallpaper.opacity);
  const blur = useConsolidatedAppStore((state) => state.wallpaper.blur);
  const isTransitioning = useConsolidatedAppStore((state) => state.wallpaper.isTransitioning);
  const slideDirection = useConsolidatedAppStore((state) => state.wallpaper.slideDirection);
  const crossfadeProgress = useConsolidatedAppStore((state) => state.wallpaper.crossfadeProgress);
  const slideProgress = useConsolidatedAppStore((state) => state.wallpaper.slideProgress);
  
  return {
    current,
    opacity,
    blur,
    isTransitioning,
    slideDirection,
    crossfadeProgress,
    slideProgress,
  };
};

export const useTimeStyles = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const color = useConsolidatedAppStore((state) => state.time.color);
  const format24hr = useConsolidatedAppStore((state) => state.time.format24hr);
  const enablePill = useConsolidatedAppStore((state) => state.time.enablePill);
  const pillBlur = useConsolidatedAppStore((state) => state.time.pillBlur);
  const pillOpacity = useConsolidatedAppStore((state) => state.time.pillOpacity);
  const font = useConsolidatedAppStore((state) => state.time.font);
  
  return {
    color,
    format24hr,
    enablePill,
    pillBlur,
    pillOpacity,
    font,
  };
};

export const useChannelStyles = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const autoFadeTimeout = useConsolidatedAppStore((state) => state.channels.autoFadeTimeout);
  const animation = useConsolidatedAppStore((state) => state.channels.animation);
  const adaptiveEmptyChannels = useConsolidatedAppStore((state) => state.channels.adaptiveEmptyChannels);
  const animatedOnHover = useConsolidatedAppStore((state) => state.channels.animatedOnHover);
  const idleAnimationEnabled = useConsolidatedAppStore((state) => state.channels.idleAnimationEnabled);
  const idleAnimationTypes = useConsolidatedAppStore((state) => state.channels.idleAnimationTypes);
  const idleAnimationInterval = useConsolidatedAppStore((state) => state.channels.idleAnimationInterval);
  const kenBurnsEnabled = useConsolidatedAppStore((state) => state.channels.kenBurnsEnabled);
  const kenBurnsMode = useConsolidatedAppStore((state) => state.channels.kenBurnsMode);
  const kenBurnsHoverScale = useConsolidatedAppStore((state) => state.channels.kenBurnsHoverScale);
  const kenBurnsAutoplayScale = useConsolidatedAppStore((state) => state.channels.kenBurnsAutoplayScale);
  const kenBurnsSlideshowScale = useConsolidatedAppStore((state) => state.channels.kenBurnsSlideshowScale);
  const kenBurnsHoverDuration = useConsolidatedAppStore((state) => state.channels.kenBurnsHoverDuration);
  const kenBurnsAutoplayDuration = useConsolidatedAppStore((state) => state.channels.kenBurnsAutoplayDuration);
  const kenBurnsSlideshowDuration = useConsolidatedAppStore((state) => state.channels.kenBurnsSlideshowDuration);
  const kenBurnsCrossfadeDuration = useConsolidatedAppStore((state) => state.channels.kenBurnsCrossfadeDuration);
  const kenBurnsForGifs = useConsolidatedAppStore((state) => state.channels.kenBurnsForGifs);
  const kenBurnsForVideos = useConsolidatedAppStore((state) => state.channels.kenBurnsForVideos);
  const kenBurnsEasing = useConsolidatedAppStore((state) => state.channels.kenBurnsEasing);
  const kenBurnsAnimationType = useConsolidatedAppStore((state) => state.channels.kenBurnsAnimationType);
  const kenBurnsCrossfadeReturn = useConsolidatedAppStore((state) => state.channels.kenBurnsCrossfadeReturn);
  const kenBurnsTransitionType = useConsolidatedAppStore((state) => state.channels.kenBurnsTransitionType);
  
  return {
    autoFadeTimeout,
    animation,
    adaptiveEmptyChannels,
    animatedOnHover,
    idleAnimationEnabled,
    idleAnimationTypes,
    idleAnimationInterval,
    kenBurnsEnabled,
    kenBurnsMode,
    kenBurnsHoverScale,
    kenBurnsAutoplayScale,
    kenBurnsSlideshowScale,
    kenBurnsHoverDuration,
    kenBurnsAutoplayDuration,
    kenBurnsSlideshowDuration,
    kenBurnsCrossfadeDuration,
    kenBurnsForGifs,
    kenBurnsForVideos,
    kenBurnsEasing,
    kenBurnsAnimationType,
    kenBurnsCrossfadeReturn,
    kenBurnsTransitionType,
  };
};

// Utility hook for bulk updates
export const useBulkUpdate = () => {
  return useConsolidatedAppStore((state) => state.actions.updateState);
};

// Utility hook for resetting to defaults
export const useResetToDefaults = () => {
  return useConsolidatedAppStore((state) => state.actions.resetToDefaults);
};

// Floating widgets hooks
export const useFloatingWidgetsState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const floatingWidgets = useConsolidatedAppStore((state) => state.floatingWidgets);
  const setFloatingWidgetsState = useConsolidatedAppStore((state) => state.actions.setFloatingWidgetsState);
  
  return {
    floatingWidgets,
    setFloatingWidgetsState,
  };
};

export const useSpotifyWidget = () => {
  return useConsolidatedAppStore((state) => state.floatingWidgets.spotify);
};

export const useSystemInfoWidget = () => {
  return useConsolidatedAppStore((state) => state.floatingWidgets.systemInfo);
};

export const useAdminPanelWidget = () => {
  return useConsolidatedAppStore((state) => state.floatingWidgets.adminPanel);
};

export const usePerformanceMonitorWidget = () => {
  return useConsolidatedAppStore((state) => state.floatingWidgets.performanceMonitor);
};

export const useMonitorState = () => {
  // ✅ DATA LAYER: Use separate selectors to prevent infinite loops
  const monitors = useConsolidatedAppStore((state) => state.monitors);
  const setMonitorState = useConsolidatedAppStore((state) => state.actions.setMonitorState);
  
  return {
    // Monitor state
    displays: monitors?.displays || [],
    currentDisplay: monitors?.currentDisplay || null,
    preferredMonitor: monitors?.preferredMonitor || 'primary',
    specificMonitorId: monitors?.specificMonitorId || null,
    rememberLastMonitor: monitors?.rememberLastMonitor || false,
    
    // Monitor actions
    setDisplays: (displays) => setMonitorState({ displays }),
    setCurrentDisplay: (currentDisplay) => setMonitorState({ currentDisplay }),
    setPreferredMonitor: (preferredMonitor) => setMonitorState({ preferredMonitor }),
    setSpecificMonitorId: (specificMonitorId) => setMonitorState({ specificMonitorId }),
    setRememberLastMonitor: (rememberLastMonitor) => setMonitorState({ rememberLastMonitor }),
    
    // Monitor functions
    moveToDisplay: async (displayId) => {
      try {
        if (window.api?.monitors?.moveToDisplay) {
          return await window.api.monitors.moveToDisplay(displayId);
        }
        return { success: false, error: 'Monitor API not available' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    fetchDisplays: async () => {
      try {
        if (window.api?.monitors?.getDisplays) {
          const displays = await window.api.monitors.getDisplays();
          setMonitorState({ displays });
          return displays;
        }
        return [];
      } catch (error) {
        console.error('[useMonitorState] Error fetching displays:', error);
        return [];
      }
    },
    
    fetchCurrentDisplay: async () => {
      try {
        if (window.api?.monitors?.getCurrentDisplay) {
          const currentDisplay = await window.api.monitors.getCurrentDisplay();
          setMonitorState({ currentDisplay });
          return currentDisplay;
        }
        return null;
      } catch (error) {
        console.error('[useMonitorState] Error fetching current display:', error);
        return null;
      }
    },
    
    saveMonitorWallpaper: async (monitorId, wallpaperData) => {
      try {
        if (window.api?.wallpapers?.saveMonitorWallpaper) {
          return await window.api.wallpapers.saveMonitorWallpaper(monitorId, wallpaperData);
        }
        return { success: false, error: 'Wallpaper API not available' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    saveMonitorSettings: async (monitorId, settings) => {
      try {
        if (window.api?.wallpapers?.saveMonitorSettings) {
          return await window.api.wallpapers.saveMonitorSettings(monitorId, settings);
        }
        return { success: false, error: 'Settings API not available' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };
};
