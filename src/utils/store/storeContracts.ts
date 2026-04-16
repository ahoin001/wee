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
  /** When present on disk, merged via `mergeChannelsSlice` (per-space grids). */
  dataBySpace?: Record<string, unknown>;
};

function normalizeChannelData(raw: Record<string, unknown> | undefined): ChannelData {
  if (!raw) return {};
  return {
    configuredChannels: raw.configuredChannels as Record<string, unknown> | undefined,
    channelConfigs: raw.channelConfigs as Record<string, unknown> | undefined,
    navigation: raw.navigation as Record<string, unknown> | undefined,
  };
}

export const normalizeChannelPayload = (
  payload: Record<string, unknown> | null | undefined
): NormalizedChannelPayload => {
  return {
    settings: (payload?.settings as ChannelSettings) || {},
    data: normalizeChannelData(payload?.data as Record<string, unknown> | undefined),
    dataBySpace: payload?.dataBySpace as Record<string, unknown> | undefined,
  };
};
