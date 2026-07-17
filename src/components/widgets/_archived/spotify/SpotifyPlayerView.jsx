import React from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { Disc, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import SpotifyScrollLabel from '../../../ui/SpotifyScrollLabel';

function SpotifyPlayerView({
  currentTrack,
  artistLine,
  size,
  isPlaying,
  isFreeTierConnected,
  spotifyProgress,
  spotifyDuration,
  isSeeking,
  seekPosition,
  progressBarRef,
  onProgressBarPointerDown,
  onSeekHandlePointerDown,
  formatTime,
  onPrevious,
  onTogglePlay,
  onNext,
  reducedMotion,
}) {
  const w = size?.width ?? 360;
  const h = size?.height ?? 440;
  const isHorizontal = w / h > 1.2;
  const isShort = h < 650;

  const tap = reducedMotion ? {} : { whileTap: { scale: 0.9 } };
  const playHover = reducedMotion ? {} : { whileHover: { scale: 1.1, y: -5 } };

  const progressRatio =
    spotifyDuration > 0 ? (isSeeking ? seekPosition : spotifyProgress) / spotifyDuration : 0;

  if (!currentTrack) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <div className="text-5xl opacity-80" aria-hidden>
          🎵
        </div>
        <p
          className="font-black uppercase italic tracking-tight"
          style={{ color: 'var(--spotify-gooey-text)' }}
        >
          No track playing
        </p>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--spotify-gooey-text-secondary)' }}>
          Start music in Spotify to see it here
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-0 flex-1 items-center justify-center gap-8 pb-12 sm:gap-12 ${
        isHorizontal ? 'flex-row text-left' : 'flex-col text-center'
      }`}
    >
      <div
        className={`relative flex shrink-0 items-center justify-center ${
          isHorizontal ? 'aspect-square h-full max-h-[70%] min-h-0' : 'aspect-square w-full max-w-[400px] min-h-0 shrink'
        }`}
      >
        {isPlaying && !reducedMotion ? (
          <m.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
            className="pointer-events-none absolute -right-12 top-1/2 z-0 h-3/4 w-3/4 -translate-y-1/2 rounded-full border-[12px] bg-[hsl(var(--color-pure-black))] opacity-30"
            style={{ borderColor: 'hsl(var(--widget-gooey-frame-border))' }}
            aria-hidden
          >
            <Disc className="h-full w-full text-[hsl(var(--color-pure-white)/0.2)]" strokeWidth={1} aria-hidden />
          </m.div>
        ) : null}
        <m.div
          layout
          layoutId="gooey-artwork"
          className="relative z-[1] h-full w-full overflow-hidden rounded-[3.5rem] border-4 border-[hsl(var(--color-pure-white)/0.1)] shadow-2xl"
        >
          {currentTrack.album?.images?.[0]?.url ? (
            <img
              src={currentTrack.album.images[0].url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-6xl"
              style={{ backgroundColor: 'var(--spotify-gooey-surface)' }}
            >
              🎵
            </div>
          )}
        </m.div>
      </div>

      <div
        className={`flex min-w-0 flex-col justify-center ${
          isHorizontal ? 'max-w-[450px] flex-1' : 'w-full max-w-[450px] shrink-0'
        }`}
      >
        <div className={isShort ? 'mb-4' : 'mb-8'}>
          <SpotifyScrollLabel
            text={currentTrack.name}
            className={`font-black uppercase italic tracking-tighter ${
              isShort ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'
            } leading-tight`}
            style={{ color: 'var(--spotify-gooey-text)' }}
          />
          <p
            className="mt-1 font-black uppercase tracking-[0.2em] text-[10px] transition-colors duration-700 sm:text-xs"
            style={{ color: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))' }}
          >
            {artistLine}
          </p>
        </div>

        <div
          className={`progress-container-modern ${isShort ? 'mb-6' : 'mb-10'} ${isSeeking ? 'seeking' : ''} ${
            isFreeTierConnected ? 'progress-container-modern--free-readonly' : ''
          }`}
        >
          <div
            ref={progressBarRef}
            className="progress-bar-modern h-2 rounded-full"
            style={{ backgroundColor: 'var(--spotify-gooey-surface)' }}
            onPointerDown={onProgressBarPointerDown}
          >
            <m.div
              className="progress-fill-modern h-full rounded-full"
              style={{
                width: `${progressRatio * 100}%`,
                backgroundColor: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))',
              }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
            <div
              className="progress-handle-modern bg-[hsl(var(--color-pure-white))]"
              style={{ left: `${progressRatio * 100}%` }}
              onPointerDown={onSeekHandlePointerDown}
            />
          </div>
          <div
            className="progress-time-modern mt-1"
            style={{ color: 'var(--spotify-gooey-text-secondary)' }}
          >
            {formatTime(isSeeking ? seekPosition : spotifyProgress)} / {formatTime(spotifyDuration || 0)}
          </div>
        </div>

        <div
          className={`flex items-center gap-6 sm:gap-10 ${isHorizontal ? 'justify-start' : 'justify-center'}`}
        >
          <button
            type="button"
            className="opacity-40 transition-opacity hover:opacity-100 disabled:opacity-30"
            style={{ color: 'var(--spotify-gooey-text)' }}
            disabled={isFreeTierConnected}
            onClick={onPrevious}
            title={isFreeTierConnected ? 'Use Spotify app or Premium for controls' : 'Previous'}
            aria-label="Previous track"
          >
            <SkipBack size={isShort ? 28 : 36} fill="currentColor" aria-hidden />
          </button>
          <m.button
            type="button"
            {...playHover}
            {...tap}
            disabled={isFreeTierConnected}
            onClick={onTogglePlay}
            title={isFreeTierConnected ? 'Use Spotify app or Premium for controls' : isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className={`flex items-center justify-center rounded-[2rem] border-b-8 shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-[3rem] ${
              isShort ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-20 w-20 sm:h-28 sm:w-28'
            }`}
            style={{
              backgroundColor: 'var(--spotify-gooey-play-fill, var(--spotify-gooey-text))',
              color: 'var(--spotify-gooey-play-color, var(--spotify-gooey-bg))',
              borderColor: 'var(--spotify-gooey-surface)',
            }}
          >
            {isPlaying ? (
              <Pause size={isShort ? 32 : 44} fill="currentColor" aria-hidden />
            ) : (
              <Play size={isShort ? 32 : 44} className="ml-1.5" fill="currentColor" aria-hidden />
            )}
          </m.button>
          <button
            type="button"
            className="opacity-40 transition-opacity hover:opacity-100 disabled:opacity-30"
            style={{ color: 'var(--spotify-gooey-text)' }}
            disabled={isFreeTierConnected}
            onClick={onNext}
            title={isFreeTierConnected ? 'Use Spotify app or Premium for controls' : 'Next'}
            aria-label="Next track"
          >
            <SkipForward size={isShort ? 28 : 36} fill="currentColor" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

SpotifyPlayerView.propTypes = {
  currentTrack: PropTypes.object,
  artistLine: PropTypes.string,
  size: PropTypes.shape({ width: PropTypes.number, height: PropTypes.number }),
  isPlaying: PropTypes.bool,
  isFreeTierConnected: PropTypes.bool,
  spotifyProgress: PropTypes.number,
  spotifyDuration: PropTypes.number,
  isSeeking: PropTypes.bool,
  seekPosition: PropTypes.number,
  progressBarRef: PropTypes.object,
  onProgressBarPointerDown: PropTypes.func,
  onSeekHandlePointerDown: PropTypes.func,
  formatTime: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
  onTogglePlay: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  reducedMotion: PropTypes.bool,
};

SpotifyPlayerView.defaultProps = {
  currentTrack: null,
  artistLine: '',
  size: { width: 360, height: 440 },
  isPlaying: false,
  isFreeTierConnected: false,
  spotifyProgress: 0,
  spotifyDuration: 0,
  isSeeking: false,
  seekPosition: 0,
  progressBarRef: undefined,
  onProgressBarPointerDown: undefined,
  onSeekHandlePointerDown: undefined,
  reducedMotion: false,
};

export default SpotifyPlayerView;
