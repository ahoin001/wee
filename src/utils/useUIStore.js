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
  closePresetsModal: () => set({ showPresetsModal: false }),
  togglePresetsModal: () => {
    const { showPresetsModal } = get();
    set({ showPresetsModal: !showPresetsModal });
  },
  
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
      keyboardShortcuts 
    } = get();
    
    // Check if any modal is open that should handle its own keyboard events
    const modalsOpen = showPresetsModal || showWallpaperModal || showSoundModal || 
                      showChannelSettingsModal || showAppShortcutsModal;
    
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