/**
 * Home-grid Now Playing tile — system-media display with size-aware layouts.
 * Large tiles float square art over a soft ambient wash so wallpaper stays visible;
 * chrome is an inset glass pill, not a full-bleed slab.
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

/**
 * Per-size chrome + layout.
 * - immersive (2×2 / tall): floating square cover + inset glass pill
 * - wide (2×1): side-by-side cover + chrome
 * - compact (1×1): soft wash + mini chrome
 */
function chromeForSize(sizeId) {
  switch (sizeId) {
    case 'S':
      return {
        layout: 'compact',
        stackPad: 'gap-1 p-1.5',
        glassPad: 'gap-0.5 px-1.5 py-1',
        glassWidth: 'w-full',
        title: 'text-[9px] leading-tight',
        artist: 'text-[7px] tracking-[0.12em]',
        showArtist: false,
        showProgress: false,
        showStatus: false,
        showTimestamps: false,
        playBox: 'h-6 w-6 rounded-lg border-b-2',
        playIcon: 11,
        skipIcon: 12,
        skipBox: 'h-6 w-6',
        glassRadius: 'rounded-lg',
        transportGap: 'gap-2',
        artRadius: 'rounded-xl',
        artMax: 'h-10 w-10',
      };
    case 'T':
      return {
        layout: 'immersive',
        stackPad: 'gap-2 p-2.5',
        glassPad: 'gap-1 px-3 py-2',
        glassWidth: 'mx-auto w-[min(100%,13.5rem)]',
        title: 'text-xs leading-snug sm:text-sm',
        artist: 'text-[8px] tracking-[0.16em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        showTimestamps: false,
        playBox: 'h-8 w-8 rounded-[0.9rem] border-b-[4px] sm:h-9 sm:w-9',
        playIcon: 14,
        skipIcon: 16,
        skipBox: 'h-7 w-7',
        glassRadius: 'rounded-2xl',
        transportGap: 'gap-2.5',
        artRadius: 'rounded-[1.35rem]',
        artMax: 'max-h-[min(58%,11rem)] max-w-[min(88%,11rem)]',
      };
    case 'L':
      return {
        layout: 'immersive',
        stackPad: 'gap-2.5 p-3',
        glassPad: 'gap-1 px-3.5 py-2.5',
        glassWidth: 'mx-auto w-[min(100%,17.5rem)]',
        title: 'text-sm leading-snug sm:text-base',
        artist: 'text-[9px] tracking-[0.18em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        showTimestamps: true,
        playBox: 'h-10 w-10 rounded-[1.05rem] border-b-[5px] sm:h-11 sm:w-11',
        playIcon: 18,
        skipIcon: 18,
        skipBox: 'h-8 w-8',
        glassRadius: 'rounded-[1.35rem]',
        transportGap: 'gap-3',
        artRadius: 'rounded-[1.65rem]',
        artMax: 'max-h-[min(56%,14rem)] max-w-[min(72%,14rem)]',
      };
    case 'M':
    default:
      return {
        layout: 'wide',
        stackPad: 'gap-2 p-2',
        glassPad: 'gap-0.5 px-2.5 py-1.5',
        glassWidth: 'w-full min-w-0',
        title: 'text-[11px] leading-snug sm:text-xs',
        artist: 'text-[8px] tracking-[0.14em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        showTimestamps: false,
        playBox: 'h-7 w-7 rounded-[0.85rem] border-b-[3px]',
        playIcon: 13,
        skipIcon: 14,
        skipBox: 'h-7 w-7',
        glassRadius: 'rounded-xl',
        transportGap: 'gap-2.5',
        artRadius: 'rounded-[1.15rem]',
        artMax: 'h-[min(100%,5.75rem)] w-[min(100%,5.75rem)]',
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
  }, [listenApp, globalNp, sessions, systemEnabled]);

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
  const isImmersive = chrome.layout === 'immersive';
  const isWide = chrome.layout === 'wide';
  const interactionsLocked = arrangeMode || punchMode;
  const hasTrack = Boolean(trackName);
  const hasArt = Boolean(albumArtUrl);

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
      '--np-accent-glow': extractedColors.accent || extractedColors.primary,
    };
  }, [extractedColors]);

  const ambientWashStyle = useMemo(() => {
    const primary = extractedColors?.primary;
    const secondary = extractedColors?.secondary || primary;
    const accent = extractedColors?.accent || primary;
    if (primary) {
      return {
        background: [
          `radial-gradient(ellipse 78% 68% at 50% 28%, color-mix(in srgb, ${primary} 42%, transparent), transparent 72%)`,
          `radial-gradient(ellipse 62% 48% at 18% 88%, color-mix(in srgb, ${secondary || primary} 28%, transparent), transparent 70%)`,
          `radial-gradient(ellipse 55% 42% at 88% 78%, color-mix(in srgb, ${accent || primary} 22%, transparent), transparent 68%)`,
        ].join(', '),
      };
    }
    return {
      background: [
        'radial-gradient(ellipse 80% 65% at 50% 30%, hsl(var(--primary) / 0.18), transparent 70%)',
        'radial-gradient(ellipse 60% 50% at 85% 85%, hsl(var(--ambient-secondary) / 0.12), transparent 65%)',
      ].join(', '),
    };
  }, [extractedColors]);

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
    'text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--primary)/0.14)] hover:text-[hsl(var(--primary))]',
  ].join(' ');

  const glassPanelClass = [
    'relative z-10 flex flex-col border shadow-[var(--shadow-soft)]',
    chrome.glassRadius,
    chrome.glassPad,
    chrome.glassWidth,
    'border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.72)] text-[hsl(var(--text-primary))] backdrop-blur-md',
  ].join(' ');

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
        className={`flex shrink-0 items-center justify-center border shadow-[var(--shadow-md)] disabled:cursor-not-allowed disabled:opacity-50 ${chrome.playBox}`}
        style={{
          backgroundColor: 'hsl(var(--text-primary))',
          color: 'hsl(var(--surface-primary))',
          borderColor: 'hsl(var(--border-primary) / 0.45)',
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

  const trackMeta = (
    <button
      type="button"
      className="flex w-full flex-col gap-0.5 text-left outline-none"
      onClick={handleActivate}
      disabled={interactionsLocked && !arrangeMode}
      aria-label={`Now playing: ${trackName} by ${artistLine}`}
    >
      {chrome.showStatus ? (
        <span className="flex items-center gap-1 text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
          <Music
            size={isCompact ? 8 : 10}
            strokeWidth={2.5}
            className="shrink-0"
            style={artistColor ? { color: artistColor } : { color: 'hsl(var(--primary))' }}
            aria-hidden
          />
          <span className="truncate">{statusLabel}</span>
        </span>
      ) : null}

      <span
        className={`truncate font-black uppercase italic tracking-tighter text-[hsl(var(--text-primary))] ${chrome.title}`}
      >
        {trackName}
      </span>

      {chrome.showArtist && artistLine ? (
        <span
          className={`truncate font-black uppercase ${chrome.artist}`}
          style={{ color: artistColor || 'hsl(var(--primary))' }}
        >
          {artistLine}
        </span>
      ) : null}

      {showProgress ? (
        <div className="mt-0.5" aria-hidden>
          <div className="h-1 overflow-hidden rounded-full bg-[hsl(var(--border-primary)/0.35)]">
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
          {chrome.showTimestamps ? (
            <div className="mt-0.5 flex justify-between text-[7px] font-bold uppercase tracking-wider text-[hsl(var(--text-tertiary))]">
              <span>{formatMs(progressMs)}</span>
              <span>{formatMs(durationMs)}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </button>
  );

  const floatingArt = hasArt ? (
    <div
      className={[
        'relative shrink-0 overflow-hidden border border-[hsl(var(--color-pure-white)/0.28)]',
        'bg-[hsl(var(--surface-elevated)/0.35)] shadow-[var(--shadow-soft-hover)]',
        'ring-1 ring-[hsl(var(--color-pure-black)/0.12)]',
        chrome.artRadius,
        chrome.artMax || '',
        isImmersive ? 'aspect-square w-full' : '',
        isWide ? 'aspect-square' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={albumArtUrl}
        alt=""
        className="pointer-events-none h-full w-full object-cover [image-rendering:auto] contrast-[1.04] saturate-[1.08]"
        draggable={false}
        decoding="async"
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_hsl(var(--color-pure-white)/0.22)]"
        aria-hidden
      />
    </div>
  ) : (
    <div
      className={[
        'relative flex shrink-0 items-center justify-center overflow-hidden border border-[hsl(var(--border-primary)/0.3)]',
        'bg-[hsl(var(--surface-elevated)/0.55)] shadow-[var(--shadow-soft)]',
        chrome.artRadius,
        chrome.artMax || '',
        isImmersive ? 'aspect-square w-full' : '',
        isWide ? 'aspect-square' : 'h-11 w-11',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        extractedColors?.primary
          ? {
              background: `linear-gradient(145deg, ${extractedColors.primary}, ${extractedColors.secondary || extractedColors.primary})`,
            }
          : undefined
      }
    >
      <Music
        size={isImmersive ? 36 : isWide ? 22 : 18}
        strokeWidth={2.25}
        className="text-[hsl(var(--color-pure-white)/0.88)]"
        aria-hidden
      />
    </div>
  );

  const chromeCard = (
    <div className={glassPanelClass}>
      {trackMeta}
      {transportRow}
    </div>
  );

  const ambientLayer = hasTrack ? (
    <>
      {/* Soft color wash — wallpaper remains visible around the floating cover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-95"
        style={ambientWashStyle}
        aria-hidden
      />
      {hasArt ? (
        <img
          src={albumArtUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-[0.22] blur-[28px] saturate-150"
          draggable={false}
          decoding="async"
          aria-hidden
        />
      ) : null}
    </>
  ) : null;

  let body = null;
  if (!hasTrack) {
    body = (
      <button
        type="button"
        className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-1.5 text-center"
        onClick={handleActivate}
        disabled={interactionsLocked && !arrangeMode}
        aria-label="Now Playing"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.55)] shadow-[var(--shadow-soft)]">
          <Music
            size={isCompact ? 22 : 28}
            strokeWidth={2.25}
            className="text-[hsl(var(--primary))]"
            aria-hidden
          />
        </div>
        <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
          {emptyLabel}
        </span>
      </button>
    );
  } else if (isImmersive) {
    body = (
      <div className={`relative z-10 flex h-full min-h-0 w-full flex-col ${chrome.stackPad}`}>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          {floatingArt}
        </div>
        <div className="mt-auto flex w-full shrink-0 justify-center">{chromeCard}</div>
      </div>
    );
  } else if (isWide) {
    body = (
      <div
        className={`relative z-10 flex h-full min-h-0 w-full items-center ${chrome.stackPad}`}
      >
        <div className="flex h-full shrink-0 items-center">{floatingArt}</div>
        <div className="flex min-h-0 min-w-0 flex-1 items-center pl-1">{chromeCard}</div>
      </div>
    );
  } else {
    body = (
      <div className={`relative z-10 flex h-full min-h-0 w-full flex-col justify-end ${chrome.stackPad}`}>
        {hasArt || extractedColors?.primary ? (
          <div className="mb-1 flex justify-center">{floatingArt}</div>
        ) : null}
        {chromeCard}
      </div>
    );
  }

  return (
    <HomeWidgetShell surface={surface} selected={selected} aria-label="Now Playing">
      <div
        className="relative flex h-full min-h-0 w-full flex-col overflow-hidden"
        style={accentStyle}
      >
        {ambientLayer}
        {body}
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
