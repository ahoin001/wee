import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import './ChannelModal.css';
import ImageSearchModal from './ImageSearchModal';
import ResourceUsageIndicator from './ResourceUsageIndicator';
import WButton from '../ui/WButton';
import WToggle from '../ui/WToggle';
import WRadioGroup from '../ui/WRadioGroup';
// Remove unused imports related to old fetching/caching logic
// import { loadGames, clearGamesCache, searchGames, getLastUpdated, getLastError } from '../utils/steamGames';
import UnifiedAppPathCard from './UnifiedAppPathCard';
import useAppLibraryStore from '../utils/useAppLibraryStore';
import useUnifiedAppStore from '../utils/useUnifiedAppStore';
import { preloadMediaLibrary, findGameMedia, getCacheStatus, getCachedMediaLibrary, getAllMatchingMedia } from '../utils/mediaLibraryCache';
import { useCallback } from 'react';
import Card from '../ui/Card';
import Text from '../ui/Text';

const channelsApi = window.api?.channels;

function ChannelModal({ channelId, onClose, onSave, currentMedia, currentPath, currentType, currentHoverSound, currentAsAdmin, currentAnimatedOnHover, currentKenBurnsEnabled, currentKenBurnsMode, isOpen = true }) {
  const [media, setMedia] = useState(currentMedia);
  const [path, setPath] = useState(currentPath || '');
  const [type, setType] = useState(currentType || 'exe');
  const [pathError, setPathError] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('setup');
  
  // Multi-image gallery state for Ken Burns slideshow
  const [imageGallery, setImageGallery] = useState(currentMedia?.gallery || []);
  const [galleryMode, setGalleryMode] = useState(false); // FEATURE NOT READY: Gallery disabled
  const [asAdmin, setAsAdmin] = useState(currentAsAdmin);
  const fileInputRef = useRef();
  const galleryFileInputRef = useRef();
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
  
  // Selection feedback state
  const [selectedGameFeedback, setSelectedGameFeedback] = useState(null);
  
  // Ken Burns settings
  const [kenBurnsEnabled, setKenBurnsEnabled] = useState(currentKenBurnsEnabled);
  // FEATURE NOT READY: If slideshow mode was set, default to hover for better single image experience
  const [kenBurnsMode, setKenBurnsMode] = useState(
    currentKenBurnsMode === 'slideshow' ? 'hover' : currentKenBurnsMode
  );
  
  // Zustand store selectors (still needed for unified app system)
  const {
    installedApps, appsLoading, appsError, fetchInstalledApps, rescanInstalledApps,
    steamGames, steamLoading, steamError, fetchSteamGames, rescanSteamGames,
    epicGames, epicLoading, epicError, fetchEpicGames, rescanEpicGames,
    uwpApps, uwpLoading, uwpError, fetchUwpApps, rescanUwpApps,
    customSteamPath, setCustomSteamPath
  } = useAppLibraryStore();

  // Clear feedback when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedGameFeedback(null);
    }
  }, [isOpen]);

  // Reset state when channel data changes (when opening modal for different channel)
  useEffect(() => {
    if (isOpen) {
      // console.log('[ChannelModal] Resetting state for channel:', channelId, {
      //   currentMedia,
      //   currentPath,
      //   currentType,
      //   currentAsAdmin,
      //   currentHoverSound,
      //   currentAnimatedOnHover,
      //   currentKenBurnsEnabled,
      //   currentKenBurnsMode
      // });
      
      // Reset all state to match the current channel's data
      setMedia(currentMedia);
      setPath(currentPath || '');
      setType(currentType || 'exe');
      setPathError('');
      setActiveTab('setup');
      setImageGallery(currentMedia?.gallery || []);
      setGalleryMode(false);
      setAsAdmin(currentAsAdmin);
      setShowImageSearch(false);
      
      // Reset hover sound state
      setHoverSound(currentHoverSound || null);
      setHoverSoundName(currentHoverSound ? currentHoverSound.name : '');
      setHoverSoundUrl(currentHoverSound ? currentHoverSound.url : '');
      setHoverSoundVolume(currentHoverSound ? currentHoverSound.volume : 0.7);
      setHoverSoundEnabled(!!currentHoverSound);
      setHoverSoundAudio(null);
      setShowError(false);
      setAnimatedOnHover(currentAnimatedOnHover);
      
      // Reset Ken Burns settings
      setKenBurnsEnabled(currentKenBurnsEnabled);
      setKenBurnsMode(
        currentKenBurnsMode === 'slideshow' ? 'hover' : currentKenBurnsMode
      );
      
      // Clear selection feedback
      setSelectedGameFeedback(null);
      
      // Clear unified app store selection
      useUnifiedAppStore.getState().clearSelection();
    }
  }, [isOpen, channelId, currentMedia, currentPath, currentType, currentAsAdmin, currentHoverSound, currentAnimatedOnHover, currentKenBurnsEnabled, currentKenBurnsMode]);

  // Fetch app library data when modal opens (for unified system)
  useEffect(() => {
    // console.log('[ChannelModal] useEffect triggered - checking data:', {
    //   steamGames: steamGames.length,
    //   steamLoading,
    //   installedApps: installedApps.length,
    //   appsLoading
    // });
    
    // Fetch installed apps if not already loaded
    if (installedApps.length === 0 && !appsLoading) {
      // console.log('[ChannelModal] Fetching installed apps...');
      fetchInstalledApps();
    }
    // Fetch UWP apps if not already loaded
    if (uwpApps.length === 0 && !uwpLoading) {
      // console.log('[ChannelModal] Fetching UWP apps...');
      fetchUwpApps();
    }
    // Fetch Steam games if not already loaded
    if (steamGames.length === 0 && !steamLoading) {
      // console.log('[ChannelModal] Fetching Steam games...');
      fetchSteamGames(customSteamPath);
    } else {
      // console.log('[ChannelModal] Steam games already loaded or loading:', steamGames.length);
    }
    // Fetch Epic games if not already loaded
    if (epicGames.length === 0 && !epicLoading) {
      // console.log('[ChannelModal] Fetching Epic games...');
      fetchEpicGames();
    } else {
      // console.log('[ChannelModal] Epic games already loaded or loading:', epicGames.length);
    }
    
    // Preload media library cache for Epic game thumbnails
    preloadMediaLibrary().then(() => {
      const status = getCacheStatus();
      // console.log('[ChannelModal] Media library cache status after preload:', status);
    });
  }, [installedApps.length, appsLoading, uwpApps.length, uwpLoading, steamGames.length, steamLoading, epicGames.length, epicLoading, fetchInstalledApps, fetchUwpApps, fetchSteamGames, fetchEpicGames, customSteamPath]);

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



  const handleImageSelect = (mediaItem) => {
    // console.log('ChannelModal: handleImageSelect called with:', mediaItem);
    
    // Convert Supabase media item to the format expected by ChannelModal
    const mediaUrl = `https://bmlcydwltfexgbsyunkf.supabase.co/storage/v1/object/public/media-library/${mediaItem.file_url}`;
    
    // Determine MIME type based on file_type
    let mimeType = 'image/png'; // default
    if (mediaItem.file_type === 'gif') {
      mimeType = 'image/gif';
    } else if (mediaItem.file_type === 'video') {
      mimeType = 'video/mp4';
    } else if (mediaItem.mime_type) {
      mimeType = mediaItem.mime_type;
    }
    
    const convertedMedia = { 
      url: mediaUrl, 
      type: mimeType, 
      name: mediaItem.title || mediaItem.file_url,
      isBuiltin: true 
    };
    
    // console.log('ChannelModal: Setting media to:', convertedMedia);
    setMedia(convertedMedia);
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

  // Unified app path change handler
  const handleUnifiedAppPathChange = (config) => {
    if (config.launchType === 'url') {
      setType('url');
      setPath(config.path || '');
    } else {
      // Map app type to channel type
      let newType = 'exe'; // default
      if (config.selectedApp) {
        switch (config.selectedApp.type) {
          case 'steam':
            newType = 'steam';
            break;
          case 'epic':
            newType = 'epic';
            break;
          case 'microsoft':
            newType = 'microsoftstore';
            break;
          case 'exe':
          default:
            newType = 'exe';
            break;
        }
      }
      setType(newType);
      setPath(config.path || '');
    }
  };

  // On save, use channelsApi.set and reload state
  const handleSave = async (handleClose) => {
    if (!validatePath() || !media || !path.trim()) {
      setShowError(true);
      return;
    }

    const newChannel = {
      media,
      path: path.trim(),
      type,
      asAdmin,
      hoverSound: hoverSoundEnabled && hoverSoundUrl ? { url: hoverSoundUrl, name: hoverSoundName, volume: hoverSoundVolume } : null,
      animatedOnHover: animatedOnHover !== 'global' ? animatedOnHover : undefined,
      kenBurnsEnabled: kenBurnsEnabled !== 'global' ? kenBurnsEnabled : undefined,
      kenBurnsMode: kenBurnsMode !== 'global' ? kenBurnsMode : undefined
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

  // Debug logging for save button state
  // console.log('[ChannelModal] Save button debug:', {
  //   hasMedia: !!media,
  //   hasPath: !!path,
  //   pathError,
  //   canSave: canSave
  // });
  
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
      <div className="flex flex-row gap-2">
        <WButton variant="secondary" onClick={handleClose}>Cancel</WButton>
        <WButton 
          variant="danger-secondary" 
          onClick={() => handleClearChannel(handleClose)}
        >
          Clear Channel
        </WButton>
        <WButton 
          variant="primary" 
          onClick={() => handleSave(handleClose)} 
          disabled={!canSave}
          title={saveTooltip}
        >
          Save Channel
        </WButton>
      </div>
      {showError && saveTooltip && (
        <div className="text-red-600 text-sm mt-2 font-medium">{saveTooltip}</div>
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
          <div className="mb-4">
            <Text as="label" size="md" weight={600} className="block mb-2">
              Image Mode
            </Text>
            <WRadioGroup
              options={[
                { value: 'single', label: 'Single Image' },
                { value: 'gallery', label: 'Image Gallery (slideshow)' }
              ]}
              value={galleryMode ? 'gallery' : 'single'}
              onChange={(value) => setGalleryMode(value === 'gallery')}
            />
            <Text variant="help" className="mt-2">
              {galleryMode 
                ? 'Upload multiple images for Ken Burns slideshow effect. Make sure Ken Burns mode is set to "Always Active" for best results.'
                : 'Use a single image with Ken Burns animation.'}
            </Text>
          </div>
        )}

        {/* Gallery Feature Notice */}
        {!showGalleryOption && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
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
                  <div className="flex items-center justify-center min-h-[120px] bg-gray-100 rounded-lg text-gray-600 text-sm">
                    <span>⏳ Processing image...</span>
                  </div>
                ) : media.temporary ? (
                  <div className="relative">
                    {media && typeof media.type === 'string' && (media.type.startsWith('image/') || media.type === 'image') ? (
                      <img src={media.url} alt="Channel preview" />
                    ) : media && typeof media.type === 'string' && (media.type.startsWith('video/') || media.type === 'video' || media.type === 'gif') ? (
                      <video src={media.url} autoPlay loop muted className="max-w-full max-h-[120px]" />
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
                    {media && typeof media.type === 'string' && (media.type.startsWith('image/') || media.type === 'image') ? (
                      <img src={media.url} alt="Channel preview" />
                    ) : media && typeof media.type === 'string' && (media.type.startsWith('video/') || media.type === 'video' || media.type === 'gif') ? (
                      <video src={media.url} autoPlay loop muted style={{ maxWidth: '100%', maxHeight: 120 }} />
                    ) : null}
                  </>
                )}
                <button className="remove-image-button" onClick={handleRemoveImage}>
                  Remove
                </button>
              </div>
            ) : (
              <WButton variant="primary" onClick={() => setShowImageSearch(true)}>
                Add Channel Image
              </WButton>
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
                  <div key={image.id} className="relative">
                    <div className="w-full h-20 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                      {image.loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600 text-xs">
                          Saving...
                        </div>
                      ) : image.error ? (
                        <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs text-center p-1">
                          {image.error}
                        </div>
                      ) : image.type.startsWith('image/') ? (
                        <img 
                          src={image.url} 
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : image.type.startsWith('video/') ? (
                        <video 
                          src={image.url} 
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : null}
                    </div>
                    <button 
                      onClick={() => handleRemoveGalleryImage(image.id)}
                      className="absolute top-1 right-1 bg-red-600/90 text-white border-none rounded w-5 h-5 text-xs cursor-pointer flex items-center justify-center"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs font-medium">
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

  // Unified app path section
  const renderUnifiedAppPathSection = () => (
    <UnifiedAppPathCard
      key={`unified-app-path-${channelId}`} // Force remount when channel changes
      value={{
        launchType: type === 'url' ? 'url' : 'application',
        appName: '', // Will be set by the unified system
        path: path,
        selectedApp: null // Will be set by the unified system
      }}
      onChange={handleUnifiedAppPathChange}
    />
  );

  // State for Epic game media carousel
  const [epicMediaIndexes, setEpicMediaIndexes] = useState({});
  
  // Helper function to show selection feedback
  const showSelectionFeedback = useCallback((gameName, launcher) => {
    setSelectedGameFeedback({
      gameName,
      message: `Added to channel from ${launcher}`,
      timestamp: Date.now()
    });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setSelectedGameFeedback(null);
    }, 3000);
  }, []);
  
  // State for search and pagination
  const [gamesSearchTerm, setGamesSearchTerm] = useState('');
  const [gamesPage, setGamesPage] = useState(0);
  const gamesPerPage = 6;
  
  // State for sorting
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  
  // State for collapsible sections
  const [gamesSectionExpanded, setGamesSectionExpanded] = useState(true);

  // Suggested games section (Steam and Epic games, expandable for other launchers)
  const renderSuggestedGames = () => {

    const realSteamGames = steamGames || [];
    const realEpicGames = epicGames || [];

    // Helper function to get all matching media items for a game
    const getAllMatchingMedia = (gameName) => {
      const mediaLibrary = getCachedMediaLibrary();
      const matches = [];
      
      for (const item of mediaLibrary) {
        const score = fuzzyMatch(gameName, item.title);
        if (score > 0.3) { // Same threshold as findGameMedia
          matches.push({ ...item, score });
        }
      }
      
      // Sort by score (highest first)
      return matches.sort((a, b) => b.score - a.score);
    };
    


    // Helper function for fuzzy matching (copied from mediaLibraryCache.js)
    const fuzzyMatch = (str1, str2) => {
      if (!str1 || !str2) return false;
      
      const normalize = (str) => str.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      const normalized1 = normalize(str1);
      const normalized2 = normalize(str2);
      
      // Exact match
      if (normalized1 === normalized2) return 1.0;
      
      // Contains match
      if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return 0.8;
      }
      
      // Word-based matching
      const words1 = normalized1.split(' ');
      const words2 = normalized2.split(' ');
      
      const commonWords = words1.filter(word => 
        words2.some(word2 => word2.includes(word) || word.includes(word2))
      );
      
      if (commonWords.length > 0) {
        const matchRatio = commonWords.length / Math.max(words1.length, words2.length);
        return matchRatio > 0.5 ? matchRatio : 0;
      }
      
      return 0;
    };

    // Helper function to filter games by search term
    const filterGames = (games, searchTerm) => {
      if (!searchTerm.trim()) return games;
      const term = searchTerm.toLowerCase();
      return games.filter(game => 
        game.name.toLowerCase().includes(term)
      );
    };

    // Helper function to sort games
    const sortGames = (games, order) => {
      return [...games].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (order === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      });
    };
    
    // Helper function to paginate games
    const paginateGames = (games, page, perPage) => {
      const startIndex = page * perPage;
      return games.slice(startIndex, startIndex + perPage);
    };

    // Get filtered and paginated games
    // Remove duplicates from Steam games based on appId (note the capital I)
    const uniqueSteamGames = realSteamGames.filter((game, index, self) => 
      index === self.findIndex(g => g.appId === game.appId)
    );
    
    // For Steam games, be less restrictive - if they're in the list, they're likely installed
    // Only filter out games that are explicitly marked as not installed
    const installedSteamGames = uniqueSteamGames.filter(game => {
      // If installed is explicitly false, exclude it
      if (game.installed === false) return false;
      // Otherwise, include it (installed === true, undefined, or any other value)
      return true;
    });
    
    const installedEpicGames = realEpicGames.filter(game => game.installed !== false);
    
    // Combine all games and add source information
    const allGames = [
      ...installedSteamGames.map(game => ({
        ...game,
        source: 'steam',
        sourceName: 'Steam',
        badgeColor: '#171a21',
        badgeText: 'S'
      })),
      ...installedEpicGames.map(game => ({
        ...game,
        source: 'epic',
        sourceName: 'Epic Games',
        badgeColor: '#2a2a2a',
        badgeText: 'E'
      }))
    ];
    
    const filteredGames = filterGames(allGames, gamesSearchTerm);
    const sortedGames = sortGames(filteredGames, sortOrder);
    const paginatedGames = paginateGames(sortedGames, gamesPage, gamesPerPage);
    const totalGamesPages = Math.ceil(sortedGames.length / gamesPerPage);
    
    // Debug the filtering results - REMOVED TO REDUCE CONSOLE SPAM
    // console.log('[ChannelModal] Game filtering debug:', {
    //   steamTotal: realSteamGames.length,
    //   steamUnique: uniqueSteamGames.length,
    //   steamInstalled: installedSteamGames.length,
    //   epicTotal: realEpicGames.length,
    //   epicInstalled: installedEpicGames.length,
    //   allGamesTotal: allGames.length,
    //   filteredGames: filteredGames.length,
    //   gamesBySource: {
    //     steam: allGames.filter(g => g.source === 'steam').length,
    //     epic: allGames.filter(g => g.source === 'epic').length
    //   }
    // });
    
    // Enhanced Steam games debugging - REMOVED TO REDUCE CONSOLE SPAM
    // if (realSteamGames.length > 0) {
    //   console.log('[ChannelModal] Steam games detailed debug:', {
    //     totalGames: realSteamGames.length,
    //     uniqueGames: uniqueSteamGames.length,
    //     installedGames: installedSteamGames.length,
    //     sampleGame: realSteamGames[0],
    //     sampleGameProperties: realSteamGames[0] ? Object.keys(realSteamGames[0]) : [],
    //     gamesWithSize: realSteamGames.filter(g => g.sizeOnDisk && parseInt(g.sizeOnDisk) > 0).length,
    //     gamesWithInstalledTrue: realSteamGames.filter(g => g.installed === true).length,
    //     gamesWithInstalledUndefined: realSteamGames.filter(g => g.installed === undefined).length,
    //     gamesWithInstalledFalse: realSteamGames.filter(g => g.installed === false).length
    //   });
      
    //   // Log first few games for inspection
    //   console.log('[ChannelModal] First 3 Steam games:', realSteamGames.slice(0, 3).map(g => ({
    //     name: g.name,
    //     appid: g.appid,
    //     installed: g.installed,
    //     sizeOnDisk: g.sizeOnDisk,
    //     hasSize: g.sizeOnDisk && parseInt(g.sizeOnDisk) > 0,
    //     wouldBeInstalled: (g.sizeOnDisk && parseInt(g.sizeOnDisk) > 0) || (g.installed === true || g.installed === undefined)
    //   })));
    // }
    
    // Check for duplicates in Steam games
    const steamGameNames = realSteamGames.map(g => g.name);
    const steamGameAppIds = realSteamGames.map(g => g.appid);
    const duplicateNames = steamGameNames.filter((name, index) => steamGameNames.indexOf(name) !== index);
    const duplicateAppIds = steamGameAppIds.filter((appid, index) => steamGameAppIds.indexOf(appid) !== index);
    
    if (duplicateNames.length > 0) {
      console.warn('[ChannelModal] Duplicate Steam game names found:', duplicateNames);
    }
    if (duplicateAppIds.length > 0) {
      console.warn('[ChannelModal] Duplicate Steam app IDs found:', duplicateAppIds);
    }

    return (
      <Card 
        title="Suggested Content" 
        separator 
        desc="Quickly add your installed games and apps to this channel. Click any item to auto-fill the path and add its cover art."
      >


        {/* Loading State */}
        {(steamLoading || epicLoading) && (
          <div className="text-center py-8">
            <div className="text-[hsl(var(--text-tertiary))] text-sm">
              <div className="mb-2">⏳</div>
              <div className="font-medium mb-1">
                {steamLoading && epicLoading ? 'Scanning games...' :
                 steamLoading ? 'Scanning Steam games...' : 
                 epicLoading ? 'Scanning Epic games...' : 'Scanning...'}
              </div>
              <div className="text-xs">
                This may take a few moments.
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {(steamError || epicError) && (
          <div className="text-center py-8">
            <div className="text-[hsl(var(--state-error))] text-sm">
              <div className="mb-2">⚠️</div>
              <div className="font-medium mb-1">Content scan failed</div>
              <div className="text-xs">
                {steamError && `Steam: ${steamError}`}
                {steamError && epicError && <br />}
                {epicError && `Epic: ${epicError}`}
              </div>
            </div>
          </div>
        )}

        {/* Games Content */}
        {!steamLoading && !steamError && !epicLoading && !epicError && allGames.length > 0 && (
          <>
            {/* Unified Games Section */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setGamesSectionExpanded(!gamesSectionExpanded)}
                className="flex items-center gap-2 hover:bg-[hsl(var(--surface-secondary))] px-2 py-1 rounded transition-colors"
              >
                <div className="w-6 h-6 bg-[hsl(var(--wii-blue))] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🎮</span>
                </div>
                <Text size="sm" weight={600} className="text-[hsl(var(--text-primary))]">
                  All Games ({sortedGames.length} of {allGames.length} installed)
                </Text>
                <span className={`text-[hsl(var(--text-tertiary))] transition-transform duration-200 ${gamesSectionExpanded ? 'rotate-90' : ''}`}>
                  ›
                </span>
              </button>
              
              {/* Sort Controls */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-[hsl(var(--surface-secondary))]"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <span className="text-[hsl(var(--text-secondary))]">Sort:</span>
                  <span className="text-[hsl(var(--text-primary))]">
                    {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
                  </span>
                  <span className="text-[hsl(var(--text-tertiary))]">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                </button>
                
                <WButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // console.log('[ChannelModal] Manual games refresh triggered');
                    rescanSteamGames();
                    rescanEpicGames();
                  }}
                  disabled={steamLoading || epicLoading}
                >
                  {(steamLoading || epicLoading) ? 'Scanning...' : 'Refresh'}
                </WButton>
              </div>
            </div>
            
            {/* Games Content */}
            {gamesSectionExpanded && (
              <>
                {/* Games Search */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search all games..."
                    value={gamesSearchTerm}
                    onChange={(e) => {
                      setGamesSearchTerm(e.target.value);
                      setGamesPage(0); // Reset to first page when searching
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] text-[hsl(var(--text-primary))] placeholder-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--wii-blue))] focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {paginatedGames.map((game, index) => (
                    <div
                      key={game.appid || game.appId || game.id || game.appName}
                      onClick={() => {
                        try {
                          // console.log('[ChannelModal] Game clicked!');
                          // console.log('[ChannelModal] Game object:', game);
                          // console.log('[ChannelModal] Game source:', game.source);
                          
                          if (game.source === 'steam') {
                            // Handle Steam game
                            const gameId = game.appId || game.appid || game.id;
                            // console.log('[ChannelModal] Steam game ID:', gameId);
                            
                            // Create Steam app object
                            const steamApp = {
                              id: `steam-${gameId}`,
                              name: game.name,
                              type: 'steam',
                              appId: gameId,
                              path: `steam://rungameid/${gameId}`,
                              icon: `https://cdn.cloudflare.steamstatic.com/steam/apps/${gameId}/header.jpg`,
                              source: 'steam',
                              category: 'Steam Game',
                              installed: game.installed,
                              sizeOnDisk: game.sizeOnDisk
                            };
                            
                            // console.log('[ChannelModal] Created steamApp:', steamApp);
                            
                            // Set the selected app in the unified store
                            useUnifiedAppStore.getState().setSelectedApp(steamApp);
                            
                            // Set the game's cover art as the channel image
                            const coverUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${gameId}/header.jpg`;
                            // console.log(`[ChannelModal] Setting Steam media for ${game.name}:`, {
                            //   coverUrl,
                            //   gameId
                            // });
                            
                            setMedia({
                              url: coverUrl,
                              type: 'image/jpeg',
                              name: `${game.name} Cover`,
                              isSteamGame: true,
                              steamAppId: gameId
                            });
                            
                            // Show selection feedback
                            showSelectionFeedback(game.name, 'Steam');
                            
                          } else if (game.source === 'epic') {
                            // Handle Epic game
                            // console.log('[ChannelModal] Epic game clicked!');
                            // console.log('[ChannelModal] Epic game object:', game);
                            
                            // Auto-fill the channel with Epic game data
                            setType('epic');
                            
                            // Get all matching media items for this game
                            const allMatchingMedia = getAllMatchingMedia(game.name);
                            const gameId = game.appName || game.id;
                            const currentIndex = epicMediaIndexes[gameId] || 0;
                            
                            // Determine which media to show (matching media or fallback)
                            let currentMedia = null;
                            let coverUrl = '';
                            let source = '';
                            
                            if (allMatchingMedia.length > 0) {
                              // Use the current index from carousel
                              currentMedia = allMatchingMedia[currentIndex];
                              coverUrl = `https://bmlcydwltfexgbsyunkf.supabase.co/storage/v1/object/public/media-library/${currentMedia.file_url}`;
                              source = 'Media Library';
                            } else {
                              // Fallback to Epic CDN
                              coverUrl = game.image || `https://cdn2.unrealengine.com/${game.appName || game.id}-1200x630-${game.appName || game.id}.jpg`;
                              source = game.image ? 'Epic CDN' : 'Epic CDN Fallback';
                            }
                            
                            // Create Epic app object
                            const epicApp = {
                              id: `epic-${game.appName || game.id}`,
                              name: game.name,
                              type: 'epic',
                              appName: game.appName || game.id,
                              path: `com.epicgames.launcher://apps/${game.appName || game.id}?action=launch&silent=true`,
                              icon: coverUrl,
                              source: 'epic',
                              category: 'Epic Game'
                            };
                            
                            // console.log('[ChannelModal] Created epicApp:', epicApp);
                            
                            // Set the selected app in the unified store
                            useUnifiedAppStore.getState().setSelectedApp(epicApp);
                            
                            // Set the game's cover art as the channel image
                            // Use the currently selected media from carousel, or fallback to first match
                            const selectedMedia = currentMedia || (allMatchingMedia.length > 0 ? allMatchingMedia[0] : null);
                            const finalCoverUrl = selectedMedia 
                              ? `https://bmlcydwltfexgbsyunkf.supabase.co/storage/v1/object/public/media-library/${selectedMedia.file_url}`
                              : coverUrl;
                            
                            // console.log(`[ChannelModal] Setting media for ${game.name}:`, {
                            //   selectedMedia: selectedMedia ? selectedMedia.title : 'None',
                            //   fileType: selectedMedia ? selectedMedia.file_type : 'fallback',
                            //   finalCoverUrl,
                            //   carouselIndex: currentIndex
                            // });
                            
                            setMedia({
                              url: finalCoverUrl,
                              type: selectedMedia ? selectedMedia.file_type : 'image/jpeg',
                              name: `${game.name} Cover`,
                              isEpicGame: true,
                              epicAppName: game.appName || game.id
                            });
                            
                            // Show selection feedback
                            showSelectionFeedback(game.name, 'Epic Games');
                          }
                          
                        } catch (error) {
                          console.error('[ChannelModal] Error in game click handler:', error);
                        }
                      }}
                      title={`Replace current channel with ${game.name}`}
                      className="group relative flex flex-col items-center p-3 rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] hover:bg-[hsl(var(--surface-secondary))] hover:border-[hsl(var(--border-secondary))] transition-all duration-200 cursor-pointer"
                    >
                      {/* Game Cover */}
                      <div className="relative w-full aspect-video rounded overflow-hidden mb-2">
                        {game.source === 'steam' ? (
                          <img
                            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId || game.appid || game.id}/header.jpg`}
                            alt={`${game.name} cover`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading={index < 3 ? "eager" : "lazy"}
                            onError={(e) => {
                              // Fallback to a generic game icon if cover fails to load
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzM0MzQzNCIvPgo8cGF0aCBkPSJNMTIgMTJIMjhWMjhIMTJWMjJaIiBmaWxsPSIjNjY2NjY2Ii8+Cjwvc3ZnPgo=';
                            }}
                          />
                        ) : game.source === 'epic' ? (
                          // Epic game cover logic with media library integration
                          (() => {
                            // Get all matching media items for this game
                            const allMatchingMedia = getAllMatchingMedia(game.name);
                            const gameId = game.appName || game.id;
                            const currentIndex = epicMediaIndexes[gameId] || 0;
                            
                            // Determine which media to show (matching media or fallback)
                            let currentMedia = null;
                            let coverUrl = '';
                            let source = '';
                            
                            if (allMatchingMedia.length > 0) {
                              // Use the current index from carousel
                              currentMedia = allMatchingMedia[currentIndex];
                              coverUrl = `https://bmlcydwltfexgbsyunkf.supabase.co/storage/v1/object/public/media-library/${currentMedia.file_url}`;
                              source = 'Media Library';
                            } else {
                              // Fallback to Epic CDN
                              coverUrl = game.image || `https://cdn2.unrealengine.com/${game.appName || game.id}-1200x630-${game.appName || game.id}.jpg`;
                              source = game.image ? 'Epic CDN' : 'Epic CDN Fallback';
                            }
                            
                            return (
                              <div className="relative w-full h-full">
                                {currentMedia && (currentMedia.file_type === 'gif' || currentMedia.file_type === 'video') ? (
                                  // Use video element for GIFs and MP4s
                                  <video
                                    src={coverUrl}
                                    alt={`${game.name} cover`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    muted
                                    loop
                                    autoPlay
                                    onError={(e) => {
                                      // Fallback to a generic game icon if video fails to load
                                      e.target.style.display = 'none';
                                      const fallbackImg = document.createElement('img');
                                      fallbackImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzM0MzQzNCIvPgo8cGF0aCBkPSJNMTIgMTJIMjhWMjhIMTJWMjJaIiBmaWxsPSIjNjY2NjY2Ii8+Cjwvc3ZnPgo=';
                                      fallbackImg.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-200';
                                      e.target.parentNode.appendChild(fallbackImg);
                                    }}
                                  />
                                ) : (
                                  // Use img element for static images
                                  <img
                                    src={coverUrl}
                                    alt={`${game.name} cover`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    loading={index < 3 ? "eager" : "lazy"}
                                    onError={(e) => {
                                      // Fallback to a generic game icon if cover fails to load
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzM0MzQzNCIvPgo8cGF0aCBkPSJNMTIgMTJIMjhWMjhIMTJWMjJaIiBmaWxsPSIjNjY2NjY2Ii8+Cjwvc3ZnPgo=';
                                    }}
                                  />
                                )}
                                
                                {/* Media Library Badge if using cached media */}
                                {currentMedia && (
                                  <div className="absolute top-1 left-1 bg-[hsl(var(--wii-blue))] text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    📚
                                  </div>
                                )}
                                
                                {/* Navigation Arrows for Multiple Matches */}
                                {allMatchingMedia.length > 1 && (
                                  <>
                                    {/* Left Arrow */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newIndex = currentIndex === 0 ? allMatchingMedia.length - 1 : currentIndex - 1;
                                        setEpicMediaIndexes(prev => ({
                                          ...prev,
                                          [gameId]: newIndex
                                        }));
                                      }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onMouseUp={(e) => e.stopPropagation()}
                                      className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                                      title={`Previous media (${currentIndex + 1}/${allMatchingMedia.length})`}
                                    >
                                      ‹
                                    </button>
                                    
                                    {/* Right Arrow */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newIndex = currentIndex === allMatchingMedia.length - 1 ? 0 : currentIndex + 1;
                                        setEpicMediaIndexes(prev => ({
                                          ...prev,
                                          [gameId]: newIndex
                                        }));
                                      }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onMouseUp={(e) => e.stopPropagation()}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                                      title={`Next media (${currentIndex + 1}/${allMatchingMedia.length})`}
                                    >
                                      ›
                                    </button>
                                    
                                    {/* Media Counter */}
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                      {currentIndex + 1}/{allMatchingMedia.length}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })()
                        ) : null}
                        
                        {/* Source Badge */}
                        <div className="absolute top-1 right-1 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: game.badgeColor }}>
                          {game.source === 'steam' ? '🎮' : game.source === 'epic' ? '🎯' : game.badgeText}
                        </div>
                      </div>
                      
                      {/* Game Name */}
                      <div className="text-center">
                        <div className="text-sm font-medium text-[hsl(var(--text-primary))] line-clamp-2 leading-tight">
                          {game.name}
                        </div>
                        <div className="text-xs text-[hsl(var(--text-tertiary))] mt-1">
                          {game.source === 'steam' ? 'Steam Game' : game.source === 'epic' ? 'Epic Game' : game.sourceName}
                        </div>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-[hsl(var(--wii-blue)_/_0.1)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                        <div className="bg-[hsl(var(--wii-blue))] text-white px-3 py-1.5 rounded text-sm font-semibold">
                          {path.trim() ? 'Replace Channel' : 'Add to Channel'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Games Pagination */}
                {totalGamesPages > 1 && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-[hsl(var(--text-tertiary))]">
                      Page {gamesPage + 1} of {totalGamesPages}
                    </div>
                    <div className="flex gap-2">
                      <WButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setGamesPage(Math.max(0, gamesPage - 1))}
                        disabled={gamesPage === 0}
                      >
                        Previous
                      </WButton>
                      <WButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setGamesPage(Math.min(totalGamesPages - 1, gamesPage + 1))}
                        disabled={gamesPage === totalGamesPages - 1}
                      >
                        Next
                      </WButton>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}



        {/* Selection Feedback */}
        {selectedGameFeedback && (
          <div className="fixed top-4 right-4 bg-[hsl(var(--wii-blue))] text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                ✓
              </div>
              <div>
                <div className="font-semibold">{selectedGameFeedback.gameName}</div>
                <div className="text-sm opacity-90">{selectedGameFeedback.message}</div>
              </div>
            </div>
          </div>
        )}

        {/* No Content Found Messages */}
        {!steamLoading && !steamError && !epicLoading && !epicError && allGames.length === 0 && (
          <div className="text-center py-8">
            <div className="text-[hsl(var(--text-tertiary))] text-sm">
              <div className="mb-2">🎮</div>
              <div className="font-medium mb-1">No games found</div>
              <div className="text-xs">
                Make sure Steam and/or Epic Games are installed and you have games in your libraries.
              </div>
              <div className="text-xs mt-2 text-[hsl(var(--text-secondary))]">
                Debug: Steam games loaded: {realSteamGames.length}, Installed: {realSteamGames.filter(g => g.installed).length} | Epic games loaded: {realEpicGames.length}, Installed: {realEpicGames.filter(g => g.installed !== false).length}
              </div>
              <div className="mt-4 flex gap-2 justify-center">
                <WButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // console.log('[ChannelModal] Force clearing Steam cache and rescanning...');
                    localStorage.removeItem('app_cache_steamGames');
                    localStorage.removeItem('app_cache_timestamp_steamGames');
                    rescanSteamGames();
                  }}
                  disabled={steamLoading}
                >
                  {steamLoading ? 'Scanning...' : 'Rescan Steam'}
                </WButton>
                <WButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // console.log('[ChannelModal] Force clearing Epic cache and rescanning...');
                    localStorage.removeItem('app_cache_epicGames');
                    localStorage.removeItem('app_cache_timestamp_epicGames');
                    rescanEpicGames();
                  }}
                  disabled={epicLoading}
                >
                  {epicLoading ? 'Scanning...' : 'Rescan Epic'}
                </WButton>
              </div>
            </div>
          </div>
        )}


      </Card>
    );
  };

  // Channel Behavior Tab
  const renderChannelBehaviorTab = () => (
    <div className="space-y-6">
      {/* Launch Options */}
      <Card title="Launch Options" separator desc="Choose how this application should be launched when the channel is clicked.">
        {renderDisplayOptionsSection()}
      </Card>

      {/* Hover Sound */}
      <Card
        title="Custom Hover Sound"
        separator
        desc="Set a custom sound to play when hovering over this channel."
        headerActions={
          <WToggle
            checked={hoverSoundEnabled}
            onChange={(checked) => setHoverSoundEnabled(checked)}
          />
        }
      >
        {hoverSoundEnabled && (
          <div style={{ marginTop: 0 }}>
            {renderHoverSoundSection()}
          </div>
        )}
        {!hoverSoundEnabled && <span style={{ color: '#888' }}>Set a custom sound to play when hovering over this channel.</span>}
      </Card>

      {/* Animation Toggle */}
      <Card title="Animation on Hover" separator desc="Override the global setting for this channel. Only play GIFs/MP4s when hovered if enabled.">
        {renderAnimationToggleSection()}
      </Card>

      {/* Ken Burns Effect */}
      <Card title="Ken Burns Effect" separator desc="Override the global Ken Burns setting for this channel. Adds cinematic zoom and pan to images.">
        {renderKenBurnsSection()}
      </Card>
    </div>
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

  // Tab navigation component
  const renderTabNavigation = () => (
    <div className="flex border-b border-[hsl(var(--border-primary))] mb-6">
      <div
        onClick={() => setActiveTab('setup')}
        className={`px-4 py-2 font-medium text-sm transition-colors cursor-pointer ${
          activeTab === 'setup'
            ? 'text-[hsl(var(--wii-blue))] border-b-2 border-[hsl(var(--wii-blue))]'
            : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]'
        }`}
      >
        Channel Setup
      </div>
      <div
        onClick={() => setActiveTab('behavior')}
        className={`px-4 py-2 font-medium text-sm transition-colors cursor-pointer ${
          activeTab === 'behavior'
            ? 'text-[hsl(var(--wii-blue))] border-b-2 border-[hsl(var(--wii-blue))]'
            : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]'
        }`}
      >
        Channel Behavior
      </div>
    </div>
  );

  return (
    <>
      <WBaseModal
        key={`channel-modal-${channelId}`} // Force remount when channel changes
        title="Configure Channel"
        onClose={onClose}
        maxWidth="1000px"
        footerContent={footerContent}
        isOpen={isOpen}
      >
        {renderTabNavigation()}
        
        {/* Tab Content */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            {/* Channel Image Selection/Upload Card */}
            <Card title="Channel Image" separator desc="Choose or upload an image, GIF, or MP4 for this channel.">
              {renderImageSection()}
            </Card>
            
            {/* App Path/URL Card */}
            <Card title="Unified App Path or URL" separator desc="Set the path to an app or a URL to launch when this channel is clicked.">
              {renderUnifiedAppPathSection()}
            </Card>
            
            {/* Suggested Games Card */}
            {renderSuggestedGames()}
          </div>
        )}
        
        {activeTab === 'behavior' && renderChannelBehaviorTab()}
      </WBaseModal>
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
  currentKenBurnsMode: PropTypes.oneOf(['hover', 'autoplay', 'slideshow', 'global']),
  isOpen: PropTypes.bool
};

export default ChannelModal; 