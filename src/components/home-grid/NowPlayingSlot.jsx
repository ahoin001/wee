/**
 * Home-grid Now Playing tile — SMTC-first display for free desktop players;
 * Premium Spotify Web API for transport when available.
 */
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Maximize2, Music, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
import { openSettingsToTab } from '../../utils/settingsNavigation';
import {
  normalizeNowPlayingExperience,
  toggleSpotifyTakeover,
} from '../../utils/spotifyTakeover';
import { isSpotifyPremiumUser } from '../../utils/spotifyTier';
import {
  EMPTY_NOW_PLAYING,
  nowPlayingFromSpotify,
  nowPlayingFromSystemSession,
  pickPrimarySystemSession,
  resolveNowPlaying,
} from '../../utils/nowPlayingShape';

function NowPlayingSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const listenApp = String(slot?.widget?.listenApp || 'any').trim() || 'any';

  const {
    globalNp,
    sessions,
    preference,
    systemEnabled,
    systemAvailable,
    spotifyConnected,
    spotifyPremium,
    spotifySlice,
    takeoverExperienceOn,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      globalNp: state.nowPlaying || EMPTY_NOW_PLAYING,
      sessions: Array.isArray(state.systemMedia?.sessions) ? state.systemMedia.sessions : [],
      preference: state.ui.nowPlayingSourcePreference || 'auto',
      systemEnabled: state.ui.systemMediaEnabled !== false,
      systemAvailable: Boolean(state.systemMedia?.available),
      spotifyConnected: Boolean(state.spotify.isConnected),
      spotifyPremium: isSpotifyPremiumUser(state.spotify.currentUser),
      spotifySlice: state.spotify,
      takeoverExperienceOn:
        normalizeNowPlayingExperience(state.spotify.nowPlayingExperience) !== 'off',
    }))
  );

  // Optional per-tile app filter — otherwise use the shared nowPlaying SSOT.
  const np = useMemo(() => {
    if (listenApp === 'any') return globalNp;
    const session = pickPrimarySystemSession(sessions, { listenApp });
    if (!session) {
      return { ...EMPTY_NOW_PLAYING };
    }
    return resolveNowPlaying({
      preference,
      systemEnabled,
      spotifyConnected,
      spotifyPremium,
      spotifyCandidate: spotifyConnected ? nowPlayingFromSpotify(spotifySlice) : null,
      systemCandidate: nowPlayingFromSystemSession(session),
    });
  }, [
    listenApp,
    globalNp,
    sessions,
    preference,
    systemEnabled,
    spotifyConnected,
    spotifyPremium,
    spotifySlice,
  ]);

  const {
    trackName = '',
    artistLine = '',
    albumArtUrl = '',
    isPlaying = false,
    source = null,
    appName = '',
    canPlay = false,
    canPause = false,
    canSkipNext = false,
    canSkipPrevious = false,
    controlsVia = null,
  } = np || {};

  const useApiControls =
    controlsVia === 'spotify-api' || (source === 'spotify' && controlsVia !== 'system-keys');
  const useSystemKeys =
    controlsVia === 'system-keys' || (source === 'system' && !useApiControls);

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
      if (useApiControls) {
        const manager = useConsolidatedAppStore.getState().actions.spotifyManager;
        if (action === 'playPause') await manager?.togglePlayback?.();
        else if (action === 'next') await manager?.skipToNext?.();
        else if (action === 'previous') await manager?.skipToPrevious?.();
        return;
      }
      if (useSystemKeys) {
        await window.api?.systemMedia?.transport?.(action);
      }
    },
    [useApiControls, useSystemKeys]
  );

  const emptyLabel = useMemo(() => {
    if (hasTrack) return '';
    if (listenApp !== 'any') return 'Play in that app';
    if (spotifyConnected || (systemEnabled && systemAvailable)) return 'Play something';
    if (systemEnabled) return 'Start a player';
    return 'Connect Spotify';
  }, [hasTrack, listenApp, spotifyConnected, systemEnabled, systemAvailable]);

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
      // Open floating media widget for Spotify API path; SMTC → play/pause.
      if (useApiControls || source === 'spotify') {
        openMediaWidget();
        return;
      }
      if (useSystemKeys) {
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
      useApiControls,
      useSystemKeys,
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
    hasTrack && !isCompact && !interactionsLocked && (useApiControls || useSystemKeys);

  const playPauseEnabled = isPlaying
    ? canPause || useApiControls
    : canPlay || useApiControls;
  const surface = normalizeHomeWidgetSurface(slot?.surface);
  const takeoverAvailable =
    (source === 'spotify' || useApiControls) && takeoverExperienceOn;

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
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
                <span className="shrink-0 text-[hsl(var(--text-tertiary))]">· Desktop</span>
              ) : null}
            </span>
            {!isCompact ? (
              <>
                <span
                  className={`truncate font-black text-[hsl(var(--text-primary))] home-widget-float-type ${
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--surface-elevated)/0.72)] text-[hsl(var(--text-primary))] backdrop-blur-sm transition-transform hover:scale-110 disabled:opacity-40 home-widget-float-chip"
            title="Previous"
            aria-label="Previous track"
            disabled={!canSkipPrevious && !useApiControls}
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--surface-elevated)/0.72)] text-[hsl(var(--text-primary))] backdrop-blur-sm transition-transform hover:scale-110 disabled:opacity-40 home-widget-float-chip"
            title="Next"
            aria-label="Next track"
            disabled={!canSkipNext && !useApiControls}
            onClick={handleTransportClick('next')}
          >
            <SkipForward size={14} strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      ) : null}

      {hasTrack && takeoverAvailable && !isCompact && !interactionsLocked ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--surface-elevated)/0.75)] text-[hsl(var(--text-secondary))] backdrop-blur-sm transition-transform hover:scale-110 hover:text-[hsl(var(--text-primary))] home-widget-float-chip"
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
    </HomeWidgetShell>
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
