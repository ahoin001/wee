import React, { useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import useChannelOperations from '../utils/useChannelOperations';
import './SlideNavigation.css';

const SlideNavigation = ({ children }) => {
  const {
    navigation,
    nextPage,
    prevPage
  } = useChannelOperations();
  
  const { currentPage, totalPages } = navigation;
  
  const containerRef = useRef(null);
  const pagesRef = useRef(null);

  // Calculate slide transform based on current page
  const getSlideTransform = useCallback(() => {
    return `translateX(-${currentPage * 100}%)`;
  }, [currentPage]);

  // Handle mouse wheel navigation
  const handleWheel = useCallback((e) => {
    // Prevent default scroll behavior
    e.preventDefault();
    
    // Check if it's a horizontal scroll (mouse wheel side buttons)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 0 && currentPage < totalPages - 1) {
        // Scroll right - go to next page
        nextPage();
      } else if (e.deltaX < 0 && currentPage > 0) {
        // Scroll left - go to previous page
        prevPage();
      }
    }
  }, [currentPage, totalPages, nextPage, prevPage]);

  // Add/remove event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse wheel events
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Update transform when navigation state changes
  useEffect(() => {
    if (pagesRef.current) {
      pagesRef.current.style.transform = getSlideTransform();
    }
  }, [getSlideTransform]);

  // Don't render if only one page
  if (totalPages <= 1) {
    return <div className="slide-navigation-container">{children}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="slide-navigation-container"
    >
      <div 
        ref={pagesRef}
        className="slide-navigation-pages"
        style={{
          transform: getSlideTransform(),
          transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
};

SlideNavigation.propTypes = {
  children: PropTypes.node.isRequired
};

export default SlideNavigation;
