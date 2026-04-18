import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { useDialogExitPresence } from '../../hooks/useDialogExitPresence';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { useWeeMotion, WEE_VARIANTS } from '../../design/weeMotion';

const MotionDiv = m.div;

/**
 * Game Hub modal shell: deferred unmount + Framer open/closed variants (matches WeeModalShell pattern).
 * Outer node keeps `.aura-hub-modal-overlay` for AuraCollectionsSection hit-testing.
 */
function AuraHubModalFrame({ open, onOpenChange, ariaLabelledBy, panelClassName = '', children }) {
  const { allowMount, onPanelAnimationComplete } = useDialogExitPresence(open);
  const { backdropTransition: weeBackdrop, modalTransition: weeModal } = useWeeMotion();
  const { modalSpringTransitions } = useMotionFeedback();

  const backdropTransition = modalSpringTransitions ? weeBackdrop : { duration: 0.12 };
  const modalTransition = modalSpringTransitions ? weeModal : { duration: 0.18 };

  const backdropVariants = useMemo(
    () => ({
      open: { opacity: 1 },
      closed: WEE_VARIANTS.modalBackdropExit,
    }),
    []
  );

  const panelVariants = useMemo(
    () => ({
      open: WEE_VARIANTS.modalPanelAnimate,
      closed: WEE_VARIANTS.modalPanelExit,
    }),
    []
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (typeof document === 'undefined' || !allowMount) {
    return null;
  }

  return createPortal(
    <div className="aura-hub-modal-overlay">
      <MotionDiv
        className="aura-hub-modal-backdrop absolute inset-0 bg-[hsl(var(--bg-overlay))]"
        aria-hidden
        variants={backdropVariants}
        initial="closed"
        animate={open ? 'open' : 'closed'}
        transition={backdropTransition}
        onMouseDown={() => onOpenChange(false)}
      />
      <MotionDiv
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        className={`aura-hub-modal relative z-10 ${panelClassName}`.trim()}
        variants={panelVariants}
        initial="closed"
        animate={open ? 'open' : 'closed'}
        transition={modalTransition}
        onAnimationComplete={onPanelAnimationComplete}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </MotionDiv>
    </div>,
    document.body
  );
}

AuraHubModalFrame.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  ariaLabelledBy: PropTypes.string.isRequired,
  panelClassName: PropTypes.string,
  children: PropTypes.node.isRequired,
};

AuraHubModalFrame.defaultProps = {
  panelClassName: '',
};

export default AuraHubModalFrame;
