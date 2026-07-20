import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import {
  SPACE_SHELL_ENTRANCE_TIERS,
  SPACE_SHELL_TRANSITION_MS_DEFAULT,
  resolveSpaceShellEntranceTiming,
} from '../design/spaceShellMotion';

const STORAGE_PREFIX = 'wee.hubEntrance.';

/** @param {'gamehub' | 'mediahub' | 'home' | string} spaceId */
export function hubEntranceStorageKey(spaceId) {
  return `${STORAGE_PREFIX}${spaceId}`;
}

const memoryFullComplete = new Map();

function readTier(spaceId) {
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(hubEntranceStorageKey(spaceId)) === '1') {
      return SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey;
    }
  } catch {
    /* ignore */
  }
  if (memoryFullComplete.get(spaceId) === true) return SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey;
  return SPACE_SHELL_ENTRANCE_TIERS.firstVisitPlayful;
}

function writeFullComplete(spaceId) {
  try {
    sessionStorage.setItem(hubEntranceStorageKey(spaceId), '1');
  } catch {
    /* ignore */
  }
  memoryFullComplete.set(spaceId, true);
}

/**
 * Session-aware shell-space entrance: playful spring first visit per session per space;
 * revisit runs a visible hidden→show assembly (stagger) on each landing.
 *
 * Content reveal starts mid-shell-slide (`SPACE_SHELL_CONTENT_REVEAL_AT`) so stagger
 * shares one timeline with the CSS space-world track — not a post-arrival second wave.
 *
 * @param {string} spaceId
 * @param {boolean} reducedMotion
 */
export function useHubSpaceEntrance(spaceId, reducedMotion) {
  const { activeSpaceId, shellTransitionMs } = useConsolidatedAppStore(
    useShallow((s) => ({
      activeSpaceId: s.spaces?.activeSpaceId,
      shellTransitionMs:
        s.spaces?.shellTransitionMs ?? SPACE_SHELL_TRANSITION_MS_DEFAULT,
    }))
  );

  const isActive = activeSpaceId === spaceId;
  const shellMs =
    typeof shellTransitionMs === 'number' && shellTransitionMs > 0
      ? shellTransitionMs
      : SPACE_SHELL_TRANSITION_MS_DEFAULT;

  /** Start false so first paint with `isActive` still runs the activation effect. */
  const prevIsActiveRef = useRef(false);
  const coldStartPulsedRef = useRef(false);
  const runCounterRef = useRef(0);
  const [entranceKey, setEntranceKey] = useState(0);
  const [runTier, setRunTier] = useState(() =>
    reducedMotion ? SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey : readTier(spaceId)
  );
  const tierByEntranceKeyRef = useRef(new Map());
  const completedRunRef = useRef(0);

  /** Reveal pulse: second rAF flips to `show` so Framer sees a real hidden→show edge. */
  const [revealToShow, setRevealToShow] = useState(false);

  const bumpEntrance = useCallback((tier) => {
    runCounterRef.current += 1;
    const nextKey = runCounterRef.current;
    tierByEntranceKeyRef.current.set(nextKey, tier);
    setEntranceKey(nextKey);
    setRevealToShow(false);
  }, []);

  useEffect(() => {
    if (isActive && !prevIsActiveRef.current) {
      const nextTier = reducedMotion
        ? SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey
        : readTier(spaceId);
      setRunTier(nextTier);
      // Always bump on activation so tiles remount; reveal pulse drives show.
      bumpEntrance(nextTier);
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, reducedMotion, spaceId, bumpEntrance]);

  /**
   * Cold start: space is already active on first mount (`prevIsActive` never rises).
   * Pulse once so home gets the same hidden→show edge as return.
   */
  useEffect(() => {
    if (!isActive || coldStartPulsedRef.current) return;
    if (entranceKey === 0) {
      coldStartPulsedRef.current = true;
      const tier = reducedMotion
        ? SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey
        : readTier(spaceId);
      setRunTier(tier);
      bumpEntrance(tier);
    } else {
      coldStartPulsedRef.current = true;
    }
  }, [isActive, entranceKey, reducedMotion, spaceId, bumpEntrance]);

  useLayoutEffect(() => {
    if (!isActive || entranceKey === 0) {
      if (!isActive) setRevealToShow(false);
      return undefined;
    }
    setRevealToShow(false);
    let cancelled = false;
    let id1 = 0;
    let id2 = 0;
    let timer = 0;

    const pulseShow = () => {
      id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => {
          if (!cancelled) setRevealToShow(true);
        });
      });
    };

    // Capture transition gate once at entrance start — do not re-arm when settle flips.
    const transitioning = Boolean(
      useConsolidatedAppStore.getState().spaces?.isTransitioning
    );
    const { revealAtMs } = resolveSpaceShellEntranceTiming(shellMs);
    const waitMs = reducedMotion || !transitioning ? 0 : revealAtMs;

    if (waitMs <= 0) {
      pulseShow();
    } else {
      timer = window.setTimeout(pulseShow, waitMs);
    }

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      cancelAnimationFrame(id1);
      if (id2) cancelAnimationFrame(id2);
    };
  }, [isActive, entranceKey, shellMs, reducedMotion]);

  const onEntranceComplete = useCallback(
    (completedKey = entranceKey) => {
      if (!completedKey || completedRunRef.current === completedKey) return;
      completedRunRef.current = completedKey;
      const t = tierByEntranceKeyRef.current.get(completedKey);
      if (t === SPACE_SHELL_ENTRANCE_TIERS.firstVisitPlayful) {
        writeFullComplete(spaceId);
      }
    },
    [entranceKey, spaceId]
  );

  const animateState = (() => {
    if (!isActive) return 'hidden';
    return revealToShow ? 'show' : 'hidden';
  })();

  return {
    entranceKey,
    tier: runTier,
    /** @deprecated Prefer animateState — kept for callers that gated on settle. */
    canStart: isActive && revealToShow,
    shellMs,
    animateState,
    onEntranceComplete,
  };
}
