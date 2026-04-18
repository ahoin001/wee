import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { DEFAULT_SHORTCUTS } from './keyboardShortcuts';
import { createStoreManagers } from './store/managers';
import { CLASSIC_DOCK_DEFAULT_COLORS } from '../design/classicDockThemeDefaults.js';
import {
  DEFAULT_RIBBON_GLOW_HEX,
  DEFAULT_RIBBON_SURFACE_HEX,
  INPUT_COLOR_DEFAULT_HEX,
} from '../design/runtimeColorStrings.js';
import { resolveGridConfig, resolveNavigation } from './channelLayoutSystem';
import { applyChannelSlotReorder } from './channelReorder';
import { DEFAULT_MOTION_FEEDBACK } from './motionFeedbackDefaults';
import {
  createDefaultChannelSpaceData,
  DEFAULT_SECONDARY_CHANNEL_PROFILE_ID,
  getSecondaryChannelSpaceData,
  normalizeChannelSpaceKey,
} from './channelSpaces';
import { MAX_SAVED_WORKSPACES } from './workspaces/workspaceConstants.js';
import { mergeChannelsSlice } from './store/settingsPersistenceContract';
import {
  captureSpaceAppearanceFromState,
  mergeLiveStateFromSpaceAppearance,
} from './appearance/spaceAppearance';

/**
 * Read/write the second shell space’s channel grid via `secondaryChannelProfiles[activeId].channelSpace`
 * and mirror `dataBySpace.workspaces` for persistence merges.
 */
function patchSecondaryChannelSpace(state, updater) {
  const id = state.channels.activeSecondaryChannelProfileId || DEFAULT_SECONDARY_CHANNEL_PROFILE_ID;
  const profiles = { ...(state.channels.secondaryChannelProfiles || {}) };
  const entry = profiles[id] || {
    id,
    name: 'Second',
    channelSpace: createDefaultChannelSpaceData(),
  };
  const current = entry.channelSpace || createDefaultChannelSpaceData();
  const nextChannelSpace = updater(current);
  profiles[id] = { ...entry, channelSpace: nextChannelSpace };
  return {
    ...state.channels,
    secondaryChannelProfiles: profiles,
    activeSecondaryChannelProfileId: id,
    dataBySpace: {
      ...state.channels.dataBySpace,
      workspaces: nextChannelSpace,
    },
  };
}

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
    (set, _get) => ({
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
          showSettingsModal: false,
          showSettingsActionMenu: false, // Settings action menu state
          showWorkspaceSwitcher: false,
          /** True while any Configure Channel modal is open — disables grid drag/drop. Not persisted. */
          channelConfigureModalOpen: false,
          /** Full-app scene transition for premium workspace/preset switching UX. Not persisted. */
          sceneTransition: {
            active: false,
            label: '',
            key: 0,
          },
          /** Transient: recent-launch hint per channel id (not persisted; no process tracking). */
          channelOpenHints: {},
          settingsActiveTab: 'channels', // Default active tab for settings modal
          // Keyboard shortcuts
          keyboardShortcuts: DEFAULT_SHORTCUTS.map(shortcut => ({
            ...shortcut,
            key: shortcut.defaultKey,
            modifier: shortcut.defaultModifier,
            enabled: true
          })),
          motionFeedback: {
            master: DEFAULT_MOTION_FEEDBACK.master,
            channels: { ...DEFAULT_MOTION_FEEDBACK.channels },
            dock: { ...DEFAULT_MOTION_FEEDBACK.dock },
            ribbon: { ...DEFAULT_MOTION_FEEDBACK.ribbon },
          },
          spaceRailAutoHide: true,
          spaceRailPinned: false,
          spaceRailRevealWidth: 28,
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
          ribbonHoverAnimationEnabled: true,
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
          /** CSS filter brightness() for Home & Workspaces spaces (channels); 1 = unchanged */
          workspaceBrightness: 1,
          /** CSS filter saturate() for Home & Workspaces */
          workspaceSaturate: 1,
          /** Game Hub wallpaper dim (was hardcoded ~0.78) */
          gameHubBrightness: 0.78,
          gameHubSaturate: 1,
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
          
          /** Per shell space: `home` + mirror of active secondary profile under `workspaces` */
          dataBySpace: {
            home: createDefaultChannelSpaceData(),
            workspaces: createDefaultChannelSpaceData(),
          },
          /** Second shell space: swappable channel grids (only one active via `activeSecondaryChannelProfileId`). */
          secondaryChannelProfiles: {
            [DEFAULT_SECONDARY_CHANNEL_PROFILE_ID]: {
              id: DEFAULT_SECONDARY_CHANNEL_PROFILE_ID,
              name: 'Second',
              channelSpace: createDefaultChannelSpaceData(),
            },
          },
          activeSecondaryChannelProfileId: DEFAULT_SECONDARY_CHANNEL_PROFILE_ID,

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
          /** GET /v1/me/player returned 403 — treat as no in-app playback; poll slowly */
          playerWebApiForbidden: false,
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
            size: { width: 360, height: 440 },
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

        // Workspaces
        workspaces: {
          items: [],
          activeWorkspaceId: null,
        },

        // Top-level shell spaces
        spaces: {
          activeSpaceId: 'home',
          /** Last non–Game Hub panel (home vs work) — used to restore on launch (never cold-start on gamehub). */
          lastChannelSpaceId: 'home',
          /** Vertical rail: secondary channel slot → Home → Game Hub (Home is middle). */
          order: ['workspaces', 'home', 'gamehub'],
          /** True while the space-world slide is animating — channel drag should be disabled. */
          isTransitioning: false,
          autoHideRail: true,
          railPinned: false,
          railVisible: false,
        },

        /**
         * Saved look per shell space (Home / Work / Games). `null` = not yet written (use live merge on switch).
         */
        appearanceBySpace: {
          home: null,
          workspaces: null,
          gamehub: null,
        },

        // Game Hub state domain
        gameHub: {
          profile: {
            steamId: '',
            useSteamWebApi: true,
            onboardingDismissed: false,
          },
          ui: {
            selectedGameId: null,
            activeShelf: 'recentlyPlayed',
            searchQuery: '',
            showDetails: false,
            launchingGameId: null,
            showHubBackdrop: false,
            /** When true, Game Hub lists/collections show Steam titles only (Epic still launchable elsewhere). */
            hubSteamOnlyGames: true,
            effectsEnabled: true,
            activeCollectionId: null,
            favoriteGameIds: [],
            hubShelfOrderMode: 'custom',
            collectionShelfOrder: null,
            hubLibrarySort: 'default',
            hubCollectionGamesSort: 'default',
            /** @type {Record<string, { url: string, type?: string, headerUrl?: string }>} */
            customArtByGameId: {},
          },
          library: {
            enrichedGames: [],
            shelves: {
              recentlyPlayed: [],
              mostPlayed: [],
              installed: [],
              readyToLaunch: [],
            },
            syncStatus: 'idle',
            lastSyncedAt: null,
            lastError: null,
            lastEnrichedSteamId: '',
            weeCollections: [],
            lastLaunchedAt: {},
          },
        },

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

          // Channel actions (merge; supports legacy `data` via mergeChannelsSlice)
          setChannelState: (updates) => set((state) => {
            const resolvedUpdates = typeof updates === 'function'
              ? updates(state.channels)
              : updates;
            const patch = resolvedUpdates && typeof resolvedUpdates === 'object' ? resolvedUpdates : {};
            return {
              channels: mergeChannelsSlice(state.channels, patch),
            };
          }),

          setChannelDataForSpace: (spaceKey, updates) => set((state) => {
            const key = normalizeChannelSpaceKey(spaceKey);
            if (key === 'workspaces') {
              return {
                channels: patchSecondaryChannelSpace(state, (prev) => ({ ...prev, ...updates })),
              };
            }
            const prev = state.channels.dataBySpace?.[key] || createDefaultChannelSpaceData();
            return {
              channels: {
                ...state.channels,
                dataBySpace: {
                  ...state.channels.dataBySpace,
                  [key]: { ...prev, ...updates },
                },
              },
            };
          }),
          
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
          
          updateChannelForSpace: (spaceKey, channelId, channelData) => set((state) => {
            const key = normalizeChannelSpaceKey(spaceKey);
            if (key === 'workspaces') {
              return {
                channels: patchSecondaryChannelSpace(state, (channelsData) => {
                  const configuredChannels = channelsData.configuredChannels || {};
                  return {
                    ...channelsData,
                    configuredChannels: {
                      ...configuredChannels,
                      [channelId]: channelData === null
                        ? undefined
                        : {
                            ...configuredChannels[channelId],
                            ...channelData,
                          },
                    },
                  };
                }),
              };
            }
            const channelsData = state.channels?.dataBySpace?.[key] || createDefaultChannelSpaceData();
            const configuredChannels = channelsData.configuredChannels || {};

            return {
              channels: {
                ...state.channels,
                dataBySpace: {
                  ...state.channels.dataBySpace,
                  [key]: {
                    ...channelsData,
                    configuredChannels: {
                      ...configuredChannels,
                      [channelId]: channelData === null
                        ? undefined
                        : {
                            ...configuredChannels[channelId],
                            ...channelData,
                          },
                    },
                  },
                },
              },
            };
          }),

          updateChannelConfigForSpace: (spaceKey, channelId, configData) => set((state) => {
            const key = normalizeChannelSpaceKey(spaceKey);
            if (key === 'workspaces') {
              return {
                channels: patchSecondaryChannelSpace(state, (channelsData) => {
                  const channelConfigs = channelsData.channelConfigs || {};
                  return {
                    ...channelsData,
                    channelConfigs: {
                      ...channelConfigs,
                      [channelId]: configData === null
                        ? undefined
                        : {
                            ...channelConfigs[channelId],
                            ...configData,
                          },
                    },
                  };
                }),
              };
            }
            const channelsData = state.channels?.dataBySpace?.[key] || createDefaultChannelSpaceData();
            const channelConfigs = channelsData.channelConfigs || {};

            return {
              channels: {
                ...state.channels,
                dataBySpace: {
                  ...state.channels.dataBySpace,
                  [key]: {
                    ...channelsData,
                    channelConfigs: {
                      ...channelConfigs,
                      [channelId]: configData === null
                        ? undefined
                        : {
                            ...channelConfigs[channelId],
                            ...configData,
                          },
                    },
                  },
                },
              },
            };
          }),

          /**
           * Move slot `fromIndex` → `toIndex` (insert semantics). Updates
           * `configuredChannels` and `channelConfigs` in one atomic write.
           */
          reorderChannelSlotsForSpace: (spaceKey, fromIndex, toIndex) => set((state) => {
            const key = normalizeChannelSpaceKey(spaceKey);
            const channelsData =
              key === 'workspaces'
                ? getSecondaryChannelSpaceData(state.channels)
                : state.channels?.dataBySpace?.[key] || createDefaultChannelSpaceData();
            const navigation = resolveNavigation(channelsData.navigation);
            const grid = resolveGridConfig(channelsData, navigation);
            const n = grid.totalChannels;
            if (fromIndex === toIndex || n <= 0) {
              return state;
            }
            if (fromIndex < 0 || toIndex < 0 || fromIndex >= n || toIndex >= n) {
              return state;
            }
            const { configuredChannels, channelConfigs } = applyChannelSlotReorder({
              fromIndex,
              toIndex,
              totalChannels: n,
              configuredChannels: channelsData.configuredChannels || {},
              channelConfigs: channelsData.channelConfigs || {},
            });
            if (key === 'workspaces') {
              return {
                channels: patchSecondaryChannelSpace(state, (prev) => ({
                  ...prev,
                  configuredChannels,
                  channelConfigs,
                })),
              };
            }
            return {
              channels: {
                ...state.channels,
                dataBySpace: {
                  ...state.channels.dataBySpace,
                  [key]: {
                    ...channelsData,
                    configuredChannels,
                    channelConfigs,
                  },
                },
              },
            };
          }),

          setChannelNavigationForSpace: (spaceKey, updates) => set((state) => {
            const key = normalizeChannelSpaceKey(spaceKey);
            if (key === 'workspaces') {
              return {
                channels: patchSecondaryChannelSpace(state, (channelsData) => ({
                  ...channelsData,
                  navigation: { ...channelsData.navigation, ...updates },
                })),
              };
            }
            const channelsData = state.channels?.dataBySpace?.[key] || createDefaultChannelSpaceData();
            return {
              channels: {
                ...state.channels,
                dataBySpace: {
                  ...state.channels.dataBySpace,
                  [key]: {
                    ...channelsData,
                    navigation: { ...channelsData.navigation, ...updates },
                  },
                },
              },
            };
          }),

          setActiveSecondaryChannelProfileId: (profileId) => set((state) => {
            const profiles = state.channels.secondaryChannelProfiles || {};
            if (!profiles[profileId]) return state;
            const nextChannels = {
              ...state.channels,
              activeSecondaryChannelProfileId: profileId,
            };
            const mirrored = getSecondaryChannelSpaceData(nextChannels);
            return {
              channels: {
                ...nextChannels,
                dataBySpace: {
                  ...nextChannels.dataBySpace,
                  workspaces: mirrored,
                },
              },
            };
          }),

          createSecondaryChannelProfile: (rawName) => set((state) => {
            const profiles = state.channels.secondaryChannelProfiles || {};
            const count = Object.keys(profiles).length;
            if (count >= MAX_SAVED_WORKSPACES) return state;
            const id = `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
            const name =
              typeof rawName === 'string' && rawName.trim()
                ? rawName.trim()
                : `Grid ${count + 1}`;
            return {
              channels: {
                ...state.channels,
                secondaryChannelProfiles: {
                  ...profiles,
                  [id]: {
                    id,
                    name,
                    channelSpace: createDefaultChannelSpaceData(),
                  },
                },
              },
            };
          }),

          renameSecondaryChannelProfile: (profileId, rawName) => set((state) => {
            const profiles = state.channels.secondaryChannelProfiles || {};
            if (!profiles[profileId]) return state;
            const name = typeof rawName === 'string' ? rawName.trim() : '';
            if (!name) return state;
            return {
              channels: {
                ...state.channels,
                secondaryChannelProfiles: {
                  ...profiles,
                  [profileId]: { ...profiles[profileId], name },
                },
              },
            };
          }),

          deleteSecondaryChannelProfile: (profileId) => set((state) => {
            const profiles = { ...(state.channels.secondaryChannelProfiles || {}) };
            const ids = Object.keys(profiles);
            if (ids.length <= 1 || !profiles[profileId]) return state;
            delete profiles[profileId];
            let activeId = state.channels.activeSecondaryChannelProfileId || DEFAULT_SECONDARY_CHANNEL_PROFILE_ID;
            if (activeId === profileId) {
              activeId = Object.keys(profiles)[0];
            }
            const nextChannels = {
              ...state.channels,
              secondaryChannelProfiles: profiles,
              activeSecondaryChannelProfileId: activeId,
            };
            const mirrored = getSecondaryChannelSpaceData(nextChannels);
            return {
              channels: {
                ...nextChannels,
                dataBySpace: {
                  ...nextChannels.dataBySpace,
                  workspaces: mirrored,
                },
              },
            };
          }),

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

          // Workspace actions
          setWorkspacesState: (updates) => set((state) => ({
            workspaces: {
              ...state.workspaces,
              ...updates,
            }
          })),

          setSpacesState: (updates) => set((state) => {
            const nextSpaces = { ...state.spaces, ...updates };
            // Sync last Wii board when shell space changes — not when only `lastChannelSpaceId` is updated
            // (e.g. Channels & layout tab previewing the other board while staying on Home).
            if (
              updates.activeSpaceId !== undefined &&
              (nextSpaces.activeSpaceId === 'home' || nextSpaces.activeSpaceId === 'workspaces')
            ) {
              nextSpaces.lastChannelSpaceId = nextSpaces.activeSpaceId;
            }

            const prevId = state.spaces.activeSpaceId;
            const nextId = nextSpaces.activeSpaceId;

            if (updates.activeSpaceId !== undefined && updates.activeSpaceId !== prevId) {
              const liveCapture = captureSpaceAppearanceFromState(state);
              let appearanceBySpace = {
                ...state.appearanceBySpace,
                [prevId]: liveCapture,
              };
              let incoming = appearanceBySpace[nextId];
              // First visit to a shell space: no saved snapshot yet — seed from current live look
              // so persist/reload keeps per-space appearance instead of leaving `null` forever.
              if (incoming == null) {
                incoming = liveCapture;
                appearanceBySpace = {
                  ...appearanceBySpace,
                  [nextId]: liveCapture,
                };
              }
              const merged = mergeLiveStateFromSpaceAppearance(state, incoming);

              return {
                spaces: nextSpaces,
                appearanceBySpace,
                ...(merged.wallpaper ? { wallpaper: merged.wallpaper } : {}),
                ...(merged.ribbon ? { ribbon: merged.ribbon } : {}),
                ...(merged.time ? { time: merged.time } : {}),
                ...(merged.overlay ? { overlay: merged.overlay } : {}),
                ...(merged.ui ? { ui: merged.ui } : {}),
              };
            }

            return { spaces: nextSpaces };
          }),

          setAppearanceBySpaceState: (updates) => set((state) => ({
            appearanceBySpace: {
              ...state.appearanceBySpace,
              ...updates,
            },
          })),

          setGameHubState: (updates) => set((state) => ({
            gameHub: {
              ...state.gameHub,
              ...updates,
              profile: {
                ...state.gameHub.profile,
                ...(updates?.profile || {}),
              },
              ui: {
                ...state.gameHub.ui,
                ...(updates?.ui || {}),
              },
              library: {
                ...state.gameHub.library,
                ...(updates?.library || {}),
                shelves: {
                  ...state.gameHub.library.shelves,
                  ...(updates?.library?.shelves || {}),
                },
              },
            },
          })),

          /** Merge-safe: avoids dropping other `lastLaunchedAt` entries when shallow-updating library. */
          patchGameHubLastLaunch: (gameId, timestampMs) => set((state) => ({
            gameHub: {
              ...state.gameHub,
              library: {
                ...state.gameHub.library,
                lastLaunchedAt: {
                  ...(state.gameHub.library.lastLaunchedAt || {}),
                  [gameId]: timestampMs,
                },
              },
            },
          })),

          /** Persisted per-game art override (Supabase URL). Pass `null` entry to clear. */
          setGameHubCustomArt: (gameId, entry) => set((state) => {
            const id = String(gameId || '');
            if (!id) return state;
            const prev = state.gameHub.ui.customArtByGameId || {};
            const next = { ...prev };
            if (entry == null || entry === undefined) {
              delete next[id];
            } else {
              next[id] = entry;
            }
            return {
              gameHub: {
                ...state.gameHub,
                ui: { ...state.gameHub.ui, customArtByGameId: next },
              },
            };
          }),

          toggleGameHubFavorite: (gameId) => set((state) => {
            const ids = [...(state.gameHub.ui.favoriteGameIds || [])];
            const idx = ids.indexOf(gameId);
            if (idx >= 0) ids.splice(idx, 1);
            else ids.push(gameId);
            return {
              gameHub: {
                ...state.gameHub,
                ui: { ...state.gameHub.ui, favoriteGameIds: ids },
              },
            };
          }),

          createWeeCollection: (label) => set((state) => {
            const id =
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? `wee-${crypto.randomUUID()}`
                : `wee-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const trimmed = String(label || '').trim() || 'New collection';
            const next = [
              ...(state.gameHub.library.weeCollections || []),
              { id, label: trimmed, gameIds: [] },
            ];
            return {
              gameHub: {
                ...state.gameHub,
                library: { ...state.gameHub.library, weeCollections: next },
              },
            };
          }),

          /** Create a Wee collection and add one game in one update (context menu flow). */
          createWeeCollectionWithGame: (label, gameId) => set((state) => {
            const id =
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? `wee-${crypto.randomUUID()}`
                : `wee-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const trimmed = String(label || '').trim() || 'New collection';
            const gid = gameId != null ? String(gameId) : null;
            const next = [
              ...(state.gameHub.library.weeCollections || []),
              { id, label: trimmed, gameIds: gid ? [gid] : [] },
            ];
            return {
              gameHub: {
                ...state.gameHub,
                library: { ...state.gameHub.library, weeCollections: next },
              },
            };
          }),

          renameWeeCollection: (collectionId, label) => set((state) => {
            const cols = [...(state.gameHub.library.weeCollections || [])];
            const i = cols.findIndex((c) => c.id === collectionId);
            if (i < 0) return state;
            const nextLabel = String(label || '').trim() || cols[i].label;
            cols[i] = { ...cols[i], label: nextLabel };
            return {
              gameHub: {
                ...state.gameHub,
                library: { ...state.gameHub.library, weeCollections: cols },
              },
            };
          }),

          deleteWeeCollection: (collectionId) => set((state) => ({
            gameHub: {
              ...state.gameHub,
              library: {
                ...state.gameHub.library,
                weeCollections: (state.gameHub.library.weeCollections || []).filter((c) => c.id !== collectionId),
              },
            },
          })),

          addGameToWeeCollection: (collectionId, gameId) => set((state) => ({
            gameHub: {
              ...state.gameHub,
              library: {
                ...state.gameHub.library,
                weeCollections: (state.gameHub.library.weeCollections || []).map((c) => {
                  if (c.id !== collectionId) return c;
                  const set = new Set([...(c.gameIds || []), gameId]);
                  return { ...c, gameIds: [...set] };
                }),
              },
            },
          })),

          removeGameFromWeeCollection: (collectionId, gameId) => set((state) => ({
            gameHub: {
              ...state.gameHub,
              library: {
                ...state.gameHub.library,
                weeCollections: (state.gameHub.library.weeCollections || []).map((c) => {
                  if (c.id !== collectionId) return c;
                  return { ...c, gameIds: (c.gameIds || []).filter((g) => g !== gameId) };
                }),
              },
            },
          })),

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
              showWorkspaceSwitcher: false,
              channelOpenHints: {},
              sceneTransition: {
                active: false,
                label: '',
                key: 0,
              },
              motionFeedback: {
                master: DEFAULT_MOTION_FEEDBACK.master,
                channels: { ...DEFAULT_MOTION_FEEDBACK.channels },
                dock: { ...DEFAULT_MOTION_FEEDBACK.dock },
                ribbon: { ...DEFAULT_MOTION_FEEDBACK.ribbon },
              },
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
              ribbonHoverAnimationEnabled: true,
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
              dataBySpace: {
                home: createDefaultChannelSpaceData(),
                workspaces: createDefaultChannelSpaceData(),
              },
              secondaryChannelProfiles: {
                [DEFAULT_SECONDARY_CHANNEL_PROFILE_ID]: {
                  id: DEFAULT_SECONDARY_CHANNEL_PROFILE_ID,
                  name: 'Second',
                  channelSpace: createDefaultChannelSpaceData(),
                },
              },
              activeSecondaryChannelProfileId: DEFAULT_SECONDARY_CHANNEL_PROFILE_ID,
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
            workspaces: {
              items: [],
              activeWorkspaceId: null,
            },
            spaces: {
              activeSpaceId: 'home',
              lastChannelSpaceId: 'home',
              order: ['workspaces', 'home', 'gamehub'],
              isTransitioning: false,
              autoHideRail: true,
              railPinned: false,
              railVisible: false,
            },
            appearanceBySpace: {
              home: null,
              workspaces: null,
              gamehub: null,
            },
            gameHub: {
              profile: {
                steamId: '',
                useSteamWebApi: true,
                onboardingDismissed: false,
              },
              ui: {
                selectedGameId: null,
                activeShelf: 'recentlyPlayed',
                searchQuery: '',
                showDetails: false,
                launchingGameId: null,
                showHubBackdrop: false,
                hubSteamOnlyGames: true,
                effectsEnabled: true,
                activeCollectionId: null,
                favoriteGameIds: [],
                hubShelfOrderMode: 'custom',
                collectionShelfOrder: null,
                hubLibrarySort: 'default',
                hubCollectionGamesSort: 'default',
                customArtByGameId: {},
              },
              library: {
                enrichedGames: [],
                shelves: {
                  recentlyPlayed: [],
                  mostPlayed: [],
                  installed: [],
                  readyToLaunch: [],
                },
                syncStatus: 'idle',
                lastSyncedAt: null,
                lastError: null,
                lastEnrichedSteamId: '',
                weeCollections: [],
                lastLaunchedAt: {},
              },
            },
          }),
        },
      })
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
