import { useEffect, useRef } from 'react';
import { useAnimationActivity } from './useAnimationActivity';
import { useMotionFeedback } from './useMotionFeedback';

const BAND_COUNT = 12;

/** CSS custom property for band `i` (0–1). Bars read it via `var(--lvl-i, 0)`. */
export function musicLevelVar(index) {
  return `--lvl-${index}`;
}

function writeLevels(el, levels) {
  if (!el) return;
  for (let i = 0; i < levels.length; i += 1) {
    el.style.setProperty(musicLevelVar(i), levels[i].toFixed(3));
  }
}

function writeIdle(el, bandCount) {
  if (!el) return;
  for (let i = 0; i < bandCount; i += 1) {
    el.style.setProperty(musicLevelVar(i), '0');
  }
}

/**
 * Cheap music-reactive envelope levels for widget + ribbon.
 * Writes `--lvl-0..N` onto `targetRef.current` — no React state, so the host
 * subtree does not re-render per frame. RAF only while playing + motion allowed
 * + not low-power — no AnalyserNode / loopback.
 *
 * @param {{
 *   targetRef: { current: HTMLElement | SVGElement | null },
 *   isPlaying?: boolean,
 *   progressMs?: number,
 *   durationMs?: number,
 *   enabled?: boolean,
 *   bandCount?: number,
 * }} opts
 * @returns {boolean} whether the envelope is live
 */
export function useMusicReactiveLevels({
  targetRef,
  isPlaying = false,
  progressMs = 0,
  durationMs = 0,
  enabled = true,
  bandCount = BAND_COUNT,
} = {}) {
  const { shouldAnimate, isLowPowerMode, frameIntervalMs } = useAnimationActivity({
    activeFps: 24,
    lowPowerFps: 8,
    inactiveFps: 2,
  });
  const { osReduced, gooeyHighlights } = useMotionFeedback();
  const allow =
    Boolean(enabled) &&
    Boolean(isPlaying) &&
    Boolean(shouldAnimate) &&
    !isLowPowerMode &&
    Boolean(gooeyHighlights) &&
    !osReduced;

  const progressRef = useRef(progressMs);
  const durationRef = useRef(durationMs);
  progressRef.current = progressMs;
  durationRef.current = durationMs;

  useEffect(() => {
    const el = targetRef?.current;
    if (!allow) {
      writeIdle(el, bandCount);
      return undefined;
    }

    const start = performance.now();
    let last = 0;
    let raf = 0;
    const levels = new Array(bandCount).fill(0);

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (now - last < frameIntervalMs) return;
      last = now;

      const t = (now - start) / 1000;
      const dur = Math.max(1, durationRef.current || 1);
      const phase = ((progressRef.current || 0) / dur) * Math.PI * 2;
      for (let i = 0; i < bandCount; i += 1) {
        const n = i / Math.max(1, bandCount - 1);
        const wave =
          0.42 +
          0.28 * Math.sin(t * 3.1 + n * 4.2 + phase) +
          0.18 * Math.sin(t * 5.7 + n * 7.1) +
          0.12 * Math.sin(t * 1.4 + phase * 0.5 + n * 2.3);
        levels[i] = Math.min(1, Math.max(0.08, wave));
      }
      writeLevels(targetRef?.current, levels);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      writeIdle(targetRef?.current, bandCount);
    };
  }, [allow, bandCount, frameIntervalMs, targetRef]);

  return allow;
}

export const MUSIC_REACTIVE_BAND_COUNT = BAND_COUNT;

export default useMusicReactiveLevels;
