import { useEffect } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

/**
 * Keeps ui.systemPower in sync with main-process powerMonitor events.
 */
export function useSystemPowerSync() {
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);

  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.api : null;
    if (!api) return undefined;

    const apply = (payload) => {
      if (!payload || typeof payload !== 'object') return;
      setUIState((prev) => ({
        systemPower: {
          onBattery:
            typeof payload.onBattery === 'boolean'
              ? payload.onBattery
              : (prev.systemPower?.onBattery ?? false),
          suspended:
            typeof payload.suspended === 'boolean'
              ? payload.suspended
              : (prev.systemPower?.suspended ?? false),
        },
      }));
    };

    if (typeof api.getSystemPower === 'function') {
      api.getSystemPower().then(apply).catch(() => {});
    }
    if (typeof api.onSystemPower === 'function') {
      api.onSystemPower(apply);
      return () => api.offSystemPower?.(apply);
    }
    return undefined;
  }, [setUIState]);
}

export default useSystemPowerSync;
