/**
 * BETA Scene FX — wallpaper cursor parallax via CSS vars on `.wallpaper-space-parallax`.
 * Removable: delete this file + unmount from SceneFxBetaRoot (see feature README).
 *
 * Idle-aware RAF: stops when settled near target; resumes on pointer move / focus kick.
 * Pauses while the space shell is transitioning to avoid fighting the page flip.
 */
import { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import useAnimationActivity from '../../../hooks/useAnimationActivity';
import useRafResumeKick from '../../../hooks/useRafResumeKick';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';

const ROOT_SELECTOR = '.wallpaper-space-parallax';
const MAX_OFFSET_PX = 18;
const BASE_SCALE = 1.028;
/** Stop RAF when current is this close to target (px). */
const SETTLE_EPS = 0.045;

function clearParallaxStyles(el) {
  if (!(el instanceof HTMLElement)) return;
  el.style.removeProperty('--wee-scene-fx-px');
  el.style.removeProperty('--wee-scene-fx-py');
  el.style.removeProperty('--wee-scene-fx-ps');
  el.style.willChange = '';
}

function SceneFxParallax({ amount = 0.4 }) {
  const { shouldAnimate, frameIntervalMs } = useAnimationActivity({
    activeFps: 30,
    lowPowerFps: 12,
  });
  const isTransitioning = useConsolidatedAppStore((s) => Boolean(s.spaces?.isTransitioning));
  const canRun = shouldAnimate && !isTransitioning;

  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const lastFrameAtRef = useRef(0);
  const canRunRef = useRef(canRun);
  const frameIntervalRef = useRef(frameIntervalMs);
  const ensureTickRef = useRef(() => {});

  canRunRef.current = canRun;
  frameIntervalRef.current = frameIntervalMs;

  useEffect(() => {
    if (!canRun) {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      runningRef.current = false;
      clearParallaxStyles(document.querySelector(ROOT_SELECTOR));
      return undefined;
    }

    const strength = Math.min(1, Math.max(0, Number(amount) || 0)) * MAX_OFFSET_PX;
    const root = () => document.querySelector(ROOT_SELECTOR);

    const apply = (cur) => {
      const el = root();
      if (!(el instanceof HTMLElement)) return;
      el.style.setProperty('--wee-scene-fx-px', `${cur.x.toFixed(2)}px`);
      el.style.setProperty('--wee-scene-fx-py', `${cur.y.toFixed(2)}px`);
      el.style.setProperty('--wee-scene-fx-ps', String(BASE_SCALE));
      el.style.willChange = 'transform';
    };

    const tick = (now) => {
      if (!canRunRef.current) {
        runningRef.current = false;
        rafRef.current = 0;
        return;
      }

      const interval = frameIntervalRef.current || 33;
      if (now - lastFrameAtRef.current < interval) {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }
      lastFrameAtRef.current = now;

      const cur = currentRef.current;
      const tgt = targetRef.current;
      cur.x += (tgt.x - cur.x) * 0.08;
      cur.y += (tgt.y - cur.y) * 0.08;

      const dx = Math.abs(tgt.x - cur.x);
      const dy = Math.abs(tgt.y - cur.y);
      if (dx < SETTLE_EPS && dy < SETTLE_EPS) {
        cur.x = tgt.x;
        cur.y = tgt.y;
        apply(cur);
        const el = root();
        if (el instanceof HTMLElement) el.style.willChange = '';
        runningRef.current = false;
        rafRef.current = 0;
        return;
      }

      apply(cur);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const ensureTick = () => {
      if (!canRunRef.current || runningRef.current) return;
      runningRef.current = true;
      lastFrameAtRef.current = 0;
      rafRef.current = window.requestAnimationFrame(tick);
    };
    ensureTickRef.current = ensureTick;

    const onMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const nx = (e.clientX / w) * 2 - 1;
      const ny = (e.clientY / h) * 2 - 1;
      targetRef.current.x = -nx * strength;
      targetRef.current.y = -ny * strength * 0.72;
      ensureTick();
    };

    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      runningRef.current = false;
      ensureTickRef.current = () => {};
      clearParallaxStyles(root());
    };
  }, [amount, canRun]);

  const onKick = useCallback(() => {
    if (!canRunRef.current) return;
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    runningRef.current = false;
    ensureTickRef.current();
  }, []);

  useRafResumeKick({ enabled: canRun, onKick });

  return null;
}

SceneFxParallax.propTypes = {
  amount: PropTypes.number,
};

export default SceneFxParallax;
