import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import usePageNavigationStore from '../utils/usePageNavigationStore';
import './PageNavigation.css';

const PageNavigation = ({ position = 'bottom' }) => {
  const {
    currentPage,
    totalPages,
    isAnimating,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    finishAnimation
  } = usePageNavigationStore();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle navigation when not in a modal or input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextPage();
          break;
        case 'Home':
          event.preventDefault();
          goToPage(0);
          break;
        case 'End':
          event.preventDefault();
          goToPage(totalPages - 1);
          break;
        default:
          // Handle number keys (1-9) to jump to specific pages
          if (event.key >= '1' && event.key <= '9') {
            const pageIndex = parseInt(event.key) - 1;
            if (pageIndex < totalPages) {
              event.preventDefault();
              goToPage(pageIndex);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPreviousPage, goToPage, totalPages]);

  // Auto-finish animation after transition duration
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        finishAnimation();
      }, 500); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isAnimating, finishAnimation]);

  // Don't show navigation if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`page-navigation page-navigation-${position}`}>
      {/* Left Arrow */}
      <button
        className={`nav-arrow nav-arrow-left ${currentPage === 0 ? 'disabled' : ''}`}
        onClick={goToPreviousPage}
        disabled={currentPage === 0 || isAnimating}
        title="Previous page (Arrow Left)"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path 
            d="M15 18L9 12L15 6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Page Indicators */}
      <div className="page-indicators">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={`page-indicator ${index === currentPage ? 'active' : ''}`}
            onClick={() => goToPage(index)}
            disabled={isAnimating}
            title={`Go to page ${index + 1}`}
          >
            <span className="page-dot"></span>
          </button>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        className={`nav-arrow nav-arrow-right ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
        onClick={goToNextPage}
        disabled={currentPage === totalPages - 1 || isAnimating}
        title="Next page (Arrow Right)"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path 
            d="M9 18L15 12L9 6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Page Info Text */}
      <div className="page-info">
        <span>Page {currentPage + 1} of {totalPages}</span>
      </div>

      {/* Add Page Button */}
      {totalPages < 10 && (
        <button
          className="add-page-btn"
          onClick={() => {
            const { setTotalPages } = usePageNavigationStore.getState();
            setTotalPages(totalPages + 1);
          }}
          disabled={isAnimating}
          title="Add a new page (more channels)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 5V19M5 12H19" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

PageNavigation.propTypes = {
  position: PropTypes.oneOf(['top', 'bottom'])
};

export default PageNavigation; 