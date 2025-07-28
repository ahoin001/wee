import React, { useState, useRef, useEffect } from 'react';
import BaseModal from './BaseModal';
import AppPathSectionCard from './AppPathSectionCard';
import Button from '../ui/Button';
import Toggle from '../ui/Toggle';
import AdminPanel from './AdminPanel';
import useAppLibraryStore from '../utils/useAppLibraryStore';
import useIconsStore from '../utils/useIconsStore';
import useUIStore from '../utils/useUIStore';

function PrimaryActionsModal({ config, buttonIndex, preavailableIcons = [], ribbonGlowColor = '#0099ff' }) {
  const { showPrimaryActionsModal, closePrimaryActionsModal, savePrimaryAction } = useUIStore();
  
  const isOpen = showPrimaryActionsModal;
  const onClose = closePrimaryActionsModal;
  const [type, setType] = useState(config?.type || 'text');
  const [text, setText] = useState(config?.text || (buttonIndex === 0 ? 'Wii' : ''));
  const [icon, setIcon] = useState(config?.icon || null);
  const [action, setAction] = useState(config?.action || '');
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
  
  // Unified search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [actionType, setActionType] = useState('exe'); // Only 'exe' or 'url' for UI
  const [originalItemType, setOriginalItemType] = useState('exe'); // Store the original type for saving
  const [runAsAdmin, setRunAsAdmin] = useState(false); // Admin mode for exe files
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

  // Unified search results - combines all sources with smart deduplication
  const getUnifiedSearchResults = () => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    console.log(`[UnifiedSearch] Raw search query: "${searchQuery}" -> processed query: "${query}"`);
    
    // Clean the query to remove common suffixes that users might type
    const cleanQuery = query
      .replace(/\s*\(microsoft store\)/i, '')
      .replace(/\s*\(steam\)/i, '')
      .replace(/\s*\(epic\)/i, '')
      .replace(/\s*\(installed\)/i, '')
      .trim();
    
    console.log(`[UnifiedSearch] Cleaned query: "${cleanQuery}"`);
    
    const results = [];
    const seenApps = new Set(); // Track apps we've already added
    
    // Helper function to check if app name is similar (for deduplication)
    const isSimilarApp = (name1, name2) => {
      const clean1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
      const clean2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
      return clean1 === clean2 || clean1.includes(clean2) || clean2.includes(clean1);
    };
    
    // Helper function to add app with deduplication
    const addAppWithDedup = (app, source, displayName, path) => {
      const appKey = app.name.toLowerCase().trim();
      
      // Check if we already have a similar app
      const hasSimilar = Array.from(seenApps).some(seen => isSimilarApp(seen, app.name));
      
      // More lenient deduplication for Steam games - only filter out exact matches
      if (source === 'steam') {
        const exactMatch = Array.from(seenApps).some(seen => seen === appKey);
        if (exactMatch) {
          console.log(`[UnifiedSearch] Skipping Steam game "${app.name}" - exact match found`);
          return;
        }
      } else if (hasSimilar) {
        console.log(`[UnifiedSearch] Skipping ${source} app "${app.name}" - similar app found`);
        return;
      }
      
      seenApps.add(appKey);
      
      // Determine the correct action type based on source
      let actionType = 'exe'; // Default
      if (source === 'steam') {
        actionType = 'steam';
      } else if (source === 'epic') {
        actionType = 'epic';
      } else if (source === 'microsoftstore') {
        actionType = 'microsoftstore';
      }
      
      results.push({
        ...app,
        type: actionType,
        source,
        displayName,
        path
      });
    };
    
    // Search installed apps (highest priority - traditional installs)
    if (installedApps.length > 0) {
      console.log(`[UnifiedSearch] Found ${installedApps.length} installed apps to search through`);
      
      // Debug: Show some installed app names to help with debugging
      const sampleInstalledApps = installedApps.slice(0, 10).map(app => app.name);
      console.log(`[UnifiedSearch] Sample installed apps:`, sampleInstalledApps);
      
      const appMatches = installedApps
        .filter(app => app.name.toLowerCase().includes(cleanQuery))
        .slice(0, 8); // Get more candidates for better deduplication
        
      console.log(`[UnifiedSearch] Installed app matches for "${cleanQuery}":`, appMatches.map(app => app.name));
        
      appMatches.forEach(app => {
        addAppWithDedup(
          app,
          'installed',
          app.name,
          app.args ? `${app.path} ${app.args}` : app.path
        );
      });
    } else {
      console.log(`[UnifiedSearch] No installed apps available (installedApps.length: ${installedApps.length})`);
    }
    
    // Search Steam games
    if (steamGames.length > 0) {
      console.log(`[UnifiedSearch] Found ${steamGames.length} Steam games to search through`);
      
      // Debug: Show some Steam game names to help with debugging
      const sampleSteamGames = steamGames.slice(0, 10).map(game => `${game.name} (${game.appid})`);
      console.log(`[UnifiedSearch] Sample Steam games:`, sampleSteamGames);
      
      // Debug: Look specifically for Marvel Rivals
      const marvelRivalsGames = steamGames.filter(game => 
        game.name.toLowerCase().includes('marvel') || 
        game.name.toLowerCase().includes('rivals') ||
        game.name.toLowerCase().includes('marvel rivals')
      );
      if (marvelRivalsGames.length > 0) {
        console.log(`[UnifiedSearch] Found Marvel Rivals related games:`, marvelRivalsGames.map(game => `${game.name} (${game.appid})`));
      } else {
        console.log(`[UnifiedSearch] No Marvel Rivals found in Steam games`);
      }
      
      // Debug: Show all Steam games that contain "marvel" or "rivals"
      const partialMatches = steamGames.filter(game => 
        game.name.toLowerCase().includes('marvel') || 
        game.name.toLowerCase().includes('rivals')
      );
      if (partialMatches.length > 0) {
        console.log(`[UnifiedSearch] Partial matches for Marvel/Rivals:`, partialMatches.map(game => `${game.name} (${game.appid})`));
      }
      
      const steamMatches = steamGames
        .filter(game => game.name.toLowerCase().includes(cleanQuery))
        .slice(0, 8);
        
      console.log(`[UnifiedSearch] Steam matches for "${cleanQuery}":`, steamMatches.map(game => game.name));
        
      steamMatches.forEach(game => {
        addAppWithDedup(
          game,
          'steam',
          `${game.name} (Steam)`,
          `steam://rungameid/${game.appid}`
        );
      });
    } else {
      console.log(`[UnifiedSearch] No Steam games available (steamGames.length: ${steamGames.length})`);
    }
    
    // Search Epic games
    if (epicGames.length > 0) {
      console.log(`[UnifiedSearch] Found ${epicGames.length} Epic games to search through`);
      
      // Debug: Show some Epic game names to help with debugging
      const sampleEpicGames = epicGames.slice(0, 10).map(game => `${game.name} (${game.appName})`);
      console.log(`[UnifiedSearch] Sample Epic games:`, sampleEpicGames);
      
      const epicMatches = epicGames
        .filter(game => game.name.toLowerCase().includes(cleanQuery))
        .slice(0, 8);
        
      console.log(`[UnifiedSearch] Epic matches for "${cleanQuery}":`, epicMatches.map(game => game.name));
        
      epicMatches.forEach(game => {
        addAppWithDedup(
          game,
          'epic',
          `${game.name} (Epic)`,
          `com.epicgames.launcher://apps/${game.appName}?action=launch&silent=true`
        );
      });
    } else {
      console.log(`[UnifiedSearch] No Epic games available (epicGames.length: ${epicGames.length})`);
    }
    
    // Search Microsoft Store apps (lowest priority - only if not found elsewhere)
    if (uwpApps.length > 0) {
      console.log(`[UnifiedSearch] Found ${uwpApps.length} UWP apps to search through`);
      
      // Debug: Show some UWP app names to help with debugging
      const sampleUwpApps = uwpApps.slice(0, 10).map(app => `${app.name} (${app.appId})`);
      console.log(`[UnifiedSearch] Sample UWP apps:`, sampleUwpApps);
      
      const uwpMatches = uwpApps
        .filter(app => 
          (app.name.toLowerCase().includes(cleanQuery) || app.appId.toLowerCase().includes(cleanQuery)) &&
          // Only include if we don't already have a similar app
          !Array.from(seenApps).some(seen => isSimilarApp(seen, app.name))
        )
        .slice(0, 5);
        
      console.log(`[UnifiedSearch] UWP matches for "${cleanQuery}":`, uwpMatches.map(app => app.name));
        
      uwpMatches.forEach(app => {
        addAppWithDedup(
          app,
          'microsoftstore',
          `${app.name} (Microsoft Store)`,
          app.appId
        );
      });
    } else {
      console.log(`[UnifiedSearch] No UWP apps available (uwpApps.length: ${uwpApps.length})`);
    }
    
    // Sort by relevance (exact matches first, then alphabetical)
    const sortedResults = results.sort((a, b) => {
      const aExact = a.displayName.toLowerCase().startsWith(cleanQuery);
      const bExact = b.displayName.toLowerCase().startsWith(cleanQuery);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.displayName.localeCompare(b.displayName);
    }).slice(0, 10);
    
    // Debug logging for deduplication
    if (searchQuery.trim() && sortedResults.length > 0) {
      console.log(`[UnifiedSearch] Query: "${searchQuery}" - Found ${sortedResults.length} unique results:`, 
        sortedResults.map(r => `${r.displayName} (${r.source})`));
    } else if (searchQuery.trim() && sortedResults.length === 0) {
      console.log(`[UnifiedSearch] Query: "${searchQuery}" - No results found after deduplication`);
    }
    
    return sortedResults;
  };

  const unifiedSearchResults = getUnifiedSearchResults();
  
  // Update state when config changes (important for when modal reopens)
  useEffect(() => {
    console.log('PrimaryActionsModal useEffect triggered:', { 
      hasConfig: !!config, 
      buttonIndex,
      configPowerActions: config?.powerActions?.length || 0
    });
    
    if (config) {
      console.log('PrimaryActionsModal loading config:', config);
      setType(config.type || 'text');
      setText(config.text || (buttonIndex === 0 ? 'Wii' : ''));
      setIcon(config.icon || null);
      setActionType(config.actionType || 'exe');
      setOriginalItemType(config.actionType || 'exe'); // Also set original type
      setAction(config.action || '');
      setPath(config.action || ''); // Sync path with action
      setRunAsAdmin(config.runAsAdmin || false);
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
      console.log('Setting powerActions from config:', config.powerActions?.length || 0, config.powerActions?.map(a => a.name) || []);
      setPowerActions(config.powerActions || []);
    }
  }, [config, buttonIndex]);

  // Fetch saved icons on open
  useEffect(() => {
    if (isOpen) {
      fetchIcons();
    }
  }, [isOpen, fetchIcons]);

  // Fetch app library data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Only fetch if data is not already loaded and not currently loading
      if (installedApps.length === 0 && !appsLoading) {
        fetchInstalledApps();
      }
      // Only fetch if data is not already loaded and not currently loading
      if (uwpApps.length === 0 && !uwpLoading) {
        fetchUwpApps();
      }
      // Only fetch if data is not already loaded and not currently loading
      if (steamGames.length === 0 && !steamLoading) {
        fetchSteamGames(customSteamPath);
      }
      // Only fetch if data is not already loaded and not currently loading
      if (epicGames.length === 0 && !epicLoading) {
        fetchEpicGames();
      }
    }
  }, [isOpen, installedApps.length, appsLoading, uwpApps.length, uwpLoading, steamGames.length, steamLoading, epicGames.length, epicLoading, fetchInstalledApps, fetchUwpApps, fetchSteamGames, fetchEpicGames, customSteamPath]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownOpen) {
        // Check if the click is outside the search input and dropdown
        const searchContainer = event.target.closest('.search-container');
        if (!searchContainer) {
          setSearchDropdownOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, searchDropdownOpen]);

  // Sync dropdown open state with search results
  useEffect(() => {
    if (searchQuery && unifiedSearchResults.length > 0) {
      setSearchDropdownOpen(true);
    } else {
      setSearchDropdownOpen(false);
    }
  }, [searchQuery, unifiedSearchResults.length]);

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
    if (!path.trim()) {
      setPathError('');
      return true;
    }
    
    if (actionType === 'url') {
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
    } else if (actionType === 'exe') {
      // Accept any path that contains .exe, steam://, epic://, or microsoft store app IDs
      const trimmedPath = path.trim();
      if (/\.exe(\s+.*)?$/i.test(trimmedPath) || 
          /\.exe/i.test(trimmedPath) ||
          trimmedPath.startsWith('steam://') ||
          trimmedPath.startsWith('com.epicgames.launcher://') ||
          trimmedPath.includes('!') ||
          trimmedPath.startsWith('\\')) {
        setPathError('');
        return true;
      } else {
        setPathError('Please enter a valid file path, Steam URI, Epic URI, or Microsoft Store AppID');
        return false;
      }
    }
    
    setPathError('');
    return true;
  };

  const handleSave = () => {
    console.log('PrimaryActionsModal handleSave called');
    console.log('Current powerActions at save time:', powerActions.length, powerActions.map(a => a.name));
    
    // Check if this is for the presets button
    const isPresetsButton = buttonIndex === "presets";
    
    if (!isPresetsButton && !validatePath()) return;
    
    const saveData = {
      type,
      text: type === 'text' ? text : '',
      icon: type === 'icon' ? icon : null,
      actionType: originalItemType, // Use the original item type for saving
      action: path,           // Use path for action
      runAsAdmin: actionType === 'exe' ? runAsAdmin : false, // Admin mode for exe files
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
    
    console.log('PrimaryActionsModal saveData:', saveData);
    console.log('Calling savePrimaryAction with powerActions:', saveData.powerActions?.length || 0);
    savePrimaryAction(saveData, buttonIndex);
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
                    border: icon === 'palette' ? '2.5px solid #0099ff' : '1.5px solid #ccc',
                    borderRadius: 8,
                    padding: 8,
                    background: icon === 'palette' ? '#e6f7ff' : '#fff',
                    boxShadow: icon === 'palette' ? '0 0 0 2px #b0e0ff' : '0 1px 4px #0001',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border 0.18s, box-shadow 0.18s',
                  }}
                  onClick={() => setIcon('palette')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    border: icon === 'star' ? '2.5px solid #0099ff' : '1.5px solid #ccc',
                    borderRadius: 8,
                    padding: 8,
                    background: icon === 'star' ? '#e6f7ff' : '#fff',
                    boxShadow: icon === 'star' ? '0 0 0 2px #b0e0ff' : '0 1px 4px #0001',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border 0.18s, box-shadow 0.18s',
                  }}
                  onClick={() => setIcon('star')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                </button>
                
                {/* Heart Icon */}
                <button
                  type="button"
                  style={{
                    border: icon === 'heart' ? '2.5px solid #0099ff' : '1.5px solid #ccc',
                    borderRadius: 8,
                    padding: 8,
                    background: icon === 'heart' ? '#e6f7ff' : '#fff',
                    boxShadow: icon === 'heart' ? '0 0 0 2px #b0e0ff' : '0 1px 4px #0001',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border 0.18s, box-shadow 0.18s',
                  }}
                  onClick={() => setIcon('heart')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Upload New Icon Button */}
            <button
              className="file-button"
              style={{ marginBottom: 18, fontWeight: 500, padding: '8px 18px', fontSize: 15, background: iconsUploading ? '#bbb' : '#0099ff', color: '#fff', cursor: iconsUploading ? 'not-allowed' : 'pointer' }}
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

  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const handleAdminPanelSave = (adminConfig) => {
    console.log('PrimaryActionsModal handleAdminPanelSave called');
    console.log('Received adminConfig:', adminConfig);
    console.log('Current powerActions before update:', powerActions.length, powerActions.map(a => a.name));
    console.log('New powerActions from adminConfig:', adminConfig.powerActions?.length || 0, adminConfig.powerActions?.map(a => a.name) || []);
    setPowerActions(adminConfig.powerActions || []);
    console.log('PrimaryActionsModal powerActions state updated');
  };

  // Unified app path section renderer
  const renderAppPathSection = () => {
    return (
      <div>
        {/* Action Type Selection */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Action Type:</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="radio"
                name="actionType"
                value="exe"
                checked={actionType === 'exe'}
                onChange={() => setActionType('exe')}
              />
              <span>Application or Game</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="radio"
                name="actionType"
                value="url"
                checked={actionType === 'url'}
                onChange={() => setActionType('url')}
              />
              <span>Website URL</span>
            </label>
          </div>
        </div>

        {/* Unified Search Input */}
        {actionType === 'exe' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Search Applications & Games:</div>
            <div className="search-container" style={{ position: 'relative' }}>
              <input
                type="text"
                className="text-input"
                placeholder="Search for apps, games, Steam games, Epic games, Microsoft Store apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (unifiedSearchResults.length > 0) {
                    setSearchDropdownOpen(true);
                  }
                }}
                onBlur={() => {
                  // Use a small delay to allow the dropdown click to register first
                  setTimeout(() => setSearchDropdownOpen(false), 150);
                }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              />
              
              {/* Rescan buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => rescanSteamGames(customSteamPath)}
                  disabled={steamLoading}
                  style={{
                    background: steamLoading ? '#ccc' : '#0099ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: steamLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: steamLoading ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (!steamLoading) {
                      e.currentTarget.style.background = '#007acc';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!steamLoading) {
                      e.currentTarget.style.background = '#0099ff';
                    }
                  }}
                >
                  {steamLoading ? '🔄 Scanning Steam...' : 'Rescan Steam'}
                </button>
                
                <button
                  type="button"
                  onClick={() => rescanEpicGames()}
                  disabled={epicLoading}
                  style={{
                    background: epicLoading ? '#ccc' : '#0099ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: epicLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: epicLoading ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (!epicLoading) {
                      e.currentTarget.style.background = '#007acc';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!epicLoading) {
                      e.currentTarget.style.background = '#0099ff';
                    }
                  }}
                >
                  {epicLoading ? '🔄 Scanning Epic...' : 'Rescan Epic'}
                </button>
                
                <button
                  type="button"
                  onClick={() => rescanUwpApps()}
                  disabled={uwpLoading}
                  style={{
                    background: uwpLoading ? '#ccc' : '#0099ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: uwpLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: uwpLoading ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (!uwpLoading) {
                      e.currentTarget.style.background = '#007acc';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!uwpLoading) {
                      e.currentTarget.style.background = '#0099ff';
                    }
                  }}
                >
                  {uwpLoading ? '🔄 Scanning Store...' : 'Rescan Store'}
                </button>
              </div>
              
              {/* Search Results Dropdown */}
              {searchDropdownOpen && unifiedSearchResults.length > 0 && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '0 0 6px 6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                  onMouseDown={(e) => {
                    // Prevent the dropdown from closing when clicking inside it
                    e.stopPropagation();
                  }}
                >
                  {unifiedSearchResults.map((item, index) => (
                    <div
                      key={`${item.source}-${index}`}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: index < unifiedSearchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSearchResultClick(item);
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>
                        {item.source === 'steam' && '🎮'}
                        {item.source === 'epic' && '🎯'}
                        {item.source === 'microsoftstore' && '🏪'}
                        {item.source === 'installed' && '💻'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{item.displayName}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {item.source === 'steam' && 'Steam Game'}
                          {item.source === 'epic' && 'Epic Game'}
                          {item.source === 'microsoftstore' && 'Microsoft Store App'}
                          {item.source === 'installed' && 'Installed Application'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Mode Toggle - Only show for exe files */}
        {actionType === 'exe' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={runAsAdmin}
                  onChange={(e) => setRunAsAdmin(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontWeight: 500 }}>Run as Administrator</span>
              </label>
              <span style={{ fontSize: 12, color: '#666' }}>
                (Opens the application with elevated privileges)
              </span>
            </div>
          </div>
        )}

        {/* Manual Path Input */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>
            {actionType === 'exe' ? 'Application Path:' : 'Website URL:'}
          </div>
          <input
            type="text"
            className="text-input"
            placeholder={actionType === 'exe' 
              ? "Enter path to executable, Steam URI, Epic URI, or Microsoft Store AppID..." 
              : "Enter website URL (e.g., https://example.com)..."}
            value={path}
            onChange={(e) => {
              setPath(e.target.value);
              setAction(e.target.value);
            }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
          />
          {pathError && (
            <div style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>{pathError}</div>
          )}
        </div>

        {/* File Browser Button for EXE */}
        {actionType === 'exe' && (
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => exeFileInputRef.current?.click()}
              style={{
                background: '#0099ff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#007acc';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#0099ff';
              }}
            >
              Browse Files
            </button>
            <input
              ref={exeFileInputRef}
              type="file"
              accept=".exe"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPath(file.path);
                  setAction(file.path);
                  setPathError('');
                }
              }}
            />
          </div>
        )}
      </div>
    );
  };

  // Unified search result handler
  const handleSearchResultClick = (item) => {
    setPath(item.path);
    setAction(item.path); // Also update action for saving
    setOriginalItemType(item.type); // Store the original type for saving
    
    // Map the item type to our simplified action type system
    // All games and apps should be treated as 'exe' for the UI
    if (item.type === 'steam' || item.type === 'epic' || item.type === 'microsoftstore' || item.type === 'exe') {
      setActionType('exe');
    } else if (item.type === 'url') {
      setActionType('url');
    }
    
    setSearchQuery(item.displayName);
    setSearchDropdownOpen(false);
  };




  if (!isOpen) return null;

  // Check if this is for the presets button or accessory button
  const isPresetsButton = buttonIndex === "presets";
  const isAccessoryButton = buttonIndex === "accessory";

  return (
    <BaseModal
      title={isPresetsButton ? "Customize Presets Button" : isAccessoryButton ? "Customize Accessory Button" : "Primary Actions"}
      onClose={onClose}
      maxWidth="480px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={() => { 
            if (isPresetsButton || validatePath()) { 
              handleSave();
              handleClose(); 
            } 
          }} style={{ minWidth: 90 }}>Save</button>
        </div>
      )}
    >
      {/* Icon Selection/Upload Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">{isPresetsButton ? "Presets Button Icon" : isAccessoryButton ? "Accessory Button Icon" : "Channel Icon"}</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          {isPresetsButton 
            ? "Choose or upload a custom icon for the presets button. This button opens the presets modal when clicked."
            : isAccessoryButton
            ? "Choose or upload a custom icon for the accessory button. This button can be configured to launch any app or action."
            : "Choose or upload a custom icon for this channel. PNG recommended for best results."
          }
          <div style={{ marginTop: 14 }}>
            {/* Icon selection/upload UI here */}
            {renderIconSection && renderIconSection()}
          </div>
        </div>
      </div>
      {/* Wii Gray Filter Card - Only show when using icon and not presets button */}
      {type === 'icon' && !isPresetsButton && (
        <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="wee-card-header">
            <span className="wee-card-title">Use Wii Button Color Filter</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={useWiiGrayFilter}
                onChange={(e) => setUseWiiGrayFilter(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            Make the icon Wii gray to match the classic Wii button style.
          </div>
        </div>
      )}
      {/* Admin Mode Card - Only show for left button (index 0) */}
      {buttonIndex === 0 && !isPresetsButton && (
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
              <button
                type="button"
                onClick={() => setShowAdminPanel(true)}
                style={{
                  background: '#0099ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#007acc';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#0099ff';
                }}
              >
                Open Admin Panel
              </button>
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

      {/* App Path/URL Card - Only show for non-presets buttons when not in admin mode */}
      {!isPresetsButton && !adminMode && (
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
      )}
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