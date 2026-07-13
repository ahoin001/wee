import { usePowerPolicy } from './usePowerPolicy';
import { useAppActivity } from './useAppActivity';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

/**
 * When true, decorative video (channel tiles, previews) should pause to save decode/GPU.
 */
export function useRendererMediaPowerState() {
  const lowPowerMode = useConsolidatedAppStore((s) => s.ui.lowPowerMode ?? false);
  const { isAppActive } = useAppActivity();
  const { shouldPauseDecorativeVideo, isAway } = usePowerPolicy();

  return {
    shouldPauseDecorativeVideo: shouldPauseDecorativeVideo || !isAppActive || lowPowerMode,
    lowPowerMode,
    isAppActive,
    isAway,
  };
}
