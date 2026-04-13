import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import useChannelOperations from '../utils/useChannelOperations';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
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

  const navigationSettings = useConsolidatedAppStore((state) => state.navigation);
  const leftIcon = navigationSettings.icons?.left || null;
  const rightIcon = navigationSettings.icons?.right || null;
  const leftGlassSettings = navigationSettings.glassEffect?.left || {
    enabled: glassEffect,
    opacity: 0.18,
    blur: 2.5,
    borderOpacity: 0.5,
    shineOpacity: 0.7,
  };
  const rightGlassSettings = navigationSettings.glassEffect?.right || {
    enabled: glassEffect,
    opacity: 0.18,
    blur: 2.5,
    borderOpacity: 0.5,
    shineOpacity: 0.7,
  };

  // Generate glass effect styles
  const getGlassStyleVars = (glassSettings) => {
    if (!glassSettings.enabled) return {};
    
    return {
      '--wii-nav-glass-opacity': glassSettings.opacity,
      '--wii-nav-glass-blur': `${glassSettings.blur}px`,
      '--wii-nav-glass-border-opacity': glassSettings.borderOpacity,
      '--wii-nav-glass-shine-opacity': glassSettings.shineOpacity,
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
          className="wii-nav-icon-image"
          onError={(e) => {
            console.warn('Navigation icon failed to load, falling back to default:', customIcon);
            if (e?.currentTarget) e.currentTarget.style.display = 'none';
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
            style={getGlassStyleVars(leftGlassSettings)}
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
            style={getGlassStyleVars(rightGlassSettings)}
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
        >
          {/* Page Indicators - Minimal Design */}
          <div className="wii-page-dots">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`wii-page-dot ${index === currentPage ? 'active' : ''}`}
                onClick={() => goToPage(index)}
                disabled={isAnimating}
                title={`Go to page ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Page Counter */}
          <div className="page-counter">
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
