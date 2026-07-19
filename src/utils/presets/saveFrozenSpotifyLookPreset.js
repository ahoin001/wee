import { capturePresetThumbnailDataUrl } from '../presetSharing';
import { saveUnifiedSettingsSnapshot } from '../electronApi';
import useConsolidatedAppStore from '../useConsolidatedAppStore';
import { buildPresetDataFromStore } from './buildPresetSnapshot';
import { createPresetId } from './presetIds';
import { PRESET_SCOPE_VISUAL } from './presetScopes';
import { SPOTIFY_MATCH_PRESET_NAME } from './spotifyMatchPreset';

/** Soft cap shared with Presets settings — custom looks only. */
export const MAX_CUSTOM_PRESETS = 5;

function countCustomPresets(presets) {
  return (Array.isArray(presets) ? presets : []).filter(
    (p) => p?.name !== SPOTIFY_MATCH_PRESET_NAME
  ).length;
}

/**
 * Freeze current album-art colors into a visual preset (`capturedSpotifyPalette`).
 * @param {{ name: string }} opts
 * @returns {Promise<{ ok: true, preset: object } | { ok: false, error: string }>}
 */
export async function saveFrozenSpotifyLookPreset({ name } = {}) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) {
    return { ok: false, error: 'Enter a name for the preset.' };
  }

  const state = useConsolidatedAppStore.getState();
  const presets = Array.isArray(state.presets) ? state.presets : [];
  if (countCustomPresets(presets) >= MAX_CUSTOM_PRESETS) {
    return {
      ok: false,
      error: `You can save up to ${MAX_CUSTOM_PRESETS} custom presets. Delete one first.`,
    };
  }

  const extracted = state.spotify?.extractedColors;
  if (!extracted?.primary) {
    return {
      ok: false,
      error: 'No album colors yet. Play something and turn on Color Match until a palette appears.',
    };
  }

  const presetData = buildPresetDataFromStore({
    captureScope: PRESET_SCOPE_VISUAL,
    includeSpotifyPalette: true,
  });

  let thumbnailDataUrl = null;
  try {
    thumbnailDataUrl = await capturePresetThumbnailDataUrl();
  } catch {
    thumbnailDataUrl = null;
  }

  const newPreset = {
    id: createPresetId(),
    name: trimmed,
    data: presetData,
    captureScope: PRESET_SCOPE_VISUAL,
    includesHomeChannels: false,
    shareable: true,
    timestamp: new Date().toISOString(),
    thumbnailDataUrl: thumbnailDataUrl || null,
    thumbnailComposition: 'showBoard',
    frozenSpotifyLook: true,
  };

  const updatedPresets = [...presets, newPreset];
  state.actions.setPresets(updatedPresets);
  try {
    await saveUnifiedSettingsSnapshot({ presets: updatedPresets });
  } catch (e) {
    console.error('[saveFrozenSpotifyLookPreset] Failed to persist presets:', e);
    return { ok: false, error: 'Saved in session, but could not write to disk.' };
  }

  return { ok: true, preset: newPreset };
}

export function defaultFrozenSpotifyLookName() {
  return `Matched colors ${new Date().toLocaleString()}`;
}
