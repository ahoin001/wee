import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './ChannelModal.css';
import ImageSearchModal from './ImageSearchModal';
import ResourceUsageIndicator from './ResourceUsageIndicator';
import Button from '../ui/Button';
// Remove unused imports related to old fetching/caching logic
// import { loadGames, clearGamesCache, searchGames, getLastUpdated, getLastError } from '../utils/steamGames';
import AppPathSearchCard from './AppPathSearchCard';
import useAppLibraryStore from '../utils/useAppLibraryStore';

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

// Utility to deduplicate by key
function dedupeByKey(games, key) {
  const seen = new Set();
  return games.filter(g => {
    if (seen.has(g[key])) return false;
    seen.add(g[key]);
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
  const [gameQuery, setGameQuery] = useState('');
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false);
  const [gameType, setGameType] = useState(type || 'exe'); // 'exe', 'url', 'steam', 'epic'
  const [customSteamPath, setCustomSteamPath] = useState(() => localStorage.getItem('customSteamPath') || '');
  const [appQuery, setAppQuery] = useState('');
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);

  // Zustand store selectors
  const {
    installedApps, appsLoading, appsError, fetchInstalledApps, rescanInstalledApps,
    steamGames, steamLoading, steamError, fetchSteamGames, rescanSteamGames,
    epicGames, epicLoading, epicError, fetchEpicGames, rescanEpicGames,
    uwpApps, uwpLoading, uwpError, fetchUwpApps, rescanUwpApps
  } = useAppLibraryStore();

  // Fuzzy search for apps
  const appResults = (type === 'exe' && appQuery && installedApps.length > 0)
    ? installedApps.filter(a => a.name.toLowerCase().includes(appQuery.toLowerCase())).slice(0, 10)
    : [];
  console.log('[ChannelModal] appResults:', appResults);

  // Fuzzy search for games
  const installedGames = (gameType === 'steam') ? steamGames : (gameType === 'epic' ? epicGames : []);
  const gameResults = (['steam', 'epic'].includes(gameType) && gameQuery && installedGames.length > 0)
    ? installedGames.filter(g => g.name.toLowerCase().includes(gameQuery.toLowerCase())).slice(0, 10)
    : [];
  console.log('[ChannelModal] gameResults:', gameResults);

  // Fuzzy search for UWP
  const [uwpQuery, setUwpQuery] = useState('');
  const [uwpDropdownOpen, setUwpDropdownOpen] = useState(false);
  const filteredUwpApps = uwpApps.filter(app =>
    app.name.toLowerCase().includes(uwpQuery.toLowerCase()) ||
    app.appId.toLowerCase().includes(uwpQuery.toLowerCase())
  );
  console.log('[ChannelModal] filteredUwpApps:', filteredUwpApps);

  // Best-practice: useEffect to sync dropdown open state with results
  useEffect(() => {
    if (type === 'exe') {
      if (appQuery && appResults.length > 0) setAppDropdownOpen(true);
      else setAppDropdownOpen(false);
    }
  }, [type, appQuery, appResults.length]);

  useEffect(() => {
    if ((gameType === 'steam' || gameType === 'epic')) {
      if (gameQuery && gameResults.length > 0) setGameDropdownOpen(true);
      else setGameDropdownOpen(false);
    }
  }, [gameType, gameQuery, gameResults.length]);

  useEffect(() => {
    if (type === 'microsoftstore') {
      if (uwpQuery && filteredUwpApps.length > 0) setUwpDropdownOpen(true);
      else setUwpDropdownOpen(false);
    }
  }, [type, uwpQuery, filteredUwpApps.length]);

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
    } else if (type === 'microsoftstore') {
      // Accept any AppID containing an exclamation mark
      if (typeof path === 'string' && path.includes('!')) {
        setPathError('');
        return true;
      } else {
        setPathError('Please enter a valid Microsoft Store AppID (e.g., ROBLOXCORPORATION.ROBLOX_55nm5eh3cm0pr!App)');
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

  const handleGameInputChange = (e) => {
    setGameQuery(e.target.value);
    setPath(e.target.value); // keep path in sync for manual entry
    setPathError('');
  };

  const handleGameResultClick = (game) => {
    let uri = '';
    if (gameType === 'steam') {
      uri = `steam://rungameid/${game.appid}`;
    } else if (gameType === 'epic') {
      uri = `com.epicgames.launcher://apps/${game.appName}?action=launch&silent=true`;
    }
    setPath(uri);
    setGameQuery(game.name);
    setGameDropdownOpen(false);
    setPathError('');
  };

  const handleGameRefresh = async () => {
    // setGameLoading(true); // Removed
    // setGameError(''); // Removed
    // setInstalledGames([]); // Removed
    try {
      const api = gameType === 'steam' ? window.api.steam : window.api.epic;
      const result = await api.getInstalledGames();
      // setGameLoading(false); // Removed
      if (result.error) {
        // setGameError(result.error); // Removed
        // setInstalledGames([]); // Removed
      } else {
        const key = gameType === 'steam' ? 'appid' : 'appName';
        // setInstalledGames(dedupeByKey(result.games || [], key)); // Removed
        // setGameError(''); // Removed
      }
    } catch (err) {
      // setGameLoading(false); // Removed
      // setGameError(err.message || 'Failed to scan games.'); // Removed
      // setInstalledGames([]); // Removed
    }
  };

  const handlePickSteamFolder = async () => {
    const result = await window.api.steam.pickLibraryFolder();
    if (result && result.path) {
      localStorage.setItem('customSteamPath', result.path);
      setCustomSteamPath(result.path);
    }
  };

  const handleAppInputChange = (e) => {
    setAppQuery(e.target.value);
    setPath(e.target.value);
    setPathError('');
  };

  const handleAppResultClick = (app) => {
    const fullPath = app.args ? `${app.path} ${app.args}` : app.path;
    setPath(fullPath);
    setAppQuery(app.name);
    setAppDropdownOpen(false);
    setPathError('');
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
          {media && typeof media.type === 'string' && media.type.startsWith('image/') ? (
          <img src={media.url} alt="Channel preview" />
          ) : media && typeof media.type === 'string' && media.type.startsWith('video/') ? (
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

  // Update renderAppPathSection to use Zustand state/actions
  const renderAppPathSection = () => (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        <label htmlFor={`launch-type-select-${channelId}`} style={{ fontWeight: 600, marginBottom: 4 }}>Launch Type</label>
        <select
          id={`launch-type-select-${channelId}`}
          value={gameType}
          onChange={e => { setGameType(e.target.value); setType(e.target.value); }}
          className="select-box"
        >
          <option value="exe">Application (.exe)</option>
          <option value="url">Website (URL)</option>
          <option value="steam">Steam Game</option>
          <option value="epic">Epic Game</option>
          <option value="microsoftstore">Microsoft Store App</option>
        </select>
      </div>
      {/* App Path Input (EXE) */}
      {type === 'exe' && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <AppPathSearchCard
            value={appQuery || path}
            onChange={e => { setAppQuery(e.target.value); setPath(e.target.value); setPathError(''); }}
            onFocus={() => { if (appResults.length > 0) setAppDropdownOpen(true); }}
            onBlur={() => setTimeout(() => setAppDropdownOpen(false), 150)}
            results={appResults}
            loading={appsLoading}
            error={appsError}
            onSelect={app => {
              const fullPath = app.args ? `${app.path} ${app.args}` : app.path;
              setPath(fullPath);
              setAppQuery(app.name);
              setAppDropdownOpen(false);
              setPathError('');
            }}
            onRescan={rescanInstalledApps}
            rescanLabel="Rescan Apps"
            disabled={appsLoading}
            placeholder="Enter or search for an app..."
            dropdownOpen={appDropdownOpen}
            setDropdownOpen={setAppDropdownOpen}
          />
          {/* Visual indicator for loading */}
          {appsLoading && appQuery && appResults.length === 0 && (
            <div style={{ position: 'absolute', left: 0, top: '100%', color: '#007bff', fontWeight: 500, fontSize: 15, marginTop: 4 }}>
              <span>Scanning for installed apps...</span>
            </div>
          )}
        </div>
      )}
      {/* Microsoft Store AppID Input */}
      {type === 'microsoftstore' && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            type="text"
            className="text-input"
            placeholder="Search or enter Microsoft Store App name or AppID"
            value={uwpQuery}
            onChange={e => setUwpQuery(e.target.value)}
            onFocus={() => { if (filteredUwpApps.length > 0) setUwpDropdownOpen(true); }}
            onBlur={() => setTimeout(() => setUwpDropdownOpen(false), 150)}
            style={{ width: '100%', padding: '12px 14px', fontSize: 17 }}
            autoComplete="off"
          />
          {uwpLoading && uwpQuery && filteredUwpApps.length === 0 && (
            <div style={{ position: 'absolute', top: 40, left: 0, color: '#007bff', fontWeight: 500, fontSize: 15 }}>
              <span>Scanning for Microsoft Store apps...</span>
            </div>
          )}
          {uwpError && <div style={{ color: '#dc3545', fontSize: 13, marginTop: 8 }}>{uwpError}</div>}
          {uwpDropdownOpen && filteredUwpApps.length > 0 && (
            <div className="uwp-dropdown" style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #b0c4d8', width: '100%', maxHeight: 200, overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {filteredUwpApps.map(app => (
                <div
                  key={app.appId}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                  onMouseDown={() => { setPath(app.appId); setUwpQuery(app.name); setUwpDropdownOpen(false); }}
                >
                  <div style={{ fontWeight: 500 }}>{app.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{app.appId}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="path-input-group">
        {(gameType === 'steam' || gameType === 'epic') ? (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
              <input
                type="text"
                placeholder={gameType === 'steam' ? 'Type a Steam game name (e.g. Rocket League) or paste a Steam URI' : 'Type an Epic game name (e.g. Fortnite) or paste an Epic URI'}
                value={gameQuery}
                onChange={e => { setGameQuery(e.target.value); setPath(e.target.value); setPathError(''); }}
                className={`text-input ${pathError ? 'error' : ''}`}
                style={{ flex: 1, padding: '12px 14px', fontSize: 17 }}
                autoComplete="off"
                onFocus={() => gameResults.length > 0 && setGameDropdownOpen(true)}
                onBlur={() => setTimeout(() => setGameDropdownOpen(false), 150)}
                disabled={gameType === 'steam' ? steamLoading : epicLoading}
              />
              {/* Add a Rescan button for Steam/Epic */}
              {(gameType === 'steam' || gameType === 'epic') && (
                <Button
                  variant="primary"
                  title={gameType === 'steam' ? 'Rescan your Steam library for installed games.' : 'Rescan your Epic library for installed games.'}
                  style={{ fontSize: 14, borderRadius: 6, marginLeft: 0 }}
                  onClick={() => gameType === 'steam' ? rescanSteamGames(customSteamPath) : rescanEpicGames()}
                  disabled={gameType === 'steam' ? steamLoading : epicLoading}
                >
                  {(gameType === 'steam' ? steamLoading : epicLoading) ? 'Scanning...' : 'Rescan'}
                </Button>
              )}
              {gameType === 'steam' && (
                <Button
                  variant="secondary"
                  title="Pick your main Steam folder (the one containing the steamapps folder and libraryfolders.vdf). Do NOT select the steamapps folder itself."
                  style={{ fontSize: 14, borderRadius: 6, marginLeft: 0, background: '#f7fafd', color: '#222', border: '1px solid #b0c4d8' }}
                  onClick={async () => {
                    const result = await window.api.steam.pickLibraryFolder();
                    if (result && result.path) {
                      localStorage.setItem('customSteamPath', result.path);
                      setCustomSteamPath(result.path);
                      fetchSteamGames(result.path);
                    }
                  }}
                  disabled={steamLoading}
                >
                  Change Steam Folder
                </Button>
              )}
              {/* Visual indicator for loading games */}
              {(gameType === 'steam' && steamLoading && gameQuery && gameResults.length === 0) && (
                <div style={{ position: 'absolute', left: 0, top: '100%', color: '#007bff', fontWeight: 500, fontSize: 15, marginTop: 4 }}>
                  <span>Scanning for Steam games...</span>
                </div>
              )}
              {(gameType === 'epic' && epicLoading && gameQuery && gameResults.length === 0) && (
                <div style={{ position: 'absolute', left: 0, top: '100%', color: '#007bff', fontWeight: 500, fontSize: 15, marginTop: 4 }}>
                  <span>Scanning for Epic games...</span>
                </div>
              )}
              {gameDropdownOpen && gameResults.length > 0 && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  zIndex: 10,
                  background: '#fff',
                  border: '1px solid #b0c4d8',
                  borderRadius: 8,
                  margin: 0,
                  padding: 0,
                  maxHeight: 320,
                  overflowY: 'auto',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.10)'
                }}>
                  {dedupeByKey(gameResults, gameType === 'steam' ? 'appid' : 'appName').map(game => (
                    <li
                      key={gameType === 'steam' ? game.appid : game.appName}
                      className="steam-dropdown-result"
                      style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 18px', cursor: 'pointer', fontSize: 18, minHeight: 56, transition: 'background 0.15s' }}
                      onMouseDown={() => {
                        let uri = '';
                        if (gameType === 'steam') {
                          uri = `steam://rungameid/${game.appid}`;
                        } else if (gameType === 'epic') {
                          uri = `com.epicgames.launcher://apps/${game.appName}?action=launch&silent=true`;
                        }
                        setPath(uri);
                        setGameQuery(game.name);
                        setGameDropdownOpen(false);
                        setPathError('');
                      }}
                    >
                      {gameType === 'steam' && (
                        <img
                          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                          alt={game.name + ' cover'}
                          style={{ width: 90, height: 42, objectFit: 'cover', borderRadius: 6, background: '#e9eff3', flexShrink: 0, transition: 'transform 0.15s' }}
                          onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                      )}
                      {gameType === 'epic' && game.image && (
                        <img
                          src={game.image}
                          alt={game.name + ' cover'}
                          style={{ width: 90, height: 42, objectFit: 'cover', borderRadius: 6, background: '#e9eff3', flexShrink: 0, transition: 'transform 0.15s' }}
                          onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                      )}
                      <span>{game.name} <span style={{ color: '#888', fontSize: 15 }}>{gameType === 'steam' ? `(${game.appid})` : `(${game.appName})`}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 16 }}>
              <span>Format: {gameType === 'steam' ? <code>steam://rungameid/[AppID]</code> : <code>com.epicgames.launcher://apps/[AppName]?action=launch&amp;silent=true</code>}</span>
              <br />
              <span>
                If you can't find your game, make sure it's installed in your {gameType === 'steam' ? 'Steam' : 'Epic'} library.<br />
                {gameType === 'steam' && (
                  <>
                    The correct Steam library path is required to scan your games. {customSteamPath ? <span>Currently using: <code>{customSteamPath}</code></span> : <span>Default: <code>C:\Program Files (x86)\Steam</code></span>}<br />
                    <b>When changing the Steam folder, select your main Steam folder (the one containing the <code>steamapps</code> folder and <code>libraryfolders.vdf</code>).<br />Do <u>NOT</u> select the <code>steamapps</code> folder itself.</b><br />
                    If you move your Steam library, use the <b>Change Steam Folder</b> button.
                  </>
                )}
              </span>
            </div>
            {(gameType === 'steam' && steamError) && (
              <div style={{ color: '#dc3545', fontWeight: 500, marginTop: 8, fontSize: 15 }}>
                {steamError} <br />
                Please ensure Steam is installed and you have games downloaded.
              </div>
            )}
            {(gameType === 'epic' && epicError) && (
              <div style={{ color: '#dc3545', fontWeight: 500, marginTop: 8, fontSize: 15 }}>
                {epicError} <br />
                Please ensure Epic Games Launcher is installed and you have games downloaded.
              </div>
            )}
            {(gameType === 'steam' && steamLoading) && (
              <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 18, color: '#007bff', fontWeight: 500 }}>
                Scanning your Steam library for installed games...
              </div>
            )}
            {(gameType === 'epic' && epicLoading) && (
              <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 18, color: '#007bff', fontWeight: 500 }}>
                Scanning your Epic library for installed games...
              </div>
            )}
            {!steamLoading && !steamError && gameType === 'steam' && installedGames.length === 0 && (
              <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 16, color: '#888', fontWeight: 500 }}>
                No installed Steam games found.
              </div>
            )}
            {!epicLoading && !epicError && gameType === 'epic' && installedGames.length === 0 && (
              <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 16, color: '#888', fontWeight: 500 }}>
                No installed Epic games found.
              </div>
            )}
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
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder={type === 'exe' ? 'C:\\Path\\To\\Application.exe or paste path here' : 'https://example.com'}
              value={path}
              onChange={e => { setPath(e.target.value); setPathError(''); }}
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
                  onChange={e => handleExeFileSelect(e.target.files[0])}
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
        {/* Launch Options Card */}
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
  currentAnimatedOnHover: PropTypes.oneOf([true, false, 'global'])
};

export default ChannelModal; 