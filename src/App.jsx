import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { m } from 'framer-motion';
import useConsolidatedAppStore from './utils/useConsolidatedAppStore';
// Side effect: registers every cache domain with the cache registry (refresh actions).
import './utils/cacheDomains';
import { useShallow } from 'zustand/react/shallow';
import useKeyboardShortcuts from './utils/useKeyboardShortcuts';
import { requestWallpaperCycleManual } from './utils/wallpaperCyclingBridge';
import useWheelNavigation from './hooks/useWheelNavigation';
import { electronApi } from './utils/electronApi';
import useBackgroundMusicLifecycle from './utils/useBackgroundMusicLifecycle';
import {
  useCursorEffect,
  useThemeEffect,
  usePrimaryAccentThemeEffect,
  useFullscreenEffect,
  useGlobalKeyHandlers,
} from './hooks/useAppShellEffects';
import { useWallpaperAmbientColor } from './hooks/useWallpaperAmbientColor';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useNowPlayingSources } from './hooks/useNowPlayingSources';
import { useAppUpdater } from './hooks/useAppUpdater';
import { useUnifiedSettingsPersistence } from './hooks/useUnifiedSettingsPersistence';
import { useWallpaperDataFileSync } from './hooks/useWallpaperDataFileSync';
import { useFloatingWidgetMountGate } from './hooks/useFloatingWidgetMountGate';
import { 
  useTimeColor, 
  useEnableTimePill, 
  useTimePillBlur, 
  useTimePillOpacity, 
  useTimeFont 
} from './utils/useConsolidatedAppHooks';
import { ErrorBoundary, SplashScreen, SpaceBootLoader } from './components/core';
import { LaunchFeedbackProvider } from './contexts/LaunchFeedbackContext';
import { WallpaperOverlay, IsolatedWallpaperBackground } from './components/overlays';
import { DEFAULT_TIME_COLOR_HEX } from './design/runtimeColorStrings.js';
import GameHubMinimalDock from './components/game-hub/GameHubMinimalDock';
import { DEFAULT_SHELL_SPACE_ORDER, normalizeShellSpaceOrder } from './utils/channelSpaces';
import {
  SPACE_SHELL_EASE_CSS,
  SPACE_SHELL_RAPID_WINDOW_MS,
  SPACE_SHELL_TRANSITION_MS_DEFAULT,
  SPACE_SHELL_TRANSITION_MS_RAPID,
} from './design/spaceShellMotion';
import { collectPrioritizedWarmMediaUrls } from './utils/mediaWarmCache';
import { scheduleMediaWarmPass } from './utils/mediaWarmScheduler';
import { IS_DEV } from './utils/env';
import { useAppActivity } from './hooks/useAppActivity';
import { useSessionPowerSync } from './hooks/useSessionPowerSync';
import { useSystemPowerSync } from './hooks/useSystemPowerSync';
import { useWeeMotion } from './design/weeMotion';
import { weeMeasureAsync, weeMarkSettingsModalVisible } from './utils/weePerformanceMarks';
import SpotifyTakeoverController from './components/overlays/SpotifyTakeoverController';

// Lazy load components to reduce initial bundle size
const lazyNamedExport = (importer, exportName) =>
  React.lazy(() =>
    importer().then((module) => ({ default: module[exportName] }))
  );

const LazyPaginatedChannels = lazyNamedExport(() => import('./components/navigation'), 'PaginatedChannels');
const LazyPageNavigation = lazyNamedExport(() => import('./components/navigation'), 'PageNavigation');
const LazyHomePageIndicator = lazyNamedExport(() => import('./components/home-grid'), 'HomePageIndicator');
const LazyWiiRibbon = lazyNamedExport(() => import('./components/dock'), 'WiiRibbon');
const LazyClassicWiiDock = lazyNamedExport(() => import('./components/dock'), 'ClassicWiiDock');
const LazyWiiSideNavigation = lazyNamedExport(() => import('./components/navigation'), 'WiiSideNavigation');
const LazySettingsModal = lazyNamedExport(() => import('./components/settings'), 'SettingsModal');
const LazyCommandPalette = React.lazy(() => import('./components/palette/CommandPalette'));

/** Defers the palette chunk until first open, then keeps it mounted for instant reopen. */
function CommandPaletteMount() {
  const open = useConsolidatedAppStore((s) => Boolean(s.ui.commandPaletteOpen));
  const [everOpened, setEverOpened] = useState(false);
  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);
  if (!everOpened) return null;
  return (
    <Suspense fallback={null}>
      <LazyCommandPalette />
    </Suspense>
  );
}
const LazySettingsActionMenu = lazyNamedExport(() => import('./components/settings'), 'SettingsActionMenu');
const LazyUpdateModal = React.lazy(() => import('./components/modals/UpdateModal'));
const LazyAdminPanelWidget = lazyNamedExport(() => import('./components/admin'), 'AdminPanelWidget');
const LazyPerformanceMonitor = lazyNamedExport(() => import('./components/widgets'), 'PerformanceMonitor');
const LazySpaceRail = lazyNamedExport(() => import('./components/spaces'), 'SpaceRail');
const LazyGameHubSpace = lazyNamedExport(() => import('./components/game-hub'), 'GameHubSpace');
const LazyMediaHubSpace = lazyNamedExport(() => import('./components/media-hub'), 'MediaHubSpace');
const LazySpotifyLiveGradientWallpaper = React.lazy(() => import('./components/overlays/SpotifyLiveGradientWallpaper'));
const LazySpotifyImmersiveOverlay = React.lazy(() => import('./components/overlays/SpotifyImmersiveOverlay'));
const LazySpotifyGradientOverlay = React.lazy(() => import('./components/overlays/SpotifyGradientOverlay'));
const prefetchSettingsModules = () => import('./components/settings');


function App() {
  const {
    appReady,
    isLoading,
    splashFading,
    isDarkMode,
    useCustomCursor,
    cursorStyle,
    lowPowerMode,
    startInFullscreen,
    showDock,
    classicMode,
    showSettingsModal,
    settingsActiveTab,
    showSettingsActionMenu,
    showUpdateModal,
    ribbonColor,
    ribbonGlowColor,
    dynamicRibbonColorEnabled,
    wallpaperMatchEnabled,
    ambientPalette,
    spotifyMatchEnabled,
    spotifyExtractedColors,
    ribbonGlowStrength,
    ribbonGlowStrengthHover,
    ribbonDockOpacity,
    ribbonHoverAnimationEnabled,
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
    activeSpaceId,
    spaceOrder,
    mediaHubEnabled,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      appReady: state.app.appReady,
      isLoading: state.app.isLoading,
      splashFading: state.app.splashFading,
      isDarkMode: state.ui.isDarkMode,
      useCustomCursor: state.ui.useCustomCursor,
      cursorStyle: state.ui.cursorStyle,
      lowPowerMode: state.ui.lowPowerMode ?? false,
      startInFullscreen: state.ui.startInFullscreen,
      showDock: state.ui.showDock,
      classicMode: state.ui.classicMode,
      showSettingsModal: state.ui.showSettingsModal,
      settingsActiveTab: state.ui.settingsActiveTab,
      showSettingsActionMenu: state.ui.showSettingsActionMenu,
      showUpdateModal: state.ui.showUpdateModal,
      ribbonColor: state.ribbon.ribbonColor,
      ribbonGlowColor: state.ribbon.ribbonGlowColor,
      dynamicRibbonColorEnabled: state.ribbon.dynamicRibbonColorEnabled ?? false,
      wallpaperMatchEnabled: state.ui.wallpaperMatchEnabled !== false,
      ambientPalette: state.ui.ambientColor?.palette ?? null,
      spotifyMatchEnabled: state.ui.spotifyMatchEnabled ?? false,
      spotifyExtractedColors: state.spotify?.extractedColors ?? null,
      ribbonGlowStrength: state.ribbon.ribbonGlowStrength,
      ribbonGlowStrengthHover: state.ribbon.ribbonGlowStrengthHover,
      ribbonDockOpacity: state.ribbon.ribbonDockOpacity,
      ribbonHoverAnimationEnabled: state.ribbon.ribbonHoverAnimationEnabled,
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
      activeSpaceId: state.spaces.activeSpaceId,
      spaceOrder: state.spaces.order,
      mediaHubEnabled: state.spaces.mediaHubEnabled === true,
    }))
  );

  // Time settings using individual hooks for proper property mapping
  const timeColor = useTimeColor();
  const enableTimePill = useEnableTimePill();
  const timePillBlur = useTimePillBlur();
  const timePillOpacity = useTimePillOpacity();
  const timeFont = useTimeFont();

  /** Must run before any early return (splash) — same hook order every render. */
  const { isAppActive } = useAppActivity();
  useSessionPowerSync();
  useSystemPowerSync();
  const { reducedMotion, pillOpen } = useWeeMotion();


  // Cycling engine lives in IsolatedWallpaperBackground; indicator reads store + bridge.
  const { isCycling, cycleIntervalSeconds } = useConsolidatedAppStore(
    useShallow((state) => {
      const likedCount = state.wallpaper.likedWallpapers?.length ?? 0;
      const lowPower = state.ui.lowPowerMode;
      const interval = state.wallpaper.cycleInterval ?? 30;
      return {
        isCycling: Boolean(state.wallpaper.cycleWallpapers) && likedCount > 1,
        cycleIntervalSeconds: lowPower ? Math.max(interval, 60) : interval,
      };
    })
  );
  const cycleToNextWallpaper = requestWallpaperCycleManual;

  // Single BGM lifecycle owner (focus/blur + settings-driven start/stop)
  useBackgroundMusicLifecycle({ appReady });

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  useWheelNavigation();
  useUnifiedSettingsPersistence();
  useWallpaperDataFileSync();

  useEffect(() => {
    if (IS_DEV) {
      console.log('[App] Floating widgets state:', {
        adminPanel: floatingWidgets.adminPanel.visible,
        performanceMonitor: floatingWidgets.performanceMonitor.visible
      });
    }
  }, [floatingWidgets]);

  
  // Debug: Monitor dock state changes
  useEffect(() => {
    if (IS_DEV) {
      console.log('[App] Dock state changed:', {
        glassEnabled: dock?.glassEnabled,
        dockScale: dock?.dockScale,
      });
    }
  }, [dock?.glassEnabled, dock?.dockScale]);

  // Debug: expose helpers for remaining floating widgets
  useEffect(() => {
    window.showAllWidgets = () => {
      const { actions } = useConsolidatedAppStore.getState();
      actions.setFloatingWidgetsState({
        adminPanel: { ...floatingWidgets.adminPanel, visible: true },
        performanceMonitor: { ...floatingWidgets.performanceMonitor, visible: true }
      });
      console.log('[App] Admin + performance widgets enabled via debug function');
    };
    
    return () => {
      delete window.showAllWidgets;
    };
  }, [floatingWidgets]);

  // Actions from consolidated store
  const { setUIState, setRibbonState, setDockState, setSpacesState } = useConsolidatedAppStore(
    useShallow((state) => ({
      setUIState: state.actions.setUIState,
      setRibbonState: state.actions.setRibbonState,
      setDockState: state.actions.setDockState,
      setSpacesState: state.actions.setSpacesState,
    }))
  );

  // Settings action menu state and positioning
  const [settingsMenuPosition, setSettingsMenuPosition] = useState({ x: 0, y: 0 });
  const resolvedSpaceOrder = useMemo(
    () =>
      normalizeShellSpaceOrder(
        Array.isArray(spaceOrder) && spaceOrder.length > 0 ? spaceOrder : DEFAULT_SHELL_SPACE_ORDER,
        { mediaHubEnabled }
      ),
    [spaceOrder, mediaHubEnabled]
  );
  const activeSpaceIndex = useMemo(() => {
    const i = resolvedSpaceOrder.indexOf(activeSpaceId);
    return i >= 0 ? i : 0;
  }, [resolvedSpaceOrder, activeSpaceId]);
  const spaceWorldTrackRef = useRef(null);
  const lastSpaceSwitchAtRef = useRef(Date.now());
  const prevActiveSpaceIdRef = useRef(null);
  const [spaceSwitchSeq, setSpaceSwitchSeq] = useState(0);
  const [spaceWorldDurationMs, setSpaceWorldDurationMs] = useState(SPACE_SHELL_TRANSITION_MS_DEFAULT);
  useLayoutEffect(() => {
    if (prevActiveSpaceIdRef.current === null) {
      prevActiveSpaceIdRef.current = activeSpaceId;
      return;
    }
    if (prevActiveSpaceIdRef.current === activeSpaceId) return;
    prevActiveSpaceIdRef.current = activeSpaceId;
    const now = Date.now();
    const elapsed = now - lastSpaceSwitchAtRef.current;
    lastSpaceSwitchAtRef.current = now;
    const nextDurationMs =
      elapsed > 0 && elapsed < SPACE_SHELL_RAPID_WINDOW_MS
        ? SPACE_SHELL_TRANSITION_MS_RAPID
        : SPACE_SHELL_TRANSITION_MS_DEFAULT;
    setSpaceWorldDurationMs(nextDurationMs);
    setSpaceSwitchSeq((s) => s + 1);
  }, [activeSpaceId]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--space-shell-transition-ms', `${spaceWorldDurationMs}ms`);
    root.style.setProperty('--space-shell-ease', SPACE_SHELL_EASE_CSS);
  }, [spaceWorldDurationMs]);

  useEffect(() => {
    if (spaceSwitchSeq === 0) return undefined;
    const node = spaceWorldTrackRef.current;
    let settled = false;
    const settleTransition = () => {
      if (settled) return;
      settled = true;
      setSpacesState({ isTransitioning: false });
    };
    if (reducedMotion || spaceWorldDurationMs <= 0 || !node) {
      const raf = window.requestAnimationFrame(settleTransition);
      return () => window.cancelAnimationFrame(raf);
    }
    const onTrackTransitionEnd = (event) => {
      if (event.target !== node || event.propertyName !== 'transform') return;
      settleTransition();
    };
    node.addEventListener('transitionend', onTrackTransitionEnd);
    const t = window.setTimeout(settleTransition, spaceWorldDurationMs + 96);
    return () => {
      node.removeEventListener('transitionend', onTrackTransitionEnd);
      window.clearTimeout(t);
    };
  }, [spaceSwitchSeq, reducedMotion, spaceWorldDurationMs, setSpacesState]);

  const spaceWorldTrackStyle = useMemo(() => {
    const n = resolvedSpaceOrder.length || 1;
    const panelPct = 100 / n;
    const yPct = -(activeSpaceIndex * panelPct);
    return {
      transform: `translateY(${yPct}%)`,
      height: `${n * 100}%`,
      '--space-world-duration': `${spaceWorldDurationMs}ms`,
      '--space-world-panel-pct': `${panelPct}%`,
    };
  }, [activeSpaceIndex, resolvedSpaceOrder.length, spaceWorldDurationMs]);

  /** Dock + channel nav transitions stay in sync with the space-world slide (same duration ms). */
  const spaceChromeVars = useMemo(
    () => ({ '--space-chrome-duration': `${spaceWorldDurationMs}ms` }),
    [spaceWorldDurationMs]
  );

  const mountSpotifyChromeStack = useConsolidatedAppStore(
    useShallow((s) => {
      const sp = s.spotify;
      return (
        Boolean(sp.isConnected) ||
        Boolean(sp.accessToken || sp.refreshToken) ||
        sp.immersiveMode?.enabled === true ||
        sp.immersiveMode?.liveGradientWallpaper === true ||
        Boolean(s.ui.spotifyTakeoverActive) ||
        // Now Playing Color Match — ribbon/wallpaper overlays for desktop SMTC too
        Boolean(s.ui.spotifyMatchEnabled) ||
        Boolean(s.floatingWidgets?.spotify?.settings?.dynamicColors)
      );
    })
  );

  const [visitedSpaces, setVisitedSpaces] = useState(null);
  useEffect(() => {
    setVisitedSpaces((prev) => {
      if (prev?.has(activeSpaceId)) return prev;
      const next = new Set(prev ?? []);
      next.add(activeSpaceId);
      return next;
    });
  }, [activeSpaceId]);

  const shouldMountSpaceContent = useCallback(
    (spaceId) => {
      // Always mount the active space (critical for first visit / Arrange on Home from a Hub).
      if (spaceId === activeSpaceId) return true;
      if (visitedSpaces === null) return false;
      return visitedSpaces.has(spaceId);
    },
    [visitedSpaces, activeSpaceId]
  );

  const isGameHubSpace = activeSpaceId === 'gamehub';
  const isMediaHubSpace = activeSpaceId === 'mediahub';
  const isHubSpace = isGameHubSpace || isMediaHubSpace;
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const enableDeferredMounts = appReady && hasUserInteracted;
  const adminPanelWidgetGate = useFloatingWidgetMountGate(floatingWidgets.adminPanel.visible);
  const performanceMonitorGate = useFloatingWidgetMountGate(floatingWidgets.performanceMonitor.visible);
  const settingsPrefetchPromiseRef = useRef(null);
  const [settingsActionMenuMounted, setSettingsActionMenuMounted] = useState(false);
  const prefetchSettingsUI = useCallback(() => {
    if (!settingsPrefetchPromiseRef.current) {
      settingsPrefetchPromiseRef.current = weeMeasureAsync('settings-bundle-prefetch', () =>
        prefetchSettingsModules()
      ).catch(() => null);
    }
    return settingsPrefetchPromiseRef.current;
  }, []);
  
  // Ref to access SettingsActionMenu's handleClose method
  const settingsActionMenuRef = useRef(null);
  
  // Define closeSettingsActionMenu function
  const closeSettingsActionMenu = useCallback(() => {
    setUIState({ showSettingsActionMenu: false });
  }, [setUIState]);

  // Handle settings action menu positioning
  const handleSettingsActionMenuOpen = useCallback(() => {
    prefetchSettingsUI();
    setSettingsActionMenuMounted(true);
    // Use modal-style centering - no need to calculate position manually
    setSettingsMenuPosition({ x: 0, y: 0 }); // Will be centered by CSS
    setUIState({ showSettingsActionMenu: true });
  }, [prefetchSettingsUI, setUIState]);

  useEffect(() => {
    if (showSettingsActionMenu && !settingsActionMenuMounted) {
      setSettingsActionMenuMounted(true);
    }
  }, [showSettingsActionMenu, settingsActionMenuMounted]);

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
  useWallpaperAmbientColor();
  usePrimaryAccentThemeEffect({
    wallpaperMatchEnabled,
    ambientPalette,
    spotifyMatchEnabled,
    spotifyColors: spotifyExtractedColors,
    dynamicRibbonColorEnabled,
    ribbonGlowColor,
    isDarkMode,
  });

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

  useAppInitialization();
  useNowPlayingSources();
  const { closeUpdateModal } = useAppUpdater({ enableStartupPopup: true });

  useFullscreenEffect({ appReady, startInFullscreen });

  useEffect(() => {
    if (!appReady) return;
    const { appLibraryManager: mgr } = useConsolidatedAppStore.getState();
    mgr?.scheduleAppLibraryBackgroundPrefetch?.();
    const state = useConsolidatedAppStore.getState();
    const { high, normal } = collectPrioritizedWarmMediaUrls(state);
    if (high.length > 0) {
      scheduleMediaWarmPass({ urls: high, max: 24, chunkSize: 6, tier: 'high' });
    }
    if (normal.length > 0) {
      scheduleMediaWarmPass({ urls: normal, max: 40, chunkSize: 6, tier: 'normal' });
    }
  }, [appReady]);

  useEffect(() => {
    if (!appReady || hasUserInteracted || typeof window === 'undefined') return undefined;
    const markInteracted = () => setHasUserInteracted(true);
    window.addEventListener('pointerdown', markInteracted, { passive: true, once: true });
    window.addEventListener('keydown', markInteracted, { once: true });
    const idleFallback = window.setTimeout(() => setHasUserInteracted(true), 3500);
    return () => {
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
      window.clearTimeout(idleFallback);
    };
  }, [appReady, hasUserInteracted]);

  useEffect(() => {
    if (!enableDeferredMounts || typeof window === 'undefined') return undefined;
    const run = () => {
      prefetchSettingsUI();
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(run, 700);
    return () => window.clearTimeout(timer);
  }, [enableDeferredMounts, prefetchSettingsUI]);

  // Optimized handlers using consolidated store with useCallback
  const openSettingsModal = useCallback(() => {
    prefetchSettingsUI();
    setUIState({ showSettingsModal: true });
  }, [prefetchSettingsUI, setUIState]);
  const closeSettingsModal = useCallback(() => setUIState({ showSettingsModal: false }), [setUIState]);




  // Global right-click handler for settings modal (wallpaper tab)
  const handleGlobalRightClick = useCallback((event) => {
    const target = event.target;
    const isInRibbon = target.closest('.interactive-footer') || target.closest('.wii-dock-wrapper');
    const isInDock = target.closest('.dock-container');
    const isInModal = target.closest('.modal-overlay') || target.closest('.modal-content');
    const isInGameHub = isHubSpace || target.closest('.aura-hub-space') || target.closest('.media-hub-space');

    // Check if Ctrl key is held for DevTools
    if (event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
      console.log('[DEBUG] 🔧 Ctrl+Right-click detected - opening DevTools');
      openDevTools();
      return;
    }

    // Game Hub uses Radix context menus; do not open wallpaper settings from empty hub chrome
    if (isInGameHub) {
      return;
    }

    // Only open settings modal to wallpaper tab if not clicking on ribbon, dock, or existing modals
    if (!isInRibbon && !isInDock && !isInModal) {
      event.preventDefault();
      event.stopPropagation();
      prefetchSettingsUI();
      // Open settings modal and set active tab to wallpaper
      setUIState({ 
        showSettingsModal: true,
        settingsActiveTab: 'wallpaper' // This will be handled by SettingsModal
      });
    }
  }, [prefetchSettingsUI, setUIState, openDevTools, isHubSpace]);
  const toggleDarkMode = useCallback(() => setUIState(prev => ({ isDarkMode: !prev.isDarkMode })), [setUIState]);
  const toggleCustomCursor = useCallback(() => setUIState(prev => ({ useCustomCursor: !prev.useCustomCursor })), [setUIState]);
  const renderSpaceContent = useCallback((spaceId) => {
    if (spaceId === 'gamehub') {
      return <LazyGameHubSpace />;
    }
    if (spaceId === 'mediahub') {
      return mediaHubEnabled ? <LazyMediaHubSpace /> : null;
    }
    if (spaceId === 'workspaces') {
      return <LazyPaginatedChannels channelSpaceKey="workspaces" />;
    }
    return <LazyPaginatedChannels channelSpaceKey="home" />;
  }, [mediaHubEnabled]);

  // Debug wallpaper cycling isolation
  useEffect(() => {
    if (IS_DEV) {
      console.log('[DEBUG] 🖼️ === WALLPAPER CYCLING ISOLATION CHECK ===');
      console.log('[DEBUG] 🖼️ Wallpaper cycling is now completely isolated');
      console.log('[DEBUG] 🖼️ Channels should NOT be affected by cycling transitions');
    }
  }, []);

  useEffect(() => {
    if (showSettingsModal) {
      weeMarkSettingsModalVisible();
    }
  }, [showSettingsModal]);

  // Render splash screen only if not ready
  if (!appReady || isLoading) {
    return <SplashScreen fadingOut={splashFading} />;
  }

  // Validate required data
  if (!ribbonColor || !ribbonGlowColor) {
    console.warn('[App] Missing required ribbon configuration, using defaults');
  }

  const mainContentClassName = `main-content space-world space-world--${activeSpaceId}`;
  const shouldPlayStartupGooey =
    appReady && isAppActive && !lowPowerMode && !reducedMotion;

  return (
    <ErrorBoundary>
      <LaunchFeedbackProvider>
      <m.div
        className={`app-container ${useCustomCursor ? 'custom-cursor' : ''} ${isDarkMode ? 'dark-mode' : ''} ${lowPowerMode ? 'low-power-mode' : ''}`}
        onContextMenu={handleGlobalRightClick}
        initial={shouldPlayStartupGooey ? { opacity: 0, scale: 0.992, y: 10 } : false}
        animate={shouldPlayStartupGooey ? { opacity: 1, scale: 1, y: 0 } : undefined}
        transition={shouldPlayStartupGooey ? pillOpen : undefined}
      >
        {/* Isolated Wallpaper Background - Completely separate from main app */}
        <IsolatedWallpaperBackground shellTransitionMs={spaceWorldDurationMs} />

        {/* Wallpaper Overlay Effects */}
        <WallpaperOverlay
          effect={effect}
          enabled={enabled}
          intensity={intensity}
          speed={speed}
          wind={wind}
          gravity={gravity}
        />

        {/* Main Content — vertical world track (see hub-space-switch.html) */}
        <div className={mainContentClassName}>
          <Suspense fallback={<SpaceBootLoader />}>
            <div
              ref={spaceWorldTrackRef}
              className="space-world__track"
              style={spaceWorldTrackStyle}
            >
              {resolvedSpaceOrder.map((spaceId) => {
                const isActive = spaceId === activeSpaceId;
                const n = resolvedSpaceOrder.length || 1;
                const panelPct = 100 / n;
                return (
                  <section
                    key={spaceId}
                    className={`space-world__panel ${isActive ? 'space-world__panel--active' : ''}`}
                    aria-hidden={!isActive}
                    data-space-id={spaceId}
                    style={{ flex: `0 0 ${panelPct}%`, minHeight: 0 }}
                  >
                    <div className="space-world__panel-surface">
                      {shouldMountSpaceContent(spaceId) ? (
                        renderSpaceContent(spaceId)
                      ) : (
                        <div className="h-full min-h-0 w-full" aria-hidden />
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </Suspense>
        </div>

        <Suspense fallback={null}>
          {/* Full-screen overlay (see appSpaceChrome.css) so Wii side nav position:fixed resolves to a viewport-sized box under transform */}
          <div
            className={`channel-space-chrome__stack ${!isHubSpace ? 'channel-space-chrome__stack--active' : ''}`}
            style={spaceChromeVars}
            aria-hidden={isHubSpace}
          >
            <LazyPageNavigation position="bottom" showPageIndicator />
            <LazyHomePageIndicator />
            <LazyWiiSideNavigation />
          </div>
        </Suspense>

        <Suspense fallback={null}>
          <LazySpaceRail />
        </Suspense>

        {/* Dock: stacked layers crossfade — full ribbon vs Game Hub minimal (same duration as space-world). */}
        {showDock ? (
          <Suspense fallback={null}>
          <div className="dock-shell" style={spaceChromeVars}>
            <div
              className={`dock-space-layer dock-space-layer--channels ${!isHubSpace ? 'dock-space-layer--active' : ''}`}
              aria-hidden={isHubSpace}
            >
              <div className="dock-container">
                {classicMode ? (
                  <LazyClassicWiiDock
                    buttonConfigs={ribbonButtonConfigs}
                    presetsButtonConfig={presetsButtonConfig}
                    onSettingsClick={openSettingsModal}
                    onSettingsChange={(settings) => setRibbonState(settings)}
                    onButtonClick={() => {}}
                    onButtonContextMenu={() => {}}
                    onAccessoryButtonClick={handleSettingsActionMenuOpen}
                    onAccessoryButtonContextMenu={() => {}}
                    onDockContextMenu={() => {}}
                    showPresetsButton
                    timeColor={timeColor ?? DEFAULT_TIME_COLOR_HEX}
                    timeFont={timeFont ?? 'default'}
                    ribbonGlowColor={ribbonGlowColor}
                    accessoryButtonConfig={{}}
                  />
                ) : (
                  <LazyWiiRibbon
                    ribbonColor={ribbonColor}
                    ribbonGlowColor={ribbonGlowColor}
                    dynamicRibbonColorEnabled={dynamicRibbonColorEnabled}
                    ribbonGlowStrength={ribbonGlowStrength}
                    ribbonGlowStrengthHover={ribbonGlowStrengthHover}
                    ribbonDockOpacity={ribbonDockOpacity}
                    ribbonHoverAnimationEnabled={ribbonHoverAnimationEnabled ?? true}
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
                    enableTimePill={enableTimePill ?? true}
                    timePillBlur={timePillBlur ?? 8}
                    timePillOpacity={timePillOpacity ?? 0.05}
                    timeColor={timeColor ?? DEFAULT_TIME_COLOR_HEX}
                    timeFont={timeFont ?? 'default'}
                    shellTransitionMs={spaceWorldDurationMs}
                  />
                )}
              </div>
            </div>
            <div
              className={`dock-space-layer dock-space-layer--gamehub ${isHubSpace ? 'dock-space-layer--active' : ''}`}
              aria-hidden={!isHubSpace}
            >
              <div className="dock-container dock-container--gamehub-minimal">
                <GameHubMinimalDock
                  onSettingsClick={handleSettingsActionMenuOpen}
                  timeColor={timeColor ?? DEFAULT_TIME_COLOR_HEX}
                />
              </div>
            </div>
          </div>
          </Suspense>
        ) : null}

        {/* Floating Quick Access Buttons */}
        {!showDock && (
          <div className="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2">
            {/* Quick Settings Menu */}
            <div
              className="cursor-pointer p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
              onClick={handleSettingsActionMenuOpen}
              onMouseEnter={prefetchSettingsUI}
              onFocus={prefetchSettingsUI}
              title="Quick Settings (Escape key)"
            >
              ⚙️
            </div>
            {/* Wallpaper Quick Access */}
            <div
              className="cursor-pointer p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
              onClick={() => {
                prefetchSettingsUI();
                setUIState({ 
                  showSettingsModal: true,
                  settingsActiveTab: 'wallpaper'
                });
              }}
              onMouseEnter={prefetchSettingsUI}
              onFocus={prefetchSettingsUI}
              title="Wallpaper Settings"
            >
              🖼️
            </div>
            {/* Settings Quick Access */}
            <div
              className="cursor-pointer p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
              onClick={openSettingsModal}
              onMouseEnter={prefetchSettingsUI}
              onFocus={prefetchSettingsUI}
              title="Settings"
            >
              🔧
            </div>
            
            {/* Cycling Status Indicator */}
            {isCycling && (
              <div
                className="cursor-pointer p-3 bg-green-500/20 backdrop-blur-md rounded-full border border-green-400/30 hover:bg-green-500/30 transition-all duration-200 shadow-lg"
                onClick={cycleToNextWallpaper}
                title={`Cycling active (${cycleIntervalSeconds}s interval) - Click to cycle manually`}
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
            {IS_DEV && (
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
        {(showSettingsModal || enableDeferredMounts) ? (
          <Suspense fallback={null}>
            <LazySettingsModal
              isOpen={showSettingsModal}
              onClose={closeSettingsModal}
              initialActiveTab={settingsActiveTab}
            />
          </Suspense>
        ) : null}

        <Suspense fallback={null}>
          <LazyUpdateModal isOpen={Boolean(showUpdateModal)} onClose={closeUpdateModal} />
        </Suspense>

        <CommandPaletteMount />

        {/* Settings Action Menu - Keep mounted once visited so close animation always runs. */}
        <Suspense
          fallback={
            showSettingsActionMenu ? (
              <div className="pointer-events-none fixed inset-0 z-[100000] bg-[hsl(var(--wee-overlay-backdrop)/0.55)] backdrop-blur-[8px]" />
            ) : null
          }
        >
          {settingsActionMenuMounted && (
            <LazySettingsActionMenu
              ref={settingsActionMenuRef}
              isOpen={showSettingsActionMenu}
              onClose={closeSettingsActionMenu}
              position={settingsMenuPosition}
            />
          )}
        </Suspense>

        {mountSpotifyChromeStack && enableDeferredMounts ? (
          <Suspense fallback={null}>
            <LazySpotifyLiveGradientWallpaper />
            <LazySpotifyImmersiveOverlay />
            <LazySpotifyGradientOverlay />
            <SpotifyTakeoverController />
          </Suspense>
        ) : null}

        {/* Floating Widgets (Spotify + System Info archived — see widgets/_archived) */}
        <Suspense fallback={null}>
          {enableDeferredMounts && adminPanelWidgetGate.shouldMount ? (
            <LazyAdminPanelWidget
              isVisible={floatingWidgets.adminPanel.visible}
              onExitAnimationComplete={adminPanelWidgetGate.onExitAnimationComplete}
              onClose={() => {
                const { actions } = useConsolidatedAppStore.getState();
                actions.toggleAdminPanelWidget();
              }}
            />
          ) : null}

          {IS_DEV && enableDeferredMounts && performanceMonitorGate.shouldMount ? (
            <LazyPerformanceMonitor
              isVisible={floatingWidgets.performanceMonitor.visible}
              onClose={() => {
                const { actions } = useConsolidatedAppStore.getState();
                actions.togglePerformanceMonitorWidget();
              }}
            />
          ) : null}
        </Suspense>


      </m.div>
      </LaunchFeedbackProvider>
    </ErrorBoundary>
  );
}

export default App;
