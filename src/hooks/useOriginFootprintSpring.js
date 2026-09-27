import { useLayoutEffect, useRef } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { createWeeTransition } from '../design/weeMotion';
import { footprintFromOrigin, measureUntransformed } from '../ui/wee/originRect';

/**
 * Springs a shell from a control's footprint to its resting box, then back.
 * Same pillOpen / pillClose clock as the space rail. Dialog copy stays hidden
 * until the shell is nearly settled.
 */
export function useOriginFootprintSpring({
  active,
  isOpen,
  elementRef,
  originRect,
  onClosed,
}) {
  const fromRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const radiusMv = useMotionValue(64);
  const contentOpacity = useMotionValue(active ? 0 : 1);
  const pillOpen = createWeeTransition('pillOpen', { reducedMotion: false });
  const pillClose = createWeeTransition('pillClose', { reducedMotion: false });

  useLayoutEffect(() => {
    if (!active || !elementRef.current) {
      if (!active) contentOpacity.set(1);
      return undefined;
    }

    const el = elementRef.current;

    if (!isOpen) {
      const from = fromRef.current;
      if (!from) {
        onClosed?.();
        return undefined;
      }
      contentOpacity.set(0);
      let cancelled = false;
      const running = [
        animate(x, from.x, pillClose),
        animate(y, from.y, pillClose),
        animate(scaleX, from.scaleX, pillClose),
        animate(scaleY, from.scaleY, pillClose),
        animate(radiusMv, from.radius, pillClose),
      ];
      Promise.all(running.map((tween) => tween.finished)).then(() => {
        if (!cancelled) onClosed?.();
      });
      return () => {
        cancelled = true;
        running.forEach((tween) => tween.stop());
      };
    }

    const box = measureUntransformed(el);
    const from = footprintFromOrigin(originRect, box);
    const openRadius = Number.parseFloat(window.getComputedStyle(el).borderTopLeftRadius) || 64;
    fromRef.current = from;
    x.set(from.x);
    y.set(from.y);
    scaleX.set(from.scaleX);
    scaleY.set(from.scaleY);
    radiusMv.set(from.radius);
    contentOpacity.set(0);

    const running = [
      animate(x, 0, pillOpen),
      animate(y, 0, pillOpen),
      animate(scaleX, 1, pillOpen),
      animate(scaleY, 1, pillOpen),
      animate(radiusMv, openRadius, pillOpen),
    ];
    const unsub = scaleX.on('change', (value) => {
      if (value > 0.9 && scaleY.get() > 0.9) contentOpacity.set(1);
    });
    return () => {
      unsub();
      running.forEach((tween) => tween.stop());
    };
  }, [
    active,
    contentOpacity,
    elementRef,
    isOpen,
    onClosed,
    originRect,
    pillClose,
    pillOpen,
    radiusMv,
    scaleX,
    scaleY,
    x,
    y,
  ]);

  return { x, y, scaleX, scaleY, radiusMv, contentOpacity };
}
