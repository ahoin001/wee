/**
 * Framer Motion targets for a playful “chain” reaction during/after slot reorder.
 * Tiles between `from` and `to` wobble in sequence (Nintendo / iPhone-ish bounce).
 */

const MAX_STAGGER_SEC = 0.28;

/**
 * @param {number} channelIndex
 * @param {{ from: number; to: number; id: number; live?: boolean } | null} reorderWave
 * @param {boolean} reduceMotion
 * @returns {{ animate: object; transition: object }}
 */
export function computeReorderShiftMotion(channelIndex, reorderWave, reduceMotion) {
  const rest = {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
  };

  if (!reorderWave || reduceMotion) {
    return {
      animate: rest,
      transition: { duration: 0.12 },
    };
  }

  const { from, to, live } = reorderWave;
  const min = Math.min(from, to);
  const max = Math.max(from, to);
  if (channelIndex < min || channelIndex > max) {
    return {
      animate: rest,
      transition: { duration: 0.12 },
    };
  }

  const stagger = Math.min((channelIndex - min) * 0.018, MAX_STAGGER_SEC);
  const movingLeft = from < to;
  /** Live hover: softer nudge so neighbors feel like they’re sliding over. */
  const kick = live ? 10 : 16;
  const yKick = live ? 5 : 8;
  const rotKick = live ? 2.5 : 4;
  const scaleKick = live ? 1.035 : 1.06;

  return {
    animate: live
      ? {
          x: [0, movingLeft ? -kick : kick, 0],
          y: [0, -yKick, 0],
          rotate: [0, movingLeft ? -rotKick : rotKick, 0],
          scale: [1, scaleKick, 1],
        }
      : {
          x: [0, kick * (movingLeft ? -0.55 : 0.55), kick * (movingLeft ? 0.18 : -0.18), kick * (movingLeft ? -0.08 : 0.08), 0],
          y: [0, -yKick, yKick * 1.25, -yKick * 0.4, 0],
          rotate: [0, movingLeft ? -rotKick : rotKick, movingLeft ? rotKick * 0.5 : -rotKick * 0.5, movingLeft ? -1 : 1, 0],
          scale: [1, scaleKick, 0.97, 1.02, 1],
        },
    transition: live
      ? {
          duration: 0.42,
          delay: stagger * 0.6,
          times: [0, 0.4, 1],
          ease: [0.22, 0.9, 0.3, 1],
        }
      : {
          duration: 0.88,
          delay: stagger,
          times: [0, 0.18, 0.48, 0.78, 1],
          ease: [0.2, 0.85, 0.28, 1],
        },
  };
}
