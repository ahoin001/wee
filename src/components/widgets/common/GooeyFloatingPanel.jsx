import React from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { WEE_SPRINGS } from '../../../design/weeMotion';
import './GooeyFloatingPanel.css';

const MotionDiv = m.div;

/**
 * Hub-widget–style gooey shell: spring layout, thick frame, ambient orb.
 * Caller sets position/size on an outer wrapper; this is the inner card.
 */
function GooeyFloatingPanel({
  children,
  className,
  style,
  layout = true,
  isDragging,
  isResizing,
  ambientPlaying,
  ambientOrbAnimated,
}) {
  const spring = WEE_SPRINGS.gooeyPanel;
  const orbAnimated = Boolean(ambientOrbAnimated && ambientPlaying);

  return (
    <MotionDiv
      layout={layout}
      transition={spring}
      className={[
        'gooey-floating-panel',
        isDragging ? 'gooey-floating-panel--dragging' : '',
        isResizing ? 'gooey-floating-panel--resizing' : '',
        className || '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div className="gooey-floating-panel__ambient" aria-hidden>
        <MotionDiv
          animate={
            orbAnimated
              ? { scale: [1, 1.08, 1], rotate: [0, 45, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={
            orbAnimated
              ? { duration: 15, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
          className={[
            'gooey-floating-panel__ambient-orb',
            !orbAnimated ? 'gooey-floating-panel__ambient-orb--static' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            backgroundColor: ambientPlaying
              ? 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))'
              : 'var(--spotify-gooey-surface, hsl(var(--color-pure-white) / 0.08))',
          }}
        />
      </div>

      <div className="gooey-floating-panel__inner">{children}</div>
    </MotionDiv>
  );
}

GooeyFloatingPanel.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  layout: PropTypes.bool,
  isDragging: PropTypes.bool,
  isResizing: PropTypes.bool,
  /** When true, orb uses primary and optional slow animation */
  ambientPlaying: PropTypes.bool,
  /** False when reduced motion or low-power — orb stays static */
  ambientOrbAnimated: PropTypes.bool,
};

GooeyFloatingPanel.defaultProps = {
  children: null,
  className: '',
  style: undefined,
  layout: true,
  isDragging: false,
  isResizing: false,
  ambientPlaying: false,
  ambientOrbAnimated: true,
};

export default GooeyFloatingPanel;
