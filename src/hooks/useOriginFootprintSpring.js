import { useLayoutEffect, useRef } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { createWeeTransition } from '../design/weeMotion';
import {
  footprintFromOrigin,
  isOriginRectOnScreen,
  measureUntransformed,
  readOriginRect,
} from '../ui/wee/originRect';

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

/**
 * CSS radius is multiplied by scale. Divide so the painted corner matches
 * the tile at the small end and the modal radius at rest.
 */
function compensatedCornerRadius(scaleXValue, scaleYValue, footprint) {
  const span = 1 - footprint.scaleX;
  const t = Math.abs(span) < 1e-4
    ? 1
    : clamp01((scaleXValue - footprint.scaleX) / span);
  const openRadius = footprint.openRadius ?? footprint.radius;
  const visual = footprint.radius + (openRadius - footprint.radius) * t;
  const horizontal = visual / Math.max(scaleXValue, 0.05);
  const vertical = visual / Math.max(scaleYValue, 0.05);
  return `${horizontal}px / ${vertical}px`;
}

/** Live tile rect when the control is still on screen. Open-time numbers go stale under press scale. */
function resolveLiveOrigin(originRect) {
  const source = originRect?.source;
  if (source && source.isConnected) {
    const live = readOriginRect(source);
    if (isOriginRectOnScreen(live)) return live;
  }
  return isOriginRectOnScreen(originRect) ? originRect : null;
}

/**
 * Springs a shell from a control's footprint to its resting box, then back.
 * Same pillOpen / pillClose clock as the space rail. Copy stays hidden until
 * the shell is nearly open, and fades in the first part of the close.
 * The shell fill itself stays opaque for the whole flight.
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
  const radiusMv = useMotionValue('64px');
  const contentOpacity = useMotionValue(active ? 0 : 1);
  const pillOpen = createWeeTransition('pillOpen', { reducedMotion: false });
  const pillClose = createWeeTransition('pillClose', { reducedMotion: false });
  const pillOpenRef = useRef(pillOpen);
  const pillCloseRef = useRef(pillClose);
  pillOpenRef.current = pillOpen;
  pillCloseRef.current = pillClose;

  useLayoutEffect(() => {
    if (!active || !elementRef.current) {
      if (!active) contentOpacity.set(1);
      return undefined;
    }

    const el = elementRef.current;
    const syncRadius = () => {
      const footprint = fromRef.current;
      if (!footprint) return;
      radiusMv.set(compensatedCornerRadius(scaleX.get(), scaleY.get(), footprint));
    };

    if (!isOpen) {
      const stored = fromRef.current;
      if (!stored) {
        onClosed?.();
        return undefined;
      }
      const live = resolveLiveOrigin(originRect);
      let footprint = stored;
      if (live) {
        const box = measureUntransformed(el);
        footprint = {
          ...footprintFromOrigin(live, box),
          openRadius: stored.openRadius ?? stored.radius,
        };
        fromRef.current = footprint;
      }
      syncRadius();
      let cancelled = false;
      const closeTransition = { ...pillCloseRef.current, velocity: 0 };
      const running = [
        animate(x, footprint.x, closeTransition),
        animate(y, footprint.y, closeTransition),
        animate(scaleX, footprint.scaleX, closeTransition),
        animate(scaleY, footprint.scaleY, closeTransition),
      ];
      const contentClose = {
        type: 'spring',
        stiffness: (closeTransition.stiffness || 300) * 3,
        damping: (closeTransition.damping || 25) * 1.5,
        mass: closeTransition.mass || 1,
        velocity: 0,
      };
      const contentTween = animate(contentOpacity, 0, contentClose);
      const unsubX = scaleX.on('change', syncRadius);
      const unsubY = scaleY.on('change', syncRadius);
      Promise.all(running.map((tween) => tween.finished.catch(() => {}))).then(() => {
        if (!cancelled) onClosed?.();
      });
      return () => {
        cancelled = true;
        unsubX();
        unsubY();
        contentTween.stop();
        running.forEach((tween) => tween.stop());
      };
    }

    const box = measureUntransformed(el);
    const from = footprintFromOrigin(originRect, box);
    const openRadius = Number.parseFloat(window.getComputedStyle(el).borderTopLeftRadius) || 64;
    const footprint = { ...from, openRadius };
    fromRef.current = footprint;
    x.set(from.x);
    y.set(from.y);
    scaleX.set(from.scaleX);
    scaleY.set(from.scaleY);
    syncRadius();
    contentOpacity.set(0);

    const openTransition = pillOpenRef.current;
    const running = [
      animate(x, 0, openTransition),
      animate(y, 0, openTransition),
      animate(scaleX, 1, openTransition),
      animate(scaleY, 1, openTransition),
    ];
    const unsubX = scaleX.on('change', syncRadius);
    const unsubY = scaleY.on('change', syncRadius);
    const unsubReveal = scaleX.on('change', (value) => {
      if (value > 0.9 && scaleY.get() > 0.9) contentOpacity.set(1);
    });
    return () => {
      unsubX();
      unsubY();
      unsubReveal();
      running.forEach((tween) => tween.stop());
    };
  }, [
    active,
    contentOpacity,
    elementRef,
    isOpen,
    onClosed,
    originRect,
    radiusMv,
    scaleX,
    scaleY,
    x,
    y,
  ]);

  return { x, y, scaleX, scaleY, radiusMv, contentOpacity };
}
