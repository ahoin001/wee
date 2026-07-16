/**
 * Home-grid Now Playing tile — SMTC-first display with full-bleed art + transport
 * on every size (1×1, 1×2, 2×1, 2×2).
 */
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Maximize2, Music, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { matchHomeSlotSizePreset } from './slotKindRegistry';
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

function TransportButton({
  label,
  title,
  disabled,
  onClick,
  sizeClass,
  primary = false,
  children,
}) {
  return (
    <button
      type="button"
      className={[
        'flex shrink-0 items-center justify-center rounded-full transition-transform',
        'disabled:opacity-40 disabled:hover:scale-100',
        primary
          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-sm)] hover:scale-110'
          : 'bg-[hsl(var(--surface-elevated)/0.78)] text-[hsl(var(--text-primary))] backdrop-blur-sm hover:scale-110 home-widget-float-chip',
        sizeClass,
      ].join(' ')}
      title={title}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

TransportButton.propTypes = {
  label: PropTypes.string.isRequired,
  title: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  sizeClass: PropTypes.string,
  primary: PropTypes.bool,
  children: PropTypes.node,
};

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
    extractedColors,
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
      extractedColors: state.spotify?.extractedColors || null,
    }))
  );

  const np = useMemo(() => {
    if (listenApp === 'any') return globalNp;
    const session = pickPrimarySystemSession(sessions, { listenApp });
    if (!session) return { ...EMPTY_NOW_PLAYING };
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
    () =>
      matchHomeSlotSizePreset('nowPlaying', slot?.colSpan ?? 1, slot?.rowSpan ?? 1) ||
      matchHomeSlotSizePreset('nowPlaying', 2, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const sizeId = sizePreset?.id || 'M';
  const isCompact = sizeId === 'S';
  const isTall = sizeId === 'T';
  const isWide = sizeId === 'M';
  const isLarge = sizeId === 'L';
  const interactionsLocked = arrangeMode || punchMode;
  const hasTrack = Boolean(trackName);
  const hasArt = Boolean(albumArtUrl);

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
      if (useApiControls || source === 'spotify') {
        openMediaWidget();
        return;
      }
      if (useSystemKeys) void runTransport('playPause');
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

  const showTransport =
    hasTrack && !interactionsLocked && (useApiControls || useSystemKeys);
  const playPauseEnabled = isPlaying
    ? canPause || useApiControls
    : canPlay || useApiControls;
  const surface = normalizeHomeWidgetSurface(slot?.surface);
  const takeoverAvailable =
    (source === 'spotify' || useApiControls) && takeoverExperienceOn;

  const accentStyle = useMemo(() => {
    if (!extractedColors?.primary) return undefined;
    return {
      '--np-accent': extractedColors.primary,
      '--np-accent-secondary': extractedColors.secondary || extractedColors.primary,
    };
  }, [extractedColors]);

  const statusLabel = isPlaying
    ? appName || 'Now Playing'
    : hasTrack
      ? 'Paused'
      : '';

  const btnSm = isCompact ? 'h-7 w-7' : isTall ? 'h-8 w-8' : 'h-8 w-8';
  const btnPlay = isCompact ? 'h-8 w-8' : isLarge ? 'h-10 w-10' : 'h-9 w-9';
  const iconSm = isCompact ? 12 : 14;
  const iconPlay = isCompact ? 13 : isLarge ? 16 : 15;

  const transportRow = showTransport ? (
    <div
      className={`relative z-10 flex items-center justify-center gap-1 ${
        isCompact ? 'px-1.5 pb-1.5 pt-0.5' : isTall ? 'px-2.5 pb-3 pt-1' : 'px-3 pb-2.5 pt-1'
      }`}
      role="group"
      aria-label="Playback controls"
    >
      <TransportButton
        label="Previous track"
        title="Previous"
        disabled={!canSkipPrevious && !useApiControls}
        onClick={handleTransportClick('previous')}
        sizeClass={btnSm}
      >
        <SkipBack size={iconSm} strokeWidth={2.5} aria-hidden />
      </TransportButton>
      <TransportButton
        label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
        disabled={!playPauseEnabled}
        onClick={handleTransportClick('playPause')}
        sizeClass={btnPlay}
        primary
      >
        {isPlaying ? (
          <Pause size={iconPlay} strokeWidth={2.5} aria-hidden />
        ) : (
          <Play size={iconPlay} strokeWidth={2.5} className="ml-0.5" aria-hidden />
        )}
      </TransportButton>
      <TransportButton
        label="Next track"
        title="Next"
        disabled={!canSkipNext && !useApiControls}
        onClick={handleTransportClick('next')}
        sizeClass={btnSm}
      >
        <SkipForward size={iconSm} strokeWidth={2.5} aria-hidden />
      </TransportButton>
    </div>
  ) : null;

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      aria-label="Now Playing"
    >
      <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden" style={accentStyle}>
      {hasTrack && hasArt ? (
        <>
          <img
            src={albumArtUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div
            className={`pointer-events-none absolute inset-0 ${
              isTall || isLarge
                ? 'bg-gradient-to-t from-[hsl(var(--surface-primary)/0.94)] via-[hsl(var(--surface-primary)/0.28)] to-transparent'
                : isCompact
                  ? 'bg-gradient-to-t from-[hsl(var(--surface-primary)/0.9)] via-[hsl(var(--surface-primary)/0.2)] to-transparent'
                  : 'bg-gradient-to-t from-[hsl(var(--surface-primary)/0.9)] via-[hsl(var(--surface-primary)/0.25)] to-transparent'
            }`}
          />
          {extractedColors?.primary ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-50"
              style={{
                background: `linear-gradient(to top, ${extractedColors.primary}, transparent)`,
              }}
            />
          ) : null}
        </>
      ) : hasTrack ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: extractedColors?.primary
              ? `linear-gradient(145deg, ${extractedColors.primary}, ${extractedColors.secondary || extractedColors.primary})`
              : 'hsl(var(--surface-elevated) / 0.55)',
          }}
        />
      ) : null}

      <button
        type="button"
        className={`relative z-10 flex min-h-0 flex-1 flex-col text-left ${
          isCompact
            ? 'justify-end gap-0 p-2'
            : isTall
              ? 'justify-end gap-1 p-3'
              : isWide
                ? 'justify-end gap-0.5 p-3'
                : 'justify-end gap-1 p-3.5'
        } ${showTransport ? 'pb-0' : ''}`}
        onClick={handleActivate}
        disabled={interactionsLocked && !arrangeMode}
        aria-label={hasTrack ? `Now playing: ${trackName} by ${artistLine}` : 'Now Playing'}
      >
        {hasTrack ? (
          <>
            <span className="flex items-center gap-1 text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-primary))] drop-shadow-[0_1px_2px_hsl(var(--surface-primary)/0.65)]">
              <Music
                size={isCompact ? 10 : 11}
                strokeWidth={2.5}
                className="shrink-0 text-[hsl(var(--primary))]"
                style={extractedColors?.accent ? { color: extractedColors.accent } : undefined}
                aria-hidden
              />
              <span className="truncate">{statusLabel}</span>
            </span>
            <span
              className={`truncate font-black text-[hsl(var(--text-primary))] drop-shadow-[0_1px_3px_hsl(var(--surface-primary)/0.7)] home-widget-float-type ${
                isCompact
                  ? 'text-[11px] leading-tight'
                  : isLarge
                    ? 'text-base leading-snug'
                    : 'text-sm leading-snug'
              }`}
            >
              {trackName}
            </span>
            {artistLine && !isCompact ? (
              <span
                className={`truncate font-semibold text-[hsl(var(--text-primary)/0.88)] drop-shadow-[0_1px_2px_hsl(var(--surface-primary)/0.65)] ${
                  isLarge ? 'text-xs' : 'text-[length:var(--font-size-caption)]'
                }`}
              >
                {artistLine}
              </span>
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

      {transportRow}

      {hasTrack && takeoverAvailable && !isCompact && !interactionsLocked ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--surface-elevated)/0.78)] text-[hsl(var(--text-secondary))] backdrop-blur-sm transition-transform hover:scale-110 hover:text-[hsl(var(--text-primary))] home-widget-float-chip"
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
      </div>
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
