import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import usePageNavigationStore from '../utils/usePageNavigationStore';
import useNavigationModalStore from '../utils/useNavigationModalStore';
import './WiiSideNavigation.css';

const WiiSideNavigation = () => {
  const {
    currentPage,
    totalPages,
    isAnimating,
    goToNextPage,
    goToPreviousPage,
    finishAnimation
  } = usePageNavigationStore();

  // Icon state management
  const [leftIcon, setLeftIcon] = useState(null);
  const [rightIcon, setRightIcon] = useState(null);
  
  // Modal state from Zustand
  const { openModal } = useNavigationModalStore();

  // Load saved icons on component mount
  useEffect(() => {
    const loadSavedIcons = async () => {
      if (window.api?.settings?.get) {
        try {
          const settings = await window.api.settings.get();
          if (settings.navigationIcons) {
            setLeftIcon(settings.navigationIcons.left || null);
            setRightIcon(settings.navigationIcons.right || null);
          }
        } catch (error) {
          console.warn('Failed to load navigation icons:', error);
        }
      }
    };
    loadSavedIcons();

    // Listen for icon changes from the modal
    const handleIconChange = (event) => {
      const { side, iconUrl } = event.detail;
      if (side === 'left') {
        setLeftIcon(iconUrl);
      } else if (side === 'right') {
        setRightIcon(iconUrl);
      }
    };

    window.addEventListener('navigationIconChanged', handleIconChange);
    
    return () => {
      window.removeEventListener('navigationIconChanged', handleIconChange);
    };
  }, []);



  // Handle right-click to open modal
  const handleContextMenu = (event, side) => {
    event.preventDefault();
    const currentIcon = side === 'left' ? leftIcon : rightIcon;
    openModal(side, currentIcon);
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle navigation when not in a modal or input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (currentPage > 0) {
            goToPreviousPage();
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (currentPage < totalPages - 1) {
            goToNextPage();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPreviousPage, currentPage, totalPages]);

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
          onClick={goToPreviousPage}
          onContextMenu={(e) => handleContextMenu(e, 'left')}
          disabled={isAnimating}
          title="Previous page (Right-click to customize)"
        >
          <div className="wii-button-surface">
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
          onClick={goToNextPage}
          onContextMenu={(e) => handleContextMenu(e, 'right')}
          disabled={isAnimating}
          title="Next page (Right-click to customize)"
        >
          <div className="wii-button-surface">
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
