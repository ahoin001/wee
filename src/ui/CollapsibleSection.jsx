import React, { useState } from 'react';
import Text from './Text';
import {
  CSS_COLOR_PURE_WHITE,
  SPOTIFY_CARD_SHADOW_SOFT,
  SPOTIFY_DEFAULT_GRADIENT,
  CSS_SPOTIFY_PRIMARY,
} from '../design/runtimeColorStrings.js';

const HEADER_SCRIM = 'hsl(var(--color-pure-white) / 0.1)';
const TEXT_SHADOW_SOFT = '0 2px 4px hsl(var(--color-pure-black) / 0.3)';
const ICON_WRAP_SHADOW = '0 4px 16px hsl(var(--color-pure-black) / 0.3)';
const DIVIDER_LINE = 'hsl(var(--color-pure-white) / 0.15)';

const CollapsibleSection = ({ 
  title, 
  description, 
  icon, 
  iconBgColor = CSS_COLOR_PURE_WHITE,
  gradientBg = SPOTIFY_DEFAULT_GRADIENT,
  borderColor = CSS_SPOTIFY_PRIMARY,
  shadowColor = SPOTIFY_CARD_SHADOW_SOFT,
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
          background: HEADER_SCRIM,
          backdropFilter: 'blur(10px)'
        }}
        onClick={handleToggle}
      >
        {/* Icon */}
        <div 
          className="w-14 h-14 flex items-center justify-center rounded-xl mr-6"
          style={{
            backgroundColor: iconBgColor,
            boxShadow: ICON_WRAP_SHADOW
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
              textShadow: TEXT_SHADOW_SOFT
            }}
          >
            {title}
          </Text>
          <Text 
            variant="caption" 
            className="text-white"
            style={{
              opacity: 0.9,
              textShadow: '0 1px 2px hsl(var(--color-pure-black) / 0.3)'
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
            textShadow: TEXT_SHADOW_SOFT
          }}
        >
          ▼
        </div>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div 
          className="pt-6 mt-6 border-t"
          style={{ borderTopColor: DIVIDER_LINE }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection; 