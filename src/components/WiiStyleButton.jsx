import React from 'react';
import PropTypes from 'prop-types';

const WiiStyleButton = ({ 
  children, 
  onClick, 
  onContextMenu, 
  title, 
  className = '', 
  style = {},
  useAdaptiveColor = false,
  ribbonGlowColor = '#0099ff'
}) => {
  const baseStyle = {
    minWidth: '80px',
    height: '70px',
    borderRadius: '50%',
    background: 'white',
    border: '4px solid #b0b0b0',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    ...style
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const hoverStyle = {
    ...baseStyle,
    transform: 'scale(1.05)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
    border: useAdaptiveColor 
      ? `4px solid ${ribbonGlowColor}` 
      : '4px solid #0099ff'
  };

  return (
    <div
      className={`wii-style-button ${className}`}
      style={isHovered ? hoverStyle : baseStyle}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={title}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {children}
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
  ribbonGlowColor: PropTypes.string
};

export default WiiStyleButton; 