import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, LayoutGroup, m } from 'framer-motion';
import { Clapperboard, Gamepad2, Home, Pin, PinOff, Wand2 } from 'lucide-react';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  DEFAULT_SHELL_SPACE_ORDER,
  normalizeShellSpaceOrder,
  resolveActiveChannelSpaceKey,
} from '../../utils/channelSpaces';
import useChannelOperations from '../../utils/useChannelOperations';
import {
  useWeeMotion,
  createWeeShellRailContainerVariants,
  createWeeShellRailItemVariants,
  getWeeShellChromeEntrance,
  createWeeTransition,
} from '../../design/weeMotion';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import {
  WeeGlassPill,
  WeeGooeyIconButton,
  WeePillFloorShadow,
} from '../../ui/wee';

const MotionDiv = m.div;

const SPACE_META = {
  home: { label: 'Home', Icon: Home },
  mediahub: { label: 'Media', Icon: Clapperboard },
  gamehub: { label: 'Games', Icon: Gamepad2 },
};

/**
 * Expanded rail footprint — must match WeeGooeyIconButton sizes + flex gap/padding
 * in the open column (wand + pin are real actions, not free “+120” slack).
 */
const SPACE_RAIL_LAYOUT = Object.freeze({
  spaceBtn: 56, // size lg
  wandBtn: 56, // size lg
  pinBtn: 48, // size md
  gapComfortable: 8, // gap-2
  gapCompact: 6, // gap-1.5
  padTopComfortable: 20, // pt-5
  padBottomComfortable: 20, // pb-5
  padTopCompact: 14,
  padBottomCompact: 14,
  dividerH: 4, // h-1
  dividerMarginYComfortable: 8, // my-1
  dividerMarginYCompact: 4,
  borderY: 8, // border-4 top + bottom (border-box)
  viewportMargin: 16,
  actionSlotCount: 3, // divider + wand + pin
});

function computeSpaceRailContentHeight(spaceCount, density = 'comfortable') {
  const compact = density === 'compact';
  const gap = compact ? SPACE_RAIL_LAYOUT.gapCompact : SPACE_RAIL_LAYOUT.gapComfortable;
  const padTop = compact
    ? SPACE_RAIL_LAYOUT.padTopCompact
    : SPACE_RAIL_LAYOUT.padTopComfortable;
  const padBottom = compact
    ? SPACE_RAIL_LAYOUT.padBottomCompact
    : SPACE_RAIL_LAYOUT.padBottomComfortable;
  const dividerMargin = compact
    ? SPACE_RAIL_LAYOUT.dividerMarginYCompact
    : SPACE_RAIL_LAYOUT.dividerMarginYComfortable;
  const children = spaceCount + SPACE_RAIL_LAYOUT.actionSlotCount;
  const gaps = Math.max(0, children - 1) * gap;
  return (
    SPACE_RAIL_LAYOUT.borderY +
    padTop +
    padBottom +
    spaceCount * SPACE_RAIL_LAYOUT.spaceBtn +
    SPACE_RAIL_LAYOUT.dividerH +
    dividerMargin +
    SPACE_RAIL_LAYOUT.wandBtn +
    SPACE_RAIL_LAYOUT.pinBtn +
    gaps
  );
}

/** Max pill height that stays fully on-screen given vertical center + left-nav nudge. */
function maxSpaceRailViewportHeight(viewportH, nudgeY = 0) {
  const margin = SPACE_RAIL_LAYOUT.viewportMargin;
  const center = viewportH / 2 + nudgeY;
  const half = Math.min(center - margin, viewportH - margin - center);
  return Math.max(SPACE_RAIL_LAYOUT.spaceBtn * 2, half * 2);
}

function getNextSpace(order, currentId, delta) {
  if (!Array.isArray(order) || order.length === 0) return currentId;
  const currentIndex = Math.max(0, order.indexOf(currentId));
  const nextIndex = (currentIndex + delta + order.length) % order.length;
  return order[nextIndex];
}

function SortableSpaceRow({
  space,
  i,
  activeSpaceId,
  itemVariants,
  reducedMotion,
  onSelectSpace,
  onRailSpacePointerEnter,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: space.id,
  });
  const Icon = space.Icon;
  const active = space.id === activeSpaceId;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex w-full max-w-[5.5rem] shrink-0 items-center justify-center"
    >
      <WeeGooeyIconButton
        {...listeners}
        {...attributes}
        custom={i}
        variants={itemVariants}
        initial="closed"
        animate="open"
        exit="closed"
        active={active}
        layoutId="pillActive"
        reducedMotion={reducedMotion}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSpace(space.id);
        }}
        onPointerEnter={() => onRailSpacePointerEnter?.(space.id)}
        title={`${space.label} — click to switch; drag to reorder`}
        aria-label={`${space.label}: switch space or drag to reorder`}
        className="group/row touch-none cursor-grab active:cursor-grabbing"
      >
        <Icon
          size={22}
          strokeWidth={2}
          className={`relative z-10 ${
            active
              ? 'text-[hsl(var(--primary))]'
              : 'text-[hsl(var(--text-tertiary))] group-hover/row:text-[hsl(var(--text-primary))]'
          }`}
          aria-hidden
        />
        <span className="pointer-events-none absolute left-full z-50 ml-4 whitespace-nowrap rounded-xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] px-4 py-2 text-[10px] font-black uppercase italic tracking-widest text-[hsl(var(--text-primary))] opacity-0 shadow-[var(--shadow-xl)] transition-all group-hover/row:translate-x-0 group-hover/row:opacity-100 -translate-x-2">
          {space.label}
        </span>
      </WeeGooeyIconButton>
    </div>
  );
}

export default function WeeGooeySpacePill() {
  const {
    activeSpaceId,
    railEnabled,
    autoHideRail,
    railPinned,
    railVisible,
    isTransitioning,
    order,
    setSpacesState,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      activeSpaceId: state.spaces.activeSpaceId,
      railEnabled: state.spaces.railEnabled ?? true,
      autoHideRail: state.spaces.autoHideRail,
      railPinned: state.spaces.railPinned,
      railVisible: state.spaces.railVisible,
      isTransitioning: state.spaces.isTransitioning,
      order: state.spaces.order,
      setSpacesState: state.actions.setSpacesState,
    }))
  );

  const gameHubChunkPrefetched = useRef(false);
  const mediaHubChunkPrefetched = useRef(false);
  const handleRailSpacePointerEnter = useCallback((spaceId) => {
    if (spaceId === 'gamehub' && !gameHubChunkPrefetched.current) {
      gameHubChunkPrefetched.current = true;
      import('../../components/game-hub').catch(() => {});
      return;
    }
    if (spaceId === 'mediahub' && !mediaHubChunkPrefetched.current) {
      mediaHubChunkPrefetched.current = true;
      import('../../components/media-hub').catch(() => {});
    }
  }, []);

  const [hovered, setHovered] = useState(false);
  const [compactDirection, setCompactDirection] = useState(1);
  const [focusWithin, setFocusWithin] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900
  );
  const hideTimeoutRef = useRef(null);
  const draggingRef = useRef(false);
  const rootRef = useRef(null);
  const previousIndexRef = useRef(0);
  const { pillOpen, pillClose, reducedMotion } = useWeeMotion();
  const hideDelayMs = 900;

  const clearHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const scheduleHideIfEligible = useCallback(() => {
    clearHideTimer();
    if (railPinned || !autoHideRail || draggingRef.current || isTransitioning) return;
    hideTimeoutRef.current = window.setTimeout(() => {
      setSpacesState({ railVisible: false });
    }, hideDelayMs);
  }, [autoHideRail, clearHideTimer, isTransitioning, railPinned, setSpacesState]);

  const channelKey = resolveActiveChannelSpaceKey(activeSpaceId);
  const { navigation } = useChannelOperations(channelKey);
  const showLeftNav =
    activeSpaceId !== 'gamehub' &&
    activeSpaceId !== 'mediahub' &&
    navigation.mode === 'wii' &&
    navigation.totalPages > 1 &&
    navigation.currentPage > 0;

  const sideNavStyle = useConsolidatedAppStore((state) => state.navigation?.sideNavStyle);
  const isClassicSideNav = sideNavStyle === 'classic';

  /** Sit below the peeking prev-page control; Wee compact nub is fully on-screen (less x tuck). */
  const railNudgeWithLeftNav = useMemo(
    () =>
      isClassicSideNav
        ? { y: 98, x: -36, scale: 0.9 }
        : { y: 78, x: -12, scale: 0.92 },
    [isClassicSideNav]
  );

  const railNudgeTransition = useMemo(
    () => createWeeTransition('railNudge', { reducedMotion }),
    [reducedMotion]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const spaceOrder = useMemo(
    () =>
      normalizeShellSpaceOrder(
        Array.isArray(order) && order.length > 0 ? order : DEFAULT_SHELL_SPACE_ORDER
      ),
    [order]
  );

  const orderedSpaces = useMemo(
    () =>
      spaceOrder.map((id) => {
        const base = SPACE_META[id] || { label: id, Icon: Home };
        return { id, label: base.label, Icon: base.Icon };
      }),
    [spaceOrder]
  );

  const activeSpaceIndex = useMemo(
    () => Math.max(0, orderedSpaces.findIndex((space) => space.id === activeSpaceId)),
    [orderedSpaces, activeSpaceId]
  );

  const railNudgeY = showLeftNav ? railNudgeWithLeftNav.y : 0;

  const { expandedHeight, railDensity, railNeedsScroll } = useMemo(() => {
    const maxH = maxSpaceRailViewportHeight(viewportHeight, railNudgeY);
    const comfortable = computeSpaceRailContentHeight(orderedSpaces.length, 'comfortable');
    if (comfortable <= maxH) {
      return {
        expandedHeight: comfortable,
        railDensity: 'comfortable',
        railNeedsScroll: false,
      };
    }
    const compact = computeSpaceRailContentHeight(orderedSpaces.length, 'compact');
    if (compact <= maxH) {
      return {
        expandedHeight: compact,
        railDensity: 'compact',
        railNeedsScroll: false,
      };
    }
    return {
      expandedHeight: maxH,
      railDensity: 'compact',
      railNeedsScroll: true,
    };
  }, [orderedSpaces.length, railNudgeY, viewportHeight]);

  const containerVariants = useMemo(
    () => createWeeShellRailContainerVariants(expandedHeight, pillClose, pillOpen),
    [expandedHeight, pillClose, pillOpen]
  );

  const itemVariants = useMemo(
    () => createWeeShellRailItemVariants(pillOpen, reducedMotion),
    [pillOpen, reducedMotion]
  );

  const shellChromeEntrance = useMemo(
    () => getWeeShellChromeEntrance(reducedMotion, pillOpen),
    [reducedMotion, pillOpen]
  );

  const onSelectSpace = useCallback(
    (spaceId) => {
      setSpacesState({ activeSpaceId: spaceId, railVisible: true });
      setHovered(false);
    },
    [setSpacesState]
  );

  const onDragStart = useCallback(() => {
    draggingRef.current = true;
    clearHideTimer();
    setSpacesState({ railVisible: true });
  }, [clearHideTimer, setSpacesState]);

  const onDragEnd = useCallback(
    (event) => {
      draggingRef.current = false;
      const { active, over } = event;
      if (!over || active.id === over.id) {
        scheduleHideIfEligible();
        return;
      }
      const oldIndex = spaceOrder.indexOf(active.id);
      const newIndex = spaceOrder.indexOf(over.id);
      if (oldIndex < 0 || newIndex < 0) {
        scheduleHideIfEligible();
        return;
      }
      const next = arrayMove(spaceOrder, oldIndex, newIndex);
      setSpacesState({ order: normalizeShellSpaceOrder(next) });
      scheduleHideIfEligible();
    },
    [scheduleHideIfEligible, setSpacesState, spaceOrder]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const nextSpaceId = getNextSpace(spaceOrder, activeSpaceId, delta);
        if (nextSpaceId !== activeSpaceId) {
          event.preventDefault();
          setSpacesState({ activeSpaceId: nextSpaceId, railVisible: true });
        }
        return;
      }
      if (event.key === 'Escape' && !railPinned && autoHideRail) {
        setHovered(false);
        setFocusWithin(false);
        setSpacesState({ railVisible: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSpaceId, autoHideRail, railPinned, setSpacesState, spaceOrder]);

  useEffect(() => {
    const prev = previousIndexRef.current;
    if (activeSpaceIndex !== prev) {
      setCompactDirection(activeSpaceIndex > prev ? 1 : -1);
      previousIndexRef.current = activeSpaceIndex;
    }
  }, [activeSpaceIndex]);

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(
    () => () => {
      clearHideTimer();
    },
    [clearHideTimer]
  );

  const activeSpace = orderedSpaces[activeSpaceIndex] || orderedSpaces[0];
  const ActiveIcon = activeSpace?.Icon || Home;

  const isExpanded = hovered || focusWithin;
  const shouldShowRail = railPinned || !autoHideRail || railVisible || isExpanded;
  const railClassName = `space-rail ${shouldShowRail ? 'space-rail--visible' : 'space-rail--hidden'} ${isExpanded ? 'space-rail--expanded' : 'space-rail--compact'}`;

  const handleWand = () => {
    openSettingsToTab(SETTINGS_TAB_ID.CHANNELS);
    setHovered(false);
  };

  const onPillHoverEnter = useCallback(() => {
    clearHideTimer();
    setHovered(true);
    if (!railVisible) {
      setSpacesState({ railVisible: true });
    }
  }, [clearHideTimer, railVisible, setSpacesState]);

  const onPillHoverLeave = useCallback(() => {
    setHovered(false);
    if (!focusWithin) {
      scheduleHideIfEligible();
    }
  }, [focusWithin, scheduleHideIfEligible]);

  const onHotspotEnter = useCallback(() => {
    clearHideTimer();
    if (!railVisible) {
      setSpacesState({ railVisible: true });
    }
  }, [clearHideTimer, railVisible, setSpacesState]);

  const onHotspotLeave = useCallback(() => {
    if (!hovered && !focusWithin) {
      scheduleHideIfEligible();
    }
  }, [focusWithin, hovered, scheduleHideIfEligible]);

  const onPillFocusCapture = useCallback(() => {
    clearHideTimer();
    setFocusWithin(true);
    setSpacesState({ railVisible: true });
  }, [clearHideTimer, setSpacesState]);

  const onPillBlurCapture = useCallback(
    (event) => {
      const nextFocusTarget = event.relatedTarget;
      if (rootRef.current?.contains(nextFocusTarget)) return;
      setFocusWithin(false);
      setHovered(false);
      scheduleHideIfEligible();
    },
    [scheduleHideIfEligible]
  );

  const handlePinToggle = useCallback(() => {
    const nextPinned = !railPinned;
    setSpacesState({
      railPinned: nextPinned,
      railVisible: true,
    });
    if (!nextPinned) {
      scheduleHideIfEligible();
    } else {
      clearHideTimer();
    }
  }, [clearHideTimer, railPinned, scheduleHideIfEligible, setSpacesState]);

  if (!railEnabled) {
    return null;
  }

  return (
    <>
      <div
        className={`space-rail__hotspot ${shouldShowRail ? 'space-rail__hotspot--active' : ''}`}
        onMouseEnter={onHotspotEnter}
        onMouseLeave={onHotspotLeave}
        onFocus={onHotspotEnter}
        onBlur={onHotspotLeave}
        tabIndex={0}
        aria-label="Reveal space navigation"
      />
      <aside
        ref={rootRef}
        className={`${railClassName} relative`}
        aria-label="Space navigation"
        onFocusCapture={onPillFocusCapture}
        onBlurCapture={onPillBlurCapture}
      >
        <m.div {...shellChromeEntrance} className="pointer-events-none relative flex flex-col items-center">
          <m.div
            className="pointer-events-none relative flex flex-col items-center"
            animate={{
              y: showLeftNav ? railNudgeWithLeftNav.y : 0,
              x: showLeftNav ? railNudgeWithLeftNav.x : 0,
              scale: reducedMotion ? 1 : showLeftNav ? railNudgeWithLeftNav.scale : 1,
            }}
            transition={railNudgeTransition}
          >
            <LayoutGroup>
              <WeeGlassPill
                motion
                animate={hovered ? 'open' : 'closed'}
                variants={containerVariants}
                initial={false}
                onMouseEnter={onPillHoverEnter}
                onMouseLeave={onPillHoverLeave}
                className="space-rail__pill-surface relative z-10 cursor-pointer overflow-hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {!hovered ? (
                    <MotionDiv
                      key="compact"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        transition: reducedMotion
                          ? { duration: 0.12 }
                          : { delay: 0.12, ...createWeeTransition('pillOpen') },
                      }}
                      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.1 } }}
                      className="absolute inset-0 flex items-center justify-center text-[hsl(var(--text-primary))]"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <MotionDiv
                          key={activeSpace?.id}
                          initial={{
                            opacity: 0,
                            y: compactDirection * 14,
                          }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: compactDirection * -14 }}
                          transition={pillClose}
                          className="flex items-center justify-center"
                        >
                          <ActiveIcon size={28} strokeWidth={2} aria-hidden />
                        </MotionDiv>
                      </AnimatePresence>
                    </MotionDiv>
                  ) : (
                    <MotionDiv
                      key="expanded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                      className={[
                        'absolute inset-0 flex w-full flex-col items-center',
                        railDensity === 'compact' ? 'gap-1.5 pt-3.5 pb-3.5' : 'gap-2 pt-5 pb-5',
                        railNeedsScroll ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden',
                      ].join(' ')}
                    >
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                      >
                        <SortableContext items={spaceOrder} strategy={verticalListSortingStrategy}>
                          {orderedSpaces.map((space, i) => (
                            <SortableSpaceRow
                              key={space.id}
                              space={space}
                              i={i}
                              activeSpaceId={activeSpaceId}
                              itemVariants={itemVariants}
                              reducedMotion={reducedMotion}
                              onSelectSpace={onSelectSpace}
                              onRailSpacePointerEnter={handleRailSpacePointerEnter}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>

                      <MotionDiv
                        custom={orderedSpaces.length}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className={[
                          'w-8 shrink-0 rounded-full bg-[hsl(var(--border-primary)/0.35)]',
                          railDensity === 'compact' ? 'my-0.5 h-1' : 'my-1 h-1',
                        ].join(' ')}
                        aria-hidden
                      />

                      <WeeGooeyIconButton
                        variant="solid"
                        size="lg"
                        custom={orderedSpaces.length + 1}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        reducedMotion={reducedMotion}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWand();
                        }}
                        title="Channels & layout"
                        aria-label="Open channels and layout settings"
                      >
                        <Wand2 size={22} strokeWidth={2} className="relative z-10" aria-hidden />
                      </WeeGooeyIconButton>

                      <WeeGooeyIconButton
                        variant="outline"
                        size="md"
                        custom={orderedSpaces.length + 2}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        reducedMotion={reducedMotion}
                        active={railPinned}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinToggle();
                        }}
                        title={railPinned ? 'Unpin space rail' : 'Pin space rail'}
                        aria-label={railPinned ? 'Unpin space rail' : 'Pin space rail'}
                      >
                        {railPinned ? (
                          <PinOff size={18} strokeWidth={2.25} className="relative z-10" aria-hidden />
                        ) : (
                          <Pin size={18} strokeWidth={2.25} className="relative z-10" aria-hidden />
                        )}
                      </WeeGooeyIconButton>
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </WeeGlassPill>

              <WeePillFloorShadow expanded={hovered} reducedMotion={reducedMotion} />
            </LayoutGroup>
          </m.div>
        </m.div>
      </aside>
    </>
  );
}
