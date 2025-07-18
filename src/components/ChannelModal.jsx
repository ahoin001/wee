import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './ChannelModal.css';
import ImageSearchModal from './ImageSearchModal';

const channelsApi = window.api?.channels;

function ChannelModal({ channelId, onClose, onSave, currentMedia, currentPath, currentType, currentHoverSound, currentAsAdmin, currentAnimatedOnHover }) {
  const [media, setMedia] = useState(currentMedia);
  const [path, setPath] = useState(currentPath || '');
  const [type, setType] = useState(currentType || 'exe');
  const [pathError, setPathError] = useState('');
  const [asAdmin, setAsAdmin] = useState(currentAsAdmin);
  const fileInputRef = useRef();
  const exeFileInputRef = useRef();
  const [showImageSearch, setShowImageSearch] = useState(false);
  // Hover sound state
  const [hoverSound, setHoverSound] = useState(currentHoverSound || null);
  const hoverSoundInputRef = useRef();
  const [hoverSoundName, setHoverSoundName] = useState(hoverSound ? hoverSound.name : '');
  const [hoverSoundUrl, setHoverSoundUrl] = useState(hoverSound ? hoverSound.url : '');
  const [hoverSoundVolume, setHoverSoundVolume] = useState(hoverSound ? hoverSound.volume : 0.7);
  const [hoverSoundEnabled, setHoverSoundEnabled] = useState(!!hoverSound);
  const [hoverSoundAudio, setHoverSoundAudio] = useState(null);
  const [showError, setShowError] = useState(false);
  const [animatedOnHover, setAnimatedOnHover] = useState(currentAnimatedOnHover);

  // When type changes, clear the path
  useEffect(() => {
    setPath('');
  }, [type]);

  // Load channel data on mount
  useEffect(() => {
    async function loadChannel() {
      const data = await channelsApi?.get();
      if (data && data[channelId]) {
        setMedia(data[channelId].media);
        setPath(data[channelId].path);
        setType(data[channelId].type);
        setAsAdmin(data[channelId].asAdmin);
        setHoverSound(data[channelId].hoverSound);
        setAnimatedOnHover(data[channelId].animatedOnHover);
      }
    }
    loadChannel();
  }, [channelId]);

  // Handle hover sound file select
  const handleHoverSoundFile = async (file) => {
    if (file) {
      // Persistently store the file using the new API
      if (file.path) {
        const result = await window.api.channels.copyHoverSound({ filePath: file.path, filename: file.name });
        if (result.success) {
          setHoverSound({ url: result.url, name: file.name, volume: hoverSoundVolume });
          setHoverSoundName(file.name);
          setHoverSoundUrl(result.url);
          setHoverSoundEnabled(true);
        } else {
          alert('Failed to save hover sound: ' + result.error);
        }
      } else {
        // Fallback for browsers: use session URL (not persistent)
        const url = URL.createObjectURL(file);
        setHoverSound({ url, name: file.name, volume: hoverSoundVolume });
        setHoverSoundName(file.name);
        setHoverSoundUrl(url);
        setHoverSoundEnabled(true);
      }
    }
  };
  // Play hover sound (fade in)
  const handleTestHoverSound = async () => {
    if (hoverSoundUrl) {
      let realUrl = hoverSoundUrl;
      if (realUrl.startsWith('userdata://') && window.api?.resolveUserdataUrl) {
        realUrl = await window.api.resolveUserdataUrl(realUrl);
      }
      const audio = new Audio(realUrl);
      audio.volume = 0;
      audio.loop = true;
      audio.play();
      setHoverSoundAudio(audio);
      // Fade in
      let v = 0;
      const fade = setInterval(() => {
        v += 0.07;
        if (audio.volume < hoverSoundVolume) {
          audio.volume = Math.min(v, hoverSoundVolume);
        } else {
          clearInterval(fade);
        }
      }, 40);
    }
  };
  // Stop hover sound (fade out)
  const handleStopHoverSound = () => {
    if (hoverSoundAudio) {
      const audio = hoverSoundAudio;
      let v = audio.volume;
      const fade = setInterval(() => {
        v -= 0.07;
        if (v > 0) {
          audio.volume = Math.max(v, 0);
        } else {
          clearInterval(fade);
          audio.pause();
          setHoverSoundAudio(null);
        }
      }, 40);
    }
  };

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
      // Accept any path that contains .exe (case-insensitive), even with arguments or spaces
      const trimmedPath = path.trim();
      if (/\.exe(\s+.*)?$/i.test(trimmedPath) || /\.exe/i.test(trimmedPath)) {
        setPathError('');
        return true;
      } else if (trimmedPath.startsWith('\\')) {
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

  // On save, use channelsApi.set and reload state
  const handleSave = async () => {
    // Validate path before saving
    if (!validatePath() || !media || !path.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    // Only save if both media and path are provided
    const newChannel = {
        media,
        path: path.trim(),
        type,
      asAdmin,
      hoverSound: hoverSoundEnabled && hoverSoundUrl ? { url: hoverSoundUrl, name: hoverSoundName, volume: hoverSoundVolume } : null,
      animatedOnHover: animatedOnHover !== 'global' ? animatedOnHover : undefined,
    };
    // Save to channels API
    const allChannels = await window.api?.channels?.get();
    const updatedChannels = { ...allChannels, [channelId]: newChannel };
    await window.api?.channels?.set(updatedChannels);
    if (onSave) onSave(channelId, newChannel);
      onClose();
  };

  const handleRemoveImage = () => {
    setMedia(null);
  };

  const handleClearChannel = async () => {
    const allChannels = await channelsApi?.get();
    const updatedChannels = { ...allChannels };
    delete updatedChannels[channelId];
    await channelsApi?.set(updatedChannels);
    onClose();
  };

  const canSave = media && path.trim() && !pathError;
  let saveTooltip = '';
  if (!media && !path.trim()) {
    saveTooltip = 'Please select a channel image and provide a launch path or URL.';
  } else if (!media) {
    saveTooltip = 'Please select a channel image.';
  } else if (!path.trim()) {
    saveTooltip = 'Please provide a launch path or URL.';
  } else if (pathError) {
    saveTooltip = pathError;
  }

  const footerContent = (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
      <button className="cancel-button" onClick={onClose}>Cancel</button>
        <button className="clear-button" style={{ border: '1.5px solid #dc3545', color: '#dc3545', background: '#fff', fontWeight: 600 }} onClick={handleClearChannel} onMouseOver={e => e.currentTarget.style.background='#ffeaea'} onMouseOut={e => e.currentTarget.style.background='#fff'}>Clear Channel</button>
        <button className="save-button" onClick={handleSave} title={saveTooltip}>Save Channel</button>
      </div>
      {showError && saveTooltip && (
        <div style={{ color: '#dc3545', fontSize: 13, marginTop: 8, fontWeight: 500 }}>{saveTooltip}</div>
      )}
    </>
  );

  const renderImageSection = () => (
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
  );

  const renderAppPathSection = () => (
    <>
      <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="radio"
            name={`launch-type-${channelId}`}
            value="exe"
            checked={type === 'exe'}
            onChange={() => setType('exe')}
          />
          Application (.exe)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="radio"
            name={`launch-type-${channelId}`}
            value="url"
            checked={type === 'url'}
            onChange={() => setType('url')}
          />
          Website (URL)
        </label>
      </div>
      <div className="path-input-group">
        <input
          type="text"
          placeholder={type === 'exe' ? 'C:\\Path\\To\\Application.exe or paste path here' : 'https://example.com'}
          value={path}
          onChange={handlePathChange}
          className={`text-input ${pathError ? 'error' : ''}`}
        />
        {type === 'exe' && (
          <>
            <button
              className="file-picker-button"
              onClick={async () => {
                console.log('Browse Files clicked');
                if (window.api && window.api.selectExeOrShortcutFile) {
                  console.log('Using IPC handler for file selection');
                  const result = await window.api.selectExeOrShortcutFile();
                  console.log('IPC result:', result);
                  if (result && result.success && result.file) {
                    let newPath = result.file.path;
                    if (result.file.args && result.file.args.trim()) {
                      newPath += ' ' + result.file.args.trim();
                    }
                    console.log('Setting path to:', newPath);
                    setPath(newPath);
                    setPathError('');
                  } else if (result && result.error) {
                    console.log('IPC error:', result.error);
                    setPathError(result.error);
                  }
                } else {
                  console.log('Falling back to file input');
                  exeFileInputRef.current?.click();
                }
              }}
            >
              Browse Files
            </button>
            <input
              type="file"
              accept=".exe,.bat,.cmd,.com,.pif,.scr,.vbs,.js,.msi,.lnk"
              ref={exeFileInputRef}
              onChange={(e) => handleExeFileSelect(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </>
        )}
      </div>
      {pathError && <p className="error-text">{pathError}</p>}
      <p className="help-text" style={{ marginTop: 6, color: '#888', fontSize: 14 }}>
        {type === 'exe'
          ? (<><span>I suggest searching the app in your search bar, right click it - open file location - right click the file and click properties - copy and paste what is in the Target field.</span><br /><span style={{ fontSize: '0.95em', color: '#888' }}>Example: C:\Users\ahoin\AppData\Local\Discord\Update.exe --processStart Discord.exe</span></>)
          : 'Enter the complete URL including https://'}
      </p>
    </>
  );

  const renderDisplayOptionsSection = () => (
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
  );

  const renderHoverSoundSection = () => (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          className="file-button"
          style={{ minWidth: 120 }}
          onClick={() => hoverSoundInputRef.current?.click()}
        >
          {hoverSoundName || 'Select Audio File'}
        </button>
        <input
          type="file"
          accept="audio/*"
          ref={hoverSoundInputRef}
          onChange={e => handleHoverSoundFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <button
          className="test-button"
          style={{ minWidth: 60 }}
          onMouseDown={handleTestHoverSound}
          onMouseUp={handleStopHoverSound}
          onMouseLeave={handleStopHoverSound}
          disabled={!hoverSoundUrl}
        >
          Test
        </button>
        <label style={{ fontWeight: 500, marginLeft: 10 }}>
          Volume:
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={hoverSoundVolume}
            onChange={e => setHoverSoundVolume(parseFloat(e.target.value))}
            style={{ marginLeft: 8, verticalAlign: 'middle' }}
          />
          {` ${Math.round(hoverSoundVolume * 100)}%`}
        </label>
      </div>
      <span style={{ color: '#888', fontSize: 13 }}>Sound will fade in on hover, and fade out on leave or click.</span>
    </>
  );

  const renderAnimationToggleSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="radio"
          name="animatedOnHover"
          value="global"
          checked={animatedOnHover === undefined || animatedOnHover === 'global'}
          onChange={() => setAnimatedOnHover('global')}
        />
        Use global setting
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="radio"
          name="animatedOnHover"
          value="true"
          checked={animatedOnHover === true}
          onChange={() => setAnimatedOnHover(true)}
        />
        Only play animation on hover (override)
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="radio"
          name="animatedOnHover"
          value="false"
          checked={animatedOnHover === false}
          onChange={() => setAnimatedOnHover(false)}
        />
        Always play animation (override)
      </label>
    </div>
  );

  return (
    <>
      <BaseModal
        title="Configure Channel"
        onClose={onClose}
        maxWidth="700px"
        footerContent={footerContent}
      >
        {/* Channel Image Selection/Upload Card */}
        <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="wee-card-header">
            <span className="wee-card-title">Channel Image</span>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            Choose or upload an image, GIF, or MP4 for this channel.
            <div style={{ marginTop: 14 }}>
              {renderImageSection && renderImageSection()}
            </div>
          </div>
        </div>
        {/* App Path/URL Card */}
        <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="wee-card-header">
            <span className="wee-card-title">App Path or URL</span>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            Set the path to an app or a URL to launch when this channel is clicked.
            <div style={{ marginTop: 14 }}>
              {renderAppPathSection && renderAppPathSection()}
            </div>
          </div>
        </div>
        {/* Display Options Card */}
        <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="wee-card-header">
            <span className="wee-card-title">Display Options</span>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            Choose how this channel appears on the home screen.
            <div style={{ marginTop: 14 }}>
              {renderDisplayOptionsSection && renderDisplayOptionsSection()}
            </div>
          </div>
        </div>
        {/* Hover Sound Card */}
        <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="wee-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="wee-card-title">Custom Hover Sound</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={hoverSoundEnabled}
                onChange={e => setHoverSoundEnabled(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            {hoverSoundEnabled && (
              <div style={{ marginTop: 0 }}>
                {renderHoverSoundSection && renderHoverSoundSection()}
              </div>
            )}
            {!hoverSoundEnabled && <span style={{ color: '#888' }}>Set a custom sound to play when hovering over this channel.</span>}
          </div>
        </div>
        {/* Per-Channel Animation Toggle Card */}
        <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="wee-card-header">
            <span className="wee-card-title">Animation on Hover</span>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            Override the global setting for this channel. Only play GIFs/MP4s when hovered if enabled.
            <div style={{ marginTop: 14 }}>
              {renderAnimationToggleSection && renderAnimationToggleSection()}
            </div>
          </div>
        </div>
      </BaseModal>
      {showImageSearch && (
        <ImageSearchModal
          onClose={() => setShowImageSearch(false)}
          onSelect={handleImageSelect}
          onUploadClick={handleUploadClick}
        />
      )}
    </>
  );
}

ChannelModal.propTypes = {
  channelId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  currentMedia: PropTypes.object,
  currentPath: PropTypes.string,
  currentType: PropTypes.string,
  currentHoverSound: PropTypes.object,
  currentAsAdmin: PropTypes.bool,
  currentAnimatedOnHover: PropTypes.oneOf([true, false, 'global']),
};

export default ChannelModal; 