import React, { useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import usePageNavigationStore from '../utils/usePageNavigationStore';
import useIdleChannelAnimations from '../utils/useIdleChannelAnimations';
import Channel from './Channel';
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
  onChannelHover,
  onOpenModal
}) => {
  const {
    currentPage,
    totalPages,
    isAnimating,
    animationDirection,
    channelsPerPage,
    getChannelIndexRange,
    getTotalChannelsCount,
    setTotalPages,
    ensurePageExists
  } = usePageNavigationStore();

  // Calculate total channels needed first
  const totalChannelsNeeded = useMemo(() => {
    // Find the highest configured channel index
    let highestIndex = -1;
    Object.keys(channelConfigs).forEach(channelId => {
      const match = channelId.match(/channel-(\d+)/);
      if (match) {
        const index = parseInt(match[1]);
        if (channelConfigs[channelId] && (channelConfigs[channelId].media || channelConfigs[channelId].path)) {
          highestIndex = Math.max(highestIndex, index);
        }
      }
    });
    
    // Ensure we have at least 3 pages worth of channels (36 channels) to start with
    const minChannels = channelsPerPage * 3; // At least 3 pages
    const neededForConfigured = highestIndex >= 0 ? highestIndex + 1 : 0;
    const result = Math.max(minChannels, neededForConfigured);
    
    // console.log('PaginatedChannels: totalChannelsNeeded calculation', {
    //   channelsPerPage,
    //   minChannels,
    //   highestIndex,
    //   neededForConfigured,
    //   result,
    //   channelConfigsKeys: Object.keys(channelConfigs)
    // });
    
    return result;
  }, [channelConfigs, channelsPerPage]);

  // Generate all channels for all pages (with full configuration data)
  const allPagesChannels = useMemo(() => {
    const totalChannels = getTotalChannelsCount();
    const channels = [];
    
    for (let i = 0; i < totalChannels; i++) {
      const channelId = `channel-${i}`;
      const config = channelConfigs[channelId];
      const isConfigured = config && (config.media || config.path);
      
      channels.push({
        id: channelId,
        index: i,
        empty: !isConfigured,
        media: mediaMap[channelId],
        path: appPathMap[channelId],
        type: config?.type,
        title: config?.title,
        hoverSound: config?.hoverSound,
        asAdmin: config?.asAdmin,
        ...config
      });
    }
    
    // Debug: Show first few channels with their full data
    console.log('[PaginatedChannels] Generated channels for idle animations:', channels.slice(0, 3).map(c => ({
      id: c.id,
      empty: c.empty,
      media: c.media,
      path: c.path,
      title: c.title,
      type: c.type
    })));
    
    return channels;
  }, [getTotalChannelsCount, channelConfigs, mediaMap, appPathMap, totalPages, channelsPerPage, totalChannelsNeeded]);

  // Idle animation system (now using processed channels with full data)
  const { getChannelAnimationClass, isChannelAnimating } = useIdleChannelAnimations(
    idleAnimationEnabled,
    idleAnimationTypes,
    idleAnimationInterval,
    allPagesChannels
  );

  // Update total pages when needed
  useEffect(() => {
    const requiredPages = Math.ceil(totalChannelsNeeded / channelsPerPage);
    const targetPages = Math.max(3, requiredPages); // Ensure minimum 3 pages
    
    // console.log('PaginatedChannels: useEffect updating pages', {
    //   totalChannelsNeeded,
    //   channelsPerPage,
    //   requiredPages,
    //   targetPages,
    //   currentTotalPages: totalPages
    // });
    
    if (targetPages !== totalPages) {
      // console.log('PaginatedChannels: Setting total pages from', totalPages, 'to', targetPages);
      setTotalPages(targetPages);
    }
  }, [totalChannelsNeeded, channelsPerPage, totalPages, setTotalPages]);



  // Get channels for each page
  const pageChannels = useMemo(() => {
    const pages = [];
    for (let page = 0; page < totalPages; page++) {
      const { startIndex, endIndex } = getChannelIndexRange(page);
      const pageChannelSlice = allPagesChannels.slice(startIndex, endIndex);
      pages.push(pageChannelSlice);
      // console.log(`Page ${page}: indices ${startIndex}-${endIndex}, channels:`, pageChannelSlice.length);
    }
    // console.log('PaginatedChannels: Total pages created:', pages.length, 'with channels:', pages.map(p => p.length));
    return pages;
  }, [allPagesChannels, totalPages, getChannelIndexRange]);

  // Handle channel modal opening (ensure page exists for the channel)
  const handleOpenModal = (channelId) => {
    const match = channelId.match(/channel-(\d+)/);
    if (match) {
      const channelIndex = parseInt(match[1]);
      ensurePageExists(channelIndex);
    }
    onOpenModal(channelId);
  };

  return (
    <div className="paginated-channels">
      <div 
        className={`pages-container ${isAnimating ? 'animating' : ''} ${animationDirection !== 'none' ? `slide-${animationDirection}` : ''}`}
        style={{
          transform: `translateX(-${currentPage * 100}%)`,
          transition: isAnimating ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
        }}
      >
        {pageChannels.map((channels, pageIndex) => (
          <div 
            key={pageIndex} 
            className={`channels-page ${pageIndex === currentPage ? 'active' : ''}`}
          >
            <div className="channels-grid">
              {channels.map((channel) => (
                <Channel
                  key={channel.id}
                  {...channel}
                  onMediaChange={onMediaChange}
                  onAppPathChange={onAppPathChange}
                  onChannelSave={onChannelSave}
                  animatedOnHover={animatedOnHover}
                  channelConfig={channelConfigs[channel.id]}
                  onHover={onChannelHover}
                  onOpenModal={() => handleOpenModal(channel.id)}
                  animationStyle={channel.animationStyle}
                  adaptiveEmptyChannels={adaptiveEmptyChannels}
                  kenBurnsEnabled={kenBurnsEnabled}
                  kenBurnsMode={kenBurnsMode}
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
  onOpenModal: PropTypes.func.isRequired
};

export default PaginatedChannels; 