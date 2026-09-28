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

function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** 0 at the tile scale, 1 at the resting modal scale. */
function morphT(scaleXValue, footprint) {
  const span = 1 - footprint.scaleX;
  if (Math.abs(span) < 1e-4) return 1;
  return clamp01((scaleXValue - footprint.scaleX) / span);
}

/**
 * CSS radius is multiplied by scale. Divide so the painted corner matches
 * the tile at the small end and the modal radius at rest.
 */
function compensatedCornerRadius(scaleXValue, scaleYValue, footprint) {
  const t = morphT(scaleXValue, footprint);
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
 * Defaults to pillOpen / pillClose. Callers can pass a slower intent pair
 * (channel morph) without changing the space rail or floating widgets.
 * When linkLayers is set, face and form opacity follow morph progress:
 * the face is opaque at the tile and the form is opaque at rest.
 */
export function useOriginFootprintSpring({
  active,
  isOpen,
  elementRef,
  /** The shell node, once mounted. A ref alone does not re-run this effect. */
  element = null,
  originRect,
  onClosed,
  openIntent = 'pillOpen',
  closeIntent = 'pillClose',
  linkLayers = false,
}) {
  const fromRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const radiusMv = useMotionValue('64px');
  const contentOpacity = useMotionValue(active ? 0 : 1);
  const faceOpacity = useMotionValue(linkLayers ? 1 : 0);
  const openIntentRef = useRef(openIntent);
  const closeIntentRef = useRef(closeIntent);
  const linkLayersRef = useRef(linkLayers);
  openIntentRef.current = openIntent;
  closeIntentRef.current = closeIntent;
  linkLayersRef.current = linkLayers;

  useLayoutEffect(() => {
    const el = element || elementRef.current;
    if (!active || !el) {
      if (!active) {
        contentOpacity.set(1);
        faceOpacity.set(0);
      }
      return undefined;
    }

    const syncFromScale = () => {
      const footprint = fromRef.current;
      if (!footprint) return;
      const scaleXValue = scaleX.get();
      radiusMv.set(compensatedCornerRadius(scaleXValue, scaleY.get(), footprint));
      if (!linkLayersRef.current) return;
      const form = smoothstep(0.35, 0.75, morphT(scaleXValue, footprint));
      contentOpacity.set(form);
      faceOpacity.set(1 - form);
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
      syncFromScale();
      let cancelled = false;
      const closeTransition = {
        ...createWeeTransition(closeIntentRef.current, { reducedMotion: false }),
        velocity: 0,
      };
      const running = [
        animate(x, footprint.x, closeTransition),
        animate(y, footprint.y, closeTransition),
        animate(scaleX, footprint.scaleX, closeTransition),
        animate(scaleY, footprint.scaleY, closeTransition),
      ];
      const unsubX = scaleX.on('change', syncFromScale);
      const unsubY = scaleY.on('change', syncFromScale);
      let contentTween = null;
      if (!linkLayersRef.current) {
        contentTween = animate(contentOpacity, 0, {
          type: 'spring',
          stiffness: (closeTransition.stiffness || 300) * 3,
          damping: (closeTransition.damping || 25) * 1.5,
          mass: closeTransition.mass || 1,
          velocity: 0,
        });
      }
      Promise.all(running.map((tween) => tween.finished.catch(() => {}))).then(() => {
        if (!cancelled) onClosed?.();
      });
      return () => {
        cancelled = true;
        unsubX();
        unsubY();
        contentTween?.stop();
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
    syncFromScale();
    if (!linkLayersRef.current) contentOpacity.set(0);

    const openTransition = createWeeTransition(openIntentRef.current, { reducedMotion: false });
    const running = [
      animate(x, 0, openTransition),
      animate(y, 0, openTransition),
      animate(scaleX, 1, openTransition),
      animate(scaleY, 1, openTransition),
    ];
    const unsubX = scaleX.on('change', syncFromScale);
    const unsubY = scaleY.on('change', syncFromScale);
    const unsubReveal = linkLayersRef.current
      ? () => {}
      : scaleX.on('change', (value) => {
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
    element,
    elementRef,
    faceOpacity,
    isOpen,
    onClosed,
    originRect,
    radiusMv,
    scaleX,
    scaleY,
    x,
    y,
  ]);

  return { x, y, scaleX, scaleY, radiusMv, contentOpacity, faceOpacity };
}
