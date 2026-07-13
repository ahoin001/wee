import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { useAppActivity } from './useAppActivity';
import {
  powerProfileFlags,
  resolvePowerProfile,
} from '../utils/power/resolvePowerPolicy';

/**
 * Single consumer API for decorative / background power policy.
 */
export function usePowerPolicy() {
  const { isAppActive, isVisible } = useAppActivity();
  const { sessionPower, lowPowerMode, onBattery, suspended } = useConsolidatedAppStore(
    useShallow((state) => ({
      sessionPower: state.ui.sessionPower ?? 'normal',
      lowPowerMode: state.ui.lowPowerMode ?? false,
      onBattery: state.ui.systemPower?.onBattery ?? false,
      suspended: state.ui.systemPower?.suspended ?? false,
    }))
  );

  return useMemo(() => {
    const profile = resolvePowerProfile({
      isAppActive,
      isVisible,
      sessionPower,
      lowPowerMode,
      onBattery,
      suspended,
    });
    return powerProfileFlags(profile);
  }, [isAppActive, isVisible, sessionPower, lowPowerMode, onBattery, suspended]);
}

export default usePowerPolicy;
