import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';
import useSoundManager from '../../../utils/useSoundManager';
import { launchWithFeedback } from '../../../utils/launchWithFeedback';
import { getRecentLaunchHintTtlMs } from '../../../utils/channelOpenHint';

const api = window.api;

export function useChannelInteractions({
  id,
  onHover,
  effectiveConfig,
  effectivePath,
  effectiveType,
  effectiveAsAdmin,
  effectiveHoverSound,
  effectiveMedia,
  launchLabel,
  beginLaunchFeedback,
  endLaunchFeedback,
  showLaunchError,
  onChannelSave,
  updateChannelConfig,
}) {
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelModalMounted, setChannelModalMounted] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);

  const openHint = useConsolidatedAppStore((state) => state.ui.channelOpenHints?.[id]);
  const setUIState = useConsolidatedAppStore((state) => state.actions.setUIState);
  const { playChannelHoverSound, playChannelClickSound, stopAllSounds } = useSoundManager();

  const recordRecentLaunchHint = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      channelOpenHints: {
        ...(prev.channelOpenHints || {}),
        [id]: { at: Date.now() },
      },
    }));
  }, [id, setUIState]);

  useEffect(() => {
    const h = openHint;
    if (!h) return undefined;
    const ttl = getRecentLaunchHintTtlMs();
    const elapsed = Date.now() - h.at;
    const prune = () => {
      setUIState((prev) => {
        const map = { ...(prev.channelOpenHints || {}) };
        if (map[id]) delete map[id];
        return { ...prev, channelOpenHints: map };
      });
    };
    if (elapsed >= ttl) {
      prune();
      return undefined;
    }
    const t = setTimeout(prune, ttl - elapsed);
    return () => clearTimeout(t);
  }, [openHint, id, setUIState]);

  useLayoutEffect(() => {
    if (showChannelModal) {
      setChannelModalMounted(true);
    }
  }, [showChannelModal]);

  useEffect(() => {
    setUIState({ channelConfigureModalOpen: showChannelModal });
  }, [showChannelModal, setUIState]);

  useEffect(() => () => stopAllSounds(), [stopAllSounds]);

  const handleConfigure = useCallback(() => {
    setShowChannelModal(true);
  }, []);

  const handleChannelModalSave = useCallback((channelId, channelData) => {
    updateChannelConfig(channelId, channelData);
    if (onChannelSave) onChannelSave(channelId, channelData);
  }, [onChannelSave, updateChannelConfig]);

  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowChannelModal(true);
  }, []);

  const handleMouseEnter = useCallback(async () => {
    if (onHover) onHover();
    const hasContent = effectivePath || effectiveConfig?.isApiChannel || effectiveMedia;
    if (hasContent) {
      await playChannelHoverSound(effectiveHoverSound);
    }
  }, [onHover, effectivePath, effectiveConfig?.isApiChannel, effectiveMedia, playChannelHoverSound, effectiveHoverSound]);

  const handleMouseLeave = useCallback(() => {
    stopAllSounds();
  }, [stopAllSounds]);

  const handleClick = useCallback(async () => {
    if (!api) {
      showLaunchError?.({
        technicalError: 'Electron API bridge unavailable',
        launchType: effectiveType || 'app',
        path: effectivePath || '',
        source: 'channel',
      });
      return;
    }

    stopAllSounds();
    const isChannelEmpty = !effectiveConfig || !effectiveConfig.path;

    if (effectiveConfig?.isApiChannel && effectiveConfig?.apiConfig?.selectedApi) {
      await playChannelClickSound();
      if (effectiveConfig.apiConfig.selectedApi === 'spotify') {
        if (window.api?.ui?.showSpotifyWidget) {
          window.api.ui.showSpotifyWidget();
        } else {
          const { actions } = useConsolidatedAppStore.getState();
          actions.setFloatingWidgetsState({ spotify: { visible: true } });
        }
        recordRecentLaunchHint();
      }
      return;
    }

    if (isChannelEmpty) {
      handleConfigure();
      return;
    }
    if (!effectivePath) return;

    await playChannelClickSound();

    if (effectiveType === 'url' && effectivePath.startsWith('http')) {
      const immersivePip = useConsolidatedAppStore.getState().ui?.immersivePip ?? false;
      if (immersivePip && api.openPipWindow) {
        api.openPipWindow(effectivePath);
        recordRecentLaunchHint();
      } else {
        const result = await launchWithFeedback({
          launch: () => api.launchApp({ type: 'url', path: effectivePath, asAdmin: false }),
          beginLaunchFeedback,
          endLaunchFeedback,
          showLaunchError,
          label: `Opening ${launchLabel || 'URL'}`,
          launchType: 'url',
          path: effectivePath,
          source: 'channel',
        });
        if (!result || result.ok !== false) recordRecentLaunchHint();
      }
      return;
    }

    const result = await launchWithFeedback({
      launch: () => api.launchApp({ type: effectiveType, path: effectivePath, asAdmin: effectiveAsAdmin }),
      beginLaunchFeedback,
      endLaunchFeedback,
      showLaunchError,
      label: `Launching ${launchLabel || 'app'}`,
      launchType: effectiveType,
      path: effectivePath,
      source: 'channel',
    });
    if (!result || result.ok !== false) recordRecentLaunchHint();
  }, [
    showLaunchError,
    effectiveType,
    effectivePath,
    stopAllSounds,
    effectiveConfig,
    playChannelClickSound,
    recordRecentLaunchHint,
    beginLaunchFeedback,
    endLaunchFeedback,
    launchLabel,
    effectiveAsAdmin,
    handleConfigure,
  ]);

  return {
    openHint,
    showChannelModal,
    setShowChannelModal,
    channelModalMounted,
    setChannelModalMounted,
    showImageSearch,
    setShowImageSearch,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    handleRightClick,
    handleConfigure,
    handleChannelModalSave,
  };
}

export default useChannelInteractions;
