import React from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { createWeeTransition } from '../../design/weeMotion';

const MotionSpan = m.span;

/**
 * Play triangle becomes two pause bars inside one footprint.
 * The glyph blurs only while it swaps; the label outside this component does not.
 */
function WeePlayPauseGlyph({ playing = false, size = 18, reducedMotion = false }) {
  const swap = createWeeTransition('press', { reducedMotion });
  const bars = createWeeTransition('pillOpen', { reducedMotion });

  return (
    <span
      className="relative block"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <MotionSpan
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={
          reducedMotion
            ? { opacity: playing ? 0 : 1 }
            : {
                opacity: playing ? 0 : 1,
                scale: playing ? 0.72 : 1,
                filter: playing ? 'blur(3px)' : 'blur(0px)',
              }
        }
        transition={swap}
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
          <path d="M8 5.5v13l11-6.5-11-6.5z" />
        </svg>
      </MotionSpan>
      <MotionSpan
        className="absolute left-[22%] top-[18%] w-[18%] rounded-[2px] bg-current"
        style={{ height: '64%', originY: 0.5 }}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: playing ? 1 : 0, scaleY: playing ? 1 : 0.2 }
            : { opacity: playing ? 1 : 0, scaleY: playing ? 1 : 0.15 }
        }
        transition={bars}
      />
      <MotionSpan
        className="absolute right-[22%] top-[18%] w-[18%] rounded-[2px] bg-current"
        style={{ height: '64%', originY: 0.5 }}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: playing ? 1 : 0, scaleY: playing ? 1 : 0.2 }
            : { opacity: playing ? 1 : 0, scaleY: playing ? 1 : 0.15 }
        }
        transition={bars}
      />
    </span>
  );
}

WeePlayPauseGlyph.propTypes = {
  playing: PropTypes.bool,
  size: PropTypes.number,
  reducedMotion: PropTypes.bool,
};

export default WeePlayPauseGlyph;
