import { useEffect } from 'react';
import { electronApi } from '../utils/electronApi';
import { normalizeChannelPayload } from '../utils/store/storeContracts';
import { normalizeUnifiedSettingsSnapshot } from '../utils/store/settingsPersistenceContract';
import { normalizeShellSpaceOrder } from '../utils/channelSpaces';
import { mergeMotionFeedback } from '../utils/motionFeedbackDefaults';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

export const useAppInitialization = ({
  setAppState,
  setWallpaperState,
  setOverlayState,
  setChannelState,
  setUIState,
  setRibbonState,
  setTimeState,
  setDockState,
  setSoundsState,
  setPresets,
  setWorkspacesState,
  setSpacesState,
  setGameHubState,
}) => {
  useEffect(() => {
    let cancelled = false;

    const initializeApp = async () => {
      try {
        if (cancelled) return;

        const unifiedData = await electronApi.getUnifiedData();
        const [wallpaperData] = await Promise.all([
          electronApi.getWallpapers(),
        ]);

        const resolvedSettings = normalizeUnifiedSettingsSnapshot(unifiedData?.settings || {});
        const resolvedWallpaperData = unifiedData?.wallpapers || wallpaperData;
        const resolvedChannelData = unifiedData?.channels;

        setAppState({
          appReady: true,
          isLoading: false,
          splashFading: false,
        });

        if (!cancelled && resolvedWallpaperData) {
          setWallpaperState({
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
          });

          setOverlayState({
            enabled: resolvedWallpaperData.overlayEnabled ?? false,
            effect: resolvedWallpaperData.overlayEffect ?? 'snow',
            intensity: resolvedWallpaperData.overlayIntensity ?? 50,
            speed: resolvedWallpaperData.overlaySpeed ?? 1,
            wind: resolvedWallpaperData.overlayWind ?? 0.02,
            gravity: resolvedWallpaperData.overlayGravity ?? 0.1,
          });
        }

        if (!cancelled && resolvedChannelData) {
          const normalizedChannelPayload = normalizeChannelPayload(resolvedChannelData);
          if (normalizedChannelPayload.settings && Object.keys(normalizedChannelPayload.settings).length > 0) {
            setChannelState({ settings: normalizedChannelPayload.settings });
          }
          const channelPatch = {};
          if (normalizedChannelPayload.data && Object.keys(normalizedChannelPayload.data).length > 0) {
            channelPatch.data = normalizedChannelPayload.data;
          }
          if (normalizedChannelPayload.dataBySpace) {
            channelPatch.dataBySpace = normalizedChannelPayload.dataBySpace;
          }
          if (normalizedChannelPayload.secondaryChannelProfiles) {
            channelPatch.secondaryChannelProfiles = normalizedChannelPayload.secondaryChannelProfiles;
          }
          if (normalizedChannelPayload.activeSecondaryChannelProfileId != null) {
            channelPatch.activeSecondaryChannelProfileId =
              normalizedChannelPayload.activeSecondaryChannelProfileId;
          }
          if (Object.keys(channelPatch).length > 0) {
            setChannelState(channelPatch);
          }
        }

        if (!cancelled && resolvedSettings) {
          if (resolvedSettings.ui) {
            setUIState((prev) => ({
              ...prev,
              ...resolvedSettings.ui,
              motionFeedback: mergeMotionFeedback(
                resolvedSettings.ui.motionFeedback ?? prev.motionFeedback
              ),
            }));
          }
          if (resolvedSettings.ribbon) setRibbonState(resolvedSettings.ribbon);
          if (resolvedSettings.wallpaper) setWallpaperState(resolvedSettings.wallpaper);
          if (resolvedSettings.overlay) setOverlayState(resolvedSettings.overlay);
          if (resolvedSettings.channels) {
            const normalizedSettingsChannels = normalizeChannelPayload(resolvedSettings.channels);
            if (normalizedSettingsChannels.settings && Object.keys(normalizedSettingsChannels.settings).length > 0) {
              setChannelState({ settings: normalizedSettingsChannels.settings });
            }
            const settingsChannelPatch = {};
            if (normalizedSettingsChannels.data && Object.keys(normalizedSettingsChannels.data).length > 0) {
              settingsChannelPatch.data = normalizedSettingsChannels.data;
            }
            if (normalizedSettingsChannels.dataBySpace) {
              settingsChannelPatch.dataBySpace = normalizedSettingsChannels.dataBySpace;
            }
            if (normalizedSettingsChannels.secondaryChannelProfiles) {
              settingsChannelPatch.secondaryChannelProfiles = normalizedSettingsChannels.secondaryChannelProfiles;
            }
            if (normalizedSettingsChannels.activeSecondaryChannelProfileId != null) {
              settingsChannelPatch.activeSecondaryChannelProfileId =
                normalizedSettingsChannels.activeSecondaryChannelProfileId;
            }
            if (Object.keys(settingsChannelPatch).length > 0) {
              setChannelState(settingsChannelPatch);
            }
          }
          if (resolvedSettings.time) setTimeState(resolvedSettings.time);
          if (resolvedSettings.dock) setDockState(resolvedSettings.dock);
          if (resolvedSettings.sounds) setSoundsState(resolvedSettings.sounds);
          if (resolvedSettings.navigation) {
            const { setNavigationState } = useConsolidatedAppStore.getState().actions;
            setNavigationState(resolvedSettings.navigation);
          }
          if (resolvedSettings.floatingWidgets) {
            const { setFloatingWidgetsState } = useConsolidatedAppStore.getState().actions;
            setFloatingWidgetsState(resolvedSettings.floatingWidgets);
          }
          if (resolvedSettings.monitors) {
            const { setMonitorState } = useConsolidatedAppStore.getState().actions;
            setMonitorState(resolvedSettings.monitors);
          }
          if (resolvedSettings.spotify) {
            const { setSpotifyState } = useConsolidatedAppStore.getState().actions;
            setSpotifyState(resolvedSettings.spotify);
          }
          if (resolvedSettings.presets) setPresets(resolvedSettings.presets);
          if (resolvedSettings.workspaces) setWorkspacesState(resolvedSettings.workspaces);
          if (resolvedSettings.spaces) {
            setSpacesState({
              ...resolvedSettings.spaces,
              order: normalizeShellSpaceOrder(resolvedSettings.spaces.order),
              isTransitioning: resolvedSettings.spaces.isTransitioning ?? false,
            });
          }
          if (resolvedSettings.appearanceBySpace) {
            const { setAppearanceBySpaceState } = useConsolidatedAppStore.getState().actions;
            setAppearanceBySpaceState(resolvedSettings.appearanceBySpace);
          }
          if (resolvedSettings.gameHub) setGameHubState(resolvedSettings.gameHub);

          /* Never cold-start on Game Hub: restore last home/work panel (persisted in lastChannelSpaceId). */
          if (!cancelled) {
            const snap = useConsolidatedAppStore.getState().spaces;
            if (snap.activeSpaceId === 'gamehub') {
              const fallback = snap.lastChannelSpaceId === 'workspaces' ? 'workspaces' : 'home';
              setSpacesState({ activeSpaceId: fallback });
            }
          }
        }
      } catch (error) {
        console.error('[AppInitialization] Failed to initialize app:', error);
        if (!cancelled) {
          setAppState({
            appReady: true,
            isLoading: false,
            splashFading: false,
          });
        }
      }
    };

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, [
    setAppState,
    setWallpaperState,
    setOverlayState,
    setChannelState,
    setUIState,
    setRibbonState,
    setTimeState,
    setDockState,
    setSoundsState,
    setPresets,
    setWorkspacesState,
    setSpacesState,
    setGameHubState,
  ]);
};
