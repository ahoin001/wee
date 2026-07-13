import { useEffect, useRef } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { useAppActivity } from './useAppActivity';
import { resolveChannelPerformancePause } from '../utils/launch/isIntensiveLaunchTarget';

/**
 * Clears ui.sessionPower 'away' when Wee regains focus after an intensive launch.
 * Waits until blur has been observed so we don't clear away in the same tick as launch.
 * Never minimizes — only frees decorative resources.
 */
export function useSessionPowerSync() {
  const { isAppActive } = useAppActivity();
  const sessionPower = useConsolidatedAppStore((s) => s.ui.sessionPower ?? 'normal');
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);
  const sawInactiveWhileAwayRef = useRef(false);

  useEffect(() => {
    if (sessionPower !== 'away') {
      sawInactiveWhileAwayRef.current = false;
      return;
    }
    if (!isAppActive) {
      sawInactiveWhileAwayRef.current = true;
      return;
    }
    if (sawInactiveWhileAwayRef.current) {
      setUIState({ sessionPower: 'normal' });
    }
  }, [isAppActive, sessionPower, setUIState]);
}

/**
 * Enter deep-pause session after an intensive launch (no window minimize).
 * @param {{ type?: string, path?: string, source?: string, mode?: string }} target
 * @returns {boolean}
 */
export function enterSessionAwayIfIntensive(target = {}) {
  const state = useConsolidatedAppStore.getState();
  const master = state.ui?.performancePauseOnGameLaunch !== false;
  if (!master) return false;

  const should = resolveChannelPerformancePause(target);
  if (!should) return false;

  state.actions.setUIState({ sessionPower: 'away' });
  return true;
}

export default useSessionPowerSync;
