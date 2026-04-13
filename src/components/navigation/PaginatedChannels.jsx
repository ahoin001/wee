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
import useIdleChannelAnimations from '../../utils/useIdleChannelAnimations';
import { WII_LAYOUT_PRESET } from '../../utils/channelLayoutSystem';
import { ChannelGridPage, WiiChannelStrip } from '../channels';
import ChannelSlotDnd, { parseChannelDnDId } from './ChannelSlotDnd';
import './PaginatedChannels.css';

const PaginatedChannels = React.memo(() => {
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const [activeDragIndex, setActiveDragIndex] = useState(null);

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
    // Keep Wii mode fully visible; auto-fade is reserved for simple mode.
    if (!isWiiMode && autoFadeTimeout > 0) {
      gridFadeTimeoutRef.current = setTimeout(() => {
        setIsGridFaded(true);
      }, autoFadeTimeout * 1000);
    }
  }, [autoFadeTimeout, isWiiMode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gridFadeTimeoutRef.current) {
        clearTimeout(gridFadeTimeoutRef.current);
      }
    };
  }, []);

  // Ensure mode switches do not keep a stale fade state.
  useEffect(() => {
    if (isWiiMode) {
      if (gridFadeTimeoutRef.current) {
        clearTimeout(gridFadeTimeoutRef.current);
        gridFadeTimeoutRef.current = null;
      }
      setIsGridFaded(false);
    }
  }, [isWiiMode]);



  // Channel event handlers
  const handleChannelMediaChange = useCallback((channelId, media) => {
    updateChannelMedia(channelId, media);
  }, [updateChannelMedia]);

  const handleChannelAppPathChange = useCallback((channelId, path) => {
    updateChannelPath(channelId, path);
  }, [updateChannelPath]);

  const handleChannelSave = useCallback((channelId, config) => {
    updateChannelConfig(channelId, config);
  }, [updateChannelConfig]);

  const handleChannelHover = useCallback((_channelId, _isHovered) => {}, []);

  const handleDragStart = useCallback((event) => {
    setActiveDragIndex(parseChannelDnDId(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      setActiveDragIndex(null);
      const { active, over } = event;
      if (!over || navigation.isAnimating) return;
      const from = parseChannelDnDId(active.id);
      const to = parseChannelDnDId(over.id);
      if (from === null || to === null || from === to) return;
      reorderChannels(from, to);
    },
    [navigation.isAnimating, reorderChannels]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragIndex(null);
  }, []);

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
      >
        {renderChannelInner(channelIndex, wiiMode)}
      </ChannelSlotDnd>
    ),
    [navigation.isAnimating, renderChannelInner]
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
          currentPage={navigation.currentPage}
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
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="channels-content">
          {renderContent}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragIndex !== null ? (
            <div className="channel-drag-overlay pointer-events-none">
              {renderChannelInner(activeDragIndex, isWiiMode)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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

PaginatedChannels.propTypes = {};

export default PaginatedChannels;

