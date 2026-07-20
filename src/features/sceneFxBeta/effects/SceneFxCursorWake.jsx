/**
 * BETA Scene FX — click / move wake ripples (event-driven canvas).
 * Removable: delete this file + unmount from SceneFxBetaRoot.
 */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import useAnimationActivity from '../../../hooks/useAnimationActivity';

function readPrimaryRgb() {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    // token is "H S% L%"
    const parts = raw.split(/\s+/);
    if (parts.length >= 3) {
      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1]);
      const l = parseFloat(parts[2]);
      if ([h, s, l].every(Number.isFinite)) {
        return { h, s, l };
      }
    }
  } catch {
    /* ignore */
  }
  return { h: 195, s: 75, l: 60 };
}

function SceneFxCursorWake({ intensity = 0.55, reducedMotion = false }) {
  const canvasRef = useRef(null);
  const ripplesRef = useRef([]);
  const rafRef = useRef(0);
  const lastMoveSpawnRef = useRef(0);
  const { shouldAnimate } = useAnimationActivity({ activeFps: 45, lowPowerFps: 20 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const strength = Math.min(1, Math.max(0, Number(intensity) || 0));

    const ensureTick = () => {
      if (rafRef.current) return;
      const tick = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);
        const next = [];
        for (const ripple of ripplesRef.current) {
          ripple.life -= ripple.decay;
          if (ripple.life <= 0) continue;
          ripple.r += (ripple.max - ripple.r) * 0.08 + 0.6;
          const alpha = Math.max(0, ripple.life) * 0.45 * strength;
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
          ctx.strokeStyle = `${ripple.color}${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.5 + strength;
          ctx.stroke();
          next.push(ripple);
        }
        ripplesRef.current = next;
        if (next.length > 0) {
          rafRef.current = window.requestAnimationFrame(tick);
        } else {
          rafRef.current = 0;
        }
      };
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const spawn = (x, y, power = 1) => {
      if (ripplesRef.current.length > 18) ripplesRef.current.shift();
      const hsl = readPrimaryRgb();
      ripplesRef.current.push({
        x,
        y,
        r: 4,
        max: 48 + strength * 70 * power,
        life: 1,
        decay: reducedMotion ? 0.08 : 0.028 + (1 - strength) * 0.02,
        color: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%,`,
      });
      ensureTick();
    };

    const onPointerDown = (e) => {
      if (e.button != null && e.button !== 0) return;
      spawn(e.clientX, e.clientY, 1.15);
    };

    const onPointerMove = (e) => {
      if (reducedMotion || !shouldAnimate) return;
      const now = performance.now();
      if (now - lastMoveSpawnRef.current < 90) return;
      lastMoveSpawnRef.current = now;
      spawn(e.clientX, e.clientY, 0.45);
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      ripplesRef.current = [];
    };
  }, [intensity, reducedMotion, shouldAnimate]);

  return <canvas ref={canvasRef} className="scene-fx-wake-canvas" aria-hidden />;
}

SceneFxCursorWake.propTypes = {
  intensity: PropTypes.number,
  reducedMotion: PropTypes.bool,
};

export default React.memo(SceneFxCursorWake);
