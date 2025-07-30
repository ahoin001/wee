import { create } from 'zustand';
import { DEFAULT_SHORTCUTS, parseShortcut, validateShortcut, checkShortcutConflict } from './keyboardShortcuts';

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
  
  // Keyboard shortcuts actions
  updateKeyboardShortcut: (shortcutId, updates) => {
    const { keyboardShortcuts } = get();
    const updatedShortcuts = keyboardShortcuts.map(shortcut => 
      shortcut.id === shortcutId ? { ...shortcut, ...updates } : shortcut
    );
    set({ keyboardShortcuts: updatedShortcuts });
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
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openPresetsModal();
          }
        },
        'openWallpaperModal': () => {
          if (showWallpaperModal) {
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openWallpaperModal();
          }
        },
        'openSoundModal': () => {
          if (showSoundModal) {
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openSoundModal();
          }
        },
        'openChannelSettingsModal': () => {
          if (showChannelSettingsModal) {
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openChannelSettingsModal();
          }
        },
        'openAppShortcutsModal': () => {
          if (showAppShortcutsModal) {
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openAppShortcutsModal();
          }
        },
        'openGeneralSettingsModal': () => {
          if (showGeneralSettingsModal) {
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openGeneralSettingsModal();
          }
        },
        'openTimeSettingsModal': () => {
          if (showTimeSettingsModal) {
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openTimeSettingsModal();
          }
        },
        'openRibbonSettingsModal': () => {
          if (showRibbonSettingsModal) {
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openRibbonSettingsModal();
          }
        },
        'openUpdateModal': () => {
          if (showUpdateModal) {
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openUpdateModal();
          }
        },
        'openPrimaryActionsModal': () => {
          if (showPrimaryActionsModal) {
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
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
}));

export default useUIStore; 