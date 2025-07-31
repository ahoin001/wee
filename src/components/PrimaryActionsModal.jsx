import React, { useState, useRef, useEffect } from 'react';
import BaseModal from './BaseModal';
// import AppPathSectionCard from './AppPathSectionCard'; // LEGACY: No longer used
import UnifiedAppPathCard from './UnifiedAppPathCard';
import Button from '../ui/Button';
import Toggle from '../ui/Toggle';
import AdminPanel from './AdminPanel';
import useAppLibraryStore from '../utils/useAppLibraryStore';
import useIconsStore from '../utils/useIconsStore';

function PrimaryActionsModal({ isOpen, onClose, onSave, config, buttonIndex, preavailableIcons = [], ribbonGlowColor = '#0099ff' }) {
  const [type, setType] = useState(config?.type || 'text');
  const [text, setText] = useState(config?.text || (buttonIndex === 0 ? 'Wii' : ''));
  const [icon, setIcon] = useState(config?.icon || null);
  const [actionType, setActionType] = useState(config?.actionType === 'none' ? 'exe' : config?.actionType || 'exe');
  const [action, setAction] = useState(config?.action || '');
  const [appName, setAppName] = useState(''); // Separate state for app name in UnifiedAppPathCard
  const [pathError, setPathError] = useState('');
  const [useWiiGrayFilter, setUseWiiGrayFilter] = useState(config?.useWiiGrayFilter || false);
  const [useAdaptiveColor, setUseAdaptiveColor] = useState(config?.useAdaptiveColor || false);
  const [useGlowEffect, setUseGlowEffect] = useState(config?.useGlowEffect || false);
  const [glowStrength, setGlowStrength] = useState(config?.glowStrength || 20);
  const [useGlassEffect, setUseGlassEffect] = useState(config?.useGlassEffect || false);
  const [glassOpacity, setGlassOpacity] = useState(config?.glassOpacity || 0.18);
  const [glassBlur, setGlassBlur] = useState(config?.glassBlur || 2.5);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(config?.glassBorderOpacity || 0.5);
  const [glassShineOpacity, setGlassShineOpacity] = useState(config?.glassShineOpacity || 0.7);
  const [textFont, setTextFont] = useState(config?.textFont || 'default');
  const [path, setPath] = useState('');
  const [adminMode, setAdminMode] = useState(config?.adminMode || false);
  const [powerActions, setPowerActions] = useState(config?.powerActions || []);
  
  // App/game path logic state
  const [gameType, setGameType] = useState('exe');
  const [appQuery, setAppQuery] = useState('');
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);
  const [uwpQuery, setUwpQuery] = useState('');
  const [uwpDropdownOpen, setUwpDropdownOpen] = useState(false);
  const [gameQuery, setGameQuery] = useState('');
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false);
  const exeFileInputRef = useRef(null);

  // Zustand store selectors
  const {
    installedApps, appsLoading, appsError, fetchInstalledApps, rescanInstalledApps,
    steamGames, steamLoading, steamError, fetchSteamGames, rescanSteamGames,
    epicGames, epicLoading, epicError, fetchEpicGames, rescanEpicGames,
    uwpApps, uwpLoading, uwpError, fetchUwpApps, rescanUwpApps,
    customSteamPath, setCustomSteamPath
  } = useAppLibraryStore();

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

  // Fuzzy search for apps
  const appResults = (gameType === 'exe' && appQuery && installedApps.length > 0)
    ? installedApps.filter(a => a.name.toLowerCase().includes(appQuery.toLowerCase())).slice(0, 10)
    : [];

  // Fuzzy search for games
  const installedGames = (gameType === 'steam') ? steamGames : (gameType === 'epic' ? epicGames : []);
  const gameResults = (['steam', 'epic'].includes(gameType) && gameQuery && installedGames.length > 0)
    ? installedGames.filter(g => g.name.toLowerCase().includes(gameQuery.toLowerCase())).slice(0, 10)
    : [];

  // Fuzzy search for UWP
  const filteredUwpApps = uwpApps.filter(app =>
    app.name.toLowerCase().includes(uwpQuery.toLowerCase()) ||
    app.appId.toLowerCase().includes(uwpQuery.toLowerCase())
  );
  
  // Update state when config changes (important for when modal reopens)
  useEffect(() => {
    if (config) {
      setType(config.type || 'text');
      setText(config.text || (buttonIndex === 0 ? 'Wii' : ''));
      setIcon(config.icon || null);
      setActionType(config.actionType === 'none' ? 'exe' : config.actionType || 'exe');
      setAction(config.action || '');
      setPath(config.action || ''); // Sync path with action
      setGameType(config.actionType === 'none' ? 'exe' : config.actionType || 'exe'); // Default to 'exe' if actionType is 'none'
      setUseWiiGrayFilter(config.useWiiGrayFilter || false);
      setUseAdaptiveColor(config.useAdaptiveColor || false);
      setUseGlowEffect(config.useGlowEffect || false);
      setGlowStrength(config.glowStrength || 20);
      setUseGlassEffect(config.useGlassEffect || false);
      setGlassOpacity(config.glassOpacity || 0.18);
      setGlassBlur(config.glassBlur || 2.5);
      setGlassBorderOpacity(config.glassBorderOpacity || 0.5);
      setGlassShineOpacity(config.glassShineOpacity || 0.7);
      setTextFont(config.textFont || 'default');
      setAdminMode(config.adminMode || false);
      setPowerActions(config.powerActions || []);
    }
  }, [config, buttonIndex]);

  // Fetch saved icons on open
  useEffect(() => {
    if (isOpen) {
      fetchIcons();
    }
  }, [isOpen, fetchIcons]);

  // Regenerate tinted images when ribbon glow color changes and adaptive color is enabled
  useEffect(() => {
    if (useAdaptiveColor && savedIcons.length > 0) {
      const rgbColor = hexToRgb(ribbonGlowColor);
      const newTintedImages = {};
      
      savedIcons.forEach(icon => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
          try {
            const tintedUrl = await tintImage(img, rgbColor);
            newTintedImages[icon.url] = tintedUrl;
            setTintedImages(prev => ({ ...prev, ...newTintedImages }));
          } catch (error) {
            console.error('Error tinting image:', error);
          }
        };
        img.src = icon.url;
      });
    }
  }, [ribbonGlowColor, useAdaptiveColor, savedIcons]);

  // Fetch app library data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch installed apps if not already loaded
      if (installedApps.length === 0 && !appsLoading) {
        fetchInstalledApps();
      }
      // Fetch UWP apps if not already loaded
      if (uwpApps.length === 0 && !uwpLoading) {
        fetchUwpApps();
      }
      // Fetch Steam games if not already loaded
      if (steamGames.length === 0 && !steamLoading) {
        fetchSteamGames(customSteamPath);
      }
      // Fetch Epic games if not already loaded
      if (epicGames.length === 0 && !epicLoading) {
        fetchEpicGames();
      }
    }
  }, [isOpen, installedApps.length, appsLoading, uwpApps.length, uwpLoading, steamGames.length, steamLoading, epicGames.length, epicLoading, fetchInstalledApps, fetchUwpApps, fetchSteamGames, fetchEpicGames, customSteamPath]);

  // Best-practice: useEffect to sync dropdown open state with results
  useEffect(() => {
    if (gameType === 'exe') {
      if (appQuery && appResults.length > 0) setAppDropdownOpen(true);
      else setAppDropdownOpen(false);
    }
  }, [gameType, appQuery, appResults.length]);

  useEffect(() => {
    if ((gameType === 'steam' || gameType === 'epic')) {
      if (gameQuery && gameResults.length > 0) setGameDropdownOpen(true);
      else setGameDropdownOpen(false);
    }
  }, [gameType, gameQuery, gameResults.length]);

  useEffect(() => {
    if (gameType === 'microsoftstore') {
      if (uwpQuery && filteredUwpApps.length > 0) setUwpDropdownOpen(true);
      else setUwpDropdownOpen(false);
    }
  }, [gameType, uwpQuery, filteredUwpApps.length]);

  // Helper function to get icon color based on adaptive color setting
  const getIconColor = () => {
    if (useAdaptiveColor) {
      return ribbonGlowColor;
    }
    return '#0099ff';
  };

  // Helper function to get icon filter based on settings
  const getIconFilter = () => {
    if (useWiiGrayFilter) {
      return 'grayscale(100%) brightness(0.6) contrast(1.2)';
    }
    return 'none';
  };

  // Helper function to get the appropriate image source for adaptive color
  const getImageSource = (originalUrl) => {
    if (useAdaptiveColor && tintedImages[originalUrl]) {
      return tintedImages[originalUrl];
    }
    return originalUrl;
  };

  // Helper function to convert hex color to RGB array
  const hexToRgb = (hexColor) => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return [r, g, b];
  };

  // Helper function to tint an image with a specific color
  const tintImage = (imageElement, rgbColor) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match image
      canvas.width = imageElement.naturalWidth || imageElement.width;
      canvas.height = imageElement.naturalHeight || imageElement.height;
      
      // Draw the image to get the alpha mask
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Replace all non-transparent pixels with the tint color
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha !== 0) {
          data[i]     = rgbColor[0]; // R
          data[i + 1] = rgbColor[1]; // G
          data[i + 2] = rgbColor[2]; // B
          // Keep original alpha
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to data URL
      const tintedImageUrl = canvas.toDataURL('image/png');
      resolve(tintedImageUrl);
    });
  };

  // Handle Wii gray filter toggle with mutual exclusivity
  const handleWiiGrayFilterToggle = (checked) => {
    setUseWiiGrayFilter(checked);
    if (checked && useAdaptiveColor) {
      setUseAdaptiveColor(false);
    }
  };

  // Handle adaptive color toggle with mutual exclusivity
  const handleAdaptiveColorToggle = async (checked) => {
    setUseAdaptiveColor(checked);
    if (checked && useWiiGrayFilter) {
      setUseWiiGrayFilter(false);
    }
    
    // Generate tinted images for all saved icons when adaptive color is enabled
    if (checked && savedIcons.length > 0) {
      const rgbColor = hexToRgb(ribbonGlowColor);
      const newTintedImages = {};
      
      for (const icon of savedIcons) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = async () => {
            const tintedUrl = await tintImage(img, rgbColor);
            newTintedImages[icon.url] = tintedUrl;
            setTintedImages(prev => ({ ...prev, ...newTintedImages }));
          };
          img.src = icon.url;
        } catch (error) {
          console.error('Error tinting image:', error);
        }
      }
    } else if (!checked) {
      // Clear tinted images when adaptive color is disabled
      setTintedImages({});
    }
  };

  // Upload and save icon immediately
  const handleUploadIcon = async () => {
    const result = await uploadIcon();
    if (result.success) {
      setIcon(result.icon.url);
    }
  };

  const handleDeleteSavedIcon = async (iconUrl) => {
    const result = await deleteIcon(iconUrl);
    if (result.success && icon === iconUrl) {
      setIcon(null);
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
    } else if (actionType === 'steam') {
      // Validate Steam URI/AppID format
      if (action.trim().startsWith('steam://') || action.trim().startsWith('steam://rungameid/') || action.trim().startsWith('steam://launch/')) {
        setPathError('');
        return true;
      } else {
        setPathError('Please enter a valid Steam URI (e.g., steam://rungameid/252950) or AppID (e.g., 252950)');
        return false;
      }
    } else if (actionType === 'epic') {
      // Validate Epic URI format
      if (action.trim().startsWith('com.epicgames.launcher://apps/')) {
        setPathError('');
        return true;
      } else {
        setPathError('Please enter a valid Epic URI (e.g., com.epicgames.launcher://apps/Fortnite?action=launch&silent=true)');
        return false;
      }
    } else if (actionType === 'microsoftstore') {
      // Accept any AppID containing an exclamation mark
      if (typeof action === 'string' && action.includes('!')) {
        setPathError('');
        return true;
      } else {
        setPathError('Please enter a valid Microsoft Store AppID (e.g., ROBLOXCORPORATION.ROBLOX_55nm5eh3cm0pr!App)');
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

  // Check if this is for the presets button or accessory button
  const isPresetsButton = buttonIndex === "presets";
  const isAccessoryButton = buttonIndex === "accessory";

  const handleSave = () => {
    
    if (!isPresetsButton && !isAccessoryButton && !validatePath()) return;
    
    const saveData = {
      type,
      text: type === 'text' ? text : '',
      icon: type === 'icon' ? icon : null,
      actionType: actionType, // Use actionType from unified system
      action: action,         // Use action from unified system
      useWiiGrayFilter: type === 'icon' ? useWiiGrayFilter : false,
      useAdaptiveColor,
      useGlowEffect,
      glowStrength,
      useGlassEffect,
      glassOpacity,
      glassBlur,
      glassBorderOpacity,
      glassShineOpacity,
      textFont: type === 'text' ? textFont : 'default', // Include font in save
      adminMode,
      powerActions,
    };
    
    onSave(saveData);
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
          <>
            <input
              type="text"
              className="text-input"
              placeholder="Button text"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={16}
              style={{ width: '100%', marginBottom: 12 }}
            />
            {/* Font Selection for Text */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 500, marginRight: 10 }}>Text Font</label>
              <select
                value={textFont}
                onChange={e => setTextFont(e.target.value)}
                style={{ padding: 4, borderRadius: 6 }}
              >
                <option value="default">Default</option>
                <option value="digital">DigitalDisplayRegular-ODEO</option>
              </select>
            </div>
          </>
        ) : (
          <>
            {/* Built-in Icons Section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Built-in Icons:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* Palette Icon */}
                <button
                  type="button"
                  style={{
                    border: icon === 'palette' ? `2.5px solid ${getIconColor()}` : '1.5px solid #ccc',
                    borderRadius: 8,
                    padding: 8,
                    background: icon === 'palette' ? `${getIconColor()}10` : '#fff',
                    boxShadow: icon === 'palette' ? `0 0 0 2px ${getIconColor()}40` : '0 1px 4px #0001',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border 0.18s, box-shadow 0.18s',
                  }}
                  onClick={() => setIcon('palette')}
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={getIconColor()} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ filter: getIconFilter() }}
                  >
                    <circle cx="13.5" cy="6.5" r="2.5"/>
                    <circle cx="17.5" cy="10.5" r="2.5"/>
                    <circle cx="8.5" cy="7.5" r="2.5"/>
                    <circle cx="6.5" cy="12.5" r="2.5"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                </button>
                
                {/* Star Icon */}
                <button
                  type="button"
                  style={{
                    border: icon === 'star' ? `2.5px solid ${getIconColor()}` : '1.5px solid #ccc',
                    borderRadius: 8,
                    padding: 8,
                    background: icon === 'star' ? `${getIconColor()}10` : '#fff',
                    boxShadow: icon === 'star' ? `0 0 0 2px ${getIconColor()}40` : '0 1px 4px #0001',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border 0.18s, box-shadow 0.18s',
                  }}
                  onClick={() => setIcon('star')}
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={getIconColor()} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ filter: getIconFilter() }}
                  >
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                </button>
                
                {/* Heart Icon */}
                <button
                  type="button"
                  style={{
                    border: icon === 'heart' ? `2.5px solid ${getIconColor()}` : '1.5px solid #ccc',
                    borderRadius: 8,
                    padding: 8,
                    background: icon === 'heart' ? `${getIconColor()}10` : '#fff',
                    boxShadow: icon === 'heart' ? `0 0 0 2px ${getIconColor()}40` : '0 1px 4px #0001',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border 0.18s, box-shadow 0.18s',
                  }}
                  onClick={() => setIcon('heart')}
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={getIconColor()} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ filter: getIconFilter() }}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Upload New Icon Button */}
            <button
              className="file-button"
              style={{ 
                marginBottom: 18, 
                fontWeight: 500, 
                padding: '8px 18px', 
                fontSize: 15, 
                background: iconsUploading ? '#bbb' : getIconColor(), 
                color: '#fff', 
                cursor: iconsUploading ? 'not-allowed' : 'pointer' 
              }}
              onClick={handleUploadIcon}
              disabled={iconsUploading}
            >
              {iconsUploading ? 'Uploading...' : 'Upload New Icon'}
            </button>
            {iconsUploadError && (
              <div style={{ color: '#dc3545', fontSize: 13, marginBottom: 6 }}>{iconsUploadError}</div>
            )}
            {/* Saved Icons Section */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 500, marginBottom: 6 }}>Your saved icons:</div>
              {iconsLoading ? (
                <div style={{ color: '#888', marginBottom: 10 }}>Loading saved icons...</div>
              ) : savedIcons.length > 0 ? (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {savedIcons.map((i, idx) => (
                    <div key={i.url} style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        type="button"
                        style={{
                          border: icon === i.url ? `2.5px solid ${getIconColor()}` : '1.5px solid #ccc',
                          borderRadius: 8,
                          padding: 0,
                          background: icon === i.url ? `${getIconColor()}10` : '#fff',
                          boxShadow: icon === i.url ? `0 0 0 2px ${getIconColor()}40` : '0 1px 4px #0001',
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
                        <img 
                          src={getImageSource(i.url)} 
                          alt={i.name} 
                          style={{ 
                            maxHeight: 32, 
                            maxWidth: 32, 
                            borderRadius: 6,
                            filter: getIconFilter()
                          }} 
                        />
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

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [tintedImages, setTintedImages] = useState({});

  const handleAdminPanelSave = (adminConfig) => {
    setPowerActions(adminConfig.powerActions || []);
  };

  // LEGACY: Commented out the old renderAppPathSection function
  // const renderAppPathSection = () => {
  //   // Gather all relevant state for AppPathSectionCard
  //   const appPathSectionValue = {
  //     gameType,
  //     appQuery,
  //     appDropdownOpen,
  //     appResults,
  //     appsLoading: appsLoading,
  //     appsError: appsError,
  //     path,
  //     pathError,
  //     exeFileInputRef,
  //     uwpQuery,
  //     uwpDropdownOpen,
  //     filteredUwpApps,
  //     uwpLoading: uwpLoading,
  //     uwpError: uwpError,
  //     gameQuery,
  //     gameDropdownOpen,
  //     gameResults,
  //     steamLoading: steamLoading,
  //     epicLoading: epicLoading,
  //     steamError: steamError,
  //     epicError: epicError,
  //     customSteamPath,
  //   };

  //   const handleAppPathSectionChange = updates => {
  //     if ('gameType' in updates) {
  //       setGameType(updates.gameType);
  //       setActionType(updates.gameType); // Update actionType for saving
  //     }
  //     if ('appQuery' in updates) setAppQuery(updates.appQuery);
  //     if ('appDropdownOpen' in updates) setAppDropdownOpen(updates.appDropdownOpen);
  //     if ('path' in updates) {
  //       setPath(updates.path);
  //       setAction(updates.path); // Update action for saving
  //     }
  //     if ('pathError' in updates) setPathError(updates.pathError);
  //     if ('uwpQuery' in updates) setUwpQuery(updates.uwpQuery);
  //     if ('uwpDropdownOpen' in updates) setUwpDropdownOpen(updates.uwpDropdownOpen);
  //     if ('gameQuery' in updates) setGameQuery(updates.gameQuery);
  //     if ('gameDropdownOpen' in updates) setGameDropdownOpen(updates.gameDropdownOpen);
  //   };

  //   return (
  //     <AppPathSectionCard
  //       value={appPathSectionValue}
  //       onChange={handleAppPathSectionChange}
  //       onAppSelect={handleAppResultClick}
  //       onRescanInstalledApps={rescanInstalledApps}
  //       onGameResultClick={handleGameResultClick}
  //       handlePickSteamFolder={handlePickSteamFolder}
  //       handleGameRefresh={handleGameRefresh}
  //     />
  //   );
  // };

  // LEGACY: Commented out the old handlers that work with Zustand store
  // const handleAppResultClick = (item) => {
  //   const fullPath = item.args ? `${item.path} ${item.args}` : item.path;
  //   const newPath = fullPath || item.name || '';
  //                       setPath(newPath);
  //   setAction(newPath); // Also update action for saving
  //   setAppQuery(item.name || item.path || '');
  //   setAppDropdownOpen(false);
  // };

  // const handleGameResultClick = (game) => {
  //   let newPath = '';
  //   if (gameType === 'steam') {
  //     newPath = `steam://rungameid/${game.appid}`;
  //   } else if (gameType === 'epic') {
  //     // Epic Games Launcher URI format: com.epicgames.launcher://apps/[AppName]?action=launch&silent=true
  //     newPath = `com.epicgames.launcher://apps/${game.appName}?action=launch&silent=true`;
  //   } else {
  //     newPath = game.appName;
  //   }
  //   setPath(newPath);
  //   setAction(newPath); // Also update action for saving
  //   setGameQuery(game.name);
  //   setGameDropdownOpen(false);
  // };

  // const handlePickSteamFolder = async () => {
  //   const result = await window.api.steam.pickLibraryFolder();
  //   if (result && result.path) {
  //     setCustomSteamPath(result.path);
  //   }
  // };

  // const handleGameRefresh = async () => {
  //   try {
  //       if (gameType === 'steam') {
  //         await rescanSteamGames(customSteamPath);
  //       } else if (gameType === 'epic') {
  //         await rescanEpicGames();
  //       }
  //     } catch (err) {
  //       console.error('Error during rescan:', err);
  //     }
  //   };

  // LEGACY: Commented out the old file selection handlers
  // const handleExeFileSelect = (file) => {
  //   if (file && file.path) {
  //     setPath(file.path);
  //     setAction(file.path); // Also update action for saving
  //     setPathError('');
  //   }
  // };

  // const handlePathChange = (e) => {
  //   setPath(e.target.value);
  //   setAction(e.target.value); // Also update action for saving
  //     setPathError('');
  //   };


  if (!isOpen) return null;

  return (
    <BaseModal
      title={isPresetsButton ? "Customize Presets Button" : isAccessoryButton ? "Customize Accessory Button" : "Primary Actions"}
      onClose={onClose}
      maxWidth="480px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => { 
            if (isPresetsButton || isAccessoryButton || validatePath()) { 
              handleSave();
              handleClose(); 
            } 
          }} style={{ minWidth: 90 }}>Save</Button>
        </div>
      )}
    >
      {/* Icon Selection/Upload Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">
            {isPresetsButton ? "Presets Button Icon" : isAccessoryButton ? "Accessory Button Icon" : "Channel Icon"}
          </span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          {isPresetsButton 
            ? "Choose or upload a custom icon for the presets button. This button opens the presets modal when clicked."
            : isAccessoryButton
            ? "Choose or upload a custom icon for the accessory button. This button can be configured to launch apps or URLs."
            : "Choose or upload a custom icon for this channel. PNG recommended for best results."
          }
          <div style={{ marginTop: 14 }}>
            {/* Icon selection/upload UI here */}
            {renderIconSection && renderIconSection()}
          </div>
        </div>
      </div>
      {/* Icon Color Settings Card - Only show when using icon and not presets button or accessory button */}
      {type === 'icon' && !isPresetsButton && !isAccessoryButton && (
        <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="wee-card-header">
            <span className="wee-card-title">Icon Color Settings</span>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            <div style={{ marginBottom: 16 }}>
              <Toggle
                checked={useWiiGrayFilter}
                onChange={handleWiiGrayFilterToggle}
                label="Use Wii Button Color Filter"
              />
              <div style={{ marginLeft: 54, marginTop: 4, fontSize: 14, color: '#666' }}>
                Make the icon Wii gray to match the classic Wii button style.
              </div>
            </div>
            
            <div>
              <Toggle
                checked={useAdaptiveColor}
                onChange={handleAdaptiveColorToggle}
                label="Use Adaptive Color"
              />
              <div style={{ marginLeft: 54, marginTop: 4, fontSize: 14, color: '#666' }}>
                Make the icon color match the ribbon glow color ({ribbonGlowColor}).
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Admin Mode Card - Only show for left button (index 0) and not presets/accessory buttons */}
      {buttonIndex === 0 && !isPresetsButton && !isAccessoryButton && (
        <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="wee-card-header">
            <span className="wee-card-title">Admin Mode</span>
            <Toggle
              checked={adminMode}
              onChange={setAdminMode}
            />
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            When enabled, this button becomes a powerful admin menu with Windows system actions instead of launching a single app.
            {adminMode && (
            <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Configure Windows system actions for your admin menu:</div>
              <Button
                variant="primary"
                onClick={() => setShowAdminPanel(true)}
              >
                Open Admin Panel
              </Button>
              {powerActions.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: 6 }}>
                    Selected actions: {powerActions.length}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '4px',
                    maxHeight: '60px',
                    overflowY: 'auto'
                  }}>
                    {powerActions.slice(0, 5).map(action => (
                      <span
                        key={action.id}
                        style={{
                          background: '#f0f8ff',
                          color: '#0099ff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          border: '1px solid #e0f0ff'
                        }}
                      >
                        {action.icon} {action.name}
                      </span>
                    ))}
                    {powerActions.length > 5 && (
                      <span style={{ color: '#666', fontSize: '11px', padding: '2px 6px' }}>
                        +{powerActions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {/* Unified App Path Card - Only show for non-presets buttons when not in admin mode */}
      {!isPresetsButton && !adminMode && (
        <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="wee-card-header">
            <span className="wee-card-title">Unified App Path (NEW)</span>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            NEW: Unified app search that consolidates all app types (EXE, Steam, Epic, Microsoft Store) into a single interface.
            <div style={{ marginTop: 14 }}>
              <UnifiedAppPathCard
                value={{
                  launchType: actionType === 'url' ? 'url' : 'application',
                  appName: appName,
                  path: action
                }}
                onChange={(config) => {
                  if (config.launchType === 'url') {
                    setActionType('url');
                    setAction(config.path || '');
                    setAppName('');
                  } else {
                    setActionType('exe');
                    setAction(config.path || '');
                    if (config.selectedApp) {
                      setAppName(config.selectedApp.name);
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* App Path/URL Card - Only show for non-presets buttons when not in admin mode */}
      {/* {!isPresetsButton && !adminMode && (
        <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="wee-card-header">
            <span className="wee-card-title">App Path or URL</span>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            Set the path to an app or a URL to launch when this button is clicked.
            <div style={{ marginTop: 14 }}>
              <UnifiedAppPathCard
                value={{
                  launchType: actionType === 'url' ? 'url' : 'application',
                  appName: text,
                  path: action,
                  selectedApp: null // Will be set by the store
                }}
                onChange={(config) => {
                  if (config.launchType === 'url') {
                    setActionType('url');
                    setAction(config.path || '');
                  } else {
                    // Map app type to actionType
                    let newActionType = 'exe'; // default
                    if (config.selectedApp) {
                      switch (config.selectedApp.type) {
                        case 'steam':
                          newActionType = 'steam';
                          break;
                        case 'epic':
                          newActionType = 'epic';
                          break;
                        case 'microsoft':
                          newActionType = 'microsoftstore';
                          break;
                        case 'exe':
                        default:
                          newActionType = 'exe';
                          break;
                      }
                      setText(config.selectedApp.name);
                    }
                    setActionType(newActionType);
                    setAction(config.path || '');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )} */}

      {/* Hover Effect Card - Show for all buttons */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Hover Effect</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose how the button looks when you hover over it.
          <div style={{ marginTop: 14 }}>
            {/* Border Effect Option */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hover-effect"
                  checked={!useGlowEffect}
                  onChange={() => setUseGlowEffect(false)}
                />
                <span style={{ fontWeight: 500 }}>Border Effect</span>
              </label>
              <div style={{ marginLeft: 24, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useAdaptiveColor && !useGlowEffect}
                    onChange={(e) => setUseAdaptiveColor(e.target.checked)}
                    disabled={useGlowEffect}
                  />
                  <span style={{ fontSize: 14, color: '#666' }}>Use adaptive color (matches ribbon glow)</span>
                </label>
              </div>
            </div>
            
            {/* Glow Effect Option */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hover-effect"
                  checked={useGlowEffect}
                  onChange={() => setUseGlowEffect(true)}
                />
                <span style={{ fontWeight: 500 }}>Glow Effect</span>
              </label>
              {useGlowEffect && (
                <div style={{ marginLeft: 24, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#666', minWidth: 60 }}>Strength:</span>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={glowStrength}
                      onChange={(e) => setGlowStrength(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 14, color: '#666', minWidth: 30 }}>{glowStrength}px</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={useAdaptiveColor && useGlowEffect}
                      onChange={(e) => setUseAdaptiveColor(e.target.checked)}
                    />
                    <span style={{ fontSize: 14, color: '#666' }}>Use adaptive color (matches ribbon glow)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Glass Effect Card - Show for all buttons */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Glass Effect</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={useGlassEffect}
              onChange={(e) => setUseGlassEffect(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Apply a glass morphism effect to the button background. Text and icons will appear above the glass effect.
          {useGlassEffect && (
            <div style={{ marginTop: 14 }}>
              {/* Glass Opacity */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>Glass Opacity</span>
                  <span style={{ fontSize: 14, color: '#666' }}>{Math.round(glassOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.01"
                  value={glassOpacity}
                  onChange={(e) => setGlassOpacity(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Glass Blur */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>Glass Blur</span>
                  <span style={{ fontSize: 14, color: '#666' }}>{glassBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.1"
                  value={glassBlur}
                  onChange={(e) => setGlassBlur(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Glass Border Opacity */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>Border Opacity</span>
                  <span style={{ fontSize: 14, color: '#666' }}>{Math.round(glassBorderOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={glassBorderOpacity}
                  onChange={(e) => setGlassBorderOpacity(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Glass Shine Opacity */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>Shine Opacity</span>
                  <span style={{ fontSize: 14, color: '#666' }}>{Math.round(glassShineOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={glassShineOpacity}
                  onChange={(e) => setGlassShineOpacity(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onSave={handleAdminPanelSave}
        config={{ powerActions }}
      />
    </BaseModal>
  );
}

export default PrimaryActionsModal; 