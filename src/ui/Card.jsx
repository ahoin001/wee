// Card.jsx - Unified card component for app UI
// Usage:
// <Card><Text variant="h3">Title</Text>...</Card>

import React from 'react';
import './Card.css';
import Text from './Text';

const Card = React.memo(({ title, separator, desc, actions, headerActions, children, className = '', style = {}, onClick }) => {
  return (
    <div className={`wee-card ${className}`} style={style} onClick={onClick}>
      {(title || headerActions) && (
        <div className="wee-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title && (
            <Text variant="h3" style={{ margin: 0 }}>{title}</Text>
          )}
          {headerActions}
        </div>
      )}
      {separator && <div className="wee-card-separator" />}
      {desc && <Text variant="desc">{desc}</Text>}
      {actions}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card; 