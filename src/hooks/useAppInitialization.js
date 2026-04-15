import { useEffect } from 'react';
import { electronApi } from '../utils/electronApi';
import { normalizeChannelPayload } from '../utils/store/storeContracts';
import { normalizeUnifiedSettingsSnapshot } from '../utils/store/settingsPersistenceContract';
import { mergeMotionFeedback } from '../utils/motionFeedbackDefaults';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

export const useAppInitialization = ({
  setAppState,
  setWallpaperState,
  setOverlayState,
  setChannelState,
  setChannelData,
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
          if (normalizedChannelPayload.settings) {
            setChannelState({ settings: normalizedChannelPayload.settings });
          }
          if (normalizedChannelPayload.data) {
            setChannelData(normalizedChannelPayload.data);
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
            if (normalizedSettingsChannels.settings) {
              setChannelState({ settings: normalizedSettingsChannels.settings });
            }
            if (normalizedSettingsChannels.data) {
              setChannelData(normalizedSettingsChannels.data);
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
          if (resolvedSettings.spaces) setSpacesState(resolvedSettings.spaces);
          if (resolvedSettings.gameHub) setGameHubState(resolvedSettings.gameHub);
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
    setChannelData,
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
