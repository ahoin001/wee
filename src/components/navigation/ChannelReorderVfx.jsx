import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';

/** Above dock/ribbon, below devtools */
const BURST_LAYER_Z = 12000;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

/** Lift: upward-biased sparks (friendly “pluck”). */
function buildLiftParticles() {
  const n = 9;
  return Array.from({ length: n }, (_, i) => {
    const spread = (i / n) * Math.PI * 1.1 - Math.PI * 0.55 + randomBetween(-0.35, 0.35);
    const dist = randomBetween(28, 56);
    const biasUp = -randomBetween(18, 42);
    const rot = randomBetween(-25, 25);
    return {
      id: `lift-${i}`,
      x: Math.cos(spread) * dist * 0.85,
      y: Math.sin(spread) * dist * 0.45 + biasUp,
      rot,
      endRot: rot + randomBetween(50, 110),
      delay: randomBetween(0, 0.05),
      glyph: i % 3 === 0 ? '✦' : i % 3 === 1 ? '★' : '·',
      size: i % 2 === 0 ? 13 : 10,
    };
  });
}

/** Drop: radial sparkles + pop ring. */
function buildDropParticles() {
  const n = 26;
  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n + randomBetween(-0.14, 0.14);
    const dist = randomBetween(36, 88);
    const rot = randomBetween(0, 360);
    const isAccent = i % 5 === 0;
    return {
      id: `drop-${i}`,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      rot,
      endRot: rot + randomBetween(70, 160),
      delay: randomBetween(0, 0.1),
      glyph: i % 4 === 0 ? '★' : i % 4 === 1 ? '✦' : '·',
      size: i % 3 === 0 ? 16 : 11,
      accent: isAccent,
    };
  });
}

/** Fast inner sparks for extra “pop”. */
function buildDropMicroSparks() {
  const n = 10;
  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n + randomBetween(-0.2, 0.2);
    const dist = randomBetween(14, 40);
    return {
      id: `micro-${i}`,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      rot: randomBetween(-40, 40),
      endRot: randomBetween(80, 200),
      delay: randomBetween(0.02, 0.12),
      glyph: i % 2 === 0 ? '✦' : '·',
      size: 8 + (i % 3),
    };
  });
}

function ParticleGlyph({ x, y, rot, endRot, delay, glyph, size, duration, accent }) {
  return (
    <motion.span
      className={`pointer-events-none absolute left-1/2 top-1/2 select-none font-bold ${
        accent
          ? 'text-[hsl(48_100%_72%)] [text-shadow:0_0_12px_hsl(48_100%_72%),0_0_22px_hsl(var(--primary)/0.85)]'
          : 'text-[hsl(var(--color-pure-white))] [text-shadow:0_0_10px_hsl(var(--color-pure-white)),0_0_18px_hsl(var(--primary)/0.9)]'
      }`}
      style={{
        fontSize: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: rot }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.25, 1, 0.35],
        x,
        y,
        rotate: endRot,
      }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
        times: [0, 0.12, 0.55, 1],
      }}
    >
      {glyph}
    </motion.span>
  );
}

ParticleGlyph.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  rot: PropTypes.number.isRequired,
  endRot: PropTypes.number.isRequired,
  delay: PropTypes.number.isRequired,
  glyph: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  accent: PropTypes.bool,
};

ParticleGlyph.defaultProps = {
  accent: false,
};

function LiftBurstLayer({ cx, cy, burstKey }) {
  const reduce = useReducedMotion();
  const particles = useMemo(() => buildLiftParticles(), [burstKey]);
  const duration = reduce ? 0.12 : 0.55;

  if (reduce) {
    return createPortal(
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: BURST_LAYER_Z }}
        aria-hidden
      >
        <div
          className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: cx,
            top: cy,
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, transparent 70%)',
          }}
        />
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: BURST_LAYER_Z }}
      aria-hidden
    >
      <div className="absolute" style={{ left: cx, top: cy }}>
        <motion.div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0.6, opacity: 0.9 }}
          animate={{ scale: 1.15, opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div
            className="h-24 w-24 rounded-full"
            style={{
              background:
                'radial-gradient(circle, hsl(var(--primary) / 0.55) 0%, hsl(var(--primary) / 0) 70%)',
            }}
          />
        </motion.div>
        {particles.map((p) => (
          <ParticleGlyph
            key={p.id}
            x={p.x}
            y={p.y}
            rot={p.rot}
            endRot={p.endRot}
            delay={p.delay}
            glyph={p.glyph}
            size={p.size}
            duration={duration}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

LiftBurstLayer.propTypes = {
  cx: PropTypes.number.isRequired,
  cy: PropTypes.number.isRequired,
  burstKey: PropTypes.number.isRequired,
};

function DropBurstLayer({ cx, cy, burstKey }) {
  const reduce = useReducedMotion();
  const particles = useMemo(() => buildDropParticles(), [burstKey]);
  const microParticles = useMemo(() => buildDropMicroSparks(), [burstKey]);
  const duration = reduce ? 0.12 : 0.72;
  const microDuration = reduce ? 0.1 : 0.48;

  if (reduce) {
    return createPortal(
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: BURST_LAYER_Z }}
        aria-hidden
      >
        <div
          className="absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{
            left: cx,
            top: cy,
            borderColor: 'hsl(var(--primary) / 0.75)',
          }}
        />
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: BURST_LAYER_Z }}
      aria-hidden
    >
      <div className="absolute" style={{ left: cx, top: cy }}>
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px]"
          style={{ borderColor: 'hsl(var(--primary) / 0.9)' }}
          initial={{ width: 12, height: 12, opacity: 1 }}
          animate={{ width: 152, height: 152, opacity: 0 }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[hsl(48_100%_72%/0.75)]"
          initial={{ width: 10, height: 10, opacity: 0.85 }}
          animate={{ width: 118, height: 118, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.34, 1.56, 0.64, 1] }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[hsl(var(--color-pure-white)/0.5)]"
          initial={{ width: 8, height: 8, opacity: 0.7 }}
          animate={{ width: 96, height: 96, opacity: 0 }}
          transition={{ duration: 0.42, delay: 0.12, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--color-pure-white))]"
          initial={{ scale: 0, rotate: -18 }}
          animate={{ scale: [0, 1.55, 1, 0.35], rotate: [0, 12, -6, 0] }}
          transition={{ duration: 0.52, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            boxShadow:
              '0 0 28px hsl(var(--primary) / 0.98), 0 0 48px hsl(48 100% 72% / 0.45), inset 0 0 12px hsl(var(--color-pure-white) / 0.9)',
          }}
        />
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, hsl(var(--primary) / 0.55) 0%, hsl(var(--primary) / 0) 72%)',
          }}
          initial={{ scale: 0.35, opacity: 0.95 }}
          animate={{ scale: [0.35, 1.25, 1.05], opacity: [0.95, 0.55, 0] }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
        {particles.map((p) => (
          <ParticleGlyph
            key={p.id}
            x={p.x}
            y={p.y}
            rot={p.rot}
            endRot={p.endRot}
            delay={p.delay}
            glyph={p.glyph}
            size={p.size}
            duration={duration}
            accent={p.accent}
          />
        ))}
        {microParticles.map((p) => (
          <ParticleGlyph
            key={p.id}
            x={p.x}
            y={p.y}
            rot={p.rot}
            endRot={p.endRot}
            delay={p.delay}
            glyph={p.glyph}
            size={p.size}
            duration={microDuration}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

DropBurstLayer.propTypes = {
  cx: PropTypes.number.isRequired,
  cy: PropTypes.number.isRequired,
  burstKey: PropTypes.number.isRequired,
};

export function ChannelReorderVfxPortal({ lift, drop }) {
  const { channelReorderParticles } = useMotionFeedback();
  if (!channelReorderParticles) {
    return null;
  }
  return (
    <>
      {lift ? <LiftBurstLayer cx={lift.cx} cy={lift.cy} burstKey={lift.key} /> : null}
      {drop ? <DropBurstLayer cx={drop.cx} cy={drop.cy} burstKey={drop.key} /> : null}
    </>
  );
}

ChannelReorderVfxPortal.propTypes = {
  lift: PropTypes.shape({
    key: PropTypes.number.isRequired,
    cx: PropTypes.number.isRequired,
    cy: PropTypes.number.isRequired,
  }),
  drop: PropTypes.shape({
    key: PropTypes.number.isRequired,
    cx: PropTypes.number.isRequired,
    cy: PropTypes.number.isRequired,
  }),
};

ChannelReorderVfxPortal.defaultProps = {
  lift: null,
  drop: null,
};

/**
 * @param {'home' | 'workspaces'} spaceKey
 * @param {number} index
 */
export function measureChannelSlotCenter(spaceKey, index) {
  if (typeof document === 'undefined') return null;
  const root = document.querySelector(`[data-channel-space="${spaceKey}"]`);
  if (!root) return null;
  const el = root.querySelector(`[data-channel-slot="${index}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}
