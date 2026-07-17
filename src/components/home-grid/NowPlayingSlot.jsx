/**
 * Home-grid Now Playing — size-aware layouts up to 3×3.
 * Crisp square cover over a darkened, lightly blurred album backdrop;
 * optional reactive bars via Looks → Visualizer.
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
import { useMusicReactiveLevels } from '../../hooks/useMusicReactiveLevels';
import MusicReactiveBars from '../widgets/MusicReactiveBars';
import { WEE_GOOEY_ICON_PRESS } from '../../ui/wee/WeeGooeyIconButton';
import { normalizeHomeNowPlayingWidget } from '../../utils/homeNowPlayingWidgetPrefs';
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
 * - immersive / hero: floating square cover + inset glass pill
 * - wide (2×1): side-by-side cover + chrome
 * - compact (1×1): mini square + chrome
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
        showVisualizer: false,
        playBox: 'h-6 w-6 rounded-lg border-b-2',
        playIcon: 11,
        skipIcon: 12,
        skipBox: 'h-6 w-6',
        glassRadius: 'rounded-lg',
        transportGap: 'gap-2',
        artRadius: 'rounded-xl',
        artMax: 'h-10 w-10 shrink-0',
        vizMaxH: 0,
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
        showVisualizer: true,
        playBox: 'h-8 w-8 rounded-[0.9rem] border-b-[4px] sm:h-9 sm:w-9',
        playIcon: 14,
        skipIcon: 16,
        skipBox: 'h-7 w-7',
        glassRadius: 'rounded-2xl',
        transportGap: 'gap-2.5',
        artRadius: 'rounded-[1.35rem]',
        artMax: 'aspect-square w-[min(88%,11rem)] max-h-[min(52%,11rem)]',
        vizMaxH: 22,
      };
    case 'V':
      return {
        layout: 'immersive',
        stackPad: 'gap-2.5 p-3',
        glassPad: 'gap-1 px-3.5 py-2.5',
        glassWidth: 'mx-auto w-[min(100%,16rem)]',
        title: 'text-sm leading-snug',
        artist: 'text-[9px] tracking-[0.16em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        showTimestamps: true,
        showVisualizer: true,
        playBox: 'h-10 w-10 rounded-[1.05rem] border-b-[5px]',
        playIcon: 17,
        skipIcon: 17,
        skipBox: 'h-8 w-8',
        glassRadius: 'rounded-[1.35rem]',
        transportGap: 'gap-3',
        artRadius: 'rounded-[1.5rem]',
        artMax: 'aspect-square w-[min(90%,13.5rem)] max-h-[min(48%,13.5rem)]',
        vizMaxH: 26,
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
        showVisualizer: true,
        playBox: 'h-10 w-10 rounded-[1.05rem] border-b-[5px] sm:h-11 sm:w-11',
        playIcon: 18,
        skipIcon: 18,
        skipBox: 'h-8 w-8',
        glassRadius: 'rounded-[1.35rem]',
        transportGap: 'gap-3',
        artRadius: 'rounded-[1.65rem]',
        artMax: 'aspect-square w-[min(72%,14rem)] max-h-[min(52%,14rem)]',
        vizMaxH: 28,
      };
    case 'W':
      return {
        layout: 'immersive',
        stackPad: 'gap-2.5 p-3',
        glassPad: 'gap-1 px-4 py-2.5',
        glassWidth: 'mx-auto w-[min(100%,22rem)]',
        title: 'text-base leading-snug',
        artist: 'text-[10px] tracking-[0.18em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        showTimestamps: true,
        showVisualizer: true,
        playBox: 'h-11 w-11 rounded-[1.1rem] border-b-[5px]',
        playIcon: 18,
        skipIcon: 18,
        skipBox: 'h-9 w-9',
        glassRadius: 'rounded-[1.45rem]',
        transportGap: 'gap-3.5',
        artRadius: 'rounded-[1.75rem]',
        artMax: 'aspect-square w-[min(42%,15rem)] max-h-[min(58%,15rem)]',
        vizMaxH: 30,
      };
    case 'XL':
      return {
        layout: 'immersive',
        stackPad: 'gap-3 p-3.5',
        glassPad: 'gap-1.5 px-4 py-3',
        glassWidth: 'mx-auto w-[min(100%,24rem)]',
        title: 'text-base leading-snug sm:text-lg',
        artist: 'text-[10px] tracking-[0.2em]',
        showArtist: true,
        showProgress: true,
        showStatus: true,
        showTimestamps: true,
        showVisualizer: true,
        playBox: 'h-12 w-12 rounded-[1.15rem] border-b-[5px]',
        playIcon: 20,
        skipIcon: 20,
        skipBox: 'h-9 w-9',
        glassRadius: 'rounded-[1.55rem]',
        transportGap: 'gap-4',
        artRadius: 'rounded-[1.85rem]',
        artMax: 'aspect-square w-[min(58%,16.5rem)] max-h-[min(48%,16.5rem)]',
        vizMaxH: 34,
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
        showVisualizer: true,
        playBox: 'h-7 w-7 rounded-[0.85rem] border-b-[3px]',
        playIcon: 13,
        skipIcon: 14,
        skipBox: 'h-7 w-7',
        glassRadius: 'rounded-xl',
        transportGap: 'gap-2.5',
        artRadius: 'rounded-[1.15rem]',
        artMax: 'aspect-square h-[min(100%,5.75rem)] w-[min(100%,5.75rem)] shrink-0',
        vizMaxH: 18,
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
    nowPlayingLooksRaw,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      globalNp: state.nowPlaying || EMPTY_NOW_PLAYING,
      sessions: Array.isArray(state.systemMedia?.sessions)
        ? state.systemMedia.sessions
        : EMPTY_SYSTEM_SESSIONS,
      systemEnabled: state.ui.systemMediaEnabled !== false,
      systemAvailable: Boolean(state.systemMedia?.available),
      extractedColors: state.spotify?.extractedColors || null,
      nowPlayingLooksRaw: state.ui?.homeNowPlayingWidget,
    }))
  );

  const npLooks = useMemo(
    () => normalizeHomeNowPlayingWidget(nowPlayingLooksRaw),
    [nowPlayingLooksRaw]
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

  const showVisualizer =
    Boolean(npLooks.showVisualizer) &&
    Boolean(chrome.showVisualizer) &&
    hasTrack &&
    !interactionsLocked;

  const vizLevels = useMusicReactiveLevels({
    isPlaying,
    progressMs,
    durationMs,
    enabled: showVisualizer,
    bandCount: isWide || isCompact ? 8 : 12,
  });

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

  const statusLabel = isPlaying
    ? appName || 'Now Playing'
    : hasTrack
      ? 'Paused'
      : '';

  const progressRatio =
    durationMs > 0 ? Math.min(1, Math.max(0, progressMs / durationMs)) : 0;
  const showProgress =
    chrome.showProgress && hasTrack && durationMs > 0 && !interactionsLocked;

  const accentColor =
    extractedColors?.accent || extractedColors?.primary || 'hsl(var(--primary))';

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
    'border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-elevated)/0.82)] text-[hsl(var(--text-primary))] backdrop-blur-md',
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
            className="shrink-0 text-[hsl(var(--primary))]"
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
          className={`truncate font-black uppercase text-[hsl(var(--text-secondary))] ${chrome.artist}`}
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
                backgroundColor: accentColor,
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
        'relative shrink-0 overflow-hidden border border-[hsl(var(--color-pure-white)/0.32)]',
        'bg-[hsl(var(--surface-elevated)/0.35)] shadow-[var(--shadow-soft-hover)]',
        'ring-1 ring-[hsl(var(--color-pure-black)/0.18)]',
        chrome.artRadius,
        chrome.artMax || '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={albumArtUrl}
        alt=""
        className="pointer-events-none h-full w-full object-cover"
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
        !isImmersive && !isWide ? 'h-11 w-11' : '',
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

  const visualizerRow =
    showVisualizer && chrome.vizMaxH > 0 ? (
      <div className="relative z-10 flex w-full shrink-0 justify-center py-0.5">
        <MusicReactiveBars
          levels={vizLevels}
          color={accentColor}
          minHeightPx={3}
          maxHeightPx={chrome.vizMaxH}
          opacity={isPlaying ? 0.9 : 0.35}
          className="h-8"
        />
      </div>
    ) : null;

  const chromeCard = (
    <div className={glassPanelClass}>
      {trackMeta}
      {transportRow}
    </div>
  );

  /** Darkened enlarged album art + light blur — not a heavy color wash. */
  const ambientLayer = hasTrack ? (
    <>
      {hasArt ? (
        <img
          src={albumArtUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full scale-[1.18] object-cover blur-[10px]"
          draggable={false}
          decoding="async"
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: extractedColors?.primary
              ? `radial-gradient(ellipse 80% 70% at 50% 35%, ${extractedColors.primary}, transparent 70%)`
              : 'radial-gradient(ellipse 80% 65% at 50% 30%, hsl(var(--primary) / 0.22), transparent 70%)',
          }}
          aria-hidden
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[hsl(var(--color-pure-black)/0.48)]"
        aria-hidden
      />
      {extractedColors?.primary ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.1]"
          style={{
            background: `radial-gradient(ellipse 70% 55% at 50% 30%, ${extractedColors.primary}, transparent 68%)`,
          }}
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
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1">
          {floatingArt}
          {visualizerRow}
        </div>
        <div className="mt-auto flex w-full shrink-0 justify-center">{chromeCard}</div>
      </div>
    );
  } else if (isWide) {
    body = (
      <div
        className={`relative z-10 flex h-full min-h-0 w-full items-center ${chrome.stackPad}`}
      >
        <div className="flex h-full shrink-0 flex-col items-center justify-center gap-1">
          {floatingArt}
          {visualizerRow}
        </div>
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
