import { useEffect, useRef } from 'react';
import { useAppActivity } from './useAppActivity';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

/**
 * Centralized visibility / focus / low-power aware interval.
 *
 * - Pauses automatically when the app window is hidden, minimized, or unfocused.
 * - Applies a low-power multiplier when low-power mode is enabled, so callers don't
 *   each have to re-implement the same policy.
 * - Fires once immediately when activity resumes if `fireOnResume` is true.
 *
 * @param {() => void} callback  Work to run on each tick.
 * @param {number} intervalMs    Base interval in ms. Pass 0 / null to disable.
 * @param {object} [opts]
 * @param {boolean} [opts.enabled=true]
 * @param {boolean} [opts.fireOnResume=false]
 * @param {number} [opts.lowPowerMultiplier=2]  Multiply interval by this when low power is on.
 */
export function useActivityInterval(callback, intervalMs, opts = {}) {
  const { enabled = true, fireOnResume = false, lowPowerMultiplier = 2 } = opts;
  const { isAppActive } = useAppActivity();
  const lowPowerMode = useConsolidatedAppStore((state) => state.ui?.lowPowerMode ?? false);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) return undefined;
    if (!isAppActive) return undefined;

    const factor = lowPowerMode ? Math.max(1, lowPowerMultiplier) : 1;
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
  }, [enabled, intervalMs, isAppActive, lowPowerMode, lowPowerMultiplier, fireOnResume]);
}

export default useActivityInterval;
