import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, Grip, PenLine } from 'lucide-react';
import { createWeeTransition } from '../../design/weeMotion';
import { WeeGlassPill, WeeButton } from '../../ui/wee';

const MotionDiv = m.div;

/**
 * Live Board Studio bottom toolbar — visible only while `homeBoardArrangeMode` is on.
 * Punch mode toggles whether tapping a slot punches/restores a wallpaper hole instead of
 * launching; drag-to-reorder always stays available underneath.
 */
function HomeBoardArrangeBar({ arrangeMode, punchMode, onTogglePunch, onDone }) {
  const reducedMotion = useReducedMotion();
  const transition = createWeeTransition('pillOpen', { reducedMotion });
  const press = createWeeTransition('press', { reducedMotion });

  return (
    <AnimatePresence>
      {arrangeMode ? (
        <MotionDiv
          key="home-board-arrange-bar"
          className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[2350] flex justify-center px-4"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          transition={transition}
        >
          <WeeGlassPill className="pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2.5 md:px-5">
            <span className="flex items-center gap-2 pl-1 pr-2 text-[11px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
              <Grip size={14} strokeWidth={2.5} aria-hidden />
              Arranging Home
            </span>

            <m.button
              type="button"
              aria-pressed={punchMode}
              onClick={onTogglePunch}
              whileHover={reducedMotion ? undefined : { scale: 1.04 }}
              whileTap={reducedMotion ? undefined : { scale: 0.95 }}
              transition={press}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-wide ${
                punchMode
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-sm)]'
                  : 'border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-secondary))]'
              }`}
            >
              <PenLine size={13} strokeWidth={2.5} aria-hidden />
              Punch holes
            </m.button>

            <WeeButton
              variant="primary"
              className="!rounded-full !px-4 !py-2"
              onClick={onDone}
            >
              <span className="flex items-center gap-1.5">
                <Check size={13} strokeWidth={3} aria-hidden />
                Done
              </span>
            </WeeButton>
          </WeeGlassPill>
        </MotionDiv>
      ) : null}
    </AnimatePresence>
  );
}

HomeBoardArrangeBar.propTypes = {
  arrangeMode: PropTypes.bool.isRequired,
  punchMode: PropTypes.bool.isRequired,
  onTogglePunch: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
};

export default React.memo(HomeBoardArrangeBar);
