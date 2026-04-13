import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { motion, useReducedMotion } from 'framer-motion';
import { ChannelDropTargetMotion } from './ChannelDragMotion';
import { computeReorderShiftMotion } from '../../utils/channelReorderShift';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';

const DRAG_PREFIX = 'channel-drag-';
const SLOT_PREFIX = 'channel-slot-';

export const channelDragId = (index) => `${DRAG_PREFIX}${index}`;
export const channelSlotId = (index) => `${SLOT_PREFIX}${index}`;

export function parseChannelDnDId(id) {
  if (typeof id !== 'string') return null;
  if (id.startsWith(DRAG_PREFIX)) {
    const n = parseInt(id.slice(DRAG_PREFIX.length), 10);
    return Number.isFinite(n) ? n : null;
  }
  if (id.startsWith(SLOT_PREFIX)) {
    const n = parseInt(id.slice(SLOT_PREFIX.length), 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Whole-tile drag + droppable cell. Click-to-launch uses pointer distance threshold on DndContext sensors.
 */
function ChannelSlotDnd({ channelIndex, disabled, celebrateDrop, reorderWave, children }) {
  const osReduced = useReducedMotion();
  const { channelReorderSlotMotion } = useMotionFeedback();
  const reduceMotion = osReduced || !channelReorderSlotMotion;
  const slotId = channelSlotId(channelIndex);
  const dragId = channelDragId(channelIndex);

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
      <motion.div
        className="channel-slot-dnd__shift h-full w-full min-h-0 min-w-0"
        initial={false}
        animate={shiftMotion.animate}
        transition={shiftMotion.transition}
        style={{ transformOrigin: 'center center' }}
      >
        <ChannelDropTargetMotion isActive={isOver} isSource={isDragging}>
          <motion.div
            className="channel-slot-dnd__content h-full w-full min-h-0 min-w-0"
            animate={
              celebrateDrop && !reduceMotion
                ? { scale: [1, 1.14, 0.98, 1] }
                : { scale: 1 }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 580, damping: 22, mass: 0.65 }
            }
          >
            {children}
          </motion.div>
        </ChannelDropTargetMotion>
      </motion.div>
    </div>
  );
}

ChannelSlotDnd.propTypes = {
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
