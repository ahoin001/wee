import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { createWeeTransition } from '../../design/weeMotion';
import { useHomeSlotResize } from '../../hooks/useHomeSlotResize';

const MotionDiv = m.div;

/**
 * Edit Home corner grabber + footprint ghost.
 * Mount as a sibling overlay inside the selected slot shell (ChannelSlotDnd).
 */
function HomeSlotResizeHandle({
  enabled,
  anchorIndex,
  colSpan,
  rowSpan,
  slots,
  columns,
  rows,
  onCommit,
  onResizeActiveChange,
}) {
  const reducedMotion = useReducedMotion();
  const snapTransition = createWeeTransition('pillOpen', { reducedMotion });
  const pressTransition = createWeeTransition('press', { reducedMotion });

  const { isResizing, draft, handleProps } = useHomeSlotResize({
    enabled,
    anchorIndex,
    colSpan,
    rowSpan,
    slots,
    columns,
    rows,
    onCommit,
    onResizeStart: () => onResizeActiveChange?.(true),
    onResizeEnd: () => onResizeActiveChange?.(false),
  });

  useEffect(() => {
    if (!enabled) onResizeActiveChange?.(false);
  }, [enabled, onResizeActiveChange]);

  if (!enabled) return null;

  const ghost =
    isResizing && draft
      ? createPortal(
          <AnimatePresence>
            <MotionDiv
              key={`resize-ghost-${anchorIndex}`}
              className="pointer-events-none fixed z-[var(--z-home-arrange-bar)] rounded-[var(--radius-lg)] border-2 border-dashed"
              style={{
                left: draft.left,
                top: draft.top,
                width: draft.width,
                height: draft.height,
                borderColor: draft.valid
                  ? 'hsl(var(--primary) / 0.85)'
                  : 'hsl(var(--state-error) / 0.85)',
                background: draft.valid
                  ? 'hsl(var(--primary) / 0.14)'
                  : 'hsl(var(--state-error) / 0.14)',
                boxShadow: draft.valid
                  ? 'var(--shadow-hover-glow)'
                  : '0 0 18px hsl(var(--state-error) / 0.28)',
              }}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={
                draft.valid
                  ? { opacity: 1, scale: 1, x: 0 }
                  : reducedMotion
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 1, scale: 1, x: [0, -5, 5, -3, 3, 0] }
              }
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={
                draft.valid
                  ? snapTransition
                  : reducedMotion
                    ? { duration: 0 }
                    : { ...snapTransition, x: { duration: 0.32 } }
              }
              aria-hidden
            />
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <>
      {ghost}
      <button
        type="button"
        aria-label="Resize tile — drag to change size"
        title="Drag to resize"
        className={`absolute bottom-1 right-1 z-20 flex h-11 w-11 touch-none items-center justify-center rounded-full border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-primary))] shadow-[var(--shadow-card)] transition-[box-shadow,border-color] hover:border-[hsl(var(--primary)/0.55)] hover:shadow-[var(--shadow-hover-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] ${
          isResizing ? 'border-[hsl(var(--primary))] shadow-[var(--shadow-hover-glow)]' : ''
        }`}
        style={{ cursor: 'nwse-resize', touchAction: 'none' }}
        {...handleProps}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <MotionDiv
          className="pointer-events-none flex h-5 w-5 items-end justify-end"
          whileHover={reducedMotion ? undefined : { scale: 1.08 }}
          transition={pressTransition}
        >
          {/* Corner chevron affordance */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
            className="text-[hsl(var(--primary))]"
          >
            <path
              d="M12 2v8a2 2 0 0 1-2 2H2"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 12h2a2 2 0 0 0 2-2V8"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              opacity="0.45"
            />
          </svg>
        </MotionDiv>
      </button>
    </>
  );
}

HomeSlotResizeHandle.propTypes = {
  enabled: PropTypes.bool.isRequired,
  anchorIndex: PropTypes.number.isRequired,
  colSpan: PropTypes.number.isRequired,
  rowSpan: PropTypes.number.isRequired,
  slots: PropTypes.array,
  columns: PropTypes.number.isRequired,
  rows: PropTypes.number.isRequired,
  onCommit: PropTypes.func.isRequired,
  onResizeActiveChange: PropTypes.func,
};

HomeSlotResizeHandle.defaultProps = {
  slots: [],
  onResizeActiveChange: undefined,
};

export default React.memo(HomeSlotResizeHandle);
