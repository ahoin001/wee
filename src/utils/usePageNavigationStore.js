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
  },

  // Global mouse navigation event listeners
  initializeGlobalNavigation: () => {
    // Mouse side button navigation (back/forward buttons)
    const handleMouseUp = (event) => {
      // console.log('PageNavigation: Global mouse button event detected', {
      //   button: event.button,
      //   buttons: event.buttons,
      //   target: event.target.tagName
      // });

      // Only handle navigation when not in a modal or input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        console.log('PageNavigation: Ignoring mouse button - in input field');
        return;
      }

      const { goToPreviousPage, goToNextPage } = get();

      switch (event.button) {
        case 3: // Mouse back button (side button 1)
          console.log('PageNavigation: Mouse back button (3) pressed - going to previous page');
          event.preventDefault();
          goToPreviousPage();
          break;
        case 4: // Mouse forward button (side button 2)
          console.log('PageNavigation: Mouse forward button (4) pressed - going to next page');
          event.preventDefault();
          goToNextPage();
          break;
        default:
          // console.log('PageNavigation: Mouse button not handled:', event.button);
          break;
      }
    };

    // Mouse wheel navigation
    const handleWheel = (event) => {
      // console.log('PageNavigation: Global wheel event detected', {
      //   deltaX: event.deltaX,
      //   deltaY: event.deltaY,
      //   shiftKey: event.shiftKey,
      //   target: event.target.tagName
      // });

      // Only handle navigation when not in a modal or input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        console.log('PageNavigation: Ignoring wheel - in input field');
        return;
      }

      const { goToPreviousPage, goToNextPage } = get();

      // Check if user is holding Shift key for horizontal navigation
      if (event.shiftKey) {
        if (event.deltaY > 0) {
          // Scrolling down/right with Shift = next page
          console.log('PageNavigation: Shift+Wheel down - going to next page');
          event.preventDefault();
          goToNextPage();
        } else if (event.deltaY < 0) {
          // Scrolling up/left with Shift = previous page
          console.log('PageNavigation: Shift+Wheel up - going to previous page');
          event.preventDefault();
          goToPreviousPage();
        }
      }
      // Also handle horizontal wheel directly (for mice with horizontal scroll)
      else if (event.deltaX !== 0) {
        if (event.deltaX > 0) {
          // Scrolling right = next page
          console.log('PageNavigation: Horizontal wheel right - going to next page');
          event.preventDefault();
          goToNextPage();
        } else if (event.deltaX < 0) {
          // Scrolling left = previous page
          console.log('PageNavigation: Horizontal wheel left - going to previous page');
          event.preventDefault();
          goToPreviousPage();
        }
      } else {
        // console.log('PageNavigation: Wheel event not handled (no shift key, no horizontal delta)');
      }
    };

    // Add global event listeners
    // console.log('PageNavigation: Adding global mouse navigation event listeners');
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    // Return cleanup function
    return () => {
      // console.log('PageNavigation: Removing global mouse navigation event listeners');
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }
}));

export default usePageNavigationStore; 