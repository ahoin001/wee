import { useLayoutEffect, useRef } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { createWeeTransition } from '../design/weeMotion';
import { useMotionFeedback } from './useMotionFeedback';
import {
  flushOriginSource,
  footprintFromOrigin,
  isOriginRectOnScreen,
  measureUntransformed,
  readRestOriginRect,
  readTilePaint,
  setOriginHandoff,
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

/** Live idle tile rect when the control is still on screen (no hover scale). */
function resolveLiveOrigin(originRect) {
  const source = originRect?.source;
  if (source && source.isConnected) {
    const live = readRestOriginRect(source);
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
  /** Fires once the open flight settles — lets a shell defer heavy body mounting. */
  onOpened,
  openIntent = 'pillOpen',
  closeIntent = 'pillClose',
  /** Token holding the element's resting corner radius. See `openRadius` below. */
  restRadiusVar = '--wee-radius-shell',
  morph = false,
  /** Channel plate: the face stays for the whole flight; the form darkens over it. */
  plate = false,
  /** With-art plate: Game Space darken, delayed chrome, never a white mid-flight fill. */
  plateScrim = false,
}) {
  const fromRef = useRef(null);
  const sourceRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  /* Empty until the first measured sync, so CSS owns the corner until the flight does. */
  const radiusMv = useMotionValue('');
  const contentOpacity = useMotionValue(active ? 0 : 1);
  const faceOpacity = useMotionValue(morph ? 1 : 0);
  const shellOpacity = useMotionValue(morph && active ? 0 : 1);
  const shellBackground = useMotionValue('');
  const darkenOpacity = useMotionValue(0);
  const { osReduced, prefs } = useMotionFeedback();
  const playfulOff = Boolean(osReduced || prefs.master === false);
  const openIntentRef = useRef(openIntent);
  const closeIntentRef = useRef(closeIntent);
  const playfulOffRef = useRef(playfulOff);
  playfulOffRef.current = playfulOff;
  const restRadiusVarRef = useRef(restRadiusVar);
  restRadiusVarRef.current = restRadiusVar;
  const morphRef = useRef(morph);
  const plateRef = useRef(plate);
  const plateScrimRef = useRef(plateScrim);
  openIntentRef.current = openIntent;
  closeIntentRef.current = closeIntent;
  morphRef.current = morph;
  plateRef.current = plate;
  plateScrimRef.current = plateScrim;

  useLayoutEffect(() => () => {
    flushOriginSource(sourceRef.current);
    sourceRef.current = null;
  }, []);

  useLayoutEffect(() => {
    const el = element || elementRef.current;
    if (!active || !el) {
      if (!active) {
        contentOpacity.set(1);
        faceOpacity.set(0);
        shellOpacity.set(1);
        darkenOpacity.set(0);
        flushOriginSource(sourceRef.current);
        sourceRef.current = null;
      }
      return undefined;
    }

    const trackSource = (source) => {
      if (sourceRef.current && sourceRef.current !== source) {
        flushOriginSource(sourceRef.current);
      }
      sourceRef.current = source || null;
    };

    /*
     * Custom properties inherit, so writing one on the shell invalidates computed
     * style for its whole subtree — with Settings mounted that is the entire tab
     * tree, every frame. `--origin-form` has to live here (the plate chrome mixes
     * off it across the subtree), so instead write only when the value visibly
     * moves: both consumers are a color-mix percentage and a font-size divisor,
     * neither of which can show more than 1% of precision.
     */
    const written = { scale: -1, form: -1 };
    const writeMorphVar = (name, value, key) => {
      const quantized = Math.round(value * 100) / 100;
      if (written[key] === quantized) return;
      written[key] = quantized;
      el.style.setProperty(name, String(quantized));
    };

    const syncFromScale = () => {
      const footprint = fromRef.current;
      if (!footprint) return;
      const scaleXValue = scaleX.get();
      radiusMv.set(compensatedCornerRadius(scaleXValue, scaleY.get(), footprint));
      if (!morphRef.current) return;
      const t = morphT(scaleXValue, footprint);
      const artPlate = plateRef.current && plateScrimRef.current;
      // Art plate: chrome settles late so the expanding face stays cinema-dark,
      // not a white card. Empty / form morphs keep the earlier reveal.
      const form = artPlate ? smoothstep(0.52, 0.9, t) : smoothstep(0.35, 0.75, t);
      const shell = smoothstep(0, HANDOFF_T, t);
      contentOpacity.set(form);
      shellOpacity.set(shell);
      setOriginHandoff(sourceRef.current, 1 - shell);
      writeMorphVar('--origin-morph-scale', Math.max(scaleXValue, 0.05), 'scale');
      writeMorphVar('--origin-form', form, 'form');
      const tileFill = footprint.tilePaint?.backgroundColor;
      const tileFillOpaque = tileFill && parseColor(tileFill)[3] > 0.05;
      if (plateRef.current) {
        faceOpacity.set(1);
        if (artPlate) {
          darkenOpacity.set(smoothstep(0.1, 0.45, t));
          shellBackground.set('hsl(var(--color-pure-black))');
        } else {
          darkenOpacity.set(0);
          shellBackground.set(tileFillOpaque ? tileFill : 'transparent');
        }
      } else {
        faceOpacity.set(1 - form);
        darkenOpacity.set(0);
        if (tileFillOpaque && footprint.openFill) {
          shellBackground.set(mixColor(tileFill, footprint.openFill, smoothstep(0.25, 0.7, t)));
        }
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
        ...createWeeTransition(closeIntentRef.current, { reducedMotion: playfulOffRef.current }),
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
        contentTween = animate(contentOpacity, 0, closeTransition);
      }
      Promise.all(running.map((tween) => tween.finished.catch(() => {}))).then(() => {
        if (cancelled) return;
        flushOriginSource(sourceRef.current);
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
    /*
     * Resting radius comes from the token, not `borderTopLeftRadius`: this element
     * carries an inline radius left over from the previous flight, and inline beats
     * the class — measuring it would feed the last frame's compensated value back in
     * and the shell would rest on a corner that grows every open.
     */
    const shellStyle = window.getComputedStyle(el);
    const openRadius =
      Number.parseFloat(shellStyle.getPropertyValue(restRadiusVarRef.current)) ||
      Number.parseFloat(shellStyle.borderTopLeftRadius) ||
      0;
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

    const openTransition = {
      ...createWeeTransition(openIntentRef.current, { reducedMotion: playfulOffRef.current }),
      velocity: 0,
    };
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
    let openCancelled = false;
    Promise.all(running.map((tween) => tween.finished.catch(() => {}))).then(() => {
      if (!openCancelled) onOpened?.();
    });
    return () => {
      openCancelled = true;
      unsubX();
      unsubY();
      unsubReveal();
      running.forEach((tween) => tween.stop());
    };
  }, [
    active,
    contentOpacity,
    darkenOpacity,
    element,
    elementRef,
    faceOpacity,
    isOpen,
    onClosed,
    onOpened,
    originRect,
    playfulOff,
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
    darkenOpacity,
  };
}
