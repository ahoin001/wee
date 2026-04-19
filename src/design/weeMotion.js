import { useReducedMotion } from 'framer-motion';

/**
 * spring presets for Wee modal shell + gooey space pill (see src/dev/hub-modal-overhaul-reference.jsx).
 * When reduced motion is preferred, use short durations instead of springs.
 */
export const WEE_SPRINGS = {
  modalBackdrop: { duration: 0.22 },
  modalPanel: {
    type: 'spring',
    stiffness: 420,
    damping: 28,
    mass: 0.85,
  },
  /** Prototype: stiffness 400, damping 20, mass 0.8 */
  pillOpen: {
    type: 'spring',
    stiffness: 400,
    damping: 20,
    mass: 0.8,
  },
  pillClose: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 1,
  },
  pillFloor: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 1,
  },
  /** whileTap / whileHover release on chrome — same family as pillOpen, softer than legacy PLAYFUL_SPRINGS.press */
  pillSurfacePress: {
    type: 'spring',
    stiffness: 380,
    damping: 24,
    mass: 0.85,
  },
  /** Channel drag overlay lift — pillOpen-adjacent (softer than legacy 520 stiffness) */
  channelDragOverlay: {
    type: 'spring',
    stiffness: 400,
    damping: 22,
    mass: 0.82,
  },
  channelDragSoft: {
    type: 'spring',
    stiffness: 340,
    damping: 26,
    mass: 0.9,
  },
  /** Slot “pop” after drop — shared family with pill / chrome */
  channelDropCelebrate: {
    type: 'spring',
    stiffness: 360,
    damping: 24,
    mass: 0.88,
  },
  tabBody: {
    type: 'spring',
    stiffness: 380,
    damping: 32,
    mass: 0.75,
  },
};

export const WEE_VARIANTS = {
  modalBackdropInitial: { opacity: 0 },
  modalBackdropAnimate: { opacity: 1 },
  modalBackdropExit: { opacity: 0 },
  modalPanelInitial: { opacity: 0, scale: 0.9, y: 40 },
  modalPanelAnimate: { opacity: 1, scale: 1, y: 0 },
  modalPanelExit: { opacity: 0, scale: 0.9, y: 40 },
  tabBodyInitial: { opacity: 0, y: 10 },
  tabBodyAnimate: { opacity: 1, y: 0 },
  tabBodyExit: { opacity: 0, y: -6 },
};

/**
 * Space rail: height-morphing pill container (WeeGooeySpacePill).
 */
export function createWeeShellRailContainerVariants(expandedHeight, pillClose, pillOpen) {
  return {
    closed: {
      height: 80,
      width: 80,
      borderRadius: 40,
      transition: pillClose,
    },
    open: {
      height: expandedHeight,
      width: 90,
      borderRadius: 45,
      transition: pillOpen,
    },
  };
}

/**
 * Space rail rows, divider, wand — matches SortableSpaceRow stagger.
 */
export function createWeeShellRailItemVariants(pillOpen, reducedMotion) {
  return {
    closed: {
      opacity: 0,
      scale: 0.5,
      y: 15,
      transition: reducedMotion ? { duration: 0.08 } : { duration: 0.1 },
    },
    open: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: reducedMotion ? { duration: 0.12 } : { delay: i * 0.04, ...pillOpen },
    }),
  };
}

/**
 * Channel grid tiles — softer than rail icons (closer to legacy CSS tile enter).
 */
export function createWeeChannelTileItemVariants(pillOpen, reducedMotion) {
  return {
    closed: {
      opacity: 0,
      scale: 0.94,
      y: 14,
      transition: reducedMotion ? { duration: 0.08 } : { duration: 0.1 },
    },
    open: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: reducedMotion
        ? { duration: 0.12 }
        : { delay: Math.min(i * 0.024, 0.26), ...pillOpen },
    }),
  };
}

/**
 * First-paint spring for shell chrome (space rail column, dock footer).
 */
export function getWeeShellChromeEntrance(reducedMotion, pillOpen) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.15 },
    };
  }
  return {
    initial: { opacity: 0, y: 14, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: pillOpen,
  };
}

/**
 * Dock ribbon / classic dock bar — enter from below (footer-anchored).
 */
export function getWeeDockBarEntrance(reducedMotion, pillOpen) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.15 },
    };
  }
  return {
    initial: { opacity: 0, y: 22, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: pillOpen,
  };
}

/**
 * @returns {{ reducedMotion: boolean, backdropTransition: object, modalTransition: object, pillOpen: object, pillClose: object, pillFloor: object, pillSurfacePress: object, tabTransition: object }}
 */
export function useWeeMotion() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    const fast = { duration: 0.15 };
    return {
      reducedMotion: true,
      backdropTransition: { duration: 0.12 },
      modalTransition: { duration: 0.18 },
      pillOpen: fast,
      pillClose: fast,
      pillFloor: fast,
      pillSurfacePress: fast,
      tabTransition: { duration: 0.12 },
    };
  }

  return {
    reducedMotion: false,
    backdropTransition: WEE_SPRINGS.modalBackdrop,
    modalTransition: WEE_SPRINGS.modalPanel,
    pillOpen: WEE_SPRINGS.pillOpen,
    pillClose: WEE_SPRINGS.pillClose,
    pillFloor: WEE_SPRINGS.pillFloor,
    pillSurfacePress: WEE_SPRINGS.pillSurfacePress,
    tabTransition: WEE_SPRINGS.tabBody,
  };
}
