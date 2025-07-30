import React from 'react';
import Button from '../ui/Button';

const QuickAccessItem = ({ 
  action, 
  index, 
  onRemove, 
  onMoveAction 
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', index.toString());
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderTop = '2px solid hsl(var(--wii-blue))';
      }}
      onDragLeave={(e) => {
        e.currentTarget.style.borderTop = 'none';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderTop = 'none';
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (fromIndex !== index) {
          onMoveAction(fromIndex, index);
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        margin: '4px 0',
        background: 'hsl(var(--surface-primary))',
        borderRadius: 6,
        border: '1px solid hsl(var(--border-primary))',
        cursor: 'grab',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'hsl(var(--state-hover))';
        e.currentTarget.style.border = '1.5px solid hsl(var(--wii-blue))';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'hsl(var(--surface-primary))';
        e.currentTarget.style.border = '1px solid hsl(var(--border-primary))';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span style={{ fontSize: '18px' }}>{action.icon}</span>
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
      </div>
      <Button
        variant="danger-secondary"
        size="sm"
        onClick={() => onRemove(action.id)}
        style={{ minWidth: 'auto' }}
      >
        ✕
      </Button>
    </div>
  );
};

export default QuickAccessItem; 