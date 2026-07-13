import { useEffect, useRef } from 'react';
import { useAppActivity } from './useAppActivity';
import { usePowerPolicy } from './usePowerPolicy';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

/**
 * Centralized visibility / focus / low-power / session-away aware interval.
 *
 * - Pauses when hidden, minimized, unfocused, or sessionPower is away.
 * - Applies a low-power / efficient multiplier when those profiles are on.
 * - Fires once immediately when activity resumes if `fireOnResume` is true.
 */
export function useActivityInterval(callback, intervalMs, opts = {}) {
  const { enabled = true, fireOnResume = false, lowPowerMultiplier = 2 } = opts;
  const { isAppActive } = useAppActivity();
  const { isAway, isEfficient } = usePowerPolicy();
  const lowPowerMode = useConsolidatedAppStore((state) => state.ui?.lowPowerMode ?? false);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) return undefined;
    if (!isAppActive || isAway) return undefined;

    const factor =
      lowPowerMode || isEfficient ? Math.max(1, lowPowerMultiplier) : 1;
    const effective = Math.max(16, Math.round(intervalMs * factor));

    if (fireOnResume) {
      try {
        savedCallback.current?.();
      } catch (err) {
        console.warn('[useActivityInterval] callback threw:', err);
      }
    }

    const id = window.setInterval(() => {
      try {
        savedCallback.current?.();
      } catch (err) {
        console.warn('[useActivityInterval] callback threw:', err);
      }
    }, effective);
    return () => window.clearInterval(id);
  }, [
    enabled,
    intervalMs,
    isAppActive,
    isAway,
    isEfficient,
    lowPowerMode,
    lowPowerMultiplier,
    fireOnResume,
  ]);
}

export default useActivityInterval;
