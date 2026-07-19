import { capturePresetThumbnailDataUrl } from '../presetSharing';
import { saveUnifiedSettingsSnapshot } from '../electronApi';
import useConsolidatedAppStore from '../useConsolidatedAppStore';
import { buildPresetDataFromStore } from './buildPresetSnapshot';
import { createPresetId } from './presetIds';
import { PRESET_SCOPE_VISUAL } from './presetScopes';
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
