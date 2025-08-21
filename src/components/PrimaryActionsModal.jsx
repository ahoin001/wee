import React, { useState, useRef, useEffect, useCallback } from 'react';
import WBaseModal from './WBaseModal';
// import AppPathSectionCard from './AppPathSectionCard'; // LEGACY: No longer used
import UnifiedAppPathCard from './UnifiedAppPathCard';
import Button from '../ui/WButton';
import WToggle from '../ui/WToggle';
import Card from '../ui/Card';
import WInput from '../ui/WInput';
import WSelect from '../ui/WSelect';
import Text from '../ui/Text';
import Slider from '../ui/Slider';
import WRadioGroup from '../ui/WRadioGroup';
import { useAppLibraryState, useIconState, useUnifiedAppsState } from '../utils/useConsolidatedAppHooks';

function PrimaryActionsModal({ isOpen, onClose, onSave, config, buttonIndex, preavailableIcons = [], ribbonGlowColor = '#0099ff' }) {
  const [type, setType] = useState(config?.type || 'text');
  const [text, setText] = useState(config?.text || (buttonIndex === 0 ? 'Wii' : ''));
  const [icon, setIcon] = useState(config?.icon || null);
  const [actionType, setActionType] = useState(config?.actionType === 'none' ? 'exe' : config?.actionType || 'exe');
  const [action, setAction] = useState(config?.action || '');
  const [appName, setAppName] = useState('');
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

  // App/game path logic state
  const [gameType, setGameType] = useState('exe');
  const [appQuery, setAppQuery] = useState('');
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);
  const [uwpQuery, setUwpQuery] = useState('');
  const [uwpDropdownOpen, setUwpDropdownOpen] = useState(false);
  const [gameQuery, setGameQuery] = useState('');
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false);
  const exeFileInputRef = useRef(null);

  // ✅ DATA LAYER: Get app library state from consolidated store
  const {
    appLibrary: {
      installedApps, appsLoading, appsError,
      steamGames, steamLoading, steamError,
      epicGames, epicLoading, epicError,
      uwpApps, uwpLoading, uwpError,
      customSteamPath
    },
    appLibraryManager: {
      fetchInstalledApps, rescanInstalledApps,
      fetchSteamGames, rescanSteamGames,
      fetchEpicGames, rescanEpicGames,
      fetchUwpApps, rescanUwpApps,
      setCustomSteamPath
    }
  } = useAppLibraryState();

  // ✅ DATA LAYER: Get icons state from consolidated store
  const {
    icons: {
      savedIcons,
      loading: iconsLoading,
      error: iconsError,
      uploading: iconsUploading,
      uploadError: iconsUploadError
    },
    iconManager: {
      fetchIcons,
      uploadIcon,
      deleteIcon,
      clearError: clearIconsError
    }
  } = useIconState();

  // ✅ DATA LAYER: Get unified apps state from consolidated store
  const { unifiedApps } = useUnifiedAppsState();

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

  useEffect(() => {
    if (config) {
      setType(config.type || 'text');
      setText(config.text || (buttonIndex === 0 ? 'Wii' : ''));
      setIcon(config.icon || null);
      setActionType(config.actionType === 'none' ? 'exe' : config.actionType || 'exe');
      setAction(config.action || '');
      setPath(config.action || '');
      setGameType(config.actionType === 'none' ? 'exe' : config.actionType || 'exe');
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
    }
  }, [config, buttonIndex]);

  useEffect(() => {
    if (isOpen) {
      fetchIcons();
    }
  }, [isOpen, fetchIcons]);

  useEffect(() => {
    if (useAdaptiveColor && savedIcons.length > 0) {
      // Use the same color logic as WiiRibbon for consistency
      const colorToUse = ribbonGlowColor;
      const rgbColor = hexToRgb(colorToUse);
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
          console.error('[PrimaryActionsModal] Error tinting image:', error);
        }
        };
        img.src = icon.url;
      });
    }
  }, [ribbonGlowColor, useAdaptiveColor, savedIcons]);

  useEffect(() => {
    if (isOpen) {
      if (installedApps.length === 0 && !appsLoading) {
        fetchInstalledApps();
      }
      if (uwpApps.length === 0 && !uwpLoading) {
        fetchUwpApps();
      }
      if (steamGames.length === 0 && !steamLoading) {
        fetchSteamGames(customSteamPath);
      }
      if (epicGames.length === 0 && !epicLoading) {
        fetchEpicGames();
      }
    }
  }, [isOpen, installedApps.length, appsLoading, uwpApps.length, uwpLoading, steamGames.length, steamLoading, epicGames.length, epicLoading, fetchInstalledApps, fetchUwpApps, fetchSteamGames, fetchEpicGames, customSteamPath]);

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

  const getIconColor = () => {
    if (useAdaptiveColor) {
      return ribbonGlowColor;
    }
    return '#0099ff';
  };

  const getIconFilter = () => {
    if (useWiiGrayFilter) {
      return 'grayscale(100%) brightness(0.6) contrast(1.2)';
    }
    return 'none';
  };

  const getImageSource = (originalUrl) => {
    if (useAdaptiveColor && tintedImages[originalUrl]) {
      return tintedImages[originalUrl];
    }
    return originalUrl;
  };

  // Helper function to convert hex or RGB color to RGB array
  const hexToRgb = (color) => {
    // Handle undefined or null values
    if (!color || typeof color !== 'string') {
      return [0, 153, 255]; // Default blue color
    }
    
    // Handle RGB format (e.g., "rgb(255, 0, 0)")
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      return [parseInt(r, 10), parseInt(g, 10), parseInt(b, 10)];
    }
    
    // Handle hex format
    const hex = color.replace('#', '');
    
    // Validate hex format
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return [0, 153, 255]; // Default blue color
    }
    
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
      const colorToUse = ribbonGlowColor;
      const rgbColor = hexToRgb(colorToUse);
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
          console.error('[PrimaryActionsModal] Error tinting image:', error);
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
    };
    
    onSave(saveData);
  };

  // --- Section Renderers ---
  


  function renderIconSection() {
    return (
      <>
        <WRadioGroup
          options={[
            { value: 'text', label: 'Text' },
            { value: 'icon', label: 'Icon (PNG)' }
          ]}
          value={type}
          onChange={setType}
          className="mb-4"
        />
        {type === 'text' ? (
          <>
            <WInput
              type="text"
              placeholder="Button text"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={16}
              className="mb-3"
            />
            {/* Font Selection for Text */}
            <div className="mb-3">
              <Text variant="body" className="font-medium mb-2">Text Font</Text>
              <WSelect
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'digital', label: 'DigitalDisplayRegular-ODEO' }
                ]}
                value={textFont}
                onChange={setTextFont}
              />
            </div>
          </>
        ) : (
          <>
            {/* Built-in Icons Section */}
            <div className="mb-4">
              <Text variant="body" className="font-medium mb-2">Built-in Icons:</Text>
              <div className="flex gap-2 flex-wrap">
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
            <Button
              variant="primary"
              onClick={handleUploadIcon}
              disabled={iconsUploading}
              className="mb-4"
            >
              {iconsUploading ? 'Uploading...' : 'Upload New Icon'}
            </Button>
            {iconsUploadError && (
              <Text variant="caption" className="text-red-500 mb-2">{iconsUploadError}</Text>
            )}
            {/* Saved Icons Section */}
            <div className="mb-3">
              <Text variant="body" className="font-medium mb-2">Your saved icons:</Text>
              {iconsLoading ? (
                <Text variant="caption" className="text-gray-500 mb-3">Loading saved icons...</Text>
              ) : savedIcons.length > 0 ? (
                <div className="flex gap-3 flex-wrap">
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
                <Text variant="caption" className="text-gray-500 mb-3">No saved icons yet.</Text>
              )}
            </div>
          </>
        )}
      </>
    );
  }

  const [tintedImages, setTintedImages] = useState({});

  if (!isOpen) return null;

  return (
    <WBaseModal
      title={isPresetsButton ? "Customize Presets Button" : isAccessoryButton ? "Customize Accessory Button" : "Primary Actions"}
      onClose={onClose}
      maxWidth="700px"
      footerContent={({ handleClose }) => (
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => { 
            if (isPresetsButton || isAccessoryButton || validatePath()) { 
              handleSave();
              handleClose(); 
            } 
          }}>Save</Button>
        </div>
      )}
    >
      {/* Icon Selection/Upload Card */}
      <Card
        title={isPresetsButton ? "Presets Button Icon" : isAccessoryButton ? "Accessory Button Icon" : "Channel Icon"}
        separator
        desc={isPresetsButton 
          ? "Choose or upload a custom icon for the presets button. This button opens the presets modal when clicked."
          : isAccessoryButton
          ? "Choose or upload a custom icon for the accessory button. This button can be configured to launch apps or URLs."
          : "Choose or upload a custom icon for this channel. PNG recommended for best results."
        }
        className="mb-5"
      >
        <div className="mt-3">
          {/* Icon selection/upload UI here */}
          {renderIconSection && renderIconSection()}
        </div>
      </Card>
      {/* Icon Color Settings Card - Only show when using icon and not presets button or accessory button */}
      {type === 'icon' && !isPresetsButton && !isAccessoryButton && (
        <Card
          title="Icon Color Settings"
          separator
          className="mb-5"
        >
                  <div className="mb-4">
          <WToggle
            checked={useWiiGrayFilter}
            onChange={handleWiiGrayFilterToggle}
            label="Use Wii Button Color Filter"
          />
          <div className="ml-14 mt-1">
            <Text variant="caption" className="text-gray-600">
              Make the icon Wii gray to match the classic Wii button style.
            </Text>
          </div>
        </div>
        
        <div>
          <WToggle
            checked={useAdaptiveColor}
            onChange={handleAdaptiveColorToggle}
            label="Use Adaptive Color"
          />
          <div className="ml-14 mt-1">
            <Text variant="caption" className="text-gray-600">
              Make the icon color match the ribbon glow color ({ribbonGlowColor}).
            </Text>
          </div>
        </div>
        </Card>
      )}

      {/* Unified App Path Card - Only show for non-presets buttons */}
      {!isPresetsButton && (
        <Card
          title="Unified App Path (NEW)"
          separator
          desc="NEW: Unified app search that consolidates all app types (EXE, Steam, Epic, Microsoft Store) into a single interface."
          className="mb-5"
        >
                  <div className="mt-3">
          <UnifiedAppPathCard
              key={`unified-app-path-${buttonIndex}-${isOpen}`} // Force remount when button or modal changes
              value={{
                launchType: actionType === 'url' ? 'url' : 'application',
                appName: appName,
                path: action,
                selectedApp: unifiedApps?.selectedApp || null // Pass the selected app from consolidated store
              }}
              onChange={(config) => {
                if (config.launchType === 'url') {
                  setActionType('url');
                  setAction(config.path || '');
                  setAppName('');
                } else {
                  // Map app type to action type
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
                  }
                  setActionType(newActionType);
                  setAction(config.path || '');
                  if (config.selectedApp) {
                    setAppName(config.selectedApp.name);
                  }
                }
              }}
            />
          </div>
        </Card>
      )}

      {/* Hover Effect Card - Show for all buttons */}
      <Card
        title="Hover Effect"
        separator
        desc="Choose how the button looks when you hover over it."
        className="mb-5"
      >
        <div className="mt-3">
          {/* Border Effect Option */}
          <div className="mb-3">
            <WRadioGroup
              options={[
                { value: 'border', label: 'Border Effect' },
                { value: 'glow', label: 'Glow Effect' }
              ]}
              value={useGlowEffect ? 'glow' : 'border'}
              onChange={(value) => setUseGlowEffect(value === 'glow')}
              className="mb-3"
            />
            
            <div className="ml-6">
              <WToggle
                checked={useAdaptiveColor}
                onChange={(checked) => setUseAdaptiveColor(checked)}
                label="Use adaptive color (matches ribbon glow)"
              />
            </div>
          </div>
          
          {/* Glow Effect Settings */}
          {useGlowEffect && (
            <div className="ml-6 mt-2">
              <div className="flex items-center gap-3 mb-2">
                <Text variant="small" className="text-gray-600 min-w-[60px]">Strength:</Text>
                <Slider
                  min={5}
                  max={50}
                  value={glowStrength}
                  onChange={setGlowStrength}
                  className="flex-1"
                />
                <Text variant="small" className="text-gray-600 min-w-[30px]">{glowStrength}px</Text>
              </div>
            </div>
          )}
        </div>
      </Card>
      {/* Glass Effect Card - Show for all buttons */}
      <Card
        title="Glass Effect"
        separator
        desc="Apply a glass morphism effect to the button background. Text and icons will appear above the glass effect."
        headerActions={
          <WToggle
            checked={useGlassEffect}
            onChange={(checked) => setUseGlassEffect(checked)}
          />
        }
        className="mb-5"
      >
        {useGlassEffect && (
          <div className="mt-3">
            {/* Glass Opacity */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <Text variant="small" className="text-gray-600">Glass Opacity</Text>
                <Text variant="small" className="text-gray-600">{Math.round(glassOpacity * 100)}%</Text>
              </div>
              <Slider
                min={0.05}
                max={0.5}
                step={0.01}
                value={glassOpacity}
                onChange={setGlassOpacity}
              />
            </div>
            
            {/* Glass Blur */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <Text variant="small" className="text-gray-600">Glass Blur</Text>
                <Text variant="small" className="text-gray-600">{glassBlur}px</Text>
              </div>
              <Slider
                min={0.5}
                max={8}
                step={0.1}
                value={glassBlur}
                onChange={setGlassBlur}
              />
            </div>
            
            {/* Glass Border Opacity */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <Text variant="small" className="text-gray-600">Border Opacity</Text>
                <Text variant="small" className="text-gray-600">{Math.round(glassBorderOpacity * 100)}%</Text>
              </div>
              <Slider
                min={0.1}
                max={1}
                step={0.05}
                value={glassBorderOpacity}
                onChange={setGlassBorderOpacity}
              />
            </div>
            
            {/* Glass Shine Opacity */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <Text variant="small" className="text-gray-600">Shine Opacity</Text>
                <Text variant="small" className="text-gray-600">{Math.round(glassShineOpacity * 100)}%</Text>
              </div>
              <Slider
                min={0.1}
                max={1}
                step={0.05}
                value={glassShineOpacity}
                onChange={setGlassShineOpacity}
              />
            </div>
          </div>
        )}
        </Card>
    </WBaseModal>
  );
}

export default PrimaryActionsModal; 