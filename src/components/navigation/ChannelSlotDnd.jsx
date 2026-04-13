import React from 'react';
import PropTypes from 'prop-types';
import { useDraggable, useDroppable } from '@dnd-kit/core';

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
 * Droppable cell + draggable handle so channel click-to-launch stays separate from reorder.
 */
function ChannelSlotDnd({ channelIndex, disabled, children }) {
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

  return (
    <div
      ref={setDropRef}
      className={`channel-slot-dnd relative h-full w-full min-h-0 min-w-0${isOver ? ' channel-slot-dnd--over' : ''}${isDragging ? ' channel-slot-dnd--dragging' : ''}`}
    >
      <button
        type="button"
        ref={setDragRef}
        className="channel-slot-dnd__handle"
        aria-label="Drag to reorder channel"
        title="Drag to reorder"
        {...listeners}
        {...attributes}
      >
        ⋮⋮
      </button>
      <div className="channel-slot-dnd__content h-full w-full min-h-0 min-w-0">{children}</div>
    </div>
  );
}

ChannelSlotDnd.propTypes = {
  channelIndex: PropTypes.number.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

ChannelSlotDnd.defaultProps = {
  disabled: false,
};

export default React.memo(ChannelSlotDnd);
