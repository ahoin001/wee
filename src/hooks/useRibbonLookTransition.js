import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { CHANNEL_PAGE_FLIP_MS } from '../utils/channelLayoutSystem';
import {
  easeSpaceShell,
  SPACE_SHELL_TRANSITION_MS_DEFAULT,
} from '../design/spaceShellMotion';
import { pickRibbonLook } from '../utils/appearance/resolveEffectiveRibbonLook';

/**
 * Parse #rgb / #rrggbb / #rrggbbaa to [r,g,b] 0–255. Returns null if invalid.
 * @param {string} hex
 * @returns {[number, number, number]|null}
 */
function parseHexRgb(hex) {
  if (typeof hex !== 'string') return null;
  const raw = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.slice(0, 6);
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpHex(fromHex, toHex, t) {
  const a = parseHexRgb(fromHex);
  const b = parseHexRgb(toHex);
  if (!a || !b) return t >= 1 ? toHex : fromHex;
  return toHex([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]);
}

/**
 * Page ribbon color morph — slightly shorter than CHANNEL_PAGE_FLIP_MS so accents
 * settle as the board/wallpaper land (feels reactive, not lagging the flip).
 */
export const RIBBON_PAGE_TRANSITION_MS = Math.round(CHANNEL_PAGE_FLIP_MS * 0.7);

/** Fallback when App has not passed the live shell duration (rapid-aware). */
export const RIBBON_SPACE_TRANSITION_MS = SPACE_SHELL_TRANSITION_MS_DEFAULT;

/**
 * Paint-only ribbon look tween when the resolved Surfaces look changes.
 * Does not write the store every frame — returns display values for WiiRibbon.
 * Duration/ease track shell wallpaper crossfade so space/page switches feel reactive.
 *
 * @param {{
 *   targetLook: object,
 *   durationMs?: number,
 *   ambientOverride?: boolean,
 * }} args
 */
export function useRibbonLookTransition({
  targetLook,
  durationMs = RIBBON_PAGE_TRANSITION_MS,
  ambientOverride = false,
}) {
  const reducedMotion = useReducedMotion();
  const look = useMemo(() => pickRibbonLook(targetLook), [targetLook]);
  const [displayLook, setDisplayLook] = useState(look);
  const displayRef = useRef(look);
  const rafRef = useRef(null);
  const fromRef = useRef(look);
  const toRef = useRef(look);
  const startRef = useRef(0);

  useEffect(() => {
    displayRef.current = displayLook;
  }, [displayLook]);

  useEffect(() => {
    if (ambientOverride) {
      // Ambient / Spotify owns live colors — snap paint to target without competing.
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      fromRef.current = look;
      toRef.current = look;
      setDisplayLook(look);
      return;
    }

    const prev = displayRef.current || {};
    const next = look || {};
    const colorChanged =
      prev.ribbonColor !== next.ribbonColor ||
      prev.ribbonGlowColor !== next.ribbonGlowColor ||
      prev.ribbonDockOpacity !== next.ribbonDockOpacity;

    if (!colorChanged) {
      // Non-color fields (glass, glow strength) can snap immediately.
      setDisplayLook((cur) => ({ ...cur, ...next }));
      return;
    }

    if (reducedMotion || !durationMs || durationMs <= 0) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setDisplayLook(next);
      return;
    }

    fromRef.current = { ...prev };
    toRef.current = { ...next };
    startRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / durationMs);
      const e = easeSpaceShell(t);
      const from = fromRef.current;
      const to = toRef.current;
      const mixed = {
        ...to,
        ribbonColor: lerpHex(from.ribbonColor || to.ribbonColor, to.ribbonColor, e),
        ribbonGlowColor: lerpHex(
          from.ribbonGlowColor || to.ribbonGlowColor,
          to.ribbonGlowColor,
          e
        ),
        ribbonDockOpacity:
          typeof from.ribbonDockOpacity === 'number' && typeof to.ribbonDockOpacity === 'number'
            ? lerp(from.ribbonDockOpacity, to.ribbonDockOpacity, e)
            : to.ribbonDockOpacity,
      };
      setDisplayLook(mixed);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [look, durationMs, reducedMotion, ambientOverride]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  return displayLook;
}

export default useRibbonLookTransition;
