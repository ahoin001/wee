import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './ChannelModal.css';
import ImageSearchModal from './ImageSearchModal';
import ResourceUsageIndicator from './ResourceUsageIndicator';
import Button from '../ui/Button';
// Remove unused imports related to old fetching/caching logic
// import { loadGames, clearGamesCache, searchGames, getLastUpdated, getLastError } from '../utils/steamGames';
import AppPathSectionCard from './AppPathSectionCard';
import useAppLibraryStore from '../utils/useAppLibraryStore';
import { useCallback } from 'react';
import Card from '../ui/Card';
import Text from '../ui/Text';

const channelsApi = window.api?.channels;

function ChannelModal({ channelId, onClose, onSave, currentMedia, currentPath, currentType, currentHoverSound, currentAsAdmin, currentAnimatedOnHover, currentKenBurnsEnabled, currentKenBurnsMode }) {
  const [media, setMedia] = useState(currentMedia);
  const [path, setPath] = useState(currentPath || '');
  const [type, setType] = useState(currentType || 'exe');
  const [pathError, setPathError] = useState('');
  
  // Multi-image gallery state for Ken Burns slideshow
  const [imageGallery, setImageGallery] = useState(currentMedia?.gallery || []);
  const [galleryMode, setGalleryMode] = useState(false); // FEATURE NOT READY: Gallery disabled
  const [asAdmin, setAsAdmin] = useState(currentAsAdmin);
  const fileInputRef = useRef();
  const galleryFileInputRef = useRef();
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
  
  // Ken Burns settings
  const [kenBurnsEnabled, setKenBurnsEnabled] = useState(currentKenBurnsEnabled);
  // FEATURE NOT READY: If slideshow mode was set, default to hover for better single image experience
  const [kenBurnsMode, setKenBurnsMode] = useState(
    currentKenBurnsMode === 'slideshow' ? 'hover' : currentKenBurnsMode
  );
  
  const [gameQuery, setGameQuery] = useState('');
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false);
  const [gameType, setGameType] = useState(type || 'exe'); // 'exe', 'url', 'steam', 'epic'
  const [appQuery, setAppQuery] = useState('');
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);

  // Zustand store selectors
  const {
    installedApps, appsLoading, appsError, fetchInstalledApps, rescanInstalledApps,
    steamGames, steamLoading, steamError, fetchSteamGames, rescanSteamGames,
    epicGames, epicLoading, epicError, fetchEpicGames, rescanEpicGames,
    uwpApps, uwpLoading, uwpError, fetchUwpApps, rescanUwpApps,
    customSteamPath, setCustomSteamPath
  } = useAppLibraryStore();

  // Fuzzy search for apps
  const appResults = (type === 'exe' && appQuery && installedApps.length > 0)
    ? installedApps.filter(a => a.name.toLowerCase().includes(appQuery.toLowerCase())).slice(0, 10)
    : [];

  // Fuzzy search for games
  const installedGames = (gameType === 'steam') ? steamGames : (gameType === 'epic' ? epicGames : []);
  const gameResults = (['steam', 'epic'].includes(gameType) && gameQuery && installedGames.length > 0)
    ? installedGames.filter(g => g.name.toLowerCase().includes(gameQuery.toLowerCase())).slice(0, 10)
    : [];

  // Fuzzy search for UWP
  const [uwpQuery, setUwpQuery] = useState('');
  const [uwpDropdownOpen, setUwpDropdownOpen] = useState(false);
  const filteredUwpApps = uwpApps.filter(app =>
    app.name.toLowerCase().includes(uwpQuery.toLowerCase()) ||
    app.appId.toLowerCase().includes(uwpQuery.toLowerCase())
  );

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

  const handleFileSelect = async (file) => {
    if (file) {
      // Create temporary blob URL for immediate preview
      const tempUrl = URL.createObjectURL(file);
      setMedia({ url: tempUrl, type: file.type, name: file.name, loading: true });
      
      try {
        // Convert file to base64 and save to persistent storage
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // Save to persistent storage using wallpapers API
        const result = await window.api.wallpapers.saveFile({ 
          filename: file.name,
          data: base64Data
        });
        
        if (result.success) {
          // Update with persistent URL and clean up temp URL
          setMedia({ url: result.url, type: file.type, name: file.name, loading: false });
          URL.revokeObjectURL(tempUrl);
        } else {
          console.error('Failed to save media file:', result.error);
          // Keep blob URL as fallback but mark as temporary
          setMedia({ url: tempUrl, type: file.type, name: file.name, loading: false, temporary: true });
        }
      } catch (error) {
        console.error('Error saving media file:', error);
        // Keep blob URL as fallback but mark as temporary
        setMedia({ url: tempUrl, type: file.type, name: file.name, loading: false, temporary: true });
      }
    }
  };

  const handleGalleryFilesSelect = async (files) => {
    if (files && files.length > 0) {
      try {
        // Convert FileList to Array
        const fileArray = Array.from(files);
        
        // Create temporary entries with loading state
        const tempImages = fileArray.map(file => ({
          url: URL.createObjectURL(file), // Temporary URL for preview
          type: file.type,
          name: file.name,
          id: `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          loading: true // Indicate this is being processed
        }));
        
        // Add temporary images to gallery for immediate preview
        setImageGallery(prev => [...prev, ...tempImages]);
        
        // Convert files to base64 and save to persistent storage
        const persistentImages = [];
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const tempImage = tempImages[i];
          
          try {
            // Convert file to base64
            const base64Data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                // Remove the "data:image/xxx;base64," prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            
            // Save to persistent storage using wallpapers API
            const result = await window.api.wallpapers.saveFile({ 
              filename: file.name,
              data: base64Data
            });
            
            if (result.success) {
              persistentImages.push({
                url: result.url, // userdata:// URL
                type: file.type,
                name: file.name,
                id: tempImage.id,
                loading: false
              });
            } else {
              console.error('Failed to save gallery image:', result.error);
              // Keep the blob URL as fallback
              persistentImages.push({
                ...tempImage,
                loading: false,
                error: 'Failed to save'
              });
            }
          } catch (error) {
            console.error('Error saving gallery image:', error);
            // Keep the blob URL as fallback
            persistentImages.push({
              ...tempImage,
              loading: false,
              error: error.message
            });
          }
        }
        
        // Replace temporary images with persistent ones
        setImageGallery(prev => {
          const newGallery = [...prev];
          // Remove the temporary images and add persistent ones
          tempImages.forEach(tempImg => {
            const index = newGallery.findIndex(img => img.id === tempImg.id);
            if (index !== -1) {
              const persistentImg = persistentImages.find(img => img.id === tempImg.id);
              if (persistentImg) {
                newGallery[index] = persistentImg;
                // Clean up blob URL
                if (tempImg.url.startsWith('blob:')) {
                  URL.revokeObjectURL(tempImg.url);
                }
              }
            }
          });
          return newGallery;
        });
        
      } catch (error) {
        console.error('Error processing gallery files:', error);
        // Fallback to blob URLs
        const newImages = Array.from(files).map(file => ({
          url: URL.createObjectURL(file),
          type: file.type,
          name: file.name,
          id: `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          error: 'Could not save persistently'
        }));
        setImageGallery(prev => [...prev, ...newImages]);
      }
    }
  };

  const handleRemoveGalleryImage = (imageId) => {
    setImageGallery(prev => prev.filter(img => img.id !== imageId));
  };

  const handleReorderGalleryImages = (startIndex, endIndex) => {
    setImageGallery(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
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
    } else if (type === 'epic') {
      // Validate Epic URI format
      if (path.trim().startsWith('com.epicgames.launcher://apps/')) {
        setPathError('');
        return true;
      } else {
        setPathError('Please enter a valid Epic URI (e.g., com.epicgames.launcher://apps/Fortnite?action=launch&silent=true)');
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

  const handleGameResultClick = (game) => {
    console.log('[ChannelModal] handleGameResultClick called with game:', game);
    console.log('[ChannelModal] gameType:', gameType);
    
    let uri = '';
    if (gameType === 'steam') {
      uri = `steam://rungameid/${game.appid}`;
      console.log('[ChannelModal] Generated Steam URI:', uri);
    } else if (gameType === 'epic') {
      // Epic Games Launcher URI format: com.epicgames.launcher://apps/[AppName]?action=launch&silent=true
      // Alternative format: com.epicgames.launcher://apps/[AppName]?action=launch
      uri = `com.epicgames.launcher://apps/${game.appName}?action=launch&silent=true`;
      console.log('[ChannelModal] Generated Epic URI:', uri);
    }
    
    console.log('[ChannelModal] Setting path to:', uri);
    setPath(uri);
    setGameQuery(game.name);
    setGameDropdownOpen(false);
    setPathError('');
  };

  // Refactored handleGameRefresh
  const handleGameRefresh = useCallback(async () => {
    try {
      if (gameType === 'steam') {
        await rescanSteamGames(customSteamPath);
      } else if (gameType === 'epic') {
        await rescanEpicGames();
      }
    } catch (err) {
      console.error('Error during rescan:', err);
      // Optionally: show a toast/notification
    }
  }, [gameType, customSteamPath, rescanSteamGames, rescanEpicGames]);

  const handlePickSteamFolder = async () => {
    const result = await window.api.steam.pickLibraryFolder();
    if (result && result.path) {
      setCustomSteamPath(result.path);
    }
  };

  const handleAppResultClick = (app) => {
    console.log('[ChannelModal] handleAppResultClick called with app:', app);
    
    // Ensure we have a valid path
    if (!app.path) {
      console.error('[ChannelModal] App selected but path is missing:', app);
      setPathError('Selected app has no file path. Please try rescanning apps or manually enter the path.');
      return;
    }
    
    const fullPath = app.args ? `${app.path} ${app.args}` : app.path;
    console.log('[ChannelModal] Setting path to:', fullPath);
    
    setPath(fullPath);
    setAppQuery(app.name);
    setAppDropdownOpen(false);
    setPathError('');
  };

  // On save, use channelsApi.set and reload state
  const handleSave = async (handleClose) => {
    // Validate that we have single media (gallery feature not ready)
    const hasMedia = media;
    if (!validatePath() || !hasMedia || !path.trim()) {
      setShowError(true);
      return;
    }
    
    // Warn about temporary URLs that may not persist after app restart
    if (media && (media.url?.startsWith('blob:') || media.temporary)) {
      console.warn('Saving channel with temporary media URL that may not persist after app restart:', media.url);
    }
    
    setShowError(false);
    
    // Prepare media object (single image only - gallery not ready)
    const mediaObject = media;
      
    const newChannel = {
        media: mediaObject,
        path: path.trim(),
        type,
      asAdmin,
      hoverSound: hoverSoundEnabled && hoverSoundUrl ? { url: hoverSoundUrl, name: hoverSoundName, volume: hoverSoundVolume } : null,
      animatedOnHover: animatedOnHover !== 'global' ? animatedOnHover : undefined,
      kenBurnsEnabled: kenBurnsEnabled !== 'global' ? kenBurnsEnabled : undefined,
      kenBurnsMode: kenBurnsMode !== 'global' ? kenBurnsMode : undefined,
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
    setKenBurnsEnabled(undefined);
    setKenBurnsMode(undefined);
    setImageGallery([]);
    setGalleryMode(false);
    
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

  const renderImageSection = () => {
    // Determine if we should show gallery mode option
    // FEATURE NOT READY: Gallery mode is temporarily disabled
    const showGalleryOption = false;
    
    return (
      <div className="image-section">
        {/* Gallery Mode Toggle - only show when Ken Burns is enabled */}
        {showGalleryOption && (
          <div style={{ marginBottom: 16 }}>
            <Text as="label" size="md" weight={600} style={{ display: 'block', marginBottom: 8 }}>
              Image Mode
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="radio"
                  name="imageMode"
                  checked={!galleryMode}
                  onChange={() => setGalleryMode(false)}
                />
                Single Image
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="radio"
                  name="imageMode"
                  checked={galleryMode}
                  onChange={() => setGalleryMode(true)}
                />
                Image Gallery (slideshow)
              </label>
            </div>
            <Text variant="help" style={{ marginTop: 8 }}>
              {galleryMode 
                ? 'Upload multiple images for Ken Burns slideshow effect. Make sure Ken Burns mode is set to "Always Active" for best results.'
                : 'Use a single image with Ken Burns animation.'}
            </Text>
          </div>
        )}

        {/* Gallery Feature Notice */}
        {!showGalleryOption && (
          <div style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: 8, 
            padding: 12, 
            marginBottom: 16 
          }}>
            <Text size="sm" color="#856404">
              🚧 <strong>Multi-image gallery feature is not ready yet.</strong> Currently focusing on perfecting the single image experience with Ken Burns effects.
            </Text>
          </div>
        )}

        {/* Single Image Mode */}
        {!galleryMode && (
          <>
            {media ? (
              <div className="image-preview">
                {media.loading ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    minHeight: 120, 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 8, 
                    color: '#666',
                    fontSize: 14
                  }}>
                    <span>⏳ Processing image...</span>
                  </div>
                ) : media.temporary ? (
                  <div style={{ position: 'relative' }}>
                    {media && typeof media.type === 'string' && media.type.startsWith('image/') ? (
                      <img src={media.url} alt="Channel preview" />
                    ) : media && typeof media.type === 'string' && media.type.startsWith('video/') ? (
                      <video src={media.url} autoPlay loop muted style={{ maxWidth: '100%', maxHeight: 120 }} />
                    ) : null}
                    <div style={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      backgroundColor: 'rgba(255, 165, 0, 0.9)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      ⚠️ Temporary
                    </div>
                  </div>
                ) : (
                  <>
                    {media && typeof media.type === 'string' && media.type.startsWith('image/') ? (
                      <img src={media.url} alt="Channel preview" />
                    ) : media && typeof media.type === 'string' && media.type.startsWith('video/') ? (
                      <video src={media.url} autoPlay loop muted style={{ maxWidth: '100%', maxHeight: 120 }} />
                    ) : null}
                  </>
                )}
                <button className="remove-image-button" onClick={handleRemoveImage}>
                  Remove
                </button>
              </div>
            ) : (
              <button className="file-button" style={{ background: '#f7fafd', color: '#222', border: '2px solid #b0c4d8', fontWeight: 500 }} onClick={() => setShowImageSearch(true)}>
                Add Channel Image
              </button>
            )}
          </>
        )}

        {/* Gallery Mode - FEATURE NOT READY: Disabled */}
        {false && galleryMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Gallery Grid */}
            {imageGallery.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: 12,
                marginBottom: 12
              }}>
                {imageGallery.map((image, index) => (
                  <div key={image.id} style={{ position: 'relative' }}>
                    <div style={{
                      width: '100%',
                      height: 80,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '2px solid #e0e0e6',
                      background: '#f5f5f5'
                    }}>
                      {image.loading ? (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f0f0f0',
                          color: '#666',
                          fontSize: 12
                        }}>
                          Saving...
                        </div>
                      ) : image.error ? (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#ffe6e6',
                          color: '#cc0000',
                          fontSize: 11,
                          textAlign: 'center',
                          padding: 4
                        }}>
                          {image.error}
                        </div>
                      ) : image.type.startsWith('image/') ? (
                        <img 
                          src={image.url} 
                          alt={`Gallery ${index + 1}`}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }}
                        />
                      ) : image.type.startsWith('video/') ? (
                        <video 
                          src={image.url} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }}
                          muted
                        />
                      ) : null}
                    </div>
                    <button 
                      onClick={() => handleRemoveGalleryImage(image.id)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(220, 53, 69, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        width: 20,
                        height: 20,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                    <div style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500
                    }}>
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Images Button */}
            <button 
              className="file-button" 
              style={{ background: '#f7fafd', color: '#222', border: '2px solid #b0c4d8', fontWeight: 500 }}
              onClick={() => galleryFileInputRef.current?.click()}
            >
              {imageGallery.length === 0 ? 'Add Images for Gallery' : 'Add More Images'}
            </button>

            {/* Gallery Help Text */}
            <Text variant="help">
              {imageGallery.length === 0 
                ? 'Select multiple images to create a Ken Burns slideshow. Images will cycle automatically with smooth transitions.'
                : `${imageGallery.length} image${imageGallery.length !== 1 ? 's' : ''} in gallery. Images will display in order with Ken Burns effects.`}
            </Text>
          </div>
        )}

        {/* File Inputs */}
        <input
          type="file"
          accept="image/*,video/mp4"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <input
          type="file"
          accept="image/*"
          multiple
          ref={galleryFileInputRef}
          onChange={(e) => handleGalleryFilesSelect(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>
    );
  };

  // Gather all relevant state for AppPathSectionCard
  const appPathSectionValue = {
    gameType,
    appQuery,
    appDropdownOpen,
    appResults,
    appsLoading,
    appsError,
    path,
    pathError,
    exeFileInputRef,
    uwpQuery,
    uwpDropdownOpen,
    filteredUwpApps,
    uwpLoading,
    uwpError,
    gameQuery,
    gameDropdownOpen,
    gameResults,
    steamLoading,
    epicLoading,
    steamError,
    epicError,
    customSteamPath,
  };

  const handleAppPathSectionChange = updates => {
    if ('gameType' in updates) { setGameType(updates.gameType); setType(updates.gameType); }
    if ('appQuery' in updates) setAppQuery(updates.appQuery);
    if ('appDropdownOpen' in updates) setAppDropdownOpen(updates.appDropdownOpen);
    if ('path' in updates) setPath(updates.path);
    if ('pathError' in updates) setPathError(updates.pathError);
    if ('uwpQuery' in updates) setUwpQuery(updates.uwpQuery);
    if ('uwpDropdownOpen' in updates) setUwpDropdownOpen(updates.uwpDropdownOpen);
    if ('gameQuery' in updates) setGameQuery(updates.gameQuery);
    if ('gameDropdownOpen' in updates) setGameDropdownOpen(updates.gameDropdownOpen);
  };

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
          <AppPathSectionCard
            value={appPathSectionValue}
            onChange={handleAppPathSectionChange}
            onAppSelect={handleAppResultClick}
            onRescanInstalledApps={rescanInstalledApps}
            onGameResultClick={handleGameResultClick}
            handlePickSteamFolder={handlePickSteamFolder}
            fetchSteamGames={fetchSteamGames}
            handleGameRefresh={handleGameRefresh}
            handleExeFileSelect={handleExeFileSelect}
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
                  onClick={handleGameRefresh}
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
                  onClick={handlePickSteamFolder}
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
                  {gameResults.map(game => (
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
      {pathError && <Text variant="error">{pathError}</Text>}
      <Text variant="help">
        {type === 'exe'
          ? (<>I suggest searching the app in your search bar, right click it - open file location - right click the file and click properties - copy and paste what is in the Target field.<br />Example: C:\Users\ahoin\AppData\Local\Discord\Update.exe --processStart Discord.exe</>)
          : type === 'steam'
            ? (<>Type a Steam game name and select from the list, or paste a Steam URI/AppID directly.<br />Example: steam://rungameid/252950</>)
            : 'Enter the complete URL including https://'}
      </Text>
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

  const renderKenBurnsSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Ken Burns Enabled Setting */}
      <div>
        <Text as="label" size="md" weight={600} style={{ display: 'block', marginBottom: 8 }}>
          Ken Burns Effect
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="radio"
              name="kenBurnsEnabled"
              value="global"
              checked={kenBurnsEnabled === undefined || kenBurnsEnabled === 'global'}
              onChange={() => setKenBurnsEnabled('global')}
            />
            Use global setting
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="radio"
              name="kenBurnsEnabled"
              value="true"
              checked={kenBurnsEnabled === true}
              onChange={() => setKenBurnsEnabled(true)}
            />
            Enable for this channel (override)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="radio"
              name="kenBurnsEnabled"
              value="false"
              checked={kenBurnsEnabled === false}
              onChange={() => setKenBurnsEnabled(false)}
            />
            Disable for this channel (override)
          </label>
        </div>
      </div>

      {/* Ken Burns Mode Setting - only show when enabled */}
      {kenBurnsEnabled === true && (
        <div>
          <Text as="label" size="md" weight={600} style={{ display: 'block', marginBottom: 8 }}>
            Activation Mode
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="radio"
                name="kenBurnsMode"
                value="global"
                checked={kenBurnsMode === undefined || kenBurnsMode === 'global'}
                onChange={() => setKenBurnsMode('global')}
              />
              Use global setting
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="radio"
                name="kenBurnsMode"
                value="hover"
                checked={kenBurnsMode === 'hover'}
                onChange={() => setKenBurnsMode('hover')}
              />
              Hover to activate (override)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="radio"
                name="kenBurnsMode"
                value="autoplay"
                checked={kenBurnsMode === 'autoplay'}
                onChange={() => setKenBurnsMode('autoplay')}
              />
              Always active (override)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5 }}>
              <input
                type="radio"
                name="kenBurnsMode"
                value="slideshow"
                checked={kenBurnsMode === 'slideshow'}
                onChange={() => setKenBurnsMode('slideshow')}
                disabled
              />
              Slideshow mode (override) <span style={{ color: '#dc3545', fontSize: '11px' }}>- Not Ready</span>
            </label>
          </div>
        </div>
      )}

      {/* Helper text */}
      <Text variant="help">
        {kenBurnsEnabled === true 
          ? 'Ken Burns adds cinematic zoom and pan effects to images. Perfect for creating dynamic single-image channels.'
          : kenBurnsEnabled === false
          ? 'Ken Burns effect is disabled for this channel, even if enabled globally.'
          : 'This channel will follow the global Ken Burns setting.'}
      </Text>
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
        <Card title="Channel Image" separator desc="Choose or upload an image, GIF, or MP4 for this channel.">
          {renderImageSection()}
        </Card>
        {/* App Path/URL Card */}
        <Card title="App Path or URL" separator desc="Set the path to an app or a URL to launch when this channel is clicked.">
          <AppPathSectionCard
            value={appPathSectionValue}
            onChange={handleAppPathSectionChange}
            onAppSelect={handleAppResultClick}
            onRescanInstalledApps={rescanInstalledApps}
            onGameResultClick={handleGameResultClick}
            handlePickSteamFolder={handlePickSteamFolder}
            fetchSteamGames={fetchSteamGames}
            handleGameRefresh={handleGameRefresh}
            handleExeFileSelect={handleExeFileSelect}
          />
        </Card>
        {/* Launch Options Card */}
        <Card title="Launch Options" separator desc="Choose how this application should be launched when the channel is clicked.">
          {renderDisplayOptionsSection()}
        </Card>
        {/* Hover Sound Card */}
        <Card
          title="Custom Hover Sound"
          separator
          desc="Set a custom sound to play when hovering over this channel."
          headerActions={
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={hoverSoundEnabled}
                onChange={e => setHoverSoundEnabled(e.target.checked)}
              />
              <span className="slider" />
            </label>
          }
        >
          {hoverSoundEnabled && (
            <div style={{ marginTop: 0 }}>
              {renderHoverSoundSection()}
            </div>
          )}
          {!hoverSoundEnabled && <span style={{ color: '#888' }}>Set a custom sound to play when hovering over this channel.</span>}
        </Card>
        {/* Per-Channel Animation Toggle Card */}
        <Card title="Animation on Hover" separator desc="Override the global setting for this channel. Only play GIFs/MP4s when hovered if enabled.">
          {renderAnimationToggleSection()}
        </Card>

        {/* Ken Burns Effect Card */}
        <Card title="Ken Burns Effect" separator desc="Override the global Ken Burns setting for this channel. Adds cinematic zoom and pan to images.">
          {renderKenBurnsSection()}
        </Card>
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
  currentKenBurnsEnabled: PropTypes.oneOf([true, false, 'global']),
  currentKenBurnsMode: PropTypes.oneOf(['hover', 'autoplay', 'slideshow', 'global'])
};

export default ChannelModal; 