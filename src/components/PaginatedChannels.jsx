import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import Channel from './Channel';
import useChannelStore from '../utils/useChannelStore';
import useIdleChannelAnimations from '../utils/useIdleChannelAnimations';
import usePageNavigationStore from '../utils/usePageNavigationStore';
import './PaginatedChannels.css';

const PaginatedChannels = React.memo(({
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
  // Use the navigation store
  const {
    currentPage,
    totalPages,
    isAnimating,
    animationDirection,
    getChannelIndexRange,
    getTotalChannelsCount,
    finishAnimation
  } = usePageNavigationStore();

  // Default grid settings (4 columns, 3 rows = 12 channels per page)
  const gridColumns = 4;
  const gridRows = 3;
  
  // Get channel data from Zustand store
  const { getChannelDataForComponents } = useChannelStore();
  const { mediaMap: storeMediaMap, appPathMap: storeAppPathMap, channelConfigs: storeChannelConfigs } = getChannelDataForComponents();
  
  // Use store data if available, fallback to props for backward compatibility
  const effectiveMediaMap = useMemo(() => 
    storeMediaMap && Object.keys(storeMediaMap).length > 0 ? storeMediaMap : mediaMap,
    [storeMediaMap, mediaMap]
  );
  const effectiveAppPathMap = useMemo(() => 
    storeAppPathMap && Object.keys(storeAppPathMap).length > 0 ? storeAppPathMap : appPathMap,
    [storeAppPathMap, appPathMap]
  );
  const effectiveChannelConfigs = useMemo(() => 
    storeChannelConfigs && Object.keys(storeChannelConfigs).length > 0 ? storeChannelConfigs : channelConfigs,
    [storeChannelConfigs, channelConfigs]
  );

  // Calculate total channels needed
  const totalChannelsCount = useMemo(() => getTotalChannelsCount(), [getTotalChannelsCount]);

  // Generate all channels for all pages
  const allPagesChannels = useMemo(() => {
    const totalChannels = totalChannelsCount;
    const channels = [];
    
    for (let i = 0; i < totalChannels; i++) {
      const channelId = `channel-${i}`;
      const config = effectiveChannelConfigs ? effectiveChannelConfigs[channelId] : null;
      const isConfigured = config && (config.media || config.path);
      
      channels.push({
        id: channelId,
        index: i,
        empty: !isConfigured,
        media: effectiveMediaMap ? effectiveMediaMap[channelId] : null,
        path: effectiveAppPathMap ? effectiveAppPathMap[channelId] : null,
        type: config?.type,
        title: config?.title,
        hoverSound: config?.hoverSound,
        asAdmin: config?.asAdmin,
        ...(config || {})
      });
    }
    
    return channels;
  }, [totalChannelsCount, effectiveChannelConfigs, effectiveMediaMap, effectiveAppPathMap]);

  // Idle animation system
  const idleAnimationParams = useMemo(() => ({
    enabled: idleAnimationEnabled,
    types: idleAnimationTypes,
    interval: idleAnimationInterval,
    channels: allPagesChannels
  }), [idleAnimationEnabled, idleAnimationTypes, idleAnimationInterval, allPagesChannels]);

  const { getChannelAnimationClass, isChannelAnimating } = useIdleChannelAnimations(
    idleAnimationParams.enabled,
    idleAnimationParams.types,
    idleAnimationParams.interval,
    idleAnimationParams.channels
  );

  // Load settings when component mounts
  useEffect(() => {
    if (window.settings?.homescreen) {
      // The loadSettings function was removed from the navigation store,
      // so this part of the logic needs to be re-evaluated or removed
      // if loadSettings is no longer available.
      // For now, keeping it as is, but it might cause an error.
      // loadSettings(window.settings);
    }
  }, []); // Removed loadSettings from dependency array

  // Handle animation completion
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        finishAnimation();
      }, 500); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isAnimating, finishAnimation]);

  // Calculate the transform offset for simple mode
  const getTransformOffset = useCallback(() => {
    return -currentPage * 33.333; // Each page is 33.333% wide
  }, [currentPage]);

  // Create pages based on current mode
  const pages = useMemo(() => {
    const pages = [];
    const channelsPerPage = gridColumns * gridRows;

    // Simple mode: Create separate pages
    for (let i = 0; i < totalPages; i++) {
      const pageIndex = i;
      const { startIndex, endIndex } = getChannelIndexRange(pageIndex);
      const pageChannels = allPagesChannels.slice(startIndex, endIndex + 1);

      pages.push({
        key: `page-${pageIndex}`,
        pageIndex,
        channels: pageChannels,
        transform: 'translateX(0%)',
        isVisible: true
      });
    }

    return pages;
  }, [totalPages, gridColumns, gridRows, allPagesChannels, getChannelIndexRange]);

  // CSS Grid styles
  const gridStyles = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
    gridTemplateRows: `repeat(${gridRows}, 1fr)`,
    gap: '20px',
    width: '100%',
    height: '100%',
    padding: '20px'
  }), [gridColumns, gridRows]);

  // Memoize Channel component props to prevent unnecessary re-renders
  const channelProps = useMemo(() => ({
    onMediaChange,
    onAppPathChange,
    onChannelSave,
    animatedOnHover,
    adaptiveEmptyChannels,
    kenBurnsEnabled,
    kenBurnsMode,
    onHover: onChannelHover
  }), [onMediaChange, onAppPathChange, onChannelSave, animatedOnHover, adaptiveEmptyChannels, kenBurnsEnabled, kenBurnsMode, onChannelHover]);

  // Memoize the transform style to prevent unnecessary recalculations
  const containerTransform = useMemo(() => ({
    transform: `translateX(${getTransformOffset()}%)`,
    transition: isAnimating ? 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none'
  }), [getTransformOffset, isAnimating]);

  return (
    <div className="paginated-channels">
      <div
        className={`pages-container ${isAnimating ? 'animating' : ''} ${animationDirection !== 'none' ? `slide-${animationDirection}` : ''} simple`}
        style={containerTransform}
      >
        {/* Render pages */}
        {pages.map(({ key, pageIndex, channels, transform, isVisible }) => (
          <div
            key={key}
            className="channels-page"
            style={{
              transform: transform,
              display: isVisible ? 'block' : 'none'
            }}
          >
            <div className="channels-grid" style={gridStyles}>
              {channels.map((channel) => (
                <Channel
                  key={channel.id}
                  {...channel}
                  {...channelProps}
                  channelConfig={effectiveChannelConfigs ? effectiveChannelConfigs[channel.id] : null}
                  animationStyle={channel.animationStyle}
                  idleAnimationClass={getChannelAnimationClass(channel.id)}
                  isIdleAnimating={isChannelAnimating(channel.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

PaginatedChannels.propTypes = {
  allChannels: PropTypes.array,
  channelConfigs: PropTypes.object.isRequired,
  mediaMap: PropTypes.object.isRequired,
  appPathMap: PropTypes.object.isRequired,
  animatedOnHover: PropTypes.bool,
  adaptiveEmptyChannels: PropTypes.bool,
  kenBurnsEnabled: PropTypes.bool,
  kenBurnsMode: PropTypes.string,
  idleAnimationEnabled: PropTypes.bool,
  idleAnimationTypes: PropTypes.array,
  idleAnimationInterval: PropTypes.number,
  onMediaChange: PropTypes.func.isRequired,
  onAppPathChange: PropTypes.func.isRequired,
  onChannelSave: PropTypes.func.isRequired,
  onChannelHover: PropTypes.func,
};

export default PaginatedChannels;
