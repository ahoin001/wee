import React from 'react';
import PropTypes from 'prop-types';
import { WeeModalShell } from '../../ui/wee';
import './ImageModal.css';

const ImageModal = ({ isOpen, onClose, imageUrl, title }) => {
  return (
    <WeeModalShell
      isOpen={isOpen && Boolean(imageUrl)}
      onClose={onClose}
      headerTitle={title || 'Image Preview'}
      showRail={false}
      maxWidth="980px"
    >
      <div className="image-modal-content">
        <div className="image-modal-body">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || 'Preview'}
              className="image-modal-image max-h-[70vh] max-w-full rounded-lg object-contain shadow-[var(--shadow-lg)]"
            />
          ) : null}
        </div>
      </div>
    </WeeModalShell>
  );
};

ImageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string.isRequired,
  title: PropTypes.string
};

export default ImageModal; 


