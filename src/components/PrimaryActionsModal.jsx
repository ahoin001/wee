import React, { useState, useRef, useEffect } from 'react';
import BaseModal from './BaseModal';

function PrimaryActionsModal({ isOpen, onClose, onSave, config, buttonIndex, preavailableIcons = [] }) {
  const [type, setType] = useState(config?.type || 'text');
  const [text, setText] = useState(config?.text || (buttonIndex === 0 ? 'Wii' : ''));
  const [icon, setIcon] = useState(config?.icon || null);
  const [actionType, setActionType] = useState(config?.actionType || 'none');
  const [action, setAction] = useState(config?.action || '');
  const [pathError, setPathError] = useState('');
  const [savedIcons, setSavedIcons] = useState([]);
  const [loadingIcons, setLoadingIcons] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const exeFileInputRef = useRef(null);

  // Fetch saved icons on open
  useEffect(() => {
    if (isOpen && window.api?.icons?.list) {
      refreshSavedIcons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (savedIcons && savedIcons.length > 0) {
      console.log('Saved icons:', savedIcons);
      savedIcons.forEach(icon => console.log('Icon URL:', icon.url));
    }
  }, [savedIcons]);

  const refreshSavedIcons = () => {
    if (window.api?.icons?.list) {
      setLoadingIcons(true);
      window.api.icons.list().then(res => {
        if (res && res.success) setSavedIcons(res.icons);
        setLoadingIcons(false);
      });
    }
  };

  // Upload and save icon immediately
  const handleUploadIcon = async () => {
    setUploadError('');
    if (!window.api?.selectIconFile) {
      setUploadError('Icon file picker is not available.');
      return;
    }
    setUploading(true);
    try {
      const fileResult = await window.api.selectIconFile();
      if (!fileResult.success) {
        setUploadError(fileResult.error || 'File selection cancelled.');
        setUploading(false);
        return;
      }
      const file = fileResult.file;
      const addResult = await window.api.icons.add({ filePath: file.path, filename: file.name });
      if (!addResult.success) {
        setUploadError(addResult.error || 'Failed to add icon.');
        setUploading(false);
        return;
      }
      setIcon(addResult.icon.url);
      refreshSavedIcons();
    } catch (err) {
      setUploadError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSavedIcon = (iconUrl) => {
    if (window.api?.icons?.delete) {
      window.api.icons.delete(iconUrl).then(res => {
        if (res && res.success) {
          if (icon === iconUrl) setIcon(null);
          refreshSavedIcons();
        } else {
          setUploadError('Failed to delete icon: ' + (res?.error || 'Unknown error'));
        }
      });
    }
  };

  const handleExeFileSelect = (file) => {
    if (file && file.path) {
      setAction(file.path);
      setPathError('');
    }
  };

  const validatePath = () => {
    if (!action.trim()) {
      setPathError('');
      return true;
    }
    if (actionType === 'url') {
      // Validate URL format
      try {
        const url = new URL(action.trim());
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
    } else if (actionType === 'exe') {
      // Accept any path that contains .exe (case-insensitive), even with arguments or spaces
      const trimmedPath = action.trim();
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
    setPathError('');
    return true;
  };

  const handleSave = () => {
    if (!validatePath()) return;
    onSave({
      type,
      text: type === 'text' ? text : '',
      icon: type === 'icon' ? icon : null,
      actionType,
      action,
    });
  };

  // --- Section Renderers ---
  function renderIconSection() {
    return (
      <>
        <div style={{ display: 'flex', gap: 18, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="radio" name="type" value="text" checked={type === 'text'} onChange={() => setType('text')} />
            Text
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="radio" name="type" value="icon" checked={type === 'icon'} onChange={() => setType('icon')} />
            Icon (PNG)
          </label>
        </div>
        {type === 'text' ? (
          <input
            type="text"
            className="text-input"
            placeholder="Button text"
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={16}
            style={{ width: '100%', marginBottom: 12 }}
          />
        ) : (
          <>
            {/* Upload New Icon Button */}
            <button
              className="file-button"
              style={{ marginBottom: 18, fontWeight: 500, padding: '8px 18px', fontSize: 15, background: uploading ? '#bbb' : '#0099ff', color: '#fff', cursor: uploading ? 'not-allowed' : 'pointer' }}
              onClick={handleUploadIcon}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload New Icon'}
            </button>
            {uploadError && (
              <div style={{ color: '#dc3545', fontSize: 13, marginBottom: 6 }}>{uploadError}</div>
            )}
            {/* Saved Icons Section */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 500, marginBottom: 6 }}>Your saved icons:</div>
              {loadingIcons ? (
                <div style={{ color: '#888', marginBottom: 10 }}>Loading saved icons...</div>
              ) : savedIcons.length > 0 ? (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {savedIcons.map((i, idx) => (
                    <div key={i.url} style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        type="button"
                        style={{
                          border: icon === i.url ? '2.5px solid #0099ff' : '1.5px solid #ccc',
                          borderRadius: 8,
                          padding: 0,
                          background: icon === i.url ? '#e6f7ff' : '#fff',
                          boxShadow: icon === i.url ? '0 0 0 2px #b0e0ff' : '0 1px 4px #0001',
                          outline: 'none',
                          cursor: 'pointer',
                          width: 44,
                          height: 44,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'border 0.18s, box-shadow 0.18s',
                        }}
                        aria-label={`Select saved icon ${idx + 1}`}
                        onClick={() => setIcon(i.url)}
                      >
                        <img src={i.url} alt={i.name} style={{ maxHeight: 32, maxWidth: 32, borderRadius: 6 }} />
                      </button>
                      <button
                        type="button"
                        title="Delete icon"
                        className="icon-delete-btn"
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          background: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: 22,
                          height: 22,
                          fontSize: 15,
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
                        onClick={() => handleDeleteSavedIcon(i.url)}
                        aria-label="Delete icon"
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,76,76,0.13)'; e.currentTarget.style.color = '#dc3545'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#dc3545'; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="10" fill="#ffeaea"/>
                          <path d="M7.5 10.5L10 8m0 0l2.5 2.5M10 8v4" stroke="#dc3545" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <rect x="6.5" y="6.5" width="7" height="7" rx="1.5" stroke="#dc3545" strokeWidth="1.2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#888', marginBottom: 10 }}>No saved icons yet.</div>
              )}
            </div>
          </>
        )}
      </>
    );
  }

  function renderAppPathSection() {
    return (
      <>
        <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="radio" name="actionType" value="none" checked={actionType === 'none'} onChange={() => setActionType('none')} />
            None
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="radio" name="actionType" value="exe" checked={actionType === 'exe'} onChange={() => setActionType('exe')} />
            Application (.exe)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="radio" name="actionType" value="url" checked={actionType === 'url'} onChange={() => setActionType('url')} />
            Website (URL)
          </label>
        </div>
        {actionType !== 'none' && (
          <div className="path-input-group">
            <input
              type="text"
              placeholder={actionType === 'exe' ? 'C:\\Path\\To\\Application.exe or paste path here' : 'https://example.com'}
              value={action}
              onChange={e => { setAction(e.target.value); setPathError(''); }}
              className={`text-input ${pathError ? 'error' : ''}`}
              style={{ flex: 1 }}
            />
            {actionType === 'exe' && (
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
                        setAction(newPath);
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
        )}
        {pathError && <p className="error-text">{pathError}</p>}
        {actionType !== 'none' && (
          <p className="help-text" style={{ marginTop: 6, color: '#888', fontSize: 14 }}>
            {actionType === 'exe'
              ? (<><span>I suggest searching the app in your search bar, right click it - open file location - right click the file and click properties - copy and paste what is in the Target field.</span><br /><span style={{ fontSize: '0.95em', color: '#888' }}>Example: C:\Users\ahoin\AppData\Local\Discord\Update.exe --processStart Discord.exe</span></>)
              : 'Enter the complete URL including https://'}
          </p>
        )}
      </>
    );
  }

  function renderDisplayOptionsSection() {
    return (
      <>
        <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={type === 'text'} onChange={() => setType('text')} />
            Show Text
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={type === 'icon'} onChange={() => setType('icon')} />
            Show Icon
          </label>
        </div>
      </>
    );
  }

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Primary Actions"
      onClose={onClose}
      maxWidth="480px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={() => { if (validatePath()) { onSave({ type, text: type === 'text' ? text : '', icon: type === 'icon' ? icon : null, actionType, action }); handleClose(); } }} style={{ minWidth: 90 }}>Save</button>
        </div>
      )}
    >
      {/* Icon Selection/Upload Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Channel Icon</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose or upload a custom icon for this channel. PNG recommended for best results.
          <div style={{ marginTop: 14 }}>
            {/* Icon selection/upload UI here */}
            {renderIconSection && renderIconSection()}
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
            {/* App path/URL input UI here */}
            {renderAppPathSection && renderAppPathSection()}
          </div>
        </div>
      </div>
      {/* Text/Icon Display Options Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Display Options</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose whether to display text, an icon, or both on the channel button.
          <div style={{ marginTop: 14 }}>
            {/* Text/icon display options UI here */}
            {renderDisplayOptionsSection && renderDisplayOptionsSection()}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default PrimaryActionsModal; 