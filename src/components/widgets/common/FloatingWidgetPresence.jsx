import React, { forwardRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { useDialogExitPresence } from '../../../hooks/useDialogExitPresence';
import { useMotionFeedback } from '../../../hooks/useMotionFeedback';

const MotionDiv = m.div;

/**
 * Gooey spring enter/dismiss for floating widgets — same open/close family as
 * WeeGooeySpacePill / WeeModalShell (pillOpen / pillClose via gooey intensity).
 * Keeps the subtree mounted until the closed variant finishes.
 */
const FloatingWidgetPresence = forwardRef(function FloatingWidgetPresence(
  {
    isOpen,
    children,
    className = '',
    style,
    onExitAnimationComplete,
    ...rest
  },
  ref
) {
  const reducedMotion = useReducedMotion();
  const { gooey } = useMotionFeedback();
  const { allowMount, onPanelAnimationComplete } = useDialogExitPresence(
    isOpen,
    onExitAnimationComplete
  );

  const variants = useMemo(() => {
    if (reducedMotion || !gooey?.enabled) {
      return {
        open: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.12 } },
        closed: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.1 } },
      };
    }
    return gooey.modalPanelVariants;
  }, [gooey?.enabled, gooey?.modalPanelVariants, reducedMotion]);

  if (!allowMount) return null;

  return (
    <MotionDiv
      ref={ref}
      className={className}
      style={{ transformOrigin: 'center center', ...style }}
      variants={variants}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
      onAnimationComplete={onPanelAnimationComplete}
      {...rest}
    >
      {children}
    </MotionDiv>
  );
});

FloatingWidgetPresence.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  onExitAnimationComplete: PropTypes.func,
};

FloatingWidgetPresence.displayName = 'FloatingWidgetPresence';

export default FloatingWidgetPresence;
