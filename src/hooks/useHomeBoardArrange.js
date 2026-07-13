import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

/**
 * Live Board Studio: transient Home-grid arrange overlay (`ui.homeBoardArrangeMode` /
 * `ui.homeBoardPunchMode`). Not persisted — resets to off on reload.
 * Escape always exits; entering only makes sense while the Home board is on screen.
 */
export function useHomeBoardArrange() {
  const { arrangeMode, punchMode, setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      arrangeMode: Boolean(state.ui.homeBoardArrangeMode),
      punchMode: Boolean(state.ui.homeBoardPunchMode),
      setUIState: state.actions.setUIState,
    }))
  );

  const enterArrange = useCallback(() => {
    setUIState({ homeBoardArrangeMode: true });
  }, [setUIState]);

  const exitArrange = useCallback(() => {
    setUIState({ homeBoardArrangeMode: false, homeBoardPunchMode: false });
  }, [setUIState]);

  const toggleArrange = useCallback(() => {
    setUIState((prev) =>
      prev.homeBoardArrangeMode
        ? { homeBoardArrangeMode: false, homeBoardPunchMode: false }
        : { homeBoardArrangeMode: true }
    );
  }, [setUIState]);

  const setPunchMode = useCallback(
    (next) => {
      setUIState((prev) => ({
        homeBoardPunchMode: typeof next === 'function' ? next(Boolean(prev.homeBoardPunchMode)) : Boolean(next),
      }));
    },
    [setUIState]
  );

  const togglePunchMode = useCallback(() => {
    setPunchMode((prev) => !prev);
  }, [setPunchMode]);

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
    enterArrange,
    exitArrange,
    toggleArrange,
    setPunchMode,
    togglePunchMode,
  };
}

export default useHomeBoardArrange;
