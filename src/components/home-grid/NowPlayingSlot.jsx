/**
 * Home-grid Now Playing tile — system-media display with full-bleed art and
 * player-agnostic playback chrome, scaled per tile size.
 */
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { Music, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { matchHomeSlotSizePreset } from './slotKindRegistry';
import { openSettingsToIntegrationsSubtab } from '../../utils/settingsNavigation';
import { createWeeTransition } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { WEE_GOOEY_ICON_PRESS } from '../../ui/wee/WeeGooeyIconButton';
import {
  EMPTY_NOW_PLAYING,
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

/** Per-size chrome tokens — compact so album art stays the hero. */
function chromeForSize(sizeId) {
  switch (sizeId) {
    case 'S':
      return {
        stackPad: 'gap-1 p-1.5',
        glassPad: 'gap-0.5 px-1.5 py-1',
        title: 'text-[9px] leading-tight',
        artist: 'text-[7px] tracking-[0.12em]',
        showArtist: false,
        showProgress: false,
        showStatus: false,
        playBox: 'h-6 w-6 rounded-lg border-b-2',
        playIcon: 11,
        skipIcon: 12,
        skipBox: 'h-6 w-6',
        glassRadius: 'rounded-lg',
        transportGap: 'gap-2',
      };
    case 'T':
      return {
        stackPad: 'gap-1.5 p-2',
        glassPad: 'gap-0.5 px-2.5 py-1.5',
        title: 'text-xs leading-snug sm:text-sm',
        artist: 'text-[8px] tracking-[0.16em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        playBox: 'h-8 w-8 rounded-[0.9rem] border-b-[4px] sm:h-9 sm:w-9',
        playIcon: 14,
        skipIcon: 16,
        skipBox: 'h-7 w-7',
        glassRadius: 'rounded-xl',
        transportGap: 'gap-2.5',
      };
    case 'L':
      return {
        stackPad: 'gap-1.5 p-2.5',
        glassPad: 'gap-0.5 px-3 py-2',
        title: 'text-sm leading-snug sm:text-base',
        artist: 'text-[9px] tracking-[0.18em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        playBox: 'h-10 w-10 rounded-[1.05rem] border-b-[5px] sm:h-11 sm:w-11',
        playIcon: 18,
        skipIcon: 18,
        skipBox: 'h-8 w-8',
        glassRadius: 'rounded-2xl',
        transportGap: 'gap-3',
      };
    case 'M':
    default:
      return {
        stackPad: 'gap-1.5 p-1.5',
        glassPad: 'gap-0.5 px-2 py-1.5',
        title: 'text-[11px] leading-snug sm:text-xs',
        artist: 'text-[8px] tracking-[0.14em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        playBox: 'h-7 w-7 rounded-[0.85rem] border-b-[3px]',
        playIcon: 13,
        skipIcon: 14,
        skipBox: 'h-7 w-7',
        glassRadius: 'rounded-xl',
        transportGap: 'gap-2.5',
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
  const motionFeedback = useMotionFeedback();
  const reducedMotion = motionFeedback.osReduced || !motionFeedback.prefs.master;
  const listenApp = String(slot?.widget?.listenApp || 'any').trim() || 'any';

  const {
    globalNp,
    sessions,
    systemEnabled,
    systemAvailable,
    extractedColors,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      globalNp: state.nowPlaying || EMPTY_NOW_PLAYING,
      sessions: Array.isArray(state.systemMedia?.sessions)
        ? state.systemMedia.sessions
        : EMPTY_SYSTEM_SESSIONS,
      systemEnabled: state.ui.systemMediaEnabled !== false,
      systemAvailable: Boolean(state.systemMedia?.available),
      extractedColors: state.spotify?.extractedColors || null,
    }))
  );

  const np = useMemo(() => {
    if (listenApp === 'any') return globalNp;
    const session = pickPrimarySystemSession(sessions, { listenApp });
    if (!session) return { ...EMPTY_NOW_PLAYING };
    return resolveNowPlaying({
      systemEnabled,
      systemCandidate: nowPlayingFromSystemSession(session),
    });
  }, [
    listenApp,
    globalNp,
    sessions,
    systemEnabled,
  ]);

  const {
    trackName = '',
    artistLine = '',
    albumArtUrl = '',
    isPlaying = false,
    appName = '',
    controlsVia = null,
    progressMs = 0,
    durationMs = 0,
  } = np || {};

  const useSystemKeys = controlsVia === 'system-keys';

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

  const runTransport = useCallback(async (action) => {
    if (!useSystemKeys) return;
    try {
      await window.api?.systemMedia?.transport?.(action);
    } catch {
      // Media-key transport is best-effort; stale sessions should not break the tile.
    }
  }, [useSystemKeys]);

  const emptyLabel = useMemo(() => {
    if (hasTrack) return '';
    if (listenApp !== 'any') return 'Play in that app';
    if (systemEnabled && systemAvailable) return 'Play something';
    if (systemEnabled) return 'Start a player';
    return 'Enable desktop media';
  }, [hasTrack, listenApp, systemEnabled, systemAvailable]);

  const handleActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
        return;
      }
      if (interactionsLocked) return;
      if (!hasTrack && !(systemEnabled && systemAvailable)) {
        openSettingsToIntegrationsSubtab('music');
        return;
      }
      if (!hasTrack) return;
      if (useSystemKeys) void runTransport('playPause');
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      hasTrack,
      systemEnabled,
      systemAvailable,
      useSystemKeys,
      onArrangeSelect,
      channelId,
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

  const showTransport = hasTrack && !interactionsLocked && useSystemKeys;
  const playPauseEnabled = useSystemKeys;
  const surface = normalizeHomeWidgetSurface(slot?.surface);

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

  const pressTransition = createWeeTransition('press', { reducedMotion });
  const playMotion = reducedMotion
    ? {}
    : {
        whileHover: { scale: 1.08, y: -2 },
        whileTap: { scale: WEE_GOOEY_ICON_PRESS.tapScale },
      };
  const skipMotion = reducedMotion
    ? {}
    : {
        whileHover: { scale: WEE_GOOEY_ICON_PRESS.hoverScale, y: -1 },
        whileTap: { scale: WEE_GOOEY_ICON_PRESS.tapScale, y: 0 },
      };
  const skipButtonClass = [
    'flex shrink-0 items-center justify-center rounded-full opacity-70',
    'transition-[color,background-color,opacity,filter] hover:opacity-100',
    'hover:[filter:var(--filter-hover-glow)] focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)/0.72)]',
    chrome.skipBox,
    onArt
      ? 'text-[hsl(var(--color-pure-black)/0.78)] hover:bg-[hsl(var(--color-pure-white)/0.28)]'
      : 'text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--primary)/0.14)] hover:text-[hsl(var(--primary))]',
  ].join(' ');

  const glassPanelClass = [
    'relative z-10 flex w-full flex-col border shadow-[var(--shadow-sm)]',
    chrome.glassRadius,
    chrome.glassPad,
    onArt
      ? 'border-[hsl(var(--color-pure-white)/0.28)] bg-[hsl(var(--color-pure-white)/0.18)] text-[hsl(var(--color-pure-white))] backdrop-blur-md'
      : 'border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.72)] text-[hsl(var(--text-primary))] backdrop-blur-md',
  ].join(' ');

  /** Black transport chrome inside the glass panel (white play disc + dark skips on art). */
  const transportRow = showTransport ? (
    <div
      className={`relative z-10 mt-1 flex items-center justify-center ${chrome.transportGap}`}
      role="group"
      aria-label="Playback controls"
    >
      <m.button
        type="button"
        {...skipMotion}
        transition={pressTransition}
        className={skipButtonClass}
        title="Previous"
        aria-label="Previous track"
        disabled={!useSystemKeys}
        onClick={handleTransportClick('previous')}
      >
        <SkipBack size={chrome.skipIcon} fill="currentColor" aria-hidden />
      </m.button>

      <m.button
        type="button"
        {...playMotion}
        transition={pressTransition}
        className={`flex shrink-0 items-center justify-center shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${chrome.playBox}`}
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

      <m.button
        type="button"
        {...skipMotion}
        transition={pressTransition}
        className={skipButtonClass}
        title="Next"
        aria-label="Next track"
        disabled={!useSystemKeys}
        onClick={handleTransportClick('next')}
      >
        <SkipForward size={chrome.skipIcon} fill="currentColor" aria-hidden />
      </m.button>
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
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
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
            <div className={glassPanelClass}>
              <button
                type="button"
                className="flex w-full flex-col gap-0.5 text-left outline-none"
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
                      size={isCompact ? 8 : 10}
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
                  <div className="mt-0.5" aria-hidden>
                    <div
                      className={`h-1 overflow-hidden rounded-full ${
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
                        className={`mt-0.5 flex justify-between text-[7px] font-bold uppercase tracking-wider ${
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

              {transportRow}
            </div>
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
        </div>

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
