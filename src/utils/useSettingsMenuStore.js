import { create } from 'zustand';

const useSettingsMenuStore = create((set, get) => ({
  // State
  isOpen: false,
  isFading: false,
  
  // Actions
  openMenu: () => {
    set({ isOpen: true });
    setTimeout(() => set({ isFading: true }), 10); // trigger fade-in
  },
  
  closeMenu: () => {
    set({ isFading: false });
    setTimeout(() => set({ isOpen: false }), 200); // match fade-out duration
  },
  
  toggleMenu: () => {
    const { isOpen } = get();
    if (isOpen) {
      get().closeMenu();
    } else {
      get().openMenu();
    }
  },
  
  // Modal states
  showSoundModal: false,
  showWallpaperModal: false,
  showGeneralModal: false,
  
  // Modal actions
  openSoundModal: () => set({ showSoundModal: true }),
  closeSoundModal: () => set({ showSoundModal: false }),
  
  openWallpaperModal: () => set({ showWallpaperModal: true }),
  closeWallpaperModal: () => set({ showWallpaperModal: false }),
  
  openGeneralModal: () => set({ showGeneralModal: true }),
  closeGeneralModal: () => set({ showGeneralModal: false }),
}));

export default useSettingsMenuStore; 