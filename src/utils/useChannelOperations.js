import { useCallback, useMemo, useEffect } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { useChannelSpaceKey } from '../contexts/ChannelSpaceContext';
import {
  CHANNEL_PAGE_FLIP_MS,
  clampPageIndex,
  resolveSteppedChannelPage,
  getPageBounds,
  getWiiNormalization,
  isSlotHidden,
  resolveGridConfig,
  resolveLayout,
  resolveLayoutForPage,
  resolveNavigation,
} from './channelLayoutSystem';
import {
  getChannelDataSlice,
  normalizeChannelSpaceKey,
  resolveActiveChannelSpaceKey,
} from './channelSpaces';
import { normalizeChannelMedia } from './channelMediaFit';

/**
 * Channel grid operations scoped to one shell space (`home` | `workspaces`).
 * Pass `spaceKey` explicitly for components outside `ChannelSpaceProvider` (e.g. page chrome).
 * Omit `spaceKey` when rendered under `ChannelSpaceProvider` (e.g. grid, slide nav).
 *
 * @param {object} [options]
 * @param {boolean} [options.enableGlobalPageShortcuts] — Register window key/mouse page nav only here (e.g. PaginatedChannels shell), not per Channel tile.
 * @param {boolean} [options.runLayoutNormalization] — Soft Wii layout/nav sync. Default false — enable only on the board shell so tiles/chrome do not fan out store writes (React #185).
 */
export const useChannelOperations = (explicitSpaceKey, options = {}) => {
  const enableGlobalPageShortcuts = options.enableGlobalPageShortcuts === true;
  const runLayoutNormalization = options.runLayoutNormalization === true;
  const contextKey = useChannelSpaceKey();
  const spaceKey = normalizeChannelSpaceKey(
    explicitSpaceKey !== undefined && explicitSpaceKey !== null ? explicitSpaceKey : contextKey
  );

  const channels = useConsolidatedAppStore((state) => state.channels);
  const setChannelDataForSpace = useConsolidatedAppStore((state) => state.actions.setChannelDataForSpace);
  const setChannelSettings = useConsolidatedAppStore((state) => state.actions.setChannelSettings);
  const setChannelOperations = useConsolidatedAppStore((state) => state.actions.setChannelOperations);
  const updateChannelForSpace = useConsolidatedAppStore((state) => state.actions.updateChannelForSpace);
  const setChannelNavigationForSpace = useConsolidatedAppStore((state) => state.actions.setChannelNavigationForSpace);
  const reorderChannelSlotsForSpace = useConsolidatedAppStore((state) => state.actions.reorderChannelSlotsForSpace);
  const setChannelLayoutForSpace = useConsolidatedAppStore((state) => state.actions.setChannelLayoutForSpace);
  const setChannelSlotHiddenForSpace = useConsolidatedAppStore(
    (state) => state.actions.setChannelSlotHiddenForSpace
  );

  const channelData = useMemo(
    () => getChannelDataSlice(channels, spaceKey),
    [channels, spaceKey]
  );
  const channelSettings = useMemo(() => channels?.settings || {}, [channels?.settings]);
  const channelOperations = useMemo(() => channels?.operations || {}, [channels?.operations]);

  const layout = useMemo(() => resolveLayout(channelData), [channelData]);

  const rawNavigation = useMemo(() => resolveNavigation(channelData.navigation), [channelData.navigation]);
  const navigation = useMemo(
    () => ({
      ...rawNavigation,
      mode: 'wii',
      currentPage: clampPageIndex(rawNavigation.currentPage || 0, layout.totalPages),
      totalPages: layout.totalPages,
      animationType: 'slide',
      animationDuration: CHANNEL_PAGE_FLIP_MS,
      enableSlideAnimation: true,
    }),
    [rawNavigation, layout.totalPages]
  );

  const pageLayout = useMemo(
    () => resolveLayoutForPage(channelData, navigation.currentPage),
    [channelData, navigation.currentPage]
  );

  const gridConfig = useMemo(() => {
    return resolveGridConfig(channelData, navigation);
  }, [channelData, navigation]);

  useEffect(() => {
    if (!runLayoutNormalization) return;
    const { dataPatch, navigationPatch, needsNormalization } = getWiiNormalization(channelData);
    if (!needsNormalization) {
      return;
    }

    setChannelDataForSpace(spaceKey, dataPatch);
    setChannelNavigationForSpace(spaceKey, navigationPatch);
  }, [
    runLayoutNormalization,
    spaceKey,
    channelData.layout,
    channelData.gridColumns,
    channelData.gridRows,
    channelData.totalChannels,
    channelData.navigation?.currentPage,
    channelData.navigation?.totalPages,
    channelData.navigation?.animationType,
    channelData.navigation?.animationDuration,
    channelData.navigation?.enableSlideAnimation,
    setChannelDataForSpace,
    setChannelNavigationForSpace,
  ]);

  const configuredChannels = useMemo(() => {
    return channelData.configuredChannels || {};
  }, [channelData.configuredChannels]);
  const channelConfigs = useMemo(() => {
    return channelData.channelConfigs || {};
  }, [channelData.channelConfigs]);
  const slotMeta = useMemo(() => channelData.slotMeta || {}, [channelData.slotMeta]);
  const slots = useMemo(() => channelData.slots || [], [channelData.slots]);

  const updateChannelConfig = useCallback(
    (channelId, config) => {
      updateChannelForSpace(spaceKey, channelId, config);
    },
    [updateChannelForSpace, spaceKey]
  );

  const updateChannelMedia = useCallback(
    (channelId, media) => {
      updateChannelForSpace(spaceKey, channelId, {
        media: media == null ? null : normalizeChannelMedia(media),
      });
    },
    [updateChannelForSpace, spaceKey]
  );

  const updateChannelPath = useCallback(
    (channelId, path) => {
      updateChannelForSpace(spaceKey, channelId, { path });
    },
    [updateChannelForSpace, spaceKey]
  );

  const updateChannelIcon = useCallback(
    (channelId, icon) => {
      updateChannelForSpace(spaceKey, channelId, { icon });
    },
    [updateChannelForSpace, spaceKey]
  );

  const updateChannelType = useCallback(
    (channelId, type) => {
      updateChannelForSpace(spaceKey, channelId, { type });
    },
    [updateChannelForSpace, spaceKey]
  );

  const clearChannel = useCallback(
    (channelId) => {
      updateChannelForSpace(spaceKey, channelId, {
        media: null,
        path: null,
        icon: null,
        type: null,
        empty: true,
      });
    },
    [updateChannelForSpace, spaceKey]
  );

  const goToPage = useCallback(
    (pageIndex, options = {}) => {
      const validPage = clampPageIndex(pageIndex, navigation.totalPages);
      if (validPage === navigation.currentPage || navigation.isAnimating) return;

      const explicitDir = options.direction;
      const direction =
        explicitDir === 'left' || explicitDir === 'right'
          ? explicitDir
          : validPage > navigation.currentPage
            ? 'right'
            : 'left';

      setChannelNavigationForSpace(spaceKey, {
        currentPage: validPage,
        isAnimating: true,
        animationDirection: direction,
        animationWrapped: Boolean(options.wrapped),
        animationDuration: CHANNEL_PAGE_FLIP_MS,
      });
    },
    [navigation, setChannelNavigationForSpace, spaceKey]
  );

  const nextPage = useCallback(() => {
    if (navigation.isAnimating) return;
    const stepped = resolveSteppedChannelPage(navigation.currentPage, 1, navigation.totalPages);
    if (stepped.direction === 'none' || stepped.page === navigation.currentPage) return;
    goToPage(stepped.page, { direction: stepped.direction, wrapped: stepped.wrapped });
  }, [navigation.currentPage, navigation.totalPages, navigation.isAnimating, goToPage]);

  const prevPage = useCallback(() => {
    if (navigation.isAnimating) return;
    const stepped = resolveSteppedChannelPage(navigation.currentPage, -1, navigation.totalPages);
    if (stepped.direction === 'none' || stepped.page === navigation.currentPage) return;
    goToPage(stepped.page, { direction: stepped.direction, wrapped: stepped.wrapped });
  }, [navigation.currentPage, navigation.totalPages, navigation.isAnimating, goToPage]);

  useEffect(() => {
    if (!enableGlobalPageShortcuts) {
      return undefined;
    }

    const shellMatchesActiveChannelSpace = () => {
      const activeSpaceId = useConsolidatedAppStore.getState().spaces.activeSpaceId;
      if (activeSpaceId === 'gamehub' || activeSpaceId === 'mediahub') return false;
      return resolveActiveChannelSpaceKey(activeSpaceId) === spaceKey;
    };

    let lastAuxNavMs = 0;
    const AUX_DEBOUNCE_MS = 120;

    const handleKeyDown = (event) => {
      if (event.defaultPrevented) {
        return;
      }
      if (!shellMatchesActiveChannelSpace()) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextPage();
          break;
        case 'Home':
          event.preventDefault();
          goToPage(0);
          break;
        case 'End':
          event.preventDefault();
          goToPage(navigation.totalPages - 1);
          break;
        default:
          if (event.key >= '1' && event.key <= '9') {
            const pageIndex = parseInt(event.key, 10) - 1;
            if (pageIndex < navigation.totalPages) {
              event.preventDefault();
              goToPage(pageIndex);
            }
          }
          break;
      }
    };

    const handleAuxButton = (event) => {
      if (event.button !== 3 && event.button !== 4) {
        return;
      }
      if (!shellMatchesActiveChannelSpace()) {
        return;
      }
      const now = Date.now();
      if (now - lastAuxNavMs < AUX_DEBOUNCE_MS) {
        return;
      }
      lastAuxNavMs = now;
      event.preventDefault();

      if (event.button === 3) {
        prevPage();
      } else if (event.button === 4) {
        nextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handleAuxButton, true);
    window.addEventListener('mousedown', handleAuxButton, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handleAuxButton, true);
      window.removeEventListener('mousedown', handleAuxButton, true);
    };
  }, [
    enableGlobalPageShortcuts,
    spaceKey,
    navigation.currentPage,
    navigation.totalPages,
    nextPage,
    prevPage,
    goToPage,
  ]);

  const finishAnimation = useCallback(() => {
    setChannelNavigationForSpace(spaceKey, {
      isAnimating: false,
      animationDirection: 'none',
      animationWrapped: false,
    });
  }, [setChannelNavigationForSpace, spaceKey]);

  const setLayout = useCallback(
    (layoutPartial, options) => {
      setChannelLayoutForSpace(spaceKey, layoutPartial, options);
    },
    [setChannelLayoutForSpace, spaceKey]
  );

  const setSlotHidden = useCallback(
    (channelIndex, hidden) => {
      setChannelSlotHiddenForSpace(spaceKey, channelIndex, hidden);
    },
    [setChannelSlotHiddenForSpace, spaceKey]
  );

  const isChannelSlotHidden = useCallback(
    (channelIndex) => isSlotHidden(slotMeta, channelIndex),
    [slotMeta]
  );

  const updateChannelConfigs = useCallback(
    (updates) => {
      setChannelDataForSpace(spaceKey, {
        channelConfigs: { ...channelConfigs, ...updates },
      });
    },
    [channelConfigs, setChannelDataForSpace, spaceKey]
  );

  const updateChannelSettings = useCallback(
    (updates) => {
      setChannelSettings(updates);
    },
    [setChannelSettings]
  );

  const setLoading = useCallback(
    (isLoading) => {
      setChannelOperations({ isLoading });
    },
    [setChannelOperations]
  );

  const setSaving = useCallback(
    (isSaving) => {
      setChannelOperations({ isSaving });
    },
    [setChannelOperations]
  );

  const setError = useCallback(
    (error) => {
      setChannelOperations({ error });
    },
    [setChannelOperations]
  );

  const getChannelConfig = useCallback(
    (channelId) => {
      return configuredChannels[channelId] || null;
    },
    [configuredChannels]
  );

  const isChannelEmpty = useCallback(
    (channelId) => {
      const config = getChannelConfig(channelId);
      return !config || (!config.media && !config.path);
    },
    [getChannelConfig]
  );

  const getChannelsForPage = useCallback(
    (pageIndex) => {
      const channelsPerPage = gridConfig.channelsPerPage;
      const { startIndex, endIndex } = getPageBounds(pageIndex, channelsPerPage, gridConfig.totalChannels);

      const list = [];
      for (let i = startIndex; i <= endIndex; i++) {
        const channelId = `channel-${i}`;
        const config = getChannelConfig(channelId);
        list.push({
          id: channelId,
          config: config || { empty: true },
          isEmpty: isChannelEmpty(channelId),
        });
      }

      return list;
    },
    [gridConfig, getChannelConfig, isChannelEmpty]
  );

  const getCurrentPageChannels = useCallback(() => {
    return getChannelsForPage(navigation.currentPage);
  }, [navigation.currentPage, getChannelsForPage]);

  const reorderChannels = useCallback(
    (fromIndex, toIndex) => {
      reorderChannelSlotsForSpace(spaceKey, fromIndex, toIndex);
    },
    [reorderChannelSlotsForSpace, spaceKey]
  );

  return {
    channelSpaceKey: spaceKey,
    channelData,
    channelSettings,
    channelOperations,
    gridConfig,
    layout,
    pageLayout,
    navigation,
    configuredChannels,
    channelConfigs,
    slotMeta,
    slots,

    updateChannelConfig,
    updateChannelMedia,
    updateChannelPath,
    updateChannelIcon,
    updateChannelType,
    clearChannel,
    reorderChannels,
    setLayout,
    setSlotHidden,
    isChannelSlotHidden,

    goToPage,
    nextPage,
    prevPage,
    finishAnimation,

    updateChannelConfigs,

    updateChannelSettings,

    setLoading,
    setSaving,
    setError,

    getChannelConfig,
    isChannelEmpty,
    getChannelsForPage,
    getCurrentPageChannels,
  };
};

export default useChannelOperations;
