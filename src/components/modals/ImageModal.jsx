import React from 'react';
import PropTypes from 'prop-types';
import { WBaseModal } from '../core';
import Button from '../../ui/WButton';
import './ImageModal.css';

const ImageModal = ({ isOpen, onClose, imageUrl, title }) => {
  return (
    <WBaseModal isOpen={isOpen && Boolean(imageUrl)} onClose={onClose} title={title || 'Image Preview'} maxWidth="980px">
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
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || 'Preview'}
              className="image-modal-image"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
          ) : null}
        </div>
      </div>
    </WBaseModal>
  );
};

ImageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string.isRequired,
  title: PropTypes.string
};

export default ImageModal; 


