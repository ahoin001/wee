// Card.jsx - Unified card component for app UI
// Usage:
// <Card><Text variant="h3">Title</Text>...</Card>

import React from 'react';
import './Card.css';
import Text from './Text';

export default function Card({ title, separator, desc, actions, headerActions, children, className = '', style = {} }) {
  return (
    <div className={`wee-card ${className}`} style={style}>
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
} 