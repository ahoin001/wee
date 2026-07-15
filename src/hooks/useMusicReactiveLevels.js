import { useEffect, useRef, useState } from 'react';
import { useAnimationActivity } from './useAnimationActivity';
import { useMotionFeedback } from './useMotionFeedback';

const BAND_COUNT = 12;
const ZERO_LEVELS = Object.freeze(Array.from({ length: BAND_COUNT }, () => 0));

/**
 * Cheap music-reactive envelope levels for widget + ribbon.
 * RAF only while playing + motion allowed + not low-power — no AnalyserNode / loopback.
 *
 * @param {{
 *   isPlaying?: boolean,
 *   progressMs?: number,
 *   durationMs?: number,
 *   enabled?: boolean,
 *   bandCount?: number,
 * }} opts
 * @returns {number[]} levels 0–1
 */
export function useMusicReactiveLevels({
  isPlaying = false,
  progressMs = 0,
  durationMs = 0,
  enabled = true,
  bandCount = BAND_COUNT,
} = {}) {
  const { shouldAnimate, isLowPowerMode } = useAnimationActivity({
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

  const [levels, setLevels] = useState(() =>
    bandCount === BAND_COUNT ? ZERO_LEVELS : Array.from({ length: bandCount }, () => 0)
  );
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const progressRef = useRef(progressMs);
  const durationRef = useRef(durationMs);
  progressRef.current = progressMs;
  durationRef.current = durationMs;

  useEffect(() => {
    if (!allow) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      setLevels(Array.from({ length: bandCount }, () => 0));
      return undefined;
    }

    startRef.current = performance.now();
    let last = 0;
    const frameInterval = 1000 / 24;

    const tick = (now) => {
      rafRef.current = requestAnimationFrame(tick);
      if (now - last < frameInterval) return;
      last = now;

      const t = (now - startRef.current) / 1000;
      const dur = Math.max(1, durationRef.current || 1);
      const phase = ((progressRef.current || 0) / dur) * Math.PI * 2;
      const next = Array.from({ length: bandCount }, (_, i) => {
        const n = i / Math.max(1, bandCount - 1);
        const wave =
          0.42 +
          0.28 * Math.sin(t * 3.1 + n * 4.2 + phase) +
          0.18 * Math.sin(t * 5.7 + n * 7.1) +
          0.12 * Math.sin(t * 1.4 + phase * 0.5 + n * 2.3);
        return Math.min(1, Math.max(0.08, wave));
      });
      setLevels(next);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [allow, bandCount]);

  return levels;
}

export const MUSIC_REACTIVE_BAND_COUNT = BAND_COUNT;

export default useMusicReactiveLevels;
