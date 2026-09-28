import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, CircleDashed } from 'lucide-react';
import { createWeeTransition, useWeeMotion } from '../../design/weeMotion';
import {
  WeeButton,
  WeeContentCollapse,
  WeeGlassPill,
  WeeGooeyIconButton,
  WeeGooeyStatusPill,
  WeeMorphStack,
  WeePillFloorShadow,
  WeeSegmentedControl,
} from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { clearHomeBoardAck } from '../../utils/showHomeBoardAck';
import { setHomeBoardWallpaperPeek } from '../../utils/surfaceSceneActions';
import EditSceneTools from './EditSceneTools';

const MotionDiv = m.div;

const SCENE_TOOLS = [
  { value: 'wallpaper', label: 'Wallpaper', title: 'Gallery, blur, and darken' },
  { value: 'atmosphere', label: 'Atmosphere', title: 'Particles on this page' },
  { value: 'ribbon', label: 'Ribbon', title: 'Scope and wallpaper match' },
];

/**
 * Thin studio rail. Board tools live on the tile; Scene morphs open.
 */
function HomeBoardArrangeBar({
  arrangeMode,
  sceneOnly = false,
  spaceId = 'home',
  punchMode,
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
              transition={reducedMotion ? { duration: 0.12 } : pillOpen}
              className="pointer-events-auto relative flex w-max max-w-[min(96vw,36rem)] flex-col items-stretch rounded-[2rem] px-3 py-2.5"
            >
              <WeePillFloorShadow expanded={sceneOpen} reducedMotion={reducedMotion} />
              <WeeMorphStack
                open={sceneOpen}
                gapOpen="gap-2.5"
                gapClosed="gap-0"
                className="relative z-[1]"
              >
                <div className="flex items-center justify-center gap-2">
                  {sceneOnly ? null : (
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
                    <WeeGooeyIconButton
                      size="sm"
                      variant="outline"
                      active={punchMode}
                      layoutId="homeArrangePunch"
                      reducedMotion={reducedMotion}
                      aria-label={punchMode ? 'Stop punching holes' : 'Punch holes'}
                      title={punchMode ? 'Stop punching holes' : 'Punch holes in the board'}
                      onClick={handlePunchToggle}
                    >
                      <span className="relative z-10 flex">
                        <CircleDashed size={16} strokeWidth={2.5} aria-hidden />
                      </span>
                    </WeeGooeyIconButton>
                  )}
                  <WeeButton variant="primary" size="sm" onClick={onDone}>
                    <span className="flex items-center gap-1.5">
                      <Check size={13} strokeWidth={3} aria-hidden />
                      Done
                    </span>
                  </WeeButton>
                </div>

                <WeeContentCollapse open={sceneOpen} keepMounted>
                  <div className="flex w-[min(92vw,34rem)] max-w-full flex-col gap-2.5 border-t border-[hsl(var(--border-primary)/0.25)] pt-2.5">
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
                  </div>
                </WeeContentCollapse>
              </WeeMorphStack>
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
  onTogglePunch: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
};

export default React.memo(HomeBoardArrangeBar);
