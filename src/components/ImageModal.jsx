import React from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import Button from '../ui/Button';
import './ImageModal.css';

const ImageModal = ({ isOpen, onClose, imageUrl, title }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="large">
      <div className="image-modal-content">
        <div className="image-modal-header">
          <h3 style={{ 
            margin: 0, 
            color: 'hsl(var(--text-primary))',
            fontSize: '18px',
            fontWeight: 600
          }}>
            {title || 'Image Preview'}
          </h3>
          <Button
            variant="tertiary"
            onClick={onClose}
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
        
        <div className="image-modal-body">
          <img
            src={imageUrl}
            alt={title || 'Preview'}
            className="image-modal-image"
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          />
        </div>
      </div>
    </BaseModal>
  );
};

ImageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string.isRequired,
  title: PropTypes.string
};

export default ImageModal; 