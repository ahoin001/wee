/**
 * BETA Scene FX — wallpaper cursor parallax via CSS vars on `.wallpaper-space-parallax`.
 * Removable: delete this file + unmount from SceneFxBetaRoot (see feature README).
 */
import { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import useAnimationActivity from '../../../hooks/useAnimationActivity';
import useRafResumeKick from '../../../hooks/useRafResumeKick';

const ROOT_SELECTOR = '.wallpaper-space-parallax';
const MAX_OFFSET_PX = 18;
const BASE_SCALE = 1.028;

function SceneFxParallax({ amount = 0.4 }) {
  const { shouldAnimate } = useAnimationActivity({ activeFps: 30, lowPowerFps: 12 });
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const tickRef = useRef(() => {});

  useEffect(() => {
    if (!shouldAnimate) {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      const root = document.querySelector(ROOT_SELECTOR);
      if (root instanceof HTMLElement) {
        root.style.removeProperty('--wee-scene-fx-px');
        root.style.removeProperty('--wee-scene-fx-py');
        root.style.removeProperty('--wee-scene-fx-ps');
        root.style.willChange = '';
      }
      return undefined;
    }

    const strength = Math.min(1, Math.max(0, Number(amount) || 0)) * MAX_OFFSET_PX;
    const root = () => document.querySelector(ROOT_SELECTOR);

    const onMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const nx = (e.clientX / w) * 2 - 1;
      const ny = (e.clientY / h) * 2 - 1;
      targetRef.current.x = -nx * strength;
      targetRef.current.y = -ny * strength * 0.72;
    };

    const tick = () => {
      const cur = currentRef.current;
      const tgt = targetRef.current;
      cur.x += (tgt.x - cur.x) * 0.08;
      cur.y += (tgt.y - cur.y) * 0.08;
      const el = root();
      if (el instanceof HTMLElement) {
        el.style.setProperty('--wee-scene-fx-px', `${cur.x.toFixed(2)}px`);
        el.style.setProperty('--wee-scene-fx-py', `${cur.y.toFixed(2)}px`);
        el.style.setProperty('--wee-scene-fx-ps', String(BASE_SCALE));
        el.style.willChange = 'transform';
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    tickRef.current = tick;

    window.addEventListener('pointermove', onMove, { passive: true });
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      tickRef.current = () => {};
      const el = root();
      if (el instanceof HTMLElement) {
        el.style.removeProperty('--wee-scene-fx-px');
        el.style.removeProperty('--wee-scene-fx-py');
        el.style.removeProperty('--wee-scene-fx-ps');
        el.style.willChange = '';
      }
    };
  }, [amount, shouldAnimate]);

  const onKick = useCallback(() => {
    if (!shouldAnimate) return;
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    rafRef.current = window.requestAnimationFrame(() => tickRef.current());
  }, [shouldAnimate]);

  useRafResumeKick({ enabled: shouldAnimate, onKick });

  return null;
}

SceneFxParallax.propTypes = {
  amount: PropTypes.number,
};

export default SceneFxParallax;
