import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../ui/WButton';
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

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    // Add event listener when modal opens
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup event listener when modal closes
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  // Expose handleClose to children via context or prop
  // Instead, recommend: pass handleClose to footerContent and use it for Cancel/Save

  if (isClosing) {
    // Optionally, block interaction while closing
  }

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div 
        className={`base-modal ${className} ${isClosing ? 'closing' : ''}`} 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, minWidth: 700 }}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <Button 
            variant="tertiary" 
            onClick={handleClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              padding: '4px',
              minWidth: 'auto',
              width: 'auto'
            }}
          >
            ×
          </Button>
        </div>
        <div className="modal-content" style={{ paddingBottom: 40 }}>
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