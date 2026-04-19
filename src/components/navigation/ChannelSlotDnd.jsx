import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { m, useReducedMotion } from 'framer-motion';
import { ChannelDropTargetMotion } from './ChannelDragMotion';
import { computeReorderShiftMotion } from '../../utils/channelReorderShift';
import { WEE_SPRINGS } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';

const DRAG_PREFIX = 'channel-drag-';
const SLOT_PREFIX = 'channel-slot-';
const SCOPED_DRAG = /^channel-drag-(home|workspaces)-(\d+)$/;
const SCOPED_SLOT = /^channel-slot-(home|workspaces)-(\d+)$/;

/** Per shell space + index — avoids ambiguity when Home + Work grids mount together. */
export const channelDragId = (spaceKey, index) => `${DRAG_PREFIX}${spaceKey}-${index}`;
export const channelSlotId = (spaceKey, index) => `${SLOT_PREFIX}${spaceKey}-${index}`;

export function parseChannelDnDId(id) {
  if (typeof id !== 'string') return null;
  let m = id.match(SCOPED_DRAG);
  if (m) {
    const n = parseInt(m[2], 10);
    return Number.isFinite(n) ? n : null;
  }
  m = id.match(SCOPED_SLOT);
  if (m) {
    const n = parseInt(m[2], 10);
    return Number.isFinite(n) ? n : null;
  }
  if (id.startsWith(DRAG_PREFIX)) {
    const rest = id.slice(DRAG_PREFIX.length);
    if (/^\d+$/.test(rest)) {
      const n = parseInt(rest, 10);
      return Number.isFinite(n) ? n : null;
    }
  }
  if (id.startsWith(SLOT_PREFIX)) {
    const rest = id.slice(SLOT_PREFIX.length);
    if (/^\d+$/.test(rest)) {
      const n = parseInt(rest, 10);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

/**
 * Whole-tile drag + droppable cell. Click-to-launch uses pointer distance threshold on DndContext sensors.
 */
function ChannelSlotDnd({ channelSpaceKey, channelIndex, disabled, celebrateDrop, reorderWave, children }) {
  const osReduced = useReducedMotion();
  const { channelReorderSlotMotion } = useMotionFeedback();
  const reduceMotion = osReduced || !channelReorderSlotMotion;
  const slotId = channelSlotId(channelSpaceKey, channelIndex);
  const dragId = channelDragId(channelSpaceKey, channelIndex);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: slotId,
    disabled,
    data: { channelIndex },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: dragId,
    disabled,
    data: { channelIndex },
  });

  const setCombinedRef = useCallback(
    (node) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );

  const shiftMotion = computeReorderShiftMotion(channelIndex, reorderWave, reduceMotion);

  return (
    <div
      ref={setCombinedRef}
      data-channel-slot={channelIndex}
      className={`channel-slot-dnd relative h-full w-full min-h-0 min-w-0${isDragging ? ' channel-slot-dnd--dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <m.div
        className="channel-slot-dnd__shift h-full w-full min-h-0 min-w-0"
        initial={false}
        animate={shiftMotion.animate}
        transition={shiftMotion.transition}
        style={{ transformOrigin: 'center center' }}
      >
        <ChannelDropTargetMotion isActive={isOver} isSource={isDragging}>
          <m.div
            className="channel-slot-dnd__content h-full w-full min-h-0 min-w-0"
            animate={
              celebrateDrop && !reduceMotion
                ? { scale: [1, 1.14, 0.98, 1] }
                : { scale: 1 }
            }
            transition={reduceMotion ? { duration: 0 } : WEE_SPRINGS.channelDropCelebrate}
          >
            {children}
          </m.div>
        </ChannelDropTargetMotion>
      </m.div>
    </div>
  );
}

ChannelSlotDnd.propTypes = {
  channelSpaceKey: PropTypes.oneOf(['home', 'workspaces']).isRequired,
  channelIndex: PropTypes.number.isRequired,
  disabled: PropTypes.bool,
  celebrateDrop: PropTypes.bool,
  reorderWave: PropTypes.shape({
    from: PropTypes.number.isRequired,
    to: PropTypes.number.isRequired,
    id: PropTypes.number.isRequired,
  }),
  children: PropTypes.node.isRequired,
};

ChannelSlotDnd.defaultProps = {
  disabled: false,
  celebrateDrop: false,
  reorderWave: null,
};

export default React.memo(ChannelSlotDnd);
