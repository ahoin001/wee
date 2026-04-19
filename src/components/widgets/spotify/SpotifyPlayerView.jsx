import React from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
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
  const isSquare = w / h > 1.1;
  const isTooShort = h < 420;

  const tap = reducedMotion ? {} : { whileTap: { scale: 0.92 } };
  const playHover = reducedMotion ? {} : { whileHover: { scale: 1.06, y: -2 } };

  const progressRatio =
    spotifyDuration > 0
      ? (isSeeking ? seekPosition : spotifyProgress) / spotifyDuration
      : 0;

  if (!currentTrack) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <div className="text-5xl opacity-80" aria-hidden>
          🎵
        </div>
        <p className="font-black uppercase italic tracking-tight text-[hsl(var(--text-on-accent))]">No track playing</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--color-pure-white)/0.5)]">
          Start music in Spotify to see it here
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-0 flex-1 items-center justify-center gap-6 px-4 py-3 sm:gap-8 sm:px-6 ${
        isSquare ? 'flex-row' : 'flex-col'
      }`}
    >
      <div
        className={`relative flex shrink-0 items-center justify-center ${
          isSquare ? 'h-[min(58%,420px)] w-[min(58%,420px)]' : 'aspect-square w-full max-w-[min(100%,380px)]'
        }`}
      >
        <m.div
          layout
          className="relative h-full w-full overflow-hidden rounded-[2.5rem] border-4 border-[hsl(var(--color-pure-white)/0.12)] shadow-2xl shadow-[hsl(var(--color-pure-black)/0.45)]"
        >
          {currentTrack.album?.images?.[0]?.url ? (
            <img
              src={currentTrack.album.images[0].url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--color-pure-white)/0.08)] text-6xl">
              🎵
            </div>
          )}
        </m.div>
      </div>

      <div
        className={`flex min-w-0 flex-col ${isSquare ? 'max-w-[min(100%,400px)] flex-1' : 'w-full max-w-[450px] text-center'}`}
      >
        <SpotifyScrollLabel
          text={currentTrack.name}
          className={`font-black uppercase italic tracking-tighter text-[hsl(var(--text-on-accent))] ${
            isTooShort ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'
          }`}
        />
        <p className="mb-4 mt-1 font-black uppercase tracking-[0.2em] text-[rgb(var(--spotify-green-rgb))] sm:mb-6 sm:text-xs">
          {artistLine}
        </p>

        <div
          className={`progress-container-modern mb-4 sm:mb-6 ${isSeeking ? 'seeking' : ''} ${
            isFreeTierConnected ? 'progress-container-modern--free-readonly' : ''
          }`}
        >
          <div
            ref={progressBarRef}
            className="progress-bar-modern bg-[hsl(var(--color-pure-white)/0.15)]"
            onPointerDown={onProgressBarPointerDown}
          >
            <div
              className="progress-fill-modern bg-[rgb(var(--spotify-green-rgb))]"
              style={{ width: `${progressRatio * 100}%` }}
            />
            <div
              className="progress-handle-modern bg-[hsl(var(--color-pure-white))]"
              style={{ left: `${progressRatio * 100}%` }}
              onPointerDown={onSeekHandlePointerDown}
            />
          </div>
          <div className="progress-time-modern mt-1 text-[hsl(var(--color-pure-white)/0.75)]">
            {formatTime(isSeeking ? seekPosition : spotifyProgress)} / {formatTime(spotifyDuration || 0)}
          </div>
        </div>

        <div
          className={`flex items-center gap-6 sm:gap-10 ${isSquare ? 'justify-start' : 'justify-center'}`}
        >
          <button
            type="button"
            className="text-[hsl(var(--color-pure-white)/0.45)] transition-colors hover:text-[hsl(var(--text-on-accent))] disabled:opacity-40"
            disabled={isFreeTierConnected}
            onClick={onPrevious}
            title={isFreeTierConnected ? 'Use Spotify app or Premium for controls' : 'Previous'}
            aria-label="Previous track"
          >
            <SkipBack size={isTooShort ? 28 : 36} fill="currentColor" aria-hidden />
          </button>
          <m.button
            type="button"
            {...playHover}
            {...tap}
            disabled={isFreeTierConnected}
            onClick={onTogglePlay}
            title={isFreeTierConnected ? 'Use Spotify app or Premium for controls' : isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className={`flex items-center justify-center rounded-[2rem] border-b-8 border-[hsl(var(--color-pure-white)/0.35)] bg-[hsl(var(--color-pure-white))] text-[hsl(var(--color-pure-black))] shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-[2.5rem] ${
              isTooShort ? 'h-16 w-16' : 'h-20 w-20 sm:h-24 sm:w-24'
            }`}
          >
            {isPlaying ? (
              <Pause size={isTooShort ? 32 : 40} fill="currentColor" aria-hidden />
            ) : (
              <Play size={isTooShort ? 32 : 40} className="ml-1" fill="currentColor" aria-hidden />
            )}
          </m.button>
          <button
            type="button"
            className="text-[hsl(var(--color-pure-white)/0.45)] transition-colors hover:text-[hsl(var(--text-on-accent))] disabled:opacity-40"
            disabled={isFreeTierConnected}
            onClick={onNext}
            title={isFreeTierConnected ? 'Use Spotify app or Premium for controls' : 'Next'}
            aria-label="Next track"
          >
            <SkipForward size={isTooShort ? 28 : 36} fill="currentColor" aria-hidden />
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
