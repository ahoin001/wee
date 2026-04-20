import { useEffect, useRef } from 'react';
import isEqual from 'fast-deep-equal';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { saveUnifiedSettingsSnapshot } from '../utils/electronApi';
import {
  buildSettingsSnapshotFromStore,
  mergeCanonicalSettings,
  withSettingsSchemaMeta,
} from '../utils/store/settingsPersistenceContract';

const PERSIST_DEBOUNCE_MS = 250;

export const useUnifiedSettingsPersistence = () => {
  const timerRef = useRef(null);
  const lastSnapshotRef = useRef(null);

  useEffect(() => {
    const flushPersist = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const state = useConsolidatedAppStore.getState();
      if (!state.app?.startupHydrationCommitted) return;
      const snapshot = buildSettingsSnapshotFromStore(state);
      if (isEqual(snapshot, lastSnapshotRef.current)) return;
      lastSnapshotRef.current = snapshot;
      if (typeof window !== 'undefined' && window.api?.data?.get && window.api?.data?.set) {
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

    const unsubscribe = useConsolidatedAppStore.subscribe((state) => {
      if (!state.app?.startupHydrationCommitted) return;
      const snapshot = buildSettingsSnapshotFromStore(state);
      if (isEqual(snapshot, lastSnapshotRef.current)) {
        return;
      }

      lastSnapshotRef.current = snapshot;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        saveUnifiedSettingsSnapshot(snapshot).catch((error) => {
          console.error('[UnifiedSettingsPersistence] Failed to persist settings:', error);
        });
        timerRef.current = null;
      }, PERSIST_DEBOUNCE_MS);
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPersist();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', flushPersist);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', flushPersist);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      flushPersist();
    };
  }, []);
};

export default useUnifiedSettingsPersistence;
