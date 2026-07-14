import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

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
   * Enter Live Board Studio on Home.
   * Always jumps to the Home space and closes Settings so the arrange bar is visible.
   */
  const enterArrange = useCallback(
    ({ closeSettings = false } = {}) => {
      setSpacesState({ activeSpaceId: 'home' });
      setUIState({
        homeBoardArrangeMode: true,
        homeBoardPunchMode: false,
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
    setUIState((prev) => {
      if (prev.homeBoardArrangeMode) {
        return {
          homeBoardArrangeMode: false,
          homeBoardPunchMode: false,
          homeBoardSelectedSlotIndex: null,
        };
      }
      setSpacesState({ activeSpaceId: 'home' });
      return { homeBoardArrangeMode: true, homeBoardPunchMode: false };
    });
  }, [setSpacesState, setUIState]);

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
