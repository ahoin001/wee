import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { SPACE_SHELL_ENTRANCE_TIERS } from '../design/spaceShellMotion';

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
 * Every entrance run (including cold-start home when already active) uses a reveal pulse:
 * hidden → bump entranceKey → double-rAF → show, so Framer always sees a rising edge.
 * First visit also waits until the shell world transition finishes when coming from another space.
 *
 * @param {string} spaceId
 * @param {boolean} reducedMotion
 */
export function useHubSpaceEntrance(spaceId, reducedMotion) {
  const { activeSpaceId, isSpaceTransitioning } = useConsolidatedAppStore(
    useShallow((s) => ({
      activeSpaceId: s.spaces?.activeSpaceId,
      isSpaceTransitioning: s.spaces?.isTransitioning ?? false,
    }))
  );

  const isActive = activeSpaceId === spaceId;
  const canStart = isActive && !isSpaceTransitioning;

  /** Start false so first paint with `isActive` still runs the activation effect. */
  const prevIsActiveRef = useRef(false);
  const prevCanStartRef = useRef(false);
  const runCounterRef = useRef(0);
  const coldStartPulsedRef = useRef(false);
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
   * Pulse once when canStart becomes true so home gets the same hidden→show edge as return.
   */
  useEffect(() => {
    if (!canStart || coldStartPulsedRef.current) {
      prevCanStartRef.current = canStart;
      return;
    }
    // Rising edge of canStart without a prior activation bump (entranceKey still 0).
    if (!prevCanStartRef.current && entranceKey === 0) {
      coldStartPulsedRef.current = true;
      const tier = reducedMotion
        ? SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey
        : readTier(spaceId);
      setRunTier(tier);
      bumpEntrance(tier);
    } else if (canStart && entranceKey > 0) {
      coldStartPulsedRef.current = true;
    }
    prevCanStartRef.current = canStart;
  }, [canStart, entranceKey, reducedMotion, spaceId, bumpEntrance]);

  useLayoutEffect(() => {
    if (!isActive || !canStart || entranceKey === 0) {
      if (!isActive) setRevealToShow(false);
      return undefined;
    }
    setRevealToShow(false);
    let cancelled = false;
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        if (!cancelled) setRevealToShow(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id1);
      if (id2) cancelAnimationFrame(id2);
    };
  }, [isActive, canStart, entranceKey]);

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
    if (!canStart) return 'hidden';
    return revealToShow ? 'show' : 'hidden';
  })();

  return {
    entranceKey,
    tier: runTier,
    canStart,
    animateState,
    onEntranceComplete,
  };
}
