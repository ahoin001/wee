// Card.jsx - Unified card component for app UI
// Usage:
// <Card><Text variant="h3">Title</Text>...</Card>

import React from 'react';
import Text from './Text';

const Card = React.memo(({ title, separator, desc, actions, headerActions, children, className = '', style = {}, onClick }) => {
  return (
    <div 
      className={`mt-[18px] mb-0 px-7 py-6 rounded-xl bg-[hsl(var(--surface-secondary))] shadow-[var(--shadow-sm)] border border-[hsl(var(--border-primary))] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[var(--shadow-md)] hover:border-[hsl(var(--border-secondary))] ${className}`} 
      style={style} 
      onClick={onClick}
    >
      {(title || headerActions) && (
        <div className="mb-1.5 flex items-center justify-between">
          {title && (
            <Text variant="h3" style={{ margin: 0 }}>{title}</Text>
          )}
          {headerActions}
        </div>
      )}
      {separator && <div className="h-px bg-[hsl(var(--border-primary))] my-2.5" />}
      {desc && <Text variant="desc">{desc}</Text>}
      {actions}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card; 