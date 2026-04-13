import React from 'react';
import clsx from 'clsx';
import Button from '../ui/WButton';
import '../styles/admin-panels.css';

const ActionCommand = ({ 
  action, 
  isAdded, 
  isRecentlyAdded, 
  onAdd, 
  onQuickExecute 
}) => {
  const rowMod = isRecentlyAdded ? 'recent' : isAdded ? 'added' : 'open';

  return (
    <div
      className={clsx('action-command-row', `action-command-row--${rowMod}`)}
      onClick={() => !isAdded && onAdd(action)}
    >
      <span className="action-command-icon">{action.icon}</span>
      <div className="action-command-body">
        <div className="action-command-name">
          {action.name}
        </div>
        <div className="action-command-cmd">
          {action.command}
        </div>
        <div className="action-command-meta">
          {action.category}
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        className="min-w-0 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onQuickExecute(action);
        }}
      >
        Run
      </Button>
      {isAdded && (
        <div className="action-command-badge">
          Added
        </div>
      )}
    </div>
  );
};

export default ActionCommand;
