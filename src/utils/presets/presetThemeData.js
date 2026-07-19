import {
  PRESET_SCOPE_VISUAL,
  PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
  normalizePresetScope,
} from './presetScopes.js';
import { ensurePresetId } from './presetIds.js';

function cloneSafe(value, fallback = null) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function stripLegacyPresetKeys(data) {
  if (!data || typeof data !== 'object') return {};
  const next = { ...data };
  delete next.channels;
  delete next.channelData;
  delete next.sounds;
  delete next.soundLibrary;
  return next;
}

export function toVisualOnlyPreset(preset) {
  if (!preset || typeof preset !== 'object') return null;
  const presetWithId = ensurePresetId(preset);
  const data = stripLegacyPresetKeys(presetWithId.data && typeof presetWithId.data === 'object' ? { ...presetWithId.data } : {});
  delete data.homeChannels;
  delete data.focusChannels;
  return {
    ...presetWithId,
    captureScope: PRESET_SCOPE_VISUAL,
    includesHomeChannels: false,
    shareable: true,
    thumbnailComposition:
      presetWithId.thumbnailComposition === 'hideBoard' ? 'hideBoard' : 'showBoard',
    data,
  };
}

export function normalizePresetRecord(preset) {
  if (!preset || typeof preset !== 'object') return null;
  const presetWithId = ensurePresetId(preset);
  const data = stripLegacyPresetKeys(cloneSafe(presetWithId.data, {}));
  const normalizedScope = normalizePresetScope(presetWithId.captureScope);

  if (normalizedScope === PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS) {
    let homeChannels = data.homeChannels ?? null;
    if (!homeChannels && data.channels?.dataBySpace?.home) {
      homeChannels = cloneSafe(data.channels.dataBySpace.home, null);
    }
    let focusChannels = data.focusChannels ?? null;
    if (!focusChannels && data.channels?.dataBySpace?.workspaces) {
      focusChannels = cloneSafe(data.channels.dataBySpace.workspaces, null);
    }
    if (!homeChannels && !focusChannels) {
      return toVisualOnlyPreset({ ...presetWithId, data });
    }
    delete data.homeChannels;
    delete data.focusChannels;
    return {
      ...presetWithId,
      captureScope: PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
      includesHomeChannels: true,
      shareable: false,
      thumbnailComposition:
        presetWithId.thumbnailComposition === 'hideBoard' ? 'hideBoard' : 'showBoard',
      data: {
        ...data,
        ...(homeChannels ? { homeChannels } : {}),
        ...(focusChannels ? { focusChannels } : {}),
      },
    };
  }

  return toVisualOnlyPreset({ ...presetWithId, data });
}

export function toThemeOnlyPreset(preset) {
  return toVisualOnlyPreset(preset);
}

export function sanitizePresetCollection(presets) {
  if (!Array.isArray(presets)) return { presets: [], changed: false };
  let changed = false;
  const sanitized = presets.map((preset) => {
    const next = normalizePresetRecord(preset);
    if (!next) return preset;
    if (
      preset?.id !== next.id ||
      preset?.captureScope !== next.captureScope ||
      preset?.includesHomeChannels !== next.includesHomeChannels ||
      preset?.shareable !== next.shareable ||
      JSON.stringify(preset?.data) !== JSON.stringify(next.data)
    ) {
      changed = true;
    }
    return next;
  });
  return { presets: sanitized, changed };
}
