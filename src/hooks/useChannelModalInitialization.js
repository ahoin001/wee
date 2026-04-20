import { useEffect } from 'react';

export const useChannelModalInitialization = ({
  isOpen = true,
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
    if (!isOpen || !channelId) return;

    setPath('');
    setPathError('');
    setShowError(false);
    setMedia(null);
    setHoverSound(null);
    setAnimatedOnHover('global');
    setKenBurnsEnabled('global');
    setKenBurnsMode('global');
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
    setAnimatedOnHover(existingChannel.animatedOnHover ?? 'global');
    setAsAdmin(existingChannel.asAdmin ?? false);

    const channelConfig = channelConfigs[channelId];
    if (!channelConfig) return;

    setKenBurnsEnabled(channelConfig.kenBurnsEnabled ?? 'global');
    setKenBurnsMode(channelConfig.kenBurnsMode ?? 'global');
    setKenBurnsHoverScale(channelConfig.kenBurnsHoverScale ?? 1.1);
    setKenBurnsAutoplayScale(channelConfig.kenBurnsAutoplayScale ?? 1.15);
    setKenBurnsHoverDuration(channelConfig.kenBurnsHoverDuration ?? 8000);
    setKenBurnsAutoplayDuration(channelConfig.kenBurnsAutoplayDuration ?? 12000);
    setKenBurnsCrossfadeDuration(channelConfig.kenBurnsCrossfadeDuration ?? 1000);
    setKenBurnsEasing(channelConfig.kenBurnsEasing ?? 'ease-out');
  }, [
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
  ]);

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
