import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Keeps a Headless UI `Dialog` subtree mounted until close motion finishes, so nested
 * Framer `motion` layers can run exit-like transitions while `Dialog` stays `open={true}`.
 *
 * Headless `Dialog` with `open={false}` tears down before nested exit animations complete;
 * animating with `animate="closed"` while mounted avoids that race.
 *
 * @param {boolean} isOpen
 * @param {() => void} [onExitAnimationComplete] — called once after close animation finishes (e.g. parent unmount latch).
 */
export function useDialogExitPresence(isOpen, onExitAnimationComplete) {
  const [allowMount, setAllowMount] = useState(() => !!isOpen);
  const closingHandledRef = useRef(false);
  const exitCbRef = useRef(onExitAnimationComplete);
  exitCbRef.current = onExitAnimationComplete;

  useLayoutEffect(() => {
    if (isOpen) {
      setAllowMount(true);
      closingHandledRef.current = false;
    }
  }, [isOpen]);

  const onPanelAnimationComplete = useCallback(() => {
    if (!isOpen && !closingHandledRef.current) {
      closingHandledRef.current = true;
      setAllowMount(false);
      exitCbRef.current?.();
    }
  }, [isOpen]);

  return { allowMount, onPanelAnimationComplete };
}
