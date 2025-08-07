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

  // Minimal page indicator component - mouse navigation is handled globally

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't interfere with important system shortcuts like Ctrl+Shift+I
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      
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

  // Mouse navigation is now handled globally in the Zustand store
  // No need for component-level event listeners

  // Auto-finish animation after transition duration
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        finishAnimation();
      }, 500); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isAnimating, finishAnimation]);

  // Only show minimal UI (just dots) when there are multiple pages
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div 
      className={`page-navigation page-navigation-${position} minimal`}
      style={{ 
        position: 'fixed',
        bottom: '180px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '8px 16px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}
    >
      {/* Page Indicators Only - Minimal Design */}
      <div className="page-indicators" style={{ display: 'flex', gap: '6px' }}>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={`page-indicator ${index === currentPage ? 'active' : ''}`}
            onClick={() => goToPage(index)}
            disabled={isAnimating}
            title={`Go to page ${index + 1}`}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: 'none',
              background: index === currentPage ? '#fff' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0
            }}
          >
          </button>
        ))}
      </div>
    </div>
  );
};

PageNavigation.propTypes = {
  position: PropTypes.oneOf(['top', 'bottom'])
};

export default PageNavigation; 