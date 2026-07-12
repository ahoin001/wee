import { useEffect, useRef } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { hydrateSoundLibrary } from './soundLibraryCache';
import {
  startBackgroundMusicFromSettings,
  stopBackgroundMusic,
} from './soundPlayback';

/**
 * Mount once from App shell. Owns BGM start/stop + single focus/blur handler.
 */
export function useBackgroundMusicLifecycle({ appReady }) {
  const backgroundMusicEnabled = useConsolidatedAppStore(
    (s) => s.sounds?.backgroundMusicEnabled
  );
  const backgroundMusicLooping = useConsolidatedAppStore(
    (s) => s.sounds?.backgroundMusicLooping
  );
  const backgroundMusicPlaylistMode = useConsolidatedAppStore(
    (s) => s.sounds?.backgroundMusicPlaylistMode
  );

  const startRef = useRef(startBackgroundMusicFromSettings);
  startRef.current = startBackgroundMusicFromSettings;

  useEffect(() => {
    if (!appReady) return undefined;
    let cancelled = false;
    (async () => {
      await hydrateSoundLibrary();
      if (cancelled) return;
      if (backgroundMusicEnabled) {
        await startBackgroundMusicFromSettings();
      } else {
        stopBackgroundMusic();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    appReady,
    backgroundMusicEnabled,
    backgroundMusicLooping,
    backgroundMusicPlaylistMode,
  ]);

  useEffect(() => {
    const onFocus = () => {
      const enabled = useConsolidatedAppStore.getState().sounds?.backgroundMusicEnabled;
      if (enabled) startRef.current();
    };
    const onBlur = () => {
      stopBackgroundMusic();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      stopBackgroundMusic();
    };
  }, []);
}

export default useBackgroundMusicLifecycle;
