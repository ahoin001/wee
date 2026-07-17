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
      initial={reducedMotion ? false : { y: 120 }}
      animate={{ y: 0 }}
      exit={reducedMotion ? undefined : { y: 120 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="absolute bottom-6 left-6 right-6 z-50 flex cursor-pointer items-center gap-3 rounded-[2.5rem] border-4 p-3 shadow-2xl backdrop-blur-xl sm:bottom-8 sm:left-8 sm:right-8 sm:gap-4 sm:p-4"
      style={{
        backgroundColor: 'var(--spotify-gooey-bg)',
        borderColor: 'var(--spotify-gooey-border)',
        color: 'var(--spotify-gooey-text)',
      }}
      layout
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-[hsl(var(--color-pure-white)/0.1)] sm:h-14 sm:w-14">
        {albumArtUrl ? (
          <img src={albumArtUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-lg"
            style={{ backgroundColor: 'var(--spotify-gooey-surface)' }}
          >
            🎵
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <h5
          className="truncate text-[10px] font-black uppercase italic sm:text-xs"
          style={{ color: 'var(--spotify-gooey-text)' }}
        >
          {track.name}
        </h5>
        <p
          className="truncate text-[8px] font-bold uppercase tracking-[0.2em] transition-colors duration-700 sm:text-[9px]"
          style={{ color: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))' }}
        >
          {artistLine || '—'}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        disabled={disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"
        style={{
          backgroundColor: 'var(--spotify-gooey-play-fill, var(--spotify-gooey-text))',
          color: 'var(--spotify-gooey-play-color, var(--spotify-gooey-bg))',
        }}
        title={disabled ? 'Playback control requires Premium' : isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" aria-hidden /> : <Play size={18} className="ml-1" fill="currentColor" aria-hidden />}
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
