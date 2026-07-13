import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
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
import { LayoutGrid } from 'lucide-react';
import { Channel } from '../channels';
import { HomeSlot, HomeBoardArrangeBar, HomePageIndicator } from '../home-grid';
import useChannelOperations from '../../utils/useChannelOperations';
import { useHomeBoardArrange } from '../../hooks/useHomeBoardArrange';
import { getSlotAt } from '../../utils/homeGridSlots';
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
import { createHomeChannelEntranceBandVariants, createHubEntranceBandVariants } from '../../design/weeMotion';
import { useHubSpaceEntrance } from '../../hooks/useHubSpaceEntrance';
import { useAppActivity } from '../../hooks/useAppActivity';
import { weeMarkChannelPage } from '../../utils/weePerformanceMarks';
import { applyChannelSlotReorder, snapshotChannelSlotMaps } from '../../utils/channelReorder';
import './PaginatedChannels.css';

const MotionDiv = m.div;

/** Hold near strip edge before auto-flipping pages (iPhone-style). */
const PAGE_EDGE_HOLD_MS = 480;
const PAGE_EDGE_RATIO = 0.11;

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
    enterArrange: enterHomeBoardArrange,
    exitArrange: exitHomeBoardArrange,
    togglePunchMode: toggleHomeBoardPunchMode,
  } = useHomeBoardArrange();
  const { isAppActive } = useAppActivity();
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
  const [previewMaps, setPreviewMaps] = useState(null);
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
    setPreviewMaps(null);
    setHoverDragIndex(null);
    setDragOverlayPayload(null);
    clearPageEdgeTimer();
  }, [clearPageEdgeTimer]);

  const projectLiveReorder = useCallback(
    (fromIndex, toIndex) => {
      const snap = dragSnapshotRef.current;
      if (!snap) return;
      const n = gridConfig.totalChannels | 0;
      if (fromIndex === toIndex) {
        setPreviewMaps(snap);
        return;
      }
      setPreviewMaps(
        applyChannelSlotReorder({
          fromIndex,
          toIndex,
          totalChannels: n,
          configuredChannels: snap.configuredChannels,
          channelConfigs: snap.channelConfigs,
        })
      );
    },
    [gridConfig.totalChannels]
  );

  const resolveConfigAt = useCallback(
    (channelId) => {
      if (previewMaps?.configuredChannels) {
        return previewMaps.configuredChannels[channelId] || null;
      }
      return getChannelConfig(channelId);
    },
    [previewMaps, getChannelConfig]
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
    idleAnimationEnabled: channelSettings.idleAnimationEnabled ?? false,
    idleAnimationTypes: channelSettings.idleAnimationTypes ?? ['pulse', 'bounce', 'glow'],
    idleAnimationInterval: channelSettings.idleAnimationInterval ?? 8,
    autoFadeTimeout: channelSettings.autoFadeTimeout ?? 5,
    focusRecedeEnabled: channelSettings.focusRecedeEnabled ?? true,
  }), [channelSettings]);

  // Grid-level auto-fade: fade after `autoFadeTimeout` seconds of *no* pointer activity on the grid
  // (idle). Restore via bumpGridActivity on pointer move/enter — not CSS :hover (parked cursor
  // over tiles must still allow fade).
  const [isGridFaded, setIsGridFaded] = useState(false);
  const idleFadeTimerRef = useRef(null);
  const lastPointerThrottleRef = useRef(0);
  const autoFadeTimeout = effectiveSettings.autoFadeTimeout;
  const isHomeSpace = channelSpaceKey === 'home';
  const isHomeActive = isHomeSpace && activeSpaceId === 'home';

  // Live Board Studio only applies to the live Home board.
  const arrangeModeActive = isHomeSpace && homeBoardArrangeMode;
  const punchModeActive = isHomeSpace && homeBoardPunchMode;

  const handleTogglePunchSlot = useCallback(
    (channelIndex) => {
      setSlotHidden(channelIndex, !isChannelSlotHidden(channelIndex));
    },
    [setSlotHidden, isChannelSlotHidden]
  );

  useEffect(() => {
    if (!isHomeSpace && homeBoardArrangeMode) {
      exitHomeBoardArrange();
    }
  }, [isHomeSpace, homeBoardArrangeMode, exitHomeBoardArrange]);

  const clearIdleFadeTimer = useCallback(() => {
    if (idleFadeTimerRef.current) {
      clearTimeout(idleFadeTimerRef.current);
      idleFadeTimerRef.current = null;
    }
  }, []);

  const scheduleIdleFade = useCallback(() => {
    clearIdleFadeTimer();
    if (!isHomeActive) return;
    if (autoFadeTimeout <= 0) return;
    idleFadeTimerRef.current = window.setTimeout(() => {
      idleFadeTimerRef.current = null;
      setIsGridFaded(true);
    }, autoFadeTimeout * 1000);
  }, [autoFadeTimeout, clearIdleFadeTimer, isHomeActive]);

  const bumpGridActivity = useCallback(() => {
    if (!isHomeActive) return;
    setIsGridFaded(false);
    scheduleIdleFade();
  }, [scheduleIdleFade, isHomeActive]);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (idleFadeTimerRef.current) {
        clearTimeout(idleFadeTimerRef.current);
      }
      if (pageEdgeTimerRef.current) {
        clearTimeout(pageEdgeTimerRef.current);
      }
      vfxTimersRef.current.forEach(clearTimeout);
      vfxTimersRef.current = [];
    };
  }, []);

  // Home-only auto-fade lifecycle policy:
  // - Returning to Home always resets to visible and starts a fresh timer
  // - Inactive app while in Home is allowed to fade
  // - Regaining app activity in Home resets to visible and restarts timer
  useEffect(() => {
    clearIdleFadeTimer();

    if (!isHomeSpace) {
      setIsGridFaded(false);
      return undefined;
    }

    if (!isHomeActive) {
      setIsGridFaded(false);
      return undefined;
    }

    if (autoFadeTimeout <= 0) {
      clearIdleFadeTimer();
      setIsGridFaded(false);
      return undefined;
    }

    if (isAppActive) {
      setIsGridFaded(false);
      scheduleIdleFade();
      return () => clearIdleFadeTimer();
    }

    // App inactive while Home is active: fade is allowed from current visual state.
    scheduleIdleFade();
    return () => clearIdleFadeTimer();
  }, [
    autoFadeTimeout,
    clearIdleFadeTimer,
    scheduleIdleFade,
    isHomeSpace,
    isHomeActive,
    isAppActive,
  ]);

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

      if (idx === null || isSlotHidden(slotMeta, idx)) {
        clearDragPreview();
        setActiveDragIndex(null);
        return;
      }

      const snap = snapshotChannelSlotMaps(configuredChannels, channelConfigs);
      dragSnapshotRef.current = snap;
      dragOriginRef.current = idx;
      hoverIndexRef.current = idx;
      setHoverDragIndex(idx);
      setPreviewMaps(snap);

      const originId = `channel-${idx}`;
      const originConfig = snap.configuredChannels[originId] || null;
      setDragOverlayPayload({
        id: originId,
        config: originConfig,
        empty: !originConfig || (!originConfig.media && !originConfig.path),
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
      channelConfigs,
      channelSpaceKey,
      clearDragPreview,
      clearPageEdgeTimer,
      clearVfxTimers,
      configuredChannels,
      mf.channelReorderParticles,
      slotMeta,
    ]
  );

  const handleDragOver = useCallback(
    (event) => {
      const origin = dragOriginRef.current;
      if (origin === null || origin === undefined) return;
      if (isSpaceTransitioning || channelConfigureModalOpen) return;

      const to = event.over ? parseChannelDnDId(event.over.id) : null;
      if (to === null || to === hoverIndexRef.current) return;
      if (isSlotHidden(slotMeta, to)) return;

      const prevHover = hoverIndexRef.current;
      hoverIndexRef.current = to;
      setHoverDragIndex(to);
      projectLiveReorder(origin, to);

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
      channelConfigureModalOpen,
      goToPage,
      gridConfig.channelsPerPage,
      isSpaceTransitioning,
      mf.channelReorderSlotMotion,
      navigation.currentPage,
      navigation.isAnimating,
      projectLiveReorder,
      slotMeta,
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

      const currentPage = Number(navigation.currentPage) || 0;
      const totalPages = Math.max(1, Number(navigation.totalPages) || 1);
      if (side === 'left' && currentPage <= 0) {
        clearPageEdgeTimer();
        return;
      }
      if (side === 'right' && currentPage >= totalPages - 1) {
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
        if (heldSide === 'left') goToPage(Math.max(0, currentPage - 1));
        else if (heldSide === 'right') goToPage(Math.min(totalPages - 1, currentPage + 1));
      }, PAGE_EDGE_HOLD_MS);
    },
    [
      channelSpaceKey,
      clearPageEdgeTimer,
      goToPage,
      isSpaceTransitioning,
      navigation.currentPage,
      navigation.isAnimating,
      navigation.totalPages,
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

      const canCommit =
        from !== null &&
        to !== null &&
        from !== to &&
        !isSlotHidden(slotMeta, from) &&
        !isSlotHidden(slotMeta, to) &&
        !isSpaceTransitioning &&
        !channelConfigureModalOpen;

      if (canCommit) {
        reorderChannels(from, to);
      }

      clearDragPreview();
      clearVfxTimers();

      if (!canCommit) return;

      if (mf.channelReorderParticles) {
        requestAnimationFrame(() => {
          const c = measureChannelSlotCenter(channelSpaceKey, to);
          if (c) {
            burstKeyRef.current += 1;
            setDropVfx({ cx: c.cx, cy: c.cy, key: burstKeyRef.current });
          }
        });
        scheduleVfx(() => setDropVfx(null), 800);
      }

      if (mf.channelReorderSlotMotion) {
        setCelebrateIndex(to);
        reorderWaveIdRef.current += 1;
        setReorderWave({ from, to, id: reorderWaveIdRef.current, live: false });
        scheduleVfx(() => setCelebrateIndex(null), 720);
        scheduleVfx(() => setReorderWave(null), 980);
      }
    },
    [
      channelConfigureModalOpen,
      channelSpaceKey,
      clearDragPreview,
      clearPageEdgeTimer,
      clearVfxTimers,
      isSpaceTransitioning,
      mf.channelReorderParticles,
      mf.channelReorderSlotMotion,
      reorderChannels,
      slotMeta,
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

  // ✅ DATA LAYER: Use idle animations from consolidated store
  const idleAnimationProps = useMemo(() => ({
    enabled: effectiveSettings.idleAnimationEnabled,
    types: effectiveSettings.idleAnimationTypes,
    interval: effectiveSettings.idleAnimationInterval
  }), [effectiveSettings]);

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

      const slotFromBoard = getSlotAt(channelData?.slots, channelId);
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
          {...sharedProps}
        />
      );
    },
    [
      resolveConfigAt,
      resolveIsEmpty,
      channelData?.slots,
      handleChannelMediaChange,
      handleChannelAppPathChange,
      handleChannelSave,
      handleChannelHover,
      idleAnimationProps.enabled,
      getChannelAnimationClass,
    ]
  );

  const renderChannelAtIndex = useCallback(
    (channelIndex) => (
      <ChannelSlotDnd
        key={`channel-slot-${channelSpaceKey}-${channelIndex}`}
        channelSpaceKey={channelSpaceKey}
        channelIndex={channelIndex}
        disabled={
          navigation.isAnimating ||
          isSpaceTransitioning ||
          channelConfigureModalOpen ||
          isChannelSlotHidden(channelIndex)
        }
        celebrateDrop={celebrateIndex === channelIndex}
        reorderWave={reorderWave}
        isPlaceholder={activeDragIndex !== null && hoverDragIndex === channelIndex}
      >
        {renderChannelInner(channelIndex, true)}
      </ChannelSlotDnd>
    ),
    [
      channelSpaceKey,
      navigation.isAnimating,
      isSpaceTransitioning,
      channelConfigureModalOpen,
      renderChannelInner,
      celebrateIndex,
      reorderWave,
      activeDragIndex,
      hoverDragIndex,
      isChannelSlotHidden,
    ]
  );

  const renderContent = useMemo(() => {
    const safeTotalPages = Math.max(1, Number(gridConfig.totalPages || navigation.totalPages) || 1);

    return (
      <div className="wii-mode-container">
        <WiiChannelStrip
          totalPages={safeTotalPages}
          currentPage={navigation.currentPage || 0}
          isAnimating={navigation.isAnimating}
          isGridFaded={isGridFaded}
          columns={gridConfig.columns}
          rows={gridConfig.rows}
          slotMeta={slotMeta}
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
        />
      </div>
    );
  }, [
    navigation,
    gridConfig,
    slotMeta,
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
        {isHomeSpace ? (
          <ContextMenu.Root modal={false}>
            <ContextMenu.Trigger asChild>{channelsContent}</ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Content
                className="z-[2400] min-w-[13rem] rounded-[1.25rem] border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--wee-pill-glass))] p-1.5 shadow-[var(--wee-pill-shadow)] backdrop-blur-xl"
                collisionPadding={12}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <ContextMenu.Item
                  className="flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[11px] font-black uppercase tracking-wide text-[hsl(var(--text-secondary))] outline-none data-[highlighted]:bg-[hsl(var(--state-hover))] data-[highlighted]:text-[hsl(var(--text-primary))]"
                  onSelect={enterHomeBoardArrange}
                >
                  <LayoutGrid size={14} strokeWidth={2.5} aria-hidden />
                  Arrange Home board
                </ContextMenu.Item>
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

      {isHomeSpace ? (
        <>
          <HomePageIndicator />
          <HomeBoardArrangeBar
            arrangeMode={arrangeModeActive}
            punchMode={punchModeActive}
            onTogglePunch={toggleHomeBoardPunchMode}
            onDone={exitHomeBoardArrange}
          />
        </>
      ) : null}

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

