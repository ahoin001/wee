import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import Button from '../ui/Button';
import useIconsStore from '../utils/useIconsStore';
import './BaseModal.css';
import './SoundModal.css';

function SdCardIconModal({ isOpen, onClose, onSettingsChange, sdCardIcon }) {
  const [selectedIcon, setSelectedIcon] = useState(sdCardIcon || 'default');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Icons store
  const {
    savedIcons,
    loading: iconsLoading,
    error: iconsError,
    uploading: iconsUploading,
    uploadError: iconsUploadError,
    fetchIcons,
    uploadIcon,
    deleteIcon,
    clearError: clearIconsError
  } = useIconsStore();

  // Fetch saved icons on open
  useEffect(() => {
    if (isOpen) {
      fetchIcons();
    }
  }, [isOpen, fetchIcons]);

  // Update selected icon when prop changes
  useEffect(() => {
    if (isOpen && sdCardIcon) {
      setSelectedIcon(sdCardIcon);
    }
  }, [isOpen, sdCardIcon]);

  // Upload and save icon immediately
  const handleUploadIcon = async () => {
    const result = await uploadIcon();
    if (result.success) {
      setSelectedIcon(result.icon.url);
      setMessage({ type: 'success', text: 'Icon uploaded successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to upload icon' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleDeleteSavedIcon = async (iconUrl) => {
    const result = await deleteIcon(iconUrl);
    if (result.success && selectedIcon === iconUrl) {
      setSelectedIcon('default');
      setMessage({ type: 'success', text: 'Icon deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else if (result.success) {
      setMessage({ type: 'success', text: 'Icon deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete icon' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleSave = () => {
    if (onSettingsChange) {
      onSettingsChange({ sdCardIcon: selectedIcon });
    }
    onClose();
  };

  const handleResetToDefault = () => {
    setSelectedIcon('default');
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Customize SD Card Icon"
      onClose={onClose}
      maxWidth="600px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            className="reset-button" 
            onClick={handleResetToDefault}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '2px solid #0099ff',
              background: 'transparent',
              color: '#0099ff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#0099ff';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#0099ff';
            }}
          >
            Reset to Default
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    >
      {/* Message Display */}
      {message.text && (
        <div 
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: '500',
            background: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}
        >
          {message.text}
        </div>
      )}

      {/* Default SD Card Icon */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Default SD Card Icon</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          The classic Wii SD card icon that appears by default.
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              style={{
                border: selectedIcon === 'default' ? '2.5px solid #0099ff' : '1.5px solid #ccc',
                borderRadius: 8,
                padding: 12,
                background: selectedIcon === 'default' ? '#e6f7ff' : '#fff',
                boxShadow: selectedIcon === 'default' ? '0 0 0 2px #b0e0ff' : '0 1px 4px #0001',
                outline: 'none',
                cursor: 'pointer',
                transition: 'border 0.18s, box-shadow 0.18s',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onClick={() => setSelectedIcon('default')}
            >
              <svg width="32" height="32" viewBox="0 0 147 198" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 12C0 5.37258 5.37258 0 12 0H116.327C119.629 0 122.785 1.36025 125.052 3.76052L143.724 23.5315C145.828 25.759 147 28.707 147 31.7709V186C147 192.627 141.627 198 135 198H12C5.37259 198 0 192.627 0 186V12Z" fill="#B9E1F2"/>
                <path d="M0 186V12C1.93277e-07 5.37258 5.37258 4.83208e-08 12 0H116.327C119.629 0 122.785 1.36048 125.052 3.76074L143.725 23.5312C145.828 25.7587 147 28.7067 147 31.7705V186C147 192.627 141.627 198 135 198V191C137.761 191 140 188.761 140 186V31.7705C140 30.494 139.511 29.2659 138.635 28.3379L119.963 8.56641C119.018 7.56633 117.703 7 116.327 7H12C9.23858 7 7 9.23858 7 12V186C7 188.761 9.23858 191 12 191V198C5.47609 198 0.168106 192.794 0.00390625 186.31L0 186ZM135 191V198H12V191H135Z" fill="#33BEED"/>
                <path d="M19 36C19 34.3431 20.3431 33 22 33H124C125.657 33 127 34.3431 127 36V149C127 150.657 125.657 152 124 152H22C20.3431 152 19 150.657 19 149V36Z" fill="white"/>
                <path d="M124 149V152H22V149H124ZM124 36H22V152C20.3949 152 19.0842 150.739 19.0039 149.154L19 149V36C19 34.3431 20.3431 33 22 33H124L124.154 33.0039C125.739 33.0842 127 34.3949 127 36V149C127 150.605 125.739 151.916 124.154 151.996L124 152V36Z" fill="#F4F0EE"/>
                <path d="M19 160C19 158.343 20.3431 157 22 157H124C125.657 157 127 158.343 127 160V178C127 179.657 125.657 181 124 181H22C20.3431 181 19 179.657 19 178V160Z" fill="#31BEED"/>
                <path d="M23 109L26 99H47.5C51.5 99 51.0818 96.3852 48 96C43 95.375 38.711 93.0944 36.5 91.5C34 89.6972 32.5 87.5 32.5 85C32.5 82.5 36.9 77 48.5 77H73.5L71.5 83H47.5C44 83 43 85 46.5 86.5C50 88 67 92 67 100C67 106.4 60 108.667 56.5 109H23Z" fill="#33BEED"/>
                <path d="M71 108.5L75 96.5C92.5 95.5 93.5 92.5 95 91.5C96.2 90.7 95.8333 88.1667 95.5 87L114 82C116.667 83.8333 122 88 122 90C122 92.5 122.5 98.5 106 104.5C92.8 109.3 77.1667 109.167 71 108.5Z" fill="#33BEED"/>
                <path d="M110.5 80C105.781 81.5909 99.7536 84.0159 95 85.5C94.8651 85.1501 93.6349 84.3499 93.5 84C97.6595 82.0753 101.341 79.9226 105.5 78L110.5 80Z" fill="#33BEED"/>
                <path d="M98 77L89.5 83.5L78 82.5L82 77H98Z" fill="#33BEED"/>
              </svg>
              <span style={{ fontWeight: '500' }}>Default SD Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload New Icon */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Upload Custom Icon</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Upload your own custom icon to replace the default SD card icon.
          <div style={{ marginTop: 14 }}>
            <button
              className="file-button"
              style={{ 
                marginBottom: 18, 
                fontWeight: 500, 
                padding: '8px 18px', 
                fontSize: 15, 
                background: iconsUploading ? '#bbb' : '#0099ff', 
                color: '#fff', 
                cursor: iconsUploading ? 'not-allowed' : 'pointer',
                border: 'none',
                borderRadius: '6px',
                transition: 'background 0.2s ease'
              }}
              onClick={handleUploadIcon}
              disabled={iconsUploading}
              onMouseEnter={(e) => {
                if (!iconsUploading) {
                  e.target.style.background = '#007acc';
                }
              }}
              onMouseLeave={(e) => {
                if (!iconsUploading) {
                  e.target.style.background = '#0099ff';
                }
              }}
            >
              {iconsUploading ? 'Uploading...' : 'Upload New Icon'}
            </button>
            {iconsUploadError && (
              <div style={{ color: '#dc3545', fontSize: 13, marginBottom: 6 }}>{iconsUploadError}</div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Icons */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Your Saved Icons</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose from your previously uploaded icons.
          {iconsLoading ? (
            <div style={{ color: '#888', marginTop: 14 }}>Loading saved icons...</div>
          ) : savedIcons.length > 0 ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                {savedIcons.map((icon, idx) => (
                  <div key={icon.url} style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      type="button"
                      style={{
                        border: selectedIcon === icon.url ? '2.5px solid #0099ff' : '1.5px solid #ccc',
                        borderRadius: 8,
                        padding: 8,
                        background: selectedIcon === icon.url ? '#e6f7ff' : '#fff',
                        boxShadow: selectedIcon === icon.url ? '0 0 0 2px #b0e0ff' : '0 1px 4px #0001',
                        outline: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'border 0.18s, box-shadow 0.18s',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                      aria-label={`Select saved icon ${idx + 1}`}
                      onClick={() => setSelectedIcon(icon.url)}
                    >
                      <img 
                        src={icon.url} 
                        alt={icon.name} 
                        style={{ 
                          maxHeight: 48, 
                          maxWidth: 48, 
                          borderRadius: 4,
                          objectFit: 'contain'
                        }} 
                      />
                      <div style={{ 
                        fontSize: '10px', 
                        color: '#666', 
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%'
                      }}>
                        {icon.name}
                      </div>
                    </button>
                    <button
                      type="button"
                      title="Delete icon"
                      className="icon-delete-btn"
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        background: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        zIndex: 2,
                        boxShadow: '0 1px 4px #0002',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#dc3545',
                        transition: 'background 0.18s, color 0.18s',
                      }}
                      onClick={() => handleDeleteSavedIcon(icon.url)}
                      aria-label="Delete icon"
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.background = 'rgba(255,76,76,0.13)'; 
                        e.currentTarget.style.color = '#dc3545'; 
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.background = '#fff'; 
                        e.currentTarget.style.color = '#dc3545'; 
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: '#888', marginTop: 14 }}>No saved icons yet. Upload an icon to get started!</div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

SdCardIconModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
  sdCardIcon: PropTypes.string,
};

export default SdCardIconModal; 