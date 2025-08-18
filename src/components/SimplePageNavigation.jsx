import React from 'react';
import PropTypes from 'prop-types';
import useChannelOperations from '../utils/useChannelOperations';
import './SimplePageNavigation.css';

const SimplePageNavigation = ({ 
  position = 'bottom',
  showPageNumbers = true,
  showNavigationButtons = true
}) => {
  const {
    navigation,
    nextPage,
    prevPage,
    goToPage
  } = useChannelOperations();
  
  const { currentPage, totalPages, mode } = navigation;

  // Don't show navigation if there's only one page or if in wii mode
  if (totalPages <= 1 || mode === 'wii') {
    return null;
  }

  const canGoLeft = currentPage > 0;
  const canGoRight = currentPage < totalPages - 1;



  return (
    <div className="simple-page-navigation">
      {/* Navigation Buttons */}
      {showNavigationButtons && (
        <div className="navigation-buttons">
                     <button
             className={`nav-button prev-button ${!canGoLeft ? 'disabled' : ''}`}
                           onClick={prevPage}
             disabled={!canGoLeft}
             title="Previous page"
           >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path 
                d="M10 4 L6 8 L10 12" 
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

                     <button
             className={`nav-button next-button ${!canGoRight ? 'disabled' : ''}`}
                           onClick={nextPage}
             disabled={!canGoRight}
             title="Next page"
           >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path 
                d="M6 4 L10 8 L6 12" 
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Page Numbers */}
      {showPageNumbers && (
        <div className="page-numbers">
          <span className="page-info">
            {currentPage + 1} / {totalPages}
          </span>
          
          <div className="page-dots">
            {Array.from({ length: totalPages }, (_, index) => (
                             <button
                 key={index}
                 className={`page-dot ${index === currentPage ? 'active' : ''}`}
                 onClick={() => goToPage(index)}
                 title={`Go to page ${index + 1}`}
               >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

SimplePageNavigation.propTypes = {
  position: PropTypes.oneOf(['top', 'bottom']),
  showPageNumbers: PropTypes.bool,
  showNavigationButtons: PropTypes.bool
};

export default SimplePageNavigation;
