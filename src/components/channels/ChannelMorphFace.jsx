import React from 'react';
import PropTypes from 'prop-types';
import ChannelTileArtFrame from './ChannelTileArtFrame';

function hasChannelArt(media) {
  return Boolean(media?.url && !media.loading);
}

/**
 * The channel's face, shared by the flying shell and the open editor.
 * Fill covers the shell. Chip is a still beside the title, never a playing video.
 */
function ChannelMorphFace({ media, variant = 'fill' }) {
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

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[hsl(var(--surface-secondary))]"
      aria-hidden
    >
      <span className="relative h-[22%] w-[22%]">
        <span className="absolute left-1/2 top-0 h-full w-[12%] -translate-x-1/2 rounded-full bg-[hsl(var(--text-tertiary)/0.55)]" />
        <span className="absolute left-0 top-1/2 h-[12%] w-full -translate-y-1/2 rounded-full bg-[hsl(var(--text-tertiary)/0.55)]" />
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
};

ChannelMorphFace.defaultProps = {
  media: null,
  variant: 'fill',
};

export default ChannelMorphFace;
