import { create } from 'zustand';

const useAppearanceSettingsStore = create((set, get) => ({
  // Modal state
  isOpen: false,
  activeTab: 'channels', // 'channels', 'ribbon', 'wallpaper', 'time'
  
  // Tab states
  tabs: {
    channels: {
      adaptiveEmptyChannels: true,
      channelAnimation: 'none',
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
      channelAutoFadeTimeout: 5,
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
      ribbonGlowStrength: 20,
      ribbonGlowStrengthHover: 28,
      ribbonDockOpacity: 1,
    },
    wallpaper: {
      wallpapers: [],
      activeWallpaper: null,
      likedWallpapers: [],
      cycling: false,
      cycleInterval: 30,
      cycleAnimation: 'fade',
      slideDirection: 'right',
      crossfadeDuration: 1.2,
      crossfadeEasing: 'ease-out',
      slideRandomDirection: false,
      slideDuration: 1.5,
      slideEasing: 'ease-out',
      wallpaperOpacity: 1,
      wallpaperBlur: 0,
      overlayEnabled: false,
      overlayEffect: 'snow',
      overlayIntensity: 50,
      overlaySpeed: 1,
      overlayWind: 0.02,
      overlayGravity: 0.1,
    },
    time: {
      timeColor: '#ffffff',
      recentTimeColors: [],
      timeFormat24hr: true,
      enableTimePill: true,
      timePillBlur: 8,
      timePillOpacity: 0.05,
      timeFont: 'default',
    },
    general: {
      immersivePip: false,
      startInFullscreen: false,
      showPresetsButton: true,
      startOnBoot: false,
    },
    sounds: {
      backgroundMusicEnabled: true,
      backgroundMusicLooping: true,
      backgroundMusicPlaylistMode: false,
      channelClickEnabled: true,
      channelClickVolume: 0.5,
      channelHoverEnabled: true,
      channelHoverVolume: 0.5,
      startupEnabled: true,
      startupVolume: 0.5,
    },
    homescreen: {
      navigationMode: 'simple',
      gridColumns: 4,
      gridRows: 3,
      peekVisibility: 0.2,
      slideAnimation: 'slide',
      preloadAdjacentPages: true,
      lazyLoadChannels: false,
      enableChannelCaching: true,
    }
  },

  // Actions
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Update specific tab settings
  updateTabSettings: (tab, settings) => set((state) => ({
    tabs: {
      ...state.tabs,
      [tab]: {
        ...state.tabs[tab],
        ...settings
      }
    }
  })),

  // Load settings from existing modals
  loadSettings: (settings) => {
    const { channels, ribbon, wallpaper, time, general, sounds } = settings;
    set((state) => ({
      tabs: {
        channels: { ...state.tabs.channels, ...channels },
        ribbon: { ...state.tabs.ribbon, ...ribbon },
        wallpaper: { ...state.tabs.wallpaper, ...wallpaper },
        time: { ...state.tabs.time, ...time },
        general: { ...state.tabs.general, ...general },
        sounds: { ...state.tabs.sounds, ...sounds }
      }
    }));
  },

  // Get all settings for saving
  getAllSettings: () => {
    const state = get();
    return {
      channels: state.tabs.channels,
      ribbon: state.tabs.ribbon,
      wallpaper: state.tabs.wallpaper,
      time: state.tabs.time,
      general: state.tabs.general,
      sounds: state.tabs.sounds,
      homescreen: state.tabs.homescreen
    };
  },

  // Reset all settings to defaults
  resetAllSettings: () => set((state) => ({
    tabs: {
      channels: {
        adaptiveEmptyChannels: true,
        channelAnimation: 'none',
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
        channelAutoFadeTimeout: 5,
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
        ribbonGlowStrength: 20,
        ribbonGlowStrengthHover: 28,
        ribbonDockOpacity: 1,
      },
      wallpaper: {
        wallpapers: [],
        activeWallpaper: null,
        likedWallpapers: [],
        cycling: false,
        cycleInterval: 30,
        cycleAnimation: 'fade',
        slideDirection: 'right',
        crossfadeDuration: 1.2,
        crossfadeEasing: 'ease-out',
        slideRandomDirection: false,
        slideDuration: 1.5,
        slideEasing: 'ease-out',
        wallpaperOpacity: 1,
        wallpaperBlur: 0,
        overlayEnabled: false,
        overlayEffect: 'snow',
        overlayIntensity: 50,
        overlaySpeed: 1,
        overlayWind: 0.02,
        overlayGravity: 0.1,
      },
      time: {
        timeColor: '#ffffff',
        recentTimeColors: [],
        timeFormat24hr: true,
        enableTimePill: true,
        timePillBlur: 8,
        timePillOpacity: 0.05,
        timeFont: 'default',
      },
      general: {
        immersivePip: false,
        startInFullscreen: false,
        showPresetsButton: true,
        startOnBoot: false,
      },
      sounds: {
        backgroundMusicEnabled: true,
        backgroundMusicLooping: true,
        backgroundMusicPlaylistMode: false,
        channelClickEnabled: true,
        channelClickVolume: 0.5,
        channelHoverEnabled: true,
        channelHoverVolume: 0.5,
        startupEnabled: true,
        startupVolume: 0.5,
      }
    }
  }))
}));

export default useAppearanceSettingsStore; 