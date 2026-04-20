export const PRESET_SCOPE_VISUAL = 'visual';
export const PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS = 'visual+homeChannels';

export function isPresetScopeWithHomeChannels(scope) {
  return scope === PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS;
}

export function normalizePresetScope(scope) {
  return isPresetScopeWithHomeChannels(scope)
    ? PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS
    : PRESET_SCOPE_VISUAL;
}

