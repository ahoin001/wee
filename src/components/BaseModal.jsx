import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './BaseModal.css';

function BaseModal({ 
  title, 
  onClose, 
  children, 
  footerContent,
  className = '',
  maxWidth = '500px'
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

  const handleOpen = () => {
    // Could add opening sound effect here in the future
    // if (soundSettings?.modalOpen?.enabled && soundSettings?.modalOpen?.file?.url) {
    //   const audio = new Audio(soundSettings.modalOpen.file.url);
    //   audio.volume = soundSettings.modalOpen.volume || 0.3;
    //   audio.play().catch(error => console.log('Modal open sound failed:', error));
    // }
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div 
        className={`base-modal ${className} ${isClosing ? 'closing' : ''}`} 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-content">
          {children}
        </div>
        
        {footerContent && (
          <div className="modal-footer">
            {footerContent}
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