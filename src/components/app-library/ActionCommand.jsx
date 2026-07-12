import React from 'react';
import clsx from 'clsx';
import Button from '../../ui/WButton';
import '../../styles/admin-panels.css';

const ActionCommand = ({
  action,
  isAdded,
  isRecentlyAdded,
  onAdd,
  onRemove,
  onQuickExecute,
  onEdit,
}) => {
  const rowMod = isRecentlyAdded ? 'recent' : isAdded ? 'added' : 'open';
  const destructive = Boolean(action.destructive);

  return (
    <div
      className={clsx('action-command-row', `action-command-row--${rowMod}`)}
      onClick={() => onAdd?.(action)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAdd?.(action);
        }
      }}
    >
      <span className="action-command-icon">{action.icon}</span>
      <div className="action-command-body">
        <div className="action-command-name">
          {action.name}
          {destructive ? (
            <span className="ml-2 rounded-full border border-[hsl(var(--state-warning)/0.5)] bg-[hsl(var(--state-warning)/0.15)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-[hsl(var(--state-warning))]">
              Confirm
            </span>
          ) : null}
        </div>
        <div className="action-command-cmd">{action.command}</div>
        <div className="action-command-meta">{action.category}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {onEdit ? (
          <Button
            variant="tertiary"
            size="sm"
            className="min-w-0"
            onClick={() => onEdit(action)}
          >
            Edit
          </Button>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          className="min-w-0"
          onClick={() => onQuickExecute(action)}
        >
          Run
        </Button>
        {isAdded ? (
          <Button
            variant="danger-secondary"
            size="sm"
            className="min-w-0"
            onClick={() => onRemove?.(action.id)}
          >
            Remove
          </Button>
        ) : (
          <div className="action-command-badge action-command-badge--idle">Add</div>
        )}
      </div>
    </div>
  );
};

export default ActionCommand;
