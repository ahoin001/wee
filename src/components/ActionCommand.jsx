import React from 'react';
import Button from '../ui/Button';

const ActionCommand = ({ 
  action, 
  isAdded, 
  isRecentlyAdded, 
  onAdd, 
  onQuickExecute 
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px',
        margin: '4px 0',
        background: isRecentlyAdded 
          ? 'hsl(var(--state-success) / 0.1)' 
          : isAdded 
            ? 'hsl(var(--wii-blue) / 0.1)' 
            : 'hsl(var(--surface-primary))',
        borderRadius: 6,
        border: isRecentlyAdded 
          ? '2px solid hsl(var(--state-success))' 
          : isAdded 
            ? '2px solid hsl(var(--wii-blue))' 
            : '1px solid hsl(var(--border-primary))',
        cursor: isAdded ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: isAdded ? 0.7 : 1
      }}
      onClick={() => !isAdded && onAdd(action)}
      onMouseEnter={e => {
        if (!isAdded) {
          e.currentTarget.style.background = 'hsl(var(--state-hover))';
          e.currentTarget.style.border = '1.5px solid hsl(var(--wii-blue))';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        if (!isAdded) {
          e.currentTarget.style.background = isRecentlyAdded 
            ? 'hsl(var(--state-success) / 0.1)' 
            : isAdded 
              ? 'hsl(var(--wii-blue) / 0.1)' 
              : 'hsl(var(--surface-primary))';
          e.currentTarget.style.border = isRecentlyAdded 
            ? '2px solid hsl(var(--state-success))' 
            : isAdded 
              ? '2px solid hsl(var(--wii-blue))' 
              : '1px solid hsl(var(--border-primary))';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <span style={{ fontSize: '20px' }}>{action.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: '500',
          color: 'hsl(var(--text-primary))'
        }}>
          {action.name}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: 'hsl(var(--text-secondary))',
          fontFamily: 'monospace'
        }}>
          {action.command}
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: 'hsl(var(--text-tertiary))',
          marginTop: '2px'
        }}>
          {action.category}
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onQuickExecute(action);
        }}
        style={{ minWidth: 'auto' }}
      >
        Run
      </Button>
      {isAdded && (
        <div style={{
          background: 'hsl(var(--state-success))',
          color: 'hsl(var(--text-inverse))',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '500'
        }}>
          Added
        </div>
      )}
    </div>
  );
};

export default ActionCommand; 