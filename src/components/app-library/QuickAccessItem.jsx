import React, { useState } from 'react';
import clsx from 'clsx';
import Button from '../../ui/WButton';
import '../../styles/admin-panels.css';

const QuickAccessItem = ({ 
  action, 
  index, 
  onRemove, 
  onMoveAction 
}) => {
  const [dropBefore, setDropBefore] = useState(false);

  return (
    <div
      draggable
      className={clsx(
        'quick-access-row',
        dropBefore && 'quick-access-row--drop-before'
      )}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', index.toString());
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDropBefore(true);
      }}
      onDragLeave={() => {
        setDropBefore(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDropBefore(false);
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (fromIndex !== index) {
          onMoveAction(fromIndex, index);
        }
      }}
    >
      <span className="quick-access-icon">{action.icon}</span>
      <div className="quick-access-body">
        <div className="quick-access-name">
          {action.name}
        </div>
        <div className="quick-access-cmd">
          {action.command}
        </div>
      </div>
      <Button
        variant="danger-secondary"
        size="sm"
        className="min-w-0 shrink-0"
        onClick={() => onRemove(action.id)}
      >
        ✕
      </Button>
    </div>
  );
};

export default QuickAccessItem;

