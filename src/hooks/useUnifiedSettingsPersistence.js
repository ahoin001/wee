import { useEffect, useRef } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { saveUnifiedSettingsSnapshot } from '../utils/electronApi';
import { buildSettingsSnapshotFromStore } from '../utils/store/settingsPersistenceContract';

const PERSIST_DEBOUNCE_MS = 250;

export const useUnifiedSettingsPersistence = () => {
  const timerRef = useRef(null);
  const lastSerializedRef = useRef('');

  useEffect(() => {
    const unsubscribe = useConsolidatedAppStore.subscribe((state) => {
      const snapshot = buildSettingsSnapshotFromStore(state);
      const serialized = JSON.stringify(snapshot);

      if (serialized === lastSerializedRef.current) {
        return;
      }

      lastSerializedRef.current = serialized;
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
