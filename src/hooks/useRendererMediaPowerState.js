import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { useAppActivity } from './useAppActivity';

/**
 * When true, decorative video (channel tiles, previews) should pause to save decode/GPU.
 * Combines document/window activity, main-process window state, and app low-power mode.
 */
export function useRendererMediaPowerState() {
  const lowPowerMode = useConsolidatedAppStore((s) => s.ui.lowPowerMode ?? false);
  const { isAppActive } = useAppActivity();

  const shouldPauseDecorativeVideo = !isAppActive || lowPowerMode;

  return {
    shouldPauseDecorativeVideo,
    lowPowerMode,
    isAppActive,
  };
}
