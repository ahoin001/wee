import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import {
  createWeeTransition,
  getWeeStatusPillEntrance,
  useWeeMotion,
} from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import WeeGlassPill from './WeeGlassPill';
import WeePillFloorShadow from './WeePillFloorShadow';

const MotionDiv = m.div;

/**
 * Canonical top-of-screen gooey status pill — same glass + floor + pillOpen/Close
 * language as {@link WeeGooeySpacePill}. Use for launch feedback and similar transient chrome.
 */
function WeeGooeyStatusPill({
  open = false,
  label,
  icon = 'spinner',
  className = '',
  'aria-live': ariaLive = 'polite',
}) {
  const { reducedMotion, pillOpen } = useWeeMotion();
  const mf = useMotionFeedback();
  const gooey = mf.gooey?.enabled !== false && !reducedMotion;
  const entrance = getWeeStatusPillEntrance(reducedMotion, pillOpen);
  const pressTransition = createWeeTransition('press', { reducedMotion });

  return (
    <AnimatePresence>
      {open && label ? (
        <MotionDiv
          key="wee-status-pill"
          className={[
            'pointer-events-none fixed left-1/2 top-[max(1.25rem,env(safe-area-inset-top))] z-[100000]',
            '-translate-x-1/2',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          initial={entrance.initial}
          animate={entrance.animate}
          exit={entrance.exit}
          transition={entrance.transition}
          role="status"
          aria-live={ariaLive}
        >
          <div className="relative flex flex-col items-center">
            <WeeGlassPill
              motion
              className={[
                'relative z-10 flex min-h-[3.5rem] max-w-[min(92vw,28rem)] items-center gap-3',
                'rounded-full px-5 py-3',
                gooey ? 'will-change-transform' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              animate={
                gooey
                  ? { scale: 1 }
                  : undefined
              }
              whileHover={gooey ? { scale: 1.02, y: -1 } : undefined}
              transition={pressTransition}
            >
              <span
                className={[
                  'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                  'bg-[hsl(var(--surface-elevated))] shadow-[var(--shadow-md)]',
                  'text-[hsl(var(--primary))]',
                ].join(' ')}
                aria-hidden
              >
                {icon === 'spinner' ? (
                  <MotionDiv
                    animate={reducedMotion ? undefined : { rotate: 360 }}
                    transition={
                      reducedMotion
                        ? undefined
                        : { duration: 1.1, repeat: Infinity, ease: 'linear' }
                    }
                    className="flex items-center justify-center"
                  >
                    <Loader2 size={22} strokeWidth={2.35} />
                  </MotionDiv>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))]" />
                )}
              </span>
              <span className="min-w-0 truncate pr-1 text-[11px] font-black uppercase italic tracking-[0.18em] text-[hsl(var(--text-primary))]">
                {label}
              </span>
            </WeeGlassPill>
            <WeePillFloorShadow expanded={false} reducedMotion={reducedMotion} />
          </div>
        </MotionDiv>
      ) : null}
    </AnimatePresence>
  );
}

WeeGooeyStatusPill.propTypes = {
  open: PropTypes.bool,
  label: PropTypes.string,
  icon: PropTypes.oneOf(['spinner', 'dot']),
  className: PropTypes.string,
  'aria-live': PropTypes.string,
};

export default WeeGooeyStatusPill;
