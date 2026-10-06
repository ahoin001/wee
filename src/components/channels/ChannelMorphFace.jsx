import React from 'react';
import PropTypes from 'prop-types';
import ChannelTileArtFrame from './ChannelTileArtFrame';

function hasChannelArt(media) {
  return Boolean(media?.url && !media.loading);
}

const CHIP_SHELL =
  'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--control-radius-sm)] border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--wee-pill-glass))] shadow-[var(--wee-pill-shadow)]';

/**
 * The channel's face on the flying shell, plus a still chip in the open header.
 * Empty tiles keep the plus as a living chip — it does not wash the whole modal.
 */
function ChannelMorphFace({ media, variant = 'fill', paint = null }) {
  const hasArt = hasChannelArt(media);

  if (variant === 'chip') {
    if (hasArt) {
      return (
        <div className="relative h-10 w-20 shrink-0 overflow-hidden rounded-[var(--control-radius-sm)] border-4 border-[hsl(var(--wee-pill-border))]" aria-hidden>
          <ChannelTileArtFrame media={media} fill autoPlayVideo={false} />
        </div>
      );
    }
    const plus = paint?.plus || '+';
    return (
      <div className={CHIP_SHELL} aria-hidden>
        <span
          className="text-xl font-light leading-none"
          style={{ color: paint?.plusColor || 'hsl(var(--text-primary))' }}
        >
          {plus}
        </span>
      </div>
    );
  }

  if (hasArt) {
    return <ChannelTileArtFrame media={media} fill autoPlayVideo={false} />;
  }

  const plus = paint?.plus || '+';

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <span
        className="font-light leading-none"
        style={{
          fontSize: `calc(${paint?.plusSize || 32}px / var(--origin-morph-scale, 1))`,
          color: paint?.plusColor || 'hsl(var(--text-primary))',
          opacity: 'calc(1 - var(--origin-form, 0))',
        }}
      >
        {plus}
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
