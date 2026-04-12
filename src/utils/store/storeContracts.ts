export type ChannelSettings = {
  autoFadeTimeout?: number;
  animation?: string | null;
  adaptiveEmptyChannels?: boolean;
  animatedOnHover?: boolean;
  idleAnimationEnabled?: boolean;
  idleAnimationTypes?: string[];
  idleAnimationInterval?: number;
  kenBurnsEnabled?: boolean;
  kenBurnsMode?: string;
  kenBurnsHoverScale?: number;
  kenBurnsAutoplayScale?: number;
  kenBurnsSlideshowScale?: number;
  kenBurnsHoverDuration?: number;
  kenBurnsAutoplayDuration?: number;
  kenBurnsSlideshowDuration?: number;
  kenBurnsCrossfadeDuration?: number;
  kenBurnsForGifs?: boolean;
  kenBurnsForVideos?: boolean;
  kenBurnsEasing?: string;
  kenBurnsAnimationType?: string;
  kenBurnsCrossfadeReturn?: boolean;
  kenBurnsTransitionType?: string;
};

export type ChannelData = {
  configuredChannels?: Record<string, unknown>;
  mediaMap?: Record<string, unknown>;
  appPathMap?: Record<string, unknown>;
  channelConfigs?: Record<string, unknown>;
  navigation?: Record<string, unknown>;
};

export type NormalizedChannelPayload = {
  settings?: ChannelSettings;
  data?: ChannelData;
};

export const normalizeChannelPayload = (
  payload: Record<string, unknown> | null | undefined
): NormalizedChannelPayload => {
  if (!payload) return {};

  const hasNestedShape = 'settings' in payload || 'data' in payload || 'operations' in payload;
  if (hasNestedShape) {
    return {
      settings: (payload.settings as ChannelSettings) || {},
      data: (payload.data as ChannelData) || {},
    };
  }

  const {
    configuredChannels,
    mediaMap,
    appPathMap,
    channelConfigs,
    navigation,
    ...settings
  } = payload;

  return {
    settings: settings as ChannelSettings,
    data: {
      configuredChannels: configuredChannels as ChannelData['configuredChannels'],
      mediaMap: mediaMap as ChannelData['mediaMap'],
      appPathMap: appPathMap as ChannelData['appPathMap'],
      channelConfigs: channelConfigs as ChannelData['channelConfigs'],
      navigation: navigation as ChannelData['navigation'],
    },
  };
};
