import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from '@dnd-kit/core';
import { Channel } from '../channels';
import SlideNavigation from './SlideNavigation';
import useChannelOperations from '../../utils/useChannelOperations';
import { ChannelSpaceProvider } from '../../contexts/ChannelSpaceContext';
import useIdleChannelAnimations from '../../utils/useIdleChannelAnimations';
import { WII_LAYOUT_PRESET } from '../../utils/channelLayoutSystem';
import { ChannelGridPage, WiiChannelStrip } from '../channels';
import ChannelSlotDnd, { parseChannelDnDId } from './ChannelSlotDnd';
import { ChannelDragOverlayFrame } from './ChannelDragMotion';
import { ChannelReorderVfxPortal, measureChannelSlotCenter } from './ChannelReorderVfx';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import {
  isSupportedImageOrVideoUpload,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../../utils/supportedUploadMedia';
import './PaginatedChannels.css';

const PaginatedChannelsInner = React.memo(() => {
  // ✅ DATA LAYER: Use the new channel operations hook
  const {
    gridConfig,
    navigation,
    channelSettings,
    getCurrentPageChannels,
    getChannelConfig,
    isChannelEmpty,
    finishAnimation,
    updateChannelConfig,
    updateChannelMedia,
    updateChannelPath,
    reorderChannels,
  } = useChannelOperations();

  const mf = useMotionFeedback();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a short pull so normal clicks still launch the channel.
      activationConstraint: { distance: 6 },
    })
  );

  const [activeDragIndex, setActiveDragIndex] = useState(null);
  const [channelMediaNotice, setChannelMediaNotice] = useState('');
  const mediaNoticeTimerRef = useRef(null);
  const [liftVfx, setLiftVfx] = useState(null);
  const [dropVfx, setDropVfx] = useState(null);
  const [celebrateIndex, setCelebrateIndex] = useState(null);
  const [reorderWave, setReorderWave] = useState(null);
  const burstKeyRef = useRef(0);
  const reorderWaveIdRef = useRef(0);
  const vfxTimersRef = useRef([]);

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
    autoFadeTimeout: channelSettings.channelAutoFadeTimeout ?? 5
  }), [channelSettings]);

  // Grid-level auto-fade functionality
  const [isGridFaded, setIsGridFaded] = useState(false);
  const gridFadeTimeoutRef = useRef(null);
  const autoFadeTimeout = effectiveSettings.autoFadeTimeout;
  const isWiiMode = navigation.mode === 'wii';

  // Handle grid hover events
  const handleGridMouseEnter = useCallback(() => {
    // Clear auto-fade timeout and restore opacity
    if (gridFadeTimeoutRef.current) {
      clearTimeout(gridFadeTimeoutRef.current);
      gridFadeTimeoutRef.current = null;
    }
    setIsGridFaded(false);
  }, []);

  const handleGridMouseLeave = useCallback(() => {
    if (autoFadeTimeout > 0) {
      gridFadeTimeoutRef.current = setTimeout(() => {
        setIsGridFaded(true);
      }, autoFadeTimeout * 1000);
    }
  }, [autoFadeTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gridFadeTimeoutRef.current) {
        clearTimeout(gridFadeTimeoutRef.current);
      }
      vfxTimersRef.current.forEach(clearTimeout);
      vfxTimersRef.current = [];
    };
  }, []);

  // If fade is disabled, immediately restore visibility.
  useEffect(() => {
    if (autoFadeTimeout <= 0) {
      if (gridFadeTimeoutRef.current) {
        clearTimeout(gridFadeTimeoutRef.current);
        gridFadeTimeoutRef.current = null;
      }
      setIsGridFaded(false);
    }
  }, [autoFadeTimeout]);

  /** Wii strip: drive peek + layout math via inherited custom properties */
  const wiiStripCssVars = useMemo(() => {
    if (!isWiiMode) return undefined;
    const safeTotalPages = Math.max(1, Number(navigation.totalPages) || 1);
    const safeCurrentPage = Math.max(
      0,
      Math.min(Number(navigation.currentPage) || 0, safeTotalPages - 1)
    );
    return {
      '--wii-strip-current-page': safeCurrentPage,
      '--wii-total-pages': safeTotalPages,
    };
  }, [isWiiMode, navigation.currentPage, navigation.totalPages]);

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
      setLiftVfx(null);
      setDropVfx(null);
      setCelebrateIndex(null);
      setReorderWave(null);
      if (mf.channelReorderParticles) {
        requestAnimationFrame(() => {
          if (idx === null) return;
          const c = measureChannelSlotCenter(idx);
          if (c) {
            burstKeyRef.current += 1;
            setLiftVfx({ cx: c.cx, cy: c.cy, key: burstKeyRef.current });
          }
        });
      }
    },
    [clearVfxTimers, mf.channelReorderParticles]
  );

  const handleDragEnd = useCallback(
    (event) => {
      setActiveDragIndex(null);
      setLiftVfx(null);
      const { active, over } = event;
      if (!over || navigation.isAnimating) return;
      const from = parseChannelDnDId(active.id);
      const to = parseChannelDnDId(over.id);
      if (from === null || to === null || from === to) return;

      reorderChannels(from, to);

      clearVfxTimers();

      if (mf.channelReorderParticles) {
        requestAnimationFrame(() => {
          const c = measureChannelSlotCenter(to);
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
        setReorderWave({ from, to, id: reorderWaveIdRef.current });
        scheduleVfx(() => setCelebrateIndex(null), 720);
        scheduleVfx(() => setReorderWave(null), 980);
      }
    },
    [
      clearVfxTimers,
      mf.channelReorderParticles,
      mf.channelReorderSlotMotion,
      navigation.isAnimating,
      reorderChannels,
      scheduleVfx,
    ]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragIndex(null);
    setLiftVfx(null);
    clearVfxTimers();
  }, [clearVfxTimers]);

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
    (channelIndex, wiiMode = false) => {
      const channelId = `channel-${channelIndex}`;
      const channelConfig = getChannelConfig(channelId);
      const isEmpty = isChannelEmpty(channelId);

      return (
        <Channel
          key={channelId}
          id={channelId}
          type={channelConfig?.type || 'empty'}
          path={channelConfig?.path || null}
          icon={channelConfig?.icon || null}
          empty={isEmpty}
          media={channelConfig?.media || null}
          onMediaChange={handleChannelMediaChange}
          onAppPathChange={handleChannelAppPathChange}
          onChannelSave={handleChannelSave}
          onHover={handleChannelHover}
          channelConfig={channelConfig || { empty: true }}
          wiiMode={wiiMode}
          idleAnimationClass={
            idleAnimationProps.enabled ? getChannelAnimationClass(channelId) : ''
          }
          isIdleAnimating={idleAnimationProps.enabled}
        />
      );
    },
    [
      getChannelConfig,
      isChannelEmpty,
      handleChannelMediaChange,
      handleChannelAppPathChange,
      handleChannelSave,
      handleChannelHover,
      idleAnimationProps.enabled,
      getChannelAnimationClass,
    ]
  );

  const renderChannelAtIndex = useCallback(
    (channelIndex, wiiMode = false) => (
      <ChannelSlotDnd
        key={`channel-slot-${channelIndex}`}
        channelIndex={channelIndex}
        disabled={navigation.isAnimating}
        celebrateDrop={celebrateIndex === channelIndex}
        reorderWave={reorderWave}
      >
        {renderChannelInner(channelIndex, wiiMode)}
      </ChannelSlotDnd>
    ),
    [
      navigation.isAnimating,
      renderChannelInner,
      celebrateIndex,
      reorderWave,
    ]
  );

  // Render content based on mode
  const renderContent = useMemo(() => {
    const { mode } = navigation;
    const safeTotalPages = Math.max(1, Number(navigation.totalPages) || 1);
    
    if (mode === 'simple') {
      return (
        <SlideNavigation>
          {Array.from({ length: safeTotalPages }, (_, pageIndex) => (
            <ChannelGridPage
              key={`page-${pageIndex}`}
              pageIndex={pageIndex}
              columns={gridConfig.columns}
              rows={gridConfig.rows}
              channelsPerPage={gridConfig.channelsPerPage}
              totalChannels={gridConfig.totalChannels}
              isGridFaded={isGridFaded}
              onGridMouseEnter={handleGridMouseEnter}
              onGridMouseLeave={handleGridMouseLeave}
              renderChannelAtIndex={renderChannelAtIndex}
            />
          ))}
        </SlideNavigation>
      );
    }

    return (
      <div className="wii-mode-container">
        <WiiChannelStrip
          totalPages={safeTotalPages}
          isAnimating={navigation.isAnimating}
          isGridFaded={isGridFaded}
          columns={WII_LAYOUT_PRESET.columns}
          rows={WII_LAYOUT_PRESET.rows}
          onGridMouseEnter={handleGridMouseEnter}
          onGridMouseLeave={handleGridMouseLeave}
          renderChannelAtIndex={renderChannelAtIndex}
        />
      </div>
    );
  }, [
    navigation,
    gridConfig.columns,
    gridConfig.rows,
    gridConfig.channelsPerPage,
    gridConfig.totalChannels,
    isGridFaded,
    handleGridMouseEnter,
    handleGridMouseLeave,
    renderChannelAtIndex,
  ]);

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
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="channels-content" style={wiiStripCssVars}>
          {renderContent}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragIndex !== null ? (
            <ChannelDragOverlayFrame>
              {renderChannelInner(activeDragIndex, isWiiMode)}
            </ChannelDragOverlayFrame>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ChannelReorderVfxPortal lift={liftVfx} drop={dropVfx} />

      {/* Animation completion listener */}
      {navigation.isAnimating && (
        <div
          className="animation-listener"
          onAnimationEnd={handleAnimationComplete}
          onTransitionEnd={handleAnimationComplete}
        />
      )}
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

