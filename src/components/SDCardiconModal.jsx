import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Button from '../ui/WButton';
import Card from '../ui/Card';
import { useDockState, useIconState } from '../utils/useConsolidatedAppHooks';

import './SoundModal.css';

const SdCardIconModal = React.memo(({ isOpen, onClose, onSettingsChange, sdCardIcon }) => {
  const [selectedIcon, setSelectedIcon] = useState(sdCardIcon || 'default');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Use dock state for SD card icon
  const { dock } = useDockState();
  
  // Use icon state from consolidated store
  const { icons, iconManager } = useIconState();
  const { savedIcons, loading: iconsLoading, error: iconsError, uploading: iconsUploading, uploadError: iconsUploadError } = icons;
  const { fetchIcons, uploadIcon, deleteIcon, clearIconError } = iconManager;

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
  const handleUploadIcon = useCallback(async () => {
    const result = await uploadIcon();
    if (result.success) {
      setSelectedIcon(result.icon.url);
      setMessage({ type: 'success', text: 'Icon uploaded successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to upload icon' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  }, [uploadIcon]);

  const handleDeleteSavedIcon = useCallback(async (iconUrl) => {
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
  }, [deleteIcon, selectedIcon]);

  const handleSave = useCallback(() => {
    if (onSettingsChange) {
      // Ensure we save 'default' for the default icon, not a URL
      const iconToSave = selectedIcon === 'default' ? 'default' : selectedIcon;
      onSettingsChange({ sdCardIcon: iconToSave });
    }
    onClose();
  }, [onSettingsChange, selectedIcon, onClose]);

  const handleResetToDefault = useCallback(() => {
    setSelectedIcon('default');
  }, []);

  if (!isOpen) return null;

  return (
    <WBaseModal
      title="Customize SD Card Icon"
      onClose={onClose}
      maxWidth="800px"
      footerContent={({ handleClose }) => (
        <div className="flex justify-between items-center">
          <button 
            className="px-4 py-2 rounded-md border-2 border-blue-500 bg-transparent text-blue-500 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-500 hover:text-white" 
            onClick={handleResetToDefault}
          >
            Reset to Default
          </button>
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    >
      {/* Message Display */}
      {message.text && (
        <div 
          className={`p-3 rounded-md mb-4 text-sm font-medium ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Default SD Card Icon */}
      <Card
        title="Default SD Card Icon"
        separator
        desc="The classic Wii SD card icon that appears by default."
        className="mt-4.5 mb-0"
      >
        <div className="mt-3.5">
          <button
            type="button"
            className={`border rounded-lg p-3 outline-none cursor-pointer transition-all duration-200 flex items-center gap-2 ${
              selectedIcon === 'default' 
                ? 'border-2.5 border-blue-500 bg-blue-50 shadow-[0_0_0_2px_#b0e0ff]' 
                : 'border-[1.5px] border-gray-300 bg-white shadow-sm'
            }`}
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
            <span className="font-medium">Default SD Card</span>
          </button>
        </div>
      </Card>

      {/* Upload New Icon */}
      <Card
        title="Upload Custom Icon"
        separator
        desc="Upload your own custom icon to replace the default SD card icon."
        className="mt-4.5 mb-0"
      >
        <div className="mt-3.5">
          <button
            className={`mb-4.5 font-medium py-2 px-4.5 text-sm border-none rounded-md transition-colors duration-200 ${
              iconsUploading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600'
            }`}
            onClick={handleUploadIcon}
            disabled={iconsUploading}
          >
            {iconsUploading ? 'Uploading...' : 'Upload New Icon'}
          </button>
          {iconsUploadError && (
            <div className="text-red-600 text-xs mb-1.5">{iconsUploadError}</div>
          )}
        </div>
      </Card>

      {/* Saved Icons */}
      <Card
        title="Your Saved Icons"
        separator
        desc="Choose from your previously uploaded icons."
        className="mt-4.5 mb-0"
      >
        {iconsLoading ? (
          <div className="text-gray-500 mt-3.5">Loading saved icons...</div>
        ) : savedIcons.length > 0 ? (
          <div className="mt-3.5">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
              {savedIcons.map((icon, idx) => (
                <div key={icon.url} className="relative inline-block">
                  <button
                    type="button"
                    className={`border rounded-lg p-2 outline-none cursor-pointer w-full h-20 flex items-center justify-center transition-all duration-200 flex-col gap-1 ${
                      selectedIcon === icon.url 
                        ? 'border-2.5 border-blue-500 bg-blue-50 shadow-[0_0_0_2px_#b0e0ff]' 
                        : 'border-[1.5px] border-gray-300 bg-white shadow-sm'
                    }`}
                    aria-label={`Select saved icon ${idx + 1}`}
                    onClick={() => setSelectedIcon(icon.url)}
                  >
                    <img 
                      src={icon.url} 
                      alt={icon.name} 
                      className="max-h-12 max-w-12 rounded object-contain" 
                    />
                    <div className="text-xs text-gray-500 text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                      {icon.name}
                    </div>
                  </button>
                  <button
                    type="button"
                    title="Delete icon"
                    className="absolute -top-1.5 -right-1.5 bg-white border-none rounded-full w-5 h-5 text-xs font-bold cursor-pointer z-10 shadow-sm flex items-center justify-center text-red-600 transition-colors duration-200 hover:bg-red-50"
                    onClick={() => handleDeleteSavedIcon(icon.url)}
                    aria-label="Delete icon"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 mt-3.5">No saved icons yet. Upload an icon to get started!</div>
        )}
      </Card>
    </WBaseModal>
  );
});

SdCardIconModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
  sdCardIcon: PropTypes.string,
};

export default SdCardIconModal; 