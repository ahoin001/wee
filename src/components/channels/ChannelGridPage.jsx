import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { getPageBounds } from '../../utils/channelLayoutSystem';
import { createSimplePageGridStyle } from './channelGridStyles';
import { VirtualizedChannelList } from '../navigation';

const ChannelGridPage = ({
  pageIndex,
  columns,
  rows,
  channelsPerPage,
  totalChannels,
  isGridFaded,
  onGridMouseEnter,
  onGridMouseLeave,
  renderChannelAtIndex,
}) => {
  const CHANNELS_PER_PAGE_VIRTUALIZATION_THRESHOLD = 24;
  const TOTAL_CHANNELS_VIRTUALIZATION_THRESHOLD = 96;
  const { startIndex, endIndex } = useMemo(
    () => getPageBounds(pageIndex, channelsPerPage, totalChannels),
    [pageIndex, channelsPerPage, totalChannels]
  );
  const shouldVirtualize =
    channelsPerPage >= CHANNELS_PER_PAGE_VIRTUALIZATION_THRESHOLD ||
    totalChannels >= TOTAL_CHANNELS_VIRTUALIZATION_THRESHOLD;
  const virtualItemWidth = useMemo(
    () => Math.max(180, Math.round(1120 / Math.max(1, columns))),
    [columns]
  );
  const virtualItemHeight = useMemo(
    () => Math.max(110, Math.round(540 / Math.max(1, rows))),
    [rows]
  );
  const channelItems = useMemo(
    () => Array.from({ length: channelsPerPage }, (_, offset) => {
      const channelIndex = startIndex + offset;
      if (channelIndex > endIndex) return null;
      return {
        id: `channel-${channelIndex}`,
        absoluteIndex: channelIndex,
      };
    }).filter(Boolean),
    [channelsPerPage, endIndex, startIndex]
  );

  return (
    <div
      className={`channel-page${isGridFaded ? ' auto-fade' : ''}`}
      style={shouldVirtualize ? { height: '100%', width: '100%' } : createSimplePageGridStyle(columns, rows)}
      onMouseEnter={onGridMouseEnter}
      onMouseLeave={onGridMouseLeave}
    >
      {shouldVirtualize ? (
        <VirtualizedChannelList
          channels={channelItems}
          gridColumns={columns}
          itemHeight={virtualItemHeight}
          itemWidth={virtualItemWidth}
          containerHeight={Math.max(220, rows * virtualItemHeight + 24)}
          containerWidth={Math.max(440, columns * virtualItemWidth + 24)}
          renderChannelItem={({ channel }) => renderChannelAtIndex(channel.absoluteIndex, false)}
        />
      ) : (
        Array.from({ length: channelsPerPage }, (_, offset) => {
          const channelIndex = startIndex + offset;
          if (channelIndex > endIndex) return null;
          return renderChannelAtIndex(channelIndex, false);
        })
      )}
    </div>
  );
};

ChannelGridPage.propTypes = {
  pageIndex: PropTypes.number.isRequired,
  columns: PropTypes.number.isRequired,
  rows: PropTypes.number.isRequired,
  channelsPerPage: PropTypes.number.isRequired,
  totalChannels: PropTypes.number.isRequired,
  isGridFaded: PropTypes.bool.isRequired,
  onGridMouseEnter: PropTypes.func.isRequired,
  onGridMouseLeave: PropTypes.func.isRequired,
  renderChannelAtIndex: PropTypes.func.isRequired,
};

export default React.memo(ChannelGridPage);

