// Card.jsx - Unified card component for app UI
// Usage:
// <Card><Text variant="h3">Title</Text>...</Card>

import React from 'react';
import './Card.css';

export default function Card({ title, separator, desc, actions, headerActions, children, className = '', style = {} }) {
  return (
    <div className={`wee-card ${className}`} style={style}>
      {(title || headerActions) && (
        <div className="wee-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title && (
            <span className="wee-card-title">{title}</span>
          )}
          {headerActions}
        </div>
      )}
      {separator && <div className="wee-card-separator" />}
      {desc && <div className="wee-card-desc">{desc}</div>}
      {actions}
      {children}
    </div>
  );
} 