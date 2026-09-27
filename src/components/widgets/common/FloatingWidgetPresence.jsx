import React, { forwardRef, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { useDialogExitPresence } from '../../../hooks/useDialogExitPresence';
import { useOriginFootprintSpring } from '../../../hooks/useOriginFootprintSpring';
import { useMotionFeedback } from '../../../hooks/useMotionFeedback';
import { isOriginRectOnScreen } from '../../../ui/wee/originRect';
import WeePillFloorShadow from '../../../ui/wee/WeePillFloorShadow';

const MotionDiv = m.div;

/**
 * Gooey spring enter/dismiss for floating widgets — same open/close family as
 * WeeGooeySpacePill / WeeModalShell (pillOpen / pillClose via gooey intensity).
 * Keeps the subtree mounted until the closed variant finishes.
 * Optional originRect grows the widget out of a home tile that is on screen.
 */
const FloatingWidgetPresence = forwardRef(function FloatingWidgetPresence(
  {
    isOpen,
    children,
    className = '',
    style,
    onExitAnimationComplete,
    originRect = null,
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
  const localRef = useRef(null);
  const setRef = useCallback((node) => {
    localRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  const useOrigin = Boolean(
    originRect && !reducedMotion && gooey?.enabled && isOriginRectOnScreen(originRect)
  );
  const finishOriginClose = useCallback(() => {
    onPanelAnimationComplete('closed');
  }, [onPanelAnimationComplete]);
  const {
    x, y, scaleX, scaleY, radiusMv, contentOpacity,
  } = useOriginFootprintSpring({
    active: useOrigin && allowMount,
    isOpen,
    elementRef: localRef,
    originRect,
    onClosed: finishOriginClose,
  });

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
      ref={setRef}
      className={className}
      style={useOrigin ? {
        ...style,
        x,
        y,
        scaleX,
        scaleY,
        borderRadius: radiusMv,
        transformOrigin: 'center center',
      } : { transformOrigin: 'center center', ...style }}
      variants={useOrigin ? undefined : variants}
      initial={useOrigin ? false : 'closed'}
      animate={useOrigin ? undefined : (isOpen ? 'open' : 'closed')}
      onAnimationComplete={useOrigin ? undefined : onPanelAnimationComplete}
      {...rest}
    >
      <WeePillFloorShadow expanded={isOpen} reducedMotion={Boolean(reducedMotion)} />
      <MotionDiv className="relative z-[1] h-full w-full" style={useOrigin ? { opacity: contentOpacity } : undefined}>
        {children}
      </MotionDiv>
    </MotionDiv>
  );
});

FloatingWidgetPresence.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  onExitAnimationComplete: PropTypes.func,
  originRect: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    radius: PropTypes.number,
  }),
};

FloatingWidgetPresence.displayName = 'FloatingWidgetPresence';

export default FloatingWidgetPresence;
