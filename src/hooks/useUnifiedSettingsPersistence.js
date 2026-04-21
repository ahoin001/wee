import { useEffect, useRef } from 'react';
import isEqual from 'fast-deep-equal';
import { shallow } from 'zustand/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { saveUnifiedSettingsSnapshot } from '../utils/electronApi';
import {
  buildSettingsSnapshotFromStore,
  mergeCanonicalSettings,
  withSettingsSchemaMeta,
} from '../utils/store/settingsPersistenceContract';

const hasPatchSettingsApi = () =>
  typeof window !== 'undefined' && typeof window.api?.data?.patchSettings === 'function';

const PERSIST_DEBOUNCE_MS = 250;

// Coarse selector: if NONE of these top-level slice references change, we can
// skip the full snapshot build + deep-equality compare entirely. This is the
// primary hot-path gate since the store fires listeners on every set() call,
// including motion/timer updates that don't belong to persisted settings.
const selectPersistedSlices = (state) => [
  state.ui,
  state.ribbon,
  state.wallpaper,
  state.overlay,
  state.time,
  state.channels,
  state.dock,
  state.monitors,
  state.spotify,
  state.sounds,
  state.floatingWidgets,
  state.navigation,
  state.presets,
  state.workspaces,
  state.spaces,
  state.appearanceBySpace,
  state.gameHub,
  state.mediaHub,
];

export const useUnifiedSettingsPersistence = () => {
  const timerRef = useRef(null);
  const lastSnapshotRef = useRef(null);
  const persistAttachedRef = useRef(false);

  useEffect(() => {
    const runFlush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const state = useConsolidatedAppStore.getState();
      if (!state.app?.startupHydrationCommitted) return;
      const snapshot = buildSettingsSnapshotFromStore(state);
      if (isEqual(snapshot, lastSnapshotRef.current)) return;
      lastSnapshotRef.current = snapshot;
      if (hasPatchSettingsApi()) {
        window.api.data.patchSettings(snapshot).catch((error) => {
          console.error('[UnifiedSettingsPersistence] Failed to flush settings (patch):', error);
        });
      } else if (typeof window !== 'undefined' && window.api?.data?.get && window.api?.data?.set) {
        window.api.data
          .get()
          .then((current) => {
            const payload = withSettingsSchemaMeta({
              ...(current || {}),
              settings: mergeCanonicalSettings(current?.settings || {}, snapshot),
            });
            return window.api.data.set(payload);
          })
          .catch((error) => {
            console.error('[UnifiedSettingsPersistence] Failed to flush settings directly:', error);
          });
      } else {
        saveUnifiedSettingsSnapshot(snapshot).catch((error) => {
          console.error('[UnifiedSettingsPersistence] Failed to flush settings:', error);
        });
      }
    };

    const handlePersistTick = () => {
      // Only build/compare when one of the persisted slice references has
      // actually changed (shallow equality across top-level slices).
      const state = useConsolidatedAppStore.getState();
      if (!state.app?.startupHydrationCommitted) return;
      const snapshot = buildSettingsSnapshotFromStore(state);
      if (isEqual(snapshot, lastSnapshotRef.current)) return;
      lastSnapshotRef.current = snapshot;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        saveUnifiedSettingsSnapshot(snapshot).catch((error) => {
          console.error('[UnifiedSettingsPersistence] Failed to persist settings:', error);
        });
      }, PERSIST_DEBOUNCE_MS);
    };

    let unsubscribePersist = null;
    const attachPersist = () => {
      if (persistAttachedRef.current) return;
      persistAttachedRef.current = true;
      unsubscribePersist = useConsolidatedAppStore.subscribe(
        selectPersistedSlices,
        handlePersistTick,
        { equalityFn: shallow }
      );
    };

    // Defer attachment until hydration has committed. This avoids paying for
    // any persist work during cold startup when the store churns rapidly.
    let unsubscribeGate = null;
    const initialState = useConsolidatedAppStore.getState();
    if (initialState.app?.startupHydrationCommitted) {
      attachPersist();
    } else {
      unsubscribeGate = useConsolidatedAppStore.subscribe(
        (state) => state.app?.startupHydrationCommitted,
        (committed) => {
          if (!committed) return;
          attachPersist();
          if (unsubscribeGate) {
            unsubscribeGate();
            unsubscribeGate = null;
          }
        }
      );
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        runFlush();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', runFlush);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (unsubscribeGate) unsubscribeGate();
      if (unsubscribePersist) unsubscribePersist();
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', runFlush);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      runFlush();
    };
  }, []);
};

export default useUnifiedSettingsPersistence;
