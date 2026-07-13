import { useMemo } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { useAppActivity } from './useAppActivity';
import { usePowerPolicy } from './usePowerPolicy';

export const useAnimationActivity = ({
  activeFps = 60,
  lowPowerFps = 24,
  inactiveFps = 8,
  allowWhenUnfocused = false,
} = {}) => {
  const lowPowerMode = useConsolidatedAppStore((state) => state.ui.lowPowerMode);
  const { isVisible, isFocused, isAppActive } = useAppActivity();
  const { isAway, isEfficient } = usePowerPolicy();

  const shouldAnimate = useMemo(() => {
    if (isAway) return false;
    if (!isVisible) return false;
    if (allowWhenUnfocused) return true;
    return isAppActive;
  }, [allowWhenUnfocused, isAppActive, isAway, isVisible]);

  const targetFps = useMemo(() => {
    if (isAway || !isVisible) return inactiveFps;
    if (isAppActive) {
      if (lowPowerMode || isEfficient) return lowPowerFps;
      return activeFps;
    }
    return inactiveFps;
  }, [
    activeFps,
    inactiveFps,
    isAppActive,
    isAway,
    isEfficient,
    isVisible,
    lowPowerFps,
    lowPowerMode,
  ]);

  const frameIntervalMs = useMemo(
    () => 1000 / Math.max(1, targetFps),
    [targetFps]
  );

  const pollIntervalMultiplier = useMemo(() => {
    if (isAway || !isVisible) return 3;
    if (lowPowerMode || isEfficient) return 2;
    if (!isFocused) return 2;
    return 1;
  }, [isAway, isEfficient, isFocused, isVisible, lowPowerMode]);

  return {
    isVisible,
    isFocused,
    isAppActive,
    isLowPowerMode: lowPowerMode,
    isAway,
    shouldAnimate,
    targetFps,
    frameIntervalMs,
    pollIntervalMultiplier,
  };
};

export default useAnimationActivity;
