import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './BaseModal.css';

function BaseModal({ 
  title, 
  onClose, 
  children, 
  footerContent,
  className = '',
  maxWidth = '900px'
}) {
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
  };

  // Listen for animation end to call onClose
  useEffect(() => {
    if (!isClosing) return;
    const node = overlayRef.current;
    if (!node) return;
    const onAnimationEnd = (e) => {
      // Only close when the overlay's fade-out animation ends
      if (e.target === node && e.animationName && e.animationName.includes('modalFadeOut')) {
        onClose();
      }
    };
    node.addEventListener('animationend', onAnimationEnd);
    return () => node.removeEventListener('animationend', onAnimationEnd);
  }, [isClosing, onClose]);

  return (
    <div ref={overlayRef} className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div 
        className={`base-modal ${className} ${isClosing ? 'closing' : ''}`} 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, minWidth: 700 }}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        <div className="modal-content" style={{ paddingBottom: 80 }}>
          {children}
        </div>
        {footerContent && (
          <div className="modal-footer sticky-footer">
            {typeof footerContent === 'function' ? footerContent({ handleClose }) : footerContent}
          </div>
        )}
      </div>
    </div>
  );
}

BaseModal.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  footerContent: PropTypes.node,
  className: PropTypes.string,
  maxWidth: PropTypes.string,
};

export default BaseModal; 