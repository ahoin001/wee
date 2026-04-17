/**
 * User preferences for playful UI motion (press, drag, reorder feedback).
 * Persisted under `ui.motionFeedback` in unified settings.
 */

export const DEFAULT_MOTION_FEEDBACK = {
  /** Master switch — when false, all playful motion below is off (OS reduced-motion still applies separately). */
  master: true,
  channels: {
    /** Spring “squish” when clicking a channel tile to launch */
    tap: true,
    /** Lifted / tilted floating preview while dragging a channel */
    dragPreview: true,
    /** Highlight on slots you can drop onto while dragging */
    dropTarget: true,
    /** Sparkles when you pick up / drop a tile */
    reorderParticles: true,
    /** Tiles wobble + settle animation after reorder */
    reorderSlotMotion: true,
  },
  dock: {
    /** Wii dock A/B buttons + SD card press / hover motion */
    press: true,
  },
  ribbon: {
    /** Top ribbon bar pill buttons (Settings, etc.) */
    tap: true,
  },
  modals: {
    /** Modal panel spring open/close choreography */
    springTransitions: true,
    /** Staggered enter for modal sections / controls */
    staggeredEntrance: true,
  },
  effects: {
    /** Gooey / liquid selection highlights */
    gooeyHighlights: true,
    /** Subtle icon tilt on hover + press */
    iconTilt: true,
  },
};

/**
 * Deep-merge saved partial prefs with defaults (safe for load / migration).
 */
export function mergeMotionFeedback(patch) {
  const p = patch && typeof patch === 'object' ? patch : {};
  return {
    master: p.master ?? DEFAULT_MOTION_FEEDBACK.master,
    channels: {
      ...DEFAULT_MOTION_FEEDBACK.channels,
      ...(p.channels || {}),
    },
    dock: {
      ...DEFAULT_MOTION_FEEDBACK.dock,
      ...(p.dock || {}),
    },
    ribbon: {
      ...DEFAULT_MOTION_FEEDBACK.ribbon,
      ...(p.ribbon || {}),
    },
    modals: {
      ...DEFAULT_MOTION_FEEDBACK.modals,
      ...(p.modals || {}),
    },
    effects: {
      ...DEFAULT_MOTION_FEEDBACK.effects,
      ...(p.effects || {}),
    },
  };
}
