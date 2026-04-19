/**
 * Single source of truth for channel idle one-shot animations (must match Channel.css durations).
 * Springy / gooey easing aligns with collection shelf physics; linear kept for spin/hue sweeps.
 */

/** Primary Wee idle ease — slight overshoot, matches hub shelf spring feel */
export const CHANNEL_IDLE_EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/** Legacy helper bump (unused if CSS uses var); kept for tooling */
export const CHANNEL_IDLE_EASE = CHANNEL_IDLE_EASE_SPRING;

/**
 * Duration (ms) per idle type — must equal the animation duration in `.channel-anim-*` rules.
 * @type {Record<string, number>}
 */
export const CHANNEL_IDLE_MS = {
  pulse: 2200,
  bounce: 1800,
  wiggle: 2200,
  glow: 2400,
  parallax: 3200,
  flip: 2200,
  swing: 2200,
  shake: 700,
  pop: 1400,
  fade: 2200,
  slide: 2200,
  colorcycle: 3500,
  sparkle: 2800,
  heartbeat: 1600,
  orbit: 2800,
  wave: 2200,
  jelly: 2200,
  zoom: 2200,
  rotate: 2800,
  glowtrail: 2800,
};

/**
 * @param {string} type
 * @returns {number}
 */
export function getChannelIdleDurationMs(type) {
  const n = CHANNEL_IDLE_MS[type];
  return Number.isFinite(n) ? n : 2200;
}
