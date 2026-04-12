import React from 'react';
import PropTypes from 'prop-types';
import './WiiStyleButton.css';

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
    '--wii-style-bg': useGlassEffect
      ? (spotifySecondaryColor ? rgbToRgba(spotifySecondaryColor, glassOpacity) : `rgba(255, 255, 255, ${glassOpacity})`)
      : (spotifySecondaryColor || 'hsl(var(--surface-primary))'),
    '--wii-style-border': useGlassEffect
      ? (spotifyAccentColor ? rgbToRgba(spotifyAccentColor, glassBorderOpacity) : `rgba(255, 255, 255, ${glassBorderOpacity})`)
      : (spotifyAccentColor || 'hsl(var(--border-primary))'),
    '--wii-style-shadow': useGlassEffect ? '0 4px 8px rgba(0, 0, 0, 0.1)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
    '--wii-style-backdrop-blur': useGlassEffect ? `${glassBlur}px` : '0px',
    '--wii-style-hover-shadow': useGlowEffect
      ? `0 0 ${glowStrength}px ${spotifyAccentColor || (useAdaptiveColor ? ribbonGlowColor : 'hsl(var(--wii-blue))')}`
      : useGlassEffect
        ? '0 6px 12px rgba(0, 0, 0, 0.15)'
        : '0 6px 12px rgba(0, 0, 0, 0.3)',
    '--wii-style-hover-border': useGlowEffect
      ? 'hsl(var(--border-primary))'
      : useGlassEffect
        ? (spotifyAccentColor ? rgbToRgba(spotifyAccentColor, glassBorderOpacity * 1.2) : `rgba(255, 255, 255, ${glassBorderOpacity})`)
        : (spotifyAccentColor || (useAdaptiveColor ? ribbonGlowColor : 'hsl(var(--wii-blue))')),
    '--wii-style-text': spotifyTextColor || 'inherit',
    '--wii-style-shine': `linear-gradient(135deg, rgba(255,255,255,${glassShineOpacity}) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)`,
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

  return (
    <div
      className={`wii-style-button ${className}`}
      style={{ ...baseStyle, '--wii-style-is-hovered': isHovered ? 1 : 0 }}
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
        <div className="wii-style-button-shine" />
      )}
      {/* Content with higher z-index to appear above glass */}
      <div className="wii-style-button-content">
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