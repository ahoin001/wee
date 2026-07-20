import React from 'react';
import PropTypes from 'prop-types';
import { channelMediaFitStyle, channelTileAspectRatioCss } from '../../utils/channelMediaFit';
import {
  isGifMediaType,
  isRasterImageMediaType,
  isVideoMediaType,
} from '../../utils/channelMediaType';

/**
 * Board-matched channel art frame: Wii-wide aspect + cover + focal object-position.
 * Use in the art panel (and anywhere else) so pickers match live tiles.
 */
function ChannelTileArtFrame({
  media,
  className = '',
  roundedClassName = 'rounded-[16px]',
  autoPlayVideo = true,
}) {
  if (!media?.url) return null;

  const fitStyle = channelMediaFitStyle(media);
  const type = media.type;
  const isImage = isRasterImageMediaType(type);
  const isVideo = isVideoMediaType(type);
  const isGif = isGifMediaType(type) || /\.gif$/i.test(media.url || '');

  return (
    <div
      className={`channel-tile-art-frame relative w-full overflow-hidden border-4 border-[hsl(var(--wee-border-outer))] shadow-[var(--shadow-card)] ${roundedClassName} ${className}`.trim()}
      style={{ aspectRatio: channelTileAspectRatioCss() }}
    >
      {isImage || isGif ? (
        <img
          src={media.url}
          alt=""
          className="channel-tile-art-frame__media absolute inset-0 h-full w-full"
          style={fitStyle}
          draggable={false}
        />
      ) : isVideo ? (
        <video
          src={media.url}
          className="channel-tile-art-frame__media absolute inset-0 h-full w-full"
          style={fitStyle}
          autoPlay={autoPlayVideo}
          loop
          muted
          playsInline
        />
      ) : (
        <img
          src={media.url}
          alt=""
          className="channel-tile-art-frame__media absolute inset-0 h-full w-full"
          style={fitStyle}
          draggable={false}
        />
      )}
    </div>
  );
}

ChannelTileArtFrame.propTypes = {
  media: PropTypes.shape({
    url: PropTypes.string,
    type: PropTypes.string,
    focalX: PropTypes.number,
    focalY: PropTypes.number,
  }),
  className: PropTypes.string,
  roundedClassName: PropTypes.string,
  autoPlayVideo: PropTypes.bool,
};

ChannelTileArtFrame.defaultProps = {
  media: null,
  className: '',
  roundedClassName: 'rounded-[16px]',
  autoPlayVideo: true,
};

export default ChannelTileArtFrame;
