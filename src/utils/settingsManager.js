import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Unified settings store - single source of truth
const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Core app settings
      app: {
        version: '2.9.1',
        isDarkMode: false,
        useCustomCursor: false,
        immersivePip: false,
        startInFullscreen: false,
        showPresetsButton: true,
        startOnBoot: false,
        settingsShortcut: '',
      },

      // UI settings
      ui: {
        showDock: true,
        classicMode: false,
        ribbonButtonConfigs: [],
        presetsButtonConfig: null,
        particleSettings: {},
      },

      // Channel settings
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

      // Ribbon settings
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

      // Wallpaper settings
      wallpaper: {
        savedWallpapers: [],
        likedWallpapers: [],
        activeWallpaper: null,
        wallpaperOpacity: 1,
        wallpaperBlur: 0,
        cycling: {
          enabled: false,
          interval: 30,
          animation: 'fade',
          slideDirection: 'right',
          crossfadeDuration: 1.2,
          crossfadeEasing: 'ease-out',
          slideRandomDirection: false,
          slideDuration: 1.5,
          slideEasing: 'ease-out',
        },
        overlay: {
          enabled: false,
          effect: 'snow',
          intensity: 50,
          speed: 1,
          wind: 0.02,
          gravity: 0.1,
        },
        monitorWallpapers: {}, // { monitorId: { wallpaper, opacity, blur, etc. } }
      },

      // Time settings
      time: {
        timeColor: '#ffffff',
        recentTimeColors: [],
        timeFormat24hr: true,
        enableTimePill: true,
        timePillBlur: 8,
        timePillOpacity: 0.05,
        timeFont: 'default',
      },

      // Sound settings
      sounds: {
        backgroundMusic: {
          enabled: true,
          looping: true,
          playlistMode: false,
        },
        channelClick: {
          enabled: true,
          volume: 0.5,
        },
        channelHover: {
          enabled: true,
          volume: 0.5,
        },
        startup: {
          enabled: true,
          volume: 0.5,
        },
      },

      // Homescreen settings
      homescreen: {
        navigationMode: 'simple',
        gridColumns: 4,
        gridRows: 3,
        peekVisibility: 0.2,
      },

      // API & Widgets settings (migrated from existing stores)
      apiIntegrations: {
        spotify: {
          isConnected: false,
          isEnabled: false,
          hotkey: 'Ctrl+Shift+S',
          hotkeyKey: 's',
          hotkeyModifier: 'ctrl+shift',
          settings: {
            dynamicColors: true,
            useBlurredBackground: false,
            blurAmount: 30,
            autoShowWidget: false,
            autoHideWidget: true,
            visualizerType: 'bars',
            trackInfoPanelOpacity: 0.6,
            trackInfoPanelBlur: 10,
          },
          // Current playback state
          currentTrack: null,
          isPlaying: false,
          progress: 0,
          duration: 0,
          volume: 50,
        },
        adminPanel: {
          powerActions: [],
        },
      },

      // Floating widgets settings (migrated from useFloatingWidgetStore)
      floatingWidgets: {
        spotify: {
          visible: false,
          position: { x: 100, y: 100 },
        },
        systemInfo: {
          visible: false,
          position: { x: 400, y: 100 },
          updateInterval: 0,
          // System info data
          systemInfo: null,
          isLoading: false,
          lastUpdated: null,
        },
        adminPanel: {
          visible: false,
          position: { x: 700, y: 100 },
        },
      },

      // Keyboard shortcuts
      keyboardShortcuts: [],

      // Presets
      presets: [],

      // Actions for API Integrations
      // Spotify actions
      toggleSpotifyEnabled: () => {
        set(state => ({
          apiIntegrations: {
            ...state.apiIntegrations,
            spotify: {
              ...state.apiIntegrations.spotify,
              isEnabled: !state.apiIntegrations.spotify.isEnabled,
            },
          },
        }));
      },

      updateSpotifySettings: (settings) => {
        set(state => ({
          apiIntegrations: {
            ...state.apiIntegrations,
            spotify: {
              ...state.apiIntegrations.spotify,
              settings: {
                ...state.apiIntegrations.spotify.settings,
                ...settings,
              },
            },
          },
        }));
      },

      setSpotifyConnection: (isConnected) => {
        set(state => ({
          apiIntegrations: {
            ...state.apiIntegrations,
            spotify: {
              ...state.apiIntegrations.spotify,
              isConnected,
            },
          },
        }));
      },

      updateSpotifyPlayback: (playbackData) => {
        set(state => ({
          apiIntegrations: {
            ...state.apiIntegrations,
            spotify: {
              ...state.apiIntegrations.spotify,
              ...playbackData,
            },
          },
        }));
      },

      // Admin Panel actions
      updateAdminPanelActions: (powerActions) => {
        set(state => ({
          apiIntegrations: {
            ...state.apiIntegrations,
            adminPanel: {
              ...state.apiIntegrations.adminPanel,
              powerActions,
            },
          },
        }));
      },

      // Floating Widgets actions
      toggleSpotifyWidget: () => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            spotify: {
              ...state.floatingWidgets.spotify,
              visible: !state.floatingWidgets.spotify.visible,
            },
          },
        }));
      },

      showSpotifyWidget: () => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            spotify: {
              ...state.floatingWidgets.spotify,
              visible: true,
            },
          },
        }));
      },

      hideSpotifyWidget: () => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            spotify: {
              ...state.floatingWidgets.spotify,
              visible: false,
            },
          },
        }));
      },

      setSpotifyWidgetPosition: (position) => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            spotify: {
              ...state.floatingWidgets.spotify,
              position,
            },
          },
        }));
      },

      resetSpotifyWidgetPosition: () => {
        const centerX = Math.max(0, (window.innerWidth - 300) / 2);
        const centerY = Math.max(0, (window.innerHeight - 400) / 2);
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            spotify: {
              ...state.floatingWidgets.spotify,
              position: { x: centerX, y: centerY },
            },
          },
        }));
      },

      toggleSystemInfoWidget: () => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            systemInfo: {
              ...state.floatingWidgets.systemInfo,
              visible: !state.floatingWidgets.systemInfo.visible,
            },
          },
        }));
      },

      showSystemInfoWidget: () => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            systemInfo: {
              ...state.floatingWidgets.systemInfo,
              visible: true,
            },
          },
        }));
      },

      hideSystemInfoWidget: () => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            systemInfo: {
              ...state.floatingWidgets.systemInfo,
              visible: false,
            },
          },
        }));
      },

      setSystemInfoWidgetPosition: (position) => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            systemInfo: {
              ...state.floatingWidgets.systemInfo,
              position,
            },
          },
        }));
      },

      resetSystemInfoWidgetPosition: () => {
        const centerX = Math.max(0, (window.innerWidth - 300) / 2);
        const centerY = Math.max(0, (window.innerHeight - 400) / 2);
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            systemInfo: {
              ...state.floatingWidgets.systemInfo,
              position: { x: centerX, y: centerY },
            },
          },
        }));
      },

      updateSystemInfo: (systemInfo) => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            systemInfo: {
              ...state.floatingWidgets.systemInfo,
              systemInfo,
              lastUpdated: Date.now(),
            },
          },
        }));
      },

      setSystemInfoLoading: (isLoading) => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            systemInfo: {
              ...state.floatingWidgets.systemInfo,
              isLoading,
            },
          },
        }));
      },

      updateSystemInfoInterval: (updateInterval) => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            systemInfo: {
              ...state.floatingWidgets.systemInfo,
              updateInterval,
            },
          },
        }));
      },

      toggleAdminPanelWidget: () => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            adminPanel: {
              ...state.floatingWidgets.adminPanel,
              visible: !state.floatingWidgets.adminPanel.visible,
            },
          },
        }));
      },

      showAdminPanelWidget: () => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            adminPanel: {
              ...state.floatingWidgets.adminPanel,
              visible: true,
            },
          },
        }));
      },

      hideAdminPanelWidget: () => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            adminPanel: {
              ...state.floatingWidgets.adminPanel,
              visible: false,
            },
          },
        }));
      },

      setAdminPanelWidgetPosition: (position) => {
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            adminPanel: {
              ...state.floatingWidgets.adminPanel,
              position,
            },
          },
        }));
      },

      resetAdminPanelWidgetPosition: () => {
        const centerX = Math.max(0, (window.innerWidth - 300) / 2);
        const centerY = Math.max(0, (window.innerHeight - 400) / 2);
        set(state => ({
          floatingWidgets: {
            ...state.floatingWidgets,
            adminPanel: {
              ...state.floatingWidgets.adminPanel,
              position: { x: centerX, y: centerY },
            },
          },
        }));
      },

      // General settings actions
      updateSetting: (category, key, value) => {
        set(state => ({
          [category]: {
            ...state[category],
            [key]: value,
          },
        }));
      },

      updateSettings: (category, updates) => {
        set(state => ({
          [category]: {
            ...state[category],
            ...updates,
          },
        }));
      },

      getSetting: (category, key) => {
        const state = get();
        return state[category]?.[key];
      },

      getSettings: (category) => {
        const state = get();
        return state[category] || {};
      },

      // Export all settings for persistence
      exportSettings: () => {
        const state = get();
        return {
          app: state.app,
          ui: state.ui,
          channels: state.channels,
          ribbon: state.ribbon,
          wallpaper: state.wallpaper,
          time: state.time,
          sounds: state.sounds,
          homescreen: state.homescreen,
          apiIntegrations: state.apiIntegrations,
          floatingWidgets: state.floatingWidgets,
          keyboardShortcuts: state.keyboardShortcuts,
          presets: state.presets,
        };
      },

      // Import settings from external source
      importSettings: (settings) => {
        set(settings);
      },

      // Reset settings to defaults
      resetSettings: () => {
        set({
          app: {
            version: '2.9.1',
            isDarkMode: false,
            useCustomCursor: false,
            immersivePip: false,
            startInFullscreen: false,
            showPresetsButton: true,
            startOnBoot: false,
            settingsShortcut: '',
          },
          // ... other defaults
        });
      },
    }),
    {
      name: 'wii-desktop-settings',
      partialize: (state) => ({
        app: state.app,
        ui: state.ui,
        channels: state.channels,
        ribbon: state.ribbon,
        wallpaper: state.wallpaper,
        time: state.time,
        sounds: state.sounds,
        homescreen: state.homescreen,
        apiIntegrations: state.apiIntegrations,
        floatingWidgets: state.floatingWidgets,
        keyboardShortcuts: state.keyboardShortcuts,
        presets: state.presets,
      }),
    }
  )
);

export default useSettingsStore;
