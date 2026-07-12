/**
 * Normalize flat `settings.sounds` snapshots from presets (same keys as Zustand).
 */
const SOUND_SETTINGS_KEYS = [
  'backgroundMusicEnabled',
  'backgroundMusicLooping',
  'backgroundMusicPlaylistMode',
  'channelClickEnabled',
  'channelClickVolume',
  'channelHoverEnabled',
  'channelHoverVolume',
];

function pickSoundSettings(raw) {
  const out = {};
  for (const key of SOUND_SETTINGS_KEYS) {
    if (raw[key] !== undefined) out[key] = raw[key];
  }
  return Object.keys(out).length ? out : null;
}

export function normalizePresetSoundsSnapshot(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const hasFlatToggles =
    raw.backgroundMusicEnabled !== undefined ||
    raw.backgroundMusicLooping !== undefined ||
    raw.backgroundMusicPlaylistMode !== undefined ||
    raw.channelClickEnabled !== undefined ||
    raw.channelHoverEnabled !== undefined;

  if (!hasFlatToggles) return null;
  return pickSoundSettings(raw);
}
