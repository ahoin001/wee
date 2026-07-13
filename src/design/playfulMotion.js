import { WEE_SPRINGS } from './weeMotion';

/**
 * Amplitude / variant helpers for playful press + modal motion.
 * Spring *timing* for shared intents is owned by `WEE_SPRINGS` / `createWeeTransition`
 * in weeMotion.js — keep PLAYFUL_SPRINGS aliased so legacy imports stay in sync.
 */
export const PLAYFUL_SPRINGS = {
  /** @deprecated Prefer createWeeTransition('press') / WEE_SPRINGS.pillSurfacePress */
  press: WEE_SPRINGS.pillSurfacePress,
  hoverLift: {
    type: 'spring',
    stiffness: 420,
    damping: 28,
    mass: 0.7,
  },
  /** @deprecated Prefer createWeeTransition('modalPanel') / WEE_SPRINGS.modalPanel */
  modalEnter: WEE_SPRINGS.modalPanel,
  /** @deprecated Prefer createWeeTransition('modalPanel') / WEE_SPRINGS.modalPanel */
  modalExit: WEE_SPRINGS.modalPanel,
  toggleSnap: {
    type: 'spring',
    stiffness: 700,
    damping: 34,
    mass: 0.45,
  },
  navLayout: {
    type: 'spring',
    stiffness: 400,
    damping: 28,
    mass: 0.72,
  },
  magneticLean: {
    type: 'spring',
    stiffness: 160,
    damping: 16,
    mass: 0.55,
  },
};

export const PLAYFUL_AMPLITUDE = {
  hoverLiftY: -1.5,
  hoverScale: 1.03,
  pressScale: 0.93,
  pressRotate: -1.25,
  compactSlideDistance: 14,
  modalEnterY: 54,
  modalExitY: 44,
  modalEnterScale: 0.92,
  modalExitScale: 0.93,
  /** Wee side-nav idle: mostly tucked off-edge (px along X). */
  sideNavIdleTuckPx: 40,
  /** Wee side-nav idle: friendly bounce tip that peeks into view (px along X). */
  sideNavIdlePeekPx: 14,
};

/** Game Hub: scroll-linked hero → dock lane (see hub-game-micro.html pattern). */
export const HUB_MORPH = {
  /** Scroll (px) before morph progress begins — overlay hero matches legacy until here. */
  scrollHandoffPx: 108,
  /** Scroll distance (px) from handoff to fully docked. */
  scrollRangePx: 380,
  dockWidthPx: 400,
  dockGapPx: 40,
};

export const PLAYFUL_VARIANTS = {
  press: {
    scale: PLAYFUL_AMPLITUDE.pressScale,
    rotate: PLAYFUL_AMPLITUDE.pressRotate,
  },
  hover: {
    scale: PLAYFUL_AMPLITUDE.hoverScale,
    rotate: 0.45,
    y: PLAYFUL_AMPLITUDE.hoverLiftY,
  },
  modalPanelInitial: {
    opacity: 0,
    scale: PLAYFUL_AMPLITUDE.modalEnterScale,
    y: PLAYFUL_AMPLITUDE.modalEnterY,
  },
  modalPanelAnimate: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  modalPanelExit: {
    opacity: 0,
    scale: PLAYFUL_AMPLITUDE.modalExitScale,
    y: PLAYFUL_AMPLITUDE.modalExitY,
  },
};
