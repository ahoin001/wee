import { useCallback, useMemo, useEffect } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { useChannelSpaceKey } from '../contexts/ChannelSpaceContext';
import {
  clampPageIndex,
  getPageBounds,
  getWiiNormalization,
  resolveGridConfig,
  resolveNavigation,
  WII_LAYOUT_PRESET,
} from './channelLayoutSystem';
import { getChannelDataSlice, normalizeChannelSpaceKey } from './channelSpaces';

/**
 * Channel grid operations scoped to one shell space (`home` | `workspaces`).
 * Pass `spaceKey` explicitly for components outside `ChannelSpaceProvider` (e.g. page chrome).
 * Omit `spaceKey` when rendered under `ChannelSpaceProvider` (e.g. grid, slide nav).
 *
 * @param {object} [options]
 * @param {boolean} [options.enableGlobalPageShortcuts] — Register window key/mouse page nav only here (e.g. PaginatedChannels shell), not per Channel tile.
 */
export const useChannelOperations = (explicitSpaceKey, options = {}) => {
  const enableGlobalPageShortcuts = options.enableGlobalPageShortcuts === true;
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

  const channelData = useMemo(
    () => getChannelDataSlice(channels, spaceKey),
    [channels, spaceKey]
  );
  const channelSettings = useMemo(() => channels?.settings || {}, [channels?.settings]);
  const channelOperations = useMemo(() => channels?.operations || {}, [channels?.operations]);

  const rawNavigation = useMemo(() => resolveNavigation(channelData.navigation), [channelData.navigation]);
  const navigation = useMemo(
    () => ({
      ...rawNavigation,
      mode: 'wii',
      currentPage: clampPageIndex(rawNavigation.currentPage || 0, WII_LAYOUT_PRESET.totalPages),
      totalPages: WII_LAYOUT_PRESET.totalPages,
      animationType: 'slide',
      animationDuration: 500,
      enableSlideAnimation: true,
    }),
    [rawNavigation]
  );

  const gridConfig = useMemo(() => {
    return resolveGridConfig(channelData, navigation);
  }, [channelData, navigation]);

  useEffect(() => {
    const { dataPatch, navigationPatch, needsNormalization } = getWiiNormalization(channelData);
    if (!needsNormalization) {
      return;
    }

    setChannelDataForSpace(spaceKey, dataPatch);
    setChannelNavigationForSpace(spaceKey, navigationPatch);
  }, [
    spaceKey,
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

  const configuredChannels = useMemo(() => channelData.configuredChannels || {}, [channelData.configuredChannels]);
  const channelConfigs = useMemo(() => channelData.channelConfigs || {}, [channelData.channelConfigs]);

  const updateChannelConfig = useCallback(
    (channelId, config) => {
      updateChannelForSpace(spaceKey, channelId, config);
    },
    [updateChannelForSpace, spaceKey]
  );

  const updateChannelMedia = useCallback(
    (channelId, media) => {
      updateChannelForSpace(spaceKey, channelId, { media });
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
    (pageIndex) => {
      const validPage = Math.max(0, Math.min(pageIndex, navigation.totalPages - 1));

      if (validPage !== navigation.currentPage && !navigation.isAnimating) {
        const direction = validPage > navigation.currentPage ? 'right' : 'left';

        setChannelNavigationForSpace(spaceKey, {
          currentPage: validPage,
          isAnimating: true,
          animationDirection: direction,
        });

        setTimeout(() => {
          setChannelNavigationForSpace(spaceKey, {
            isAnimating: false,
            animationDirection: 'none',
          });
        }, 500);
      }
    },
    [navigation, setChannelNavigationForSpace, spaceKey]
  );

  const nextPage = useCallback(() => {
    goToPage(navigation.currentPage + 1);
  }, [navigation.currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(navigation.currentPage - 1);
  }, [navigation.currentPage, goToPage]);

  useEffect(() => {
    if (!enableGlobalPageShortcuts) {
      return undefined;
    }

    const shellMatchesActiveChannelSpace = () => {
      const activeSpaceId = useConsolidatedAppStore.getState().spaces.activeSpaceId;
      if (activeSpaceId === 'gamehub') return false;
      if (activeSpaceId === 'home' && spaceKey === 'home') return true;
      if (activeSpaceId === 'workspaces' && spaceKey === 'workspaces') return true;
      return false;
    };

    let lastAuxNavMs = 0;
    const AUX_DEBOUNCE_MS = 120;

    const handleKeyDown = (event) => {
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
          if (navigation.currentPage > 0) {
            prevPage();
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (navigation.currentPage < navigation.totalPages - 1) {
            nextPage();
          }
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

      if (event.button === 3 && navigation.currentPage > 0) {
        prevPage();
      } else if (event.button === 4 && navigation.currentPage < navigation.totalPages - 1) {
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
    setChannelNavigationForSpace(spaceKey, { isAnimating: false });
  }, [setChannelNavigationForSpace, spaceKey]);

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
    navigation,
    configuredChannels,
    channelConfigs,

    updateChannelConfig,
    updateChannelMedia,
    updateChannelPath,
    updateChannelIcon,
    updateChannelType,
    clearChannel,
    reorderChannels,

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
