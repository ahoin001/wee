import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Channel from './Channel';
import PageNavigation from './PageNavigation';
import SlideNavigation from './SlideNavigation';
import useChannelOperations from '../utils/useChannelOperations';
import useIdleChannelAnimations from '../utils/useIdleChannelAnimations';
import './PaginatedChannels.css';

const PaginatedChannels = React.memo(({
  // Legacy props for backward compatibility
  allChannels,
  channelConfigs,
  mediaMap,
  appPathMap,
  animatedOnHover,
  adaptiveEmptyChannels,
  kenBurnsEnabled,
  kenBurnsMode,
  idleAnimationEnabled,
  idleAnimationTypes,
  idleAnimationInterval,
  onMediaChange,
  onAppPathChange,
  onChannelSave,
  onChannelHover
}) => {
  // ✅ DATA LAYER: Use the new channel operations hook
  const {
    gridConfig,
    navigation,
    channelSettings,
    getCurrentPageChannels,
    getChannelConfig,
    isChannelEmpty,
    nextPage,
    prevPage,
    finishAnimation,
    updateChannelConfig,
    updateChannelMedia,
    updateChannelPath
  } = useChannelOperations();

  // Get current page channels
  const currentPageChannels = useMemo(() => {
    return getCurrentPageChannels();
  }, [getCurrentPageChannels]);

  // ✅ DATA LAYER: Use settings from consolidated store with fallbacks
  const effectiveSettings = useMemo(() => ({
    animatedOnHover: channelSettings.animatedOnHover || animatedOnHover || false,
    adaptiveEmptyChannels: channelSettings.adaptiveEmptyChannels || adaptiveEmptyChannels || true,
    kenBurnsEnabled: channelSettings.kenBurnsEnabled || kenBurnsEnabled || false,
    kenBurnsMode: channelSettings.kenBurnsMode || kenBurnsMode || 'hover',
    idleAnimationEnabled: channelSettings.idleAnimationEnabled || idleAnimationEnabled || false,
    idleAnimationTypes: channelSettings.idleAnimationTypes || idleAnimationTypes || ['pulse', 'bounce', 'glow'],
    idleAnimationInterval: channelSettings.idleAnimationInterval || idleAnimationInterval || 8,
    autoFadeTimeout: channelSettings.channelAutoFadeTimeout ?? 5
  }), [
    channelSettings,
    animatedOnHover,
    adaptiveEmptyChannels,
    kenBurnsEnabled,
    kenBurnsMode,
    idleAnimationEnabled,
    idleAnimationTypes,
    idleAnimationInterval
  ]);

  // Grid-level auto-fade functionality
  const [isGridFaded, setIsGridFaded] = useState(false);
  const gridFadeTimeoutRef = useRef(null);
  const autoFadeTimeout = effectiveSettings.autoFadeTimeout;

  // Handle grid hover events
  const handleGridMouseEnter = useCallback(() => {
    // Clear auto-fade timeout and restore opacity
    if (gridFadeTimeoutRef.current) {
      clearTimeout(gridFadeTimeoutRef.current);
      gridFadeTimeoutRef.current = null;
    }
    setIsGridFaded(false);
  }, []);

  const handleGridMouseLeave = useCallback(() => {
    // Start auto-fade timeout if enabled
    if (autoFadeTimeout > 0) {
      gridFadeTimeoutRef.current = setTimeout(() => {
        setIsGridFaded(true);
      }, autoFadeTimeout * 1000);
    }
  }, [autoFadeTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gridFadeTimeoutRef.current) {
        clearTimeout(gridFadeTimeoutRef.current);
      }
    };
  }, []);



  // Channel event handlers
  const handleChannelMediaChange = useCallback((channelId, media) => {
    // Update media in the store
    updateChannelMedia(channelId, media);
    
    // Call the parent handler if provided
    if (onMediaChange) {
      onMediaChange(channelId, media);
    }
  }, [updateChannelMedia, onMediaChange]);

  const handleChannelAppPathChange = useCallback((channelId, path) => {
    // Update path in the store
    updateChannelPath(channelId, path);
    
    // Call the parent handler if provided
    if (onAppPathChange) {
      onAppPathChange(channelId, path);
    }
  }, [updateChannelPath, onAppPathChange]);

  const handleChannelSave = useCallback((channelId, config) => {
    // Update channel config in the store
    updateChannelConfig(channelId, config);
    
    // Call the parent handler if provided
    if (onChannelSave) {
      onChannelSave(channelId, config);
    }
  }, [updateChannelConfig, onChannelSave]);

  const handleChannelHover = useCallback((channelId, isHovered) => {
    // Call the parent handler if provided
    if (onChannelHover) {
      onChannelHover(channelId, isHovered);
    }
  }, [onChannelHover]);

  // Navigation handlers
  const handleNextPage = useCallback(() => {
    nextPage();
  }, [nextPage]);

  const handlePrevPage = useCallback(() => {
    prevPage();
  }, [prevPage]);

  // Animation completion handler
  const handleAnimationComplete = useCallback(() => {
    finishAnimation();
  }, [finishAnimation]);

  // ✅ DATA LAYER: Use idle animations from consolidated store
  const idleAnimationProps = useMemo(() => ({
    enabled: effectiveSettings.idleAnimationEnabled,
    types: effectiveSettings.idleAnimationTypes,
    interval: effectiveSettings.idleAnimationInterval
  }), [effectiveSettings]);

  // Use idle channel animations hook
  const { getChannelAnimationClass, isChannelAnimating } = useIdleChannelAnimations(
    idleAnimationProps.enabled,
    idleAnimationProps.types,
    idleAnimationProps.interval,
    currentPageChannels
  );

  // Render individual page for Simple Mode
  const renderPage = useCallback((pageIndex) => {
    const { columns, rows, channelsPerPage } = gridConfig;
    const startIndex = pageIndex * channelsPerPage;
    const endIndex = Math.min(startIndex + channelsPerPage - 1, gridConfig.totalChannels - 1);

    return (
      <div
        key={`page-${pageIndex}`}
        className={`channel-page${isGridFaded ? ' auto-fade' : ''}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(180px, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(110px, 1fr))`,
          gap: 'clamp(10px, 2vw, 20px)',
          padding: 'clamp(10px, 2vw, 20px)',
          height: '100%',
          width: '100%',
          minHeight: '0',
          minWidth: '0',
          boxSizing: 'border-box',
          alignContent: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={handleGridMouseEnter}
        onMouseLeave={handleGridMouseLeave}
      >
        {Array.from({ length: channelsPerPage }, (_, index) => {
          const channelIndex = startIndex + index;
          if (channelIndex > endIndex) return null;
          
          const channelId = `channel-${channelIndex}`;
          const channelConfig = getChannelConfig(channelId);
          const isEmpty = isChannelEmpty(channelId);

          return (
            <Channel
              key={channelId}
              id={channelId}
              type={channelConfig?.type || 'empty'}
              path={channelConfig?.path || null}
              icon={channelConfig?.icon || null}
              empty={isEmpty}
              media={channelConfig?.media || null}
              onMediaChange={handleChannelMediaChange}
              onAppPathChange={handleChannelAppPathChange}
              onChannelSave={handleChannelSave}
              onHover={handleChannelHover}
              channelConfig={channelConfig || { empty: true }}
              idleAnimationClass={
                idleAnimationProps.enabled 
                  ? getChannelAnimationClass(channelId)
                  : ''
              }
              isIdleAnimating={idleAnimationProps.enabled}
            />
          );
        })}
      </div>
    );
  }, [
    gridConfig,
    effectiveSettings,
    idleAnimationProps,
    getChannelAnimationClass,
    handleChannelMediaChange,
    handleChannelAppPathChange,
    handleChannelSave,
    handleChannelHover,
    getChannelConfig,
    isChannelEmpty,
    isGridFaded,
    handleGridMouseEnter,
    handleGridMouseLeave
  ]);

  // Render Wii Mode continuous grid
  const renderWiiModeGrid = useCallback(() => {
    const { columns, rows } = gridConfig;
    const { currentPage, isAnimating } = navigation;
    
    // Calculate the slide transform for Wii Mode
    // Each page should show a different section of the grid
    // Since the grid is 300% wide, we need to move by 100% for each page
    const slideTransform = `translateX(-${currentPage * 100}%)`;

    return (
      <div 
        className={`wii-mode-grid${isGridFaded ? ' auto-fade' : ''}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns * 3}, minmax(180px, 1fr))`, // 3 pages wide
          gridTemplateRows: `repeat(${rows}, minmax(110px, 1fr))`,
          gap: 'clamp(10px, 2vw, 20px)',
          padding: 'clamp(10px, 2vw, 20px)',
          height: '100%',
          width: '300%', // 3x width to accommodate all pages
          minHeight: '0',
          minWidth: '0',
          boxSizing: 'border-box',
          alignContent: 'center',
          justifyContent: 'center',
          transform: slideTransform,
          transition: isAnimating ? 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
          willChange: 'transform'
        }}
        onMouseEnter={handleGridMouseEnter}
        onMouseLeave={handleGridMouseLeave}
      >
        {Array.from({ length: gridConfig.totalChannels }, (_, index) => {
          const channelId = `channel-${index}`;
          const channelConfig = getChannelConfig(channelId);
          const isEmpty = isChannelEmpty(channelId);
          
          return (
            <Channel
              key={channelId}
              id={channelId}
              type={channelConfig?.type || 'empty'}
              path={channelConfig?.path || null}
              icon={channelConfig?.icon || null}
              empty={isEmpty}
              media={channelConfig?.media || null}
              onMediaChange={handleChannelMediaChange}
              onAppPathChange={handleChannelAppPathChange}
              onChannelSave={handleChannelSave}
              onHover={handleChannelHover}
              channelConfig={channelConfig || { empty: true }}
              idleAnimationClass={
                idleAnimationProps.enabled 
                  ? getChannelAnimationClass(channelId)
                  : ''
              }
              isIdleAnimating={idleAnimationProps.enabled}
            />
          );
        })}
      </div>
    );
  }, [
    gridConfig,
    navigation,
    effectiveSettings,
    idleAnimationProps,
    getChannelAnimationClass,
    handleChannelMediaChange,
    handleChannelAppPathChange,
    handleChannelSave,
    handleChannelHover,
    getChannelConfig,
    isChannelEmpty,
    isGridFaded,
    handleGridMouseEnter,
    handleGridMouseLeave
  ]);

  // Render content based on mode
  const renderContent = useMemo(() => {
    const { mode } = navigation;
    
    if (mode === 'simple') {
      // Simple Mode: Use SlideNavigation with separate pages
      return (
        <SlideNavigation>
          {Array.from({ length: navigation.totalPages }, (_, pageIndex) => 
            renderPage(pageIndex)
          )}
        </SlideNavigation>
      );
    } else {
      // Wii Mode: Use continuous grid with horizontal sliding
      return (
        <div className="wii-mode-container">
          {renderWiiModeGrid()}
        </div>
      );
    }
  }, [navigation.mode, navigation.totalPages, renderPage, renderWiiModeGrid]);

    // Render navigation
  const renderNavigation = useMemo(() => {
    return (
      <PageNavigation
        position="bottom"
        showPageIndicator={true}
      />
    );
  }, []);

  // Log component state for debugging
  useEffect(() => {
    // console.log('[DEBUG] 📺 [PaginatedChannels] Component state:', {
    //   gridConfig,
    //   navigation,
    //   currentPageChannels: currentPageChannels.length,
    //   effectiveSettings
    // });
  }, [gridConfig, navigation, currentPageChannels.length, effectiveSettings]);

  return (
    <div className="paginated-channels-container">
      <div className="channels-content">
        {renderContent}
      </div>
      
      {/* Animation completion listener */}
      {navigation.isAnimating && (
        <div 
          className="animation-listener"
          onAnimationEnd={handleAnimationComplete}
          onTransitionEnd={handleAnimationComplete}
        />
      )}
    </div>
  );
});

PaginatedChannels.propTypes = {
  // Legacy props for backward compatibility
  allChannels: PropTypes.array,
  channelConfigs: PropTypes.object,
  mediaMap: PropTypes.object,
  appPathMap: PropTypes.object,
  animatedOnHover: PropTypes.bool,
  adaptiveEmptyChannels: PropTypes.bool,
  kenBurnsEnabled: PropTypes.bool,
  kenBurnsMode: PropTypes.string,
  idleAnimationEnabled: PropTypes.bool,
  idleAnimationTypes: PropTypes.array,
  idleAnimationInterval: PropTypes.number,
  onMediaChange: PropTypes.func,
  onAppPathChange: PropTypes.func,
  onChannelSave: PropTypes.func,
  onChannelHover: PropTypes.func
};

export default PaginatedChannels;
