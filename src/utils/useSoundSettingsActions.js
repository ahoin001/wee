import { useCallback } from 'react';
import { saveUnifiedSoundSettings } from './electronApi';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import {
  startBackgroundMusicFromSettings,
  stopBackgroundMusic,
  updateBackgroundMusicLooping,
} from './soundPlayback';
import { refreshSoundLibrary } from './soundLibraryCache';

/**
 * Settings-tab actions: patch Zustand settings.sounds + persist.
 * BGM side effects go through soundPlayback (single owner).
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
    async (partial, { restartBgm = false, updateLoopOnly = false } = {}) => {
      const prev = useConsolidatedAppStore.getState().sounds || {};
      const next = { ...prev, ...partial };
      setSoundsState(next);
      await saveSoundSettings(next);

      if (updateLoopOnly && next.backgroundMusicEnabled) {
        updateBackgroundMusicLooping(!!next.backgroundMusicLooping);
        return next;
      }
      if (restartBgm || partial.backgroundMusicEnabled !== undefined) {
        if (next.backgroundMusicEnabled) {
          await startBackgroundMusicFromSettings();
        } else {
          stopBackgroundMusic();
        }
      }
      return next;
    },
    [setSoundsState, saveSoundSettings]
  );

  const toggleBackgroundMusic = useCallback(
    (enabled) => patchSounds({ backgroundMusicEnabled: enabled }, { restartBgm: true }),
    [patchSounds]
  );

  const toggleBackgroundMusicLooping = useCallback(
    (looping) =>
      patchSounds({ backgroundMusicLooping: looping }, { updateLoopOnly: true }),
    [patchSounds]
  );

  const togglePlaylistMode = useCallback(
    (playlistMode) =>
      patchSounds({ backgroundMusicPlaylistMode: playlistMode }, { restartBgm: true }),
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
    const enabled = useConsolidatedAppStore.getState().sounds?.backgroundMusicEnabled;
    if (enabled) await startBackgroundMusicFromSettings();
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
