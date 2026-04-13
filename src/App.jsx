import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import useConsolidatedAppStore from './utils/useConsolidatedAppStore';
import { useShallow } from 'zustand/react/shallow';
import useWallpaperCycling from './utils/useWallpaperCycling';
import useSoundManager from './utils/useSoundManager';
import useKeyboardShortcuts from './utils/useKeyboardShortcuts';
import { electronApi } from './utils/electronApi';
import {
  useCursorEffect,
  useThemeEffect,
  useBackgroundMusicEffects,
  useFullscreenEffect,
  useGlobalKeyHandlers,
} from './hooks/useAppShellEffects';
import { useAppInitialization } from './hooks/useAppInitialization';
import { 
  useTimeColor, 
  useEnableTimePill, 
  useTimePillBlur, 
  useTimePillOpacity, 
  useTimeFont 
} from './utils/useConsolidatedAppHooks';
import ErrorBoundary from './components/ErrorBoundary';
import { LaunchFeedbackProvider } from './contexts/LaunchFeedbackContext';
import SplashScreen from './components/SplashScreen';
import WallpaperOverlay from './components/WallpaperOverlay';
import IsolatedWallpaperBackground from './components/IsolatedWallpaperBackground';
import SpotifyImmersiveOverlay from './components/SpotifyImmersiveOverlay';
import SpotifyGradientOverlay from './components/SpotifyGradientOverlay';
import SpotifyLiveGradientWallpaper from './components/SpotifyLiveGradientWallpaper';
import { DEFAULT_TIME_COLOR_HEX } from './design/runtimeColorStrings.js';

// Lazy load components to reduce initial bundle size
const LazyPaginatedChannels = React.lazy(() => import('./components/PaginatedChannels'));
const LazyPageNavigation = React.lazy(() => import('./components/PageNavigation'));
const LazyWiiRibbon = React.lazy(() => import('./components/WiiRibbon'));
const LazyClassicWiiDock = React.lazy(() => import('./components/ClassicWiiDock'));
const LazyWiiSideNavigation = React.lazy(() => import('./components/WiiSideNavigation'));
const LazySettingsModal = React.lazy(() => import('./components/SettingsModal'));
const LazySettingsActionMenu = React.lazy(() => import('./components/SettingsActionMenu'));
const LazyFloatingSpotifyWidget = React.lazy(() => import('./components/FloatingSpotifyWidget'));
const LazySystemInfoWidget = React.lazy(() => import('./components/SystemInfoWidget'));
const LazyAdminPanelWidget = React.lazy(() => import('./components/AdminPanelWidget'));
const LazyPerformanceMonitor = React.lazy(() => import('./components/PerformanceMonitor'));



function App() {
  const {
    appReady,
    isLoading,
    splashFading,
    isDarkMode,
    useCustomCursor,
    cursorStyle,
    startInFullscreen,
    showDock,
    classicMode,
    showSettingsModal,
    settingsActiveTab,
    showSettingsActionMenu,
    ribbonColor,
    ribbonGlowColor,
    ribbonGlowStrength,
    ribbonGlowStrengthHover,
    ribbonDockOpacity,
    glassWiiRibbon,
    glassOpacity,
    glassBlur,
    glassBorderOpacity,
    glassShineOpacity,
    ribbonButtonConfigs,
    presetsButtonConfig,
    wallpaper,
    enabled,
    effect,
    intensity,
    speed,
    wind,
    gravity,
    floatingWidgets,
    dock,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      appReady: state.app.appReady,
      isLoading: state.app.isLoading,
      splashFading: state.app.splashFading,
      isDarkMode: state.ui.isDarkMode,
      useCustomCursor: state.ui.useCustomCursor,
      cursorStyle: state.ui.cursorStyle,
      startInFullscreen: state.ui.startInFullscreen,
      showDock: state.ui.showDock,
      classicMode: state.ui.classicMode,
      showSettingsModal: state.ui.showSettingsModal,
      settingsActiveTab: state.ui.settingsActiveTab,
      showSettingsActionMenu: state.ui.showSettingsActionMenu,
      ribbonColor: state.ribbon.ribbonColor,
      ribbonGlowColor: state.ribbon.ribbonGlowColor,
      ribbonGlowStrength: state.ribbon.ribbonGlowStrength,
      ribbonGlowStrengthHover: state.ribbon.ribbonGlowStrengthHover,
      ribbonDockOpacity: state.ribbon.ribbonDockOpacity,
      glassWiiRibbon: state.ribbon.glassWiiRibbon,
      glassOpacity: state.ribbon.glassOpacity,
      glassBlur: state.ribbon.glassBlur,
      glassBorderOpacity: state.ribbon.glassBorderOpacity,
      glassShineOpacity: state.ribbon.glassShineOpacity,
      ribbonButtonConfigs: state.ribbon.ribbonButtonConfigs,
      presetsButtonConfig: state.ribbon.presetsButtonConfig,
      wallpaper: state.wallpaper,
      enabled: state.overlay.enabled,
      effect: state.overlay.effect,
      intensity: state.overlay.intensity,
      speed: state.overlay.speed,
      wind: state.overlay.wind,
      gravity: state.overlay.gravity,
      floatingWidgets: state.floatingWidgets,
      dock: state.dock,
    }))
  );

  // Time settings using individual hooks for proper property mapping
  const timeColor = useTimeColor();
  const enableTimePill = useEnableTimePill();
  const timePillBlur = useTimePillBlur();
  const timePillOpacity = useTimePillOpacity();
  const timeFont = useTimeFont();
  


  // Initialize wallpaper cycling (only for cycling status indicator)
  const { isCycling, cycleToNextWallpaper } = useWallpaperCycling();

  // Initialize sound manager for background music
  const {
    soundSettings,
    startBackgroundMusic,
    stopBackgroundMusic,
    updateBackgroundMusic
  } = useSoundManager();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Debug: Log floating widgets state
  useEffect(() => {
    console.log('[App] Floating widgets state:', {
      spotify: floatingWidgets.spotify.visible,
      systemInfo: floatingWidgets.systemInfo.visible,
      adminPanel: floatingWidgets.adminPanel.visible,
      performanceMonitor: floatingWidgets.performanceMonitor.visible
    });
  }, [floatingWidgets]);


  
  // Debug: Monitor dock state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[App] Dock state changed:', {
        particleSystemEnabled: dock?.particleSystemEnabled,
        particleEffectType: dock?.particleEffectType,
        particleDirection: dock?.particleDirection,
        particleSpeed: dock?.particleSpeed,
        particleCount: dock?.particleCount
      });
    }
  }, [dock?.particleSystemEnabled, dock?.particleEffectType, dock?.particleDirection, dock?.particleSpeed, dock?.particleCount]);

  // Debug: Add global function to enable Spotify widget for testing
  useEffect(() => {
    window.enableSpotifyWidget = () => {
      const { actions } = useConsolidatedAppStore.getState();
      actions.toggleSpotifyWidget();
      console.log('[App] Spotify widget toggled via debug function');
    };
    
    window.showAllWidgets = () => {
      const { actions } = useConsolidatedAppStore.getState();
      actions.setFloatingWidgetsState({
        spotify: { ...floatingWidgets.spotify, visible: true },
        systemInfo: { ...floatingWidgets.systemInfo, visible: true },
        adminPanel: { ...floatingWidgets.adminPanel, visible: true },
        performanceMonitor: { ...floatingWidgets.performanceMonitor, visible: true }
      });
      console.log('[App] All widgets enabled via debug function');
    };
    
    return () => {
      delete window.enableSpotifyWidget;
      delete window.showAllWidgets;
    };
  }, [floatingWidgets]);

  useBackgroundMusicEffects({
    appReady,
    soundSettings,
    startBackgroundMusic,
    stopBackgroundMusic,
    updateBackgroundMusic,
  });

  // Handle settings changes from SettingsModal
  const handleSettingsChange = useCallback((settings) => {
    console.log('[App] Settings changed:', settings);
    
    // Update sound settings if they changed
    if (settings.sounds) {
      console.log('[App] Sound settings updated - triggering background music update...');
      updateBackgroundMusic();
    }
    
    // Update other settings as needed
    // (The consolidated store will handle most updates automatically)
  }, [updateBackgroundMusic]);

  // Actions from consolidated store
  const {
    setAppState,
    setUIState,
    setRibbonState,
    setWallpaperState,
    setChannelState,
    setChannelData,
    setOverlayState,
    setTimeState,
    setDockState,
    setSoundsState,
    setPresets,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      setAppState: state.actions.setAppState,
      setUIState: state.actions.setUIState,
      setRibbonState: state.actions.setRibbonState,
      setWallpaperState: state.actions.setWallpaperState,
      setChannelState: state.actions.setChannelState,
      setChannelData: state.actions.setChannelData,
      setOverlayState: state.actions.setOverlayState,
      setTimeState: state.actions.setTimeState,
      setDockState: state.actions.setDockState,
      setSoundsState: state.actions.setSoundsState,
      setPresets: state.actions.setPresets,
    }))
  );

  // Settings action menu state and positioning
  const [settingsMenuPosition, setSettingsMenuPosition] = useState({ x: 0, y: 0 });
  
  // Ref to access SettingsActionMenu's handleClose method
  const settingsActionMenuRef = useRef(null);
  
  // Define closeSettingsActionMenu function
  const closeSettingsActionMenu = useCallback(() => {
    setUIState({ showSettingsActionMenu: false });
  }, [setUIState]);

  // Handle settings action menu positioning
  const handleSettingsActionMenuOpen = useCallback(() => {
    // Use modal-style centering - no need to calculate position manually
    setSettingsMenuPosition({ x: 0, y: 0 }); // Will be centered by CSS
    setUIState({ showSettingsActionMenu: true });
  }, [setUIState]);

  // Debug function to open developer tools
  const openDevTools = useCallback(() => {
    electronApi.openDevTools().then((result) => {
      if (import.meta.env.DEV) {
        console.log('[DEBUG] openDevTools result:', result);
      }
    });
  }, []);

  useGlobalKeyHandlers({
    showSettingsActionMenu,
    settingsActionMenuRef,
    closeSettingsActionMenu,
    handleSettingsActionMenuOpen,
    openDevTools,
  });

  useCursorEffect(useCustomCursor, cursorStyle);
  useThemeEffect(isDarkMode);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return undefined;
    }

    let cleanup = () => {};
    import('./utils/devDebugBindings')
      .then(({ registerDevDebugBindings }) => {
        cleanup = registerDevDebugBindings({
          openDevTools,
          wallpaper,
          isCycling,
          cycleToNextWallpaper,
        });
      })
      .catch((error) => {
        console.warn('[App] Failed to load dev debug bindings:', error);
      });

    return () => {
      cleanup();
    };
  }, [openDevTools, wallpaper, isCycling, cycleToNextWallpaper]);

  useAppInitialization({
    setAppState,
    setWallpaperState,
    setOverlayState,
    setChannelState,
    setChannelData,
    setUIState,
    setRibbonState,
    setTimeState,
    setDockState,
    setSoundsState,
    setPresets,
  });

  useFullscreenEffect({ appReady, startInFullscreen });

  // Optimized handlers using consolidated store with useCallback
  const openSettingsModal = useCallback(() => setUIState({ showSettingsModal: true }), [setUIState]);
  const closeSettingsModal = useCallback(() => setUIState({ showSettingsModal: false }), [setUIState]);




  // Global right-click handler for settings modal (wallpaper tab)
  const handleGlobalRightClick = useCallback((event) => {
    // Check if the click target is within the ribbon or dock areas
    const target = event.target;
    const isInRibbon = target.closest('.interactive-footer') || target.closest('.wii-dock-wrapper');
    const isInDock = target.closest('.dock-container');
    const isInModal = target.closest('.modal-overlay') || target.closest('.modal-content');
    
    // Check if Ctrl key is held for DevTools
    if (event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
      console.log('[DEBUG] 🔧 Ctrl+Right-click detected - opening DevTools');
      openDevTools();
      return;
    }
    
    // Only open settings modal to wallpaper tab if not clicking on ribbon, dock, or existing modals
    if (!isInRibbon && !isInDock && !isInModal) {
      event.preventDefault();
      event.stopPropagation();
      // Open settings modal and set active tab to wallpaper
      setUIState({ 
        showSettingsModal: true,
        settingsActiveTab: 'wallpaper' // This will be handled by SettingsModal
      });
    }
  }, [setUIState, openDevTools]);
  const toggleDock = useCallback(() => setUIState(prev => ({ showDock: !prev.showDock })), [setUIState]);
  const toggleDarkMode = useCallback(() => setUIState(prev => ({ isDarkMode: !prev.isDarkMode })), [setUIState]);
  const toggleCustomCursor = useCallback(() => setUIState(prev => ({ useCustomCursor: !prev.useCustomCursor })), [setUIState]);

  // Debug wallpaper cycling isolation
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] 🖼️ === WALLPAPER CYCLING ISOLATION CHECK ===');
      console.log('[DEBUG] 🖼️ Wallpaper cycling is now completely isolated');
      console.log('[DEBUG] 🖼️ Channels should NOT be affected by cycling transitions');
    }
  }, []);

  // Render splash screen only if not ready
  if (!appReady || isLoading) {
    return <SplashScreen fadingOut={splashFading} />;
  }

  // Validate required data
  if (!ribbonColor || !ribbonGlowColor) {
    console.warn('[App] Missing required ribbon configuration, using defaults');
  }

  return (
    <ErrorBoundary>
      <LaunchFeedbackProvider>
      <div 
        className={`app-container ${useCustomCursor ? 'custom-cursor' : ''} ${isDarkMode ? 'dark-mode' : ''}`}
        onContextMenu={handleGlobalRightClick}
      >
        {/* Isolated Wallpaper Background - Completely separate from main app */}
        <IsolatedWallpaperBackground />

        {/* Wallpaper Overlay Effects */}
        <WallpaperOverlay
          effect={effect}
          enabled={enabled}
          intensity={intensity}
          speed={speed}
          wind={wind}
          gravity={gravity}
        />

        {/* Main Content */}
        <div className="main-content">
          <LazyPaginatedChannels />
        </div>

        {/* Page Navigation - Positioned independently */}
        <LazyPageNavigation 
          position="bottom"
          showPageIndicator={true}
        />

        {/* Wii Side Navigation - Available in both modes */}
        <LazyWiiSideNavigation />

        {/* Dock with proper props from consolidated store */}
        {showDock && (
          <div className="dock-container">
            {classicMode ? (
              <LazyClassicWiiDock
                buttonConfigs={ribbonButtonConfigs}
                presetsButtonConfig={presetsButtonConfig}
                onSettingsClick={openSettingsModal}
                onSettingsChange={(settings) => setRibbonState(settings)}
                onButtonClick={() => {}}
                onButtonContextMenu={() => {}}
                onAccessoryButtonClick={() => {}}
                onAccessoryButtonContextMenu={() => {}}
                onDockContextMenu={() => {}}
  
                showPresetsButton={true}
                timeColor={timeColor ?? DEFAULT_TIME_COLOR_HEX}
                timeFont={timeFont ?? 'default'}
                ribbonGlowColor={ribbonGlowColor}
                accessoryButtonConfig={{}}
              />
            ) : (
              <LazyWiiRibbon
                ribbonColor={ribbonColor}
                ribbonGlowColor={ribbonGlowColor}
                ribbonGlowStrength={ribbonGlowStrength}
                ribbonGlowStrengthHover={ribbonGlowStrengthHover}
                ribbonDockOpacity={ribbonDockOpacity}
                glassWiiRibbon={glassWiiRibbon}
                glassOpacity={glassOpacity}
                glassBlur={glassBlur}
                glassBorderOpacity={glassBorderOpacity}
                glassShineOpacity={glassShineOpacity}
                ribbonButtonConfigs={ribbonButtonConfigs}
                presetsButtonConfig={presetsButtonConfig}
                onSettingsClick={handleSettingsActionMenuOpen}
                onPresetsClick={() => setUIState({ showSettingsModal: true, settingsActiveTab: 'themes' })}
                onSettingsChange={(settings) => setRibbonState(settings)}
                onToggleDarkMode={toggleDarkMode}
                onToggleCursor={toggleCustomCursor}
                useCustomCursor={useCustomCursor}
                // Time settings from consolidated store
                enableTimePill={enableTimePill ?? true}
                timePillBlur={timePillBlur ?? 8}
                timePillOpacity={timePillOpacity ?? 0.05}
                timeColor={timeColor ?? DEFAULT_TIME_COLOR_HEX}
                timeFont={timeFont ?? 'default'}
                // Particle settings from consolidated store
                particleSettings={dock}
              />
            )}
          </div>
        )}

        {/* Floating Quick Access Buttons */}
        {!showDock && (
          <div className="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2">
            {/* Quick Settings Menu */}
            <div
              className="cursor-pointer p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
              onClick={handleSettingsActionMenuOpen}
              title="Quick Settings (Escape key)"
            >
              ⚙️
            </div>
            {/* Wallpaper Quick Access */}
            <div
              className="cursor-pointer p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
              onClick={() => setUIState({ 
                showSettingsModal: true,
                settingsActiveTab: 'wallpaper'
              })}
              title="Wallpaper Settings"
            >
              🖼️
            </div>
            {/* Settings Quick Access */}
            <div
              className="cursor-pointer p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
              onClick={openSettingsModal}
              title="Settings"
            >
              🔧
            </div>
            
            {/* Cycling Status Indicator */}
            {isCycling && (
              <div
                className="cursor-pointer p-3 bg-green-500/20 backdrop-blur-md rounded-full border border-green-400/30 hover:bg-green-500/30 transition-all duration-200 shadow-lg"
                onClick={cycleToNextWallpaper}
                title={`Cycling active (${cycleInterval}s interval) - Click to cycle manually`}
              >
                🔄
                </div>
            )}
            
            {/* Dark Mode Indicator */}
            {isDarkMode && (
              <div
                className="cursor-pointer p-3 bg-blue-500/20 backdrop-blur-md rounded-full border border-blue-400/30 hover:bg-blue-500/30 transition-all duration-200 shadow-lg"
                onClick={toggleDarkMode}
                title="Dark Mode Active - Click to toggle"
              >
                🌙
              </div>
            )}
            
            {/* Debug Button - Only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div
                className="cursor-pointer p-3 bg-red-500/20 backdrop-blur-md rounded-full border border-red-400/30 hover:bg-red-500/30 transition-all duration-200 shadow-lg"
                onClick={openDevTools}
                title="Open Developer Tools (Debug)"
              >
                🐛
              </div>
            )}
                </div>
        )}

        {/* Modals */}
        <Suspense fallback={null}>
          {showSettingsModal && (
          <LazySettingsModal
              isOpen={showSettingsModal}
            onClose={closeSettingsModal}
              onSettingsChange={handleSettingsChange}
              initialActiveTab={settingsActiveTab}
            />
          )}
        </Suspense>

        {/* Settings Action Menu - Independent of dock visibility */}
        <Suspense fallback={null}>
          {showSettingsActionMenu && (
            <LazySettingsActionMenu
              ref={settingsActionMenuRef}
              isOpen={showSettingsActionMenu}
              onClose={closeSettingsActionMenu}
              position={settingsMenuPosition}
            />
          )}
        </Suspense>

        {/* Spotify Live Gradient Wallpaper */}
        <SpotifyLiveGradientWallpaper />
        
        {/* Spotify Immersive Overlay */}
        <SpotifyImmersiveOverlay />
        
        {/* Spotify Gradient Overlay */}
        <SpotifyGradientOverlay />

        {/* Floating Widgets */}
        <Suspense fallback={null}>
          {/* Spotify Widget */}
          {floatingWidgets.spotify.visible && (
            <LazyFloatingSpotifyWidget 
              isVisible={floatingWidgets.spotify.visible}
              onClose={() => {
                const { actions } = useConsolidatedAppStore.getState();
                actions.toggleSpotifyWidget();
              }}
            />
          )}
          
          {/* System Info Widget */}
          {floatingWidgets.systemInfo.visible && (
            <LazySystemInfoWidget 
              isVisible={floatingWidgets.systemInfo.visible}
              onClose={() => {
                const { actions } = useConsolidatedAppStore.getState();
                actions.toggleSystemInfoWidget();
              }}
            />
          )}
          
          {/* Admin Panel Widget */}
          {floatingWidgets.adminPanel.visible && (
            <LazyAdminPanelWidget 
              isVisible={floatingWidgets.adminPanel.visible}
              onClose={() => {
                const { actions } = useConsolidatedAppStore.getState();
                actions.toggleAdminPanelWidget();
              }}
            />
          )}
          
          {/* Performance Monitor Widget */}
          {floatingWidgets.performanceMonitor.visible && (
            <LazyPerformanceMonitor 
              isVisible={floatingWidgets.performanceMonitor.visible}
              onClose={() => {
                const { actions } = useConsolidatedAppStore.getState();
                actions.togglePerformanceMonitorWidget();
              }}
            />
          )}
        </Suspense>


      </div>
      </LaunchFeedbackProvider>
    </ErrorBoundary>
  );
}

export default App;
