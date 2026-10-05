import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { clampPageIndex, resolveShelfGeometry } from '../utils/channelLayoutSystem';

/**
 * Pan clock for the continuous channel shelf.
 *
 * One motion value in px owns the strip's horizontal position for every input: discrete
 * page steps today, and the phase-two drag/trackpad scrub writes into the same value so
 * there is never a second timing clock for the same travel.
 *
 * Width is measured off the laid-out strip (`ResizeObserver`, transform-independent) and
 * divided by `totalPages`, which keeps the peek band's definition in CSS where its
 * rail-gutter floor is tokenized.
 *
 * @param {object} opts
 * @param {number} opts.totalPages
 * @param {number} opts.currentPage
 * @param {boolean} [opts.isAnimating] — store nav lock; true while a page step is in flight.
 * @param {'none'|'left'|'right'} [opts.animationDirection]
 * @param {boolean} [opts.animationWrapped] — enter one page-step off target, never scrub the middle.
 * @param {object} opts.transition — `createWeeTransition('channelPageFlip')`.
 * @param {boolean} [opts.reducedMotion]
 * @param {() => void} [opts.onSettled] — clears the nav lock once the pan lands.
 */
export default function useChannelShelfPan({
  totalPages,
  currentPage,
  isAnimating = false,
  animationDirection = 'none',
  animationWrapped = false,
  transition,
  reducedMotion = false,
  onSettled,
}) {
  const stripRef = useRef(null);
  const stripX = useMotionValue(0);
  const [stripWidth, setStripWidth] = useState(0);

  const safeTotalPages = Math.max(1, Math.floor(Number(totalPages)) || 1);
  const safeCurrentPage = clampPageIndex(currentPage, safeTotalPages);

  const geometry = useMemo(
    () => resolveShelfGeometry({ stripWidthPx: stripWidth, totalPages: safeTotalPages }),
    [stripWidth, safeTotalPages]
  );

  const measure = useCallback((width) => {
    setStripWidth((prev) => (Math.abs(prev - width) > 0.5 ? width : prev));
  }, []);

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return undefined;
    measure(el.offsetWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      // contentRect is layout size — unaffected by the transform this hook drives.
      measure(entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;
  const transitionRef = useRef(transition);
  transitionRef.current = transition;

  /** First measured frame parks instead of flying in from 0. */
  const positionedRef = useRef(false);

  useLayoutEffect(() => {
    if (!stripWidth) return undefined;

    const target = geometry.pageX(safeCurrentPage);
    const parkOnly = !isAnimating || !positionedRef.current;
    positionedRef.current = true;

    if (parkOnly) {
      stripX.set(target);
      if (!isAnimating) return undefined;
      // Mounted mid-flip: nothing to animate, but the nav lock still has to clear.
      const frame = requestAnimationFrame(() => settledRef.current?.());
      return () => cancelAnimationFrame(frame);
    }

    const wrapStep =
      animationWrapped && safeTotalPages > 1 && !reducedMotion
        ? animationDirection === 'right'
          ? geometry.pageWidth
          : -geometry.pageWidth
        : 0;
    if (wrapStep) stripX.set(target + wrapStep);

    const controls = animate(stripX, target, {
      ...transitionRef.current,
      onComplete: () => settledRef.current?.(),
    });
    return () => controls.stop();
  }, [
    stripWidth,
    geometry,
    safeCurrentPage,
    safeTotalPages,
    isAnimating,
    animationDirection,
    animationWrapped,
    reducedMotion,
    stripX,
  ]);

  const visiblePages = useMemo(
    () => geometry.visiblePages(safeCurrentPage),
    [geometry, safeCurrentPage]
  );

  return { stripRef, stripX, pageWidth: geometry.pageWidth, visiblePages };
}
