import React from 'react';
import PropTypes from 'prop-types';

const WiiStyleButton = ({ 
  children, 
  onClick, 
  onContextMenu, 
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  title, 
  className = '', 
  style = {},
  useAdaptiveColor = false,
  useGlowEffect = false,
  glowStrength = 20,
  useGlassEffect = false,
  glassOpacity = 0.18,
  glassBlur = 2.5,
  glassBorderOpacity = 0.5,
  glassShineOpacity = 0.7,
  ribbonGlowColor = '#0099ff',
  spotifySecondaryColor = null,
  spotifyTextColor = null,
  spotifyAccentColor = null
}) => {
  // Helper function to convert RGB color to rgba with opacity
  const rgbToRgba = (rgbColor, opacity) => {
    if (!rgbColor) return `rgba(255, 255, 255, ${opacity})`;
    
    // Extract RGB values from rgb() or rgba() string
    const match = rgbColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const [, r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // If it's a hex color, convert it
    if (rgbColor.startsWith('#')) {
      const r = parseInt(rgbColor.slice(1, 3), 16);
      const g = parseInt(rgbColor.slice(3, 5), 16);
      const b = parseInt(rgbColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return `rgba(255, 255, 255, ${opacity})`;
  };

  const baseStyle = {
    minWidth: '80px',
    height: '70px',
    borderRadius: '50%',
    background: useGlassEffect 
      ? (spotifySecondaryColor ? rgbToRgba(spotifySecondaryColor, glassOpacity) : `rgba(255, 255, 255, ${glassOpacity})`)
      : (spotifySecondaryColor ? spotifySecondaryColor : 'white'),
    border: useGlassEffect 
      ? (spotifyAccentColor ? `4px solid ${rgbToRgba(spotifyAccentColor, glassBorderOpacity)}` : `4px solid rgba(255, 255, 255, ${glassBorderOpacity})`)
      : (spotifyAccentColor ? `4px solid ${spotifyAccentColor}` : '4px solid #b0b0b0'),
    boxShadow: useGlassEffect 
      ? '0 4px 8px rgba(0, 0, 0, 0.1)'
      : '0 4px 8px rgba(0, 0, 0, 0.2)',
    backdropFilter: useGlassEffect ? `blur(${glassBlur}px)` : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    position: 'relative',
    ...style
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = (e) => {
    setIsHovered(false);
    onMouseLeave?.(e);
  };

  const hoverStyle = {
    ...baseStyle,
    transform: 'scale(1.05)',
    boxShadow: useGlowEffect 
      ? `0 0 ${glowStrength}px ${spotifyAccentColor || (useAdaptiveColor ? ribbonGlowColor : '#0099ff')}`
      : useGlassEffect
        ? '0 6px 12px rgba(0, 0, 0, 0.15)'
        : '0 6px 12px rgba(0, 0, 0, 0.3)',
    border: useGlowEffect 
      ? '4px solid #b0b0b0' // Keep original border when using glow
      : useGlassEffect
        ? (spotifyAccentColor ? `4px solid ${rgbToRgba(spotifyAccentColor, glassBorderOpacity * 1.2)}` : `4px solid rgba(255, 255, 255, ${glassBorderOpacity})`)
        : (spotifyAccentColor
            ? `4px solid ${spotifyAccentColor}` 
            : (useAdaptiveColor 
                ? `4px solid ${ribbonGlowColor}` 
                : '4px solid #0099ff'))
  };

  return (
    <div
      className={`wii-style-button ${className}`}
      style={isHovered ? hoverStyle : baseStyle}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      title={title}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Glass shine effect */}
      {useGlassEffect && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            background: `linear-gradient(135deg, rgba(255,255,255,${glassShineOpacity}) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)`,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}
      {/* Content with higher z-index to appear above glass */}
      <div style={{ 
        position: 'relative', 
        zIndex: 2,
        color: spotifyTextColor || 'inherit'
      }}>
        {children}
      </div>
    </div>
  );
};

WiiStyleButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  onContextMenu: PropTypes.func,
  title: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  useAdaptiveColor: PropTypes.bool,
  useGlowEffect: PropTypes.bool,
  glowStrength: PropTypes.number,
  useGlassEffect: PropTypes.bool,
  glassOpacity: PropTypes.number,
  glassBlur: PropTypes.number,
  glassBorderOpacity: PropTypes.number,
  glassShineOpacity: PropTypes.number,
  ribbonGlowColor: PropTypes.string,
  spotifySecondaryColor: PropTypes.string,
  spotifyTextColor: PropTypes.string,
  spotifyAccentColor: PropTypes.string
};

export default WiiStyleButton; 