import { useLayoutEffect, useRef } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { createWeeTransition } from '../design/weeMotion';
import {
  footprintFromOrigin,
  isOriginRectOnScreen,
  measureUntransformed,
  readOriginRect,
  readTilePaint,
  setOriginCovered,
} from '../ui/wee/originRect';

/** Below this morph progress the real element is visible under the fading shell. */
const HANDOFF_T = 0.15;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function parseColor(color) {
  if (!color || color === 'transparent') return [0, 0, 0, 0];
  const text = String(color).trim();
  const srgb = text.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
  if (srgb) {
    return [
      Number(srgb[1]) * 255,
      Number(srgb[2]) * 255,
      Number(srgb[3]) * 255,
      srgb[4] != null ? Number(srgb[4]) : 1,
    ];
  }
  const parts = text.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return [0, 0, 0, 1];
  return [
    Number(parts[0]),
    Number(parts[1]),
    Number(parts[2]),
    parts.length > 3 ? Number(parts[3]) : 1,
  ];
}

function mixColor(from, to, t) {
  const a = parseColor(from);
  const b = parseColor(to);
  const mixed = a.map((channel, index) => channel + (b[index] - channel) * t);
  return `rgba(${mixed[0].toFixed(1)}, ${mixed[1].toFixed(1)}, ${mixed[2].toFixed(1)}, ${mixed[3].toFixed(3)})`;
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

/** Live tile rect when the control is still on screen. */
function resolveLiveOrigin(originRect) {
  const source = originRect?.source;
  if (source && source.isConnected) {
    const live = readOriginRect(source);
    if (isOriginRectOnScreen(live)) return live;
  }
  return isOriginRectOnScreen(originRect) ? originRect : null;
}

/** Resting shell fill, read with inline morph styles cleared. */
function readOpenFill(element) {
  const previous = element.style.backgroundColor;
  element.style.backgroundColor = '';
  const fill = window.getComputedStyle(element).backgroundColor;
  element.style.backgroundColor = previous;
  return fill;
}

/**
 * Springs a shell from a control's footprint to its resting box, then back.
 * Defaults to pillOpen / pillClose. With `morph`, face and form follow morph
 * progress, and both ends hand off to the real source element: the shell
 * fades out over it, so the last frames are the element itself.
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
  morph = false,
}) {
  const fromRef = useRef(null);
  const sourceRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const radiusMv = useMotionValue('64px');
  const contentOpacity = useMotionValue(active ? 0 : 1);
  const faceOpacity = useMotionValue(morph ? 1 : 0);
  const shellOpacity = useMotionValue(morph && active ? 0 : 1);
  const shellBackground = useMotionValue('');
  const openIntentRef = useRef(openIntent);
  const closeIntentRef = useRef(closeIntent);
  const morphRef = useRef(morph);
  openIntentRef.current = openIntent;
  closeIntentRef.current = closeIntent;
  morphRef.current = morph;

  useLayoutEffect(() => () => {
    setOriginCovered(sourceRef.current, false);
    sourceRef.current = null;
  }, []);

  useLayoutEffect(() => {
    const el = element || elementRef.current;
    if (!active || !el) {
      if (!active) {
        contentOpacity.set(1);
        faceOpacity.set(0);
        shellOpacity.set(1);
        setOriginCovered(sourceRef.current, false);
        sourceRef.current = null;
      }
      return undefined;
    }

    const trackSource = (source) => {
      if (sourceRef.current && sourceRef.current !== source) {
        setOriginCovered(sourceRef.current, false);
      }
      sourceRef.current = source || null;
    };

    const syncFromScale = () => {
      const footprint = fromRef.current;
      if (!footprint) return;
      const scaleXValue = scaleX.get();
      radiusMv.set(compensatedCornerRadius(scaleXValue, scaleY.get(), footprint));
      if (!morphRef.current) return;
      const t = morphT(scaleXValue, footprint);
      const form = smoothstep(0.35, 0.75, t);
      contentOpacity.set(form);
      faceOpacity.set(1 - form);
      shellOpacity.set(smoothstep(0, HANDOFF_T, t));
      setOriginCovered(sourceRef.current, t >= HANDOFF_T);
      el.style.setProperty('--origin-morph-scale', String(Math.max(scaleXValue, 0.05)));
      const tileFill = footprint.tilePaint?.backgroundColor;
      if (tileFill && footprint.openFill && parseColor(tileFill)[3] > 0.05) {
        shellBackground.set(mixColor(tileFill, footprint.openFill, smoothstep(0.25, 0.7, t)));
      }
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
        trackSource(live.source);
        footprint = {
          ...footprintFromOrigin(live, box),
          openRadius: stored.openRadius ?? stored.radius,
          openFill: stored.openFill,
          tilePaint: readTilePaint(live.source) || stored.tilePaint,
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
      if (!morphRef.current) {
        contentTween = animate(contentOpacity, 0, {
          type: 'spring',
          stiffness: (closeTransition.stiffness || 300) * 3,
          damping: (closeTransition.damping || 25) * 1.5,
          mass: closeTransition.mass || 1,
          velocity: 0,
        });
      }
      Promise.all(running.map((tween) => tween.finished.catch(() => {}))).then(() => {
        if (cancelled) return;
        setOriginCovered(sourceRef.current, false);
        onClosed?.();
      });
      return () => {
        cancelled = true;
        unsubX();
        unsubY();
        contentTween?.stop();
        running.forEach((tween) => tween.stop());
      };
    }

    trackSource(originRect?.source);
    const box = measureUntransformed(el);
    const from = footprintFromOrigin(originRect, box);
    const openRadius = Number.parseFloat(window.getComputedStyle(el).borderTopLeftRadius) || 64;
    const footprint = {
      ...from,
      openRadius,
      openFill: morphRef.current ? readOpenFill(el) : null,
      tilePaint: morphRef.current ? readTilePaint(originRect?.source) : null,
    };
    fromRef.current = footprint;
    x.set(from.x);
    y.set(from.y);
    scaleX.set(from.scaleX);
    scaleY.set(from.scaleY);
    syncFromScale();
    if (!morphRef.current) contentOpacity.set(0);

    const openTransition = createWeeTransition(openIntentRef.current, { reducedMotion: false });
    const running = [
      animate(x, 0, openTransition),
      animate(y, 0, openTransition),
      animate(scaleX, 1, openTransition),
      animate(scaleY, 1, openTransition),
    ];
    const unsubX = scaleX.on('change', syncFromScale);
    const unsubY = scaleY.on('change', syncFromScale);
    const unsubReveal = morphRef.current
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
    shellBackground,
    shellOpacity,
    x,
    y,
  ]);

  return {
    x,
    y,
    scaleX,
    scaleY,
    radiusMv,
    contentOpacity,
    faceOpacity,
    shellOpacity,
    shellBackground,
  };
}
