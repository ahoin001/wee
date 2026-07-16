import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { getModifierFromKeyboardEvent, handleGlobalShortcut } from './keyboardShortcuts';
import { openSettingsToTab } from './settingsNavigation';
import { toggleHomeBoardArrange } from '../hooks/useHomeBoardArrange';
import { getChannelDataSlice, resolveActiveChannelSpaceKey } from './channelSpaces';
import { closeTopOverlayOnEscape, isBlockingOverlayOpen } from './overlayEscape';
import { CHANNEL_PAGE_FLIP_MS, resolveSteppedChannelPage } from './channelLayoutSystem';

/** Stable empty fallback — never allocate `|| []` inside a useShallow selector. */
const EMPTY_KEYBOARD_SHORTCUTS = Object.freeze([]);

const useKeyboardShortcuts = () => {
  const { keyboardShortcuts, setUIState, setFloatingWidgetsState, setSpacesState } = useConsolidatedAppStore(
    useShallow((state) => ({
      keyboardShortcuts: Array.isArray(state.ui?.keyboardShortcuts)
        ? state.ui.keyboardShortcuts
        : EMPTY_KEYBOARD_SHORTCUTS,
      setUIState: state.actions?.setUIState,
      setFloatingWidgetsState: state.actions?.setFloatingWidgetsState,
      setSpacesState: state.actions?.setSpacesState,
    }))
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.defaultPrevented) {
        return;
      }
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
      if (event.repeat) {
        return;
      }

      // Normalize space so bindings can use the readable 'space' key name.
      const key = event.key === ' ' ? 'space' : event.key.toLowerCase();
      const modifier = getModifierFromKeyboardEvent(event);

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
      const activeSpaceId = spaces?.activeSpaceId;
      if (activeSpaceId === 'gamehub' || activeSpaceId === 'mediahub') return;
      const key = resolveActiveChannelSpaceKey(spaces?.activeSpaceId);
      const nav = getChannelDataSlice(channels, key).navigation || {};
      const currentPage = Number(nav.currentPage) || 0;
      const totalPages = Math.max(1, Number(nav.totalPages) || 1);
      if (nav.isAnimating) return;
      const stepped = resolveSteppedChannelPage(currentPage, 1, totalPages);
      if (stepped.direction === 'none' || stepped.page === currentPage) return;

      const { setChannelNavigationForSpace } = getState().actions;
      setChannelNavigationForSpace?.(key, {
        currentPage: stepped.page,
        isAnimating: true,
        animationDirection: stepped.direction,
        animationWrapped: stepped.wrapped,
      });
      window.setTimeout(() => {
        const latest = getState();
        const latestSpaceKey = resolveActiveChannelSpaceKey(latest.spaces?.activeSpaceId);
        if (latestSpaceKey !== key) return;
        latest.actions.setChannelNavigationForSpace?.(key, {
          isAnimating: false,
          animationDirection: 'none',
          animationWrapped: false,
        });
      }, CHANNEL_PAGE_FLIP_MS);
    };

    window.prevPage = () => {
      const state = getState();
      const { channels, spaces } = state;
      const activeSpaceId = spaces?.activeSpaceId;
      if (activeSpaceId === 'gamehub' || activeSpaceId === 'mediahub') return;
      const key = resolveActiveChannelSpaceKey(spaces?.activeSpaceId);
      const nav = getChannelDataSlice(channels, key).navigation || {};
      const currentPage = Number(nav.currentPage) || 0;
      const totalPages = Math.max(1, Number(nav.totalPages) || 1);
      if (nav.isAnimating) return;
      const stepped = resolveSteppedChannelPage(currentPage, -1, totalPages);
      if (stepped.direction === 'none' || stepped.page === currentPage) return;

      const { setChannelNavigationForSpace } = getState().actions;
      setChannelNavigationForSpace?.(key, {
        currentPage: stepped.page,
        isAnimating: true,
        animationDirection: stepped.direction,
        animationWrapped: stepped.wrapped,
      });
      window.setTimeout(() => {
        const latest = getState();
        const latestSpaceKey = resolveActiveChannelSpaceKey(latest.spaces?.activeSpaceId);
        if (latestSpaceKey !== key) return;
        latest.actions.setChannelNavigationForSpace?.(key, {
          isAnimating: false,
          animationDirection: 'none',
          animationWrapped: false,
        });
      }, CHANNEL_PAGE_FLIP_MS);
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
      // Escape / Quick Menu chord: never open the menu on top of a modal.
      if (isBlockingOverlayOpen(state.ui)) {
        closeTopOverlayOnEscape(state);
        return;
      }
      setUIState?.({ showSettingsActionMenu: !state.ui.showSettingsActionMenu });
    };

    window.toggleSpaceRailPin = () => {
      const state = getState();
      const currentPinned = Boolean(state.spaces?.railPinned);
      setSpacesState?.({
        railPinned: !currentPinned,
        railVisible: true,
      });
    };

    window.openWorkspaceSwitcher = () => {
      setUIState?.({ showWorkspaceSwitcher: true });
    };

    window.toggleHomeArrange = () => {
      toggleHomeBoardArrange();
    };

    window.toggleCommandPalette = () => {
      const state = getState();
      setUIState?.({ commandPaletteOpen: !state.ui.commandPaletteOpen });
    };

    window.openUpdateModal = () => {
      setUIState?.({ showUpdateModal: true });
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
      delete window.toggleSpaceRailPin;
      delete window.openWorkspaceSwitcher;
      delete window.toggleHomeArrange;
      delete window.toggleCommandPalette;
      delete window.openUpdateModal;
    };
  }, [keyboardShortcuts, setFloatingWidgetsState, setSpacesState, setUIState]);

  return {
    keyboardShortcuts,
    testShortcut: (key, modifier) => handleGlobalShortcut(key, modifier, keyboardShortcuts),
  };
};

export default useKeyboardShortcuts;
