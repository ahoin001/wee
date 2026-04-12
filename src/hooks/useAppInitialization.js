import { useEffect } from 'react';
import { electronApi } from '../utils/electronApi';
import { normalizeChannelPayload } from '../utils/store/storeContracts';

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
}) => {
  useEffect(() => {
    let cancelled = false;

    const initializeApp = async () => {
      try {
        if (cancelled) return;

        const unifiedData = await electronApi.getUnifiedData();
        const [wallpaperData, channelData, settingsData] = await Promise.all([
          electronApi.getWallpapers(),
          electronApi.getChannels(),
          electronApi.getSettings(),
        ]);

        // Unified data is authoritative when available.
        const resolvedSettings = unifiedData?.settings || settingsData;
        const resolvedWallpaperData = unifiedData?.wallpapers || wallpaperData;
        const resolvedChannelData = unifiedData?.channels || channelData;

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
          if (resolvedSettings.ui) setUIState(resolvedSettings.ui);
          if (resolvedSettings.ribbon) setRibbonState(resolvedSettings.ribbon);
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
          if (resolvedSettings.presets) setPresets(resolvedSettings.presets);
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
  ]);
};
