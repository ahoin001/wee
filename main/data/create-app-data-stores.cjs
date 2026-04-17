function createAppDataStores({
  fsPromises,
  ensureDataDir,
  paths,
  mediaIndex,
}) {
  const { wallpapersFile, channelsFile, unifiedDataFile } = paths;
  const { hydrateWallpapersFromIndex, backfillWallpaperIndex } = mediaIndex;

  const SETTINGS_SCHEMA_VERSION = 2;
  const isObjectRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const asObjectRecord = (value) => (isObjectRecord(value) ? value : {});

  const migrateUnifiedSettingsShape = (settings) => {
    const next = { ...asObjectRecord(settings) };
    const appearance = asObjectRecord(next.appearance);
    const dock = asObjectRecord(next.dock);
    const system = asObjectRecord(next.system);
    const wallpaper = asObjectRecord(next.wallpaper);
    const cycling = asObjectRecord(wallpaper.cycling);
    const overlay = asObjectRecord(wallpaper.overlay);

    if (!isObjectRecord(next.ui)) {
      next.ui = {
        isDarkMode: appearance.theme === 'dark',
        useCustomCursor: appearance.useCustomCursor ?? true,
        cursorStyle: appearance.cursorStyle ?? 'classic',
        immersivePip: appearance.immersivePip ?? false,
        startInFullscreen: appearance.startInFullscreen ?? false,
        showPresetsButton: appearance.showPresetsButton ?? false,
        startOnBoot: system.startOnBoot ?? false,
        settingsShortcut: system.settingsShortcut ?? '',
        lowPowerMode: system.lowPowerMode ?? false,
        showDock: dock.showDock ?? true,
        classicMode: dock.classicMode ?? false,
        spotifyMatchEnabled: appearance.spotifyMatchEnabled ?? false,
      };
    }

    if (isObjectRecord(next.wallpaper) && isObjectRecord(next.wallpaper.cycling)) {
      next.wallpaper = {
        ...next.wallpaper,
        cycleWallpapers: next.wallpaper.cycleWallpapers ?? cycling.enabled ?? false,
        cycleInterval: next.wallpaper.cycleInterval ?? cycling.interval ?? 30,
        cycleAnimation: next.wallpaper.cycleAnimation ?? cycling.animation ?? 'fade',
        slideDirection: next.wallpaper.slideDirection ?? cycling.slideDirection ?? 'right',
        crossfadeDuration: next.wallpaper.crossfadeDuration ?? cycling.crossfadeDuration ?? 1.2,
        crossfadeEasing: next.wallpaper.crossfadeEasing ?? cycling.crossfadeEasing ?? 'ease-out',
        slideRandomDirection: next.wallpaper.slideRandomDirection ?? cycling.slideRandomDirection ?? false,
        slideDuration: next.wallpaper.slideDuration ?? cycling.slideDuration ?? 1.5,
        slideEasing: next.wallpaper.slideEasing ?? cycling.slideEasing ?? 'ease-out',
      };
    }

    if (!isObjectRecord(next.overlay) && isObjectRecord(overlay)) {
      next.overlay = {
        enabled: overlay.enabled ?? false,
        effect: overlay.effect ?? 'snow',
        intensity: overlay.intensity ?? 50,
        speed: overlay.speed ?? 1,
        wind: overlay.wind ?? 0.02,
        gravity: overlay.gravity ?? 0.1,
      };
    }

    if (Object.keys(appearance).length > 0) delete next.appearance;
    if (Object.keys(system).length > 0) delete next.system;
    return next;
  };

  const normalizeUnifiedDataShape = (data) => {
    const normalized = { ...asObjectRecord(data) };
    normalized.settings = migrateUnifiedSettingsShape(normalized.settings);
    normalized.meta = {
      ...asObjectRecord(normalized.meta),
      settingsSchemaVersion: SETTINGS_SCHEMA_VERSION,
    };
    return normalized;
  };

  const wallpapersData = {
    async get() {
      await ensureDataDir();
      try {
        const data = JSON.parse(await fsPromises.readFile(wallpapersFile, 'utf-8'));
        const originalSavedWallpapers = Array.isArray(data.savedWallpapers) ? data.savedWallpapers : [];
        const hydratedWallpapers = hydrateWallpapersFromIndex(originalSavedWallpapers);
        const backfilledWallpapers = await backfillWallpaperIndex(hydratedWallpapers);
        data.savedWallpapers = backfilledWallpapers;
        if (JSON.stringify(originalSavedWallpapers) !== JSON.stringify(backfilledWallpapers)) {
          await fsPromises.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
        }
        console.log('[WALLPAPERS] Successfully loaded wallpaper data:', Object.keys(data));
        return data;
      } catch (error) {
        console.warn('[WALLPAPERS] Failed to load wallpaper data, using defaults:', error.message);
        return {
          savedWallpapers: [],
          likedWallpapers: [],
          wallpaper: null,
          wallpaperOpacity: 1,
          wallpaperBlur: 0,
          wallpaperWorkspaceBrightness: 1,
          wallpaperWorkspaceSaturate: 1,
          wallpaperGameHubBrightness: 0.78,
          wallpaperGameHubSaturate: 1,
          cyclingSettings: {
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
          overlayEnabled: false,
          overlayEffect: 'snow',
          overlayIntensity: 50,
          overlaySpeed: 1,
          overlayWind: 0.02,
          overlayGravity: 0.1,
          monitorWallpapers: {},
          monitorSettings: {},
        };
      }
    },
    async set(data) {
      await ensureDataDir();
      await fsPromises.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
    },
    async reset() {
      await this.set({
        savedWallpapers: [],
        likedWallpapers: [],
        wallpaper: null,
        wallpaperOpacity: 1,
        wallpaperBlur: 0,
        wallpaperWorkspaceBrightness: 1,
        wallpaperWorkspaceSaturate: 1,
        wallpaperGameHubBrightness: 0.78,
        wallpaperGameHubSaturate: 1,
        cyclingSettings: {
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
        overlayEnabled: false,
        overlayEffect: 'snow',
        overlayIntensity: 50,
        overlaySpeed: 1,
        overlayWind: 0.02,
        overlayGravity: 0.1,
      });
    },
  };

  const channelsData = {
    async get() {
      await ensureDataDir();
      try {
        const data = JSON.parse(await fsPromises.readFile(channelsFile, 'utf-8'));
        console.log('[CHANNELS] Successfully loaded channel data:', Object.keys(data));
        return data;
      } catch (error) {
        console.warn('[CHANNELS] Failed to load channel data, using defaults:', error.message);
        return { channels: [] };
      }
    },
    async set(data) {
      await ensureDataDir();
      await fsPromises.writeFile(channelsFile, JSON.stringify(data, null, 2), 'utf-8');
    },
    async reset() {
      await this.set({ channels: [] });
    },
  };

  const unifiedData = {
    async get() {
      await ensureDataDir();
      try {
        const data = JSON.parse(await fsPromises.readFile(unifiedDataFile, 'utf-8'));
        console.log('[UNIFIED-DATA] Successfully loaded unified data');
        const normalizedData = normalizeUnifiedDataShape(data);
        if (JSON.stringify(normalizedData) !== JSON.stringify(data)) {
          await fsPromises.writeFile(unifiedDataFile, JSON.stringify(normalizedData, null, 2), 'utf-8');
          console.log('[UNIFIED-DATA] Migrated settings data to schema version', SETTINGS_SCHEMA_VERSION);
        }
        return normalizedData;
      } catch (error) {
        console.warn('[UNIFIED-DATA] Failed to load unified data, using defaults:', error.message);
        const normalizedDefaults = normalizeUnifiedDataShape({
          settings: {
            appearance: {
              theme: 'light',
              useCustomCursor: false,
              cursorStyle: 'classic',
              immersivePip: false,
              startInFullscreen: false,
              showPresetsButton: true,
            },
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
              autoFadeTimeout: 5,
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
              opacity: 1,
              blur: 0,
              workspaceBrightness: 1,
              workspaceSaturate: 1,
              gameHubBrightness: 0.78,
              gameHubSaturate: 1,
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
            },
            time: {
              color: '#ffffff',
              recentColors: [],
              enablePill: true,
              pillBlur: 8,
              pillOpacity: 0.05,
              font: 'default',
            },
            dock: {
              showDock: true,
              classicMode: false,
              podHoverEnabled: true,
              podHoverDistance: 15,
              podHoverDuration: 0.3,
              podHoverEasing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
              buttonHoverEnabled: true,
              buttonHoverScale: 1.05,
              buttonHoverBrightness: 1.1,
              buttonActiveScale: 0.95,
              buttonActiveBrightness: 0.9,
              sdCardHoverEnabled: true,
              sdCardHoverScale: 1.1,
              sdCardHoverBrightness: 1.2,
              sdCardGlowEnabled: true,
              sdCardGlowColor: '#33BEED',
              sdCardGlowStrength: 0.6,
              glassEnabled: false,
              glassOpacity: 0.18,
              glassBlur: 2.5,
              glassBorderOpacity: 0.5,
              glassShineOpacity: 0.7,
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
            system: {
              startOnBoot: false,
              settingsShortcut: '',
              showDock: true,
            },
          },
          content: {
            channels: [],
            wallpapers: {
              saved: [],
              liked: [],
              active: null,
            },
            sounds: {
              backgroundMusic: [],
              channelClick: [],
              channelHover: [],
              startup: [],
            },
            presets: [],
            icons: [],
          },
        });
        return normalizedDefaults;
      }
    },
    async set(data) {
      await ensureDataDir();
      const normalizedData = normalizeUnifiedDataShape(data);
      await fsPromises.writeFile(unifiedDataFile, JSON.stringify(normalizedData, null, 2), 'utf-8');
      console.log('[UNIFIED-DATA] Successfully saved unified data');
    },
    async reset() {
      const defaultData = await this.get();
      await this.set(defaultData);
    },
  };

  const getUnifiedIcons = async () => {
    const data = await unifiedData.get();
    const icons = data?.content?.icons;
    return Array.isArray(icons) ? icons : [];
  };

  const saveUnifiedIcons = async (icons) => {
    const data = await unifiedData.get();
    const content = asObjectRecord(data?.content);
    await unifiedData.set({
      ...data,
      content: {
        ...content,
        icons: Array.isArray(icons) ? icons : [],
      },
    });
  };

  return {
    wallpapersData,
    channelsData,
    unifiedData,
    getUnifiedIcons,
    saveUnifiedIcons,
  };
}

module.exports = {
  createAppDataStores,
};
