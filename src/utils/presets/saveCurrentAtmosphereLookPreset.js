import { capturePresetThumbnailDataUrl } from '../presetSharing';
import { saveUnifiedSettingsSnapshot } from '../electronApi';
import useConsolidatedAppStore from '../useConsolidatedAppStore';
import { buildPresetDataFromStore } from './buildPresetSnapshot';
import { createPresetId } from './presetIds';
import { PRESET_SCOPE_VISUAL } from './presetScopes';
import { MAX_CUSTOM_PRESETS } from './saveFrozenSpotifyLookPreset';
import { SPOTIFY_MATCH_PRESET_NAME } from './spotifyMatchPreset';

function countCustomPresets(presets) {
  return (Array.isArray(presets) ? presets : []).filter(
    (p) => p?.name !== SPOTIFY_MATCH_PRESET_NAME
  ).length;
}

/**
 * Save the current Atmosphere look as a visual-only Look (shareable).
 * Freezes album palette when Color Match has extracted colors; otherwise
 * captures the live visual snapshot (wallpaper match / manual ribbon).
 *
 * @param {{ name?: string }} [opts]
 * @returns {Promise<{ ok: true, preset: object } | { ok: false, error: string }>}
 */
export async function saveCurrentAtmosphereLookPreset({ name } = {}) {
  const trimmed =
    typeof name === 'string' && name.trim()
      ? name.trim()
      : defaultAtmosphereLookName();

  const state = useConsolidatedAppStore.getState();
  const presets = Array.isArray(state.presets) ? state.presets : [];
  if (countCustomPresets(presets) >= MAX_CUSTOM_PRESETS) {
    return {
      ok: false,
      error: `You can save up to ${MAX_CUSTOM_PRESETS} custom looks. Delete one first.`,
    };
  }

  const hasSpotifyPalette = Boolean(state.spotify?.extractedColors?.primary);
  const wallpaperMatchOn = state.ui?.wallpaperMatchEnabled !== false;
  const spotifyMatchOn = Boolean(state.ui?.spotifyMatchEnabled);

  if (!hasSpotifyPalette && !wallpaperMatchOn && !spotifyMatchOn) {
    // Still allow saving the current static look.
  }

  const presetData = buildPresetDataFromStore({
    captureScope: PRESET_SCOPE_VISUAL,
    includeSpotifyPalette: hasSpotifyPalette,
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
    frozenAtmosphereLook: true,
    ...(hasSpotifyPalette ? { frozenSpotifyLook: true } : {}),
  };

  const updatedPresets = [...presets, newPreset];
  state.actions.setPresets(updatedPresets);
  try {
    await saveUnifiedSettingsSnapshot({ presets: updatedPresets });
  } catch (e) {
    console.error('[saveCurrentAtmosphereLookPreset] Failed to persist presets:', e);
    return { ok: false, error: 'Saved in session, but could not write to disk.' };
  }

  return { ok: true, preset: newPreset };
}

export function defaultAtmosphereLookName() {
  return `Look ${new Date().toLocaleString()}`;
}
