import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { handleGlobalShortcut } from './keyboardShortcuts';
import { openSettingsToTab } from './settingsNavigation';
import { getChannelDataSlice, resolveActiveChannelSpaceKey } from './channelSpaces';

const useKeyboardShortcuts = () => {
  const { keyboardShortcuts, setUIState, setFloatingWidgetsState } = useConsolidatedAppStore(
    useShallow((state) => ({
      keyboardShortcuts: state.ui?.keyboardShortcuts || [],
      setUIState: state.actions?.setUIState,
      setFloatingWidgetsState: state.actions?.setFloatingWidgetsState,
    }))
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.contentEditable === 'true' ||
        event.target.closest('[data-recording-shortcut]')
      ) {
        return;
      }

      if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        return;
      }

      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey
        ? 'ctrl'
        : event.altKey
          ? 'alt'
          : event.shiftKey
            ? 'shift'
            : event.metaKey
              ? 'meta'
              : 'none';

      if (handleGlobalShortcut(key, modifier, keyboardShortcuts)) {
        event.preventDefault();
      }
    },
    [keyboardShortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const getState = () => useConsolidatedAppStore.getState();

    window.handleGlobalShortcut = (key, modifier) =>
      handleGlobalShortcut(key, modifier, keyboardShortcuts);

    window.openSettingsModal = (tab = null) => {
      openSettingsToTab(tab || 'general');
    };

    window.toggleSpotifyWidget = () => {
      const state = getState();
      const current = state.floatingWidgets.spotify;
      setFloatingWidgetsState?.({ spotify: { ...current, visible: !current.visible } });
    };

    window.toggleSystemInfoWidget = () => {
      const state = getState();
      const current = state.floatingWidgets.systemInfo;
      setFloatingWidgetsState?.({ systemInfo: { ...current, visible: !current.visible } });
    };

    window.toggleAdminPanelWidget = () => {
      const state = getState();
      const current = state.floatingWidgets.adminPanel;
      setFloatingWidgetsState?.({ adminPanel: { ...current, visible: !current.visible } });
    };

    window.togglePerformanceMonitor = () => {
      const state = getState();
      const current = state.floatingWidgets.performanceMonitor;
      setFloatingWidgetsState?.({ performanceMonitor: { ...current, visible: !current.visible } });
    };

    window.nextPage = () => {
      const state = getState();
      const { channels, spaces } = state;
      const key = resolveActiveChannelSpaceKey(spaces?.activeSpaceId);
      const nav = getChannelDataSlice(channels, key).navigation || {};
      const currentPage = Number(nav.currentPage) || 0;
      const totalPages = Math.max(1, Number(nav.totalPages) || 1);
      if (currentPage >= totalPages - 1) return;

      const { setChannelNavigationForSpace } = getState().actions;
      setChannelNavigationForSpace?.(key, { currentPage: currentPage + 1 });
    };

    window.prevPage = () => {
      const state = getState();
      const { channels, spaces } = state;
      const key = resolveActiveChannelSpaceKey(spaces?.activeSpaceId);
      const nav = getChannelDataSlice(channels, key).navigation || {};
      const currentPage = Number(nav.currentPage) || 0;
      if (currentPage <= 0) return;

      const { setChannelNavigationForSpace } = getState().actions;
      setChannelNavigationForSpace?.(key, { currentPage: currentPage - 1 });
    };

    window.toggleDock = () => {
      const state = getState();
      setUIState?.({ showDock: !state.ui.showDock });
    };

    window.toggleDarkMode = () => {
      const state = getState();
      setUIState?.({ isDarkMode: !state.ui.isDarkMode });
    };

    window.toggleCustomCursor = () => {
      const state = getState();
      setUIState?.({ useCustomCursor: !state.ui.useCustomCursor });
    };

    window.toggleSettingsMenu = () => {
      const state = getState();
      setUIState?.({ showSettingsActionMenu: !state.ui.showSettingsActionMenu });
    };

    return () => {
      delete window.handleGlobalShortcut;
      delete window.openSettingsModal;
      delete window.toggleSpotifyWidget;
      delete window.toggleSystemInfoWidget;
      delete window.toggleAdminPanelWidget;
      delete window.togglePerformanceMonitor;
      delete window.nextPage;
      delete window.prevPage;
      delete window.toggleDock;
      delete window.toggleDarkMode;
      delete window.toggleCustomCursor;
      delete window.toggleSettingsMenu;
    };
  }, [keyboardShortcuts, setFloatingWidgetsState, setUIState]);

  return {
    keyboardShortcuts,
    testShortcut: (key, modifier) => handleGlobalShortcut(key, modifier, keyboardShortcuts),
  };
};

export default useKeyboardShortcuts;
