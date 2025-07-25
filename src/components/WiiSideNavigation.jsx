import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import usePageNavigationStore from '../utils/usePageNavigationStore';
import './WiiSideNavigation.css';

const WiiSideNavigation = () => {
  const {
    currentPage,
    totalPages,
    isAnimating,
    goToNextPage,
    goToPreviousPage,
    finishAnimation
  } = usePageNavigationStore();

  const [leftHovered, setLeftHovered] = useState(false);
  const [rightHovered, setRightHovered] = useState(false);

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
          if (currentPage > 0) {
            goToPreviousPage();
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (currentPage < totalPages - 1) {
            goToNextPage();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPreviousPage, currentPage, totalPages]);

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

  const canGoLeft = currentPage > 0;
  const canGoRight = currentPage < totalPages - 1;

  return (
    <>
      {/* Left Navigation Arrow */}
      {canGoLeft && (
        <div 
          className="wii-side-nav wii-side-nav-left"
          onMouseEnter={() => setLeftHovered(true)}
          onMouseLeave={() => setLeftHovered(false)}
        >
          {/* Triangular Arrow */}
          <div className="wii-arrow wii-arrow-left">
            <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
              <path 
                d="M35 5 L5 30 L35 55 Z" 
                fill="url(#leftArrowGradient)"
                stroke="#1e3a8a"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="leftArrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Circular Button that grows out */}
          <button
            className={`wii-nav-button wii-nav-button-left ${leftHovered ? 'visible' : ''}`}
            onClick={goToPreviousPage}
            disabled={isAnimating}
            title="Previous page"
          >
            <div className="wii-button-circle">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path 
                  d="M5 10 L15 10" 
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Right Navigation Arrow */}
      {canGoRight && (
        <div 
          className="wii-side-nav wii-side-nav-right"
          onMouseEnter={() => setRightHovered(true)}
          onMouseLeave={() => setRightHovered(false)}
        >
          {/* Triangular Arrow */}
          <div className="wii-arrow wii-arrow-right">
            <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
              <path 
                d="M5 5 L35 30 L5 55 Z" 
                fill="url(#rightArrowGradient)"
                stroke="#1e3a8a"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="rightArrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Circular Button that grows out */}
          <button
            className={`wii-nav-button wii-nav-button-right ${rightHovered ? 'visible' : ''}`}
            onClick={goToNextPage}
            disabled={isAnimating}
            title="Next page"
          >
            <div className="wii-button-circle">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path 
                  d="M10 5 L10 15 M5 10 L15 10" 
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </button>
        </div>
      )}
    </>
  );
};

WiiSideNavigation.propTypes = {};

export default WiiSideNavigation;
