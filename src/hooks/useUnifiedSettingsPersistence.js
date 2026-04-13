import { useEffect, useRef } from 'react';
import isEqual from 'fast-deep-equal';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { saveUnifiedSettingsSnapshot } from '../utils/electronApi';
import { buildSettingsSnapshotFromStore } from '../utils/store/settingsPersistenceContract';

const PERSIST_DEBOUNCE_MS = 250;

export const useUnifiedSettingsPersistence = () => {
  const timerRef = useRef(null);
  const lastSnapshotRef = useRef(null);

  useEffect(() => {
    const unsubscribe = useConsolidatedAppStore.subscribe((state) => {
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
      }, PERSIST_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
};

export default useUnifiedSettingsPersistence;
