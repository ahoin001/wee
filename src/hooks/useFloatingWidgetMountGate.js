import { useCallback, useLayoutEffect, useState } from 'react';

/**
 * Keep a floating widget host mounted from first open until exit animation completes.
 * Prevents parent unmount from cutting gooey dismiss springs short.
 */
export function useFloatingWidgetMountGate(isVisible) {
  const [mounted, setMounted] = useState(() => Boolean(isVisible));

  useLayoutEffect(() => {
    if (isVisible) setMounted(true);
  }, [isVisible]);

  const onExitAnimationComplete = useCallback(() => {
    if (!isVisible) {
      setMounted(false);
    }
  }, [isVisible]);

  return {
    shouldMount: mounted || Boolean(isVisible),
    onExitAnimationComplete,
  };
}
