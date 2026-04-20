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
  /** hub-widget.html floating player panel */
  gooeyPanel: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 1,
  },
  /** Media Hub discover detail aside — hub-stremio.html SPRING_CONFIG */
  mediaHubDetailAside: {
    type: 'spring',
    stiffness: 350,
    damping: 28,
    mass: 1,
  },
  /** First visit per session — soft, long settle (~1.8–2.2s perceived) */
  hubSpaceEntranceFull: {
    type: 'spring',
    stiffness: 170,
    damping: 20,
    mass: 1.05,
  },
  /** Return visit same session — quicker, still springy (~0.45–0.7s) */
  hubSpaceEntranceSubtle: {
    type: 'spring',
    stiffness: 360,
    damping: 30,
    mass: 0.92,
  },
};

/** Easing curves shared by Media Hub grid (matches former CARD_EASE in MediaHubSpace). */
export const WEE_EASING = {
  mediaHubCard: [0.22, 1, 0.36, 1],
};

/** Stagger delay per list index — hub-stremio source rows used idx * 0.05s */
export const MEDIA_HUB_STAGGER = {
  listItem: 0.05,
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
 * Media Hub: desktop detail column — hub-stremio aside (slide from right, no scale).
 */
export function getMediaHubAsideMotion(reducedMotion) {
  const spring = WEE_SPRINGS.mediaHubDetailAside;
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.18 },
    };
  }
  return {
    initial: { x: 450, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 450, opacity: 0 },
    transition: spring,
  };
}

/**
 * Media Hub: small-viewport overlay panel — same spring family; vertical slide (no aside in hub-stremio).
 */
export function getMediaHubOverlayPanelMotion(reducedMotion) {
  const spring = WEE_SPRINGS.mediaHubDetailAside;
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.18 },
    };
  }
  return {
    initial: { y: 48, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 28, opacity: 0 },
    transition: spring,
  };
}

/**
 * Game Hub / Media Hub: staggered band entrance (toolbar, hero, content, …).
 * @param {'full' | 'subtle'} tier
 * @param {boolean} reducedMotion
 */
export function createHubEntranceBandVariants(tier, reducedMotion) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { duration: 0.16 },
      },
    };
  }
  const isFull = tier === 'full';
  const spring = isFull ? WEE_SPRINGS.hubSpaceEntranceFull : WEE_SPRINGS.hubSpaceEntranceSubtle;
  const y = isFull ? 26 : 11;
  return {
    hidden: { opacity: 0, y },
    show: {
      opacity: 1,
      y: 0,
      transition: spring,
    },
  };
}

/**
 * Parent orchestrator: stagger children after optional shell delay.
 * @param {'full' | 'subtle'} tier
 * @param {boolean} reducedMotion
 */
export function createHubEntranceOrchestratorVariants(tier, reducedMotion) {
  if (reducedMotion) {
    return {
      hidden: {},
      show: {
        transition: { staggerChildren: 0.04, delayChildren: 0.02 },
      },
    };
  }
  const isFull = tier === 'full';
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: isFull ? 0.14 : 0.055,
        delayChildren: isFull ? 0.1 : 0.04,
      },
    },
  };
}

/**
 * Backdrop / chrome: opacity-only entrance (avoid scale on full-bleed layers).
 */
export function createHubEntranceFadeVariants(reducedMotion) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.14 } },
    };
  }
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

const MEDIA_HUB_GRID_STAGGER_CAP = 15;

/**
 * Media Hub poster grid container (opacity + light rise; per-item delay uses custom index).
 */
export function createMediaHubGridContainerVariants(tier, reducedMotion) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.16 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 6 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

/**
 * Grid cards: spring pop with capped index delay (avoids animating hundreds of springs).
 * Pass `custom={index}` on each `m` child.
 */
export function createMediaHubGridItemVariants(tier, reducedMotion) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0, y: 6 },
      show: { opacity: 1, y: 0, transition: { duration: 0.14 } },
    };
  }
  const isFull = tier === 'full';
  const spring = isFull ? WEE_SPRINGS.hubSpaceEntranceFull : WEE_SPRINGS.hubSpaceEntranceSubtle;
  const baseDelay = isFull ? 0.14 : 0.06;
  const perItem = isFull ? 0.038 : 0.022;
  return {
    hidden: { opacity: 0, y: 11, scale: 0.986 },
    show: (i) => {
      const idx = typeof i === 'number' && Number.isFinite(i) ? i : 0;
      return {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          ...spring,
          delay: baseDelay + Math.min(idx, MEDIA_HUB_GRID_STAGGER_CAP) * perItem,
        },
      };
    },
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
