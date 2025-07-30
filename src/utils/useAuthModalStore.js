import { create } from 'zustand';

const useAuthModalStore = create((set, get) => ({
  // Modal state
  isOpen: false,
  mode: 'signin', // 'signin' or 'signup'
  
  // Open modal
  openModal: (mode = 'signin') => {
    console.log('[AUTH STORE] Opening modal with mode:', mode);
    set({ isOpen: true, mode });
  },
  
  // Close modal
  closeModal: () => {
    console.log('[AUTH STORE] Closing modal');
    set({ isOpen: false });
    console.log('[AUTH STORE] Modal state after close:', get().isOpen);
  },
  
  // Toggle mode
  toggleMode: () => {
    const currentMode = get().mode;
    const newMode = currentMode === 'signin' ? 'signup' : 'signin';
    console.log('[AUTH STORE] Toggling mode from', currentMode, 'to', newMode);
    set({ mode: newMode });
  },
  
  // Set mode
  setMode: (mode) => {
    console.log('[AUTH STORE] Setting mode to:', mode);
    set({ mode });
  }
}));

export default useAuthModalStore; 