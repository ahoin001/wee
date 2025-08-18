import { useCallback, useMemo, useEffect } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';

/**
 * Hook for channel operations using the consolidated app store
 * Provides a clean API for all channel-related operations
 */
export const useChannelOperations = () => {
  const { channels, actions } = useConsolidatedAppStore();
  
  // Destructure actions
  const {
    setChannelState,
    setChannelData,
    setChannelSettings,
    setChannelOperations,
    updateChannel,
    setChannelNavigation
  } = actions;

  // Channel data accessors
  const channelData = useMemo(() => channels?.data || {}, [channels?.data]);
  const channelSettings = useMemo(() => channels?.settings || {}, [channels?.settings]);
  const channelOperations = useMemo(() => channels?.operations || {}, [channels?.operations]);

  // Grid configuration
  const gridConfig = useMemo(() => ({
    columns: channelData.gridColumns || 4,
    rows: channelData.gridRows || 3,
    totalChannels: channelData.totalChannels || 36,
    channelsPerPage: (channelData.gridColumns || 4) * (channelData.gridRows || 3) // 12 channels per page
  }), [channelData.gridColumns, channelData.gridRows, channelData.totalChannels]);

  // Navigation state
  const navigation = useMemo(() => channelData.navigation || {
    currentPage: 0,
    totalPages: 3,
    mode: 'wii', // 'simple' or 'wii'
    isAnimating: false,
    animationDirection: 'none',
    animationType: 'slide',
    animationDuration: 500,
    animationEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    enableSlideAnimation: true
  }, [channelData.navigation]);

  // Channel configurations
  const configuredChannels = useMemo(() => channelData.configuredChannels || {}, [channelData.configuredChannels]);
  const mediaMap = useMemo(() => channelData.mediaMap || {}, [channelData.mediaMap]);
  const appPathMap = useMemo(() => channelData.appPathMap || {}, [channelData.appPathMap]);
  const channelConfigs = useMemo(() => channelData.channelConfigs || {}, [channelData.channelConfigs]);

  // Channel operations
  const updateChannelConfig = useCallback((channelId, config) => {
    updateChannel(channelId, config);
  }, [updateChannel]);

  const updateChannelMedia = useCallback((channelId, media) => {
    updateChannel(channelId, { media });
  }, [updateChannel]);

  const updateChannelPath = useCallback((channelId, path) => {
    updateChannel(channelId, { path });
  }, [updateChannel]);

  const updateChannelIcon = useCallback((channelId, icon) => {
    updateChannel(channelId, { icon });
  }, [updateChannel]);

  const updateChannelType = useCallback((channelId, type) => {
    updateChannel(channelId, { type });
  }, [updateChannel]);

  const clearChannel = useCallback((channelId) => {
    updateChannel(channelId, {
      media: null,
      path: null,
      icon: null,
      type: null,
      empty: true
    });
  }, [updateChannel]);

  // Navigation operations
  const goToPage = useCallback((pageIndex) => {
    const validPage = Math.max(0, Math.min(pageIndex, navigation.totalPages - 1));
    
    if (validPage !== navigation.currentPage && !navigation.isAnimating) {
      const direction = validPage > navigation.currentPage ? 'right' : 'left';
      
      setChannelNavigation({
        ...navigation,
        currentPage: validPage,
        isAnimating: true,
        animationDirection: direction
      });
      
      // Auto-finish animation after delay
      setTimeout(() => {
        setChannelNavigation(prev => ({
          ...prev,
          isAnimating: false,
          animationDirection: 'none'
        }));
      }, 300);
    }
  }, [navigation, setChannelNavigation]);

  const nextPage = useCallback(() => {
    goToPage(navigation.currentPage + 1);
  }, [navigation.currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(navigation.currentPage - 1);
  }, [navigation.currentPage, goToPage]);

  // Global keyboard and mouse navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't interfere with important system shortcuts
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      
      // Only handle navigation when not in a modal or input field
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
          // Handle number keys (1-9) to jump to specific pages
          if (event.key >= '1' && event.key <= '9') {
            const pageIndex = parseInt(event.key) - 1;
            if (pageIndex < navigation.totalPages) {
              event.preventDefault();
              goToPage(pageIndex);
            }
          }
          break;
      }
    };

    const handleMouseDown = (event) => {
      // Handle mouse side buttons (browser back/forward)
      if (event.button === 3) { // Browser back button
        event.preventDefault();
        if (navigation.currentPage > 0) {
          prevPage();
        }
      } else if (event.button === 4) { // Browser forward button
        event.preventDefault();
        if (navigation.currentPage < navigation.totalPages - 1) {
          nextPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [navigation.currentPage, navigation.totalPages, nextPage, prevPage, goToPage]);

  const finishAnimation = useCallback(() => {
    setChannelNavigation({ isAnimating: false });
  }, [setChannelNavigation]);

  // Channel data operations
  const updateMediaMap = useCallback((updates) => {
    setChannelData({
      mediaMap: { ...mediaMap, ...updates }
    });
  }, [mediaMap, setChannelData]);

  const updateAppPathMap = useCallback((updates) => {
    setChannelData({
      appPathMap: { ...appPathMap, ...updates }
    });
  }, [appPathMap, setChannelData]);

  const updateChannelConfigs = useCallback((updates) => {
    setChannelData({
      channelConfigs: { ...channelConfigs, ...updates }
    });
  }, [channelConfigs, setChannelData]);

  // Settings operations
  const updateChannelSettings = useCallback((updates) => {
    setChannelSettings(updates);
  }, [setChannelSettings]);

  // Operations state
  const setLoading = useCallback((isLoading) => {
    setChannelOperations({ isLoading });
  }, [setChannelOperations]);

  const setSaving = useCallback((isSaving) => {
    setChannelOperations({ isSaving });
  }, [setChannelOperations]);

  const setError = useCallback((error) => {
    setChannelOperations({ error });
  }, [setChannelOperations]);

  // Utility functions
  const getChannelConfig = useCallback((channelId) => {
    return configuredChannels[channelId] || null;
  }, [configuredChannels]);

  const isChannelEmpty = useCallback((channelId) => {
    const config = getChannelConfig(channelId);
    return !config || (!config.media && !config.path);
  }, [getChannelConfig]);

  const getChannelsForPage = useCallback((pageIndex) => {
    const channelsPerPage = gridConfig.channelsPerPage;
    const startIndex = pageIndex * channelsPerPage;
    const endIndex = Math.min(startIndex + channelsPerPage - 1, gridConfig.totalChannels - 1);
    
    const channels = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const channelId = `channel-${i}`;
      const config = getChannelConfig(channelId);
      channels.push({
        id: channelId,
        config: config || { empty: true },
        isEmpty: isChannelEmpty(channelId)
      });
    }
    
    return channels;
  }, [gridConfig, getChannelConfig, isChannelEmpty]);

  const getCurrentPageChannels = useCallback(() => {
    return getChannelsForPage(navigation.currentPage);
  }, [navigation.currentPage, getChannelsForPage]);

  const result = {
    // State
    channelData,
    channelSettings,
    channelOperations,
    gridConfig,
    navigation,
    configuredChannels,
    mediaMap,
    appPathMap,
    channelConfigs,
    
    // Channel operations
    updateChannelConfig,
    updateChannelMedia,
    updateChannelPath,
    updateChannelIcon,
    updateChannelType,
    clearChannel,
    
    // Navigation operations
    goToPage,
    nextPage,
    prevPage,
    finishAnimation,
    
    // Data operations
    updateMediaMap,
    updateAppPathMap,
    updateChannelConfigs,
    
    // Settings operations
    updateChannelSettings,
    
    // Operations state
    setLoading,
    setSaving,
    setError,
    
    // Utility functions
    getChannelConfig,
    isChannelEmpty,
    getChannelsForPage,
    getCurrentPageChannels
  };
  
  return result;
};

export default useChannelOperations;
