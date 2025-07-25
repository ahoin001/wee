import { create } from 'zustand';

const useNavigationModalStore = create((set, get) => ({
  // Modal state
  isOpen: false,
  selectedSide: null,
  currentIcon: null,

  // Actions
  openModal: (side, icon) => set({ 
    isOpen: true, 
    selectedSide: side, 
    currentIcon: icon 
  }),
  
  closeModal: () => set({ 
    isOpen: false, 
    selectedSide: null, 
    currentIcon: null 
  }),

  // Getters
  getModalState: () => {
    const state = get();
    return {
      isOpen: state.isOpen,
      selectedSide: state.selectedSide,
      currentIcon: state.currentIcon
    };
  }
}));

export default useNavigationModalStore; 