/**
 * Normalize sound data stored in presets across formats:
 * - Current: flat consolidated `sounds` slice (same keys as the Zustand store)
 * - Legacy: `sounds.json` blob `{ sounds: [], settings: {} }` from IPC `sounds:get`
 */
export function normalizePresetSoundsSnapshot(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const hasFlatToggles =
    raw.backgroundMusicEnabled !== undefined ||
    raw.backgroundMusicLooping !== undefined ||
    raw.backgroundMusicPlaylistMode !== undefined ||
    raw.channelClickEnabled !== undefined ||
    raw.channelHoverEnabled !== undefined;

  if (hasFlatToggles) {
    return { ...raw };
  }

  if (raw.settings && typeof raw.settings === 'object' && !Array.isArray(raw.settings)) {
    const keys = Object.keys(raw.settings);
    if (keys.length === 0) return null;
    return { ...raw.settings };
  }

  return null;
}
