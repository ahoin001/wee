import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Normalize Framer Motion's `onAnimationComplete` / `onAnimationStart` definition argument
 * when using named variants (`open` / `closed`).
 *
 * @param {unknown} definition
 * @returns {string | null}
 */
function variantNameFromDefinition(definition) {
  if (definition == null) return null;
  if (typeof definition === 'string') return definition;
  if (Array.isArray(definition)) {
    const last = definition[definition.length - 1];
    return typeof last === 'string' ? last : null;
  }
  return null;
}

/**
 * Keeps a Headless UI `Dialog` subtree mounted until close motion finishes, so nested
 * Framer `motion` layers can run exit-like transitions while `Dialog` stays `open={true}`.
 *
 * Headless `Dialog` with `open={false}` tears down before nested exit animations complete;
 * animating with `animate="closed"` while mounted avoids that race.
 *
 * Only finishes after the **closed** variant completes: a late `open` completion (e.g. user
 * closed before the entry spring finished) must not unmount early and skip the exit motion.
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

  const onPanelAnimationComplete = useCallback(
    (definition) => {
      if (isOpen || closingHandledRef.current) return;
      const variant = variantNameFromDefinition(definition);
      if (variant !== 'closed') return;
      closingHandledRef.current = true;
      setAllowMount(false);
      exitCbRef.current?.();
    },
    [isOpen]
  );

  return { allowMount, onPanelAnimationComplete };
}
