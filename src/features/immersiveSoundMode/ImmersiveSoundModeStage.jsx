import React, { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useWeeMotion } from '../../design/weeMotion';
import { useMusicReactiveLevels } from '../../hooks/useMusicReactiveLevels';
import useAnimationActivity from '../../hooks/useAnimationActivity';
import WButton from '../../ui/WButton';
import {
  normalizeImmersiveSoundMode,
  resolveImmersiveSoundLook,
} from './immersiveSoundModePrefs.js';
import { exitImmersiveSoundMode } from './immersiveSoundModeApi.js';
import {
  defaultNowPlayingAlbumPaint,
  resolveNowPlayingAlbumPaint,
} from '../../utils/nowPlayingAlbumPaint.js';

const EMPTY_NOW_PLAYING = Object.freeze({});

/**
 * Full-screen Listening Stage.
 * Album-art palette text/accents are always applied (not toggleable).
 */
function ImmersiveSoundModeStage() {
  const { active, rawPrefs, np, extractedColors } = useConsolidatedAppStore(
    useShallow((state) => ({
      active: Boolean(state.ui?.immersiveSoundModeActive),
      rawPrefs: state.ui?.immersiveSoundMode,
      np: state.nowPlaying || EMPTY_NOW_PLAYING,
      extractedColors: state.spotify?.extractedColors || null,
    }))
  );
  const prefs = useMemo(() => normalizeImmersiveSoundMode(rawPrefs), [rawPrefs]);

  const look = useMemo(() => resolveImmersiveSoundLook(prefs.intensity), [prefs.intensity]);
  const paint = useMemo(
    () => resolveNowPlayingAlbumPaint(extractedColors) || defaultNowPlayingAlbumPaint(),
    [extractedColors]
  );
  const { reducedMotion, createTransition } = useWeeMotion();
  const { shouldAnimate } = useAnimationActivity({ activeFps: 30, lowPowerFps: 12 });

  const {
    trackName = '',
    artistLine = '',
    albumArtUrl = '',
    isPlaying = false,
    controlsVia = null,
    progressMs = 0,
    durationMs = 0,
  } = np;

  const useSystemKeys = controlsVia === 'system-keys';
  const showBars = look.showBars && Boolean(trackName);
  const vizLevels = useMusicReactiveLevels({
    isPlaying,
    progressMs,
    durationMs,
    enabled: showBars && active && shouldAnimate && !reducedMotion,
    bandCount: 10,
  });

  const runTransport = useCallback(async (action) => {
    if (!useSystemKeys) return;
    try {
      await window.api?.systemMedia?.transport?.(action);
    } catch {
      // Best-effort media keys.
    }
  }, [useSystemKeys]);

  const handleExit = useCallback(() => {
    exitImmersiveSoundMode(useConsolidatedAppStore);
  }, []);

  const stageTransition = useMemo(
    () => createTransition('modalBackdrop'),
    [createTransition]
  );

  const breathScale = isPlaying && !reducedMotion && shouldAnimate
    ? 1 + look.breathAmount
    : 1;

  const particles = useMemo(() => {
    if (!look.particleCount || reducedMotion) return [];
    return Array.from({ length: look.particleCount }, (_, i) => ({
      id: i,
      left: `${(i * 37) % 100}%`,
      top: `${(i * 53) % 100}%`,
      size: 2 + (i % 4),
      delay: (i % 8) * 0.35,
      duration: 6 + (i % 5),
    }));
  }, [look.particleCount, reducedMotion]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {active ? (
        <m.div
          key="immersive-sound-stage"
          role="dialog"
          aria-modal="true"
          aria-label="Listening Stage"
          className="pointer-events-auto fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden"
          style={paint.cssVars}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={stageTransition}
          onClick={handleExit}
        >
          <div
            className="absolute inset-0 bg-[hsl(var(--bg-primary))]"
            style={{ opacity: prefs.boardDim }}
            aria-hidden
          />

          {prefs.coverBackdrop && albumArtUrl ? (
            <div
              className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center"
              style={{
                backgroundImage: `url(${albumArtUrl})`,
                filter: `blur(${look.artBlurPx}px) saturate(1.15)`,
                transform: `scale(${look.artScale})`,
                opacity: 0.55,
              }}
              aria-hidden
            />
          ) : null}

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 70% 55% at 50% 42%, color-mix(in srgb, ${paint.primary} ${Math.round(look.glowStrength * 100)}%, transparent), transparent 70%)`,
            }}
            aria-hidden
          />

          {particles.length > 0 && shouldAnimate ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              {particles.map((p) => (
                <span
                  key={p.id}
                  className="absolute rounded-full bg-[hsl(var(--color-pure-white)/0.35)]"
                  style={{
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    animation: `ism-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
                  }}
                />
              ))}
            </div>
          ) : null}

          <div
            className="absolute right-6 top-6 z-10"
            onClick={(event) => event.stopPropagation()}
          >
            <WButton
              variant="secondary"
              size="sm"
              onClick={handleExit}
              aria-label="Exit Listening Stage"
              className="gap-2"
            >
              <X size={16} aria-hidden />
              Exit
            </WButton>
          </div>

          <div className="relative z-[1] flex max-w-[min(92vw,28rem)] flex-col items-center gap-6 px-6 text-center">
            <m.div
              className="relative overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-soft-hover)]"
              style={{
                width: `${look.coverSizeRem}rem`,
                height: `${look.coverSizeRem}rem`,
                boxShadow: `0 0 ${28 + look.glowStrength * 40}px color-mix(in srgb, ${paint.primary} ${Math.round(look.glowStrength * 85)}%, transparent)`,
              }}
              animate={{ scale: breathScale }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 2.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
              }
            >
              {albumArtUrl ? (
                <img
                  src={albumArtUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-tertiary))]">
                  No art
                </div>
              )}
            </m.div>

            <div
              className="min-w-0 max-w-full space-y-1.5 rounded-[1.35rem] px-5 py-3"
              style={{
                background: `color-mix(in srgb, ${paint.primary} 16%, hsl(var(--surface-elevated) / 0.42))`,
                border: `1px solid color-mix(in srgb, ${paint.primary} 28%, hsl(var(--border-primary) / 0.35))`,
                backdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <p
                className="m-0 truncate text-[clamp(1.15rem,3.2vw,1.65rem)] font-black tracking-tight"
                style={{ color: paint.text, textShadow: paint.textShadow }}
              >
                {trackName || 'Nothing playing'}
              </p>
              {artistLine ? (
                <p
                  className="m-0 truncate text-[0.95rem] font-semibold"
                  style={{ color: paint.textSecondary, textShadow: paint.textShadow }}
                >
                  {artistLine}
                </p>
              ) : null}
              <p
                className="m-0 pt-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: paint.textTertiary }}
              >
                {prefs.intensity} · Listening Stage
              </p>
            </div>

            {showBars ? (
              <div className="flex h-10 items-end justify-center gap-1" aria-hidden>
                {vizLevels.map((level, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full"
                    style={{
                      height: `${Math.max(12, Math.round(level * 100))}%`,
                      opacity: 0.55 + level * 0.45,
                      backgroundColor: paint.accent,
                    }}
                  />
                ))}
              </div>
            ) : null}

            <div
              className="flex items-center gap-3"
              onClick={(event) => event.stopPropagation()}
              role="group"
              aria-label="Playback controls"
            >
              <WButton
                variant="secondary"
                size="sm"
                disabled={!useSystemKeys}
                onClick={() => void runTransport('previous')}
                aria-label="Previous track"
              >
                <SkipBack size={18} aria-hidden />
              </WButton>
              <WButton
                variant="primary"
                size="md"
                disabled={!useSystemKeys}
                onClick={() => void runTransport('playPause')}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                style={{
                  backgroundColor: paint.text,
                  color: paint.primary,
                  borderColor: `color-mix(in srgb, ${paint.text} 40%, transparent)`,
                }}
              >
                {isPlaying ? <Pause size={20} aria-hidden /> : <Play size={20} aria-hidden />}
              </WButton>
              <WButton
                variant="secondary"
                size="sm"
                disabled={!useSystemKeys}
                onClick={() => void runTransport('next')}
                aria-label="Next track"
              >
                <SkipForward size={18} aria-hidden />
              </WButton>
            </div>
          </div>

          <style>{`
            @keyframes ism-float {
              0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.15; }
              50% { transform: translate3d(0, -18px, 0); opacity: 0.55; }
            }
          `}</style>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export default React.memo(ImmersiveSoundModeStage);
