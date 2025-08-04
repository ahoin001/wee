import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import Channel from './Channel';
import useChannelStore from '../utils/useChannelStore';
import useIdleChannelAnimations from '../utils/useIdleChannelAnimations';
import usePageNavigationStore from '../utils/usePageNavigationStore';
import './PaginatedChannels.css';

const PaginatedChannels = ({
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
  // Debug flag - set to true only when debugging is needed
  const DEBUG = false;
  
  // Use Zustand store for page navigation instead of local state
  const {
    currentPage,
    totalPages,
    isAnimating,
    animationDirection,
    setCurrentPage,
    setTotalPages,
    setIsAnimating,
    setAnimationDirection,
    finishAnimation
  } = usePageNavigationStore();
  
  // Get channel data from Zustand store
  const { getChannelDataForComponents, getHighestConfiguredIndex } = useChannelStore();
  const { mediaMap: storeMediaMap, appPathMap: storeAppPathMap, channelConfigs: storeChannelConfigs } = getChannelDataForComponents();
  
  // Use store data if available, fallback to props for backward compatibility
  const effectiveMediaMap = storeMediaMap && Object.keys(storeMediaMap).length > 0 ? storeMediaMap : mediaMap;
  const effectiveAppPathMap = storeAppPathMap && Object.keys(storeAppPathMap).length > 0 ? storeAppPathMap : appPathMap;
  const effectiveChannelConfigs = storeChannelConfigs && Object.keys(storeChannelConfigs).length > 0 ? storeChannelConfigs : channelConfigs;

  // Calculate total channels needed first
  const getTotalChannelsCount = useMemo(() => {
    // Find the highest configured channel index
    let highestIndex = -1;
    
    if (effectiveChannelConfigs) {
      Object.keys(effectiveChannelConfigs).forEach(channelId => {
        const match = channelId.match(/channel-(\d+)/);
        if (match) {
          const index = parseInt(match[1]);
          if (effectiveChannelConfigs[channelId] && (effectiveChannelConfigs[channelId].media || effectiveChannelConfigs[channelId].path)) {
            highestIndex = Math.max(highestIndex, index);
          }
        }
      });
    }
    
    // Ensure we have at least 3 pages worth of channels (36 channels) to start with
    const minChannels = 12 * 3; // At least 3 pages
    const neededForConfigured = highestIndex >= 0 ? highestIndex + 1 : 0;
    const result = Math.max(minChannels, neededForConfigured);
    
    return result;
  }, [effectiveChannelConfigs]);

  // Generate all channels for all pages (with full configuration data)
  const allPagesChannels = useMemo(() => {
    const totalChannels = getTotalChannelsCount;
    const channels = [];
    
    for (let i = 0; i < totalChannels; i++) {
      const channelId = `channel-${i}`;
      const config = effectiveChannelConfigs ? effectiveChannelConfigs[channelId] : null;
      const isConfigured = config && (config.media || config.path);
      const isVisible = config?.isVisible !== false; // Default to visible unless explicitly hidden
      
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
        isVisible: isVisible,
        ...(config || {})
      });
    }
    
    return channels;
  }, [getTotalChannelsCount, effectiveChannelConfigs, effectiveMediaMap, effectiveAppPathMap]);

  // Idle animation system (now using processed channels with full data)
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

  // Page navigation logic - now using Zustand store
  const channelsPerPage = 12;
  
  const getChannelIndexRange = useCallback((page) => {
    const startIndex = page * channelsPerPage;
    const endIndex = startIndex + channelsPerPage - 1;
    return { startIndex, endIndex };
  }, [channelsPerPage]);

  // Update total pages when needed - now using Zustand store
  const prevTotalChannelsRef = useRef(getTotalChannelsCount);
  
  useEffect(() => {
    const currentTotalChannels = getTotalChannelsCount;
    const requiredPages = Math.ceil(currentTotalChannels / channelsPerPage);
    const targetPages = Math.max(3, requiredPages); // Ensure minimum 3 pages
    
    // Only update if the number of channels changed or if we need more pages
    if (currentTotalChannels !== prevTotalChannelsRef.current || targetPages !== totalPages) {
      if (DEBUG) {
        console.log('[PaginatedChannels] Setting total pages from', totalPages, 'to', targetPages, 'due to channel count change:', currentTotalChannels);
      }
      prevTotalChannelsRef.current = currentTotalChannels;
      setTotalPages(targetPages);
    }
  }, [getTotalChannelsCount, channelsPerPage, totalPages, setTotalPages, DEBUG]);

  // Debug logging for channel data changes (only when DEBUG is true)
  useEffect(() => {
    if (DEBUG) {
      console.log('[PaginatedChannels] Channel data updated:', {
        totalChannels: getTotalChannelsCount,
        configuredChannels: Object.keys(effectiveChannelConfigs || {}).length,
        currentPage,
        totalPages
      });
    }
  }, [getTotalChannelsCount, effectiveChannelConfigs, currentPage, totalPages, DEBUG]);


  // Get channels for current page
  const currentPageChannels = useMemo(() => {
    const { startIndex, endIndex } = getChannelIndexRange(currentPage);
    return allPagesChannels.slice(startIndex, endIndex + 1);
  }, [allPagesChannels, currentPage, getChannelIndexRange]);

  // Modal opening is now handled by Zustand store

  // Handle page navigation - now using Zustand store with circular navigation
  const handlePageChange = useCallback((newPage) => {
    // For circular navigation, we allow wrapping around
    const wrappedPage = ((newPage % totalPages) + totalPages) % totalPages;
    setCurrentPage(wrappedPage);
  }, [totalPages, setCurrentPage]);

  // Handle animation - now using Zustand store
  const handleAnimation = useCallback((direction) => {
    setIsAnimating(true);
    setAnimationDirection(direction);
    
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationDirection('none');
    }, 300);
  }, [setIsAnimating, setAnimationDirection]);

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

  // Calculate the transform offset for circular navigation
  const getTransformOffset = () => {
    return -currentPage * 100;
  };

  // Create infinite scroll effect by duplicating pages
  const createInfinitePages = () => {
    const pages = [];
    
    // Add pages before current (for seamless left navigation)
    for (let i = 0; i < totalPages; i++) {
      const pageIndex = i;
      const { startIndex, endIndex } = getChannelIndexRange(pageIndex);
      const pageChannels = allPagesChannels.slice(startIndex, endIndex + 1);
      
      pages.push({
        key: `page-${pageIndex}`,
        pageIndex,
        channels: pageChannels,
        transform: `translateX(${i * 100}%)`
      });
    }
    
    return pages;
  };

  const infinitePages = createInfinitePages();

  return (
    <div className="paginated-channels">
      <div 
        className={`pages-container infinite-scroll ${isAnimating ? 'animating' : ''} ${animationDirection !== 'none' ? `slide-${animationDirection}` : ''}`}
        style={{
          transform: `translateX(${getTransformOffset()}%)`,
          transition: isAnimating ? 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
          '--animation-direction': animationDirection
        }}
      >
        {/* Render infinite pages */}
        {infinitePages.map(({ key, pageIndex, channels, transform }) => (
          <div 
            key={key} 
            className={`channels-page ${pageIndex === currentPage ? 'active' : ''}`}
            style={{ transform }}
          >
            <div className="channels-grid">
              {channels
                .filter(channel => channel.isVisible) // Only show visible channels
                .map((channel) => (
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
      
      {/* Channel Modal */}
      {/* The ChannelModal component is now managed by the App component */}
    </div>
  );
};

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
