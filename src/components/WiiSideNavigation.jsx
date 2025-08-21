import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useChannelOperations from '../utils/useChannelOperations';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import useSoundManager from '../utils/useSoundManager';
import './WiiSideNavigation.css';

const WiiSideNavigation = () => {
  const {
    navigation,
    nextPage,
    prevPage,
    finishAnimation
  } = useChannelOperations();
  
  const { currentPage, totalPages, isAnimating, mode } = navigation;

  // Get Spotify colors from store
  const spotifyColors = useConsolidatedAppStore(state => state.spotify.extractedColors);
  const spotifyEnabled = useConsolidatedAppStore(state => state.spotify.dynamicColorMatching);

  // Get sound manager for click sounds
  const { playChannelClickSound } = useSoundManager();
  
  // Get navigation settings from store
  const navigationSettings = useConsolidatedAppStore(state => state.navigation);
  const leftIcon = navigationSettings.icons?.left || null;
  const rightIcon = navigationSettings.icons?.right || null;
  const leftGlassSettings = navigationSettings.glassEffect?.left || {
    enabled: false,
    opacity: 0.18,
    blur: 2.5,
    borderOpacity: 0.5,
    shineOpacity: 0.7
  };
  const rightGlassSettings = navigationSettings.glassEffect?.right || {
    enabled: false,
    opacity: 0.18,
    blur: 2.5,
    borderOpacity: 0.5,
    shineOpacity: 0.7
  };
  const navigationSpotifyIntegration = navigationSettings.spotifyIntegration || false;

  // Note: Settings are now managed through the consolidated store
  // No need for local state management or event listeners



  // Save icon settings
  const saveIconSettings = async (side, iconUrl) => {
    if (window.api?.settings?.set) {
      try {
        const currentSettings = await window.api.settings.get();
        const navigationIcons = currentSettings.navigationIcons || {};
        
        if (side === 'left') {
          navigationIcons.left = iconUrl;
        } else if (side === 'right') {
          navigationIcons.right = iconUrl;
        }
        
        await window.api.settings.set({
          ...currentSettings,
          navigationIcons
        });
      } catch (error) {
        console.warn('Failed to save navigation icon settings:', error);
      }
    }
  };

  // Handle right-click to open modal
  const handleContextMenu = (event, side) => {
    event.preventDefault();
    // Open the navigation settings tab in the main settings modal
    if (window.api?.settings?.openSettingsModal) {
      window.api.settings.openSettingsModal('navigation');
    } else {
      // Fallback: dispatch a custom event that the main app can listen to
      window.dispatchEvent(new CustomEvent('openNavigationSettings', {
        detail: { side }
      }));
    }
  };

  // Helper function to convert RGB to RGBA
  const rgbToRgba = (rgbString, alpha = 1) => {
    if (!rgbString || !rgbString.startsWith('rgb(')) return rgbString;
    return rgbString.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  };

  // Generate glass effect styles with enhanced Spotify color strategy
  const getGlassStyles = (glassSettings, side = 'left') => {
    if (!glassSettings.enabled) return {};
    
    // Use enhanced Spotify color strategy if enabled and available
    let background, border, boxShadow;
    
    if (spotifyEnabled && navigationSpotifyIntegration && spotifyColors) {
      // Enhanced color strategy: Primary for backgrounds, Secondary for borders, Accent for highlights
      const primaryColor = spotifyColors.primary;
      const secondaryColor = spotifyColors.secondary;
      const accentColor = spotifyColors.accent;
      
      if (primaryColor && secondaryColor && accentColor) {
        background = rgbToRgba(primaryColor, glassSettings.opacity);
        border = `1px solid ${rgbToRgba(secondaryColor, glassSettings.borderOpacity)}`;
        boxShadow = `
          0 8px 32px ${rgbToRgba(accentColor, 0.37)},
          inset 0 1px 0 ${rgbToRgba(accentColor, glassSettings.shineOpacity)}
        `;
      } else {
        // Fallback to white if Spotify colors not available
        background = `rgba(255, 255, 255, ${glassSettings.opacity})`;
        border = `1px solid rgba(255, 255, 255, ${glassSettings.borderOpacity})`;
        boxShadow = `
          0 8px 32px rgba(31, 38, 135, 0.37),
          inset 0 1px 0 rgba(255, 255, 255, ${glassSettings.shineOpacity})
        `;
      }
    } else {
      // Default white glass effect
      background = `rgba(255, 255, 255, ${glassSettings.opacity})`;
      border = `1px solid rgba(255, 255, 255, ${glassSettings.borderOpacity})`;
      boxShadow = `
        0 8px 32px rgba(31, 38, 135, 0.37),
        inset 0 1px 0 rgba(255, 255, 255, ${glassSettings.shineOpacity})
      `;
    }
    
    return {
      background,
      backdropFilter: `blur(${glassSettings.blur}px)`,
      border,
      boxShadow,
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
  const renderIcon = (customIcon, DefaultIcon, side = 'left') => {
    // Apply Spotify text color if enabled
    const textColor = spotifyEnabled && navigationSpotifyIntegration && spotifyColors?.text ? spotifyColors.text : 'currentColor';
    
    if (customIcon) {
      return (
        <img 
          src={customIcon} 
          alt="navigation icon" 
          style={{ 
            width: 20, 
            height: 20,
            objectFit: 'contain',
            filter: spotifyEnabled && navigationSpotifyIntegration && spotifyColors?.text ? 'brightness(0) saturate(100%) invert(1)' : 'none'
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
    return <DefaultIcon style={{ color: textColor }} />;
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
          onClick={async () => {
            await playChannelClickSound();
            prevPage();
          }}
          onContextMenu={(e) => handleContextMenu(e, 'left')}
          disabled={isAnimating}
          title="Previous page (Right-click to customize)"
        >
          <div 
            className="wii-button-surface"
            style={getGlassStyles(leftGlassSettings, 'left')}
          >
            <div className="wii-button-content">
              {renderIcon(leftIcon, DefaultLeftIcon, 'left')}
            </div>
          </div>
        </button>
      )}

      {/* Right Navigation Button */}
      {canGoRight && (
        <button
          className="wii-peek-button wii-peek-button-right"
          onClick={async () => {
            await playChannelClickSound();
            nextPage();
          }}
          onContextMenu={(e) => handleContextMenu(e, 'right')}
          disabled={isAnimating}
          title="Next page (Right-click to customize)"
        >
          <div 
            className="wii-button-surface"
            style={getGlassStyles(rightGlassSettings, 'right')}
          >
            <div className="wii-button-content">
              {renderIcon(rightIcon, DefaultRightIcon, 'right')}
            </div>
          </div>
        </button>
      )}


    </>
  );
};

WiiSideNavigation.propTypes = {};

export default WiiSideNavigation;
