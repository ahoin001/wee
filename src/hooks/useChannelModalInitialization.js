import { useEffect, useRef } from 'react';

/**
 * Reset + hydrate ChannelModal local state when opening a channel.
 * Per-channel motion / Ken Burns / launch-pause are global — not loaded here.
 *
 * IMPORTANT: hydrate only on open / channel change — not when `configuredChannels`
 * identity churns. Re-hydrating called stopPreview and made hover-sound Preview
 * start-then-immediately-stop.
 */
export const useChannelModalInitialization = ({
  isOpen = true,
  channelId,
  configuredChannels,
  setPath,
  setPathError,
  setShowError,
  setMedia,
  hydrateHoverSound,
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
  const configuredChannelsRef = useRef(configuredChannels);
  configuredChannelsRef.current = configuredChannels;

  useEffect(() => {
    if (!isOpen || !channelId) return;

    setPath('');
    setPathError('');
    setShowError(false);
    setMedia(null);
    hydrateHoverSound?.(null);
    setAsAdmin(false);

    const existingChannel = configuredChannelsRef.current[channelId];
    if (!existingChannel) return;

    setPath(existingChannel.path || '');
    setMedia(existingChannel.media || null);
    hydrateHoverSound?.(existingChannel.hoverSound || null);
    setAsAdmin(existingChannel.asAdmin ?? false);
  }, [
    isOpen,
    channelId,
    setPath,
    setPathError,
    setShowError,
    setMedia,
    hydrateHoverSound,
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
