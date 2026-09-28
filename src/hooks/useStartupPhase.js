import { useCallback, useEffect, useState } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { isStartupPhaseAtLeast, runStartupPhaseOrchestrator } from '../utils/startup/startupPhases';
import { weeMarkStartupPhase } from '../utils/weePerformanceMarks';

/** Upper bound if the splash `transitionend` never fires (hidden window, interrupted paint). */
const SPLASH_UNMOUNT_FALLBACK_MS = 900;

/**
 * True once startup has reached `minPhase` (boolean selector — no re-render churn per phase
 * unless the answer flips).
 * @param {'boot'|'shell'|'interactive'|'idle1'|'idle2'|'idle3'} minPhase
 */
export function useStartupPhase(minPhase) {
  return useConsolidatedAppStore((s) => isStartupPhaseAtLeast(s.app.startupPhase, minPhase));
}

/** Non-reactive read for effects / schedulers outside React render. */
export function getStartupPhaseReached(minPhase) {
  return isStartupPhaseAtLeast(useConsolidatedAppStore.getState().app.startupPhase, minPhase);
}

/** Mount once in App: advances phases after hydration commits (`shell`). */
export function useStartupPhaseOrchestrator() {
  const shellReady = useStartupPhase('shell');
  useEffect(() => {
    if (!shellReady) return undefined;
    return runStartupPhaseOrchestrator({
      getPhase: () => useConsolidatedAppStore.getState().app.startupPhase,
      setPhase: (phase) =>
        useConsolidatedAppStore.getState().actions.setAppState({ startupPhase: phase }),
      onPhase: weeMarkStartupPhase,
    });
  }, [shellReady]);
}

/**
 * Splash stays mounted over the painted shell, fades at `interactive`, then unmounts
 * after its CSS fade — so the first visible frame after boot is never a blank pop.
 */
export function useSplashHandoff() {
  const interactive = useStartupPhase('interactive');
  const splashFading = useConsolidatedAppStore((s) => Boolean(s.app.splashFading));
  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    if (!interactive || !splashMounted) return undefined;
    useConsolidatedAppStore.getState().actions.setAppState({ splashFading: true });
    const timer = window.setTimeout(() => setSplashMounted(false), SPLASH_UNMOUNT_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [interactive, splashMounted]);

  const onSplashFadeOutEnd = useCallback(() => setSplashMounted(false), []);

  return {
    splashMounted,
    splashFading: interactive && splashFading,
    onSplashFadeOutEnd,
  };
}
