import { useEffect, useRef } from 'react';
import isEqual from 'fast-deep-equal';
import { shallow } from 'zustand/shallow';
import PQueue from 'p-queue';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

const wallpaperFileWriteQueue = new PQueue({ concurrency: 1 });
const DEBOUNCE_MS = 350;

function pickWallpaperFileSlice(state) {
  const w = state.wallpaper || {};
  const o = state.overlay || {};
  return {
    wallpaperOpacity: w.opacity,
    wallpaperBlur: w.blur,
    wallpaperWorkspaceBrightness: w.workspaceBrightness,
    wallpaperWorkspaceSaturate: w.workspaceSaturate,
    wallpaperGameHubBrightness: w.gameHubBrightness,
    wallpaperGameHubSaturate: w.gameHubSaturate,
    cyclingSettings: {
      enabled: w.cycleWallpapers,
      interval: w.cycleInterval,
      animation: w.cycleAnimation,
      slideDirection: w.slideDirection,
      crossfadeDuration: w.crossfadeDuration,
      crossfadeEasing: w.crossfadeEasing,
      slideRandomDirection: w.slideRandomDirection,
      slideDuration: w.slideDuration,
      slideEasing: w.slideEasing,
    },
    overlayEnabled: o.enabled,
    overlayEffect: o.effect,
    overlayIntensity: o.intensity,
    overlaySpeed: o.speed,
    overlayWind: o.wind,
    overlayGravity: o.gravity,
  };
}

// Coarse reference-level selector so listener only runs when wallpaper/overlay
// slice references change (not on every unrelated store update).
const selectWallpaperDomain = (state) => [state.wallpaper, state.overlay];

/**
 * Keeps `wallpapers.json` scalar / overlay / cycling fields aligned with the consolidated store
 * (unified settings also persist these slices — previously the wallpaper file could stay stale
 * and clobber the store when `WallpaperSettingsTab` reloads from IPC).
 */
export async function syncWallpaperDataFileFromStore() {
  const api = typeof window !== 'undefined' ? window.api?.wallpapers : null;
  if (!api?.get || !api?.set) return;

  return wallpaperFileWriteQueue.add(async () => {
    const state = useConsolidatedAppStore.getState();
    const slice = pickWallpaperFileSlice(state);
    const current = await api.get();
    if (!current || typeof current !== 'object') return;
    const next = {
      ...current,
      ...slice,
    };
    if (isEqual(current, next)) return;
    await api.set(next);
  });
}

export function useWallpaperDataFileSync() {
  const timerRef = useRef(null);
  const lastFingerprintRef = useRef(null);
  const attachedRef = useRef(false);

  useEffect(() => {
    const flushSyncNow = () => {
      const state = useConsolidatedAppStore.getState();
      if (!state.app?.startupHydrationCommitted) return;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const fp = pickWallpaperFileSlice(state);
      if (isEqual(fp, lastFingerprintRef.current)) return;
      lastFingerprintRef.current = fp;
      syncWallpaperDataFileFromStore().catch((e) => {
        console.warn('[useWallpaperDataFileSync] Failed to flush wallpapers.json:', e);
      });
    };

    const runSync = () => {
      const state = useConsolidatedAppStore.getState();
      if (!state.app?.startupHydrationCommitted) return;
      const fp = pickWallpaperFileSlice(state);
      if (isEqual(fp, lastFingerprintRef.current)) return;
      lastFingerprintRef.current = fp;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        syncWallpaperDataFileFromStore().catch((e) => {
          console.warn('[useWallpaperDataFileSync] Failed to sync wallpapers.json:', e);
        });
      }, DEBOUNCE_MS);
    };

    let unsubscribeSync = null;
    const attach = () => {
      if (attachedRef.current) return;
      attachedRef.current = true;
      unsubscribeSync = useConsolidatedAppStore.subscribe(
        selectWallpaperDomain,
        runSync,
        { equalityFn: shallow }
      );
    };

    let unsubscribeGate = null;
    const initialState = useConsolidatedAppStore.getState();
    if (initialState.app?.startupHydrationCommitted) {
      attach();
    } else {
      unsubscribeGate = useConsolidatedAppStore.subscribe(
        (state) => state.app?.startupHydrationCommitted,
        (committed) => {
          if (!committed) return;
          attach();
          if (unsubscribeGate) {
            unsubscribeGate();
            unsubscribeGate = null;
          }
        }
      );
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSyncNow();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', flushSyncNow);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (unsubscribeGate) unsubscribeGate();
      if (unsubscribeSync) unsubscribeSync();
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', flushSyncNow);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      flushSyncNow();
    };
  }, []);
}

export default useWallpaperDataFileSync;
