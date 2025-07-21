import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './ChannelModal.css';
import ImageSearchModal from './ImageSearchModal';
import ResourceUsageIndicator from './ResourceUsageIndicator';
import Button from '../ui/Button';
import { loadGames, clearGamesCache, searchGames, getLastUpdated, getLastError } from '../utils/steamGames';

const channelsApi = window.api?.channels;

// Utility to deduplicate by appid
function dedupeByAppId(games) {
  const seen = new Set();
  return games.filter(g => {
    if (seen.has(g.appid)) return false;
    seen.add(g.appid);
    return true;
  });
}

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
  const [steamQuery, setSteamQuery] = useState('');
  const [steamResults, setSteamResults] = useState([]);
  const [steamDropdownOpen, setSteamDropdownOpen] = useState(false);
  const [steamLoading, setSteamLoading] = useState(false);
  const [steamError, setSteamError] = useState('');
  const [installedGames, setInstalledGames] = useState([]);

  // Load installed Steam games on first open of Steam tab
  useEffect(() => {
    if (type === 'steam') {
      setSteamLoading(true);
      setSteamError('');
      setInstalledGames([]);
      window.api.steam.getInstalledGames().then(result => {
        setSteamLoading(false);
        if (result.error) {
          setSteamError(result.error);
          setInstalledGames([]);
        } else {
          setInstalledGames(dedupeByAppId(result.games || []));
          setSteamError('');
        }
      }).catch(err => {
        setSteamLoading(false);
        setSteamError(err.message || 'Failed to scan Steam games.');
        setInstalledGames([]);
      });
    }
  }, [type]);

  // Fuzzy search as user types
  useEffect(() => {
    if (type === 'steam' && steamQuery && installedGames.length > 0) {
      const q = steamQuery.toLowerCase();
      setSteamResults(installedGames.filter(g => g.name.toLowerCase().includes(q)).slice(0, 10));
      setSteamDropdownOpen(true);
    } else {
      setSteamResults([]);
      setSteamDropdownOpen(false);
    }
  }, [steamQuery, type, installedGames]);

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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (hoverSoundAudio) {
        if (hoverSoundAudio._fadeInterval) {
          clearInterval(hoverSoundAudio._fadeInterval);
        }
        hoverSoundAudio.pause();
        hoverSoundAudio.src = '';
        hoverSoundAudio.load();
      }
    };
  }, [hoverSoundAudio]);
  // Play hover sound (fade in)
  const handleTestHoverSound = () => {
    if (hoverSoundAudio) {
      // Audio is playing → stop it
      hoverSoundAudio.pause();
      hoverSoundAudio.currentTime = 0;
      setHoverSoundAudio(null);
    } else if (hoverSoundUrl) {
      // No audio is playing → start it
      const audio = new Audio(hoverSoundUrl);
      audio.volume = hoverSoundVolume;
      audio.play().then(() => {
        console.log('[DEBUG] Audio play started');
        setHoverSoundAudio(audio);
      }).catch(e => {
        console.error('[DEBUG] Audio play error:', e);
      });
  
      audio.onended = () => {
        setHoverSoundAudio(null);
      };
    }
  };

  // Handle volume change for hover sound (live update)
  const handleHoverSoundVolumeChange = (value) => {
    setHoverSoundVolume(value);
    // Live update test audio volume if this sound is being tested
    if (hoverSoundAudio) {
      hoverSoundAudio.volume = value;
    }
  };
  
  // Stop hover sound (fade out)
  const handleStopHoverSound = () => {
    if (hoverSoundAudio) {
      const audio = hoverSoundAudio;
      
      // Clear any existing fade interval
      if (audio._fadeInterval) {
        clearInterval(audio._fadeInterval);
      }
      
      let v = audio.volume;
      const fade = setInterval(() => {
        v -= 0.07;
        if (v > 0) {
          audio.volume = Math.max(v, 0);
        } else {
          clearInterval(fade);
          audio.pause();
          audio.src = '';
          audio.load();
          setHoverSoundAudio(null);
        }
      }, 40);
      
      // Store interval reference for cleanup
      audio._fadeInterval = fade;
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
    } else if (type === 'steam') {
      // Validate Steam URI/AppID format
      if (path.trim().startsWith('steam://') || path.trim().startsWith('steam://rungameid/') || path.trim().startsWith('steam://launch/')) {
        setPathError('');
        return true;
      } else {
        setPathError('Please enter a valid Steam URI (e.g., steam://rungameid/252950) or AppID (e.g., 252950)');
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

  const handleSteamInputChange = (e) => {
    setSteamQuery(e.target.value);
    setPath(e.target.value); // keep path in sync for manual entry
    setPathError('');
  };

  const handleSteamResultClick = (game) => {
    const uri = `steam://rungameid/${game.appid}`;
    setPath(uri);
    setSteamQuery(game.name);
    setSteamDropdownOpen(false);
    setPathError('');
  };

  const handleSteamRefresh = async () => {
    setSteamLoading(true);
    setSteamError('');
    setInstalledGames([]);
    try {
      const result = await window.api.steam.getInstalledGames();
      setSteamLoading(false);
      if (result.error) {
        setSteamError(result.error);
        setInstalledGames([]);
      } else {
        setInstalledGames(dedupeByAppId(result.games || []));
        setSteamError('');
      }
    } catch (err) {
      setSteamLoading(false);
      setSteamError(err.message || 'Failed to scan Steam games.');
      setInstalledGames([]);
    }
  };

  // On save, use channelsApi.set and reload state
  const handleSave = async (handleClose) => {
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
    handleClose();
  };

  const handleRemoveImage = () => {
    setMedia(null);
  };

  const handleClearChannel = async (handleClose) => {
    // Reset all local state to empty/default values
    setMedia(null);
    setPath('');
    setType('exe');
    setPathError('');
    setAsAdmin(false);
    setHoverSound(null);
    setHoverSoundName('');
    setHoverSoundUrl('');
    setHoverSoundVolume(0.7);
    setHoverSoundEnabled(false);
    setAnimatedOnHover(undefined);
    
    // Save the cleared channel state (passing null to indicate complete reset)
    if (onSave) {
      onSave(channelId, null);
    }
    
    // Also clear from channels API
    const allChannels = await channelsApi?.get();
    const updatedChannels = { ...allChannels };
    delete updatedChannels[channelId];
    await channelsApi?.set(updatedChannels);
    
    handleClose();
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

  const footerContent = ({ handleClose }) => (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        <button className="cancel-button" onClick={handleClose}>Cancel</button>
        <button className="clear-button" style={{ border: '1.5px solid #dc3545', color: '#dc3545', background: '#fff', fontWeight: 600 }} onClick={() => handleClearChannel(handleClose)} onMouseOver={e => e.currentTarget.style.background='#ffeaea'} onMouseOut={e => e.currentTarget.style.background='#fff'}>Clear Channel</button>
        <button className="save-button" onClick={() => handleSave(handleClose)} title={saveTooltip}>Save Channel</button>
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
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="radio"
            name={`launch-type-${channelId}`}
            value="steam"
            checked={type === 'steam'}
            onChange={() => setType('steam')}
          />
          Steam Game
        </label>
      </div>
      <div className="path-input-group">
        {type === 'steam' ? (
          <div style={{ width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                placeholder="Type a Steam game name (e.g. Rocket League)"
                value={steamQuery}
                onChange={handleSteamInputChange}
                className={`text-input ${pathError ? 'error' : ''}`}
                style={{ flex: 1 }}
                autoComplete="off"
                onFocus={() => steamResults.length > 0 && setSteamDropdownOpen(true)}
                onBlur={() => setTimeout(() => setSteamDropdownOpen(false), 150)}
                disabled={steamLoading || !!steamError || installedGames.length === 0}
              />
              <Button
                variant="primary"
                title="Rescan your Steam library for installed games."
                style={{ fontSize: 14, borderRadius: 6, marginLeft: 0 }}
                onClick={handleSteamRefresh}
                disabled={steamLoading}
              >
                {steamLoading ? 'Scanning...' : 'Rescan'}
              </Button>
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              <span>Format: <code>steam://rungameid/[AppID]</code> or <code>steam://launch/[AppID]/[LaunchOption]</code></span>
              <br />
              <span>If you can't find your game, make sure it's installed in your Steam library.</span>
            </div>
            {steamError && (
              <div style={{ color: '#dc3545', fontWeight: 500, marginTop: 8, fontSize: 15 }}>
                {steamError} <br />
                Please ensure Steam is installed and you have games downloaded.
              </div>
            )}
            {steamLoading && (
              <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 18, color: '#007bff', fontWeight: 500 }}>
                Scanning your Steam library for installed games...
              </div>
            )}
            {!steamLoading && !steamError && installedGames.length === 0 && (
              <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 16, color: '#888', fontWeight: 500 }}>
                No installed Steam games found.
              </div>
            )}
            {/* Add a style tag for the hover effect */}
            <style>{`
              .steam-dropdown-result:hover {
                background: #f0f6ff !important;
                transition: background 0.15s, transform 0.15s;
              }
              .steam-dropdown-result:hover img {
                transform: scale(1.07);
                transition: transform 0.15s;
              }
              .steam-dropdown-result:hover span {
                transform: scale(1.04);
                transition: transform 0.15s;
              }
            `}</style>
            {steamDropdownOpen && steamResults.length > 0 && (
              <ul style={{
                position: 'absolute',
                zIndex: 10,
                background: '#fff',
                border: '1px solid #b0c4d8',
                borderRadius: 8,
                margin: 0,
                padding: 0,
                width: '100%',
                maxHeight: 320,
                overflowY: 'auto',
                boxShadow: '0 2px 12px rgba(0,0,0,0.10)'
              }}>
                {dedupeByAppId(steamResults).map(game => (
                  <li
                    key={game.appid}
                    className="steam-dropdown-result"
                    style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 18px', cursor: 'pointer', fontSize: 18, minHeight: 56, transition: 'background 0.15s' }}
                    onMouseDown={() => handleSteamResultClick(game)}
                  >
                    <img
                      src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                      alt="Game header"
                      style={{ width: 90, height: 42, objectFit: 'cover', borderRadius: 6, background: '#e9eff3', flexShrink: 0, transition: 'transform 0.15s' }}
                      onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                    <span style={{ transition: 'transform 0.15s' }}>{game.name} <span style={{ color: '#888', fontSize: 15 }}>{`(${game.appid})`}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
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
                    if (window.api && window.api.selectExeOrShortcutFile) {
                      const result = await window.api.selectExeOrShortcutFile();
                      if (result && result.success && result.file) {
                        let newPath = result.file.path;
                        if (result.file.args && result.file.args.trim()) {
                          newPath += ' ' + result.file.args.trim();
                        }
                        setPath(newPath);
                        setPathError('');
                      } else if (result && result.error) {
                        setPathError(result.error);
                      }
                    } else {
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
          </>
        )}
      </div>
      {pathError && <p className="error-text">{pathError}</p>}
      <p className="help-text" style={{ marginTop: 6, color: '#888', fontSize: 14 }}>
        {type === 'exe'
          ? (<><span>I suggest searching the app in your search bar, right click it - open file location - right click the file and click properties - copy and paste what is in the Target field.</span><br /><span style={{ fontSize: '0.95em', color: '#888' }}>Example: C:\Users\ahoin\AppData\Local\Discord\Update.exe --processStart Discord.exe</span></>)
          : type === 'steam'
            ? (<><span>Type a Steam game name and select from the list, or paste a Steam URI/AppID directly.</span><br /><span style={{ fontSize: '0.95em', color: '#888' }}>Example: steam://rungameid/252950</span></>)
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
          onClick={async () => {
            if (window.api && window.api.sounds && window.api.sounds.selectFile) {
              const result = await window.api.sounds.selectFile();
              if (result && result.success && result.file) {
                await handleHoverSoundFile(result.file);
              } else if (result && result.error) {
                alert('Failed to select sound file: ' + result.error);
              }
            } else {
              hoverSoundInputRef.current?.click();
            }
          }}
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
  onClick={handleTestHoverSound}
  disabled={!hoverSoundUrl}
>
  {hoverSoundAudio ? 'Stop' : 'Test'}
</button>
        <div className="volume-control" style={{ marginLeft: 10 }}>
          <span style={{ fontWeight: 500, fontSize: '14px' }}>Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={hoverSoundVolume}
            onChange={e => handleHoverSoundVolumeChange(parseFloat(e.target.value))}
          />
          <span className="volume-value">{Math.round(hoverSoundVolume * 100)}%</span>
        </div>
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
            <span className="wee-card-title">Launch Options</span>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            Choose how this application should be launched when the channel is clicked.
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
            <ResourceUsageIndicator level="medium" tooltip="Video animations can use significant CPU and memory resources, especially with multiple channels">
              <span className="wee-card-title">Animation on Hover</span>
            </ResourceUsageIndicator>
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