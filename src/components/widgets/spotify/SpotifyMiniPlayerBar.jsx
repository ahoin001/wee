import React from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

function SpotifyMiniPlayerBar({
  track,
  artistLine,
  albumArtUrl,
  isPlaying,
  onOpenPlayer,
  onTogglePlay,
  disabled,
  reducedMotion,
}) {
  if (!track) return null;

  const tap = reducedMotion ? {} : { whileTap: { scale: 0.98 } };

  return (
    <m.div
      {...tap}
      role="button"
      tabIndex={0}
      onClick={onOpenPlayer}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenPlayer();
        }
      }}
      className="wee-spotify-widget__mini"
      layout
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border-2 border-[hsl(var(--color-pure-white)/0.12)] sm:h-12 sm:w-12">
        {albumArtUrl ? (
          <img src={albumArtUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--color-pure-white)/0.08)] text-lg">
            🎵
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="wee-spotify-widget__mini-title">{track.name}</div>
        <div className="wee-spotify-widget__mini-artist">{artistLine || '—'}</div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        disabled={disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--color-pure-white))] text-[hsl(var(--color-pure-black))] shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
        title={disabled ? 'Playback control requires Premium' : isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" aria-hidden /> : <Play size={18} className="ml-0.5" fill="currentColor" aria-hidden />}
      </button>
    </m.div>
  );
}

SpotifyMiniPlayerBar.propTypes = {
  track: PropTypes.object,
  artistLine: PropTypes.string,
  albumArtUrl: PropTypes.string,
  isPlaying: PropTypes.bool,
  onOpenPlayer: PropTypes.func.isRequired,
  onTogglePlay: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  reducedMotion: PropTypes.bool,
};

SpotifyMiniPlayerBar.defaultProps = {
  track: null,
  artistLine: '',
  albumArtUrl: '',
  isPlaying: false,
  disabled: false,
  reducedMotion: false,
};

export default SpotifyMiniPlayerBar;
