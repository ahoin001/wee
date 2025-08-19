import { useEffect, useCallback } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { handleGlobalShortcut } from './keyboardShortcuts';

const useKeyboardShortcuts = () => {
  const { ui, actions } = useConsolidatedAppStore();
  
  // Get keyboard shortcuts from store
  const keyboardShortcuts = ui?.keyboardShortcuts || [];
  
  // Debug: Log shortcuts on mount and when they change
  useEffect(() => {
    console.log('[KeyboardShortcuts] Shortcuts loaded:', {
      shortcutsCount: keyboardShortcuts.length,
      shortcuts: keyboardShortcuts,
      ui: ui
    });
    
    // Initialize shortcuts if they're empty
    if (keyboardShortcuts.length === 0) {
      console.log('[KeyboardShortcuts] No shortcuts found, initializing...');
      actions.resetKeyboardShortcuts();
    }
  }, [keyboardShortcuts, ui, actions]);

  // Handle keydown events
  const handleKeyDown = useCallback((event) => {
    // Don't handle shortcuts if user is typing in an input field
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true') {
      return;
    }

    // Don't handle shortcuts if user is recording a shortcut
    if (event.target.closest('[data-recording-shortcut]')) {
      return;
    }

    // Ignore modifier-only key presses (just Ctrl, Alt, Shift, Meta)
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      return;
    }

    const key = event.key.toLowerCase();
    const modifier = event.ctrlKey ? 'ctrl' : 
                    event.altKey ? 'alt' : 
                    event.shiftKey ? 'shift' : 
                    event.metaKey ? 'meta' : 'none';

    // Handle the shortcut
    console.log('[KeyboardShortcuts] Key pressed:', { key, modifier, shortcutsCount: keyboardShortcuts.length });
    const handled = handleGlobalShortcut(key, modifier, keyboardShortcuts);
    
    if (handled) {
      console.log('[KeyboardShortcuts] Shortcut handled successfully');
      event.preventDefault();
    }
  }, [keyboardShortcuts]);

  // Set up global shortcut handler
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Expose functions globally for shortcut actions
  useEffect(() => {
    // Expose the global shortcut handler for testing
    window.handleGlobalShortcut = (key, modifier) => {
      return handleGlobalShortcut(key, modifier, keyboardShortcuts);
    };
    
    // Debug: Initialize shortcuts if they're empty
    window.initializeShortcuts = () => {
      const store = useConsolidatedAppStore.getState();
      if (!store.ui.keyboardShortcuts || store.ui.keyboardShortcuts.length === 0) {
        console.log('[KeyboardShortcuts] Initializing shortcuts...');
        store.actions.resetKeyboardShortcuts();
        console.log('[KeyboardShortcuts] Shortcuts initialized:', store.ui.keyboardShortcuts);
      }
    };
    
    // Settings modal functions
    window.openSettingsModal = (tab = null) => {
      actions.setUIState({ 
        showSettingsModal: true,
        settingsActiveTab: tab || 'general'
      });
    };

    // Widget toggle functions - using the actual functions from the store
    window.toggleSpotifyWidget = () => {
      const store = useConsolidatedAppStore.getState();
      const isVisible = store.floatingWidgets.spotify.visible;
      store.actions.setFloatingWidgetsState({
        spotify: { ...store.floatingWidgets.spotify, visible: !isVisible }
      });
    };

    window.toggleSystemInfoWidget = () => {
      const store = useConsolidatedAppStore.getState();
      const isVisible = store.floatingWidgets.systemInfo.visible;
      store.actions.setFloatingWidgetsState({
        systemInfo: { ...store.floatingWidgets.systemInfo, visible: !isVisible }
      });
    };

    window.toggleAdminPanelWidget = () => {
      const store = useConsolidatedAppStore.getState();
      const isVisible = store.floatingWidgets.adminPanel.visible;
      store.actions.setFloatingWidgetsState({
        adminPanel: { ...store.floatingWidgets.adminPanel, visible: !isVisible }
      });
    };

    window.togglePerformanceMonitor = () => {
      const store = useConsolidatedAppStore.getState();
      const isVisible = store.floatingWidgets.performanceMonitor.visible;
      store.actions.setFloatingWidgetsState({
        performanceMonitor: { ...store.floatingWidgets.performanceMonitor, visible: !isVisible }
      });
    };

    // Navigation functions - using the actual navigation functions
    window.nextPage = () => {
      const store = useConsolidatedAppStore.getState();
      const { channels } = store;
      if (channels.data.navigation.currentPage < channels.data.navigation.totalPages - 1) {
        // Use the actual navigation function
        if (channels.operations.nextPage) {
          channels.operations.nextPage();
        } else {
          // Fallback to direct state update
          store.actions.setChannelState({
            data: {
              ...channels.data,
              navigation: {
                ...channels.data.navigation,
                currentPage: channels.data.navigation.currentPage + 1
              }
            }
          });
        }
      }
    };

    window.prevPage = () => {
      const store = useConsolidatedAppStore.getState();
      const { channels } = store;
      if (channels.data.navigation.currentPage > 0) {
        // Use the actual navigation function
        if (channels.operations.prevPage) {
          channels.operations.prevPage();
        } else {
          // Fallback to direct state update
          store.actions.setChannelState({
            data: {
              ...channels.data,
              navigation: {
                ...channels.data.navigation,
                currentPage: channels.data.navigation.currentPage - 1
              }
            }
          });
        }
      }
    };

    // Interface toggle functions
    window.toggleDock = () => {
      const store = useConsolidatedAppStore.getState();
      store.actions.setUIState({ showDock: !store.ui.showDock });
    };

    window.toggleDarkMode = () => {
      const store = useConsolidatedAppStore.getState();
      store.actions.setUIState({ isDarkMode: !store.ui.isDarkMode });
    };

    window.toggleCustomCursor = () => {
      const store = useConsolidatedAppStore.getState();
      store.actions.setUIState({ useCustomCursor: !store.ui.useCustomCursor });
    };

    window.toggleSettingsMenu = () => {
      const store = useConsolidatedAppStore.getState();
      if (store.ui.showSettingsActionMenu) {
        // Close settings action menu
        store.actions.setUIState({ showSettingsActionMenu: false });
      } else {
        // Open settings action menu
        store.actions.setUIState({ showSettingsActionMenu: true });
      }
    };

    // Cleanup function
    return () => {
      delete window.handleGlobalShortcut;
      delete window.initializeShortcuts;
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
  }, [actions]);

  return {
    keyboardShortcuts,
    // Expose functions for testing
    testShortcut: (key, modifier) => handleGlobalShortcut(key, modifier, keyboardShortcuts)
  };
};

export default useKeyboardShortcuts;
