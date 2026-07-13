import { useEffect, useState } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import {
  hydrateSoundLibrary,
  subscribeSoundLibrary,
} from './soundLibraryCache';
import {
  startBackgroundMusicFromSettings,
  stopBackgroundMusic,
} from './soundPlayback';
import { useAppActivity } from '../hooks/useAppActivity';
import { usePowerPolicy } from '../hooks/usePowerPolicy';

/**
 * Mount once from App shell. Sole owner of BGM start/stop.
 * Activity (focus) flows through useAppActivity → isAppActive → allowBgm;
 * session away through usePowerPolicy → shouldRunBgm.
 * Library mutations notify via soundLibraryCache so playlist/track changes re-sync here.
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
        if (cancelled) stopBackgroundMusic();
      } else {
        stopBackgroundMusic();
      }
    })();
    return () => {
      cancelled = true;
      stopBackgroundMusic();
    };
  }, [
    appReady,
    allowBgm,
    backgroundMusicEnabled,
    backgroundMusicLooping,
    backgroundMusicPlaylistMode,
    libraryEpoch,
  ]);
}

export default useBackgroundMusicLifecycle;
