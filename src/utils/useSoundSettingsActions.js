import { useCallback } from 'react';
import { saveUnifiedSoundSettings } from './electronApi';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { updateBackgroundMusicLooping } from './soundPlayback';
import { refreshSoundLibrary } from './soundLibraryCache';

/**
 * Settings-tab actions: patch Zustand settings.sounds + persist only.
 * BGM start/stop is owned exclusively by useBackgroundMusicLifecycle.
 */
export function useSoundSettingsActions() {
  const sounds = useConsolidatedAppStore((s) => s.sounds);
  const setSoundsState = useConsolidatedAppStore((s) => s.actions.setSoundsState);

  const saveSoundSettings = useCallback(async (next) => {
    try {
      await saveUnifiedSoundSettings(next);
    } catch {
      /* persist best-effort */
    }
  }, []);

  const patchSounds = useCallback(
    async (partial, { updateLoopOnly = false } = {}) => {
      const prev = useConsolidatedAppStore.getState().sounds || {};
      const next = { ...prev, ...partial };
      setSoundsState(next);
      await saveSoundSettings(next);

      // Apply loop on the live element without a full restart when already playing
      if (updateLoopOnly && next.backgroundMusicEnabled) {
        updateBackgroundMusicLooping(!!next.backgroundMusicLooping);
      }
      return next;
    },
    [setSoundsState, saveSoundSettings]
  );

  const toggleBackgroundMusic = useCallback(
    (enabled) => patchSounds({ backgroundMusicEnabled: enabled }),
    [patchSounds]
  );

  const toggleBackgroundMusicLooping = useCallback(
    (looping) =>
      patchSounds({ backgroundMusicLooping: looping }, { updateLoopOnly: true }),
    [patchSounds]
  );

  const togglePlaylistMode = useCallback(
    (playlistMode) => patchSounds({ backgroundMusicPlaylistMode: playlistMode }),
    [patchSounds]
  );

  const updateChannelClickSound = useCallback(
    (enabled, volume = 0.5) =>
      patchSounds({ channelClickEnabled: enabled, channelClickVolume: volume }),
    [patchSounds]
  );

  const updateChannelHoverSound = useCallback(
    (enabled, volume = 0.5) =>
      patchSounds({ channelHoverEnabled: enabled, channelHoverVolume: volume }),
    [patchSounds]
  );

  const updateBackgroundMusic = useCallback(async () => {
    await refreshSoundLibrary();
  }, []);

  return {
    soundSettings: sounds,
    saveSoundSettings,
    toggleBackgroundMusic,
    toggleBackgroundMusicLooping,
    togglePlaylistMode,
    updateChannelClickSound,
    updateChannelHoverSound,
    updateBackgroundMusic,
  };
}

export default useSoundSettingsActions;
