import { useEffect } from 'react';
import { electronApi } from '../utils/electronApi';
import { normalizeChannelPayload } from '../utils/store/storeContracts';
import {
  mergeChannelsSlice,
  normalizeUnifiedSettingsSnapshot,
} from '../utils/store/settingsPersistenceContract';
import { normalizeShellSpaceOrder } from '../utils/channelSpaces';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { createSeededWorkspaceState } from '../utils/workspaces/workspaceState';
import { weeMeasureAsync, weeMarkStartupHydrationCommitted } from '../utils/weePerformanceMarks';

const CLEAN_FOUNDATION_VERSION = 1;

function buildChannelPatchFromNormalized(normalized) {
  if (!normalized) return null;
  const channelPatch = {};
  if (normalized.settings && Object.keys(normalized.settings).length > 0) {
    channelPatch.settings = normalized.settings;
  }
  if (normalized.data && Object.keys(normalized.data).length > 0) {
    channelPatch.data = normalized.data;
  }
  if (normalized.dataBySpace) {
    channelPatch.dataBySpace = normalized.dataBySpace;
  }
  if (normalized.secondaryChannelProfiles) {
    channelPatch.secondaryChannelProfiles = normalized.secondaryChannelProfiles;
  }
  if (normalized.activeSecondaryChannelProfileId != null) {
    channelPatch.activeSecondaryChannelProfileId = normalized.activeSecondaryChannelProfileId;
  }
  return Object.keys(channelPatch).length > 0 ? channelPatch : null;
}

export const useAppInitialization = () => {
  useEffect(() => {
    let cancelled = false;

    const initializeApp = async () => {
      try {
        if (cancelled) return;

        const unifiedData = await weeMeasureAsync('ipc-unified-data-get', () => electronApi.getUnifiedData());
        const [wallpaperData] = await Promise.all([
          weeMeasureAsync('ipc-wallpapers-get', () => electronApi.getWallpapers()),
        ]);

        const resolvedSettings = normalizeUnifiedSettingsSnapshot(unifiedData?.settings || {});
        const resolvedWallpaperData = unifiedData?.wallpapers || wallpaperData;
        const resolvedChannelData = unifiedData?.channels;
        const shouldHardResetLegacySavedModes =
          Number(unifiedData?.meta?.cleanFoundationVersion || 0) < CLEAN_FOUNDATION_VERSION;

        const { channels: initialChannels } = useConsolidatedAppStore.getState();
        let mergedChannels = initialChannels;

        if (resolvedChannelData) {
          const normalizedChannelPayload = normalizeChannelPayload(resolvedChannelData);
          const unifiedPatch = buildChannelPatchFromNormalized(normalizedChannelPayload);
          if (unifiedPatch) mergedChannels = mergeChannelsSlice(mergedChannels, unifiedPatch);
        }

        /** @type {Record<string, unknown>} */
        const slices = {
          app: {
            appReady: true,
            isLoading: false,
            startupHydrationCommitted: true,
            splashFading: false,
          },
        };

        if (!cancelled && resolvedWallpaperData) {
          slices.wallpaper = {
            current: resolvedWallpaperData.wallpaper || null,
            savedWallpapers: resolvedWallpaperData.savedWallpapers || [],
            likedWallpapers: resolvedWallpaperData.likedWallpapers || [],
            opacity: resolvedWallpaperData.wallpaperOpacity ?? 1,
            blur: resolvedWallpaperData.wallpaperBlur ?? 0,
            workspaceBrightness: resolvedWallpaperData.wallpaperWorkspaceBrightness ?? 1,
            workspaceSaturate: resolvedWallpaperData.wallpaperWorkspaceSaturate ?? 1,
            gameHubBrightness: resolvedWallpaperData.wallpaperGameHubBrightness ?? 0.78,
            gameHubSaturate: resolvedWallpaperData.wallpaperGameHubSaturate ?? 1,
            cycleWallpapers: resolvedWallpaperData.cyclingSettings?.enabled ?? false,
            cycleInterval: resolvedWallpaperData.cyclingSettings?.interval ?? 30,
            cycleAnimation: resolvedWallpaperData.cyclingSettings?.animation ?? 'fade',
            slideDirection: resolvedWallpaperData.cyclingSettings?.slideDirection ?? 'right',
            crossfadeDuration: resolvedWallpaperData.cyclingSettings?.crossfadeDuration ?? 1.2,
            crossfadeEasing: resolvedWallpaperData.cyclingSettings?.crossfadeEasing ?? 'ease-out',
            slideRandomDirection: resolvedWallpaperData.cyclingSettings?.slideRandomDirection ?? false,
            slideDuration: resolvedWallpaperData.cyclingSettings?.slideDuration ?? 1.5,
            slideEasing: resolvedWallpaperData.cyclingSettings?.slideEasing ?? 'ease-out',
          };

          slices.overlay = {
            enabled: resolvedWallpaperData.overlayEnabled ?? false,
            effect: resolvedWallpaperData.overlayEffect ?? 'snow',
            intensity: resolvedWallpaperData.overlayIntensity ?? 50,
            speed: resolvedWallpaperData.overlaySpeed ?? 1,
            wind: resolvedWallpaperData.overlayWind ?? 0.02,
            gravity: resolvedWallpaperData.overlayGravity ?? 0.1,
          };
        }

        if (!cancelled && resolvedSettings) {
          if (resolvedSettings.ui) {
            slices.ui = resolvedSettings.ui;
          }
          if (resolvedSettings.ribbon) slices.ribbon = resolvedSettings.ribbon;
          if (resolvedSettings.wallpaper) {
            slices.wallpaper = { ...(slices.wallpaper || {}), ...resolvedSettings.wallpaper };
          }
          if (resolvedSettings.overlay) {
            slices.overlay = { ...(slices.overlay || {}), ...resolvedSettings.overlay };
          }
          if (resolvedSettings.channels) {
            const normalizedSettingsChannels = normalizeChannelPayload(resolvedSettings.channels);
            const settingsPatch = buildChannelPatchFromNormalized(normalizedSettingsChannels);
            if (settingsPatch) mergedChannels = mergeChannelsSlice(mergedChannels, settingsPatch);
          }
          if (resolvedSettings.time) slices.time = resolvedSettings.time;
          if (resolvedSettings.dock) slices.dock = resolvedSettings.dock;
          if (resolvedSettings.sounds) slices.sounds = resolvedSettings.sounds;
          if (resolvedSettings.navigation) slices.navigation = resolvedSettings.navigation;
          if (resolvedSettings.floatingWidgets) slices.floatingWidgets = resolvedSettings.floatingWidgets;
          if (resolvedSettings.monitors) slices.monitors = resolvedSettings.monitors;
          if (resolvedSettings.spotify) slices.spotify = resolvedSettings.spotify;
          if (!shouldHardResetLegacySavedModes && resolvedSettings.presets) {
            slices.presets = resolvedSettings.presets;
          }
          if (!shouldHardResetLegacySavedModes && resolvedSettings.workspaces) {
            slices.workspaces = resolvedSettings.workspaces;
          }
          if (resolvedSettings.spaces) {
            slices.spaces = {
              ...resolvedSettings.spaces,
              order: normalizeShellSpaceOrder(resolvedSettings.spaces.order),
              isTransitioning: resolvedSettings.spaces.isTransitioning ?? false,
            };
          }
          if (resolvedSettings.appearanceBySpace) {
            slices.appearanceBySpace = resolvedSettings.appearanceBySpace;
          }
          if (resolvedSettings.gameHub) slices.gameHub = resolvedSettings.gameHub;
          if (resolvedSettings.mediaHub) slices.mediaHub = resolvedSettings.mediaHub;
        }

        if (mergedChannels !== initialChannels) {
          slices.channelsSnapshot = mergedChannels;
        }

        if (shouldHardResetLegacySavedModes) {
          slices.presets = [];
          slices.workspaces = createSeededWorkspaceState();
        }

        /* Never cold-start on hub spaces: restore Home (persisted in lastChannelSpaceId). */
        if (!cancelled && slices.spaces && ['gamehub', 'mediahub'].includes(slices.spaces.activeSpaceId)) {
          slices.spaces = { ...slices.spaces, activeSpaceId: 'home', lastChannelSpaceId: 'home' };
        }

        if (!cancelled) {
          useConsolidatedAppStore.getState().actions.applyStartupHydration(slices);
          if (
            shouldHardResetLegacySavedModes &&
            typeof window !== 'undefined' &&
            window.api?.data?.get &&
            window.api?.data?.set
          ) {
            try {
              const latestUnified = await window.api.data.get();
              await window.api.data.set({
                ...(latestUnified || {}),
                meta: {
                  ...(latestUnified?.meta || {}),
                  cleanFoundationVersion: CLEAN_FOUNDATION_VERSION,
                },
              });
            } catch (metaError) {
              console.warn('[AppInitialization] Failed to persist clean foundation marker:', metaError);
            }
          }
          weeMarkStartupHydrationCommitted();
        }
      } catch (error) {
        console.error('[AppInitialization] Failed to initialize app:', error);
        if (!cancelled) {
          useConsolidatedAppStore.getState().actions.setAppState({
            appReady: true,
            isLoading: false,
            startupHydrationCommitted: true,
            splashFading: false,
          });
        }
      }
    };

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, []);
};
