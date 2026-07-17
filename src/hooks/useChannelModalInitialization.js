import { useEffect } from 'react';

/**
 * Reset + hydrate ChannelModal local state when opening a channel.
 * Per-channel motion / Ken Burns / launch-pause are global — not loaded here.
 */
export const useChannelModalInitialization = ({
  isOpen = true,
  channelId,
  configuredChannels,
  setPath,
  setPathError,
  setShowError,
  setMedia,
  setHoverSound,
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
    setAsAdmin(false);

    const existingChannel = configuredChannels[channelId];
    if (!existingChannel) return;

    setPath(existingChannel.path || '');
    setMedia(existingChannel.media || null);
    setHoverSound(existingChannel.hoverSound || null);
    setAsAdmin(existingChannel.asAdmin ?? false);
  }, [
    isOpen,
    channelId,
    configuredChannels,
    setPath,
    setPathError,
    setShowError,
    setMedia,
    setHoverSound,
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
