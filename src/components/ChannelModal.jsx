import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './ChannelModal.css';
import ImageSearchModal from './ImageSearchModal';

function ChannelModal({ channelId, onClose, onSave, currentMedia, currentPath, currentType }) {
  const [media, setMedia] = useState(currentMedia);
  const [path, setPath] = useState(currentPath || '');
  const [type, setType] = useState(currentType || 'exe');
  const [title, setTitle] = useState('');
  const [pathError, setPathError] = useState('');
  const [asAdmin, setAsAdmin] = useState(false);
  const fileInputRef = useRef();
  const exeFileInputRef = useRef();
  const [showImageSearch, setShowImageSearch] = useState(false);

  const handleFileSelect = (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setMedia({ url, type: file.type, name: file.name });
    }
  };

  const handleExeFileSelect = (file) => {
    if (file) {
      // For Electron apps, we can get the file path
      if (file.path) {
        setPath(file.path);
        setPathError('');
      } else {
        // Fallback for web browsers
        setPath(file.name);
        setPathError('');
      }
    }
  };

  const handleImageSelect = (img) => {
    setMedia({ url: img.url, type: img.format === 'image' ? 'image/png' : img.format === 'gif' ? 'image/gif' : img.format === 'mp4' ? 'video/mp4' : '', name: img.name, isBuiltin: true });
    setShowImageSearch(false);
  };

  const handleUploadClick = () => {
    setShowImageSearch(false);
    setTimeout(() => fileInputRef.current?.click(), 100); // slight delay to allow modal to close
  };

  const validatePath = () => {
    if (!path.trim()) {
      setPathError('');
      return true; // Allow empty paths if media is provided
    }

    if (type === 'url') {
      // Validate URL format
      try {
        const url = new URL(path.trim());
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          setPathError('');
          return true;
        } else {
          setPathError('Please enter a valid HTTP or HTTPS URL');
          return false;
        }
      } catch {
        setPathError('Please enter a valid URL (e.g., https://example.com)');
        return false;
      }
    } else {
      // Validate executable path for Windows
      const trimmedPath = path.trim();
      
      // Check if it's a valid Windows path
      if (trimmedPath.match(/^[A-Za-z]:\\/)) {
        // Absolute path
        setPathError('');
        return true;
      } else if (trimmedPath.startsWith('\\\\')) {
        // Network path
        setPathError('');
        return true;
      } else if (trimmedPath.includes('\\') || trimmedPath.includes('/')) {
        // Relative path
        setPathError('');
        return true;
      } else {
        setPathError('Please enter a valid file path or use "Browse Files" to select an executable');
        return false;
      }
    }
  };

  const handlePathChange = (e) => {
    setPath(e.target.value);
    setPathError(''); // Clear error when user types
  };

  const handleSave = () => {
    // Validate path before saving
    if (!validatePath()) {
      return;
    }

    // Allow saving if either media or path is provided
    if (media || path.trim()) {
      onSave(channelId, {
        media,
        path: path.trim(),
        type,
        asAdmin, // <-- add this
        title: title.trim() || `Channel ${channelId}`
      });
      onClose();
    }
  };

  const handleRemoveImage = () => {
    setMedia(null);
  };

  const handleClearChannel = () => {
    onSave(channelId, null); // This will fully reset the channel in the parent
    onClose();
  };

  const canSave = (media || path.trim()) && !pathError;

  const footerContent = (
    <>
      <button className="cancel-button" onClick={onClose}>Cancel</button>
      <button className="clear-button" style={{ marginLeft: 8, border: '1.5px solid #dc3545', color: '#dc3545', background: '#fff', fontWeight: 600 }} onClick={handleClearChannel} onMouseOver={e => e.currentTarget.style.background='#ffeaea'} onMouseOut={e => e.currentTarget.style.background='#fff'}>Clear Channel</button>
      <button className="save-button" onClick={handleSave} disabled={!canSave}>Save Channel</button>
    </>
  );

  return (
    <BaseModal
      title="Configure Channel"
      onClose={onClose}
      footerContent={footerContent}
      className="channel-modal"
    >
      <div className="form-section">
        <h3>Channel Image</h3>
        <div className="image-section">
          {media ? (
            <div className="image-preview">
              {media.type.startsWith('image/') ? (
                <img src={media.url} alt="Channel preview" />
              ) : media.type.startsWith('video/') ? (
                <video src={media.url} autoPlay loop muted style={{ maxWidth: '100%', maxHeight: 120 }} />
              ) : null}
              <button className="remove-image-button" onClick={handleRemoveImage}>
                Remove
              </button>
            </div>
          ) : (
            <button className="file-button" style={{ background: '#f7fafd', color: '#222', border: '2px solid #b0c4d8', fontWeight: 500 }} onClick={() => setShowImageSearch(true)}>
              Add Channel Image
            </button>
          )}
          <input
            type="file"
            accept="image/*,video/mp4"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      {showImageSearch && (
        <ImageSearchModal
          onClose={() => setShowImageSearch(false)}
          onSelect={handleImageSelect}
          onUploadClick={handleUploadClick}
        />
      )}

      <div className="form-section">
        <h3>Channel Title (Optional)</h3>
        {/* Remove the channel title input */}
      </div>

      <div className="form-section">
        <h3>Launch Type</h3>
        <div className="type-selector">
          <label className="type-option">
            <input
              type="radio"
              name="type"
              value="exe"
              checked={type === 'exe'}
              onChange={(e) => setType(e.target.value)}
            />
            <span className="radio-custom"></span>
            Application (.exe)
          </label>
          <label className="type-option">
            <input
              type="radio"
              name="type"
              value="url"
              checked={type === 'url'}
              onChange={(e) => setType(e.target.value)}
            />
            <span className="radio-custom"></span>
            Website (URL)
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>{type === 'exe' ? 'Application Path' : 'Website URL'}</h3>
        
        {type === 'exe' ? (
          <>
            <div className="path-input-group">
              <input
                type="text"
                placeholder="C:\Path\To\Application.exe or paste path here"
                value={path}
                onChange={handlePathChange}
                className={`text-input ${pathError ? 'error' : ''}`}
              />
              <button 
                className="file-picker-button"
                onClick={() => exeFileInputRef.current?.click()}
              >
                Browse Files
              </button>
              <input
                type="file"
                accept=".exe,.bat,.cmd,.com,.pif,.scr,.vbs,.js,.msi"
                ref={exeFileInputRef}
                onChange={(e) => handleExeFileSelect(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', gap: '1.5em', alignItems: 'center', fontSize: '1em' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`admin-mode-${channelId}`}
                    checked={!asAdmin}
                    onChange={() => setAsAdmin(false)}
                  />
                  Normal Launch
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`admin-mode-${channelId}`}
                    checked={asAdmin}
                    onChange={() => setAsAdmin(true)}
                  />
                  Run as Administrator
                </label>
              </div>
            </div>
          </>
        ) : (
          <input
            type="text"
            placeholder="https://example.com"
            value={path}
            onChange={handlePathChange}
            className={`text-input ${pathError ? 'error' : ''}`}
          />
        )}
        
        {pathError && (
          <p className="error-text">{pathError}</p>
        )}
        
        <p className="help-text">
          {type === 'exe' 
            ? (<><span>I suggest searching the app in your search bar, right click it - open file location - right click the file and click properties - copy and paste what is in the Target field </span><br /><span style={{fontSize:'0.95em',color:'#888'}}>Example: C:\Users\ahoin\AppData\Local\Discord\Update.exe --processStart Discord.exe</span></>)
            : 'Enter the complete URL including https://'
          }
        </p>
      </div>
    </BaseModal>
  );
}

ChannelModal.propTypes = {
  channelId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  currentMedia: PropTypes.object,
  currentPath: PropTypes.string,
  currentType: PropTypes.string,
};

export default ChannelModal; 