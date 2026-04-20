import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

const STORAGE_PREFIX = 'wee.hubEntrance.';

/** @param {'gamehub' | 'mediahub'} spaceId */
export function hubEntranceStorageKey(spaceId) {
  return `${STORAGE_PREFIX}${spaceId}`;
}

const memoryFullComplete = { gamehub: false, mediahub: false };

function readTier(spaceId) {
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(hubEntranceStorageKey(spaceId)) === '1') {
      return 'subtle';
    }
  } catch {
    /* ignore */
  }
  if (memoryFullComplete[spaceId]) return 'subtle';
  return 'full';
}

function writeFullComplete(spaceId) {
  try {
    sessionStorage.setItem(hubEntranceStorageKey(spaceId), '1');
  } catch {
    /* ignore */
  }
  memoryFullComplete[spaceId] = true;
}

/**
 * Session-aware hub entrance: full spring (~2s feel) first visit per session per hub,
 * subtle stagger on return. Animations start when the space is active and space-world transition finished.
 *
 * @param {'gamehub' | 'mediahub'} spaceId
 * @param {boolean} reducedMotion
 */
export function useHubSpaceEntrance(spaceId, reducedMotion) {
  const { activeSpaceId, isSpaceTransitioning } = useConsolidatedAppStore(
    useShallow((s) => ({
      activeSpaceId: s.spaces?.activeSpaceId,
      isSpaceTransitioning: Boolean(s.spaces?.isTransitioning),
    }))
  );

  const isActive = activeSpaceId === spaceId;
  const canStart = isActive && !isSpaceTransitioning;

  /**
   * Bump entrance key during render when we *land* on this hub (canStart flips false → true).
   * Doing this only in useLayoutEffect left one committed frame with initial={false} and full
   * opacity, then a remount/half-animation — bad flash. React 18 re-renders synchronously when
   * setState runs during render, before paint.
   */
  const prevCanStartRef = useRef(false);
  const [entranceKey, setEntranceKey] = useState(0);
  /** Snapshot of full vs subtle for this entrance run only (bumped with `entranceKey`). */
  const [runTier, setRunTier] = useState('full');

  if (canStart && !prevCanStartRef.current) {
    prevCanStartRef.current = true;
    setEntranceKey((k) => k + 1);
  } else if (!canStart) {
    prevCanStartRef.current = false;
  }

  const tierByEntranceKeyRef = useRef(new Map());

  useLayoutEffect(() => {
    if (entranceKey === 0) return;
    const t = readTier(spaceId);
    setRunTier(t);
    tierByEntranceKeyRef.current.set(entranceKey, t);
  }, [entranceKey, spaceId]);

  /** Pass the `entranceKey` of the orchestrator that finished (avoid stale closure if user switches fast). */
  const onEntranceComplete = useCallback(
    (completedKey) => {
      const t = tierByEntranceKeyRef.current.get(completedKey);
      if (t === 'full') {
        writeFullComplete(spaceId);
      }
    },
    [spaceId]
  );

  return {
    entranceKey,
    /** Tier for the current entrance animation (stable for the whole run). */
    tier: runTier,
    canStart,
    onEntranceComplete,
  };
}
