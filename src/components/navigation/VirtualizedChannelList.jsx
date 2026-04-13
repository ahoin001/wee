import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Channel } from '../channels';
import { usePerformanceMonitor } from '../../utils/usePerformanceOptimization';

// Virtualized list component for optimal performance with large datasets
const VirtualizedChannelList = React.memo(({
  channels,
  channelConfigs,
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
  renderChannelItem,
  gridColumns = 4,
  itemHeight = 120,
  itemWidth = 120,
  containerHeight = 400,
  containerWidth = 600,
  className = 'virtualized-channel-list',
  onMouseEnter,
  onMouseLeave,
}) => {
  usePerformanceMonitor('VirtualizedChannelList');

  const containerRef = useRef(null);
  const totalItems = channels.length;
  const itemsPerRow = gridColumns;
  const totalRows = Math.ceil(totalItems / itemsPerRow);
  const totalWidth = itemsPerRow * itemWidth;

  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => containerRef.current,
    estimateSize: () => itemHeight,
    overscan: 2,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: containerWidth,
        height: containerHeight,
        overflow: 'auto',
        willChange: 'scroll-position',
      }}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          position: 'relative',
          width: totalWidth,
          height: totalHeight,
          willChange: 'transform',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowStartIndex = virtualRow.index * itemsPerRow;
          const rowChannels = channels.slice(rowStartIndex, rowStartIndex + itemsPerRow);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: itemHeight,
                width: totalWidth,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
              }}
            >
              {rowChannels.map((channel, columnOffset) => {
                if (!channel) return null;
                const index = rowStartIndex + columnOffset;

                return (
                  <div
                    key={`channel-${index}`}
                    style={{
                      width: itemWidth,
                      height: itemHeight,
                    }}
                  >
                    {renderChannelItem ? (
                      renderChannelItem({
                        channel,
                        index: channel.absoluteIndex ?? index,
                      })
                    ) : (
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
                        channelConfig={channelConfigs?.[channel.id]}
                        onHover={onChannelHover}
                        animationStyle={channel.animationStyle}
                        idleAnimationClass={channel.idleAnimationClass}
                        isIdleAnimating={channel.isIdleAnimating}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualizedChannelList.propTypes = {
  channels: PropTypes.array.isRequired,
  channelConfigs: PropTypes.object,
  idleAnimationEnabled: PropTypes.bool,
  idleAnimationTypes: PropTypes.array,
  idleAnimationInterval: PropTypes.number,
  onMediaChange: PropTypes.func,
  onAppPathChange: PropTypes.func,
  onChannelSave: PropTypes.func,
  onChannelHover: PropTypes.func,
  renderChannelItem: PropTypes.func,
  gridColumns: PropTypes.number,
  itemHeight: PropTypes.number,
  itemWidth: PropTypes.number,
  containerHeight: PropTypes.number,
  containerWidth: PropTypes.number,
  className: PropTypes.string,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
};

VirtualizedChannelList.displayName = 'VirtualizedChannelList';

export default VirtualizedChannelList;





