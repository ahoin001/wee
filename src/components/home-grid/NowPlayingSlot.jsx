/**
 * Home-grid Now Playing tile — reads the shared nowPlaying projection
 * (Spotify and/or Windows system media).
 */
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Maximize2, Music, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { WeeGlassPill } from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
import { openSettingsToTab } from '../../utils/settingsNavigation';
import {
  normalizeNowPlayingExperience,
  toggleSpotifyTakeover,
} from '../../utils/spotifyTakeover';

function NowPlayingSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const {
    trackName,
    artistLine,
    albumArtUrl,
    isPlaying,
    source,
    appName,
    canPlay,
    canPause,
    canSkipNext,
    canSkipPrevious,
    spotifyConnected,
    systemEnabled,
    systemAvailable,
    takeoverAvailable,
  } = useConsolidatedAppStore(
    useShallow((state) => {
      const np = state.nowPlaying || {};
      return {
        trackName: np.trackName || '',
        artistLine: np.artistLine || '',
        albumArtUrl: np.albumArtUrl || '',
        isPlaying: Boolean(np.isPlaying),
        source: np.source,
        appName: np.appName || '',
        canPlay: Boolean(np.canPlay),
        canPause: Boolean(np.canPause),
        canSkipNext: Boolean(np.canSkipNext),
        canSkipPrevious: Boolean(np.canSkipPrevious),
        spotifyConnected: Boolean(state.spotify.isConnected),
        systemEnabled: state.ui.systemMediaEnabled !== false,
        systemAvailable: Boolean(state.systemMedia?.available),
        takeoverAvailable:
          np.source === 'spotify' &&
          normalizeNowPlayingExperience(state.spotify.nowPlayingExperience) !== 'off',
      };
    })
  );

  const sizePreset = useMemo(
    () => matchSizePresetBySpan(slot?.colSpan ?? 1, slot?.rowSpan ?? 1) || matchSizePresetBySpan(1, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const isCompact = sizePreset?.id === 'S';
  const isTall = (sizePreset?.rowSpan ?? 1) > 1;
  const isWide = (sizePreset?.colSpan ?? 1) > 1;
  const interactionsLocked = arrangeMode || punchMode;
  const hasTrack = Boolean(trackName);

  const openMediaWidget = useCallback(() => {
    if (window.api?.ui?.showSpotifyWidget) {
      window.api.ui.showSpotifyWidget();
      return;
    }
    const { actions, floatingWidgets } = useConsolidatedAppStore.getState();
    actions.setFloatingWidgetsState({
      spotify: { ...floatingWidgets.spotify, visible: true },
    });
  }, []);

  const runTransport = useCallback(
    async (action) => {
      if (source === 'spotify') {
        const manager = useConsolidatedAppStore.getState().actions.spotifyManager;
        if (action === 'playPause') await manager?.togglePlayback?.();
        else if (action === 'next') await manager?.skipToNext?.();
        else if (action === 'previous') await manager?.skipToPrevious?.();
        return;
      }
      if (source === 'system') {
        await window.api?.systemMedia?.transport?.(action);
      }
    },
    [source]
  );

  const emptyLabel = useMemo(() => {
    if (hasTrack) return '';
    if (spotifyConnected || (systemEnabled && systemAvailable)) return 'Play something';
    if (systemEnabled) return 'Start a player';
    return 'Connect Spotify';
  }, [hasTrack, spotifyConnected, systemEnabled, systemAvailable]);

  const handleActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
        return;
      }
      if (interactionsLocked) return;
      if (!hasTrack && !spotifyConnected && !(systemEnabled && systemAvailable)) {
        openSettingsToTab('api-integrations');
        return;
      }
      if (!hasTrack) return;
      // Spotify → floating widget; system (Apple Music, etc.) → play/pause only.
      if (source === 'spotify') {
        openMediaWidget();
        return;
      }
      if (source === 'system') {
        void runTransport('playPause');
      }
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      hasTrack,
      spotifyConnected,
      systemEnabled,
      systemAvailable,
      source,
      onArrangeSelect,
      channelId,
      openMediaWidget,
      runTransport,
    ]
  );

  const handleTransportClick = useCallback(
    (action) => (event) => {
      event.stopPropagation();
      if (interactionsLocked) return;
      void runTransport(action);
    },
    [interactionsLocked, runTransport]
  );

  const statusLabel = isPlaying
    ? appName
      ? `${appName}`
      : 'Now Playing'
    : hasTrack
      ? 'Paused'
      : '';

  const showTransport =
    hasTrack && !isCompact && !interactionsLocked && (source === 'spotify' || source === 'system');

  const playPauseEnabled = isPlaying ? canPause || source === 'spotify' : canPlay || source === 'spotify';

  return (
    <WeeGlassPill
      as="div"
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.35rem] ${
        selected
          ? 'ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-[hsl(var(--surface-primary)/0)]'
          : ''
      }`}
      role="group"
      aria-label="Now Playing"
    >
      {hasTrack && albumArtUrl ? (
        <>
          <img
            src={albumArtUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div
            className={`pointer-events-none absolute inset-0 ${
              isTall
                ? 'bg-gradient-to-t from-[hsl(var(--surface-primary)/0.92)] via-[hsl(var(--surface-primary)/0.35)] to-transparent'
                : 'bg-gradient-to-t from-[hsl(var(--surface-primary)/0.88)] via-[hsl(var(--surface-primary)/0.28)] to-transparent'
            }`}
          />
        </>
      ) : null}

      <button
        type="button"
        className={`relative z-10 flex min-h-0 flex-1 flex-col justify-end gap-0.5 text-left ${
          isTall ? 'p-3.5' : isWide ? 'p-3' : 'p-2.5'
        } ${showTransport ? 'pb-0' : ''}`}
        onClick={handleActivate}
        disabled={interactionsLocked && !arrangeMode}
        aria-label={hasTrack ? `Now playing: ${trackName} by ${artistLine}` : 'Now Playing'}
      >
        {hasTrack ? (
          <>
            <span className="flex items-center gap-1.5 text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
              <Music size={11} strokeWidth={2.5} className="text-[hsl(var(--primary))]" aria-hidden />
              <span className="truncate">{statusLabel}</span>
              {source === 'system' && !isCompact ? (
                <span className="shrink-0 text-[hsl(var(--text-tertiary))]">· System</span>
              ) : null}
            </span>
            {!isCompact ? (
              <>
                <span
                  className={`truncate font-black text-[hsl(var(--text-primary))] ${
                    isTall ? 'text-base leading-snug' : 'text-sm'
                  }`}
                >
                  {trackName}
                </span>
                {artistLine ? (
                  <span
                    className={`truncate font-semibold text-[hsl(var(--text-secondary))] ${
                      isTall ? 'text-xs' : 'text-[length:var(--font-size-caption)]'
                    }`}
                  >
                    {artistLine}
                  </span>
                ) : null}
              </>
            ) : null}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center">
            <Music
              size={isCompact ? 22 : 28}
              strokeWidth={2.25}
              className="text-[hsl(var(--primary))]"
              aria-hidden
            />
            <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
              {emptyLabel}
            </span>
          </div>
        )}
      </button>

      {showTransport ? (
        <div
          className={`relative z-10 flex items-center gap-1 px-3 ${isTall ? 'pb-3.5 pt-1.5' : 'pb-2.5 pt-1'}`}
          role="group"
          aria-label="Playback controls"
        >
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--surface-elevated)/0.72)] text-[hsl(var(--text-primary))] backdrop-blur-sm transition-transform hover:scale-110 disabled:opacity-40"
            title="Previous"
            aria-label="Previous track"
            disabled={!canSkipPrevious && source !== 'spotify'}
            onClick={handleTransportClick('previous')}
          >
            <SkipBack size={14} strokeWidth={2.5} aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-sm)] transition-transform hover:scale-110 disabled:opacity-40"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={!playPauseEnabled}
            onClick={handleTransportClick('playPause')}
          >
            {isPlaying ? (
              <Pause size={15} strokeWidth={2.5} aria-hidden />
            ) : (
              <Play size={15} strokeWidth={2.5} className="ml-0.5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--surface-elevated)/0.72)] text-[hsl(var(--text-primary))] backdrop-blur-sm transition-transform hover:scale-110 disabled:opacity-40"
            title="Next"
            aria-label="Next track"
            disabled={!canSkipNext && source !== 'spotify'}
            onClick={handleTransportClick('next')}
          >
            <SkipForward size={14} strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      ) : null}

      {hasTrack && takeoverAvailable && !isCompact && !interactionsLocked ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--surface-elevated)/0.75)] text-[hsl(var(--text-secondary))] backdrop-blur-sm transition-transform hover:scale-110 hover:text-[hsl(var(--text-primary))]"
          title="Now Playing takeover"
          aria-label="Toggle Now Playing takeover"
          onClick={(event) => {
            event.stopPropagation();
            toggleSpotifyTakeover(useConsolidatedAppStore, 'manual');
          }}
        >
          <Maximize2 size={13} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </WeeGlassPill>
  );
}

NowPlayingSlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string.isRequired,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(NowPlayingSlot);
