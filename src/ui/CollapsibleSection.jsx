import React, { useState } from 'react';
import Text from './Text';

const CollapsibleSection = ({ 
  title, 
  description, 
  icon, 
  iconBgColor = '#ffffff',
  gradientBg = 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
  borderColor = '#1DB954',
  shadowColor = 'rgba(29, 185, 84, 0.3)',
  defaultCollapsed = false,
  children,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`mb-8 ${className}`}
      style={{
        background: gradientBg,
        border: `2px solid ${borderColor}`,
        borderRadius: '16px',
        boxShadow: `0 8px 32px ${shadowColor}`
      }}
    >
      {/* Always visible header */}
      <div 
        className="flex items-center p-6 rounded-xl cursor-pointer transition-all duration-200"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}
        onClick={handleToggle}
      >
        {/* Icon */}
        <div 
          className="w-14 h-14 flex items-center justify-center rounded-xl mr-6"
          style={{
            backgroundColor: iconBgColor,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}
        >
          {typeof icon === 'string' ? (
            <span className="text-[28px]">{icon}</span>
          ) : (
            icon
          )}
        </div>
        
        {/* Title and Description */}
        <div className="flex-1">
          <Text 
            variant="h3" 
            className="mb-1 text-white font-bold"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            {title}
          </Text>
          <Text 
            variant="caption" 
            className="text-white"
            style={{
              opacity: 0.9,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
          >
            {description}
          </Text>
        </div>
        
        {/* Caret */}
        <div 
          className="text-white text-2xl transition-transform duration-200"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}
        >
          ▼
        </div>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div 
          className="pt-6 mt-6 border-t"
          style={{ borderTopColor: 'rgba(255, 255, 255, 0.15)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection; 