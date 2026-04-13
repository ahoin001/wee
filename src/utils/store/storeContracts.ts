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
  channelConfigs?: Record<string, unknown>;
  navigation?: Record<string, unknown>;
};

export type NormalizedChannelPayload = {
  settings?: ChannelSettings;
  data?: ChannelData;
};

/** Drop deprecated per-channel maps; channel content lives on `configuredChannels` only. */
function stripLegacyChannelDataFields(raw: Record<string, unknown> | undefined): ChannelData {
  if (!raw) return {};
  const { mediaMap: _m, appPathMap: _a, ...rest } = raw;
  return rest as ChannelData;
}

export const normalizeChannelPayload = (
  payload: Record<string, unknown> | null | undefined
): NormalizedChannelPayload => {
  if (!payload) return {};

  const hasNestedShape = 'settings' in payload || 'data' in payload || 'operations' in payload;
  if (hasNestedShape) {
    return {
      settings: (payload.settings as ChannelSettings) || {},
      data: stripLegacyChannelDataFields(payload.data as Record<string, unknown> | undefined),
    };
  }

  const { configuredChannels, channelConfigs, navigation, ...settings } = payload;

  return {
    settings: settings as ChannelSettings,
    data: stripLegacyChannelDataFields({
      configuredChannels,
      channelConfigs,
      navigation,
    } as Record<string, unknown>),
  };
};
