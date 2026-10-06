import React, { forwardRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { createWeeChannelTileItemVariants, useWeeMotion } from '../../design/weeMotion';
import { WeeGlassPill, WeeGooeyTileButton, WeePillFloorShadow } from '../../ui/wee';
import { placeAnchoredPill, useBoardSlotRect } from '../../utils/boardSlotRect';
import { listPlaceableHomeSlotKindsGrouped } from './slotKindRegistry';

const MotionDiv = m.div;

/**
 * Widget choices that stagger open from the cell being filled or replaced.
 */
const ArrangeKindBloom = forwardRef(function ArrangeKindBloom({ slotIndex, onPick }, ref) {
  const reducedMotion = useReducedMotion();
  const { pillOpen, pillClose } = useWeeMotion();
  const rect = useBoardSlotRect(slotIndex, slotIndex != null);
  const groups = useMemo(() => listPlaceableHomeSlotKindsGrouped(), []);
  const variants = useMemo(
    () => createWeeChannelTileItemVariants(pillOpen, reducedMotion, 280),
    [pillOpen, reducedMotion]
  );

  const panelWidth = Math.min(window.innerWidth * 0.92, 640);
  const anchor = rect ? placeAnchoredPill(rect, panelWidth, 220) : null;
  const placeAbove = anchor?.placeAbove !== false;
  let stagger = 0;

  return (
    <MotionDiv
      ref={ref}
      className="pointer-events-none fixed z-[var(--z-home-arrange-bar)]"
      style={
        anchor && rect
          ? {
              left: anchor.left,
              width: panelWidth,
              top: placeAbove ? undefined : rect.bottom + 12,
              bottom: placeAbove ? window.innerHeight - rect.top + 12 : undefined,
              transformOrigin: placeAbove ? 'center bottom' : 'center top',
            }
          : { left: -9999, top: 0, width: panelWidth }
      }
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0.85, scale: 0.28, y: placeAbove ? 18 : -18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0.85, scale: 0.28, y: placeAbove ? 18 : -18, transition: pillClose }
      }
      transition={pillOpen}
    >
      <WeeGlassPill className="pointer-events-auto relative flex max-h-[min(42vh,22rem)] flex-col gap-3 overflow-y-auto rounded-[var(--wee-radius-pill)] px-3 py-3">
        <WeePillFloorShadow expanded reducedMotion={reducedMotion} />
        <div className="relative z-[1] flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-1.5">
              <span className="px-1 text-[9px] font-black uppercase tracking-[0.16em] text-[hsl(var(--text-tertiary))]">
                {group.label}
              </span>
              <div className="flex flex-wrap items-stretch gap-2">
                {group.kinds.map((kind) => {
                  const index = stagger;
                  stagger += 1;
                  return (
                    <MotionDiv
                      key={kind.id}
                      custom={index}
                      variants={variants}
                      initial="closed"
                      animate="open"
                      className="min-w-[11rem] max-w-[15rem] flex-1"
                    >
                      <WeeGooeyTileButton
                        orientation="row"
                        icon={kind.icon ?? '🧩'}
                        label={kind.label}
                        description={kind.description}
                        reducedMotion={reducedMotion}
                        onClick={() => onPick?.(kind.id)}
                        className="w-full"
                      />
                    </MotionDiv>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </WeeGlassPill>
    </MotionDiv>
  );
});

ArrangeKindBloom.displayName = 'ArrangeKindBloom';

ArrangeKindBloom.propTypes = {
  slotIndex: PropTypes.number,
  onPick: PropTypes.func,
};

export default ArrangeKindBloom;
