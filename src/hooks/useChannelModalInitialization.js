import { useEffect } from 'react';

export const useChannelModalInitialization = ({
  isOpen,
  channelId,
  configuredChannels,
  channelConfigs,
  setPath,
  setPathError,
  setShowError,
  setMedia,
  setHoverSound,
  setAnimatedOnHover,
  setKenBurnsEnabled,
  setKenBurnsMode,
  setKenBurnsHoverScale,
  setKenBurnsAutoplayScale,
  setKenBurnsHoverDuration,
  setKenBurnsAutoplayDuration,
  setKenBurnsCrossfadeDuration,
  setKenBurnsEasing,
  setAsAdmin,
  setSelectedGameFeedback,
  installedAppsLength,
  uwpAppsLength,
  steamGamesLength,
  epicGamesLength,
  appsLoading,
  uwpLoading,
  steamLoading,
  epicLoading,
  customSteamPath,
  loadSoundLibrary,
  fetchInstalledApps,
  fetchUwpApps,
  fetchSteamGames,
  fetchEpicGames,
  preloadMediaLibrary,
}) => {
  useEffect(() => {
    if (!isOpen) {
      setSelectedGameFeedback(null);
    }
  }, [isOpen, setSelectedGameFeedback]);

  useEffect(() => {
    if (!channelId) return;

    setPath('');
    setPathError('');
    setShowError(false);
    setMedia(null);
    setHoverSound(null);
    setAnimatedOnHover('none');
    setKenBurnsEnabled(false);
    setKenBurnsMode('hover');
    setKenBurnsHoverScale(1.1);
    setKenBurnsAutoplayScale(1.15);
    setKenBurnsHoverDuration(8000);
    setKenBurnsAutoplayDuration(12000);
    setKenBurnsCrossfadeDuration(1000);
    setKenBurnsEasing('ease-out');
    setAsAdmin(false);

    const existingChannel = configuredChannels[channelId];
    if (!existingChannel) return;

    setPath(existingChannel.path || '');
    setMedia(existingChannel.media || null);
    setHoverSound(existingChannel.hoverSound || null);
    setAnimatedOnHover(existingChannel.animation || 'none');
    setAsAdmin(existingChannel.asAdmin || false);

    const channelConfig = channelConfigs[channelId];
    if (!channelConfig) return;

    setKenBurnsEnabled(channelConfig.kenBurnsEnabled ?? false);
    setKenBurnsMode(channelConfig.kenBurnsMode ?? 'hover');
    setKenBurnsHoverScale(channelConfig.kenBurnsHoverScale ?? 1.1);
    setKenBurnsAutoplayScale(channelConfig.kenBurnsAutoplayScale ?? 1.15);
    setKenBurnsHoverDuration(channelConfig.kenBurnsHoverDuration ?? 8000);
    setKenBurnsAutoplayDuration(channelConfig.kenBurnsAutoplayDuration ?? 12000);
    setKenBurnsCrossfadeDuration(channelConfig.kenBurnsCrossfadeDuration ?? 1000);
    setKenBurnsEasing(channelConfig.kenBurnsEasing ?? 'ease-out');
  }, [
    channelId,
    configuredChannels,
    channelConfigs,
    setPath,
    setPathError,
    setShowError,
    setMedia,
    setHoverSound,
    setAnimatedOnHover,
    setKenBurnsEnabled,
    setKenBurnsMode,
    setKenBurnsHoverScale,
    setKenBurnsAutoplayScale,
    setKenBurnsHoverDuration,
    setKenBurnsAutoplayDuration,
    setKenBurnsCrossfadeDuration,
    setKenBurnsEasing,
    setAsAdmin,
  ]);

  useEffect(() => {
    if (isOpen && window.api) {
      if (installedAppsLength === 0 && window.api.apps?.getInstalled) {
        window.api.apps.getInstalled();
      }
      if (uwpAppsLength === 0 && window.api.uwp?.listApps) {
        window.api.uwp.listApps();
      }
      if (steamGamesLength === 0 && window.api.steam?.getInstalledGames) {
        window.api.steam.getInstalledGames();
      }
      if (epicGamesLength === 0 && window.api.epic?.getInstalledGames) {
        window.api.epic.getInstalledGames();
      }
      preloadMediaLibrary();
    }
  }, [isOpen, installedAppsLength, uwpAppsLength, steamGamesLength, epicGamesLength, preloadMediaLibrary]);

  useEffect(() => {
    if (!isOpen) return;

    if (loadSoundLibrary) {
      loadSoundLibrary();
    }

    if (installedAppsLength === 0 && !appsLoading && fetchInstalledApps) {
      fetchInstalledApps();
    }
    if (uwpAppsLength === 0 && !uwpLoading && fetchUwpApps) {
      fetchUwpApps();
    }
    if (steamGamesLength === 0 && !steamLoading && fetchSteamGames) {
      fetchSteamGames(customSteamPath);
    }
    if (epicGamesLength === 0 && !epicLoading && fetchEpicGames) {
      fetchEpicGames();
    }

    preloadMediaLibrary();
  }, [
    isOpen,
    installedAppsLength,
    appsLoading,
    uwpAppsLength,
    uwpLoading,
    steamGamesLength,
    steamLoading,
    epicGamesLength,
    epicLoading,
    customSteamPath,
    loadSoundLibrary,
    fetchInstalledApps,
    fetchUwpApps,
    fetchSteamGames,
    fetchEpicGames,
    preloadMediaLibrary,
  ]);
};
