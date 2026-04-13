/**
 * Framer Motion targets for a playful “chain” reaction after a slot reorder.
 * Tiles between `from` and `to` wobble in sequence (Nintendo-ish bounce).
 */

const MAX_STAGGER_SEC = 0.32;

/**
 * @param {number} channelIndex
 * @param {{ from: number; to: number; id: number } | null} reorderWave
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
      transition: { duration: 0.15 },
    };
  }

  const { from, to } = reorderWave;
  const min = Math.min(from, to);
  const max = Math.max(from, to);
  if (channelIndex < min || channelIndex > max) {
    return {
      animate: rest,
      transition: { duration: 0.15 },
    };
  }

  const stagger = Math.min((channelIndex - min) * 0.022, MAX_STAGGER_SEC);
  const movingLeft = from < to;
  const xKick = movingLeft ? -16 : 16;

  return {
    animate: {
      x: [0, xKick * 0.55, xKick * -0.18, xKick * 0.08, 0],
      y: [0, -8, 10, -3, 0],
      rotate: [0, movingLeft ? -4 : 4, movingLeft ? 2 : -2, movingLeft ? -1 : 1, 0],
      scale: [1, 1.06, 0.97, 1.02, 1],
    },
    transition: {
      duration: 0.72,
      delay: stagger,
      times: [0, 0.2, 0.45, 0.72, 1],
      ease: [0.22, 1, 0.36, 1],
    },
  };
}
