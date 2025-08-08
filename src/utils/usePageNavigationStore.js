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
  
  // Navigation functions with circular navigation
  goToNextPage: () => {
    const { currentPage, totalPages, isAnimating } = get();
    if (!isAnimating && totalPages > 1) {
      const nextPage = (currentPage + 1) % totalPages;
      set({ 
        isAnimating: true, 
        animationDirection: 'left',
        currentPage: nextPage 
      });
    }
  },
  
  goToPreviousPage: () => {
    const { currentPage, totalPages, isAnimating } = get();
    if (!isAnimating && totalPages > 1) {
      const prevPage = (currentPage - 1 + totalPages) % totalPages;
      set({ 
        isAnimating: true, 
        animationDirection: 'right',
        currentPage: prevPage 
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
    const endIndex = startIndex + channelsPerPage - 1;
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
  },

  // Global mouse navigation event listeners
  initializeGlobalNavigation: () => {
    // Mouse side button navigation (back/forward buttons)
    const handleMouseUp = (event) => {
      // Only handle navigation when not in a modal or input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const { goToPreviousPage, goToNextPage } = get();

      switch (event.button) {
        case 3: // Mouse back button (side button 1)
          event.preventDefault();
          goToPreviousPage();
          break;
        case 4: // Mouse forward button (side button 2)
          event.preventDefault();
          goToNextPage();
          break;
        default:
          break;
      }
    };

    // Mouse wheel navigation
    const handleWheel = (event) => {
      // Only handle navigation when not in a modal or input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const { goToPreviousPage, goToNextPage } = get();

      // Check if user is holding Shift key for horizontal navigation
      if (event.shiftKey) {
        if (event.deltaY > 0) {
          // Scrolling down/right with Shift = next page
          event.preventDefault();
          goToNextPage();
        } else if (event.deltaY < 0) {
          // Scrolling up/left with Shift = previous page
          event.preventDefault();
          goToPreviousPage();
        }
      }
      // Also handle horizontal wheel directly (for mice with horizontal scroll)
      else if (event.deltaX !== 0) {
        if (event.deltaX > 0) {
          // Scrolling right = next page
          event.preventDefault();
          goToNextPage();
        } else if (event.deltaX < 0) {
          // Scrolling left = previous page
          event.preventDefault();
          goToPreviousPage();
        }
      }
    };

    // Add global event listeners
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    // Return cleanup function
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  },

  // Settings management
  getSettings: () => {
    const { currentPage, totalPages, channelsPerPage } = get();
    return {
      currentPage,
      totalPages,
      channelsPerPage
    };
  },

  loadSettings: (settings) => {
    if (settings) {
      set({
        currentPage: settings.currentPage || 0,
        totalPages: settings.totalPages || 3,
        channelsPerPage: settings.channelsPerPage || 12
      });
    }
  }
}));

export default usePageNavigationStore; 