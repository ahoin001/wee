import React, { useMemo, useEffect, useState } from 'react';
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
  onOpenModal,
  gridSettings = {}
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

  const [selectedChannels, setSelectedChannels] = useState([]);
  const [showHiddenChannels, setShowHiddenChannels] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window resize for responsive updates
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    
    // Calculate based on user's grid settings to ensure each page fills completely
    const channelsPerGrid = gridSettings.responsiveRows * gridSettings.responsiveColumns;
    const neededForConfigured = highestIndex >= 0 ? highestIndex + 1 : 0;
    
    // Ensure we have enough channels to fill at least 3 pages completely
    const minChannelsForPages = channelsPerGrid * 3;
    const result = Math.max(minChannelsForPages, neededForConfigured);
    
    // console.log('PaginatedChannels: totalChannelsNeeded calculation', {
    //   channelsPerGrid,
    //   minChannelsForPages,
    //   highestIndex,
    //   neededForConfigured,
    //   result,
    //   channelConfigsKeys: Object.keys(channelConfigs)
    // });
    
    return result;
  }, [channelConfigs, gridSettings.responsiveRows, gridSettings.responsiveColumns]);

  // Generate all channels for all pages (with full configuration data)
  const allPagesChannels = useMemo(() => {
    const totalChannels = totalChannelsNeeded;
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
    // console.log('[PaginatedChannels] Generated channels for idle animations:', channels.slice(0, 3).map(c => ({
    //   id: c.id,
    //   empty: c.empty,
    //   media: c.media,
    //   path: c.path,
    //   title: c.title,
    //   type: c.type
    // })));
    
    return channels;
  }, [totalChannelsNeeded, channelConfigs, mediaMap, appPathMap, totalPages, channelsPerPage]);

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
    // Don't filter out hidden channels - keep them in their positions
    const allChannels = allPagesChannels;
    
    // Calculate exact channels per page based on grid settings
    const channelsPerGrid = gridSettings.responsiveRows * gridSettings.responsiveColumns;
    
    const pages = [];
    for (let page = 0; page < totalPages; page++) {
      const { startIndex, endIndex } = getChannelIndexRange(page);
      let pageChannelSlice = allChannels.slice(startIndex, endIndex);
      
      // Ensure each page has exactly the same number of channels that fills the grid
      if (pageChannelSlice.length > channelsPerGrid) {
        pageChannelSlice = pageChannelSlice.slice(0, channelsPerGrid);
      } else if (pageChannelSlice.length < channelsPerGrid) {
        // Pad with empty channels to fill the grid completely
        const emptyChannelsNeeded = channelsPerGrid - pageChannelSlice.length;
        for (let i = 0; i < emptyChannelsNeeded; i++) {
          const emptyChannelId = `empty-${page}-${i}`;
          pageChannelSlice.push({
            id: emptyChannelId,
            index: startIndex + pageChannelSlice.length + i,
            empty: true,
            media: null,
            path: null,
            type: null,
            title: null,
            hoverSound: null,
            asAdmin: false
          });
        }
      }
      
      pages.push(pageChannelSlice);
      // console.log(`Page ${page}: indices ${startIndex}-${endIndex}, channels:`, pageChannelSlice.length);
    }
    // console.log('PaginatedChannels: Total pages created:', pages.length, 'with channels:', pages.map(p => p.length));
    return pages;
  }, [allPagesChannels, totalPages, getChannelIndexRange, gridSettings.responsiveRows, gridSettings.responsiveColumns]);

  // Get responsive grid settings based on screen size
  const getResponsiveGridSettings = () => {
    const width = windowWidth;
    let responsiveColumns = gridSettings.responsiveColumns || 4;
    let responsiveRows = gridSettings.responsiveRows || 3;
    let gap = `${gridSettings.rowGap || 16}px ${gridSettings.columnGap || 16}px`;

    // Only apply responsive limits if the user hasn't set custom values
    if (width <= 480) {
      responsiveColumns = Math.min(responsiveColumns, 2);
      responsiveRows = Math.min(responsiveRows, 6);
      gap = `${Math.min(gridSettings.rowGap || 16, 12)}px ${Math.min(gridSettings.columnGap || 16, 12)}px`;
    } else if (width <= 768) {
      responsiveColumns = Math.min(responsiveColumns, 2);
      responsiveRows = Math.min(responsiveRows, 6);
      gap = `${Math.min(gridSettings.rowGap || 16, 14)}px ${Math.min(gridSettings.columnGap || 16, 14)}px`;
    } else if (width <= 1200) {
      responsiveColumns = Math.min(responsiveColumns, 3);
      responsiveRows = Math.min(responsiveRows, 4);
      gap = `${Math.min(gridSettings.rowGap || 16, 18)}px ${Math.min(gridSettings.columnGap || 16, 18)}px`;
    }

    return { responsiveColumns, responsiveRows, gap };
  };

  // Get grid container styles based on positioning settings
  const getGridContainerStyles = () => {
    const { responsiveColumns, responsiveRows, gap } = getResponsiveGridSettings();
    const width = windowWidth;
    
    // Responsive minimum sizes based on screen width
    let minColumnWidth = 460;
    let minRowHeight = 215;
    
    if (width <= 480) {
      minColumnWidth = 250;
      minRowHeight = 117;
    } else if (width <= 768) {
      minColumnWidth = 300;
      minRowHeight = 140;
    } else if (width <= 1200) {
      minColumnWidth = 400;
      minRowHeight = 187;
    }
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${responsiveColumns}, minmax(${minColumnWidth}px, 1fr))`,
      gridTemplateRows: `repeat(${responsiveRows}, minmax(${minRowHeight}px, 1fr))`,
      gap: gap,
      padding: '2rem 2vw',
      width: '100%',
      maxWidth: '100%',
      margin: 0,
      boxSizing: 'border-box',
      minHeight: '400px',
      height: 'fit-content',
      justifyContent: gridSettings.gridJustification || 'center',
      alignItems: gridSettings.gridAlignment || 'start',
      placeItems: 'stretch' // Ensure channels stretch to fill grid cells
    };
  };

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
            style={{
              height: '100vh',
              display: 'flex',
              alignItems: gridSettings.gridAlignment === 'center' ? 'center' : 
                        gridSettings.gridAlignment === 'end' ? 'flex-end' : 'flex-start',
              justifyContent: gridSettings.gridJustification === 'center' ? 'center' : 
                            gridSettings.gridJustification === 'end' ? 'flex-end' : 
                            gridSettings.gridJustification === 'space-between' ? 'space-between' :
                            gridSettings.gridJustification === 'space-around' ? 'space-around' : 'flex-start'
            }}
          >
            <div 
              className="channels-grid"
              style={getGridContainerStyles()}
            >
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
                  isHidden={gridSettings.hiddenChannels?.includes(channel.id)}
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
  onOpenModal: PropTypes.func.isRequired,
  gridSettings: PropTypes.object
};

export default PaginatedChannels; 