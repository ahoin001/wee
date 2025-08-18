import React from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import SoundManagementContent from './SoundManagementContent';
import './SoundModal.css';

function SoundModal({ isOpen, onClose, onSettingsChange }) {
  if (!isOpen) return null;

  return (
    <WBaseModal
      title="🎵 Sound Studio - Manage App Sounds"
      onClose={onClose}
      className="sound-modal"
      maxWidth="1200px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button 
            className="btn btn-secondary wii-button" 
            onClick={handleClose}
            style={{ 
              padding: '8px 16px', 
              border: '1px solid hsl(var(--border-primary))', 
              borderRadius: '6px',
              background: 'hsl(var(--surface-secondary))',
              color: 'hsl(var(--text-primary))',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary wii-button" 
            onClick={() => {
              // The save functionality is handled within SoundManagementContent
              handleClose();
            }}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '6px',
              background: 'hsl(var(--primary))',
              color: 'white',
              cursor: 'pointer',
              minWidth: '90px',
              transition: 'all 0.2s ease'
            }}
          >
            Close
          </button>
        </div>
      )}
    >
      <SoundManagementContent
        isModal={true}
        onClose={onClose}
        onSettingsChange={onSettingsChange}
        showHeader={false} // Don't show header since we have the modal title
      />
    </WBaseModal>
  );
}

SoundModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
};

export default SoundModal; 