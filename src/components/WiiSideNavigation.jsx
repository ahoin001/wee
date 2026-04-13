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
  const spotifyEnabled = useConsolidatedAppStore(state => state.ui.spotifyMatchEnabled);

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



  // Handle right-click to open modal
  const handleContextMenu = (event, side) => {
    event.preventDefault();
    // Open navigation settings via unified app event flow.
    window.dispatchEvent(new CustomEvent('openNavigationSettings', {
      detail: { side }
    }));
  };

  // Helper function to convert RGB to RGBA
  const rgbToRgba = (rgbString, alpha = 1) => {
    if (!rgbString || !rgbString.startsWith('rgb(')) return rgbString;
    return rgbString.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  };

  // Generate glass effect styles with enhanced Spotify color strategy
  const getGlassStyleVars = (glassSettings) => {
    if (!glassSettings.enabled) return {};
    
    let background = `rgba(255, 255, 255, ${glassSettings.opacity})`;
    let border = `rgba(255, 255, 255, ${glassSettings.borderOpacity})`;
    let glow = `rgba(31, 38, 135, 0.37)`;
    
    if (spotifyEnabled && navigationSpotifyIntegration && spotifyColors) {
      const primaryColor = spotifyColors.primary;
      const secondaryColor = spotifyColors.secondary;
      const accentColor = spotifyColors.accent;
      
      if (primaryColor && secondaryColor && accentColor) {
        background = rgbToRgba(primaryColor, glassSettings.opacity);
        border = rgbToRgba(secondaryColor, glassSettings.borderOpacity);
        glow = rgbToRgba(accentColor, 0.37);
      }
    }
    
    return {
      '--side-nav-surface-bg': `linear-gradient(145deg, ${background} 0%, ${background} 100%)`,
      '--side-nav-surface-border': border,
      '--side-nav-surface-border-hover': border,
      '--side-nav-shadow': `0 6px 20px ${glow}`,
      '--side-nav-shadow-hover': `0 8px 25px ${glow}`,
      '--side-nav-shadow-active': `0 4px 15px ${glow}`,
      '--nav-glass-blur': `${glassSettings.blur}px`,
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
            filter: spotifyEnabled && navigationSpotifyIntegration && spotifyColors?.text ? 'brightness(0) saturate(100%) invert(1)' : 'none'
          }}
          className="wii-side-nav-icon"
          onError={(e) => {
            console.warn('Navigation icon failed to load, falling back to default:', customIcon);
            if (e?.currentTarget) e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    return <span style={{ color: textColor }}><DefaultIcon /></span>;
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
          className="wii-side-nav-button wii-side-nav-button-left"
          onClick={async () => {
            await playChannelClickSound();
            prevPage();
          }}
          onContextMenu={(e) => handleContextMenu(e, 'left')}
          disabled={isAnimating}
          title="Previous page (Right-click to customize)"
        >
          <div 
            className="wii-side-nav-surface"
            style={getGlassStyleVars(leftGlassSettings)}
          >
            <div className="wii-side-nav-content">
              {renderIcon(leftIcon, DefaultLeftIcon, 'left')}
            </div>
          </div>
        </button>
      )}

      {/* Right Navigation Button */}
      {canGoRight && (
        <button
          className="wii-side-nav-button wii-side-nav-button-right"
          onClick={async () => {
            await playChannelClickSound();
            nextPage();
          }}
          onContextMenu={(e) => handleContextMenu(e, 'right')}
          disabled={isAnimating}
          title="Next page (Right-click to customize)"
        >
          <div 
            className="wii-side-nav-surface"
            style={getGlassStyleVars(rightGlassSettings)}
          >
            <div className="wii-side-nav-content">
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
