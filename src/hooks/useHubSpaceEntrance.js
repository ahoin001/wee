import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { SPACE_SHELL_ENTRANCE_TIERS } from '../design/spaceShellMotion';

const STORAGE_PREFIX = 'wee.hubEntrance.';

/** @param {'gamehub' | 'mediahub'} spaceId */
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
 * First visit waits until the shell world transition finishes so the entrance does not fight the shell.
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
  const [entranceKey, setEntranceKey] = useState(0);
  const [runTier, setRunTier] = useState(() =>
    reducedMotion ? SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey : readTier(spaceId)
  );
  const tierByEntranceKeyRef = useRef(new Map());
  const completedRunRef = useRef(0);

  /** Revisit: second rAF flips to `show` so Framer sees a real hidden→show edge. */
  const [revisitToShow, setRevisitToShow] = useState(false);

  const isRevisitTier = runTier === SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey;

  useEffect(() => {
    if (isActive && !prevIsActiveRef.current) {
      const nextTier = reducedMotion
        ? SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey
        : readTier(spaceId);
      setRunTier(nextTier);
      if (nextTier === SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey) {
        runCounterRef.current += 1;
        const nextKey = runCounterRef.current;
        tierByEntranceKeyRef.current.set(nextKey, nextTier);
        setEntranceKey(nextKey);
      }
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, reducedMotion, spaceId]);

  useEffect(() => {
    if (runTier !== SPACE_SHELL_ENTRANCE_TIERS.firstVisitPlayful) {
      prevCanStartRef.current = canStart;
      return;
    }
    if (canStart && !prevCanStartRef.current) {
      runCounterRef.current += 1;
      const nextKey = runCounterRef.current;
      tierByEntranceKeyRef.current.set(nextKey, runTier);
      setEntranceKey(nextKey);
    }
    prevCanStartRef.current = canStart;
  }, [canStart, runTier]);

  useLayoutEffect(() => {
    if (!isActive || !isRevisitTier) {
      setRevisitToShow(false);
      return undefined;
    }
    setRevisitToShow(false);
    let cancelled = false;
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        if (!cancelled) setRevisitToShow(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id1);
      if (id2) cancelAnimationFrame(id2);
    };
  }, [isActive, isRevisitTier, entranceKey]);

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
    if (isRevisitTier) return revisitToShow ? 'show' : 'hidden';
    return canStart ? 'show' : 'hidden';
  })();

  return {
    entranceKey,
    tier: runTier,
    canStart,
    animateState,
    onEntranceComplete,
  };
}
