/**
 * Space rail reveal / auto-hide — shared scheduler so every reveal path
 * (pill, settings, shortcut, wheel, space switch settle) can hide when unpinned.
 *
 * Canonical visibility still lives on `spaces.railPinned` / `autoHideRail` / `railVisible`.
 */

import useConsolidatedAppStore from './useConsolidatedAppStore';

export const SPACE_RAIL_HIDE_DELAY_MS = 900;

let hideTimerId = null;

export function clearSpaceRailHideTimer() {
  if (hideTimerId != null) {
    window.clearTimeout(hideTimerId);
    hideTimerId = null;
  }
}

/**
 * Schedule `railVisible: false` when unpinned + auto-hide and not mid-transition.
 * @param {{ delayMs?: number }} [opts]
 */
export function scheduleSpaceRailHideIfEligible({ delayMs = SPACE_RAIL_HIDE_DELAY_MS } = {}) {
  clearSpaceRailHideTimer();
  const spaces = useConsolidatedAppStore.getState().spaces || {};
  if (spaces.railPinned || spaces.autoHideRail === false || spaces.isTransitioning) {
    return;
  }
  hideTimerId = window.setTimeout(() => {
    hideTimerId = null;
    const next = useConsolidatedAppStore.getState().spaces || {};
    if (next.railPinned || next.autoHideRail === false || next.isTransitioning) {
      return;
    }
    useConsolidatedAppStore.getState().actions.setSpacesState({ railVisible: false });
  }, Math.max(0, Number(delayMs) || 0));
}

/**
 * Call when the space-world slide settles (`isTransitioning` → false).
 * Hides an unpinned auto-hide rail that was revealed for navigation.
 */
export function onSpaceRailTransitionSettled() {
  scheduleSpaceRailHideIfEligible();
}

/**
 * Reveal the rail; schedule hide once eligible unless pinned or auto-hide is off.
 * @param {{ scheduleHide?: boolean }} [opts]
 */
export function revealSpaceRail({ scheduleHide = true } = {}) {
  clearSpaceRailHideTimer();
  useConsolidatedAppStore.getState().actions.setSpacesState({ railVisible: true });
  if (!scheduleHide) return;
  const spaces = useConsolidatedAppStore.getState().spaces || {};
  if (spaces.railPinned || spaces.autoHideRail === false) return;
  if (spaces.isTransitioning) return;
  scheduleSpaceRailHideIfEligible();
}

/**
 * Toggle pin. Unpin schedules hide; pin keeps the rail visible.
 * @param {boolean} [nextPinned] — omit to flip
 */
export function setSpaceRailPinned(nextPinned) {
  clearSpaceRailHideTimer();
  const spaces = useConsolidatedAppStore.getState().spaces || {};
  const pinned =
    typeof nextPinned === 'boolean' ? nextPinned : !Boolean(spaces.railPinned);
  useConsolidatedAppStore.getState().actions.setSpacesState({
    railPinned: pinned,
    railVisible: true,
  });
  if (!pinned) {
    scheduleSpaceRailHideIfEligible();
  }
}
