import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useChannelOperations from '../utils/useChannelOperations';
import './WiiPageNavigation.css';

const WiiPageNavigation = ({ 
  position = 'bottom',
  showSideButtons = true,
  showPageIndicator = true,
  glassEffect = true 
}) => {
  const {
    navigation,
    nextPage,
    prevPage,
    goToPage,
    finishAnimation
  } = useChannelOperations();
  
  const { currentPage, totalPages, isAnimating, mode } = navigation;

  // Icon state management
  const [leftIcon, setLeftIcon] = useState(null);
  const [rightIcon, setRightIcon] = useState(null);
  
  // Glass effect state management
  const [leftGlassSettings, setLeftGlassSettings] = useState({
    enabled: glassEffect,
    opacity: 0.18,
    blur: 2.5,
    borderOpacity: 0.5,
    shineOpacity: 0.7
  });
  const [rightGlassSettings, setRightGlassSettings] = useState({
    enabled: glassEffect,
    opacity: 0.18,
    blur: 2.5,
    borderOpacity: 0.5,
    shineOpacity: 0.7
  });

  // Load saved icons and glass settings on component mount
  useEffect(() => {
    const loadSavedSettings = async () => {
      if (window.api?.settings?.get) {
        try {
          const settings = await window.api.settings.get();
          
          // Load icons
          if (settings.navigationIcons) {
            setLeftIcon(settings.navigationIcons.left || null);
            setRightIcon(settings.navigationIcons.right || null);
          }
          
          // Load glass settings
          if (settings.navigationGlassEffect) {
            const leftGlass = settings.navigationGlassEffect.left;
            const rightGlass = settings.navigationGlassEffect.right;
            
            if (leftGlass) {
              setLeftGlassSettings(leftGlass);
            }
            if (rightGlass) {
              setRightGlassSettings(rightGlass);
            }
          }
        } catch (error) {
          console.warn('Failed to load navigation settings:', error);
        }
      }
    };
    loadSavedSettings();
  }, []);

  // Generate glass effect styles
  const getGlassStyles = (glassSettings) => {
    if (!glassSettings.enabled) return {};
    
    return {
      background: `rgba(255, 255, 255, ${glassSettings.opacity})`,
      backdropFilter: `blur(${glassSettings.blur}px)`,
      border: `1px solid rgba(255, 255, 255, ${glassSettings.borderOpacity})`,
      boxShadow: `
        0 8px 32px rgba(31, 38, 135, 0.37),
        inset 0 1px 0 rgba(255, 255, 255, ${glassSettings.shineOpacity})
      `,
    };
  };

  // Default icon components
  const DefaultLeftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path 
        d="M12 6 L8 10 L12 14" 
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const DefaultRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path 
        d="M8 6 L12 10 L8 14" 
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Icon renderer with fallback
  const renderIcon = (customIcon, DefaultIcon) => {
    if (customIcon) {
      return (
        <img 
          src={customIcon} 
          alt="navigation icon" 
          style={{ 
            width: 20, 
            height: 20,
            objectFit: 'contain'
          }}
          onError={(e) => {
            console.warn('Navigation icon failed to load, falling back to default:', customIcon);
            if (customIcon === leftIcon) {
              setLeftIcon(null);
            } else if (customIcon === rightIcon) {
              setRightIcon(null);
            }
          }}
        />
      );
    }
    return <DefaultIcon />;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't interfere with important system shortcuts
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      
      // Only handle navigation when not in a modal or input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (currentPage > 0) {
            prevPage();
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (currentPage < totalPages - 1) {
            nextPage();
          }
          break;
        case 'Home':
          event.preventDefault();
          goToPage(0);
          break;
        case 'End':
          event.preventDefault();
          goToPage(totalPages - 1);
          break;
        default:
          // Handle number keys (1-9) to jump to specific pages
          if (event.key >= '1' && event.key <= '9') {
            const pageIndex = parseInt(event.key) - 1;
            if (pageIndex < totalPages) {
              event.preventDefault();
              goToPage(pageIndex);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, goToPage, currentPage, totalPages]);

  // Auto-finish animation after transition duration
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        finishAnimation();
      }, 500); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isAnimating, finishAnimation]);

  // Don't show navigation if there's only one page or if in simple mode
  if (totalPages <= 1 || mode === 'simple') {
    return null;
  }

  const canGoLeft = currentPage > 0;
  const canGoRight = currentPage < totalPages - 1;

  return (
    <>
      {/* Left Navigation Button */}
      {showSideButtons && canGoLeft && (
                 <button
           className="wii-peek-button wii-peek-button-left"
           onClick={prevPage}
           disabled={isAnimating}
           title="Previous page (Left Arrow)"
         >
          <div 
            className="wii-button-surface"
            style={getGlassStyles(leftGlassSettings)}
          >
            <div className="wii-button-content">
              {renderIcon(leftIcon, DefaultLeftIcon)}
            </div>
          </div>
        </button>
      )}

      {/* Right Navigation Button */}
      {showSideButtons && canGoRight && (
                 <button
           className="wii-peek-button wii-peek-button-right"
           onClick={nextPage}
           disabled={isAnimating}
           title="Next page (Right Arrow)"
         >
          <div 
            className="wii-button-surface"
            style={getGlassStyles(rightGlassSettings)}
          >
            <div className="wii-button-content">
              {renderIcon(rightIcon, DefaultRightIcon)}
            </div>
          </div>
        </button>
      )}

      {/* Page Indicator - Wii-style minimal design */}
      {showPageIndicator && (
        <div 
          className={`wii-page-indicator wii-page-indicator-${position}`}
          style={{ 
            position: 'fixed',
            bottom: position === 'bottom' ? '180px' : '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '8px 16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Page Indicators - Minimal Design */}
          <div className="page-indicators" style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`page-indicator ${index === currentPage ? 'active' : ''}`}
                onClick={() => goToPage(index)}
                disabled={isAnimating}
                title={`Go to page ${index + 1}`}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  border: 'none',
                  background: index === currentPage ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
              >
              </button>
            ))}
          </div>
          
          {/* Page Counter */}
          <div 
            className="page-counter"
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
              fontWeight: '500',
              marginLeft: '8px',
              fontFamily: "'Orbitron', sans-serif"
            }}
          >
            {currentPage + 1} / {totalPages}
          </div>
        </div>
      )}
    </>
  );
};

WiiPageNavigation.propTypes = {
  position: PropTypes.oneOf(['top', 'bottom']),
  showSideButtons: PropTypes.bool,
  showPageIndicator: PropTypes.bool,
  glassEffect: PropTypes.bool
};

export default WiiPageNavigation;
