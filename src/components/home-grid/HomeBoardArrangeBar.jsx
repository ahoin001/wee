import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, CircleDashed } from 'lucide-react';
import { createWeeTransition, useWeeMotion } from '../../design/weeMotion';
import {
  WeeButton,
  WeeGlassPill,
  WeeGooeyIconButton,
  WeeGooeyStatusPill,
  WeePillFloorShadow,
  WeeSegmentedControl,
} from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useChannelNavigation } from '../../utils/useChannelOperations';
import { clearHomeBoardAck } from '../../utils/showHomeBoardAck';
import { setHomeBoardWallpaperPeek } from '../../utils/surfaceSceneActions';
import EditSceneTools from './EditSceneTools';

const MotionDiv = m.div;

const SCENE_TOOLS = [
  { value: 'wallpaper', label: 'Wallpaper', title: 'Gallery, blur, and darken' },
  { value: 'atmosphere', label: 'Atmosphere', title: 'Particles on this page' },
  { value: 'ribbon', label: 'Ribbon', title: 'Scope and wallpaper match' },
];

const STEPPER_ARROW_CLASS = 'h-8 w-8 disabled:cursor-not-allowed disabled:opacity-35';

/**
 * Page context inside the bar: Board needs it to place tiles, Scene needs it because
 * wallpaper can be scoped per page. Mounted only on channel boards so hub spaces
 * never take the navigation subscription.
 */
function BoardPageStepper({ spaceId, reducedMotion }) {
  const { navigation, nextPage, prevPage } = useChannelNavigation(spaceId);
  const totalPages = Math.max(1, Number(navigation.totalPages) || 1);
  const currentPage = Math.min(Math.max(0, Number(navigation.currentPage) || 0), totalPages - 1);

  if (totalPages < 2) return null;

  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Board page">
      <WeeGooeyIconButton
        size="sm"
        variant="ghost"
        reducedMotion={reducedMotion}
        className={STEPPER_ARROW_CLASS}
        aria-label="Previous page"
        onClick={prevPage}
      >
        <ChevronLeft size={15} strokeWidth={2.75} aria-hidden />
      </WeeGooeyIconButton>
      <span
        className="min-w-[2.5rem] text-center text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.1em] text-[hsl(var(--text-secondary))]"
        aria-live="polite"
      >
        {currentPage + 1}/{totalPages}
      </span>
      <WeeGooeyIconButton
        size="sm"
        variant="ghost"
        reducedMotion={reducedMotion}
        className={STEPPER_ARROW_CLASS}
        aria-label="Next page"
        onClick={nextPage}
      >
        <ChevronRight size={15} strokeWidth={2.75} aria-hidden />
      </WeeGooeyIconButton>
    </div>
  );
}

BoardPageStepper.propTypes = {
  spaceId: PropTypes.string.isRequired,
  reducedMotion: PropTypes.bool,
};

/**
 * Thin studio rail. Row one is context then exit; row two morphs with the mode.
 * Board tools themselves live on the selected tile (`ArrangeTileSatellite`).
 */
function HomeBoardArrangeBar({
  arrangeMode,
  sceneOnly = false,
  spaceId = 'home',
  punchMode,
  selectedSlotLabel = null,
  onTogglePunch,
  onDone,
}) {
  const reducedMotion = useReducedMotion();
  const { pillOpen, pillClose, tabTransition } = useWeeMotion();
  const transition = createWeeTransition('pillOpen', { reducedMotion });
  const arrangeOrigin = useConsolidatedAppStore((s) => s.ui?.homeBoardArrangeOrigin || null);
  const ack = useConsolidatedAppStore((s) => s.ui?.homeBoardAck || null);
  const [railMode, setRailMode] = useState(() => (sceneOnly ? 'scene' : 'board'));
  const [sceneTool, setSceneTool] = useState('wallpaper');
  const [trackedArrange, setTrackedArrange] = useState(arrangeMode);
  const [trackedSceneOnly, setTrackedSceneOnly] = useState(sceneOnly);

  /* Reset the rail when the bar reopens. Set during render on purpose — the React
     "adjust state when a prop changes" pattern, which avoids an effect's extra pass. */
  if (arrangeMode !== trackedArrange || sceneOnly !== trackedSceneOnly) {
    setTrackedArrange(arrangeMode);
    setTrackedSceneOnly(sceneOnly);
    if (arrangeMode) {
      setRailMode(sceneOnly ? 'scene' : 'board');
      setSceneTool('wallpaper');
    }
  }

  useEffect(() => {
    if (!ack?.label) return undefined;
    const timer = window.setTimeout(() => clearHomeBoardAck(), 1800);
    return () => window.clearTimeout(timer);
  }, [ack?.at, ack?.label]);

  const sceneOpen = sceneOnly || railMode === 'scene';

  useEffect(() => {
    if (!sceneOpen) setHomeBoardWallpaperPeek(null);
  }, [sceneOpen]);

  const flight = useMemo(() => {
    if (reducedMotion || !arrangeOrigin || typeof window === 'undefined') {
      return {
        initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 },
        animate: { opacity: 1, y: 0, scale: 1, x: 0 },
        exit: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 },
        transition,
      };
    }
    const destY = window.innerHeight - 108;
    const dx = arrangeOrigin.x - window.innerWidth / 2;
    const dy = arrangeOrigin.y - destY;
    return {
      initial: { opacity: 0.85, x: dx, y: dy, scale: 0.28 },
      animate: { opacity: 1, x: 0, y: 0, scale: 1 },
      exit: { opacity: 0.85, x: dx, y: dy, scale: 0.28, transition: pillClose },
      transition: pillOpen,
    };
  }, [arrangeOrigin, pillClose, pillOpen, reducedMotion, transition]);

  const selectRail = (id) => {
    if (id === 'scene' && punchMode) onTogglePunch?.();
    setRailMode(id);
    if (id === 'scene') setSceneTool('wallpaper');
    else setHomeBoardWallpaperPeek(null);
  };

  const handlePunchToggle = () => {
    if (!punchMode) {
      setRailMode('board');
      setHomeBoardWallpaperPeek(null);
    }
    onTogglePunch?.();
  };

  /* Board mode's tools live on the tile, so without this line the mode looks broken. */
  const boardHint = punchMode
    ? 'Click a tile to hide it from the board'
    : selectedSlotLabel
      ? `${selectedSlotLabel} selected — tools are on the tile`
      : 'Pick a tile to resize, restyle, or remove';

  const selectSceneTool = (id) => {
    if (id === sceneTool) {
      if (sceneOnly) return;
      setRailMode('board');
      setHomeBoardWallpaperPeek(null);
      return;
    }
    setSceneTool(id);
  };

  return (
    <>
      <WeeGooeyStatusPill
        open={Boolean(ack?.label)}
        label={ack?.label}
        icon="dot"
        origin={ack?.origin}
      />
      <AnimatePresence>
        {arrangeMode ? (
          <MotionDiv
            key="home-board-arrange-bar"
            className="pointer-events-none fixed inset-x-0 bottom-[max(6.75rem,calc(env(safe-area-inset-bottom)+5.75rem))] z-[var(--z-home-arrange-bar)] flex justify-center px-4"
            initial={flight.initial}
            animate={flight.animate}
            exit={flight.exit}
            transition={flight.transition}
          >
            <WeeGlassPill
              motion
              layout
              transition={transition}
              className="pointer-events-auto relative flex w-[min(92vw,34rem)] max-w-full flex-col items-stretch rounded-[var(--wee-radius-pill)] px-3 py-2.5"
            >
              <WeePillFloorShadow expanded={sceneOpen} reducedMotion={reducedMotion} />
              <div className="relative z-[1] flex flex-col gap-2.5">
                {/* Row one: what you are editing, where you are, and the way out. */}
                <div className="flex items-center justify-between gap-2">
                  {sceneOnly ? (
                    <span />
                  ) : (
                    <WeeSegmentedControl
                      size="sm"
                      ariaLabel="Edit mode"
                      layoutId="homeArrangeRail"
                      value={railMode}
                      onChange={selectRail}
                      options={[
                        { value: 'board', label: 'Board' },
                        { value: 'scene', label: 'Scene' },
                      ]}
                    />
                  )}
                  {sceneOnly ? null : (
                    <BoardPageStepper spaceId={spaceId} reducedMotion={Boolean(reducedMotion)} />
                  )}
                  <WeeButton variant="primary" size="sm" onClick={onDone}>
                    <span className="flex items-center gap-1.5">
                      <Check size={13} strokeWidth={3} aria-hidden />
                      Done
                    </span>
                  </WeeButton>
                </div>

                {/* Row two morphs with the mode. `popLayout` pulls the leaving row out of
                    flow so the pill's `layout` plays one height morph instead of a pump —
                    which needs this wrapper to be the positioning context. */}
                <div className="relative flex flex-col border-t border-[hsl(var(--border-primary)/0.25)] pt-2.5">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {sceneOpen ? (
                      <MotionDiv
                        key="scene"
                        className="flex flex-col gap-2.5"
                        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                        transition={tabTransition}
                      >
                        <div className="flex justify-center">
                          <WeeSegmentedControl
                            size="sm"
                            ariaLabel="Scene tools"
                            layoutId="homeArrangeSceneTool"
                            value={sceneTool}
                            onChange={selectSceneTool}
                            options={SCENE_TOOLS}
                          />
                        </div>
                        <AnimatePresence mode="wait" initial={false}>
                          <MotionDiv
                            key={sceneTool}
                            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                            transition={tabTransition}
                          >
                            <EditSceneTools spaceId={spaceId} tool={sceneTool} />
                          </MotionDiv>
                        </AnimatePresence>
                      </MotionDiv>
                    ) : (
                      <MotionDiv
                        key="board"
                        className="flex items-center justify-between gap-3"
                        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                        transition={tabTransition}
                      >
                        <span
                          className="min-w-0 flex-1 text-[length:var(--font-size-caption)] font-semibold text-[hsl(var(--text-tertiary))]"
                          aria-live="polite"
                        >
                          {boardHint}
                        </span>
                        <WeeButton
                          variant="secondary"
                          size="sm"
                          active={punchMode}
                          onClick={handlePunchToggle}
                          title={
                            punchMode
                              ? 'Stop punching holes'
                              : 'Hide tiles to open gaps in the board'
                          }
                        >
                          <span className="flex items-center gap-1.5">
                            <CircleDashed size={13} strokeWidth={2.75} aria-hidden />
                            Punch
                          </span>
                        </WeeButton>
                      </MotionDiv>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </WeeGlassPill>
          </MotionDiv>
        ) : null}
      </AnimatePresence>
    </>
  );
}

HomeBoardArrangeBar.propTypes = {
  arrangeMode: PropTypes.bool.isRequired,
  sceneOnly: PropTypes.bool,
  spaceId: PropTypes.string,
  punchMode: PropTypes.bool.isRequired,
  /** Kind label of the selected tile, so Board mode can say what is in hand. */
  selectedSlotLabel: PropTypes.string,
  onTogglePunch: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
};

export default React.memo(HomeBoardArrangeBar);
