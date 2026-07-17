import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { CHANNEL_SPACE_KEYS } from '../utils/channelSpaces';

function isChannelBoardSpaceId(spaceId) {
  return CHANNEL_SPACE_KEYS.includes(spaceId);
}

/**
 * Jump to Home only when arrange is entered from a hub (no channel board underfoot).
 * Home / Focus already host a board — stay put so Focus users are not scrolled away.
 */
function ensureChannelBoardForArrange(actions, activeSpaceId) {
  if (isChannelBoardSpaceId(activeSpaceId)) return;
  actions.setSpacesState({ activeSpaceId: 'home' });
}

/**
 * Toggle Live Board Studio from outside React (keyboard shortcut registry, admin commands).
 * Single source of the toggle rules — the hook's `toggleArrange` delegates here.
 */
export function toggleHomeBoardArrange() {
  const state = useConsolidatedAppStore.getState();
  const { actions } = state;
  actions.setUIState((prev) => {
    if (prev.homeBoardArrangeMode) {
      return {
        homeBoardArrangeMode: false,
        homeBoardPunchMode: false,
        homeBoardSelectedSlotIndex: null,
      };
    }
    ensureChannelBoardForArrange(actions, state.spaces?.activeSpaceId);
    return { homeBoardArrangeMode: true, homeBoardPunchMode: false };
  });
}

/**
 * Live Board Studio: transient Home-grid arrange overlay (`ui.homeBoardArrangeMode` /
 * `ui.homeBoardPunchMode` / `ui.homeBoardSelectedSlotIndex`). Not persisted.
 */
export function useHomeBoardArrange() {
  const { arrangeMode, punchMode, selectedSlotIndex, setUIState, setSpacesState } =
    useConsolidatedAppStore(
      useShallow((state) => ({
        arrangeMode: Boolean(state.ui.homeBoardArrangeMode),
        punchMode: Boolean(state.ui.homeBoardPunchMode),
        selectedSlotIndex:
          state.ui.homeBoardSelectedSlotIndex == null
            ? null
            : Number(state.ui.homeBoardSelectedSlotIndex),
        setUIState: state.actions.setUIState,
        setSpacesState: state.actions.setSpacesState,
      }))
    );

  /**
   * Enter Live Board Studio on the current channel board (Home or Focus).
   * Hubs jump to Home so arrange has a board; Home/Focus stay put.
   * Pass `punchMode: true` to deep-link straight into wallpaper-hole editing.
   */
  const enterArrange = useCallback(
    ({ closeSettings = false, punchMode: startPunch = false } = {}) => {
      const activeSpaceId = useConsolidatedAppStore.getState().spaces?.activeSpaceId;
      if (!isChannelBoardSpaceId(activeSpaceId)) {
        setSpacesState({ activeSpaceId: 'home' });
      }
      setUIState({
        homeBoardArrangeMode: true,
        homeBoardPunchMode: Boolean(startPunch),
        homeBoardSelectedSlotIndex: null,
        ...(closeSettings ? { showSettingsModal: false } : {}),
      });
    },
    [setSpacesState, setUIState]
  );

  const exitArrange = useCallback(() => {
    setUIState({
      homeBoardArrangeMode: false,
      homeBoardPunchMode: false,
      homeBoardSelectedSlotIndex: null,
    });
  }, [setUIState]);

  const toggleArrange = useCallback(() => {
    toggleHomeBoardArrange();
  }, []);

  const setPunchMode = useCallback(
    (next) => {
      setUIState((prev) => ({
        homeBoardPunchMode:
          typeof next === 'function' ? next(Boolean(prev.homeBoardPunchMode)) : Boolean(next),
        // Punch and widget selection don't mix well — clear selection when punching.
        ...(typeof next === 'function'
          ? {}
          : next
            ? { homeBoardSelectedSlotIndex: null }
            : {}),
      }));
    },
    [setUIState]
  );

  const togglePunchMode = useCallback(() => {
    setUIState((prev) => {
      const nextPunch = !prev.homeBoardPunchMode;
      return {
        homeBoardPunchMode: nextPunch,
        ...(nextPunch ? { homeBoardSelectedSlotIndex: null } : {}),
      };
    });
  }, [setUIState]);

  const setSelectedSlotIndex = useCallback(
    (index) => {
      setUIState({
        homeBoardSelectedSlotIndex: index == null || Number.isNaN(Number(index)) ? null : Number(index),
      });
    },
    [setUIState]
  );

  useEffect(() => {
    if (!arrangeMode) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        exitArrange();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [arrangeMode, exitArrange]);

  return {
    arrangeMode,
    punchMode,
    selectedSlotIndex: Number.isFinite(selectedSlotIndex) ? selectedSlotIndex : null,
    enterArrange,
    exitArrange,
    toggleArrange,
    setPunchMode,
    togglePunchMode,
    setSelectedSlotIndex,
  };
}

export default useHomeBoardArrange;
