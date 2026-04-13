import { useMemo } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { useAppActivity } from './useAppActivity';

export const useAnimationActivity = ({
  activeFps = 60,
  lowPowerFps = 24,
  inactiveFps = 8,
  allowWhenUnfocused = false,
} = {}) => {
  const lowPowerMode = useConsolidatedAppStore((state) => state.ui.lowPowerMode);
  const { isVisible, isFocused, isAppActive } = useAppActivity();

  const shouldAnimate = useMemo(() => {
    if (!isVisible) return false;
    if (allowWhenUnfocused) return true;
    return isAppActive;
  }, [allowWhenUnfocused, isAppActive, isVisible]);

  const targetFps = useMemo(() => {
    if (!isVisible) return inactiveFps;
    if (isAppActive) return lowPowerMode ? lowPowerFps : activeFps;
    return inactiveFps;
  }, [activeFps, inactiveFps, isAppActive, isVisible, lowPowerFps, lowPowerMode]);

  const frameIntervalMs = useMemo(
    () => 1000 / Math.max(1, targetFps),
    [targetFps]
  );

  const pollIntervalMultiplier = useMemo(() => {
    if (!isVisible) return 3;
    if (lowPowerMode) return 2;
    if (!isFocused) return 2;
    return 1;
  }, [isFocused, isVisible, lowPowerMode]);

  return {
    isVisible,
    isFocused,
    isAppActive,
    isLowPowerMode: lowPowerMode,
    shouldAnimate,
    targetFps,
    frameIntervalMs,
    pollIntervalMultiplier,
  };
};

export default useAnimationActivity;
