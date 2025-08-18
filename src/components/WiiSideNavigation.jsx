import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useChannelOperations from '../utils/useChannelOperations';
import './WiiSideNavigation.css';

const WiiSideNavigation = () => {
  const {
    navigation,
    nextPage,
    prevPage,
    finishAnimation
  } = useChannelOperations();
  
  const { currentPage, totalPages, isAnimating, mode } = navigation;

  // Icon state management
  const [leftIcon, setLeftIcon] = useState(null);
  const [rightIcon, setRightIcon] = useState(null);
  
  // Glass effect state management
  const [leftGlassSettings, setLeftGlassSettings] = useState({
    enabled: false,
    opacity: 0.18,
    blur: 2.5,
    borderOpacity: 0.5,
    shineOpacity: 0.7
  });
  const [rightGlassSettings, setRightGlassSettings] = useState({
    enabled: false,
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

    // Listen for settings changes from the modal
    const handleSettingsChange = (event) => {
      const { side, iconUrl, glassSettings } = event.detail;
      if (side === 'left') {
        setLeftIcon(iconUrl);
        if (glassSettings) {
          setLeftGlassSettings(glassSettings);
        }
      } else if (side === 'right') {
        setRightIcon(iconUrl);
        if (glassSettings) {
          setRightGlassSettings(glassSettings);
        }
      }
    };

    // Listen for glass effect preview changes
    const handleGlassPreview = (event) => {
      const { side, glassSettings } = event.detail;
      if (side === 'left') {
        setLeftGlassSettings(glassSettings);
      } else if (side === 'right') {
        setRightGlassSettings(glassSettings);
      }
    };

    window.addEventListener('navigationSettingsChanged', handleSettingsChange);
    window.addEventListener('navigationGlassPreview', handleGlassPreview);
    
    return () => {
      window.removeEventListener('navigationSettingsChanged', handleSettingsChange);
      window.removeEventListener('navigationGlassPreview', handleGlassPreview);
    };
  }, []);



  // Handle right-click to open modal (disabled for now)
  const handleContextMenu = (event, side) => {
    event.preventDefault();
    // TODO: Re-implement navigation modal functionality
    console.log('Navigation customization not yet implemented');
  };

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

  // Default icon component
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
            // Reset the custom icon if it fails to load
            // We need to identify which side this icon belongs to
            if (customIcon === leftIcon) {
              setLeftIcon(null);
              saveIconSettings('left', null);
            } else if (customIcon === rightIcon) {
              setRightIcon(null);
              saveIconSettings('right', null);
            }
          }}
        />
      );
    }
    return <DefaultIcon />;
  };

  // Keyboard and mouse navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't interfere with important system shortcuts like Ctrl+Shift+I
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
        default:
          break;
      }
    };

    const handleMouseDown = (event) => {
      // Handle mouse side buttons (browser back/forward)
      if (event.button === 3) { // Browser back button
        event.preventDefault();
        if (currentPage > 0) {
          prevPage();
        }
      } else if (event.button === 4) { // Browser forward button
        event.preventDefault();
        if (currentPage < totalPages - 1) {
          nextPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [nextPage, prevPage, currentPage, totalPages]);

  // Auto-finish animation after transition duration
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        finishAnimation();
      }, 500); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isAnimating, finishAnimation]);

  // Don't show navigation if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  const canGoLeft = currentPage > 0;
  const canGoRight = currentPage < totalPages - 1;

  return (
    <>
      {/* Left Navigation Button */}
      {canGoLeft && (
        <button
          className="wii-peek-button wii-peek-button-left"
          onClick={prevPage}
          onContextMenu={(e) => handleContextMenu(e, 'left')}
          disabled={isAnimating}
          title="Previous page (Right-click to customize)"
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
      {canGoRight && (
        <button
          className="wii-peek-button wii-peek-button-right"
          onClick={nextPage}
          onContextMenu={(e) => handleContextMenu(e, 'right')}
          disabled={isAnimating}
          title="Next page (Right-click to customize)"
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


    </>
  );
};

WiiSideNavigation.propTypes = {};

export default WiiSideNavigation;
