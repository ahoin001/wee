import { useEffect, useState } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

/**
 * When true, decorative video (channel tiles, previews) should pause to save decode/GPU.
 * Combines document visibility, window focus, and app low-power mode.
 */
export function useRendererMediaPowerState() {
  const lowPowerMode = useConsolidatedAppStore((s) => s.ui.lowPowerMode ?? false);

  const [documentHidden, setDocumentHidden] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'hidden'
  );
  const [windowFocused, setWindowFocused] = useState(
    () => typeof document === 'undefined' || document.hasFocus()
  );

  useEffect(() => {
    const onVis = () => setDocumentHidden(document.visibilityState === 'hidden');
    const onFocus = () => setWindowFocused(true);
    const onBlur = () => setWindowFocused(false);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const shouldPauseDecorativeVideo = documentHidden || !windowFocused || lowPowerMode;

  return {
    shouldPauseDecorativeVideo,
    documentHidden,
    windowFocused,
    lowPowerMode,
  };
}
