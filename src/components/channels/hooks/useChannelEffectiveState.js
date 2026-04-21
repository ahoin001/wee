import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useChannelOperations from '../../../utils/useChannelOperations';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';
import useChannelMediaPreview from './useChannelMediaPreview';
import useChannelAdaptiveEmptyStyle from './useChannelAdaptiveEmptyStyle';

export function useChannelEffectiveState({
  id,
  channelConfig,
  empty,
  media,
  path,
  type,
  asAdmin,
  hoverSound,
  wiiMode = false,
}) {
  const {
    getChannelConfig,
    isChannelEmpty,
    updateChannelConfig,
    updateChannelMedia,
  } = useChannelOperations();

  const storeChannelConfig = getChannelConfig(id);
  const storeIsEmpty = isChannelEmpty(id);

  const ribbonAccent = useConsolidatedAppStore(
    useShallow((state) => ({
      ribbonGlowColor: state.ribbon?.ribbonGlowColor,
      ribbonColor: state.ribbon?.ribbonColor,
    }))
  );

  const channelSettings = useConsolidatedAppStore(
    useShallow((state) => ({
      animatedOnHover: state.channels?.settings?.animatedOnHover,
      kenBurnsEnabled: state.channels?.settings?.kenBurnsEnabled,
      kenBurnsMode: state.channels?.settings?.kenBurnsMode,
      adaptiveEmptyChannels: state.channels?.settings?.adaptiveEmptyChannels,
      kenBurnsForGifs: state.channels?.settings?.kenBurnsForGifs,
      kenBurnsForVideos: state.channels?.settings?.kenBurnsForVideos,
      kenBurnsHoverDuration: state.channels?.settings?.kenBurnsHoverDuration,
      kenBurnsHoverScale: state.channels?.settings?.kenBurnsHoverScale,
      kenBurnsAutoplayDuration: state.channels?.settings?.kenBurnsAutoplayDuration,
      kenBurnsAutoplayScale: state.channels?.settings?.kenBurnsAutoplayScale,
      kenBurnsSlideshowDuration: state.channels?.settings?.kenBurnsSlideshowDuration,
      kenBurnsSlideshowScale: state.channels?.settings?.kenBurnsSlideshowScale,
      kenBurnsCrossfadeDuration: state.channels?.settings?.kenBurnsCrossfadeDuration,
      kenBurnsEasing: state.channels?.settings?.kenBurnsEasing,
      kenBurnsAnimationType: state.channels?.settings?.kenBurnsAnimationType,
      kenBurnsCrossfadeReturn: state.channels?.settings?.kenBurnsCrossfadeReturn,
      kenBurnsTransitionType: state.channels?.settings?.kenBurnsTransitionType,
    }))
  );

  const effectiveConfig = useMemo(
    () => storeChannelConfig || channelConfig,
    [storeChannelConfig, channelConfig]
  );
  const effectiveIsEmpty = useMemo(
    () => (storeChannelConfig ? storeIsEmpty : empty),
    [storeChannelConfig, storeIsEmpty, empty]
  );
  const effectiveMedia = useMemo(
    () => storeChannelConfig?.media || media,
    [storeChannelConfig?.media, media]
  );
  const effectivePath = useMemo(
    () => storeChannelConfig?.path || path,
    [storeChannelConfig?.path, path]
  );
  const effectiveType = useMemo(
    () => storeChannelConfig?.type || type,
    [storeChannelConfig?.type, type]
  );
  const effectiveAsAdmin = useMemo(
    () => storeChannelConfig?.asAdmin ?? asAdmin ?? false,
    [storeChannelConfig, asAdmin]
  );
  const effectiveHoverSound = useMemo(
    () => storeChannelConfig?.hoverSound || hoverSound,
    [storeChannelConfig?.hoverSound, hoverSound]
  );

  const launchLabel = useMemo(() => {
    const cfgTitle = String(effectiveConfig?.title || '').trim();
    if (cfgTitle) return cfgTitle;
    const mediaName = String(effectiveMedia?.name || '').trim();
    if (mediaName) return mediaName;
    const appPath = String(effectivePath || '').trim();
    if (!appPath) return '';
    const normalized = appPath.replace(/\\/g, '/');
    const leaf = normalized.split('/').pop() || '';
    return leaf || appPath;
  }, [effectiveConfig?.title, effectiveMedia?.name, effectivePath]);

  const effectiveAnimatedOnHover = useMemo(
    () =>
      effectiveConfig && effectiveConfig.animatedOnHover !== undefined
        ? effectiveConfig.animatedOnHover
        : channelSettings.animatedOnHover ?? false,
    [effectiveConfig?.animatedOnHover, channelSettings.animatedOnHover]
  );

  const effectiveKenBurnsEnabled = useMemo(
    () =>
      effectiveConfig && effectiveConfig.kenBurnsEnabled !== undefined
        ? effectiveConfig.kenBurnsEnabled
        : channelSettings.kenBurnsEnabled ?? false,
    [effectiveConfig?.kenBurnsEnabled, channelSettings.kenBurnsEnabled]
  );

  const effectiveKenBurnsMode = useMemo(
    () =>
      effectiveConfig && effectiveConfig.kenBurnsMode !== undefined
        ? effectiveConfig.kenBurnsMode
        : channelSettings.kenBurnsMode ?? 'hover',
    [effectiveConfig?.kenBurnsMode, channelSettings.kenBurnsMode]
  );

  const effectiveAdaptiveEmptyChannels = useMemo(
    () =>
      effectiveConfig && effectiveConfig.adaptiveEmptyChannels !== undefined
        ? effectiveConfig.adaptiveEmptyChannels
        : channelSettings.adaptiveEmptyChannels ?? true,
    [effectiveConfig?.adaptiveEmptyChannels, channelSettings.adaptiveEmptyChannels]
  );
  const useAdaptiveEmptyChannels = useMemo(
    () => effectiveAdaptiveEmptyChannels && !wiiMode,
    [effectiveAdaptiveEmptyChannels, wiiMode]
  );

  const adaptiveEmptyStyle = useChannelAdaptiveEmptyStyle({
    effectiveIsEmpty,
    effectiveMedia,
    useAdaptiveEmptyChannels,
    ribbonGlowColor: ribbonAccent?.ribbonGlowColor,
    ribbonColor: ribbonAccent?.ribbonColor,
  });
  const { mp4Preview } = useChannelMediaPreview({
    effectiveMedia,
    effectiveAnimatedOnHover,
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const debugEnabled =
      typeof window !== 'undefined' &&
      (window.__WEE_DEBUG_CHANNEL_PREVIEW === true ||
        window.localStorage?.getItem('wee.debug.channelPreview') === '1');
    if (!debugEnabled) return;
    const mediaType = effectiveMedia?.type || 'none';
    const mediaUrl = effectiveMedia?.url || '';
    console.debug('[ChannelPreviewDebug] effectiveState', {
      channelId: id,
      animatedOnHover: effectiveAnimatedOnHover,
      kenBurnsEnabled: effectiveKenBurnsEnabled,
      kenBurnsMode: effectiveKenBurnsMode,
      mediaType,
      hasMediaUrl: Boolean(mediaUrl),
    });
  }, [
    id,
    effectiveAnimatedOnHover,
    effectiveKenBurnsEnabled,
    effectiveKenBurnsMode,
    effectiveMedia?.type,
    effectiveMedia?.url,
  ]);

  return {
    updateChannelConfig,
    updateChannelMedia,
    channelSettings,
    ribbonAccent,
    effectiveConfig,
    effectiveIsEmpty,
    effectiveMedia,
    effectivePath,
    effectiveType,
    effectiveAsAdmin,
    effectiveHoverSound,
    launchLabel,
    effectiveAnimatedOnHover,
    effectiveKenBurnsEnabled,
    effectiveKenBurnsMode,
    useAdaptiveEmptyChannels,
    adaptiveEmptyStyle,
    mp4Preview,
  };
}

export default useChannelEffectiveState;
