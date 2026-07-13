import { useEffect, useRef } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { hydrateSoundLibrary } from './soundLibraryCache';
import {
  startBackgroundMusicFromSettings,
  stopBackgroundMusic,
} from './soundPlayback';
import { useAppActivity } from '../hooks/useAppActivity';
import { usePowerPolicy } from '../hooks/usePowerPolicy';

/**
 * Mount once from App shell. Owns BGM start/stop + focus/blur + session-away pause.
 */
export function useBackgroundMusicLifecycle({ appReady }) {
  const { isAppActive } = useAppActivity();
  const { shouldRunBgm } = usePowerPolicy();
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

  const allowBgm = Boolean(
    appReady && backgroundMusicEnabled && isAppActive && shouldRunBgm
  );

  useEffect(() => {
    if (!appReady) return undefined;
    let cancelled = false;
    (async () => {
      await hydrateSoundLibrary();
      if (cancelled) return;
      if (allowBgm) {
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
    allowBgm,
    backgroundMusicEnabled,
    backgroundMusicLooping,
    backgroundMusicPlaylistMode,
  ]);

  useEffect(() => {
    const onFocus = () => {
      const state = useConsolidatedAppStore.getState();
      const enabled = state.sounds?.backgroundMusicEnabled;
      const away = state.ui?.sessionPower === 'away';
      if (enabled && !away) startRef.current();
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
