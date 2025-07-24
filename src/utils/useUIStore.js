import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  // Settings menu state
  showSettingsMenu: false,
  settingsMenuFadeIn: false,
  
  // Modal states
  showPresetsModal: false,
  showWallpaperModal: false,
  showSoundModal: false,
  
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
  
  // Global keyboard shortcuts handler
  handleGlobalKeyPress: (event) => {
    const { showSettingsMenu, showPresetsModal, showWallpaperModal, showSoundModal } = get();
    
    // Handle Ctrl+key combinations
    if (event.ctrlKey) {
      switch (event.key.toLowerCase()) {
        case 'p':
          event.preventDefault(); // Prevent browser print dialog
          if (showPresetsModal) {
            // Modal is open, simulate escape key to trigger proper closing animation
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openPresetsModal();
          }
          break;
        case 'w':
          event.preventDefault(); // Prevent browser close tab
          if (showWallpaperModal) {
            // Modal is open, simulate escape key to trigger proper closing animation
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openWallpaperModal();
          }
          break;
        case 's':
          event.preventDefault(); // Prevent browser save dialog
          if (showSoundModal) {
            // Modal is open, simulate escape key to trigger proper closing animation
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);
          } else {
            get().openSoundModal();
          }
          break;
        default:
          break;
      }
      return;
    }
    
    // Handle other keys
    switch (event.key) {
      case 'Escape':
        // Check if any of our managed modals are open first
        if (showPresetsModal || showWallpaperModal || showSoundModal) {
          // Let the modal handle the escape key itself, don't interfere
          return;
        }
        
        if (showSettingsMenu) {
          // If settings menu is open, close it
          get().closeSettingsMenu();
        } else {
          // Check if any other modals are open by looking for elements with modal-related classes
          const modalsOpen = document.querySelector('.modal-overlay, .base-modal, [role="dialog"]');
          
          if (!modalsOpen) {
            // Only open settings menu if no modals are currently open
            get().openSettingsMenu();
          }
        }
        break;
      default:
        break;
    }
  },
}));

export default useUIStore; 