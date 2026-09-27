import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { Check } from 'lucide-react';
import { createWeeTransition } from '../../design/weeMotion';

const MotionDiv = m.div;

/**
 * Acknowledgement drawn in the tile that started a launch.
 * The launch itself is not delayed — this only paints progress, then a check.
 */
function ChannelLaunchAck({ active, reducedMotion = false }) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowCheck(false);
      return undefined;
    }
    const ms = reducedMotion ? 1 : 320;
    const timer = window.setTimeout(() => setShowCheck(true), ms);
    return () => window.clearTimeout(timer);
  }, [active, reducedMotion]);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[3]" aria-hidden>
      <MotionDiv
        className="absolute bottom-2 left-3 right-3 h-0.5 origin-left rounded-full bg-[hsl(var(--primary))]"
        initial={reducedMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={createWeeTransition('pillOpen', { reducedMotion })}
      />
      {showCheck ? (
        <MotionDiv
          className="absolute inset-0 flex items-center justify-center"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.82, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={createWeeTransition('pillOpen', { reducedMotion })}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--surface-elevated)/0.94)] text-[hsl(var(--primary))] shadow-[var(--shadow-md)]">
            <Check size={22} strokeWidth={2.75} />
          </span>
        </MotionDiv>
      ) : null}
    </div>
  );
}

ChannelLaunchAck.propTypes = {
  active: PropTypes.bool,
  reducedMotion: PropTypes.bool,
};

export default ChannelLaunchAck;
