import { create } from 'zustand';
import { DEFAULT_SHORTCUTS, parseShortcut, validateShortcut, checkShortcutConflict, formatShortcut } from './keyboardShortcuts';

const useUIStore = create((set, get) => ({
  // Settings menu state
  showSettingsMenu: false,
  settingsMenuFadeIn: false,
  
  // Modal states
  showPresetsModal: false,
  showWallpaperModal: false,
  showSoundModal: false,
  showChannelSettingsModal: false,
  showAppShortcutsModal: false,
  showGeneralSettingsModal: false,
  showTimeSettingsModal: false,
  showRibbonSettingsModal: false,
  showUpdateModal: false,
  showPrimaryActionsModal: false,
  showAppearanceSettingsModal: false,
  showImageSearchModal: false,
  imageSearchModalData: null, // { onSelect, onUploadClick }
  showNavigationCustomizationModal: false,
  showMonitorSelectionModal: false,
  showClassicDockSettingsModal: false,


  

  
  // Confirmation modal state
  showConfirmationModal: false,
  confirmationModalData: {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'danger-primary',
    onConfirm: null,
    onCancel: null
  },
  
  // Community sharing states
  showCommunitySection: false,
  
  // Keyboard shortcuts state
  keyboardShortcuts: DEFAULT_SHORTCUTS.map(shortcut => ({
    ...shortcut,
    key: shortcut.defaultKey,
    modifier: shortcut.defaultModifier,
    enabled: true
  })),
  
  // Actions
  openSettingsMenu: () => {
    set({ showSettingsMenu: true });
    // Trigger fade-in after a brief delay
    setTimeout(() => set({ settingsMenuFadeIn: true }), 10);
  },
  
  closeSettingsMenu: () => {
    set({ settingsMenuFadeIn: false });
    // Close menu after fade-out animation completes
    setTimeout(() => set({ showSettingsMenu: false }), 200);
  },
  
  toggleSettingsMenu: () => {
    const { showSettingsMenu } = get();
    if (showSettingsMenu) {
      get().closeSettingsMenu();
    } else {
      get().openSettingsMenu();
    }
  },
  
  // Modal actions
  openPresetsModal: () => set({ showPresetsModal: true }),
  closePresetsModal: () => set({ 
    showPresetsModal: false,
    showCommunitySection: false
  }),
  togglePresetsModal: () => {
    const { showPresetsModal } = get();
    set({ showPresetsModal: !showPresetsModal });
  },
  
  // Community sharing actions
  toggleCommunitySection: () => set(state => ({ 
    showCommunitySection: !state.showCommunitySection 
  })),
  setCommunitySection: (show) => set({ showCommunitySection: show }),
  
  openWallpaperModal: () => set({ showWallpaperModal: true }),
  closeWallpaperModal: () => set({ showWallpaperModal: false }),
  toggleWallpaperModal: () => {
    const { showWallpaperModal } = get();
    set({ showWallpaperModal: !showWallpaperModal });
  },
  
  openSoundModal: () => set({ showSoundModal: true }),
  closeSoundModal: () => set({ showSoundModal: false }),
  toggleSoundModal: () => {
    const { showSoundModal } = get();
    set({ showSoundModal: !showSoundModal });
  },
  
  openChannelSettingsModal: () => set({ showChannelSettingsModal: true }),
  closeChannelSettingsModal: () => set({ showChannelSettingsModal: false }),
  toggleChannelSettingsModal: () => {
    const { showChannelSettingsModal } = get();
    set({ showChannelSettingsModal: !showChannelSettingsModal });
  },
  
  openAppShortcutsModal: () => set({ showAppShortcutsModal: true }),
  closeAppShortcutsModal: () => set({ showAppShortcutsModal: false }),
  toggleAppShortcutsModal: () => {
    const { showAppShortcutsModal } = get();
    set({ showAppShortcutsModal: !showAppShortcutsModal });
  },
  
  openGeneralSettingsModal: () => set({ showGeneralSettingsModal: true }),
  closeGeneralSettingsModal: () => set({ showGeneralSettingsModal: false }),
  toggleGeneralSettingsModal: () => {
    const { showGeneralSettingsModal } = get();
    set({ showGeneralSettingsModal: !showGeneralSettingsModal });
  },
  
  openTimeSettingsModal: () => set({ showTimeSettingsModal: true }),
  closeTimeSettingsModal: () => set({ showTimeSettingsModal: false }),
  toggleTimeSettingsModal: () => {
    const { showTimeSettingsModal } = get();
    set({ showTimeSettingsModal: !showTimeSettingsModal });
  },
  
  openRibbonSettingsModal: () => set({ showRibbonSettingsModal: true }),
  closeRibbonSettingsModal: () => set({ showRibbonSettingsModal: false }),
  toggleRibbonSettingsModal: () => {
    const { showRibbonSettingsModal } = get();
    set({ showRibbonSettingsModal: !showRibbonSettingsModal });
  },
  
  openUpdateModal: () => set({ showUpdateModal: true }),
  closeUpdateModal: () => set({ showUpdateModal: false }),
  toggleUpdateModal: () => {
    const { showUpdateModal } = get();
    set({ showUpdateModal: !showUpdateModal });
  },
  
  openPrimaryActionsModal: () => set({ showPrimaryActionsModal: true }),
  closePrimaryActionsModal: () => set({ showPrimaryActionsModal: false }),
  togglePrimaryActionsModal: () => {
    const { showPrimaryActionsModal } = get();
    set({ showPrimaryActionsModal: !showPrimaryActionsModal });
  },
  
  openAppearanceSettingsModal: () => set({ showAppearanceSettingsModal: true }),
  closeAppearanceSettingsModal: () => set({ showAppearanceSettingsModal: false }),
  toggleAppearanceSettingsModal: () => {
    const { showAppearanceSettingsModal } = get();
    set({ showAppearanceSettingsModal: !showAppearanceSettingsModal });
  },
  
  openImageSearchModal: (data) => set({ showImageSearchModal: true, imageSearchModalData: data }),
  closeImageSearchModal: () => set({ showImageSearchModal: false, imageSearchModalData: null }),
  openNavigationCustomizationModal: () => set({ showNavigationCustomizationModal: true }),
  closeNavigationCustomizationModal: () => set({ showNavigationCustomizationModal: false }),
  openMonitorSelectionModal: () => set({ showMonitorSelectionModal: true }),
  closeMonitorSelectionModal: () => set({ showMonitorSelectionModal: false }),


  

  
  // Keyboard shortcuts actions
  updateKeyboardShortcut: (shortcutId, updates) => {
    const { keyboardShortcuts } = get();
    const updatedShortcuts = keyboardShortcuts.map(shortcut => 
      shortcut.id === shortcutId ? { ...shortcut, ...updates } : shortcut
    );
    set({ keyboardShortcuts: updatedShortcuts });
    
    // Sync Spotify widget hotkey with API integrations store
    if (shortcutId === 'toggle-spotify-widget' && (updates.key || updates.modifier)) {
      try {
        const apiStore = require('./useApiIntegrationsStore').default;
        const spotify = apiStore.getState().spotify;
        const newKey = updates.key || spotify.hotkeyKey;
        const newModifier = updates.modifier || spotify.hotkeyModifier;
        const newHotkey = formatShortcut({ key: newKey, modifier: newModifier });
        
        apiStore.getState().updateSpotifyHotkey(newHotkey, newKey, newModifier);
      } catch (error) {
        console.warn('[UI STORE] Failed to sync with API integrations:', error);
      }
    }
  },
  
  resetKeyboardShortcuts: () => {
    const resetShortcuts = DEFAULT_SHORTCUTS.map(shortcut => ({
      ...shortcut,
      key: shortcut.defaultKey,
      modifier: shortcut.defaultModifier,
      enabled: true
    }));
    set({ keyboardShortcuts: resetShortcuts });
  },
  
  loadKeyboardShortcuts: (shortcuts) => {
    set({ keyboardShortcuts: shortcuts });
  },
  
  // Global keyboard shortcuts handler
  handleGlobalKeyPress: (event) => {
    const { 
      showSettingsMenu, 
      showPresetsModal,
      showWallpaperModal,
      showSoundModal,
      showChannelSettingsModal,
      showAppShortcutsModal,
      showGeneralSettingsModal,
      showTimeSettingsModal,
      showRibbonSettingsModal,
      showUpdateModal,
      showPrimaryActionsModal,
      showAppearanceSettingsModal,
  
      showCommunitySection,
      keyboardShortcuts 
    } = get();
    
    // Check for custom settings shortcut first
    const customSettingsShortcut = window.settings?.settingsShortcut;
    if (customSettingsShortcut) {
      const keys = customSettingsShortcut.split(' + ');
      const hasCtrl = keys.includes('Ctrl') && event.ctrlKey;
      const hasShift = keys.includes('Shift') && event.shiftKey;
      const hasAlt = keys.includes('Alt') && event.altKey;
      const hasCmd = keys.includes('Cmd') && event.metaKey;
      
      // Check if the main key matches
      const mainKey = keys.find(key => !['Ctrl', 'Shift', 'Alt', 'Cmd'].includes(key));
      const keyMatches = mainKey && event.key.toUpperCase() === mainKey;
      
      // Check if all required modifiers are pressed
      const modifiersMatch = 
        (keys.includes('Ctrl') ? hasCtrl : !event.ctrlKey) &&
        (keys.includes('Shift') ? hasShift : !event.shiftKey) &&
        (keys.includes('Alt') ? hasAlt : !event.altKey) &&
        (keys.includes('Cmd') ? hasCmd : !event.metaKey);
      
      if (keyMatches && modifiersMatch) {
        event.preventDefault();
        
        // Toggle appearance settings modal
        if (showAppearanceSettingsModal) {
          get().closeAppearanceSettingsModal();
        } else {
          get().openAppearanceSettingsModal();
        }
        return;
      }
    }
    
    // Check if any modal is open that should handle its own keyboard events
    const modalsOpen = showPresetsModal || showWallpaperModal || showSoundModal || 
                      showChannelSettingsModal || showAppShortcutsModal ||
                      showGeneralSettingsModal || showTimeSettingsModal ||
                      showRibbonSettingsModal || showUpdateModal || showPrimaryActionsModal ||
                      showAppearanceSettingsModal;
    
    // Get the current key and modifier
    const key = event.key.toLowerCase();
    const modifier = event.ctrlKey ? 'ctrl' : 
                    event.altKey ? 'alt' : 
                    event.shiftKey ? 'shift' : 
                    event.metaKey ? 'meta' : 'none';
    
    // Find matching shortcut
    const matchingShortcut = keyboardShortcuts.find(shortcut => 
      shortcut.enabled && 
      shortcut.key.toLowerCase() === key && 
      shortcut.modifier === modifier
    );
    
    if (matchingShortcut) {
      event.preventDefault();
      
      // Handle modal-specific shortcuts (close if open, open if closed)
      const modalActions = {
        'openPresetsModal': () => {
          if (showPresetsModal) {
            get().closePresetsModal();
          } else {
            get().openPresetsModal();
          }
        },
        'openWallpaperModal': () => {
          if (showWallpaperModal) {
            get().closeWallpaperModal();
          } else {
            get().openWallpaperModal();
          }
        },
        'openSoundModal': () => {
          if (showSoundModal) {
            get().closeSoundModal();
          } else {
            get().openSoundModal();
          }
        },
        'openChannelSettingsModal': () => {
          if (showChannelSettingsModal) {
            get().closeChannelSettingsModal();
          } else {
            get().openChannelSettingsModal();
          }
        },
        'openAppShortcutsModal': () => {
          if (showAppShortcutsModal) {
            get().closeAppShortcutsModal();
          } else {
            get().openAppShortcutsModal();
          }
        },
        'openGeneralSettingsModal': () => {
          if (showGeneralSettingsModal) {
            get().closeGeneralSettingsModal();
          } else {
            get().openGeneralSettingsModal();
          }
        },
        'openTimeSettingsModal': () => {
          if (showTimeSettingsModal) {
            get().closeTimeSettingsModal();
          } else {
            get().openTimeSettingsModal();
          }
        },
        'openRibbonSettingsModal': () => {
          if (showRibbonSettingsModal) {
            get().closeRibbonSettingsModal();
          } else {
            get().openRibbonSettingsModal();
          }
        },
        'openUpdateModal': () => {
          if (showUpdateModal) {
            get().closeUpdateModal();
          } else {
            get().openUpdateModal();
          }
        },
        'openPrimaryActionsModal': () => {
          if (showPrimaryActionsModal) {
            get().closePrimaryActionsModal();
          } else {
            get().openPrimaryActionsModal();
          }
        },
        'toggleSettingsMenu': () => {
          if (modalsOpen) {
            // If any modal is open, let it handle the key
            return;
          }
          
          if (showSettingsMenu) {
            get().closeSettingsMenu();
          } else {
            // Check if any other modals are open by looking for elements with modal-related classes
            const otherModalsOpen = document.querySelector('.modal-overlay, .base-modal, [role="dialog"]');
            
            if (!otherModalsOpen) {
              get().openSettingsMenu();
            }
          }
        }
      };
      
      const action = modalActions[matchingShortcut.action];
      if (action) {
        action();
      }
    }
  },

  closeNavigationCustomizationModal: () => set({
    showNavigationCustomizationModal: false
  }),

  // Confirmation modal actions
  openConfirmationModal: (data) => set({
    showConfirmationModal: true,
    confirmationModalData: {
      title: data.title || 'Confirm Action',
      message: data.message || 'Are you sure you want to proceed?',
      confirmText: data.confirmText || 'Confirm',
      cancelText: data.cancelText || 'Cancel',
      confirmVariant: data.confirmVariant || 'danger-primary',
      onConfirm: data.onConfirm,
      onCancel: data.onCancel
    }
  }),

  closeConfirmationModal: () => set({
    showConfirmationModal: false,
    confirmationModalData: {
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      confirmVariant: 'danger-primary',
      onConfirm: null,
      onCancel: null
    }
  }),

  // Convenience function for common confirmation patterns
  confirmDelete: (itemName, onConfirm, onCancel = null) => {
    set({
      showConfirmationModal: true,
      confirmationModalData: {
        title: 'Delete Confirmation',
        message: `Are you sure you want to delete <strong>"${itemName}"</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmVariant: 'danger-primary',
        onConfirm,
        onCancel
      }
    });
  },

  confirmAction: (title, message, onConfirm, onCancel = null, confirmText = 'Confirm', confirmVariant = 'primary') => {
    set({
      showConfirmationModal: true,
      confirmationModalData: {
        title,
        message,
        confirmText,
        cancelText: 'Cancel',
        confirmVariant,
        onConfirm,
        onCancel
      }
    });
  },
}));

export default useUIStore; 