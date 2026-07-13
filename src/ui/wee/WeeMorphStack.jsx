import React from 'react';
import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';

/**
 * Flex column whose gap morphs with `open` on the shared `--wee-collapse-*` clock.
 * Use around siblings of a collapsing panel so vertical rhythm doesn’t snap.
 */
function WeeMorphStack({
  open,
  children,
  className = '',
  gapOpen = 'gap-4',
  gapClosed = 'gap-0',
}) {
  const reduceMotion = useReducedMotion();
  const durationVar = reduceMotion
    ? 'var(--wee-collapse-duration-reduced)'
    : 'var(--wee-collapse-duration)';

  return (
    <div
      className={`wee-morph-stack flex flex-col transition-[gap] ease-[var(--wee-collapse-ease)] ${
        open ? gapOpen : gapClosed
      } ${className}`.trim()}
      style={{ transitionDuration: durationVar }}
    >
      {children}
    </div>
  );
}

WeeMorphStack.propTypes = {
  open: PropTypes.bool.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  gapOpen: PropTypes.string,
  gapClosed: PropTypes.string,
};

WeeMorphStack.defaultProps = {
  children: null,
  className: '',
  gapOpen: 'gap-4',
  gapClosed: 'gap-0',
};

export default React.memo(WeeMorphStack);
