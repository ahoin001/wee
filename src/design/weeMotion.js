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
 * @returns {{ reducedMotion: boolean, backdropTransition: object, modalTransition: object, pillOpen: object, pillClose: object, pillFloor: object, tabTransition: object }}
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
    tabTransition: WEE_SPRINGS.tabBody,
  };
}
