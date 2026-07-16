import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, Suspense } from 'react';
import { m } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';

// Lazy load modals
const LazyPrimaryActionsModal = React.lazy(() => import('../modals/PrimaryActionsModal'));
// Update modal is hosted from App.jsx (startup popup + Escape menu).

import WiiStyleButton from './WiiStyleButton';
import DockParticleSystem from './DockParticleSystem';
import RibbonChrome from './ribbon/RibbonChrome';
import RibbonChromeEffects from './ribbon/RibbonChromeEffects';
import RibbonAccessories from './ribbon/RibbonAccessories';
import './WiiRibbon.css';
import intervalManager from '../../utils/IntervalManager';
import { useUIState } from '../../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { playChannelClick } from '../../utils/soundPlayback';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import { hexAlpha } from '../../utils/colorHex';
import { extractColorsFromAlbumArt } from '../../utils/extractColorsFromAlbumArt';
import { loadUnifiedSettingsSnapshot, saveUnifiedSettingsSnapshot } from '../../utils/electronApi';
import { logError } from '../../utils/logger';
import { getTintedIconUrl, parseColorToRgb } from '../../utils/iconTinting';
import isEqual from 'fast-deep-equal';
import { CSS_COLOR_PURE_WHITE, CSS_WII_BLUE } from '../../design/runtimeColorStrings.js';
import { useWeeMotion, getWeeDockBarEntrance } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { toDockParticleProps } from '../../utils/dockParticleSettings';
import { openSettingsToDockSubtab } from '../../utils/settingsNavigation';
import { useRibbonChromeIdleGate } from '../../hooks/useRibbonChromeIdleGate';
import {
  useRibbonLookTransition,
  RIBBON_PAGE_TRANSITION_MS,
  RIBBON_SPACE_TRANSITION_MS,
} from '../../hooks/useRibbonLookTransition';
import { resolveRibbonPaintTarget } from '../../utils/appearance/resolveEffectiveRibbonLook';
import {
  resolveActiveBoardCurrentPage,
} from '../../utils/channelSpaces';
import { wallpaperEntryUrlKey } from '../../utils/wallpaperShape';
import { resolveDisplayWallpaperUrl } from '../../utils/theme/resolveEffectiveAccent';
import { peekWallpaperAmbientPalette } from '../../utils/theme/wallpaperAmbientPaletteCache';
// import more icons as needed

const WiiRibbonComponent = ({
  onSettingsClick,
  onPresetsClick,
  onSettingsChange,
  onToggleDarkMode: _onToggleDarkMode,
  onToggleCursor: _onToggleCursor,
  useCustomCursor: _useCustomCursor,
  glassWiiRibbon,
  onGlassWiiRibbonChange: _onGlassWiiRibbonChange,
  animatedOnHover: _animatedOnHover,
  setAnimatedOnHover: _setAnimatedOnHover,
  enableTimePill,
  timePillBlur,
  timePillOpacity,
  ribbonColor: propRibbonColor,
  onRibbonColorChange: _onRibbonColorChange,
  recentRibbonColors: _recentRibbonColors,
  onRecentRibbonColorChange: _onRecentRibbonColorChange,
  ribbonGlowColor: propRibbonGlowColor,
  dynamicRibbonColorEnabled = false,
  onRibbonGlowColorChange: _onRibbonGlowColorChange,
  recentRibbonGlowColors: _recentRibbonGlowColors,
  onRecentRibbonGlowColorChange: _onRecentRibbonGlowColorChange,
  ribbonGlowStrength: propRibbonGlowStrength,
  ribbonGlowStrengthHover: propRibbonGlowStrengthHover,
  ribbonDockOpacity: propRibbonDockOpacity,
  onRibbonDockOpacityChange: _onRibbonDockOpacityChange,
  timeColor,
  timeFont,
  presetsButtonConfig,
  showPresetsButton,
  glassOpacity: propGlassOpacity,
  glassBlur: propGlassBlur,
  glassBorderOpacity: propGlassBorderOpacity,
  glassShineOpacity: propGlassShineOpacity,
  ribbonHoverAnimationEnabled = true,
  particleSettings = {},
  onParticleSettingsChange: _onParticleSettingsChange,
  /** Live shell duration from App (includes rapid multi-hop shortening). */
  shellTransitionMs = RIBBON_SPACE_TRANSITION_MS,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { showLaunchError, beginLaunchFeedback, endLaunchFeedback } = useLaunchFeedback();
  
  // Spotify — one shallow subscription; use track *name* primitive so progress/metadata churn does not re-render the ribbon.
  const { spotifyExtractedColors, spotifyAlbumArtUrl, spotifyTrackName, spotifyMatchEnabled } =
    useConsolidatedAppStore(
      useShallow((state) => {
        const track = state.spotify.currentTrack;
        return {
          spotifyExtractedColors: state.spotify.extractedColors,
          spotifyAlbumArtUrl: track?.album?.images?.[0]?.url ?? null,
          spotifyTrackName: track?.name ?? null,
          spotifyMatchEnabled: state.ui.spotifyMatchEnabled,
        };
      })
    );
  const [spotifyColors, setSpotifyColors] = useState(null);
  const shouldUseDynamicRibbonColor = dynamicRibbonColorEnabled && spotifyMatchEnabled;

  const {
    activeSpaceId,
    appearanceBySpace,
    channels,
    wallpaperMatchEnabled,
    wallpaperCurrent,
    ambientCachedForUrl,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      activeSpaceId: state.spaces.activeSpaceId,
      appearanceBySpace: state.appearanceBySpace,
      channels: state.channels,
      wallpaperMatchEnabled: state.ui.wallpaperMatchEnabled !== false,
      wallpaperCurrent: state.wallpaper?.current,
      // Re-render when ambient cache/active URL updates so paint target can peek LRU.
      ambientCachedForUrl: state.ui.ambientColor?.cachedForUrl ?? null,
    }))
  );
  const boardCurrentPage = resolveActiveBoardCurrentPage({ activeSpaceId, channels });
  const supportsPerPageRibbon = activeSpaceId === 'home' || activeSpaceId === 'workspaces';
  const spaceRibbon = appearanceBySpace?.[activeSpaceId]?.ribbon || null;
  const pageWallpaperUrl = useMemo(
    () =>
      resolveDisplayWallpaperUrl({
        activeSpaceId,
        wallpaperCurrent,
        appearanceBySpace,
        wallpaperEntryUrlKey,
        currentPage: boardCurrentPage,
      }),
    [activeSpaceId, wallpaperCurrent, appearanceBySpace, boardCurrentPage]
  );
  const liveRibbonLook = useMemo(
    () => ({
      ribbonColor: propRibbonColor,
      ribbonGlowColor: propRibbonGlowColor,
      ribbonGlowStrength: propRibbonGlowStrength,
      ribbonDockOpacity: propRibbonDockOpacity,
      glassWiiRibbon,
      glassOpacity: propGlassOpacity,
      glassBlur: propGlassBlur,
      glassBorderOpacity: propGlassBorderOpacity,
      glassShineOpacity: propGlassShineOpacity,
    }),
    [
      propRibbonColor,
      propRibbonGlowColor,
      propRibbonGlowStrength,
      propRibbonDockOpacity,
      glassWiiRibbon,
      propGlassOpacity,
      propGlassBlur,
      propGlassBorderOpacity,
      propGlassShineOpacity,
    ]
  );
  const targetRibbonLook = useMemo(() => {
    // Touch LRU so paint stays in sync after ambient extract fills the cache.
    if (wallpaperMatchEnabled && pageWallpaperUrl) {
      peekWallpaperAmbientPalette(pageWallpaperUrl);
    }
    return resolveRibbonPaintTarget({
      liveRibbon: liveRibbonLook,
      spaceRibbon,
      currentPage: boardCurrentPage,
      supportsPerPage: supportsPerPageRibbon,
      wallpaperMatchEnabled,
      wallpaperUrl: pageWallpaperUrl,
    });
  }, [
    liveRibbonLook,
    spaceRibbon,
    boardCurrentPage,
    supportsPerPageRibbon,
    wallpaperMatchEnabled,
    pageWallpaperUrl,
    ambientCachedForUrl,
  ]);
  const lastSpaceForRibbonRef = React.useRef(activeSpaceId);
  const spaceTweenMs =
    typeof shellTransitionMs === 'number' && shellTransitionMs > 0
      ? shellTransitionMs
      : RIBBON_SPACE_TRANSITION_MS;
  const ribbonTweenMs =
    lastSpaceForRibbonRef.current !== activeSpaceId
      ? spaceTweenMs
      : RIBBON_PAGE_TRANSITION_MS;
  React.useEffect(() => {
    lastSpaceForRibbonRef.current = activeSpaceId;
  }, [activeSpaceId]);

  const paintedRibbonLook = useRibbonLookTransition({
    targetLook: targetRibbonLook,
    durationMs: ribbonTweenMs,
    // Spotify owns live colors — wallpaper match uses the tween path instead.
    ambientOverride: shouldUseDynamicRibbonColor,
  });

  const ribbonColor =
    paintedRibbonLook.ribbonColor != null ? paintedRibbonLook.ribbonColor : propRibbonColor;
  const ribbonGlowColor =
    paintedRibbonLook.ribbonGlowColor != null
      ? paintedRibbonLook.ribbonGlowColor
      : propRibbonGlowColor;
  const ribbonGlowStrength =
    paintedRibbonLook.ribbonGlowStrength != null
      ? paintedRibbonLook.ribbonGlowStrength
      : propRibbonGlowStrength;
  const ribbonDockOpacity =
    paintedRibbonLook.ribbonDockOpacity != null
      ? paintedRibbonLook.ribbonDockOpacity
      : propRibbonDockOpacity;
  const paintedGlassOpacity =
    paintedRibbonLook.glassOpacity != null ? paintedRibbonLook.glassOpacity : propGlassOpacity;
  const paintedGlassBlur =
    paintedRibbonLook.glassBlur != null ? paintedRibbonLook.glassBlur : propGlassBlur;
  const paintedGlassBorderOpacity =
    paintedRibbonLook.glassBorderOpacity != null
      ? paintedRibbonLook.glassBorderOpacity
      : propGlassBorderOpacity;
  const paintedGlassShineOpacity =
    paintedRibbonLook.glassShineOpacity != null
      ? paintedRibbonLook.glassShineOpacity
      : propGlassShineOpacity;
  
  // Use consolidated store for modal states and UI settings
  const { setUIState } = useUIState();
  const {
    chromeEffect,
    chromeEffectIntensity,
    chromeEffectSpeed,
    chromeEffectIdleOnly,
    chromeEffectGlowStrength,
    chromeEffectNeonColorMode,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      chromeEffect: state.ribbon.chromeEffect ?? 'none',
      chromeEffectIntensity: state.ribbon.chromeEffectIntensity ?? 0.55,
      chromeEffectSpeed: state.ribbon.chromeEffectSpeed ?? 1,
      chromeEffectIdleOnly: state.ribbon.chromeEffectIdleOnly ?? false,
      chromeEffectGlowStrength: state.ribbon.chromeEffectGlowStrength ?? 0.6,
      chromeEffectNeonColorMode: state.ribbon.chromeEffectNeonColorMode ?? 'mono',
    }))
  );
  const [buttonConfigs, setButtonConfigs] = useState([
    { type: 'text', text: 'Wii', useAdaptiveColor: false, useGlowEffect: false, glowStrength: 20, useGlassEffect: false, glassOpacity: 0.18, glassBlur: 2.5, glassBorderOpacity: 0.5, glassShineOpacity: 0.7 }, 
    { type: 'text', text: 'Mail', useAdaptiveColor: false, useGlowEffect: false, glowStrength: 20, useGlassEffect: false, glassOpacity: 0.18, glassBlur: 2.5, glassBorderOpacity: 0.5, glassShineOpacity: 0.7 }
  ]);
  const [activeButtonIndex, setActiveButtonIndex] = useState(null);
  const [showPrimaryActionsModal, setShowPrimaryActionsModal] = useState(false);
  const [showPresetsButtonModal, setShowPresetsButtonModal] = useState(false);
  /** Keep WeeModalShell mounted through close animation (see Channel.jsx + onExitAnimationComplete). */
  const [primaryActionsModalMounted, setPrimaryActionsModalMounted] = useState(false);
  const [presetsButtonModalMounted, setPresetsButtonModalMounted] = useState(false);
  const [isRibbonHovered, setIsRibbonHovered] = useState(false);
  const chromeIdleReady = useRibbonChromeIdleGate(chromeEffectIdleOnly, isRibbonHovered);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [tintedImages, setTintedImages] = useState({});
  const [activeButton, setActiveButton] = useState(null);

  const { pillOpen, reducedMotion } = useWeeMotion();
  const dockBarEntrance = useMemo(
    () => getWeeDockBarEntrance(reducedMotion, pillOpen),
    [reducedMotion, pillOpen]
  );

  // Launch cinematic: dock yields while a channel launch settles (cinematic mode only).
  const { launchFeedbackMode } = useMotionFeedback();
  const launchCinematicActive = useConsolidatedAppStore(
    (state) => Boolean(state.ui.launchCinematic?.channelId)
  );
  const dockLaunchYield = launchFeedbackMode === 'cinematic' && launchCinematicActive;

  useLayoutEffect(() => {
    if (showPrimaryActionsModal) setPrimaryActionsModalMounted(true);
  }, [showPrimaryActionsModal]);

  useLayoutEffect(() => {
    if (showPresetsButtonModal) setPresetsButtonModalMounted(true);
  }, [showPresetsButtonModal]);

  // Mirror album-art colors into local paint state only when dynamic ribbon color is enabled.
  useEffect(() => {
    if (shouldUseDynamicRibbonColor && spotifyExtractedColors) {
      setSpotifyColors(spotifyExtractedColors);
    } else if (!shouldUseDynamicRibbonColor) {
      setSpotifyColors(null);
    } else if (
      shouldUseDynamicRibbonColor &&
      !spotifyExtractedColors &&
      spotifyAlbumArtUrl
    ) {
      extractColorsFromAlbumArt(spotifyAlbumArtUrl).then((result) => {
        if (result) setSpotifyColors(result.colors);
      });
    } else {
      setSpotifyColors(null);
    }
  }, [spotifyAlbumArtUrl, spotifyExtractedColors, shouldUseDynamicRibbonColor]);

  // Load configs from consolidated store on mount and subscribe to changes
  useEffect(() => {
    // Get button configs from consolidated store
    const storeButtonConfigs = useConsolidatedAppStore.getState().ribbon.ribbonButtonConfigs;
    
    if (storeButtonConfigs && storeButtonConfigs.length > 0) {
      // Ensure each button config has all required properties
      const configsWithAdaptiveColor = storeButtonConfigs.map(config => ({
        ...config,
        useAdaptiveColor: config.useAdaptiveColor ?? false,
        useGlowEffect: config.useGlowEffect ?? false,
        glowStrength: config.glowStrength ?? 20,
        useGlassEffect: config.useGlassEffect ?? false,
        glassOpacity: config.glassOpacity ?? 0.18,
        glassBlur: config.glassBlur ?? 2.5,
        glassBorderOpacity: config.glassBorderOpacity ?? 0.5,
        glassShineOpacity: config.glassShineOpacity ?? 0.7
      }));
      setButtonConfigs(configsWithAdaptiveColor);
    } else {
      // Fallback to unified settings snapshot if no configs in store
      async function loadButtonConfigs() {
        try {
          const settings = await loadUnifiedSettingsSnapshot();
          const persistedConfigs = settings?.ribbon?.ribbonButtonConfigs;
          if (persistedConfigs) {
              
              // Ensure each button config has all required properties
              const configsWithAdaptiveColor = persistedConfigs.map(config => ({
                ...config,
                useAdaptiveColor: config.useAdaptiveColor ?? false,
                useGlowEffect: config.useGlowEffect ?? false,
                glowStrength: config.glowStrength ?? 20,
                useGlassEffect: config.useGlassEffect ?? false,
                glassOpacity: config.glassOpacity ?? 0.18,
                glassBlur: config.glassBlur ?? 2.5,
                glassBorderOpacity: config.glassBorderOpacity ?? 0.5,
                glassShineOpacity: config.glassShineOpacity ?? 0.7
              }));
              setButtonConfigs(configsWithAdaptiveColor);
              
              // Also save to consolidated store for future use
              useConsolidatedAppStore.getState().actions.setRibbonState({
                ribbonButtonConfigs: configsWithAdaptiveColor
              });
          }
        } catch (error) {
          logError('WiiRibbon', 'Failed to load button configs', error);
        }
      }
      loadButtonConfigs();
    }
    
    // Subscribe to changes in the consolidated store
    const unsubscribe = useConsolidatedAppStore.subscribe(
      (state) => state.ribbon.ribbonButtonConfigs,
      (ribbonButtonConfigs) => {
        if (ribbonButtonConfigs && ribbonButtonConfigs.length > 0) {
          // Ensure each button config has all required properties
          const configsWithAdaptiveColor = ribbonButtonConfigs.map(config => ({
            ...config,
            useAdaptiveColor: config.useAdaptiveColor ?? false,
            useGlowEffect: config.useGlowEffect ?? false,
            glowStrength: config.glowStrength ?? 20,
            useGlassEffect: config.useGlassEffect ?? false,
            glassOpacity: config.glassOpacity ?? 0.18,
            glassBlur: config.glassBlur ?? 2.5,
            glassBorderOpacity: config.glassBorderOpacity ?? 0.5,
            glassShineOpacity: config.glassShineOpacity ?? 0.7
          }));
          setButtonConfigs(configsWithAdaptiveColor);
        }
      }
    );
    
    return unsubscribe;
  }, []);

  // Save configs to consolidated store and unified settings snapshot.
  const saveButtonConfigs = useCallback(async (configs) => {
    setButtonConfigs(configs);

    useConsolidatedAppStore.getState().actions.setRibbonState({
      ribbonButtonConfigs: configs,
    });

    await saveUnifiedSettingsSnapshot({
      ribbon: { ribbonButtonConfigs: configs },
    });

    if (onSettingsChange) {
      onSettingsChange({ ribbonButtonConfigs: configs });
    }
  }, [onSettingsChange]);

  const handleButtonContextMenu = (index, e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to the footer
    setActiveButtonIndex(index);
    setShowPrimaryActionsModal(true);
  };

  const handleTimeContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Open settings modal with time tab active
    setUIState({ 
      showSettingsModal: true, 
      settingsActiveTab: 'time'
    });
  };

  const handleRibbonContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setUIState({ 
      showSettingsModal: true, 
      settingsActiveTab: 'dock',
      dockSubTab: 'wii-ribbon' // Specify which sub-tab to open
    });
  };

  const handleDockEffectsContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openSettingsToDockSubtab('animations');
  };

  const handlePrimaryActionsSave = useCallback(
    (newConfig) => {
      const newConfigs = [...(buttonConfigs || [])];
      newConfigs[activeButtonIndex] = newConfig;

      void saveButtonConfigs(newConfigs);
      setShowPrimaryActionsModal(false);
    },
    [activeButtonIndex, buttonConfigs, saveButtonConfigs]
  );

  const handlePrimaryActionsCancel = useCallback(() => {
    setShowPrimaryActionsModal(false);
  }, []);

  const handlePresetsButtonContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPresetsButtonModal(true);
  };

  const handlePresetsButtonSave = useCallback(
    (newConfig) => {
      setShowPresetsButtonModal(false);
      if (onSettingsChange) {
        onSettingsChange({ presetsButtonConfig: newConfig });
      }
    },
    [onSettingsChange]
  );

  const handlePresetsButtonCancel = useCallback(() => {
    setShowPresetsButtonModal(false);
  }, []);

  const handlePrimaryActionsExitComplete = useCallback(() => {
    setPrimaryActionsModalMounted(false);
  }, []);

  const handlePresetsButtonExitComplete = useCallback(() => {
    setPresetsButtonModalMounted(false);
  }, []);

  // Update time every second
  useEffect(() => {
    const taskId = intervalManager.addTask(() => {
      setCurrentTime(new Date());
    }, 1000, 'time-update');
    
    return () => intervalManager.removeTask(taskId);
  }, []);





  // Generate tinted images for buttons with adaptive color enabled
  useEffect(() => {
    // Only run if we have button configs loaded
    if (!buttonConfigs || buttonConfigs.length === 0) {
      return;
    }

    const generateTintedImages = async () => {
      // Determine which color to use for tinting: Spotify accent if available, otherwise ribbon glow color
      let colorToUse = ribbonGlowColor;
      
      if (shouldUseDynamicRibbonColor && spotifyColors?.accent) {
        colorToUse = spotifyColors.accent;
      }
      
      // Handle undefined color
      if (!colorToUse) {
        logError('WiiRibbon', 'No color available for tinting; skipped tinted image generation');
        return;
      }
      
      const rgbColor = parseColorToRgb(colorToUse);

      // Check all button configs for adaptive color and custom icons
      const allConfigs = [...(buttonConfigs || [])];
      if (presetsButtonConfig) {
        allConfigs.push(presetsButtonConfig);
      }
      
      // Create a Set of icons that need tinting to avoid duplicates
      const iconsToTint = new Set();
      for (const config of allConfigs) {
        // Tint icons if adaptive color is enabled OR if Spotify Match is enabled
        const shouldTintIcon = (config?.useAdaptiveColor || (shouldUseDynamicRibbonColor && spotifyColors?.accent)) && 
                              config?.icon && 
                              !config.icon.startsWith('data:') && 
                              !['palette', 'star', 'heart'].includes(config.icon);
        
        if (shouldTintIcon) {
          iconsToTint.add(config.icon);
        }
      }
      
      // Process each unique icon (memoized per url+color — see iconTinting.js)
      for (const iconUrl of iconsToTint) {
        try {
          const tintedUrl = await getTintedIconUrl(iconUrl, rgbColor);
          setTintedImages(prev => ({ ...prev, [iconUrl]: tintedUrl }));
        } catch (error) {
          logError('WiiRibbon', 'Error tinting image', error);
        }
      }
    };

    generateTintedImages();
  }, [propRibbonGlowColor, ribbonGlowColor, buttonConfigs, presetsButtonConfig, shouldUseDynamicRibbonColor, spotifyColors]);

  // Handle Escape key to close admin menu
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showAdminMenu) {
          // console.log('Escape key pressed, closing admin menu');
          setShowAdminMenu(false);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAdminMenu]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: '2-digit',
      day: '2-digit'
    }).replace(',', '');
  };

  // Helper function to get the appropriate image source for adaptive color
  const getImageSource = (originalUrl, useAdaptiveColor) => {
    // Use tinted image if adaptive color is enabled OR if Spotify Match is enabled
    const shouldUseTintedImage = (useAdaptiveColor || (shouldUseDynamicRibbonColor && spotifyColors?.accent)) && tintedImages[originalUrl];
    
    if (shouldUseTintedImage) {
      return tintedImages[originalUrl];
    }
    return originalUrl;
  };

  // Helper function to get icon filter based on settings
  const getIconFilter = (useWiiGrayFilter) => {
    if (useWiiGrayFilter) {
      return 'grayscale(100%) brightness(0.6) contrast(1.2)';
    }
    return 'none';
  };

  const handleSettingsClick = async (event) => {
    // Play click sound
    await playChannelClick();

    // Call the parent handler to open settings action menu
    if (onSettingsClick) {
      onSettingsClick(event);
    }
  };

  // Debug functions for Spotify Match - only error logging
  useEffect(() => {
    // Only expose error logging functions
    window.enableSpotifyMatch = async () => {
      try {
        setUIState({ spotifyMatchEnabled: true });
      } catch (error) {
        logError('WiiRibbon', 'Failed to enable Spotify Match', error);
      }
    };

    window.disableSpotifyMatch = async () => {
      try {
        setUIState({ spotifyMatchEnabled: false });
      } catch (error) {
        logError('WiiRibbon', 'Failed to disable Spotify Match', error);
      }
    };

    return () => {
      delete window.enableSpotifyMatch;
      delete window.disableSpotifyMatch;
    };
  }, [setUIState, spotifyMatchEnabled, spotifyAlbumArtUrl, spotifyColors]);

  const handleButtonClick = async (index) => {
    const config = buttonConfigs?.[index];
    
    // Play click sound for any dock button interaction
    await playChannelClick();
    
    // Handle admin mode for left button (index 0)
    if (index === 0 && config?.adminMode && config?.powerActions && config.powerActions.length > 0) {
      setShowAdminMenu(true);
      return;
    }
    
    // Handle regular button actions
    if (!config || !config.actionType || !config.action || config.actionType === 'none') {
      return;
    }
    
    if (window.api && window.api.launchApp) {
      const payloadByType = {
        exe: { type: 'exe', path: config.action, asAdmin: false },
        url: { type: 'url', path: config.action, asAdmin: false },
        steam: { type: 'steam', path: config.action, asAdmin: false },
        epic: { type: 'epic', path: config.action, asAdmin: false },
        microsoftstore: { type: 'microsoftstore', path: config.action, asAdmin: false },
      };
      const payload = payloadByType[config.actionType];
      if (payload) {
        const result = await launchWithFeedback({
          launch: () => window.api.launchApp(payload),
          beginLaunchFeedback,
          endLaunchFeedback,
          showLaunchError,
          label: `Launching ${config.text || config.actionType}`,
          launchType: payload.type,
          path: config.action,
          source: 'ribbon',
        });
        if (result && result.ok === false) {
          logError('WiiRibbon', 'Launch failed', result.error);
        }
      }
    } else {
      // Fallback: try window.open for URLs
      if (config.actionType === 'url') {
        window.open(config.action, '_blank');
      }
    }
  };

  const handleAdminActionClick = (action) => {
    if (window.api && window.api.executeCommand) {
      window.api.executeCommand(action.command);
    }
    setShowAdminMenu(false);
  };

  const ribbonGlowHex =
    (shouldUseDynamicRibbonColor ? spotifyColors?.accent : null) || ribbonGlowColor || CSS_WII_BLUE;
  const glowPx = ribbonHoverAnimationEnabled && isRibbonHovered
    ? (propRibbonGlowStrengthHover ?? 28)
    : (ribbonGlowStrength ?? 20);
  const ribbonGlowFilter = `drop-shadow(0 0 ${glowPx}px ${ribbonGlowHex}) drop-shadow(0 0 12px ${ribbonGlowHex})`;

  const pillBackdropBackground = (() => {
    if (spotifyColors?.secondary && shouldUseDynamicRibbonColor) {
      const match = spotifyColors.secondary.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const [, r, g, b] = match;
        return `rgba(${r}, ${g}, ${b}, ${timePillOpacity})`;
      }
      if (spotifyColors.secondary.startsWith('#')) {
        const r = parseInt(spotifyColors.secondary.slice(1, 3), 16);
        const g = parseInt(spotifyColors.secondary.slice(3, 5), 16);
        const b = parseInt(spotifyColors.secondary.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${timePillOpacity})`;
      }
    }
    if (wallpaperMatchEnabled) {
      return `hsl(var(--ambient-secondary) / ${timePillOpacity})`;
    }
    return `hsl(var(--color-pure-white) / ${timePillOpacity})`;
  })();

  const timeFontStack = timeFont === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif";

  const ribbonBtnFont = (textFont) =>
    textFont === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif";

  const ribbonAccentStyle = shouldUseDynamicRibbonColor && spotifyColors?.accent
    ? { ['--ribbon-accent-color']: spotifyColors.accent }
    : {};

  const timeLineColor = (() => {
    if (spotifyColors?.text && shouldUseDynamicRibbonColor) return spotifyColors.text;
    return timeColor;
  })();

  const dateLineColor = (() => {
    if (spotifyColors?.textSecondary && shouldUseDynamicRibbonColor) return spotifyColors.textSecondary;
    return timeColor;
  })();

  const particleProps = useMemo(
    () => toDockParticleProps(particleSettings),
    [particleSettings]
  );

  const ribbonFillColor =
    (shouldUseDynamicRibbonColor && spotifyColors?.primary
      ? spotifyColors.primary
      : ribbonColor) +
    (ribbonDockOpacity !== undefined ? hexAlpha(ribbonDockOpacity) : '');

  const chromeFxDurationSec = (2.4 / Math.min(2, Math.max(0.25, chromeEffectSpeed ?? 1))).toFixed(2);
  const pulseChromeActive =
    chromeEffect === 'pulse' && (!chromeEffectIdleOnly || chromeIdleReady);

  return (
    <>
      <m.footer
        {...dockBarEntrance}
        className={`interactive-footer ${ribbonHoverAnimationEnabled ? 'ribbon-hover-enabled' : ''}${
          pulseChromeActive ? ' ribbon-fx-pulse-active' : ''
        }${dockLaunchYield ? ' ribbon--launch-yield' : ''}`}
        style={{
          ['--ribbon-fx-duration']: `${chromeFxDurationSec}s`,
          ['--ribbon-fx-glow']: ribbonGlowHex,
        }}
        onContextMenu={handleRibbonContextMenu}
      >
        <DockParticleSystem
          {...particleProps}
          ribbonGlowColor={
            (shouldUseDynamicRibbonColor ? spotifyColors?.accent : null) || ribbonGlowColor || CSS_WII_BLUE
          }
        />
        <RibbonChrome
          glassWiiRibbon={glassWiiRibbon}
          glassBlur={paintedGlassBlur}
          glassShineOpacity={paintedGlassShineOpacity}
          glassOpacity={paintedGlassOpacity}
          glassBorderOpacity={paintedGlassBorderOpacity}
          fillColor={ribbonFillColor}
          ribbonGlowFilter={ribbonGlowFilter}
          hoverAnimationEnabled={ribbonHoverAnimationEnabled}
          onHoverChange={setIsRibbonHovered}
        />
        <RibbonChromeEffects
          effect={chromeEffect}
          intensity={chromeEffectIntensity}
          speed={chromeEffectSpeed}
          glowStrength={chromeEffectGlowStrength}
          neonColorMode={chromeEffectNeonColorMode}
          glowColor={ribbonGlowHex}
          hovered={isRibbonHovered}
          idleOnly={chromeEffectIdleOnly}
          glassWiiRibbon={glassWiiRibbon}
        />

        <RibbonAccessories>
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-[300px] z-20 text-center pointer-events-auto">
              {/* Spotify Match Indicator */}
              {shouldUseDynamicRibbonColor && spotifyTrackName && (
                <div 
                  className="spotify-match-indicator"
                  style={{
                    ['--spotify-match-text']: spotifyColors?.text || CSS_COLOR_PURE_WHITE,
                    ['--spotify-match-accent']: spotifyColors?.accent || CSS_WII_BLUE,
                  }}
                >
                  <span className="spotify-match-indicator__accent">🎵</span>
                  <span>{spotifyTrackName}</span>
                </div>
              )}
              
              {/* Apple Liquid Glass Pill Container */}
              {enableTimePill ? (
                <div 
                  className="liquid-glass liquid-glass-shell"
                  onContextMenu={handleTimeContextMenu}
                >
                  {/* ::before pseudo-element equivalent - subtle inner shadow */}
                  <div className="liquid-glass-inner-shadow" />
                  
                  {/* ::after pseudo-element equivalent - very subtle backdrop blur */}
                  <div 
                    className="liquid-glass-backdrop-layer"
                    style={{
                      ['--pill-blur']: `${timePillBlur}px`,
                      ['--pill-bg']: pillBackdropBackground,
                    }}
                  />
                  
                  {/* Time Display */}
                  <div 
                    className="glass-text ribbon-time-display-line relative z-[1] mb-3 text-[32px] font-bold opacity-100 translate-x-0 translate-y-0 ribbon-time-shadow"
                    style={{
                      ['--time-color']: timeLineColor,
                      ['--time-font']: timeFontStack,
                    }}
                  >
                      {formatTime(currentTime)}
                  </div>
                  {/* Date Display */}
                  <div 
                    className="glass-text ribbon-time-display-line relative z-[1] text-lg font-bold opacity-100 translate-x-0 translate-y-0 ribbon-time-shadow"
                    style={{
                      ['--time-color']: dateLineColor,
                      ['--time-font']: timeFontStack,
                    }}
                  >
                      {formatDate(currentTime)}
                  </div>
                </div>
              ) : (
                /* Simple time display without pill when disabled */
                <div 
                  onContextMenu={handleTimeContextMenu}
                  className="ribbon-time-simple-wrap"
                >
                  <div 
                    id="time" 
                    className="ribbon-time-display-line text-4xl font-bold mb-3 ribbon-time-shadow-lg" 
                    style={{ 
                      ['--time-font']: timeFontStack,
                      ['--time-color']: timeLineColor,
                    }}
                  >
                      {formatTime(currentTime)}
                  </div>
                  <div 
                    id="date" 
                    className="ribbon-time-display-line text-lg font-bold ribbon-time-shadow" 
                    style={{ 
                      ['--time-color']: dateLineColor,
                      ['--time-font']: timeFontStack,
                    }}
                  >
                      {formatDate(currentTime)}
                  </div>
                </div>
              )}
          </div>

          <div className="button-container left ribbon-btn-col-left">
              <div className="relative">
                  <WiiStyleButton
                onContextMenu={e => handleButtonContextMenu(0, e)}
                onClick={() => handleButtonClick(0)}
                onMouseDown={() => setActiveButton('left')}
                onMouseUp={() => setActiveButton(null)}
                onMouseLeave={() => setActiveButton(null)}
                useAdaptiveColor={buttonConfigs[0]?.useAdaptiveColor}
                useGlowEffect={buttonConfigs[0]?.useGlowEffect}
                glowStrength={buttonConfigs[0]?.glowStrength}
                useGlassEffect={buttonConfigs[0]?.useGlassEffect}
                glassOpacity={buttonConfigs[0]?.glassOpacity}
                glassBlur={buttonConfigs[0]?.glassBlur}
                glassBorderOpacity={buttonConfigs[0]?.glassBorderOpacity}
                glassShineOpacity={buttonConfigs[0]?.glassShineOpacity}
                ribbonGlowColor={ribbonGlowHex}
                spotifySecondaryColor={spotifyColors?.secondary || null}
                spotifyTextColor={shouldUseDynamicRibbonColor && spotifyColors?.text ? spotifyColors.text : null}
                spotifyAccentColor={shouldUseDynamicRibbonColor && spotifyColors?.accent ? spotifyColors.accent : null}
                className={activeButton === 'left' ? 'ribbon-wii-btn-press ml-4' : 'ribbon-wii-btn-idle ml-4'}
              >
                {buttonConfigs[0] && buttonConfigs[0].type === 'text' ? (
                  <span 
                    className={`ribbon-btn-label-text${buttonConfigs[0]?.textFont === 'digital' ? ' ribbon-btn-label-text--digital' : ''}`}
                    style={{
                      ['--ribbon-btn-font']: ribbonBtnFont(buttonConfigs[0].textFont),
                      ...ribbonAccentStyle,
                    }}
                  >
                    {buttonConfigs[0].text || 'Wii'}
                  </span>
                ) : buttonConfigs[0] && buttonConfigs[0].icon === 'palette' ? (
                  <svg className="palette-icon ribbon-primary-action-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={(shouldUseDynamicRibbonColor && spotifyColors?.accent) ? spotifyColors.accent : CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r="2.5"/>
                    <circle cx="17.5" cy="10.5" r="2.5"/>
                    <circle cx="8.5" cy="7.5" r="2.5"/>
                    <circle cx="6.5" cy="12.5" r="2.5"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                ) : buttonConfigs[0] && buttonConfigs[0].icon === 'star' ? (
                  <svg className="star-icon ribbon-primary-action-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={(shouldUseDynamicRibbonColor && spotifyColors?.accent) ? spotifyColors.accent : CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                ) : buttonConfigs[0] && buttonConfigs[0].icon === 'heart' ? (
                  <svg className="heart-icon ribbon-primary-action-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={(shouldUseDynamicRibbonColor && spotifyColors?.accent) ? spotifyColors.accent : CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                ) : buttonConfigs[0] && buttonConfigs[0].icon ? (
                  <img 
                    src={getImageSource(buttonConfigs[0].icon, buttonConfigs[0].useAdaptiveColor)} 
                    alt="icon" 
                    className="ribbon-icon-img ribbon-icon-img--primary-action"
                    style={{ ['--ribbon-icon-filter']: getIconFilter(buttonConfigs[0].useWiiGrayFilter) }} 
                  />
                ) : (
                  <span className="ribbon-btn-label-text" style={ribbonAccentStyle}>
                    Wii
                  </span>
                )}
              </WiiStyleButton>
              </div>
          </div>
          {/* Restore settings button to original absolute position with glass effect */}
          <div
            className="ribbon-settings-cog-host"
            style={{
              ...(shouldUseDynamicRibbonColor && spotifyColors?.text ? { ['--settings-icon-color']: spotifyColors.text } : {}),
            }}
            onClick={(e) => handleSettingsClick(e)}
            onContextMenu={handleDockEffectsContextMenu}
            title="Settings (Left-click for Quick Settings, Right-click for particle settings)"
          >
              <svg 
                width="28" 
                height="28" 
                viewBox="0 0 24 24" 
                className="text-wii-gray-dark"
              >
                <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
              </svg>
          </div>
          {/* Presets Button: slightly below and to the right of the time container */}
          {showPresetsButton && (
            <WiiStyleButton
              className={`sd-card-button presets-cog-button glass-effect presets-cog-button-pos ${activeButton === 'presets' ? 'ribbon-wii-btn-press' : 'ribbon-wii-btn-idle'}`}
              onClick={async () => {
                await playChannelClick();
                onPresetsClick();
              }}
              onContextMenu={handlePresetsButtonContextMenu}
              onMouseDown={() => setActiveButton('presets')}
              onMouseUp={() => setActiveButton(null)}
              onMouseLeave={() => setActiveButton(null)}
              title="Customize Looks (Right-click to customize button)"
              useAdaptiveColor={presetsButtonConfig?.useAdaptiveColor}
              useGlowEffect={presetsButtonConfig?.useGlowEffect}
              glowStrength={presetsButtonConfig?.glowStrength}
              useGlassEffect={presetsButtonConfig?.useGlassEffect}
              glassOpacity={presetsButtonConfig?.glassOpacity}
              glassBlur={presetsButtonConfig?.glassBlur}
              glassBorderOpacity={presetsButtonConfig?.glassBorderOpacity}
              glassShineOpacity={presetsButtonConfig?.glassShineOpacity}
              ribbonGlowColor={ribbonGlowHex}
              spotifySecondaryColor={spotifyColors?.secondary || null}
              spotifyTextColor={shouldUseDynamicRibbonColor && spotifyColors?.text ? spotifyColors.text : null}
            >
            {/* Dynamic icon based on configuration */}
            {presetsButtonConfig.type === 'text' ? (
              <span 
                className={`ribbon-btn-label-text${presetsButtonConfig?.textFont === 'digital' ? ' ribbon-btn-label-text--digital' : ''}`}
                style={{
                  ['--ribbon-btn-font']: ribbonBtnFont(presetsButtonConfig.textFont),
                  ...ribbonAccentStyle,
                }}
              >
                {presetsButtonConfig.text || '🎨'}
              </span>

            ) : presetsButtonConfig.icon === 'palette' ? (
              <svg className="palette-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={(shouldUseDynamicRibbonColor && spotifyColors?.accent) ? spotifyColors.accent : CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5"/>
                <circle cx="17.5" cy="10.5" r="2.5"/>
                <circle cx="8.5" cy="7.5" r="2.5"/>
                <circle cx="6.5" cy="12.5" r="2.5"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
              </svg>
            ) : presetsButtonConfig.icon === 'star' ? (
              <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={(shouldUseDynamicRibbonColor && spotifyColors?.accent) ? spotifyColors.accent : CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
            ) : presetsButtonConfig.icon === 'heart' ? (
              <svg className="heart-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={(shouldUseDynamicRibbonColor && spotifyColors?.accent) ? spotifyColors.accent : CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            ) : presetsButtonConfig.icon ? (
              <img 
                src={getImageSource(presetsButtonConfig.icon, presetsButtonConfig.useAdaptiveColor)} 
                alt="icon" 
                className="ribbon-icon-img-sm"
                style={{ ['--ribbon-icon-filter']: getIconFilter(presetsButtonConfig.useWiiGrayFilter) }} 
              />
            ) : (
              <span className="ribbon-preset-emoji-fallback" style={ribbonAccentStyle}>
                🎨
              </span>
            )}
            </WiiStyleButton>
          )}

          <div className="button-container right ribbon-btn-col-right">
              <div className="relative ml-4">
                  <WiiStyleButton
                    onContextMenu={e => handleButtonContextMenu(1, e)}
                    onClick={() => handleButtonClick(1)}
                    onMouseDown={() => setActiveButton('right')}
                    onMouseUp={() => setActiveButton(null)}
                    onMouseLeave={() => setActiveButton(null)}
                    useAdaptiveColor={buttonConfigs[1]?.useAdaptiveColor}
                    useGlowEffect={buttonConfigs[1]?.useGlowEffect}
                    glowStrength={buttonConfigs[1]?.glowStrength}
                    useGlassEffect={buttonConfigs[1]?.useGlassEffect}
                    glassOpacity={buttonConfigs[1]?.glassOpacity}
                    glassBlur={buttonConfigs[1]?.glassBlur}
                    glassBorderOpacity={buttonConfigs[1]?.glassBorderOpacity}
                    glassShineOpacity={buttonConfigs[1]?.glassShineOpacity}
                    ribbonGlowColor={ribbonGlowHex}
                    spotifySecondaryColor={spotifyColors?.secondary || null}
                    spotifyTextColor={shouldUseDynamicRibbonColor && spotifyColors?.text ? spotifyColors.text : null}
                    spotifyAccentColor={shouldUseDynamicRibbonColor && spotifyColors?.accent ? spotifyColors.accent : null}
                    className={activeButton === 'right' ? 'ribbon-wii-btn-press' : 'ribbon-wii-btn-idle'}
                  >
                      {buttonConfigs[1] && buttonConfigs[1].type === 'text' ? (
                        <span 
                          className={`ribbon-btn-label-text${buttonConfigs[1]?.textFont === 'digital' ? ' ribbon-btn-label-text--digital' : ''}`}
                          style={{
                            ['--ribbon-btn-font']: ribbonBtnFont(buttonConfigs[1].textFont),
                            ...ribbonAccentStyle,
                          }}
                        >
                          {buttonConfigs[1].text || ''}
                        </span>
                      ) : buttonConfigs[1] && buttonConfigs[1].icon === 'palette' ? (
                        <svg className="palette-icon ribbon-primary-action-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={(shouldUseDynamicRibbonColor && spotifyColors?.accent) ? spotifyColors.accent : CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="13.5" cy="6.5" r="2.5"/>
                          <circle cx="17.5" cy="10.5" r="2.5"/>
                          <circle cx="8.5" cy="7.5" r="2.5"/>
                          <circle cx="6.5" cy="12.5" r="2.5"/>
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                        </svg>
                      ) : buttonConfigs[1] && buttonConfigs[1].icon === 'star' ? (
                        <svg className="star-icon ribbon-primary-action-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={(shouldUseDynamicRibbonColor && spotifyColors?.accent) ? spotifyColors.accent : CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                      ) : buttonConfigs[1] && buttonConfigs[1].icon === 'heart' ? (
                        <svg className="heart-icon ribbon-primary-action-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={(shouldUseDynamicRibbonColor && spotifyColors?.accent) ? spotifyColors.accent : CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      ) : buttonConfigs[1] && buttonConfigs[1].icon ? (
                        <img 
                          src={getImageSource(buttonConfigs[1].icon, buttonConfigs[1].useAdaptiveColor)} 
                          alt="icon" 
                          className="ribbon-icon-img ribbon-icon-img--primary-action"
                          style={{ ['--ribbon-icon-filter']: getIconFilter(buttonConfigs[1].useWiiGrayFilter) }} 
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={(shouldUseDynamicRibbonColor && spotifyColors?.accent) ? spotifyColors.accent : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wii-gray-dark"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      )}
                  </WiiStyleButton>
              </div>
          </div>
        </RibbonAccessories>


              </m.footer>

        {/* Admin Menu */}
        {showAdminMenu && (
          <div className="admin-menu">
            <div
              className="context-menu-content ribbon-admin-panel"
            >
              <div className="settings-menu-group-label ribbon-admin-group-label">
                Admin Actions
              </div>
              {buttonConfigs[0]?.powerActions?.map((action) => (
                <div
                  key={action.id}
                  className="context-menu-item ribbon-admin-item"
                  onClick={() => handleAdminActionClick(action)}
                >
                  <span className="ribbon-admin-item-icon">{action.icon}</span>
                  <div>
                    <div className="ribbon-admin-item-title">{action.name}</div>
                    <div className="ribbon-admin-item-cmd">
                      {action.command}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Click outside to close admin menu */}
        {showAdminMenu && (
          <div 
            className="ribbon-admin-scrim"
            onClick={() => {
              setShowAdminMenu(false);
            }}
          />
        )}


      {primaryActionsModalMounted && (
        <Suspense fallback={<div>Loading Primary Actions Modal...</div>}>
          <LazyPrimaryActionsModal
            isOpen={showPrimaryActionsModal}
            onClose={handlePrimaryActionsCancel}
            onSave={handlePrimaryActionsSave}
            config={buttonConfigs?.[activeButtonIndex]}
            buttonIndex={activeButtonIndex}
            ribbonGlowColor={ribbonGlowColor}
            onExitAnimationComplete={handlePrimaryActionsExitComplete}
          />
        </Suspense>
      )}
      {presetsButtonModalMounted && (
        <Suspense fallback={<div>Loading Presets Button Modal...</div>}>
          <LazyPrimaryActionsModal
            isOpen={showPresetsButtonModal}
            onClose={handlePresetsButtonCancel}
            onSave={handlePresetsButtonSave}
            config={presetsButtonConfig}
            buttonIndex="presets"
            title="Customize Presets Button"
            ribbonGlowColor={ribbonGlowColor}
            onExitAnimationComplete={handlePresetsButtonExitComplete}
          />
        </Suspense>
      )}


    </>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.useCustomCursor === nextProps.useCustomCursor &&
    prevProps.glassWiiRibbon === nextProps.glassWiiRibbon &&
    prevProps.animatedOnHover === nextProps.animatedOnHover &&
    prevProps.enableTimePill === nextProps.enableTimePill &&
    prevProps.timePillBlur === nextProps.timePillBlur &&
    prevProps.timePillOpacity === nextProps.timePillOpacity &&
    prevProps.startInFullscreen === nextProps.startInFullscreen &&
    prevProps.ribbonColor === nextProps.ribbonColor &&
    prevProps.ribbonGlowColor === nextProps.ribbonGlowColor &&
    prevProps.dynamicRibbonColorEnabled === nextProps.dynamicRibbonColorEnabled &&
    prevProps.ribbonGlowStrength === nextProps.ribbonGlowStrength &&
    prevProps.ribbonGlowStrengthHover === nextProps.ribbonGlowStrengthHover &&
    prevProps.ribbonDockOpacity === nextProps.ribbonDockOpacity &&
    prevProps.timeColor === nextProps.timeColor &&
  
    prevProps.timeFont === nextProps.timeFont &&
    prevProps.showPresetsButton === nextProps.showPresetsButton &&
    prevProps.glassOpacity === nextProps.glassOpacity &&
    prevProps.glassBlur === nextProps.glassBlur &&
    prevProps.glassBorderOpacity === nextProps.glassBorderOpacity &&
    prevProps.glassShineOpacity === nextProps.glassShineOpacity &&
    prevProps.ribbonHoverAnimationEnabled === nextProps.ribbonHoverAnimationEnabled &&
    isEqual(prevProps.presetsButtonConfig, nextProps.presetsButtonConfig) &&
    isEqual(prevProps.particleSettings, nextProps.particleSettings)
  );
};

const WiiRibbon = React.memo(WiiRibbonComponent, arePropsEqual);

export default WiiRibbon; 
