import React from 'react';
import PropTypes from 'prop-types';
import useChannelOperations from '../utils/useChannelOperations';
import './PageNavigation.css';

const PageNavigation = ({
  position = 'bottom',
  showPageIndicator = true
}) => {
  const {
    navigation,
    goToPage
  } = useChannelOperations();
  
  const { currentPage, totalPages, mode } = navigation;

  // Don't show navigation if there's only one page or if in wii mode
  if (totalPages <= 1 || mode === 'wii') {
    return null;
  }

  return (
    <div className={`page-navigation page-navigation-${position}`}>
      {/* Page Indicator Dots Only */}
      {showPageIndicator && (
        <div className="page-indicators">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`page-indicator ${index === currentPage ? 'active' : ''}`}
              onClick={() => goToPage(index)}
              title={`Go to page ${index + 1}`}
            >
              <span className="indicator-dot" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

PageNavigation.propTypes = {
  position: PropTypes.oneOf(['top', 'bottom']),
  showPageIndicator: PropTypes.bool
};

export default PageNavigation; 