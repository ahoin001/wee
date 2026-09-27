import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

/**
 * Toggle Live Board Studio from outside React (keyboard shortcut registry, admin commands).
 * Stays on the space you are already in. Hubs edit the scene; Home keeps the tile board.
 */
export function toggleHomeBoardArrange() {
  const { actions } = useConsolidatedAppStore.getState();
  actions.setUIState((prev) => {
    if (prev.homeBoardArrangeMode) {
      return {
        homeBoardArrangeMode: false,
        homeBoardPunchMode: false,
        homeBoardSelectedSlotIndex: null,
      };
    }
    return { homeBoardArrangeMode: true, homeBoardPunchMode: false };
  });
}

/**
 * Live Board Studio: transient Home-grid arrange overlay (`ui.homeBoardArrangeMode` /
 * `ui.homeBoardPunchMode` / `ui.homeBoardSelectedSlotIndex`). Not persisted.
 */
export function useHomeBoardArrange() {
  const { arrangeMode, punchMode, selectedSlotIndex, setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      arrangeMode: Boolean(state.ui.homeBoardArrangeMode),
      punchMode: Boolean(state.ui.homeBoardPunchMode),
      selectedSlotIndex:
        state.ui.homeBoardSelectedSlotIndex == null
          ? null
          : Number(state.ui.homeBoardSelectedSlotIndex),
      setUIState: state.actions.setUIState,
    }))
  );

  /**
   * Enter edit mode on the page you are already on.
   * Home and Second Home keep the tile board. Hubs stay hubs and edit the scene.
   * Pass `punchMode: true` to deep-link straight into wallpaper-hole editing.
   */
  const enterArrange = useCallback(
    ({ closeSettings = false, punchMode: startPunch = false } = {}) => {
      setUIState({
        homeBoardArrangeMode: true,
        homeBoardPunchMode: Boolean(startPunch),
        homeBoardSelectedSlotIndex: null,
        ...(closeSettings ? { showSettingsModal: false } : {}),
      });
    },
    [setUIState]
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
