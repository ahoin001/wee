import { useEffect, useRef, useState } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import {
  hydrateSoundLibrary,
  subscribeSoundLibrary,
} from './soundLibraryCache';
import {
  pauseBackgroundMusic,
  resumeOrStartBackgroundMusic,
  startBackgroundMusicFromSettings,
  stopBackgroundMusic,
} from './soundPlayback';
import { useAppActivity } from '../hooks/useAppActivity';
import { usePowerPolicy } from '../hooks/usePowerPolicy';

/**
 * Mount once from App shell. Sole owner of BGM start/stop/pause.
 * Focus loss soft-pauses (keeps currentTime); return fades in from where it left off.
 * Settings / library changes restart from settings when audible.
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
  const [libraryEpoch, setLibraryEpoch] = useState(0);
  const prevConfigKeyRef = useRef('');
  const prevActiveRef = useRef(null);

  useEffect(() => {
    let prevKey = '';
    return subscribeSoundLibrary((lib) => {
      const tracks = Array.isArray(lib?.backgroundMusic) ? lib.backgroundMusic : [];
      const key = tracks
        .map((s) => `${s.id}:${s.enabled ? 1 : 0}:${s.volume ?? 0}:${s.liked ? 1 : 0}:${s.url || ''}`)
        .join('|');
      if (key === prevKey) return;
      prevKey = key;
      setLibraryEpoch((n) => n + 1);
    });
  }, []);

  const configKey = [
    appReady ? 1 : 0,
    backgroundMusicEnabled ? 1 : 0,
    shouldRunBgm ? 1 : 0,
    backgroundMusicLooping ? 1 : 0,
    backgroundMusicPlaylistMode ? 1 : 0,
    libraryEpoch,
  ].join(':');

  useEffect(() => {
    if (!appReady) return undefined;

    const configChanged = prevConfigKeyRef.current !== configKey;
    const focusChanged =
      prevActiveRef.current != null && prevActiveRef.current !== isAppActive;
    prevConfigKeyRef.current = configKey;
    prevActiveRef.current = isAppActive;

    let cancelled = false;
    (async () => {
      await hydrateSoundLibrary();
      if (cancelled) return;

      if (!backgroundMusicEnabled || !shouldRunBgm) {
        stopBackgroundMusic();
        return;
      }

      if (!isAppActive) {
        pauseBackgroundMusic();
        return;
      }

      // Focus return with unchanged settings → resume from currentTime.
      if (focusChanged && !configChanged) {
        await resumeOrStartBackgroundMusic();
      } else {
        await startBackgroundMusicFromSettings();
      }
      if (cancelled) pauseBackgroundMusic();
    })();

    return () => {
      cancelled = true;
    };
  }, [
    appReady,
    configKey,
    isAppActive,
    backgroundMusicEnabled,
    shouldRunBgm,
  ]);

  useEffect(() => () => stopBackgroundMusic(), []);
}

export default useBackgroundMusicLifecycle;
