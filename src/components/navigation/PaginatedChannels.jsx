import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import * as ContextMenu from '@radix-ui/react-context-menu';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCorners,
} from '@dnd-kit/core';
import { Check, LayoutGrid, PenLine, Plus, Replace, Settings2, X } from 'lucide-react';
import { Channel } from '../channels';
import {
  HomeSlot,
  HomeBoardArrangeBar,
  HomeSlotResizeHandle,
  getHomeSlotKind,
  getHomeSlotSizePreset,
  pickPlaceableSizePresetId,
} from '../home-grid';
import useChannelOperations from '../../utils/useChannelOperations';
import { useHomeBoardArrange } from '../../hooks/useHomeBoardArrange';
import { getSlotAt, isChannelSlotEmpty, isNonChannelSlot } from '../../utils/homeGridSlots';
import { canPlaceSpan, getSlotSpan } from '../../utils/homeGridOccupancy';
import {
  getHomeSlotSizePresetById,
  HOME_SLOT_SIZE_PRESETS,
} from '../../utils/homeSlotSizePresets';
import { ChannelSpaceProvider } from '../../contexts/ChannelSpaceContext';
import useIdleChannelAnimations from '../../utils/useIdleChannelAnimations';
import { CHANNEL_PAGE_FLIP_MS, isSlotHidden } from '../../utils/channelLayoutSystem';
import { WiiChannelStrip } from '../channels';
import ChannelSlotDnd, { parseChannelDnDId } from './ChannelSlotDnd';
import { ChannelDragOverlayFrame } from './ChannelDragMotion';
import { ChannelReorderVfxPortal, measureChannelSlotCenter } from './ChannelReorderVfx';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import {
  isSupportedImageOrVideoUpload,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../../utils/supportedUploadMedia';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { WeeGlassPill } from '../../ui/wee';
import {
  createHomeChannelEntranceBandVariants,
  createHubEntranceBandVariants,
  createWeeTransition,
} from '../../design/weeMotion';
import { useHubSpaceEntrance } from '../../hooks/useHubSpaceEntrance';
import { useHomeIdleExperience } from '../../hooks/useHomeIdleExperience';
import { weeMarkChannelPage } from '../../utils/weePerformanceMarks';
import { projectSlotsToLegacyMaps } from '../../utils/homeGridSlots';
import { normalizeDropTarget, reorderSlots } from '../../utils/boardMutation';
import './PaginatedChannels.css';

const MotionDiv = m.div;

/** Hold near strip edge before auto-flipping pages (iPhone-style). */
const PAGE_EDGE_HOLD_MS = 480;
const PAGE_EDGE_RATIO = 0.11;

/** Shared Radix item look for the Home board context menu. */
const HOME_CONTEXT_ITEM_CLASS =
  'flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[length:var(--font-size-caption)] font-black uppercase tracking-wide text-[hsl(var(--text-secondary))] outline-none data-[highlighted]:bg-[hsl(var(--state-hover))] data-[highlighted]:text-[hsl(var(--text-primary))]';

const PaginatedChannelsInner = React.memo(() => {
  // ✅ DATA LAYER: Use the new channel operations hook
  const {
    channelSpaceKey,
    navigation,
    channelSettings,
    gridConfig,
    configuredChannels,
    channelConfigs,
    slotMeta,
    channelData,
    getCurrentPageChannels,
    getChannelConfig,
    finishAnimation,
    updateChannelConfig,
    updateChannelMedia,
    updateChannelPath,
    reorderChannels,
    goToPage,
    nextPage,
    prevPage,
    isChannelSlotHidden,
    setSlotHidden,
  } = useChannelOperations(undefined, { enableGlobalPageShortcuts: true });

  const isSpaceTransitioning = useConsolidatedAppStore((s) => s.spaces.isTransitioning);
  const activeSpaceId = useConsolidatedAppStore((s) => s.spaces.activeSpaceId);
  const channelConfigureModalOpen = useConsolidatedAppStore((s) => s.ui.channelConfigureModalOpen);
  const mf = useMotionFeedback();
  const {
    arrangeMode: homeBoardArrangeMode,
    punchMode: homeBoardPunchMode,
    selectedSlotIndex: homeBoardSelectedSlotIndex,
    enterArrange: enterHomeBoardArrange,
    exitArrange: exitHomeBoardArrange,
    togglePunchMode: toggleHomeBoardPunchMode,
    setSelectedSlotIndex: setHomeBoardSelectedSlotIndex,
  } = useHomeBoardArrange();

  const placeHomeWidgetSlotForSpace = useConsolidatedAppStore(
    (s) => s.actions.placeHomeWidgetSlotForSpace
  );
  const removeHomeWidgetSlotForSpace = useConsolidatedAppStore(
    (s) => s.actions.removeHomeWidgetSlotForSpace
  );
  const setHomeSlotSpanForSpace = useConsolidatedAppStore(
    (s) => s.actions.setHomeSlotSpanForSpace
  );
  const setHomeSlotSurfaceForSpace = useConsolidatedAppStore(
    (s) => s.actions.setHomeSlotSurfaceForSpace
  );
  const setHomeSlotWidgetForSpace = useConsolidatedAppStore(
    (s) => s.actions.setHomeSlotWidgetForSpace
  );
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);
  const reducedMotion = useReducedMotion();
  const {
    entranceKey,
    tier: channelEntranceTier,
    animateState: channelEntranceState,
    onEntranceComplete,
  } = useHubSpaceEntrance(channelSpaceKey, reducedMotion);
  const channelReturnVariants = useMemo(
    () =>
      channelSpaceKey === 'home'
        ? createHomeChannelEntranceBandVariants(channelEntranceTier, reducedMotion)
        : createHubEntranceBandVariants(channelEntranceTier, reducedMotion),
    [channelEntranceTier, reducedMotion, channelSpaceKey]
  );

  /** Prefer pointer-occupied cell, then nearest corner — more reliable than rectIntersection on transformed grids. */
  const channelGridCollisionDetection = useCallback((args) => {
    const inPointer = pointerWithin(args);
    if (inPointer.length) return inPointer;
    return closestCorners(args);
  }, []);

  /** Persisted or interrupted page animation can leave isAnimating stuck true and block drag forever. */
  useEffect(() => {
    if (!navigation.isAnimating) return undefined;
    const t = window.setTimeout(() => {
      finishAnimation();
    }, CHANNEL_PAGE_FLIP_MS + 130);
    return () => window.clearTimeout(t);
  }, [navigation.isAnimating, finishAnimation]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a short pull so normal clicks still launch the channel.
      activationConstraint: { distance: 6 },
    })
  );

  const [activeDragIndex, setActiveDragIndex] = useState(null);
  const [hoverDragIndex, setHoverDragIndex] = useState(null);
  const [previewBoard, setPreviewBoard] = useState(null);
  const [dragOverlayPayload, setDragOverlayPayload] = useState(null);
  const [channelMediaNotice, setChannelMediaNotice] = useState('');
  const mediaNoticeTimerRef = useRef(null);
  const [liftVfx, setLiftVfx] = useState(null);
  const [dropVfx, setDropVfx] = useState(null);
  const [celebrateIndex, setCelebrateIndex] = useState(null);
  const [reorderWave, setReorderWave] = useState(null);
  const burstKeyRef = useRef(0);
  const reorderWaveIdRef = useRef(0);
  const vfxTimersRef = useRef([]);
  const dragSnapshotRef = useRef(null);
  const dragOriginRef = useRef(null);
  const hoverIndexRef = useRef(null);
  const pageEdgeTimerRef = useRef(null);
  const pageEdgeSideRef = useRef(null);

  const boardLayout = useMemo(
    () => ({
      columns: gridConfig.columns,
      rows: gridConfig.rows,
      totalPages: gridConfig.totalPages || navigation.totalPages || 1,
    }),
    [gridConfig.columns, gridConfig.rows, gridConfig.totalPages, navigation.totalPages]
  );

  /**
   * Occupancy/placement probes prefer page-effective columns/rows when the page
   * override matches strip slot density (safe for absolute index math). Smaller
   * per-page overrides stay settings-only in v1 — strip geometry is space-level.
   */
  const placeColumns =
    gridConfig.pageChannelsPerPage === gridConfig.channelsPerPage
      ? gridConfig.pageColumns ?? gridConfig.columns
      : gridConfig.columns;
  const placeRows =
    gridConfig.pageChannelsPerPage === gridConfig.channelsPerPage
      ? gridConfig.pageRows ?? gridConfig.rows
      : gridConfig.rows;

  const clearVfxTimers = useCallback(() => {
    vfxTimersRef.current.forEach(clearTimeout);
    vfxTimersRef.current = [];
  }, []);

  const scheduleVfx = useCallback((fn, delay) => {
    const id = setTimeout(() => {
      fn();
      vfxTimersRef.current = vfxTimersRef.current.filter((t) => t !== id);
    }, delay);
    vfxTimersRef.current.push(id);
  }, []);

  const clearPageEdgeTimer = useCallback(() => {
    if (pageEdgeTimerRef.current) {
      clearTimeout(pageEdgeTimerRef.current);
      pageEdgeTimerRef.current = null;
    }
    pageEdgeSideRef.current = null;
  }, []);

  const clearDragPreview = useCallback(() => {
    dragSnapshotRef.current = null;
    dragOriginRef.current = null;
    hoverIndexRef.current = null;
    setPreviewBoard(null);
    setHoverDragIndex(null);
    setDragOverlayPayload(null);
    clearPageEdgeTimer();
  }, [clearPageEdgeTimer]);

  const projectLiveReorder = useCallback(
    (fromIndex, toIndex) => {
      const snap = dragSnapshotRef.current;
      if (!snap?.slots) return;
      if (fromIndex === toIndex) {
        setPreviewBoard(snap);
        return;
      }
      const { slots, toIndex: landed } = reorderSlots({
        slots: snap.slots,
        layout: snap.layout,
        fromIndex,
        toIndex,
      });
      const legacy = projectSlotsToLegacyMaps(slots);
      setPreviewBoard({
        slots,
        layout: snap.layout,
        landedIndex: landed,
        ...legacy,
      });
    },
    []
  );

  const resolveConfigAt = useCallback(
    (channelId) => {
      if (previewBoard?.configuredChannels) {
        return previewBoard.configuredChannels[channelId] || null;
      }
      return getChannelConfig(channelId);
    },
    [previewBoard, getChannelConfig]
  );

  const resolveSlots = useCallback(() => {
    if (Array.isArray(previewBoard?.slots)) return previewBoard.slots;
    return Array.isArray(channelData?.slots) ? channelData.slots : [];
  }, [previewBoard, channelData?.slots]);

  const resolveSlotHidden = useCallback(
    (index) => {
      const slots = resolveSlots();
      if (slots[index]?.hidden) return true;
      if (previewBoard?.slotMeta) return isSlotHidden(previewBoard.slotMeta, index);
      return isSlotHidden(slotMeta, index);
    },
    [resolveSlots, previewBoard, slotMeta]
  );

  const resolveIsEmpty = useCallback(
    (channelId) => {
      const config = resolveConfigAt(channelId);
      return !config || (!config.media && !config.path);
    },
    [resolveConfigAt]
  );

  // Get current page channels
  const currentPageChannels = useMemo(() => {
    return getCurrentPageChannels();
  }, [getCurrentPageChannels]);

  // Use settings from consolidated store.
  const effectiveSettings = useMemo(() => ({
    animatedOnHover: channelSettings.animatedOnHover ?? false,
    adaptiveEmptyChannels: channelSettings.adaptiveEmptyChannels ?? true,
    kenBurnsEnabled: channelSettings.kenBurnsEnabled ?? false,
    kenBurnsMode: channelSettings.kenBurnsMode ?? 'hover',
    focusRecedeEnabled: channelSettings.focusRecedeEnabled ?? true,
  }), [channelSettings]);

  const lastPointerThrottleRef = useRef(0);
  const isHomeSpace = channelSpaceKey === 'home';
  const isFocusSpace = channelSpaceKey === 'workspaces';
  /** Home + Focus share Live Board Studio arrange/punch chrome. */
  const isChannelBoardSpace = isHomeSpace || isFocusSpace;
  const isHomeActive = isHomeSpace && activeSpaceId === 'home';

  // Shared idle state machine: one clock for grid auto-fade, micro-delights, and attract.
  // Pointer/keyboard activity on the grid feeds bumpActivity — not CSS :hover (a parked
  // cursor over tiles must still allow fade).
  const idleExperience = useHomeIdleExperience({ enabled: isHomeActive });
  const isGridFaded = isHomeActive && idleExperience.isFaded;

  // Live Board Studio applies to Home and Focus channel boards.
  const arrangeModeActive = isChannelBoardSpace && homeBoardArrangeMode;
  const punchModeActive = isChannelBoardSpace && homeBoardPunchMode;

  /** Widget picker in the arrange tray — owned here so tile clicks can open it. */
  const [arrangePickerOpen, setArrangePickerOpen] = useState(false);
  /** When set, the next picker pick replaces this configured channel slot. */
  const [replaceTargetIndex, setReplaceTargetIndex] = useState(null);

  useEffect(() => {
    if (!arrangeModeActive || punchModeActive) {
      setArrangePickerOpen(false);
      setReplaceTargetIndex(null);
    }
  }, [arrangeModeActive, punchModeActive]);

  const handleTogglePunchSlot = useCallback(
    (channelIndex) => {
      setSlotHidden(channelIndex, !isChannelSlotHidden(channelIndex));
    },
    [setSlotHidden, isChannelSlotHidden]
  );

  const boardSlots = channelData?.slots;

  const findFirstFreeSlotIndex = useCallback(() => {
    const slots = Array.isArray(boardSlots) ? boardSlots : [];
    const preset = getHomeSlotSizePresetById('S');
    for (let i = 0; i < slots.length; i += 1) {
      if (isChannelSlotHidden(i)) continue;
      if (
        canPlaceSpan({
          slots,
          anchorIndex: i,
          colSpan: preset.colSpan,
          rowSpan: preset.rowSpan,
          columns: placeColumns,
          rows: placeRows,
        })
      ) {
        return i;
      }
    }
    return null;
  }, [boardSlots, placeColumns, placeRows, isChannelSlotHidden]);

  const selectedSlot =
    homeBoardSelectedSlotIndex != null && Array.isArray(boardSlots)
      ? boardSlots[homeBoardSelectedSlotIndex] ?? null
      : null;

  /**
   * Strip tile selection. A left click on an empty tile also opens the tray's
   * widget picker (the tile CTA says "Add widget here" — honor it); right-click
   * only selects and lets the board context menu open.
   */
  const handleArrangeSelectIndex = useCallback(
    (index, source = 'click') => {
      setHomeBoardSelectedSlotIndex(index);
      if (source !== 'click') return;
      const slot = Array.isArray(boardSlots) ? boardSlots[index] : null;
      const emptyTile = isChannelSlotEmpty(slot) && !isChannelSlotHidden(index);
      setReplaceTargetIndex(null);
      setArrangePickerOpen(emptyTile);
    },
    [setHomeBoardSelectedSlotIndex, boardSlots, isChannelSlotHidden]
  );

  const addTargetIndex = useMemo(() => {
    if (!arrangeModeActive || punchModeActive) return null;
    if (
      homeBoardSelectedSlotIndex != null &&
      selectedSlot &&
      isChannelSlotEmpty(selectedSlot) &&
      !isChannelSlotHidden(homeBoardSelectedSlotIndex)
    ) {
      const preset = getHomeSlotSizePresetById('S');
      if (
        canPlaceSpan({
          slots: boardSlots,
          anchorIndex: homeBoardSelectedSlotIndex,
          colSpan: preset.colSpan,
          rowSpan: preset.rowSpan,
          columns: placeColumns,
          rows: placeRows,
        })
      ) {
        return homeBoardSelectedSlotIndex;
      }
    }
    return findFirstFreeSlotIndex();
  }, [
    arrangeModeActive,
    punchModeActive,
    homeBoardSelectedSlotIndex,
    selectedSlot,
    boardSlots,
    placeColumns,
    placeRows,
    isChannelSlotHidden,
    findFirstFreeSlotIndex,
  ]);

  /**
   * Place a registry widget kind — prefer the kind's default size, then fall back
   * to the largest kind preset that fits (Steam never places as 1×1).
   */
  const handleAddWidget = useCallback(
    (kindId) => {
      if (!kindId) return;
      const slots = Array.isArray(boardSlots) ? boardSlots : [];
      const resolvePresetId = (anchorIndex, selfIndex = null) =>
        pickPlaceableSizePresetId(kindId, (preset) =>
          canPlaceSpan({
            slots,
            anchorIndex,
            colSpan: preset.colSpan,
            rowSpan: preset.rowSpan,
            columns: placeColumns,
            rows: placeRows,
            selfIndex,
          })
        );

      if (replaceTargetIndex != null) {
        const targetIndex = replaceTargetIndex;
        const kindLabel = getHomeSlotKind(kindId)?.label ?? 'widget';
        const rawTitle = slots[targetIndex]?.channel?.title;
        const safeTitle = rawTitle
          ? String(rawTitle).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
          : '';
        setUIState({
          showConfirmationModal: true,
          confirmationModalData: {
            title: 'Replace channel',
            message: `Replace ${safeTitle ? `<strong>${safeTitle}</strong>` : 'this channel'} with a <strong>${kindLabel}</strong> widget? Its channel setup will be removed.`,
            confirmText: 'Replace',
            confirmVariant: 'danger-primary',
            onConfirm: () => {
              placeHomeWidgetSlotForSpace(
                channelSpaceKey,
                targetIndex,
                kindId,
                resolvePresetId(targetIndex, targetIndex),
                { replace: true }
              );
              setHomeBoardSelectedSlotIndex(targetIndex);
            },
          },
        });
        setReplaceTargetIndex(null);
        return;
      }

      if (addTargetIndex == null) return;
      placeHomeWidgetSlotForSpace(
        channelSpaceKey,
        addTargetIndex,
        kindId,
        resolvePresetId(addTargetIndex)
      );
      setHomeBoardSelectedSlotIndex(addTargetIndex);
    },
    [
      addTargetIndex,
      replaceTargetIndex,
      boardSlots,
      placeColumns,
      placeRows,
      placeHomeWidgetSlotForSpace,
      channelSpaceKey,
      setHomeBoardSelectedSlotIndex,
      setUIState,
    ]
  );

  const handleRemoveWidget = useCallback(() => {
    if (homeBoardSelectedSlotIndex == null) return;
    removeHomeWidgetSlotForSpace(channelSpaceKey, homeBoardSelectedSlotIndex);
    setHomeBoardSelectedSlotIndex(null);
  }, [
    homeBoardSelectedSlotIndex,
    removeHomeWidgetSlotForSpace,
    channelSpaceKey,
    setHomeBoardSelectedSlotIndex,
  ]);

  /** Pre-computed per-preset fit for the selected slot — bar dims blocked sizes before any click. */
  const blockedSizePresetIds = useMemo(() => {
    if (homeBoardSelectedSlotIndex == null) return [];
    const slots = Array.isArray(boardSlots) ? boardSlots : [];
    const kindId = selectedSlot?.kind ?? 'channel';
    const kindPresets = getHomeSlotKind(kindId)?.sizePresets;
    const presets = kindPresets
      ? Object.values(kindPresets)
      : Object.values(HOME_SLOT_SIZE_PRESETS);
    return presets
      .filter(
        (preset) =>
          !canPlaceSpan({
            slots,
            anchorIndex: homeBoardSelectedSlotIndex,
            colSpan: preset.colSpan,
            rowSpan: preset.rowSpan,
            columns: placeColumns,
            rows: placeRows,
            selfIndex: homeBoardSelectedSlotIndex,
          })
      )
      .map((preset) => preset.id);
  }, [
    homeBoardSelectedSlotIndex,
    boardSlots,
    placeColumns,
    placeRows,
    selectedSlot?.kind,
  ]);

  const handleSetSizePreset = useCallback(
    (presetId) => {
      if (homeBoardSelectedSlotIndex == null) return;
      // Kind-aware lookup so kinds with restricted preset sets (e.g. Now Playing
      // has no XL) reject sizes their registry entry does not offer.
      const preset = getHomeSlotSizePreset(selectedSlot?.kind ?? 'channel', presetId);
      if (!preset) return;
      if (blockedSizePresetIds.includes(presetId)) return;
      setHomeSlotSpanForSpace(
        channelSpaceKey,
        homeBoardSelectedSlotIndex,
        preset.colSpan,
        preset.rowSpan
      );
    },
    [
      homeBoardSelectedSlotIndex,
      selectedSlot?.kind,
      blockedSizePresetIds,
      setHomeSlotSpanForSpace,
      channelSpaceKey,
    ]
  );

  const handleSetSurface = useCallback(
    (surface) => {
      if (homeBoardSelectedSlotIndex == null) return;
      setHomeSlotSurfaceForSpace(channelSpaceKey, homeBoardSelectedSlotIndex, surface);
    },
    [homeBoardSelectedSlotIndex, setHomeSlotSurfaceForSpace, channelSpaceKey]
  );

  const handleSetListenApp = useCallback(
    (listenApp) => {
      if (homeBoardSelectedSlotIndex == null) return;
      setHomeSlotWidgetForSpace(channelSpaceKey, homeBoardSelectedSlotIndex, {
        listenApp: String(listenApp || 'any').trim() || 'any',
      });
    },
    [homeBoardSelectedSlotIndex, setHomeSlotWidgetForSpace, channelSpaceKey]
  );

  /** Free-form span commit from the corner resize grabber. */
  const handleSetSlotSpan = useCallback(
    (channelIndex, colSpan, rowSpan) => {
      if (channelIndex == null || channelIndex < 0) return;
      setHomeSlotSpanForSpace(channelSpaceKey, channelIndex, colSpan, rowSpan);
    },
    [setHomeSlotSpanForSpace, channelSpaceKey]
  );

  /** Index currently being corner-resized — suppresses dnd-kit on that slot. */
  const [resizeActiveIndex, setResizeActiveIndex] = useState(null);

  useEffect(() => {
    if (!arrangeModeActive || punchModeActive) {
      setResizeActiveIndex(null);
    }
  }, [arrangeModeActive, punchModeActive]);

  const handleArrangeSelectChannelId = useCallback(
    (channelId) => {
      const match = /^channel-(\d+)$/.exec(channelId || '');
      if (!match) return;
      handleArrangeSelectIndex(Number(match[1]), 'click');
    },
    [handleArrangeSelectIndex]
  );

  const homeArrangeHintSeen = useConsolidatedAppStore((s) => Boolean(s.ui.homeArrangeHintSeen));

  /** Unified board context menu — remember which tile (if any) was under the right-click. */
  const [contextTileIndex, setContextTileIndex] = useState(null);
  const handleBoardContextMenuCapture = useCallback(
    (event) => {
      // Channels use data-channel-id; widgets live in ChannelSlotDnd (data-channel-slot).
      const byId = event.target?.closest?.('[data-channel-id]');
      const idMatch = byId
        ? /^channel-(\d+)$/.exec(byId.getAttribute('data-channel-id') || '')
        : null;
      const bySlot = !idMatch ? event.target?.closest?.('[data-channel-slot]') : null;
      const slotAttr = bySlot?.getAttribute?.('data-channel-slot');
      const index = idMatch
        ? Number(idMatch[1])
        : slotAttr != null && slotAttr !== ''
          ? Number(slotAttr)
          : null;
      const resolved =
        index != null && Number.isFinite(index) ? index : null;
      setContextTileIndex(resolved);

      if (resolved == null || !Array.isArray(boardSlots)) return;

      const slot = boardSlots[resolved];
      if (!isNonChannelSlot(slot)) return;

      // Already editing — just select this widget for the tray.
      if (homeBoardArrangeMode) {
        setHomeBoardSelectedSlotIndex(resolved);
        return;
      }

      // Right-clicking a Home widget jumps straight into Edit Home (where widgets are adjusted).
      event.preventDefault();
      event.stopPropagation();
      enterHomeBoardArrange();
      setHomeBoardSelectedSlotIndex(resolved);
    },
    [
      boardSlots,
      homeBoardArrangeMode,
      enterHomeBoardArrange,
      setHomeBoardSelectedSlotIndex,
    ]
  );

  const contextTileSlot =
    contextTileIndex != null && Array.isArray(boardSlots) ? boardSlots[contextTileIndex] : null;
  const contextTileIsChannel =
    contextTileIndex != null &&
    (!contextTileSlot || !contextTileSlot.kind || contextTileSlot.kind === 'channel');
  const contextTileIsEmpty =
    contextTileIndex != null &&
    isChannelSlotEmpty(contextTileSlot) &&
    !isChannelSlotHidden(contextTileIndex);
  const contextTileIsConfiguredChannel = contextTileIsChannel && !contextTileIsEmpty;

  /** Route Configure through the store so the owning Channel opens its own modal. */
  const handleConfigureContextTile = useCallback(() => {
    if (contextTileIndex == null) return;
    setUIState({
      channelConfigureRequest: {
        spaceKey: channelSpaceKey,
        channelId: `channel-${contextTileIndex}`,
      },
    });
  }, [contextTileIndex, setUIState, channelSpaceKey]);

  const handlePunchContextTile = useCallback(() => {
    if (contextTileIndex == null) return;
    handleTogglePunchSlot(contextTileIndex);
  }, [contextTileIndex, handleTogglePunchSlot]);

  /** Arrange menu: target this empty tile and open the tray's widget picker. */
  const handleAddWidgetContextTile = useCallback(() => {
    if (contextTileIndex == null) return;
    setReplaceTargetIndex(null);
    setHomeBoardSelectedSlotIndex(contextTileIndex);
    setArrangePickerOpen(true);
  }, [contextTileIndex, setHomeBoardSelectedSlotIndex]);

  /** Arrange menu: the next picker pick replaces this configured channel (confirmed). */
  const handleReplaceContextTile = useCallback(() => {
    if (contextTileIndex == null) return;
    setHomeBoardSelectedSlotIndex(contextTileIndex);
    setReplaceTargetIndex(contextTileIndex);
    setArrangePickerOpen(true);
  }, [contextTileIndex, setHomeBoardSelectedSlotIndex]);

  const dismissArrangeHint = useCallback(() => {
    setUIState({ homeArrangeHintSeen: true });
  }, [setUIState]);

  /** Entering Edit Home by any path counts as “learned it”. */
  useEffect(() => {
    if (homeBoardArrangeMode && !homeArrangeHintSeen) {
      dismissArrangeHint();
    }
  }, [homeBoardArrangeMode, homeArrangeHintSeen, dismissArrangeHint]);

  // —— One-time Edit Home widget coach (persisted: ui.homeBoardWidgetCoachDismissed) ——
  const widgetCoachDismissed = useConsolidatedAppStore((s) =>
    Boolean(s.ui.homeBoardWidgetCoachDismissed)
  );
  const dismissWidgetCoach = useCallback(() => {
    setUIState({ homeBoardWidgetCoachDismissed: true });
  }, [setUIState]);

  const widgetCoachVisible =
    arrangeModeActive && !punchModeActive && !widgetCoachDismissed && !channelConfigureModalOpen;
  const selectedSlotIsWidget = Boolean(
    selectedSlot && selectedSlot.kind && selectedSlot.kind !== 'channel'
  );

  /** Placing the first widget completes the coach. */
  useEffect(() => {
    if (widgetCoachVisible && selectedSlotIsWidget) {
      dismissWidgetCoach();
    }
  }, [widgetCoachVisible, selectedSlotIsWidget, dismissWidgetCoach]);

  /** `addTargetIndex == null` in arrange mode ⇔ no free slot anywhere on the board. */
  const boardHasFreeSlot = addTargetIndex != null;
  const widgetCoachCopy = !boardHasFreeSlot
    ? 'Board is full — tap any tile to resize it, or right-click a channel to replace it with a widget'
    : homeBoardSelectedSlotIndex != null && selectedSlot && isChannelSlotEmpty(selectedSlot)
      ? 'Nice — now pick a widget from the tray below'
      : 'Tap an empty tile to add a widget · drag tiles to reorder';

  /** “Show tips” under More — recalls the coach for this and future sessions. */
  const handleReopenGuide = useCallback(() => {
    setUIState({ homeBoardWidgetCoachDismissed: false });
  }, [setUIState]);

  useEffect(() => {
    if (!isChannelBoardSpace && homeBoardArrangeMode) {
      exitHomeBoardArrange();
    }
  }, [isChannelBoardSpace, homeBoardArrangeMode, exitHomeBoardArrange]);

  const bumpGridActivity = idleExperience.bumpActivity;

  /** Throttle move so we don’t reset the idle timer every frame. */
  const handleGridPointerMove = useCallback(() => {
    const now = Date.now();
    if (now - lastPointerThrottleRef.current < 200) return;
    lastPointerThrottleRef.current = now;
    bumpGridActivity();
  }, [bumpGridActivity]);

  const handleGridMouseEnter = useCallback(() => {
    bumpGridActivity();
  }, [bumpGridActivity]);

  /** Do not clear the idle timer on leave — fade should still run after N s since last grid activity
   *  while the pointer is over dock, ribbon, or nav (fixes fade only after space switch). */
  const handleGridMouseLeave = useCallback(() => {}, []);

  /** Keyboard is grid activity too — page nav / tile focus must not fade mid-use. */
  useEffect(() => {
    if (!isHomeActive) return undefined;
    window.addEventListener('keydown', handleGridPointerMove);
    return () => window.removeEventListener('keydown', handleGridPointerMove);
  }, [isHomeActive, handleGridPointerMove]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pageEdgeTimerRef.current) {
        clearTimeout(pageEdgeTimerRef.current);
      }
      vfxTimersRef.current.forEach(clearTimeout);
      vfxTimersRef.current = [];
    };
  }, []);

  /** Wii strip: drive peek + layout math via inherited custom properties */
  const wiiStripCssVars = useMemo(() => {
    const safeTotalPages = Math.max(1, Number(gridConfig.totalPages || navigation.totalPages) || 1);
    const safeCurrentPage = Math.max(
      0,
      Math.min(Number(navigation.currentPage) || 0, safeTotalPages - 1)
    );
    const peek = Math.max(4, Math.min(14, Number(gridConfig.peekPercent) || 8));
    return {
      '--wii-strip-current-page': safeCurrentPage,
      '--wii-total-pages': safeTotalPages,
      '--wii-strip-peek': `${peek}%`,
    };
  }, [navigation.currentPage, navigation.totalPages, gridConfig.totalPages, gridConfig.peekPercent]);

  useEffect(() => {
    weeMarkChannelPage(Number(navigation.currentPage) || 0);
  }, [navigation.currentPage]);

  // Channel event handlers
  const handleChannelMediaChange = useCallback(
    (channelId, media) => {
      if (media instanceof File && !isSupportedImageOrVideoUpload(media)) {
        if (mediaNoticeTimerRef.current) clearTimeout(mediaNoticeTimerRef.current);
        setChannelMediaNotice(SUPPORTED_IMAGE_VIDEO_HINT);
        mediaNoticeTimerRef.current = setTimeout(() => {
          setChannelMediaNotice('');
          mediaNoticeTimerRef.current = null;
        }, 5000);
        return;
      }
      if (mediaNoticeTimerRef.current) {
        clearTimeout(mediaNoticeTimerRef.current);
        mediaNoticeTimerRef.current = null;
      }
      setChannelMediaNotice('');
      updateChannelMedia(channelId, media);
    },
    [updateChannelMedia]
  );

  const handleChannelAppPathChange = useCallback((channelId, path) => {
    updateChannelPath(channelId, path);
  }, [updateChannelPath]);

  const handleChannelSave = useCallback((channelId, config) => {
    updateChannelConfig(channelId, config);
  }, [updateChannelConfig]);

  const handleChannelHover = useCallback((_channelId, _isHovered) => {}, []);

  const handleDragStart = useCallback(
    (event) => {
      const idx = parseChannelDnDId(event.active.id);
      setActiveDragIndex(idx);
      clearVfxTimers();
      clearPageEdgeTimer();
      setLiftVfx(null);
      setDropVfx(null);
      setCelebrateIndex(null);
      setReorderWave(null);

      if (idx === null || resolveSlotHidden(idx)) {
        clearDragPreview();
        setActiveDragIndex(null);
        return;
      }

      const slotsSnap = Array.isArray(channelData?.slots)
        ? channelData.slots.map((s) => (s ? { ...s } : s))
        : [];
      const legacy = projectSlotsToLegacyMaps(slotsSnap);
      const snap = { slots: slotsSnap, layout: boardLayout, ...legacy };
      dragSnapshotRef.current = snap;
      dragOriginRef.current = idx;
      hoverIndexRef.current = idx;
      setHoverDragIndex(idx);
      setPreviewBoard(snap);

      const originId = `channel-${idx}`;
      const originSlot = slotsSnap[idx];
      const originConfig = legacy.configuredChannels[originId] || null;
      setDragOverlayPayload({
        id: originId,
        config: originConfig,
        slot: originSlot,
        empty:
          !originSlot ||
          (originSlot.kind === 'channel' &&
            (!originConfig || (!originConfig.media && !originConfig.path))),
      });

      if (mf.channelReorderParticles) {
        requestAnimationFrame(() => {
          const c = measureChannelSlotCenter(channelSpaceKey, idx);
          if (c) {
            burstKeyRef.current += 1;
            setLiftVfx({ cx: c.cx, cy: c.cy, key: burstKeyRef.current });
          }
        });
      }
    },
    [
      boardLayout,
      channelData?.slots,
      channelSpaceKey,
      clearDragPreview,
      clearPageEdgeTimer,
      clearVfxTimers,
      mf.channelReorderParticles,
      resolveSlotHidden,
    ]
  );

  const handleDragOver = useCallback(
    (event) => {
      const origin = dragOriginRef.current;
      if (origin === null || origin === undefined) return;
      if (isSpaceTransitioning || channelConfigureModalOpen) return;

      const to = event.over ? parseChannelDnDId(event.over.id) : null;
      if (to === null || to === hoverIndexRef.current) return;
      if (resolveSlotHidden(to)) return;

      const legalTo =
        normalizeDropTarget({
          slots: dragSnapshotRef.current?.slots || resolveSlots(),
          layout: boardLayout,
          hoverIndex: to,
          movingIndex: origin,
        }) ?? to;
      if (resolveSlotHidden(legalTo)) return;

      const prevHover = hoverIndexRef.current;
      hoverIndexRef.current = legalTo;
      setHoverDragIndex(legalTo);
      projectLiveReorder(origin, legalTo);

      if (mf.channelReorderSlotMotion && prevHover !== null && prevHover !== to) {
        reorderWaveIdRef.current += 1;
        setReorderWave({ from: prevHover, to, id: reorderWaveIdRef.current, live: true });
      }

      // Cross-page: follow the hovered slot’s page (continuous strip / iPhone pages).
      const perPage = Math.max(1, gridConfig.channelsPerPage || 12);
      const targetPage = Math.floor(to / perPage);
      const currentPage = Number(navigation.currentPage) || 0;
      if (targetPage !== currentPage && !navigation.isAnimating) {
        goToPage(targetPage);
      }
    },
    [
      boardLayout,
      channelConfigureModalOpen,
      goToPage,
      gridConfig.channelsPerPage,
      isSpaceTransitioning,
      mf.channelReorderSlotMotion,
      navigation.currentPage,
      navigation.isAnimating,
      projectLiveReorder,
      resolveSlotHidden,
      resolveSlots,
    ]
  );

  const handleDragMove = useCallback(
    (event) => {
      if (dragOriginRef.current === null) return;
      if (navigation.isAnimating || isSpaceTransitioning) {
        clearPageEdgeTimer();
        return;
      }

      const translated = event.active.rect.current.translated;
      if (!translated) return;

      const gridEl = document.querySelector(
        `.channels-content[data-channel-space="${channelSpaceKey}"] .wii-mode-grid`
      );
      if (!gridEl) return;
      const bounds = gridEl.getBoundingClientRect();
      if (bounds.width <= 0) return;

      const midX = translated.left + translated.width / 2;
      const edgePx = bounds.width * PAGE_EDGE_RATIO;
      let side = null;
      if (midX <= bounds.left + edgePx) side = 'left';
      else if (midX >= bounds.right - edgePx) side = 'right';

      if (!side) {
        clearPageEdgeTimer();
        return;
      }

      const totalPages = Math.max(1, Number(navigation.totalPages) || 1);
      if (totalPages <= 1) {
        clearPageEdgeTimer();
        return;
      }

      if (pageEdgeSideRef.current === side && pageEdgeTimerRef.current) return;
      clearPageEdgeTimer();
      pageEdgeSideRef.current = side;
      pageEdgeTimerRef.current = window.setTimeout(() => {
        pageEdgeTimerRef.current = null;
        const heldSide = pageEdgeSideRef.current;
        pageEdgeSideRef.current = null;
        if (heldSide === 'left') prevPage();
        else if (heldSide === 'right') nextPage();
      }, PAGE_EDGE_HOLD_MS);
    },
    [
      channelSpaceKey,
      clearPageEdgeTimer,
      isSpaceTransitioning,
      navigation.isAnimating,
      navigation.totalPages,
      nextPage,
      prevPage,
    ]
  );

  const handleDragEnd = useCallback(
    (event) => {
      const origin = dragOriginRef.current;
      const { active, over } = event;
      const from = origin ?? parseChannelDnDId(active.id);
      const to = over ? parseChannelDnDId(over.id) : hoverIndexRef.current;

      setActiveDragIndex(null);
      setLiftVfx(null);
      clearPageEdgeTimer();

      const legalTo =
        from !== null && to !== null
          ? normalizeDropTarget({
              slots: Array.isArray(channelData?.slots) ? channelData.slots : [],
              layout: boardLayout,
              hoverIndex: to,
              movingIndex: from,
            })
          : null;

      const canCommit =
        from !== null &&
        legalTo !== null &&
        from !== legalTo &&
        !resolveSlotHidden(from) &&
        !resolveSlotHidden(legalTo) &&
        !isSpaceTransitioning &&
        !channelConfigureModalOpen;

      if (canCommit) {
        reorderChannels(from, legalTo);
      }

      clearDragPreview();
      clearVfxTimers();

      if (!canCommit) return;

      if (mf.channelReorderParticles) {
        requestAnimationFrame(() => {
          const c = measureChannelSlotCenter(channelSpaceKey, legalTo);
          if (c) {
            burstKeyRef.current += 1;
            setDropVfx({ cx: c.cx, cy: c.cy, key: burstKeyRef.current });
          }
        });
        scheduleVfx(() => setDropVfx(null), 800);
      }

      if (mf.channelReorderSlotMotion) {
        setCelebrateIndex(legalTo);
        reorderWaveIdRef.current += 1;
        setReorderWave({ from, to: legalTo, id: reorderWaveIdRef.current, live: false });
        scheduleVfx(() => setCelebrateIndex(null), 720);
        scheduleVfx(() => setReorderWave(null), 980);
      }
    },
    [
      boardLayout,
      channelConfigureModalOpen,
      channelData?.slots,
      channelSpaceKey,
      clearDragPreview,
      clearPageEdgeTimer,
      clearVfxTimers,
      isSpaceTransitioning,
      mf.channelReorderParticles,
      mf.channelReorderSlotMotion,
      reorderChannels,
      resolveSlotHidden,
      scheduleVfx,
    ]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragIndex(null);
    setLiftVfx(null);
    clearDragPreview();
    clearVfxTimers();
    setReorderWave(null);
  }, [clearDragPreview, clearVfxTimers]);

  // Animation completion handler
  const handleAnimationComplete = useCallback(() => {
    finishAnimation();
  }, [finishAnimation]);

  // Micro-delights run only in the shared idle stages (ambient/attract);
  // attract raises the cadence so a populated tile gets spotlighted more often.
  const idleAnimationProps = useMemo(() => ({
    enabled: idleExperience.delightsActive,
    types: idleExperience.config.delightTypes,
    interval: idleExperience.attractActive
      ? Math.max(4, Math.round(idleExperience.config.delightIntervalSec / 2))
      : idleExperience.config.delightIntervalSec,
  }), [
    idleExperience.delightsActive,
    idleExperience.attractActive,
    idleExperience.config.delightTypes,
    idleExperience.config.delightIntervalSec,
  ]);

  // Use idle channel animations hook
  const { getChannelAnimationClass } = useIdleChannelAnimations(
    idleAnimationProps.enabled,
    idleAnimationProps.types,
    idleAnimationProps.interval,
    currentPageChannels
  );

  const renderChannelInner = useCallback(
    (channelIndex, wiiMode = false, overrideConfig = undefined) => {
      const channelId = `channel-${channelIndex}`;
      const channelConfig =
        overrideConfig !== undefined ? overrideConfig : resolveConfigAt(channelId);
      const isEmpty =
        overrideConfig !== undefined
          ? !overrideConfig || (!overrideConfig.media && !overrideConfig.path)
          : resolveIsEmpty(channelId);

      const liveSlots = Array.isArray(previewBoard?.slots)
        ? previewBoard.slots
        : channelData?.slots;
      const slotFromBoard = getSlotAt(liveSlots, channelId);
      const slot =
        overrideConfig !== undefined
          ? {
              kind: 'channel',
              hidden: false,
              colSpan: 1,
              rowSpan: 1,
              channel: overrideConfig
                ? {
                    media: overrideConfig.media ?? null,
                    path: overrideConfig.path ?? null,
                    launchType: overrideConfig.type ?? null,
                    icon: overrideConfig.icon ?? null,
                    asAdmin: overrideConfig.asAdmin,
                    hoverSound: overrideConfig.hoverSound,
                    animatedOnHover: overrideConfig.animatedOnHover,
                    title: overrideConfig.title,
                  }
                : null,
            }
          : slotFromBoard;

      const sharedProps = {
        onMediaChange: handleChannelMediaChange,
        onAppPathChange: handleChannelAppPathChange,
        onChannelSave: handleChannelSave,
        onHover: handleChannelHover,
        wiiMode,
        idleAnimationClass:
          idleAnimationProps.enabled ? getChannelAnimationClass(channelId) : '',
        isIdleAnimating: idleAnimationProps.enabled,
      };

      if (slot) {
        return (
          <HomeSlot
            key={channelId}
            slot={slot}
            channelId={channelId}
            arrangeMode={arrangeModeActive}
            punchMode={punchModeActive}
            selected={
              arrangeModeActive &&
              homeBoardSelectedSlotIndex != null &&
              homeBoardSelectedSlotIndex === channelIndex
            }
            onArrangeSelect={handleArrangeSelectChannelId}
            {...sharedProps}
          />
        );
      }

      return (
        <Channel
          key={channelId}
          id={channelId}
          type={channelConfig?.type || 'empty'}
          path={channelConfig?.path || null}
          icon={channelConfig?.icon || null}
          empty={isEmpty}
          media={channelConfig?.media || null}
          channelConfig={channelConfig || { empty: true }}
          arrangeMode={arrangeModeActive}
          punchMode={punchModeActive}
          selected={
            arrangeModeActive &&
            homeBoardSelectedSlotIndex != null &&
            homeBoardSelectedSlotIndex === channelIndex
          }
          onArrangeSelect={handleArrangeSelectChannelId}
          {...sharedProps}
        />
      );
    },
    [
      resolveConfigAt,
      resolveIsEmpty,
      channelData?.slots,
      previewBoard?.slots,
      handleChannelMediaChange,
      handleChannelAppPathChange,
      handleChannelSave,
      handleChannelHover,
      idleAnimationProps.enabled,
      getChannelAnimationClass,
      arrangeModeActive,
      punchModeActive,
      homeBoardSelectedSlotIndex,
      handleArrangeSelectChannelId,
    ]
  );

  const renderChannelAtIndex = useCallback(
    (channelIndex) => {
      const liveSlots = resolveSlots();
      const liveSlot = liveSlots[channelIndex] ?? null;
      const slotAt = liveSlot;
      const isWidgetSlot = Boolean(liveSlot && liveSlot.kind && liveSlot.kind !== 'channel');
      const selected =
        arrangeModeActive &&
        homeBoardSelectedSlotIndex != null &&
        homeBoardSelectedSlotIndex === channelIndex;
      const kindMeta = getHomeSlotKind(liveSlot?.kind ?? 'channel');
      const canCornerResize =
        selected &&
        !punchModeActive &&
        !resolveSlotHidden(channelIndex) &&
        Boolean(kindMeta?.sizePresets) &&
        (isWidgetSlot || !isChannelSlotEmpty(liveSlot));
      const { colSpan, rowSpan } = getSlotSpan(liveSlot);
      const kindMaxSpan = kindMeta?.sizePresets
        ? Object.values(kindMeta.sizePresets).reduce(
            (acc, preset) => ({
              colSpan: Math.max(acc.colSpan, preset.colSpan | 0),
              rowSpan: Math.max(acc.rowSpan, preset.rowSpan | 0),
            }),
            { colSpan: 1, rowSpan: 1 }
          )
        : null;

      return (
      <ChannelSlotDnd
        key={`channel-slot-${channelSpaceKey}-${channelIndex}`}
        channelSpaceKey={channelSpaceKey}
        channelIndex={channelIndex}
        disabled={
          navigation.isAnimating ||
          isSpaceTransitioning ||
          channelConfigureModalOpen ||
          resolveSlotHidden(channelIndex) ||
          punchModeActive ||
          // Widgets reorder in arrange mode; outside arrange, keep them anchored.
          (isWidgetSlot && !arrangeModeActive)
        }
        resizeActive={resizeActiveIndex === channelIndex}
        celebrateDrop={celebrateIndex === channelIndex}
        reorderWave={reorderWave}
        isPlaceholder={activeDragIndex !== null && hoverDragIndex === channelIndex}
      >
        {renderChannelInner(channelIndex, true)}
        {canCornerResize ? (
          <HomeSlotResizeHandle
            enabled
            anchorIndex={channelIndex}
            colSpan={colSpan}
            rowSpan={rowSpan}
            slots={liveSlots}
            columns={gridConfig.columns}
            rows={gridConfig.rows}
            maxColSpan={kindMaxSpan?.colSpan}
            maxRowSpan={kindMaxSpan?.rowSpan}
            onCommit={(nextCol, nextRow) => handleSetSlotSpan(channelIndex, nextCol, nextRow)}
            onResizeActiveChange={(active) => {
              setResizeActiveIndex(active ? channelIndex : null);
            }}
          />
        ) : null}
      </ChannelSlotDnd>
      );
    },
    [
      channelSpaceKey,
      resolveSlots,
      resolveSlotHidden,
      navigation.isAnimating,
      isSpaceTransitioning,
      channelConfigureModalOpen,
      renderChannelInner,
      celebrateIndex,
      reorderWave,
      activeDragIndex,
      hoverDragIndex,
      punchModeActive,
      arrangeModeActive,
      homeBoardSelectedSlotIndex,
      resizeActiveIndex,
      gridConfig.columns,
      gridConfig.rows,
      handleSetSlotSpan,
    ]
  );

  const renderContent = useMemo(() => {
    const safeTotalPages = Math.max(1, Number(gridConfig.totalPages || navigation.totalPages) || 1);

    return (
      <div className="wii-mode-container">
        <WiiChannelStrip
          totalPages={safeTotalPages}
          currentPage={navigation.currentPage || 0}
          animationDirection={navigation.animationDirection || 'none'}
          animationWrapped={Boolean(navigation.animationWrapped)}
          isAnimating={navigation.isAnimating}
          isGridFaded={isGridFaded}
          columns={gridConfig.columns}
          rows={gridConfig.rows}
          slotMeta={slotMeta}
          slots={channelData?.slots}
          onGridMouseEnter={handleGridMouseEnter}
          onGridMouseLeave={handleGridMouseLeave}
          onGridPointerMove={handleGridPointerMove}
          onGridPointerDown={bumpGridActivity}
          onGridWheel={bumpGridActivity}
          renderChannelAtIndex={renderChannelAtIndex}
          onPageFlipComplete={handleAnimationComplete}
          hubEntranceKey={entranceKey}
          hubEntranceTier={channelEntranceTier}
          focusRecedeEnabled={effectiveSettings.focusRecedeEnabled}
          arrangeModeActive={arrangeModeActive}
          punchModeActive={punchModeActive}
          onTogglePunch={handleTogglePunchSlot}
          onArrangeSelectIndex={
            arrangeModeActive && !punchModeActive ? handleArrangeSelectIndex : undefined
          }
        />
      </div>
    );
  }, [
    navigation,
    gridConfig,
    slotMeta,
    channelData?.slots,
    isGridFaded,
    handleGridMouseEnter,
    handleGridMouseLeave,
    handleGridPointerMove,
    bumpGridActivity,
    renderChannelAtIndex,
    handleAnimationComplete,
    entranceKey,
    channelEntranceTier,
    effectiveSettings.focusRecedeEnabled,
    arrangeModeActive,
    punchModeActive,
    handleTogglePunchSlot,
    handleArrangeSelectIndex,
  ]);

  const channelsContent = (
    <MotionDiv
      variants={channelReturnVariants}
      initial={false}
      animate={channelEntranceState}
      onAnimationComplete={
        channelEntranceState === 'show' ? () => onEntranceComplete(entranceKey) : undefined
      }
      className="channels-content"
      style={wiiStripCssVars}
      data-channel-space={channelSpaceKey}
      onContextMenuCapture={isChannelBoardSpace ? handleBoardContextMenuCapture : undefined}
    >
      {renderContent}
    </MotionDiv>
  );

  return (
    <div className="paginated-channels-container">
      {channelMediaNotice ? (
        <div
          className="channel-media-format-notice mb-2 px-3 py-2 rounded-md text-sm font-medium"
          role="status"
        >
          {channelMediaNotice}
        </div>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={channelGridCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {isChannelBoardSpace ? (
          <ContextMenu.Root modal={false}>
            <ContextMenu.Trigger asChild>{channelsContent}</ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Content
                className="z-[var(--z-home-context-menu)] min-w-[13rem] rounded-[1.25rem] border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--wee-pill-glass))] p-1.5 shadow-[var(--wee-pill-shadow)] backdrop-blur-xl"
                collisionPadding={12}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {!arrangeModeActive && contextTileIsChannel ? (
                  <ContextMenu.Item
                    className={HOME_CONTEXT_ITEM_CLASS}
                    onSelect={handleConfigureContextTile}
                  >
                    <Settings2 size={14} strokeWidth={2.5} aria-hidden />
                    Configure channel
                  </ContextMenu.Item>
                ) : null}
                {arrangeModeActive && contextTileIsEmpty ? (
                  <ContextMenu.Item
                    className={HOME_CONTEXT_ITEM_CLASS}
                    onSelect={handleAddWidgetContextTile}
                  >
                    <Plus size={14} strokeWidth={2.5} aria-hidden />
                    Add widget here
                  </ContextMenu.Item>
                ) : null}
                {arrangeModeActive && contextTileIsConfiguredChannel ? (
                  <ContextMenu.Item
                    className={HOME_CONTEXT_ITEM_CLASS}
                    onSelect={handleReplaceContextTile}
                  >
                    <Replace size={14} strokeWidth={2.5} aria-hidden />
                    Replace with widget…
                  </ContextMenu.Item>
                ) : null}
                {arrangeModeActive ? (
                  <ContextMenu.Item
                    className={HOME_CONTEXT_ITEM_CLASS}
                    onSelect={exitHomeBoardArrange}
                  >
                    <Check size={14} strokeWidth={2.5} aria-hidden />
                    Done editing
                    <span className="ml-auto pl-3 font-bold normal-case tracking-normal text-[hsl(var(--text-tertiary))]">
                      Esc
                    </span>
                  </ContextMenu.Item>
                ) : (
                  <ContextMenu.Item
                    className={HOME_CONTEXT_ITEM_CLASS}
                    onSelect={enterHomeBoardArrange}
                  >
                    <LayoutGrid size={14} strokeWidth={2.5} aria-hidden />
                    Edit Home
                    <span className="ml-auto pl-3 font-bold normal-case tracking-normal text-[hsl(var(--text-tertiary))]">
                      Ctrl+E
                    </span>
                  </ContextMenu.Item>
                )}
                {contextTileIndex != null ? (
                  <ContextMenu.Item
                    className={HOME_CONTEXT_ITEM_CLASS}
                    onSelect={handlePunchContextTile}
                  >
                    <PenLine size={14} strokeWidth={2.5} aria-hidden />
                    {isChannelSlotHidden(contextTileIndex)
                      ? 'Restore this slot'
                      : 'Punch wallpaper hole'}
                  </ContextMenu.Item>
                ) : null}
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        ) : (
          channelsContent
        )}

        <DragOverlay dropAnimation={null}>
          {dragOverlayPayload ? (
            <ChannelDragOverlayFrame empty={dragOverlayPayload.empty}>
              {renderChannelInner(
                activeDragIndex ?? 0,
                true,
                dragOverlayPayload.config
              )}
            </ChannelDragOverlayFrame>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Fixed chrome portals to <body>: the space-world track is transformed
          (`will-change: transform`), which would otherwise make it the containing
          block for position:fixed and clip/bury this UI behind the dock. */}
      {isChannelBoardSpace
        ? createPortal(
        <>
          <HomeBoardArrangeBar
            arrangeMode={arrangeModeActive && !channelConfigureModalOpen}
            punchMode={punchModeActive}
            onTogglePunch={toggleHomeBoardPunchMode}
            onDone={exitHomeBoardArrange}
            selectedSlot={selectedSlot}
            selectedIndex={homeBoardSelectedSlotIndex}
            canAddWidget={addTargetIndex != null}
            onAddWidget={handleAddWidget}
            onRemoveWidget={handleRemoveWidget}
            onSetSizePreset={handleSetSizePreset}
            onSetSurface={handleSetSurface}
            onSetListenApp={handleSetListenApp}
            blockedPresetIds={blockedSizePresetIds}
            pickerOpen={arrangePickerOpen}
            onPickerOpenChange={setArrangePickerOpen}
            onReopenGuide={handleReopenGuide}
          />
          <AnimatePresence>
            {isHomeSpace && widgetCoachVisible ? (
              <MotionDiv
                key="home-widget-coach"
                className="pointer-events-none fixed inset-x-0 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] z-[var(--z-home-arrange-bar)] flex justify-center px-4"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                transition={createWeeTransition('pillOpen', { reducedMotion })}
              >
                <WeeGlassPill className="pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2">
                  <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                    {widgetCoachCopy}
                  </span>
                  <button
                    type="button"
                    onClick={dismissWidgetCoach}
                    aria-label="Dismiss widget coach"
                    className="rounded-full p-1 text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--state-hover))] hover:text-[hsl(var(--text-primary))]"
                  >
                    <X size={13} strokeWidth={2.5} aria-hidden />
                  </button>
                </WeeGlassPill>
              </MotionDiv>
            ) : null}
          </AnimatePresence>
          <AnimatePresence>
            {isHomeActive && !homeArrangeHintSeen && !arrangeModeActive ? (
              <MotionDiv
                key="home-arrange-hint"
                className="pointer-events-none fixed inset-x-0 bottom-[max(6.75rem,calc(env(safe-area-inset-bottom)+5.75rem))] z-[var(--z-home-arrange-bar)] flex justify-center px-4"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                transition={createWeeTransition('pillOpen', { reducedMotion })}
              >
                <WeeGlassPill className="pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2">
                  <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                    Tip: right-click a widget to edit it — or use the spaces rail / Ctrl+E
                  </span>
                  <button
                    type="button"
                    onClick={dismissArrangeHint}
                    aria-label="Dismiss arrange tip"
                    className="rounded-full p-1 text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--state-hover))] hover:text-[hsl(var(--text-primary))]"
                  >
                    <X size={13} strokeWidth={2.5} aria-hidden />
                  </button>
                </WeeGlassPill>
              </MotionDiv>
            ) : null}
          </AnimatePresence>
        </>,
            document.body
          )
        : null}

      <ChannelReorderVfxPortal lift={liftVfx} drop={dropVfx} />
    </div>
  );
});

function PaginatedChannels({ channelSpaceKey = 'home' }) {
  return (
    <ChannelSpaceProvider channelSpaceKey={channelSpaceKey}>
      <PaginatedChannelsInner />
    </ChannelSpaceProvider>
  );
}

PaginatedChannels.propTypes = {
  channelSpaceKey: PropTypes.oneOf(['home', 'workspaces']),
};

export default PaginatedChannels;

