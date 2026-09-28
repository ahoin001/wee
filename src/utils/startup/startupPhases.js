/**
 * Startup phase orchestrator — single clock for "what may run yet" after launch.
 *
 * boot → shell → interactive → idle1 → idle2 → idle3
 *
 * - `shell`: hydration committed (chrome + wallpaper + current page may render).
 * - `interactive`: two painted frames after shell.
 * - `idleN`: each on `requestIdleCallback` with a minimum gap + timeout cap,
 *   paused while the window is hidden. Never advanced by user input.
 *
 * Stored transiently in `app.startupPhase` (the `app` slice is never persisted).
 */

export const STARTUP_PHASES = Object.freeze(['boot', 'shell', 'interactive', 'idle1', 'idle2', 'idle3']);

const PHASE_RANK = Object.freeze(
  STARTUP_PHASES.reduce((acc, phase, index) => {
    acc[phase] = index;
    return acc;
  }, {})
);

export const STARTUP_IDLE_MIN_GAP_MS = 400;
export const STARTUP_IDLE_TIMEOUT_MS = 1500;

export function startupPhaseRank(phase) {
  return PHASE_RANK[phase] ?? 0;
}

export function isStartupPhaseAtLeast(current, minPhase) {
  return startupPhaseRank(current) >= startupPhaseRank(minPhase);
}

function scheduleIdle(cb, timeout) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(cb, { timeout });
    return () => window.cancelIdleCallback?.(id);
  }
  const t = window.setTimeout(cb, Math.min(timeout, 250));
  return () => window.clearTimeout(t);
}

/**
 * Advance from the current phase to `idle3`. Returns a cancel function.
 * @param {{ getPhase: () => string, setPhase: (phase: string) => void, onPhase?: (phase: string) => void }} opts
 */
export function runStartupPhaseOrchestrator({ getPhase, setPhase, onPhase }) {
  if (typeof window === 'undefined') return () => {};
  let cancelled = false;
  let cancelPending = () => {};

  const commit = (phase) => {
    if (cancelled) return;
    if (!isStartupPhaseAtLeast(getPhase(), phase)) {
      setPhase(phase);
      onPhase?.(phase);
    }
  };

  const nextPhaseAfter = (phase) => STARTUP_PHASES[startupPhaseRank(phase) + 1] ?? null;

  const scheduleNext = () => {
    if (cancelled) return;
    const next = nextPhaseAfter(getPhase());
    if (!next) return;

    if (next === 'interactive') {
      let raf2 = 0;
      const raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          commit('interactive');
          scheduleNext();
        });
      });
      cancelPending = () => {
        window.cancelAnimationFrame(raf1);
        if (raf2) window.cancelAnimationFrame(raf2);
      };
      return;
    }

    if (typeof document !== 'undefined' && document.hidden) {
      const onVisible = () => {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', onVisible);
        scheduleNext();
      };
      document.addEventListener('visibilitychange', onVisible);
      cancelPending = () => document.removeEventListener('visibilitychange', onVisible);
      return;
    }

    const gap = window.setTimeout(() => {
      cancelPending = scheduleIdle(() => {
        if (typeof document !== 'undefined' && document.hidden) {
          scheduleNext();
          return;
        }
        commit(next);
        scheduleNext();
      }, STARTUP_IDLE_TIMEOUT_MS);
    }, STARTUP_IDLE_MIN_GAP_MS);
    cancelPending = () => window.clearTimeout(gap);
  };

  scheduleNext();

  return () => {
    cancelled = true;
    cancelPending();
  };
}
