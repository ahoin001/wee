/**
 * Home-grid Now Playing tile — SMTC-first display with full-bleed art +
 * floating-Spotify–inspired playback chrome, scaled per tile size.
 */
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
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

/** Stable empty fallback — never allocate `|| []` inside a useShallow selector. */
const EMPTY_SYSTEM_SESSIONS = Object.freeze([]);

function formatMs(ms) {
  const total = Math.max(0, Math.floor(Number(ms) / 1000) || 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Per-size chrome tokens — denser on S, roomier on L (Floating Spotify density). */
function chromeForSize(sizeId) {
  switch (sizeId) {
    case 'S':
      return {
        stackPad: 'gap-1.5 p-1.5',
        glassPad: 'gap-0.5 px-2 py-1.5',
        title: 'text-[10px] leading-tight',
        artist: 'text-[8px] tracking-[0.14em]',
        showArtist: false,
        showProgress: false,
        showStatus: false,
        playBox: 'h-8 w-8 rounded-[0.85rem] border-b-4',
        playIcon: 14,
        skipIcon: 15,
        skipOpacity: 'opacity-55 hover:opacity-100',
        glassRadius: 'rounded-xl',
      };
    case 'T':
      return {
        stackPad: 'gap-2 p-2.5',
        glassPad: 'gap-1 px-3 py-2',
        title: 'text-sm leading-snug sm:text-base',
        artist: 'text-[9px] tracking-[0.18em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        playBox: 'h-11 w-11 rounded-[1.15rem] border-b-[6px] sm:h-12 sm:w-12',
        playIcon: 20,
        skipIcon: 22,
        skipOpacity: 'opacity-45 hover:opacity-100',
        glassRadius: 'rounded-2xl',
      };
    case 'L':
      return {
        stackPad: 'gap-2.5 p-3',
        glassPad: 'gap-1 px-3.5 py-2.5',
        title: 'text-base leading-snug sm:text-lg',
        artist: 'text-[10px] tracking-[0.2em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        playBox: 'h-14 w-14 rounded-[1.35rem] border-b-8 sm:h-16 sm:w-16 sm:rounded-[1.5rem]',
        playIcon: 26,
        skipIcon: 26,
        skipOpacity: 'opacity-45 hover:opacity-100',
        glassRadius: 'rounded-[1.35rem]',
      };
    case 'M':
    default:
      return {
        stackPad: 'gap-2 p-2',
        glassPad: 'gap-0.5 px-2.5 py-2',
        title: 'text-xs leading-snug sm:text-sm',
        artist: 'text-[9px] tracking-[0.16em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        playBox: 'h-10 w-10 rounded-[1.1rem] border-b-[5px]',
        playIcon: 18,
        skipIcon: 20,
        skipOpacity: 'opacity-50 hover:opacity-100',
        glassRadius: 'rounded-2xl',
      };
  }
}

function NowPlayingSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const reducedMotion = useReducedMotion();
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
      sessions: Array.isArray(state.systemMedia?.sessions)
        ? state.systemMedia.sessions
        : EMPTY_SYSTEM_SESSIONS,
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
    progressMs = 0,
    durationMs = 0,
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
  const chrome = chromeForSize(sizeId);
  const isCompact = sizeId === 'S';
  const interactionsLocked = arrangeMode || punchMode;
  const hasTrack = Boolean(trackName);
  const hasArt = Boolean(albumArtUrl);
  const onArt = hasTrack && hasArt;

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

  const artDissolveStyle = useMemo(() => {
    const primary = extractedColors?.primary;
    if (primary) {
      return {
        background: [
          'linear-gradient(to top,',
          `color-mix(in srgb, ${primary} 28%, hsl(var(--color-pure-black))) 0%,`,
          'hsl(var(--color-pure-black) / 0.35) 35%,',
          'transparent 100%)',
        ].join(' '),
      };
    }
    return {
      background: [
        'linear-gradient(to top,',
        'hsl(var(--color-pure-black) / 0.55) 0%,',
        'hsl(var(--color-pure-black) / 0.18) 55%,',
        'transparent 100%)',
      ].join(' '),
    };
  }, [extractedColors?.primary]);

  const statusLabel = isPlaying
    ? appName || 'Now Playing'
    : hasTrack
      ? 'Paused'
      : '';

  const progressRatio =
    durationMs > 0 ? Math.min(1, Math.max(0, progressMs / durationMs)) : 0;
  const showProgress =
    chrome.showProgress && hasTrack && durationMs > 0 && !interactionsLocked;

  const artistColor = extractedColors?.accent || extractedColors?.primary || null;

  const playMotion = reducedMotion
    ? {}
    : { whileHover: { scale: 1.08, y: -2 }, whileTap: { scale: 0.92 } };

  const glassPanelClass = [
    'relative z-10 flex w-full flex-col border shadow-[var(--shadow-sm)]',
    chrome.glassRadius,
    chrome.glassPad,
    onArt
      ? 'border-[hsl(var(--color-pure-white)/0.28)] bg-[hsl(var(--color-pure-white)/0.18)] text-[hsl(var(--color-pure-white))] backdrop-blur-md'
      : 'border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.72)] text-[hsl(var(--text-primary))] backdrop-blur-md',
  ].join(' ');

  const transportRow = showTransport ? (
    <div
      className="relative z-10 flex items-center justify-center gap-3"
      role="group"
      aria-label="Playback controls"
    >
      <button
        type="button"
        className={`flex shrink-0 items-center justify-center transition-opacity disabled:opacity-25 ${chrome.skipOpacity} ${
          onArt ? 'text-[hsl(var(--color-pure-white))]' : 'text-[hsl(var(--text-primary))]'
        }`}
        title="Previous"
        aria-label="Previous track"
        disabled={!canSkipPrevious && !useApiControls}
        onClick={handleTransportClick('previous')}
      >
        <SkipBack size={chrome.skipIcon} fill="currentColor" aria-hidden />
      </button>

      <m.button
        type="button"
        {...playMotion}
        className={`flex shrink-0 items-center justify-center shadow-xl disabled:cursor-not-allowed disabled:opacity-50 ${chrome.playBox}`}
        style={{
          backgroundColor: onArt
            ? 'hsl(var(--color-pure-white))'
            : 'hsl(var(--text-primary))',
          color: onArt
            ? 'hsl(var(--color-pure-black))'
            : 'hsl(var(--surface-primary))',
          borderColor: onArt
            ? 'hsl(var(--color-pure-white) / 0.35)'
            : 'hsl(var(--border-primary) / 0.45)',
        }}
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        disabled={!playPauseEnabled}
        onClick={handleTransportClick('playPause')}
      >
        {isPlaying ? (
          <Pause size={chrome.playIcon} fill="currentColor" aria-hidden />
        ) : (
          <Play size={chrome.playIcon} className="ml-0.5" fill="currentColor" aria-hidden />
        )}
      </m.button>

      <button
        type="button"
        className={`flex shrink-0 items-center justify-center transition-opacity disabled:opacity-25 ${chrome.skipOpacity} ${
          onArt ? 'text-[hsl(var(--color-pure-white))]' : 'text-[hsl(var(--text-primary))]'
        }`}
        title="Next"
        aria-label="Next track"
        disabled={!canSkipNext && !useApiControls}
        onClick={handleTransportClick('next')}
      >
        <SkipForward size={chrome.skipIcon} fill="currentColor" aria-hidden />
      </button>
    </div>
  ) : null;

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      aria-label="Now Playing"
    >
      <div
        className="relative flex h-full min-h-0 w-full flex-col overflow-hidden"
        style={accentStyle}
      >
        {hasTrack && hasArt ? (
          <>
            {/* Soft ambient fill — hides SMTC thumbnail pixelation at the edges */}
            <img
              src={albumArtUrl}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-80 blur-[18px] saturate-125"
              draggable={false}
              decoding="async"
              aria-hidden
            />
            {/* Sharp cover plane */}
            <img
              src={albumArtUrl}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover [image-rendering:auto] contrast-[1.04] saturate-[1.05]"
              draggable={false}
              decoding="async"
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]"
              style={artDissolveStyle}
              aria-hidden
            />
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

        <div className={`relative z-10 mt-auto flex min-h-0 w-full flex-col ${chrome.stackPad}`}>
          {hasTrack ? (
            <button
              type="button"
              className={`${glassPanelClass} text-left`}
              onClick={handleActivate}
              disabled={interactionsLocked && !arrangeMode}
              aria-label={`Now playing: ${trackName} by ${artistLine}`}
            >
              {chrome.showStatus ? (
                <span
                  className={`flex items-center gap-1 text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] ${
                    onArt
                      ? 'text-[hsl(var(--color-pure-white)/0.82)]'
                      : 'text-[hsl(var(--text-secondary))]'
                  }`}
                >
                  <Music
                    size={isCompact ? 9 : 11}
                    strokeWidth={2.5}
                    className="shrink-0"
                    style={
                      artistColor
                        ? { color: artistColor }
                        : onArt
                          ? { color: 'hsl(var(--color-pure-white))' }
                          : { color: 'hsl(var(--primary))' }
                    }
                    aria-hidden
                  />
                  <span className="truncate">{statusLabel}</span>
                </span>
              ) : null}

              <span
                className={`truncate font-black uppercase italic tracking-tighter ${chrome.title} ${
                  onArt ? 'text-[hsl(var(--color-pure-white))]' : 'text-[hsl(var(--text-primary))]'
                }`}
              >
                {trackName}
              </span>

              {chrome.showArtist && artistLine ? (
                <span
                  className={`truncate font-black uppercase ${chrome.artist}`}
                  style={{
                    color:
                      artistColor ||
                      (onArt
                        ? 'hsl(var(--color-pure-white) / 0.78)'
                        : 'hsl(var(--primary))'),
                  }}
                >
                  {artistLine}
                </span>
              ) : null}

              {showProgress ? (
                <div className="mt-1" aria-hidden>
                  <div
                    className={`h-1.5 overflow-hidden rounded-full ${
                      onArt
                        ? 'bg-[hsl(var(--color-pure-white)/0.22)]'
                        : 'bg-[hsl(var(--border-primary)/0.35)]'
                    }`}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: `${progressRatio * 100}%`,
                        backgroundColor:
                          extractedColors?.accent ||
                          extractedColors?.primary ||
                          'hsl(var(--primary))',
                      }}
                    />
                  </div>
                  {!isCompact && sizeId !== 'M' ? (
                    <div
                      className={`mt-0.5 flex justify-between text-[8px] font-bold uppercase tracking-wider ${
                        onArt
                          ? 'text-[hsl(var(--color-pure-white)/0.6)]'
                          : 'text-[hsl(var(--text-tertiary))]'
                      }`}
                    >
                      <span>{formatMs(progressMs)}</span>
                      <span>{formatMs(durationMs)}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </button>
          ) : (
            <button
              type="button"
              className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center"
              onClick={handleActivate}
              disabled={interactionsLocked && !arrangeMode}
              aria-label="Now Playing"
            >
              <Music
                size={isCompact ? 22 : 28}
                strokeWidth={2.25}
                className="text-[hsl(var(--primary))]"
                aria-hidden
              />
              <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                {emptyLabel}
              </span>
            </button>
          )}

          {transportRow}
        </div>

        {hasTrack && takeoverAvailable && !isCompact && !interactionsLocked ? (
          <button
            type="button"
            className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--color-pure-black)/0.38)] text-[hsl(var(--color-pure-white)/0.85)] shadow-[var(--shadow-sm)] backdrop-blur-sm transition-transform hover:scale-110 home-widget-float-chip"
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
