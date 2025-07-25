import { create } from 'zustand';

const usePageNavigationStore = create((set, get) => ({
  // State
  currentPage: 0,
  totalPages: 3, // Start with 3 pages (36 channels total: 12 per page)
  isAnimating: false,
  animationDirection: 'none', // 'left', 'right', 'none'
  
  // Configuration
  channelsPerPage: 12,
  maxPages: 10, // Maximum allowed pages
  
  // Actions
  setCurrentPage: (page) => {
    const { totalPages } = get();
    if (page >= 0 && page < totalPages) {
      set({ currentPage: page });
    }
  },
  
  setTotalPages: (pages) => {
    const { maxPages } = get();
    const validPages = Math.min(Math.max(1, pages), maxPages);
    set({ totalPages: validPages });
  },
  
  setIsAnimating: (animating) => set({ isAnimating: animating }),
  
  setAnimationDirection: (direction) => set({ animationDirection: direction }),
  
  // Navigation functions
  goToNextPage: () => {
    const { currentPage, totalPages, isAnimating } = get();
    if (!isAnimating && currentPage < totalPages - 1) {
      set({ 
        isAnimating: true, 
        animationDirection: 'left',
        currentPage: currentPage + 1 
      });
    }
  },
  
  goToPreviousPage: () => {
    const { currentPage, isAnimating } = get();
    if (!isAnimating && currentPage > 0) {
      set({ 
        isAnimating: true, 
        animationDirection: 'right',
        currentPage: currentPage - 1 
      });
    }
  },
  
  goToPage: (targetPage) => {
    const { currentPage, totalPages, isAnimating } = get();
    if (!isAnimating && targetPage >= 0 && targetPage < totalPages && targetPage !== currentPage) {
      const direction = targetPage > currentPage ? 'left' : 'right';
      set({ 
        isAnimating: true, 
        animationDirection: direction,
        currentPage: targetPage 
      });
    }
  },
  
  finishAnimation: () => {
    set({ 
      isAnimating: false, 
      animationDirection: 'none' 
    });
  },
  
  // Utility functions
  getChannelIndexRange: (page) => {
    const { channelsPerPage } = get();
    const startIndex = page * channelsPerPage;
    const endIndex = startIndex + channelsPerPage;
    return { startIndex, endIndex };
  },
  
  getPageForChannelIndex: (channelIndex) => {
    const { channelsPerPage } = get();
    return Math.floor(channelIndex / channelsPerPage);
  },
  
  getTotalChannelsCount: () => {
    const { totalPages, channelsPerPage } = get();
    return totalPages * channelsPerPage;
  },
  
  // Check if we need to add a new page (when user configures a channel beyond current range)
  ensurePageExists: (channelIndex) => {
    const { getPageForChannelIndex, totalPages, setTotalPages } = get();
    const requiredPage = getPageForChannelIndex(channelIndex);
    if (requiredPage >= totalPages) {
      setTotalPages(requiredPage + 1);
    }
  }
}));

export default usePageNavigationStore; 