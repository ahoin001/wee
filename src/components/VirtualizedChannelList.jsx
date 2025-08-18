import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Channel from './Channel';
import { usePerformanceMonitor } from '../utils/usePerformanceOptimization';

// Virtualized list component for optimal performance with large datasets
const VirtualizedChannelList = React.memo(({
  channels,
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
  gridColumns = 4,
  gridRows = 3,
  itemHeight = 120,
  itemWidth = 120,
  containerHeight = 400,
  containerWidth = 600
}) => {
  // Performance monitoring
  usePerformanceMonitor('VirtualizedChannelList');

  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Calculate virtual list dimensions
  const totalItems = channels.length;
  const itemsPerRow = gridColumns;
  const totalRows = Math.ceil(totalItems / itemsPerRow);
  const totalHeight = totalRows * itemHeight;
  const totalWidth = itemsPerRow * itemWidth;

  // Calculate visible range
  const visibleRows = Math.ceil(containerHeight / itemHeight) + 2; // +2 for buffer
  const visibleColumns = Math.ceil(containerWidth / itemWidth) + 2; // +2 for buffer
  
  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endRow = Math.min(totalRows - 1, startRow + visibleRows);
  
  const startColumn = Math.max(0, Math.floor(scrollLeft / itemWidth) - 1);
  const endColumn = Math.min(itemsPerRow - 1, startColumn + visibleColumns);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const items = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startColumn; col <= endColumn; col++) {
        const index = row * itemsPerRow + col;
        if (index < totalItems) {
          items.push({
            index,
            row,
            col,
            channel: channels[index],
            style: {
              position: 'absolute',
              top: row * itemHeight,
              left: col * itemWidth,
              width: itemWidth,
              height: itemHeight,
              transform: `translate(${col * itemWidth}px, ${row * itemHeight}px)`
            }
          });
        }
      }
    }
    return items;
  }, [channels, startRow, endRow, startColumn, endColumn, itemsPerRow, itemHeight, itemWidth, totalItems]);

  // Handle scroll events with throttling
  const handleScroll = useCallback((e) => {
    const { scrollTop: newScrollTop, scrollLeft: newScrollLeft } = e.target;
    setScrollTop(newScrollTop);
    setScrollLeft(newScrollLeft);
  }, []);

  // Optimized scroll handler with throttling
  const throttledScrollHandler = useCallback(
    (() => {
      let ticking = false;
      return (e) => {
        if (!ticking) {
          requestAnimationFrame(() => {
            handleScroll(e);
            ticking = false;
          });
          ticking = true;
        }
      };
    })(),
    [handleScroll]
  );

  // Memoize container style
  const containerStyle = useMemo(() => ({
    position: 'relative',
    width: containerWidth,
    height: containerHeight,
    overflow: 'auto',
    willChange: 'scroll-position'
  }), [containerWidth, containerHeight]);

  // Memoize inner container style
  const innerContainerStyle = useMemo(() => ({
    position: 'relative',
    width: totalWidth,
    height: totalHeight,
    willChange: 'transform'
  }), [totalWidth, totalHeight]);

  // Memoize channel render function
  const renderChannel = useCallback(({ index, channel, style }) => {
    if (!channel) return null;

    return (
      <div key={`channel-${index}`} style={style}>
        <Channel
          id={channel.id}
          type={channel.type}
          path={channel.path}
          icon={channel.icon}
          empty={channel.empty}
          media={channel.media}
          onMediaChange={onMediaChange}
          onAppPathChange={onAppPathChange}
          onChannelSave={onChannelSave}
          asAdmin={channel.asAdmin}
          hoverSound={channel.hoverSound}
          animatedOnHover={animatedOnHover}
          channelConfig={channelConfigs?.[channel.id]}
          onHover={onChannelHover}
          animationStyle={channel.animationStyle}
          adaptiveEmptyChannels={adaptiveEmptyChannels}
          kenBurnsEnabled={kenBurnsEnabled}
          kenBurnsMode={kenBurnsMode}
          idleAnimationClass={channel.idleAnimationClass}
          isIdleAnimating={channel.isIdleAnimating}
        />
      </div>
    );
  }, [
    onMediaChange,
    onAppPathChange,
    onChannelSave,
    animatedOnHover,
    channelConfigs,
    onChannelHover,
    adaptiveEmptyChannels,
    kenBurnsEnabled,
    kenBurnsMode
  ]);

  // Performance optimization: Only render visible items
  const renderedItems = useMemo(() => {
    return visibleItems.map(renderChannel);
  }, [visibleItems, renderChannel]);

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onScroll={throttledScrollHandler}
      className="virtualized-channel-list"
    >
      <div style={innerContainerStyle}>
        {renderedItems}
      </div>
    </div>
  );
});

VirtualizedChannelList.propTypes = {
  channels: PropTypes.array.isRequired,
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
  onMediaChange: PropTypes.func.isRequired,
  onAppPathChange: PropTypes.func.isRequired,
  onChannelSave: PropTypes.func.isRequired,
  onChannelHover: PropTypes.func,
  gridColumns: PropTypes.number,
  gridRows: PropTypes.number,
  itemHeight: PropTypes.number,
  itemWidth: PropTypes.number,
  containerHeight: PropTypes.number,
  containerWidth: PropTypes.number
};

VirtualizedChannelList.displayName = 'VirtualizedChannelList';

export default VirtualizedChannelList;




