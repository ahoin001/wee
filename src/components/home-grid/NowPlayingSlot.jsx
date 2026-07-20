/**
 * Home-grid Now Playing — immersive album-matched player.
 * Hero: true-square floating cover over atmosphere (or optional blur) backdrop.
 * Inline: square cover docked in the glass panel beside transport.
 * Single-row (wide): large crisp cover + glass strip; atmosphere wash, not grainy blur.
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
 * Per-size chrome. Album art sizing is height-led for tall tiles so covers stay square.
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
        showTimestamps: false,
        showVisualizer: false,
        playBox: 'h-6 w-6 rounded-lg border-b-2',
        playIcon: 11,
        skipIcon: 12,
        skipBox: 'h-6 w-6',
        glassRadius: 'rounded-lg',
        transportGap: 'gap-2',
        artRadius: 'rounded-xl',
        /** Height-led square — never width+max-h which collapses to a pill. */
        artHeroClass: 'aspect-square h-[min(100%,2.75rem)] w-auto max-w-full',
        artInlineClass: 'aspect-square h-10 w-10 shrink-0',
        vizMaxH: 0,
      };
    case 'T':
      return {
        layout: 'immersive',
        stackPad: 'gap-1.5 p-2',
        glassPad: 'gap-0.5 px-3 py-1.5',
        glassWidth: 'w-full',
        title: 'text-xs leading-snug sm:text-sm',
        artist: 'text-[8px] tracking-[0.16em]',
        showArtist: true,
        showProgress: true,
        showTimestamps: false,
        showVisualizer: true,
        playBox: 'h-8 w-8 rounded-[0.9rem] border-b-[4px] sm:h-9 sm:w-9',
        playIcon: 14,
        skipIcon: 16,
        skipBox: 'h-7 w-7',
        glassRadius: 'rounded-2xl',
        transportGap: 'gap-2.5',
        artRadius: 'rounded-[1.35rem]',
        artHeroClass: 'aspect-square h-[min(100%,10.5rem)] w-auto max-w-[92%]',
        artInlineClass: 'aspect-square h-[4.25rem] w-[4.25rem] shrink-0',
        vizMaxH: 22,
      };
    case 'V':
      return {
        layout: 'immersive',
        stackPad: 'gap-2 p-2.5',
        glassPad: 'gap-1 px-3.5 py-2',
        glassWidth: 'w-full',
        title: 'text-sm leading-snug',
        artist: 'text-[9px] tracking-[0.16em]',
        showArtist: true,
        showProgress: true,
        showTimestamps: true,
        showVisualizer: true,
        playBox: 'h-9 w-9 rounded-[1.05rem] border-b-[5px]',
        playIcon: 16,
        skipIcon: 17,
        skipBox: 'h-8 w-8',
        glassRadius: 'rounded-[1.35rem]',
        transportGap: 'gap-3',
        artRadius: 'rounded-[1.5rem]',
        artHeroClass: 'aspect-square h-[min(100%,13rem)] w-auto max-w-[90%]',
        artInlineClass: 'aspect-square h-[4.75rem] w-[4.75rem] shrink-0',
        vizMaxH: 26,
      };
    case 'L':
      return {
        layout: 'immersive',
        stackPad: 'gap-2 p-2.5',
        glassPad: 'gap-1 px-3.5 py-2',
        glassWidth: 'w-full',
        title: 'text-sm leading-snug sm:text-base',
        artist: 'text-[9px] tracking-[0.18em]',
        showArtist: true,
        showProgress: true,
        showTimestamps: true,
        showVisualizer: true,
        playBox: 'h-9 w-9 rounded-[1.05rem] border-b-[5px] sm:h-10 sm:w-10',
        playIcon: 17,
        skipIcon: 18,
        skipBox: 'h-8 w-8',
        glassRadius: 'rounded-[1.35rem]',
        transportGap: 'gap-3',
        artRadius: 'rounded-[1.65rem]',
        artHeroClass: 'aspect-square h-[min(100%,12.5rem)] w-auto max-w-[78%]',
        artInlineClass: 'aspect-square h-20 w-20 shrink-0',
        vizMaxH: 28,
      };
    case 'W':
      return {
        layout: 'immersive',
        stackPad: 'gap-2 p-2.5',
        glassPad: 'gap-1 px-4 py-2',
        glassWidth: 'w-full',
        title: 'text-base leading-snug',
        artist: 'text-[10px] tracking-[0.18em]',
        showArtist: true,
        showProgress: true,
        showTimestamps: true,
        showVisualizer: true,
        playBox: 'h-10 w-10 rounded-[1.1rem] border-b-[5px]',
        playIcon: 18,
        skipIcon: 18,
        skipBox: 'h-9 w-9',
        glassRadius: 'rounded-[1.45rem]',
        transportGap: 'gap-3.5',
        artRadius: 'rounded-[1.75rem]',
        artHeroClass: 'aspect-square h-[min(100%,14rem)] w-auto max-w-[48%]',
        artInlineClass: 'aspect-square h-[5.25rem] w-[5.25rem] shrink-0',
        vizMaxH: 30,
      };
    case 'XL':
      return {
        layout: 'immersive',
        stackPad: 'gap-2.5 p-3',
        glassPad: 'gap-1 px-4 py-2.5',
        glassWidth: 'w-full',
        title: 'text-base leading-snug sm:text-lg',
        artist: 'text-[10px] tracking-[0.2em]',
        showArtist: true,
        showProgress: true,
        showTimestamps: true,
        showVisualizer: true,
        playBox: 'h-11 w-11 rounded-[1.15rem] border-b-[5px]',
        playIcon: 19,
        skipIcon: 20,
        skipBox: 'h-9 w-9',
        glassRadius: 'rounded-[1.55rem]',
        transportGap: 'gap-4',
        artRadius: 'rounded-[1.85rem]',
        artHeroClass: 'aspect-square h-[min(100%,15rem)] w-auto max-w-[58%]',
        artInlineClass: 'aspect-square h-24 w-24 shrink-0',
        vizMaxH: 34,
      };
    case 'M':
    default:
      return {
        layout: 'wide',
        stackPad: 'gap-2.5 p-1.5 sm:p-2',
        glassPad: 'gap-0.5 px-3 py-1.5',
        glassWidth: 'w-full min-w-0',
        title: 'text-[11px] leading-snug sm:text-xs',
        artist: 'text-[8px] tracking-[0.14em]',
        showArtist: true,
        showProgress: true,
        showTimestamps: false,
        showVisualizer: true,
        playBox: 'h-7 w-7 rounded-[0.85rem] border-b-[3px]',
        playIcon: 13,
        skipIcon: 14,
        skipBox: 'h-7 w-7',
        glassRadius: 'rounded-2xl',
        transportGap: 'gap-2.5',
        artRadius: 'rounded-[1.25rem]',
        /** Nearly fills the single board row so the cover is the hero, not a thumbnail. */
        artHeroClass: 'aspect-square h-full max-h-full w-auto max-w-[min(100%,9.5rem)]',
        artInlineClass: 'aspect-square h-14 w-14 shrink-0',
        vizMaxH: 18,
      };
  }
}

function AlbumCover({
  url,
  radiusClass,
  sizeClass,
  extractedColors,
  placeholderIconSize = 28,
}) {
  if (url) {
    return (
      <div
        className={[
          'relative overflow-hidden border border-[hsl(var(--color-pure-white)/0.28)]',
          'bg-[hsl(var(--surface-elevated)/0.35)] shadow-[var(--shadow-soft-hover)]',
          'ring-1 ring-[hsl(var(--color-pure-black)/0.16)]',
          radiusClass,
          sizeClass,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <img
          src={url}
          alt=""
          className="pointer-events-none h-full w-full object-cover object-center"
          draggable={false}
          decoding="async"
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_hsl(var(--color-pure-white)/0.22)]"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className={[
        'relative flex items-center justify-center overflow-hidden border border-[hsl(var(--border-primary)/0.3)]',
        'bg-[hsl(var(--surface-elevated)/0.55)] shadow-[var(--shadow-soft)]',
        radiusClass,
        sizeClass,
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
        size={placeholderIconSize}
        strokeWidth={2.25}
        className="text-[hsl(var(--color-pure-white)/0.88)]"
        aria-hidden
      />
    </div>
  );
}

AlbumCover.propTypes = {
  url: PropTypes.string,
  radiusClass: PropTypes.string,
  sizeClass: PropTypes.string,
  extractedColors: PropTypes.object,
  placeholderIconSize: PropTypes.number,
};

/**
 * Soft album-palette wash — lets wallpaper breathe; no grainy enlarged cover.
 * Extracted Spotify/system colors are runtime hex from the API (allowed as paint inputs).
 */
function NowPlayingAtmosphere({ extractedColors }) {
  const primary = extractedColors?.primary || null;
  const secondary = extractedColors?.secondary || primary;
  const accent = extractedColors?.accent || primary;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[hsl(var(--surface-primary)/0.22)]"
        aria-hidden
      />
      {primary ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              background: `radial-gradient(ellipse 95% 140% at 6% 50%, color-mix(in srgb, ${primary} 62%, transparent), transparent 64%)`,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              background: `radial-gradient(ellipse 75% 120% at 96% 42%, color-mix(in srgb, ${secondary} 40%, transparent), transparent 58%)`,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              background: `radial-gradient(ellipse 55% 90% at 58% 108%, color-mix(in srgb, ${accent} 30%, transparent), transparent 55%)`,
            }}
            aria-hidden
          />
        </>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background:
              'radial-gradient(ellipse 85% 110% at 18% 50%, hsl(var(--primary) / 0.32), transparent 62%)',
          }}
          aria-hidden
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-[hsl(var(--color-pure-white)/0.14)] via-transparent to-[hsl(var(--color-pure-black)/0.14)]"
        aria-hidden
      />
    </>
  );
}

NowPlayingAtmosphere.propTypes = {
  extractedColors: PropTypes.object,
};

/**
 * Classic enlarged + blurred album wash (optional Looks mode).
 */
function NowPlayingBlurBackdrop({ albumArtUrl, blurPx, darken, extractedColors }) {
  return (
    <>
      <img
        src={albumArtUrl}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.22] object-cover"
        style={{ filter: `blur(${blurPx}px)` }}
        draggable={false}
        decoding="async"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ backgroundColor: `hsl(var(--color-pure-black) / ${darken})` }}
        aria-hidden
      />
      {extractedColors?.primary ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.22]"
          style={{
            background: `radial-gradient(ellipse 75% 60% at 50% 28%, ${extractedColors.primary}, transparent 70%)`,
          }}
          aria-hidden
        />
      ) : null}
    </>
  );
}

NowPlayingBlurBackdrop.propTypes = {
  albumArtUrl: PropTypes.string.isRequired,
  blurPx: PropTypes.number.isRequired,
  darken: PropTypes.number.isRequired,
  extractedColors: PropTypes.object,
};

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
  const useInlineArt = npLooks.artLayout === 'inline' && !isCompact;
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

  const glassPanelStyle = useMemo(() => {
    if (!extractedColors?.primary) return undefined;
    const primary = extractedColors.primary;
    const secondary = extractedColors.secondary || primary;
    return {
      background: `linear-gradient(155deg, color-mix(in srgb, ${primary} 22%, hsl(var(--surface-elevated) / 0.9)), color-mix(in srgb, ${secondary} 12%, hsl(var(--surface-elevated) / 0.86)))`,
      borderColor: `color-mix(in srgb, ${primary} 35%, hsl(var(--border-primary) / 0.45))`,
    };
  }, [extractedColors]);

  const glassPanelClass = [
    'relative z-10 flex border shadow-[var(--shadow-soft)]',
    chrome.glassRadius,
    chrome.glassPad,
    chrome.glassWidth,
    'border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-elevated)/0.88)] text-[hsl(var(--text-primary))] backdrop-blur-md',
    useInlineArt ? 'flex-row items-stretch gap-2.5' : 'flex-col',
  ].join(' ');

  const transportRow = showTransport ? (
    <div
      className={`relative z-10 mt-0.5 flex items-center justify-center ${chrome.transportGap}`}
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
      className="flex w-full min-w-0 flex-col gap-0.5 text-left outline-none"
      onClick={handleActivate}
      disabled={interactionsLocked && !arrangeMode}
      aria-label={`Now playing: ${trackName} by ${artistLine}`}
    >
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

  const heroArt = (
    <AlbumCover
      url={hasArt ? albumArtUrl : ''}
      radiusClass={chrome.artRadius}
      sizeClass={chrome.artHeroClass}
      extractedColors={extractedColors}
      placeholderIconSize={isImmersive ? 36 : isWide ? 22 : 18}
    />
  );

  const inlineArt = (
    <AlbumCover
      url={hasArt ? albumArtUrl : ''}
      radiusClass={chrome.artRadius}
      sizeClass={`${chrome.artInlineClass} self-center`}
      extractedColors={extractedColors}
      placeholderIconSize={22}
    />
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
    <div className={glassPanelClass} style={glassPanelStyle}>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {trackMeta}
        {transportRow}
      </div>
      {useInlineArt ? inlineArt : null}
    </div>
  );

  const blurPx = npLooks.backdropBlur;
  const darken = npLooks.backdropDarken;
  const useBlurBackdrop = npLooks.backdropMode === 'blur';

  /** Atmosphere (default) or optional blurred cover wash from Looks. */
  const ambientLayer = hasTrack ? (
    useBlurBackdrop && hasArt ? (
      <NowPlayingBlurBackdrop
        albumArtUrl={albumArtUrl}
        blurPx={blurPx}
        darken={darken}
        extractedColors={extractedColors}
      />
    ) : (
      <NowPlayingAtmosphere extractedColors={extractedColors} />
    )
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
  } else if (useInlineArt) {
    body = (
      <div className={`relative z-10 flex h-full min-h-0 w-full flex-col justify-center ${chrome.stackPad}`}>
        {visualizerRow}
        <div className="flex w-full shrink-0">{chromeCard}</div>
      </div>
    );
  } else if (isImmersive) {
    body = (
      <div className={`relative z-10 flex h-full min-h-0 w-full flex-col ${chrome.stackPad}`}>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5">
          {heroArt}
          {visualizerRow}
        </div>
        <div className="mt-auto flex w-full shrink-0">{chromeCard}</div>
      </div>
    );
  } else if (isWide) {
    body = (
      <div
        className={`relative z-10 flex h-full min-h-0 w-full items-stretch ${chrome.stackPad}`}
      >
        <div className="flex h-full shrink-0 items-center justify-center">
          {heroArt}
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-1 pl-2 sm:pl-3">
          {visualizerRow}
          {chromeCard}
        </div>
      </div>
    );
  } else {
    body = (
      <div className={`relative z-10 flex h-full min-h-0 w-full flex-col justify-end ${chrome.stackPad}`}>
        {hasArt || extractedColors?.primary ? (
          <div className="mb-1 flex justify-center">{heroArt}</div>
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
