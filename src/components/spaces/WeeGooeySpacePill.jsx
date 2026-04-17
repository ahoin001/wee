import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Gamepad2, Home, Layers2, Wand2 } from 'lucide-react';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { DEFAULT_SHELL_SPACE_ORDER, normalizeShellSpaceOrder } from '../../utils/channelSpaces';
import { useWeeMotion } from '../../design/weeMotion';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';

const MotionDiv = motion.div;
const MotionButton = motion.button;

const SPACE_META = {
  home: { label: 'Home', Icon: Home },
  workspaces: { label: 'Second', Icon: Layers2 },
  gamehub: { label: 'Games', Icon: Gamepad2 },
};

function getNextSpace(order, currentId, delta) {
  if (!Array.isArray(order) || order.length === 0) return currentId;
  const currentIndex = Math.max(0, order.indexOf(currentId));
  const nextIndex = (currentIndex + delta + order.length) % order.length;
  return order[nextIndex];
}

export default function WeeGooeySpacePill() {
  const {
    activeSpaceId,
    railPinned,
    railVisible,
    order,
    secondaryChannelProfiles,
    activeSecondaryChannelProfileId,
    setSpacesState,
    setUIState,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      activeSpaceId: state.spaces.activeSpaceId,
      railPinned: state.spaces.railPinned,
      railVisible: state.spaces.railVisible,
      order: state.spaces.order,
      secondaryChannelProfiles: state.channels.secondaryChannelProfiles,
      activeSecondaryChannelProfileId: state.channels.activeSecondaryChannelProfileId,
      setSpacesState: state.actions.setSpacesState,
      setUIState: state.actions.setUIState,
    }))
  );

  const [hovered, setHovered] = useState(false);
  const [compactDirection, setCompactDirection] = useState(1);
  const previousIndexRef = useRef(0);
  const { pillOpen, pillClose, pillFloor, reducedMotion } = useWeeMotion();

  const spaceOrder = useMemo(
    () =>
      normalizeShellSpaceOrder(
        Array.isArray(order) && order.length > 0 ? order : DEFAULT_SHELL_SPACE_ORDER
      ),
    [order]
  );

  const orderedSpaces = useMemo(() => {
    const secondaryName =
      secondaryChannelProfiles?.[activeSecondaryChannelProfileId]?.name?.trim() ||
      SPACE_META.workspaces.label;
    return spaceOrder.map((id) => {
      const base = SPACE_META[id] || { label: id, Icon: Home };
      if (id === 'workspaces') {
        const label =
          secondaryName.length > 14 ? `${secondaryName.slice(0, 13)}…` : secondaryName;
        return { id, label, Icon: base.Icon };
      }
      return { id, label: base.label, Icon: base.Icon };
    });
  }, [spaceOrder, secondaryChannelProfiles, activeSecondaryChannelProfileId]);

  const activeSpaceIndex = useMemo(
    () => Math.max(0, orderedSpaces.findIndex((space) => space.id === activeSpaceId)),
    [orderedSpaces, activeSpaceId]
  );

  const expandedHeight = useMemo(
    () => orderedSpaces.length * 64 + 120,
    [orderedSpaces.length]
  );

  const containerVariants = useMemo(
    () => ({
      closed: {
        height: 80,
        width: 80,
        borderRadius: 40,
        transition: pillClose,
      },
      open: {
        height: expandedHeight,
        width: 90,
        borderRadius: 45,
        transition: pillOpen,
      },
    }),
    [expandedHeight, pillClose, pillOpen]
  );

  const itemVariants = useMemo(
    () => ({
      closed: {
        opacity: 0,
        scale: 0.5,
        y: 15,
        transition: reducedMotion ? { duration: 0.08 } : { duration: 0.1 },
      },
      open: (i) => ({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: reducedMotion
          ? { duration: 0.12 }
          : { delay: i * 0.04, ...pillOpen },
      }),
    }),
    [pillOpen, reducedMotion]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextSpaceId = getNextSpace(spaceOrder, activeSpaceId, delta);
      if (nextSpaceId !== activeSpaceId) {
        event.preventDefault();
        setSpacesState({ activeSpaceId: nextSpaceId, railVisible: true });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSpaceId, setSpacesState, spaceOrder]);

  useEffect(() => {
    if (!railVisible) {
      setSpacesState({ railVisible: true });
    }
  }, [railVisible, setSpacesState]);

  useEffect(() => {
    const prev = previousIndexRef.current;
    if (activeSpaceIndex !== prev) {
      setCompactDirection(activeSpaceIndex > prev ? 1 : -1);
      previousIndexRef.current = activeSpaceIndex;
    }
  }, [activeSpaceIndex]);

  const activeSpace = orderedSpaces[activeSpaceIndex] || orderedSpaces[0];
  const ActiveIcon = activeSpace?.Icon || Home;

  const railClassName = `space-rail space-rail--visible ${hovered ? 'space-rail--expanded' : 'space-rail--compact'}`;

  const handleWand = () => {
    openSettingsToTab(SETTINGS_TAB_ID.CHANNELS);
    setHovered(false);
  };

  return (
    <aside
      className={`${railClassName} relative`}
      onMouseEnter={() => {
        setHovered(true);
        if (!railVisible) {
          setSpacesState({ railVisible: true });
        }
      }}
      onMouseLeave={() => setHovered(false)}
      aria-label="Space navigation"
    >
      <div className="relative flex flex-col items-center">
        <LayoutGroup>
        <MotionDiv
          animate={hovered ? 'open' : 'closed'}
          variants={containerVariants}
          initial={false}
          className="relative z-10 cursor-pointer overflow-hidden border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--wee-pill-glass))] shadow-[var(--wee-pill-shadow)] backdrop-blur-xl"
        >
          <AnimatePresence mode="wait" initial={false}>
            {!hovered ? (
              <MotionDiv
                key="compact"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: reducedMotion ? { duration: 0.12 } : { delay: 0.12, type: 'spring' },
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
                className="absolute inset-0 flex w-full flex-col items-center gap-2 pt-5"
              >
                {orderedSpaces.map((space, i) => {
                  const Icon = space.Icon;
                  const active = space.id === activeSpaceId;
                  return (
                    <MotionButton
                      key={space.id}
                      type="button"
                      custom={i}
                      variants={itemVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      whileHover={
                        reducedMotion
                          ? {}
                          : { scale: 1.12, rotate: [0, -5, 5, 0] }
                      }
                      whileTap={reducedMotion ? {} : { scale: 0.92, rotate: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSpacesState({ activeSpaceId: space.id, railVisible: true });
                        setHovered(false);
                      }}
                      title={space.label}
                      aria-pressed={active}
                      className="group relative flex h-14 w-14 items-center justify-center rounded-full transition-colors"
                    >
                      {active && (
                        <MotionDiv
                          layoutId="pillActive"
                          className="absolute inset-0 z-0 rounded-full bg-[hsl(var(--surface-elevated))] shadow-[var(--shadow-md)]"
                          transition={pillOpen}
                        />
                      )}
                      <Icon
                        size={22}
                        strokeWidth={2}
                        className={`relative z-10 ${active ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--text-tertiary))] group-hover:text-[hsl(var(--text-primary))]'}`}
                        aria-hidden
                      />
                      <span className="pointer-events-none absolute left-full z-50 ml-4 whitespace-nowrap rounded-xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] px-4 py-2 text-[10px] font-black uppercase italic tracking-widest text-[hsl(var(--text-primary))] opacity-0 shadow-[var(--shadow-xl)] transition-all group-hover:translate-x-0 group-hover:opacity-100 -translate-x-2">
                        {space.label}
                      </span>
                    </MotionButton>
                  );
                })}

                <MotionDiv
                  custom={orderedSpaces.length}
                  variants={itemVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="my-1 h-1 w-8 rounded-full bg-[hsl(var(--border-primary)/0.35)]"
                  aria-hidden
                />

                <MotionButton
                  type="button"
                  custom={orderedSpaces.length + 1}
                  variants={itemVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWand();
                  }}
                  whileHover={reducedMotion ? {} : { scale: 1.12, rotate: 12 }}
                  whileTap={reducedMotion ? {} : { scale: 0.92 }}
                  title="Channels & layout"
                  aria-label="Open channels and layout settings"
                  className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--text-primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-card)]"
                >
                  <Wand2 size={22} strokeWidth={2} className="relative z-10" aria-hidden />
                </MotionButton>
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>

        <MotionDiv
          className="absolute -bottom-4 left-1/2 z-0 h-2 w-12 -translate-x-1/2 rounded-full bg-[hsl(var(--wee-pill-floor))] blur-sm"
          animate={{
            scaleX: hovered ? 2.5 : 1,
            opacity: hovered ? 0.15 : 0.4,
          }}
          transition={pillFloor}
          aria-hidden
        />
      </LayoutGroup>
      </div>

      <button
        type="button"
        className="space-rail__pin"
        onClick={() => {
          const nextPinned = !railPinned;
          setSpacesState({ railPinned: nextPinned, railVisible: true });
          setUIState({ spaceRailPinned: nextPinned });
        }}
        title={railPinned ? 'Unpin Space Rail' : 'Pin Space Rail'}
      >
        {railPinned ? 'Unpin' : 'Pin'}
      </button>
    </aside>
  );
}
