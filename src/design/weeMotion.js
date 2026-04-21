import { useReducedMotion } from 'framer-motion';
import { SPACE_SHELL_ENTRANCE_TIERS } from './spaceShellMotion';

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
  /** First visit per session — playful soft settle (~2.2–2.8s perceived) */
  hubSpaceEntranceFull: {
    type: 'spring',
    stiffness: 150,
    damping: 18,
    mass: 1.12,
  },
  /** Return visit same session — short but playful (~0.6–0.8s) */
  hubSpaceEntranceSubtle: {
    type: 'spring',
    stiffness: 285,
    damping: 26,
    mass: 0.96,
  },
  /** Revisit assembly — gooey stagger between full first visit and subtle; welcoming motion */
  hubSpaceEntranceRevisitGooey: {
    type: 'spring',
    stiffness: 205,
    damping: 22,
    mass: 1.03,
  },
  /** Home channel grid first visit — overshoot then settle (space rail / pill family, slightly softer damping) */
  homeSpaceEntranceOvershoot: {
    type: 'spring',
    stiffness: 300,
    damping: 19,
    mass: 0.88,
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

function isFirstVisitTier(tier) {
  return (
    tier === SPACE_SHELL_ENTRANCE_TIERS.firstVisitPlayful ||
    tier === 'full'
  );
}

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
  const playfulFull = WEE_SPRINGS.hubSpaceEntranceFull;
  const revisitGooey = WEE_SPRINGS.hubSpaceEntranceRevisitGooey;
  return {
    closed: {
      opacity: 0,
      scale: 0.92,
      y: 18,
      transition: reducedMotion ? { duration: 0.08 } : { duration: 0.1 },
    },
    open: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: reducedMotion
        ? { duration: 0.12 }
        : {
            ...playfulFull,
            delay: 0.08 + Math.min(i * 0.036, 0.5),
          },
    }),
    /** Welcome-back stagger — gooey spring, slightly longer wave than legacy subtle */
    revisit: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: reducedMotion
        ? { duration: 0.1 }
        : {
            ...revisitGooey,
            delay: 0.04 + Math.min(i * 0.024, 0.32),
          },
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
 * Media Hub: small-viewport overlay panel — use the same right-origin swap language as desktop sidebar.
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
    initial: { x: 84, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 84, opacity: 0 },
    transition: spring,
  };
}

/**
 * Game Hub / Media Hub: staggered band entrance (toolbar, hero, content, …).
 * @param {'firstVisitPlayful' | 'revisitSubtleGooey' | 'full' | 'subtle'} tier
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
  const isFull = isFirstVisitTier(tier);
  const springFull = WEE_SPRINGS.hubSpaceEntranceFull;
  const springRevisit = WEE_SPRINGS.hubSpaceEntranceRevisitGooey;
  if (isFull) {
    return {
      hidden: { opacity: 0, y: 30 },
      show: {
        opacity: 1,
        y: 0,
        transition: springFull,
      },
    };
  }
  return {
    hidden: { opacity: 1, y: 16, scale: 0.992 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: springRevisit,
    },
  };
}

/**
 * Home channel grid only: first session visit uses rail-like overshoot spring; revisit matches subtle hub band.
 */
export function createHomeChannelEntranceBandVariants(tier, reducedMotion) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { duration: 0.16 },
      },
    };
  }
  const isFull = isFirstVisitTier(tier);
  const springFull = WEE_SPRINGS.homeSpaceEntranceOvershoot;
  const springRevisit = WEE_SPRINGS.hubSpaceEntranceRevisitGooey;
  if (isFull) {
    return {
      hidden: { opacity: 0, y: 36 },
      show: {
        opacity: 1,
        y: 0,
        transition: springFull,
      },
    };
  }
  return {
    hidden: { opacity: 1, y: 14, scale: 0.992 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: springRevisit,
    },
  };
}

/**
 * Game Hub dock morph: library column follows the dock lane — subtle horizontal nudge + fade after delay
 * (dock rail keeps scroll-linked opacity; no duplicate Y on the whole column band).
 */
export function createGameHubMorphLibraryFollowVariants(tier, reducedMotion) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.14 } },
    };
  }
  const isFull = isFirstVisitTier(tier);
  const revisitSpring = WEE_SPRINGS.hubSpaceEntranceRevisitGooey;
  if (isFull) {
    return {
      hidden: { opacity: 0.82, x: -14 },
      show: {
        opacity: 1,
        x: 0,
        transition: {
          type: 'spring',
          stiffness: 270,
          damping: 28,
          mass: 0.9,
          delay: 0.16,
        },
      },
    };
  }
  return {
    hidden: { opacity: 0.9, x: -9 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        ...revisitSpring,
        delay: 0.08,
      },
    },
  };
}

/**
 * Media Hub shell/header controls: slightly slower than generic hub bands so toolbar controls
 * do not outpace the list/body reveal.
 */
export function createMediaHubShellBandVariants(tier, reducedMotion) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { duration: 0.18 },
      },
    };
  }
  const isFull = isFirstVisitTier(tier);
  const springFull = WEE_SPRINGS.hubSpaceEntranceFull;
  const springRevisit = WEE_SPRINGS.hubSpaceEntranceRevisitGooey;
  if (isFull) {
    return {
      hidden: { opacity: 0, y: 34 },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          ...springFull,
          delay: 0.08,
        },
      },
    };
  }
  return {
    hidden: { opacity: 0.94, y: 14, scale: 0.993 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        ...springRevisit,
        delay: 0.04,
      },
    },
  };
}

/**
 * Parent orchestrator: stagger children after optional shell delay.
 * @param {'firstVisitPlayful' | 'revisitSubtleGooey' | 'full' | 'subtle'} tier
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
  const isFull = isFirstVisitTier(tier);
  if (isFull) {
    return {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.19,
          delayChildren: 0.2,
        },
      },
    };
  }
  /** Revisit: parent stays visible so bands can read “mid-assemble”; stagger drives the wave */
  return {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.11,
        delayChildren: 0.1,
      },
    },
  };
}

/**
 * Backdrop / chrome: opacity-only entrance (avoid scale on full-bleed layers).
 * Revisit keeps hero visible during assembly (mid-fade) so the strip never reads empty.
 */
export function createHubEntranceFadeVariants(reducedMotion, tier) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.14 } },
    };
  }
  const isFull = isFirstVisitTier(tier);
  if (isFull) {
    return {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      },
    };
  }
  return {
    hidden: { opacity: 0.88 },
    show: {
      opacity: 1,
      transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

/** Cap poster stagger index so large libraries do not trail forever; tighter than Game Hub stagger feel. */
const MEDIA_HUB_GRID_STAGGER_CAP = 10;

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
  const isFull = isFirstVisitTier(tier);
  if (isFull) {
    return {
      hidden: { opacity: 0, y: 6 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1] },
      },
    };
  }
  return {
    hidden: { opacity: 0.96, y: 5 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
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
  const isFull = isFirstVisitTier(tier);
  const springFull = WEE_SPRINGS.hubSpaceEntranceFull;
  const springRevisit = WEE_SPRINGS.hubSpaceEntranceRevisitGooey;
  const baseDelay = isFull ? 0.18 : 0.1;
  const perItem = isFull ? 0.068 : 0.034;
  if (isFull) {
    return {
      hidden: { opacity: 0, y: 11, scale: 0.986 },
      show: (i) => {
        const idx = typeof i === 'number' && Number.isFinite(i) ? i : 0;
        return {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            ...springFull,
            delay: baseDelay + Math.min(idx, MEDIA_HUB_GRID_STAGGER_CAP) * perItem,
          },
        };
      },
    };
  }
  return {
    hidden: { opacity: 0.9, y: 9, scale: 0.988 },
    show: (i) => {
      const idx = typeof i === 'number' && Number.isFinite(i) ? i : 0;
      return {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          ...springRevisit,
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
