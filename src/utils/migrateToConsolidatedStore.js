import useConsolidatedAppStore from './useConsolidatedAppStore';
import { CLASSIC_DOCK_DEFAULT_COLORS } from '../design/classicDockThemeDefaults.js';
import {
  DEFAULT_RIBBON_GLOW_HEX,
  DEFAULT_RIBBON_SURFACE_HEX,
  INPUT_COLOR_DEFAULT_HEX,
} from '../design/runtimeColorStrings.js';

// Migration utility to help transition from scattered useState to consolidated store
export const migrateToConsolidatedStore = (legacyState) => {
  const { actions } = useConsolidatedAppStore.getState();
  
  // Map legacy state to new consolidated structure
  const consolidatedState = {
    app: {
      isInitialized: legacyState.hasInitialized || false,
      isLoading: legacyState.isLoading || true,
      splashFading: legacyState.splashFading || false,
      appReady: legacyState.appReady || false,
      hasInitialized: legacyState.hasInitialized || false,
      isEditMode: legacyState.isEditMode || false,
      showDragRegion: legacyState.showDragRegion || false,
      showAdminMenu: legacyState.showAdminMenu || false,
      showCountdown: legacyState.showCountdown || false,
      isScreenshotInProgress: legacyState.isScreenshotInProgress || false,
      updateAvailable: legacyState.updateAvailable || false,
    },
    ui: {
      isDarkMode: legacyState.isDarkMode || false,
      useCustomCursor: legacyState.useCustomCursor || true,
      startInFullscreen: legacyState.startInFullscreen || true,
      showPresetsButton: legacyState.showPresetsButton || false,
      startOnBoot: legacyState.startOnBoot || false,
      settingsShortcut: legacyState.settingsShortcut || '',
      immersivePip: legacyState.immersivePip || false,
      showDock: legacyState.showDock || true,
      classicMode: legacyState.classicMode || false,
      channelOpacity: legacyState.channelOpacity || 1,
      lastChannelHoverTime: legacyState.lastChannelHoverTime || Date.now(),
    },
    ribbon: {
      glassWiiRibbon: legacyState.glassWiiRibbon || false,
      glassOpacity: legacyState.glassOpacity || 0.18,
      glassBlur: legacyState.glassBlur || 2.5,
      glassBorderOpacity: legacyState.glassBorderOpacity || 0.5,
      glassShineOpacity: legacyState.glassShineOpacity || 0.7,
      ribbonColor: legacyState.ribbonColor || DEFAULT_RIBBON_SURFACE_HEX,
      recentRibbonColors: legacyState.recentRibbonColors || [],
      ribbonGlowColor: legacyState.ribbonGlowColor || DEFAULT_RIBBON_GLOW_HEX,
      recentRibbonGlowColors: legacyState.recentRibbonGlowColors || [],
      ribbonGlowStrength: legacyState.ribbonGlowStrength || 16,
      ribbonGlowStrengthHover: legacyState.ribbonGlowStrengthHover || 20,
      ribbonDockOpacity: legacyState.ribbonDockOpacity || 1,
      ribbonButtonConfigs: legacyState.ribbonButtonConfigs || [],
      presetsButtonConfig: legacyState.presetsButtonConfig || {
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
      current: legacyState.wallpaper || null,
      next: legacyState.nextWallpaper || null,
      opacity: legacyState.wallpaperOpacity || 1,
      blur: legacyState.wallpaperBlur || 0,
      savedWallpapers: legacyState.savedWallpapers || [],
      likedWallpapers: legacyState.likedWallpapers || [],
      isTransitioning: legacyState.isTransitioning || false,
      slideDirection: legacyState.slideDirection || 'right',
      crossfadeProgress: legacyState.crossfadeProgress || 0,
      slideProgress: legacyState.slideProgress || 0,
      cycleWallpapers: legacyState.cycleWallpapers || false,
      cycleInterval: legacyState.cycleInterval || 30,
      cycleAnimation: legacyState.cycleAnimation || 'fade',
      crossfadeDuration: legacyState.crossfadeDuration || 1.2,
      crossfadeEasing: legacyState.crossfadeEasing || 'ease-out',
      slideRandomDirection: legacyState.slideRandomDirection || false,
      slideDuration: legacyState.slideDuration || 1.5,
      slideEasing: legacyState.slideEasing || 'ease-out',
    },
    overlay: {
      enabled: legacyState.overlayEnabled || false,
      effect: legacyState.overlayEffect || 'snow',
      intensity: legacyState.overlayIntensity || 50,
      speed: legacyState.overlaySpeed || 1,
      wind: legacyState.overlayWind || 0.02,
      gravity: legacyState.overlayGravity || 0.1,
    },
    time: {
      color: legacyState.timeColor || INPUT_COLOR_DEFAULT_HEX,
      recentColors: legacyState.recentTimeColors || [],
      enablePill: legacyState.enableTimePill ?? true,
      pillBlur: legacyState.timePillBlur || 8,
      pillOpacity: legacyState.timePillOpacity || 0.05,
      font: legacyState.timeFont || 'default',
    },
    channels: {
      autoFadeTimeout: legacyState.channelAutoFadeTimeout || 5,
      animation: legacyState.channelAnimation || null,
      adaptiveEmptyChannels: legacyState.adaptiveEmptyChannels || true,
      animatedOnHover: legacyState.animatedOnHover || false,
      idleAnimationEnabled: legacyState.idleAnimationEnabled || false,
      idleAnimationTypes: legacyState.idleAnimationTypes || ['pulse', 'bounce', 'glow'],
      idleAnimationInterval: legacyState.idleAnimationInterval || 8,
      kenBurnsEnabled: legacyState.kenBurnsEnabled || false,
      kenBurnsMode: legacyState.kenBurnsMode || 'hover',
      kenBurnsHoverScale: legacyState.kenBurnsHoverScale || 1.1,
      kenBurnsAutoplayScale: legacyState.kenBurnsAutoplayScale || 1.15,
      kenBurnsSlideshowScale: legacyState.kenBurnsSlideshowScale || 1.08,
      kenBurnsHoverDuration: legacyState.kenBurnsHoverDuration || 8000,
      kenBurnsAutoplayDuration: legacyState.kenBurnsAutoplayDuration || 12000,
      kenBurnsSlideshowDuration: legacyState.kenBurnsSlideshowDuration || 10000,
      kenBurnsCrossfadeDuration: legacyState.kenBurnsCrossfadeDuration || 1000,
      kenBurnsForGifs: legacyState.kenBurnsForGifs || false,
      kenBurnsForVideos: legacyState.kenBurnsForVideos || false,
      kenBurnsEasing: legacyState.kenBurnsEasing || 'ease-out',
      kenBurnsAnimationType: legacyState.kenBurnsAnimationType || 'both',
      kenBurnsCrossfadeReturn: legacyState.kenBurnsCrossfadeReturn || true,
      kenBurnsTransitionType: legacyState.kenBurnsTransitionType || 'cross-dissolve',
    },
    dock: {
      settings: legacyState.dockSettings || {
        ...CLASSIC_DOCK_DEFAULT_COLORS,
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
      showSettingsModal: legacyState.showClassicDockSettingsModal || false,
    },
    particles: legacyState.particleSettings || {
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
      settings: legacyState.soundSettings || null,
      backgroundAudio: legacyState.backgroundAudio || null,
      lastMusicId: legacyState.lastMusicIdRef?.current || null,
      lastMusicUrl: legacyState.lastMusicUrlRef?.current || null,
      lastMusicEnabled: legacyState.lastMusicEnabledRef?.current || false,
      lastBgmEnabled: legacyState.lastBgmEnabledRef?.current || true,
      lastPlaylistMode: legacyState.lastPlaylistModeRef?.current || false,
    },
    presets: legacyState.presets || [],
  };

  // Apply the consolidated state
  actions.updateState(consolidatedState);
  
  return consolidatedState;
};

// Hook to use the migration utility
export const useMigrationToConsolidatedStore = () => {
  const { actions } = useConsolidatedAppStore();
  
  const migrate = (legacyState) => {
    return migrateToConsolidatedStore(legacyState);
  };
  
  return { migrate };
};

// Utility to extract legacy state from App.jsx useState variables
export const extractLegacyState = (useStateVariables) => {
  const legacyState = {};
  
  // Map useState variables to legacy state object
  Object.entries(useStateVariables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      legacyState[key] = value;
    }
  });
  
  return legacyState;
};


