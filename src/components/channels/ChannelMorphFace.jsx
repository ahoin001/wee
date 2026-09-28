import React from 'react';
import PropTypes from 'prop-types';
import ChannelTileArtFrame from './ChannelTileArtFrame';

function hasChannelArt(media) {
  return Boolean(media?.url && !media.loading);
}

/**
 * The channel's face on the flying shell, plus a still chip in the open header.
 * Empty tiles keep the channel's own plus; the shell carries the tile's paint.
 */
function ChannelMorphFace({ media, variant = 'fill', paint = null }) {
  const hasArt = hasChannelArt(media);

  if (variant === 'chip') {
    if (!hasArt) return null;
    return (
      <div className="relative h-10 w-20 shrink-0 overflow-hidden rounded-2xl" aria-hidden>
        <ChannelTileArtFrame media={media} fill autoPlayVideo={false} />
      </div>
    );
  }

  if (hasArt) {
    return <ChannelTileArtFrame media={media} fill autoPlayVideo={false} />;
  }

  if (!paint?.plus) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <span
        className="font-light leading-none"
        style={{
          fontSize: `calc(${paint.plusSize}px / var(--origin-morph-scale, 1))`,
          color: paint.plusColor,
          opacity: 'calc(1 - var(--origin-form, 0))',
        }}
      >
        {paint.plus}
      </span>
    </div>
  );
}

ChannelMorphFace.propTypes = {
  media: PropTypes.shape({
    url: PropTypes.string,
    type: PropTypes.string,
    loading: PropTypes.bool,
  }),
  variant: PropTypes.oneOf(['fill', 'chip']),
  paint: PropTypes.shape({
    plus: PropTypes.string,
    plusSize: PropTypes.number,
    plusColor: PropTypes.string,
  }),
};

ChannelMorphFace.defaultProps = {
  media: null,
  variant: 'fill',
  paint: null,
};

export default ChannelMorphFace;
