import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { DEFAULT_SHORTCUTS } from './keyboardShortcuts';
import { createStoreManagers } from './store/managers';
import { CONSOLIDATED_STORE_PERSIST_NAME, partializeConsolidatedState } from './store/persistConfig';
import { CLASSIC_DOCK_DEFAULT_COLORS } from '../design/classicDockThemeDefaults.js';
import {
  DEFAULT_RIBBON_GLOW_HEX,
  DEFAULT_RIBBON_SURFACE_HEX,
  INPUT_COLOR_DEFAULT_HEX,
} from '../design/runtimeColorStrings.js';

let useConsolidatedAppStore;
const {
  appLibraryManager,
  unifiedAppManager,
  spotifyManager,
  iconManager,
  navigationManager,
  performanceManager,
  floatingWidgetManager,
} = createStoreManagers(() => useConsolidatedAppStore.getState());

// Consolidated app store - single source of truth for all app state
useConsolidatedAppStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Core app state
        app: {
          version: '2.9.4',
          isInitialized: false,
          isLoading: true,
          splashFading: false,
          appReady: false,
          hasInitialized: false,
          isEditMode: false,
          showDragRegion: false,
          showAdminMenu: false,
          showCountdown: false,
          isScreenshotInProgress: false,
          updateAvailable: false,
        },

        // UI state
        ui: {
          isDarkMode: false,
          useCustomCursor: true,
          cursorStyle: 'classic', // 'classic', 'minimal', 'glowing', 'retro'
          startInFullscreen: false,
          showPresetsButton: false,
          startOnBoot: false,
          settingsShortcut: '',
          // New shortcut properties for enhanced shortcuts tab
          spotifyWidgetShortcut: '',
          systemInfoWidgetShortcut: '',
          adminPanelWidgetShortcut: '',
          performanceMonitorShortcut: '',
          nextPageShortcut: '',
          prevPageShortcut: '',
          toggleDockShortcut: '',
          toggleDarkModeShortcut: '',
          toggleCustomCursorShortcut: '',
          lowPowerMode: false,
          immersivePip: false,
          showDock: true,
          classicMode: false,
          /** Ribbon/shell follow Spotify album-art colors (synced with Spotify Match preset). */
          spotifyMatchEnabled: false,
          channelOpacity: 1,
          lastChannelHoverTime: Date.now(),
          // Modal states
          showPresetsModal: false,
          showSettingsModal: false,
          showSettingsActionMenu: false, // Settings action menu state
          showWallpaperModal: false,
          showSoundModal: false,
          showChannelSettingsModal: false,
          showAppShortcutsModal: false,
          showTimeSettingsModal: false,
          showRibbonSettingsModal: false,
          showUpdateModal: false,
          showPrimaryActionsModal: false,
          showImageSearchModal: false,
          showNavigationCustomizationModal: false,
          showMonitorSelectionModal: false,
          settingsActiveTab: 'channels', // Default active tab for settings modal
          // Keyboard shortcuts
          keyboardShortcuts: DEFAULT_SHORTCUTS.map(shortcut => ({
            ...shortcut,
            key: shortcut.defaultKey,
            modifier: shortcut.defaultModifier,
            enabled: true
          })),
        },

        // Ribbon state
        ribbon: {
          glassWiiRibbon: false,
          glassOpacity: 0.18,
          glassBlur: 2.5,
          glassBorderOpacity: 0.5,
          glassShineOpacity: 0.7,
          ribbonColor: DEFAULT_RIBBON_SURFACE_HEX,
          recentRibbonColors: [],
          ribbonGlowColor: DEFAULT_RIBBON_GLOW_HEX,
          recentRibbonGlowColors: [],
          ribbonGlowStrength: 16,
          ribbonGlowStrengthHover: 20,
          ribbonDockOpacity: 1,
          ribbonButtonConfigs: [],
          presetsButtonConfig: {
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

        // Wallpaper state
        wallpaper: {
          current: null,
          next: null,
          opacity: 1,
          blur: 0,
          savedWallpapers: [],
          likedWallpapers: [],
          isTransitioning: false,
          slideDirection: 'right',
          crossfadeProgress: 0,
          slideProgress: 0,
          cycleWallpapers: false,
          cycleInterval: 30,
          cycleAnimation: 'fade',
          crossfadeDuration: 1.2,
          crossfadeEasing: 'ease-out',
          slideRandomDirection: false,
          slideDuration: 1.5,
          slideEasing: 'ease-out',
        },

        // Overlay effects
        overlay: {
          enabled: false,
          effect: 'snow',
          intensity: 50,
          speed: 1,
          wind: 0.02,
          gravity: 0.1,
        },

        // Time display
        time: {
          color: INPUT_COLOR_DEFAULT_HEX,
          recentColors: [],
          enablePill: true,
          pillBlur: 8,
          pillOpacity: 0.05,
          font: 'default',
        },

        // Channel state - unified data layer for all channel operations
        channels: {
          // Channel settings
          settings: {
            autoFadeTimeout: 5,
            animation: null,
            adaptiveEmptyChannels: true,
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
          },
          
          // Channel data - actual channel configurations
          data: {
            // Grid configuration - Wii-style 4x3 grid per page
            gridColumns: 4,
            gridRows: 3,
            totalChannels: 36, // 3 pages × 12 channels per page
            
            // Channel configurations by ID
            configuredChannels: {},
            
            // Media mappings
            mediaMap: {},
            
            // App path mappings
            appPathMap: {},
            
            // Channel configurations
            channelConfigs: {},
            
            // Navigation state
            navigation: {
              currentPage: 0,
              totalPages: 3, // 3 pages for 36 channels
              mode: 'wii', // 'simple' or 'wii'
              isAnimating: false,
              animationDirection: 'none',
              animationType: 'slide', // slide, fade, none
              animationDuration: 500,
              animationEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
              enableSlideAnimation: true
            }
          },
          
          // Channel operations state
          operations: {
            isLoading: false,
            isSaving: false,
            lastSaved: null,
            error: null
          }
        },

        // Dock state
        dock: {
          ...CLASSIC_DOCK_DEFAULT_COLORS,

          // Glass effects
          glassEnabled: false,
          glassOpacity: 0.18,
          glassBlur: 2.5,
          glassBorderOpacity: 0.5,
          glassShineOpacity: 0.7,
          
          // Size settings
          dockScale: 1.0,
          buttonSize: 1.0,
          sdCardSize: 1.0,
          
          // SD Card icon
          sdCardIcon: 'default',
          
          // Recent colors
          recentColors: [],
          
          // Custom themes
          customThemes: {},
          
          // Particle system settings
          particleSystemEnabled: false,
          particleEffectType: 'normal',
          particleDirection: 'upward',
          particleSpeed: 2,
          particleCount: 3,
          particleSpawnRate: 60,
          particleSize: 3,
          particleGravity: 0.02,
          particleFadeSpeed: 0.008,
          particleSizeDecay: 0.02,
          particleUseAdaptiveColor: false,
          particleColorIntensity: 1.0,
          particleColorVariation: 0.3,
          particleRotationSpeed: 0.05,
          particleLifetime: 3.0,
          particleCustomColors: [],
        },

        // Monitor state
        monitors: {
          displays: [],
          currentDisplay: null,
          preferredMonitor: 'primary',
          specificMonitorId: null,
          rememberLastMonitor: false,
          isLoading: false,
          error: null,
        },



        // Audio state
        audio: {
          settings: null,
          backgroundAudio: null,
          lastMusicId: null,
          lastMusicUrl: null,
          lastMusicEnabled: false,
          lastBgmEnabled: true,
          lastPlaylistMode: false,
        },

        // Sounds state
        sounds: {
          backgroundMusicEnabled: true,
          backgroundMusicLooping: true,
          backgroundMusicPlaylistMode: false,
          channelClickEnabled: true,
          channelClickVolume: 0.5,
          channelHoverEnabled: true,
          channelHoverVolume: 0.5,
        },

        // Icon management state
        icons: {
          savedIcons: [],
          loading: false,
          error: null,
          uploading: false,
          uploadError: null,
        },

        // App library state
        appLibrary: {
          installedApps: [],
          appsLoading: false,
          appsError: null,
          steamGames: [],
          steamLoading: false,
          steamError: null,
          epicGames: [],
          epicLoading: false,
          epicError: null,
          uwpApps: [],
          uwpLoading: false,
          uwpError: null,
          customSteamPath: '',
        },

        // Unified app state
        unifiedApps: {
          apps: [],
          selectedApp: null,
          searchQuery: '',
          selectedAppType: 'all',
          loading: false,
          error: null,
        },

        // Spotify state
        spotify: {
          isConnected: false,
          currentUser: null,
          accessToken: null,
          refreshToken: null,
          currentTrack: null,
          isPlaying: false,
          progress: 0,
          duration: 0,
          volume: 50,
          deviceId: null,
          error: null,
          loading: false,
          // Extracted colors from current track's album art
          extractedColors: null,
          // Immersive experience settings
          immersiveMode: {
            enabled: false,
            wallpaperOverlay: true,
            ambientLighting: true,
            pulseEffects: true,
            liveGradientWallpaper: false, // New setting for live gradient wallpaper
            overlayIntensity: 0.3,
            ambientIntensity: 0.15,
            pulseIntensity: 0.2,
            beatSync: true,
                            // Live gradient wallpaper settings - simplified
                overlayMode: false, // Whether to overlay on existing wallpaper or replace completely
                intensity: 0.7, // Overall effect intensity (0-1)
                animationLevel: 2, // Animation level: 0=static, 1=subtle, 2=dynamic, 3=intense
                style: 'radial' // Gradient style: 'radial', 'linear', 'waves'
          },
          settings: {
            dynamicColors: true,
            useBlurredBackground: true, // Enabled by default
            blurAmount: 2, // 2px blur by default
            autoShowWidget: false,
            visualizerType: 'bars',
            trackInfoPanelOpacity: 0.8,
            trackInfoPanelBlur: 10
          }
        },

        // Navigation state
        navigation: {
          showNavigationModal: false,
          customButtons: [],
          buttonOrder: [],
          defaultButtons: [
            { id: 'settings', type: 'icon', icon: 'settings', label: 'Settings', action: 'open-settings' },
            { id: 'presets', type: 'icon', icon: 'star', label: 'Presets', action: 'open-presets' },
            { id: 'spotify', type: 'icon', icon: 'music', label: 'Spotify', action: 'toggle-spotify' }
          ],
          buttonConfigs: {},
          loading: false,
          error: null,
          // Side navigation button settings
          icons: {
            left: null,
            right: null
          },
          glassEffect: {
            left: {
              enabled: false,
              opacity: 0.18,
              blur: 2.5,
              borderOpacity: 0.5,
              shineOpacity: 0.7
            },
            right: {
              enabled: false,
              opacity: 0.18,
              blur: 2.5,
              borderOpacity: 0.5,
              shineOpacity: 0.7
            }
          },
          spotifyIntegration: false
        },

        // Performance monitoring state
        performance: {
          isMonitoring: false,
          metrics: {
            renderTimes: {},
            reRenderCounts: {},
            memoryUsage: [],
            fps: [],
            componentLoadTimes: {}
          },
          thresholds: {
            maxRenderTime: 16, // 60fps target
            maxMemoryUsage: 100 * 1024 * 1024, // 100MB
            minFps: 30
          },
          alerts: [],
          history: [],
          loading: false,
          error: null,
        },

        // Floating widgets state
        floatingWidgets: {
          spotify: {
            visible: false,
            position: { x: 20, y: 20 },
            settings: {
              autoShowWidget: false,
              autoHideWidget: true,
              dynamicColors: false,
            },
          },
          systemInfo: {
            visible: false,
            position: { x: 20, y: 100 },
            size: { width: 320, height: 400 }, // Default size
            updateInterval: 30, // Default 30 seconds
            // System info data
            data: null,
            isLoading: false,
            error: null,
            lastUpdated: null,
            // Particle system settings
            particleEnabled: false,
            particleEffectType: 'normal',
            particleCount: 3,
            particleSpeed: 2,
          },
          adminPanel: {
            visible: false,
            position: { x: 20, y: 180 },
            // Admin panel configuration
            config: {
              powerActions: []
            }
          },
          performanceMonitor: {
            visible: false,
            position: { x: 20, y: 260 },
          },
        },

        // Presets
        presets: [],

        // Actions
        actions: {
          // App actions
          setAppState: (updates) => set((state) => ({
            app: { ...state.app, ...updates }
          })),

          // UI actions
          setUIState: (updates) => set((state) => {
            const resolvedUpdates = typeof updates === 'function'
              ? updates(state.ui)
              : updates;

            return {
              ui: { ...state.ui, ...resolvedUpdates }
            };
          }),

          // Ribbon actions
          setRibbonState: (updates) => set((state) => ({
            ribbon: { ...state.ribbon, ...updates }
          })),

          // Wallpaper actions
          setWallpaperState: (updates) => set((state) => ({
            wallpaper: { ...state.wallpaper, ...updates }
          })),

          // Overlay actions
          setOverlayState: (updates) => set((state) => ({
            overlay: { ...state.overlay, ...updates }
          })),

          // Time actions
          setTimeState: (updates) => set((state) => ({
            time: { ...state.time, ...updates }
          })),

          // Channel actions
          setChannelState: (updates) => set((state) => {
            const resolvedUpdates = typeof updates === 'function'
              ? updates(state.channels)
              : updates;

            const hasNestedShape = resolvedUpdates?.settings || resolvedUpdates?.data || resolvedUpdates?.operations;
            if (hasNestedShape) {
              return {
                channels: {
                  ...state.channels,
                  ...resolvedUpdates,
                  settings: {
                    ...state.channels.settings,
                    ...(resolvedUpdates.settings || {}),
                  },
                  data: {
                    ...state.channels.data,
                    ...(resolvedUpdates.data || {}),
                  },
                  operations: {
                    ...state.channels.operations,
                    ...(resolvedUpdates.operations || {}),
                  },
                }
              };
            }

            // Backward compatibility for legacy flat channel settings payloads.
            const {
              configuredChannels,
              mediaMap,
              appPathMap,
              channelConfigs,
              navigation,
              ...channelSettingsUpdates
            } = resolvedUpdates || {};

            return {
              channels: {
                ...state.channels,
                settings: { ...state.channels.settings, ...channelSettingsUpdates },
                data: {
                  ...state.channels.data,
                  ...(configuredChannels !== undefined ? { configuredChannels } : {}),
                  ...(mediaMap !== undefined ? { mediaMap } : {}),
                  ...(appPathMap !== undefined ? { appPathMap } : {}),
                  ...(channelConfigs !== undefined ? { channelConfigs } : {}),
                  ...(navigation !== undefined ? { navigation } : {}),
                }
              }
            };
          }),
          
          // Channel data actions
          setChannelData: (updates) => set((state) => ({
            channels: {
              ...state.channels,
              data: { ...state.channels.data, ...updates }
            }
          })),
          
          // Channel settings actions
          setChannelSettings: (updates) => set((state) => ({
            channels: {
              ...state.channels,
              settings: { ...state.channels.settings, ...updates }
            }
          })),
          
          // Channel operations actions
          setChannelOperations: (updates) => set((state) => ({
            channels: {
              ...state.channels,
              operations: { ...state.channels.operations, ...updates }
            }
          })),
          
          // Individual channel actions
          updateChannel: (channelId, channelData) => set((state) => {
            // Ensure the channels data structure exists
            const channelsData = state.channels?.data || {};
            const configuredChannels = channelsData.configuredChannels || {};
            
            return {
              channels: {
                ...state.channels,
                data: {
                  ...channelsData,
                  configuredChannels: {
                    ...configuredChannels,
                    [channelId]: channelData === null 
                      ? undefined // Remove channel if null is passed
                      : {
                          ...configuredChannels[channelId],
                          ...channelData
                        }
                  }
                }
              }
            };
          }),
          
          // Channel config actions
          updateChannelConfig: (channelId, configData) => set((state) => {
            // Ensure the channels data structure exists
            const channelsData = state.channels?.data || {};
            const channelConfigs = channelsData.channelConfigs || {};
            
            return {
              channels: {
                ...state.channels,
                data: {
                  ...channelsData,
                  channelConfigs: {
                    ...channelConfigs,
                    [channelId]: configData === null 
                      ? undefined // Remove config if null is passed
                      : {
                          ...channelConfigs[channelId],
                          ...configData
                        }
                  }
                }
              }
            };
          }),
          
          // Navigation actions
          setChannelNavigation: (updates) => set((state) => ({
            channels: {
              ...state.channels,
              data: {
                ...state.channels.data,
                navigation: { ...state.channels.data.navigation, ...updates }
              }
            }
          })),

          // Dock actions
          setDockState: (updates) => set((state) => ({
            dock: { ...state.dock, ...updates }
          })),



          // Audio actions
          setAudioState: (updates) => set((state) => ({
            audio: { ...state.audio, ...updates }
          })),

          // Sounds actions
          setSoundsState: (updates) => set((state) => ({
            sounds: { ...state.sounds, ...updates }
          })),
          // Backward compatibility alias for legacy callers
          setSoundState: (updates) => set((state) => ({
            sounds: { ...state.sounds, ...updates }
          })),

          // Icon actions
          setIconState: (updates) => set((state) => ({
            icons: { ...state.icons, ...updates }
          })),

          // App library actions
          setAppLibraryState: (updates) => set((state) => ({
            appLibrary: { ...state.appLibrary, ...updates }
          })),

          // Unified app actions
          setUnifiedAppsState: (updates) => set((state) => ({
            unifiedApps: { ...state.unifiedApps, ...updates }
          })),

          // Spotify actions
          setSpotifyState: (updates) => set((state) => ({
            spotify: { ...state.spotify, ...updates }
          })),
          
          // Spotify manager
          spotifyManager,
          
          // Widget toggle actions
          toggleSpotifyWidget: () => {
            const store = useConsolidatedAppStore.getState();
            const isVisible = store.floatingWidgets.spotify.visible;
            store.actions.setFloatingWidgetsState({
              spotify: { ...store.floatingWidgets.spotify, visible: !isVisible }
            });
          },

          toggleSystemInfoWidget: () => {
            const store = useConsolidatedAppStore.getState();
            const isVisible = store.floatingWidgets.systemInfo.visible;
            store.actions.setFloatingWidgetsState({
              systemInfo: { ...store.floatingWidgets.systemInfo, visible: !isVisible }
            });
          },

          toggleAdminPanelWidget: () => {
            const store = useConsolidatedAppStore.getState();
            const isVisible = store.floatingWidgets.adminPanel.visible;
            store.actions.setFloatingWidgetsState({
              adminPanel: { ...store.floatingWidgets.adminPanel, visible: !isVisible }
            });
          },

          togglePerformanceMonitorWidget: () => {
            const store = useConsolidatedAppStore.getState();
            const isVisible = store.floatingWidgets.performanceMonitor.visible;
            store.actions.setFloatingWidgetsState({
              performanceMonitor: { ...store.floatingWidgets.performanceMonitor, visible: !isVisible }
            });
          },

          // Navigation actions
          setNavigationState: (updates) => set((state) => ({
            navigation: { ...state.navigation, ...updates }
          })),

          // Performance actions
          setPerformanceState: (updates) => set((state) => ({
            performance: { ...state.performance, ...updates }
          })),

          // Floating widgets actions
          setFloatingWidgetsState: (updates) => set((state) => ({
            floatingWidgets: { ...state.floatingWidgets, ...updates }
          })),

          // Monitor actions
          setMonitorState: (updates) => set((state) => ({
            monitors: { ...state.monitors, ...updates }
          })),

          // Floating widget manager - will be attached after store creation

          // Keyboard shortcuts actions
          resetKeyboardShortcuts: () => set((state) => ({
            ui: {
              ...state.ui,
              keyboardShortcuts: DEFAULT_SHORTCUTS.map(shortcut => ({
                ...shortcut,
                key: shortcut.defaultKey,
                modifier: shortcut.defaultModifier,
                enabled: true
              }))
            }
          })),

          // Preset actions
          setPresets: (presets) => set({ presets }),

          // Bulk update
          updateState: (updates) => set((state) => ({
            ...state,
            ...updates
          })),

          // Reset to defaults
          resetToDefaults: () => set({
            app: {
              version: '2.9.4',
              isInitialized: false,
              isLoading: true,
              splashFading: false,
              appReady: false,
              hasInitialized: false,
              isEditMode: false,
              showDragRegion: false,
              showAdminMenu: false,
              showCountdown: false,
              isScreenshotInProgress: false,
              updateAvailable: false,
            },
            ui: {
              isDarkMode: false,
              useCustomCursor: true,
              startInFullscreen: true,
              showPresetsButton: false,
              startOnBoot: false,
              settingsShortcut: '',
              lowPowerMode: false,
              immersivePip: false,
              showDock: true,
              classicMode: false,
              spotifyMatchEnabled: false,
              channelOpacity: 1,
              lastChannelHoverTime: Date.now(),
            },
            ribbon: {
              glassWiiRibbon: false,
              glassOpacity: 0.18,
              glassBlur: 2.5,
              glassBorderOpacity: 0.5,
              glassShineOpacity: 0.7,
              ribbonColor: DEFAULT_RIBBON_SURFACE_HEX,
              recentRibbonColors: [],
              ribbonGlowColor: DEFAULT_RIBBON_GLOW_HEX,
              recentRibbonGlowColors: [],
              ribbonGlowStrength: 16,
              ribbonGlowStrengthHover: 20,
              ribbonDockOpacity: 1,
              ribbonButtonConfigs: [],
              presetsButtonConfig: {
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
              current: null,
              next: null,
              opacity: 1,
              blur: 0,
              savedWallpapers: [],
              likedWallpapers: [],
              isTransitioning: false,
              slideDirection: 'right',
              crossfadeProgress: 0,
              slideProgress: 0,
              cycleWallpapers: false,
              cycleInterval: 30,
              cycleAnimation: 'fade',
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
            time: {
              color: INPUT_COLOR_DEFAULT_HEX,
              recentColors: [],
              format24hr: false,
              enablePill: true,
              pillBlur: 8,
              pillOpacity: 0.05,
              font: 'default',
            },
            channels: {
              settings: {
                autoFadeTimeout: 5,
                animation: null,
                adaptiveEmptyChannels: true,
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
              },
              data: {
                gridColumns: 4,
                gridRows: 3,
                totalChannels: 36,
                configuredChannels: {},
                mediaMap: {},
                appPathMap: {},
                channelConfigs: {},
                navigation: {
                  currentPage: 0,
                  totalPages: 3,
                  mode: 'wii',
                  isAnimating: false,
                  animationDirection: 'none',
                  animationType: 'slide',
                  animationDuration: 500,
                  animationEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
                  enableSlideAnimation: true
                }
              },
              operations: {
                isLoading: false,
                isSaving: false,
                lastSaved: null,
                error: null
              }
            },
            dock: {
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
            particles: {
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
            monitors: {
              displays: [],
              currentDisplay: null,
              preferredMonitor: 'primary',
              specificMonitorId: null,
              rememberLastMonitor: false,
              isLoading: false,
              error: null,
            },
            audio: {
              settings: null,
              backgroundAudio: null,
              lastMusicId: null,
              lastMusicUrl: null,
              lastMusicEnabled: false,
              lastBgmEnabled: true,
              lastPlaylistMode: false,
            },
            sounds: {
              backgroundMusicEnabled: true,
              backgroundMusicLooping: true,
              backgroundMusicPlaylistMode: false,
              channelClickEnabled: true,
              channelClickVolume: 0.5,
              channelHoverEnabled: true,
              channelHoverVolume: 0.5,
            },
            presets: [],
          }),
        },
      }),
      {
        name: CONSOLIDATED_STORE_PERSIST_NAME,
        partialize: partializeConsolidatedState,
      }
    )
  )
);

// Attach managers to store
useConsolidatedAppStore.setState((state) => ({
  iconManager,
  appLibraryManager,
  unifiedAppManager,
  spotifyManager,
  navigationManager,
  performanceManager,
  floatingWidgetManager,
  actions: {
    ...state.actions,
    floatingWidgetManager
  }
}));

// Make store available globally for services that need it
if (typeof window !== 'undefined') {
  window.useConsolidatedAppStore = useConsolidatedAppStore;
}

export default useConsolidatedAppStore;
