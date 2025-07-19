import React, { useState } from 'react';

const ResourceUsageIndicator = ({ 
  level = 'medium', // 'low', 'medium', 'high'
  tooltip = 'This feature may use significant system resources',
  children,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getIconColor = () => {
    switch (level) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getTooltipText = () => {
    switch (level) {
      case 'low': return 'This feature uses minimal system resources';
      case 'medium': return 'This feature may use moderate system resources. Test to ensure your PC can handle it.';
      case 'high': return 'This feature uses significant system resources. Test thoroughly to ensure your PC can handle it.';
      default: return tooltip;
    }
  };

  return (
    <div 
      className={`resource-indicator ${className}`}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px',
        position: 'relative'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={getIconColor()} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ 
          cursor: 'help',
          flexShrink: 0
        }}
      >
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      
      {showTooltip && (
        <div 
          className="resource-tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'hsl(var(--surface-elevated))',
            color: 'hsl(var(--text-primary))',
            border: '1px solid hsl(var(--border-primary))',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: 'var(--shadow-lg)',
            marginBottom: '4px',
            maxWidth: '250px',
            textAlign: 'center'
          }}
        >
          {getTooltipText()}
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid hsl(var(--surface-elevated))'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ResourceUsageIndicator; 