import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { useAppActivity } from './useAppActivity';
import { usePowerPolicy } from './usePowerPolicy';
import { normalizeIdleExperienceSettings } from '../utils/idleExperience';

/**
 * Shared Home idle state machine — the single clock behind grid auto-fade,
 * tile micro-delights, and attract mode.
 *
 * Stages: `active → ambient → attract`, with `paused` while an overlay owns the
 * board (Edit Home, configure modal, settings, command palette) or power policy
 * says away. Callers report interaction through `bumpActivity` (already throttled
 * by the grid's pointer handlers) — no parallel timers per feature.
 *
 * @param {{ enabled?: boolean }} [options] — `enabled` is "this board is the visible Home board".
 * @returns {{
 *   stage: 'active' | 'ambient' | 'attract' | 'paused',
 *   isFaded: boolean,
 *   delightsActive: boolean,
 *   attractActive: boolean,
 *   config: ReturnType<typeof normalizeIdleExperienceSettings>,
 *   bumpActivity: () => void,
 * }}
 */
export function useHomeIdleExperience({ enabled = true } = {}) {
  const channelSettings = useConsolidatedAppStore((s) => s.channels.settings);
  const config = useMemo(() => normalizeIdleExperienceSettings(channelSettings), [channelSettings]);

  const overlayBlocked = useConsolidatedAppStore(
    useShallow(
      (s) =>
        Boolean(s.ui.homeBoardArrangeMode) ||
        Boolean(s.ui.homeBoardPunchMode) ||
        Boolean(s.ui.showSettingsModal) ||
        Boolean(s.ui.channelConfigureModalOpen) ||
        Boolean(s.ui.commandPaletteOpen) ||
        Boolean(s.ui.spotifyTakeoverActive)
    )
  );

  const { isAppActive } = useAppActivity();
  const power = usePowerPolicy();
  const reducedMotion = useReducedMotion();

  const runnable = enabled && config.mode !== 'off' && !overlayBlocked && !power.isAway;
  // Attract is the showy stage: focused app only, never under reduced motion or low power.
  const attractAllowed =
    config.mode === 'attract' && isAppActive && !reducedMotion && !power.isEfficient;

  const [stage, setStage] = useState('active');
  const timerRef = useRef(null);
  const stageRef = useRef('active');
  stageRef.current = stage;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const attractAllowedRef = useRef(attractAllowed);
  attractAllowedRef.current = attractAllowed;

  /** One clock: schedule the next stage transition from `from`. */
  const scheduleFrom = useCallback(
    (from) => {
      clearTimer();
      if (from === 'active') {
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          setStage('ambient');
          scheduleFrom('ambient');
        }, config.idleDelaySec * 1000);
      } else if (from === 'ambient' && attractAllowedRef.current) {
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          if (attractAllowedRef.current) setStage('attract');
        }, config.attractDelaySec * 1000);
      }
    },
    [clearTimer, config.idleDelaySec, config.attractDelaySec]
  );

  const bumpActivity = useCallback(() => {
    if (!runnable) return;
    if (stageRef.current !== 'active') setStage('active');
    scheduleFrom('active');
  }, [runnable, scheduleFrom]);

  // Lifecycle: start/stop the clock with runnability; re-arm on config changes.
  useEffect(() => {
    if (!runnable) {
      clearTimer();
      setStage('active');
      return undefined;
    }
    setStage('active');
    scheduleFrom('active');
    return clearTimer;
  }, [runnable, scheduleFrom, clearTimer]);

  // Attract lost its preconditions mid-stage (blur, low power, reduced motion): fall back to ambient.
  useEffect(() => {
    if (stage === 'attract' && !attractAllowed) {
      setStage('ambient');
    }
  }, [stage, attractAllowed]);

  const effectiveStage = runnable ? stage : overlayBlocked || power.isAway ? 'paused' : 'active';

  // Mirror stage into ui.homeIdleStage (transient) so cross-cutting consumers
  // (Now Playing takeover, attract visuals) share this clock instead of adding their own.
  useEffect(() => {
    const { ui, actions } = useConsolidatedAppStore.getState();
    if (ui.homeIdleStage !== effectiveStage) {
      actions.setUIState({ homeIdleStage: effectiveStage });
    }
  }, [effectiveStage]);

  const idleStageForDelights =
    effectiveStage === 'ambient' || effectiveStage === 'attract';
  // While-active: play on Home whenever the idle clock is runnable (active/ambient/attract),
  // not only after the idle timeout. Overlay / away still pause via `paused`.
  const delightsActive =
    config.delightsEnabled &&
    (config.delightsWhileActive
      ? effectiveStage !== 'paused'
      : idleStageForDelights);

  return {
    stage: effectiveStage,
    isFaded: effectiveStage === 'ambient' || effectiveStage === 'attract',
    delightsActive,
    attractActive: effectiveStage === 'attract',
    config,
    bumpActivity,
  };
}

export default useHomeIdleExperience;
