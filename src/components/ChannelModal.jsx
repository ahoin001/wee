import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useAppLibraryState } from '../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { preloadMediaLibrary, getAllMatchingMedia } from '../utils/mediaLibraryCache';
import { useChannelModalInitialization } from '../hooks/useChannelModalInitialization';
import Card from '../ui/Card';
import Text from '../ui/Text';
import useSoundLibrary from '../utils/useSoundLibrary';
import Slider from '../ui/Slider';
import { useChannelModalMedia } from '../hooks/useChannelModalMedia';
import { useChannelModalHoverSound } from '../hooks/useChannelModalHoverSound';
import { validateChannelPath, normalizeChannelPath } from '../utils/channelPathValidation';
import { findMatchingAppForPath } from '../utils/channelModalFindMatchingApp';
import ChannelModalSuggestedGames from './ChannelModalSuggestedGames';
import ChannelModalDevDebug from './ChannelModalDevDebug';
import ChannelPathSmartSuggestions from './ChannelPathSmartSuggestions';

const channelsApi = window.api?.channels;

function ChannelModal({ channelId, onClose, onSave, currentMedia, currentPath, currentType, currentHoverSound, currentAsAdmin, currentAnimatedOnHover, currentKenBurnsEnabled, currentKenBurnsMode, isOpen = true }) {
  const {
    media,
    setMedia,
    imageGallery,
    setImageGallery,
    galleryMode,
    setGalleryMode,
    fileInputRef,
    galleryFileInputRef,
    showImageSearch,
    setShowImageSearch,
    handleFileSelect,
    handleGalleryFilesSelect,
    handleRemoveGalleryImage,
    handleImageSelect,
    handleUploadClick,
    handleRemoveImage,
  } = useChannelModalMedia({ currentMedia });

  const [path, setPath] = useState(currentPath || '');
  const [type, setType] = useState(currentType || 'exe');
  const [pathError, setPathError] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('setup');
  
  const [asAdmin, setAsAdmin] = useState(currentAsAdmin);
  const [showError, setShowError] = useState(false);
  const [animatedOnHover, setAnimatedOnHover] = useState(currentAnimatedOnHover);
  
  // Ken Burns settings
  const [kenBurnsEnabled, setKenBurnsEnabled] = useState(currentKenBurnsEnabled);
  // FEATURE NOT READY: If slideshow mode was set, default to hover for better single image experience
  const [kenBurnsMode, setKenBurnsMode] = useState(
    currentKenBurnsMode === 'slideshow' ? 'hover' : currentKenBurnsMode
  );
  const [kenBurnsHoverScale, setKenBurnsHoverScale] = useState(1.1);
  const [kenBurnsAutoplayScale, setKenBurnsAutoplayScale] = useState(1.15);
  const [kenBurnsHoverDuration, setKenBurnsHoverDuration] = useState(8000);
  const [kenBurnsAutoplayDuration, setKenBurnsAutoplayDuration] = useState(12000);
  const [kenBurnsCrossfadeDuration, setKenBurnsCrossfadeDuration] = useState(1000);
  const [kenBurnsEasing, setKenBurnsEasing] = useState('ease-out');
  
  // Use app library state from consolidated store
  const { appLibrary, appLibraryManager } = useAppLibraryState();
  const {
    installedApps, appsLoading, appsError,
    steamGames, steamLoading, steamError,
    epicGames, epicLoading, epicError,
    uwpApps, uwpLoading,
    customSteamPath
  } = appLibrary || {};
  
  // Get channels data from consolidated store
  const channels = useConsolidatedAppStore((state) => state.channels);
  const actions = useConsolidatedAppStore((state) => state.actions);
  const channelConfigs = useMemo(
    () => channels?.data?.channelConfigs || {},
    [channels?.data?.channelConfigs]
  );
  const configuredChannels = useMemo(
    () => channels?.data?.configuredChannels || {},
    [channels?.data?.configuredChannels]
  );

  const setUnifiedAppsState = useConsolidatedAppStore((state) => state.actions.setUnifiedAppsState);

  /** Clear global app picker selection so UnifiedAppPathCard does not show the previous channel's app */
  useEffect(() => {
    if (!isOpen) return;
    setUnifiedAppsState({ selectedApp: null });
  }, [isOpen, channelId, setUnifiedAppsState]);

  const {
    fetchInstalledApps, fetchSteamGames, fetchEpicGames, fetchUwpApps
  } = appLibraryManager || {};
  
  // Use sound library for hover sound selection
  const {
    soundLibrary,
    loading: soundLibraryLoading,
    addSound,
    selectSoundFile,
    getSoundsByCategory,
    loadSoundLibrary
  } = useSoundLibrary();
  
  const rescanSteamGames = () => fetchSteamGames?.(true);
  const rescanEpicGames = () => fetchEpicGames?.(true);
  const rescanInstalledApps = () => fetchInstalledApps?.(true);

  const {
    setHoverSound,
    hoverSoundInputRef,
    hoverSoundName,
    hoverSoundUrl,
    hoverSoundVolume,
    hoverSoundEnabled,
    setHoverSoundEnabled,
    hoverSoundAudio,
    selectedHoverSoundId,
    uploadingHoverSound,
    handleHoverSoundFile,
    handleHoverSoundSelect,
    handleHoverSoundUpload,
    handleTestHoverSound,
    handleHoverSoundVolumeChange,
    clearHoverSoundSelection,
    resetHoverSoundFields,
  } = useChannelModalHoverSound({
    currentHoverSound,
    isOpen,
    addSound,
    selectSoundFile,
    getSoundsByCategory,
    loadSoundLibrary,
    soundLibrary,
  });

  useChannelModalInitialization({
    isOpen,
    channelId,
    configuredChannels,
    channelConfigs,
    setPath,
    setPathError,
    setShowError,
    setMedia,
    setHoverSound,
    setAnimatedOnHover,
    setKenBurnsEnabled,
    setKenBurnsMode,
    setKenBurnsHoverScale,
    setKenBurnsAutoplayScale,
    setKenBurnsHoverDuration,
    setKenBurnsAutoplayDuration,
    setKenBurnsCrossfadeDuration,
    setKenBurnsEasing,
    setAsAdmin,
    installedAppsLength: installedApps?.length || 0,
    uwpAppsLength: uwpApps?.length || 0,
    steamGamesLength: steamGames?.length || 0,
    epicGamesLength: epicGames?.length || 0,
    appsLoading,
    uwpLoading,
    steamLoading,
    epicLoading,
    customSteamPath,
    loadSoundLibrary,
    fetchInstalledApps,
    fetchUwpApps,
    fetchSteamGames,
    fetchEpicGames,
    preloadMediaLibrary,
  });

  const validatePath = useCallback(() => {
    const trimmed = path.trim();
    if (!trimmed) {
      setPathError('');
      return true;
    }
    const { valid, error } = validateChannelPath(trimmed, type);
    setPathError(error || '');
    return valid;
  }, [path, type]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const trimmed = path.trim();
    if (!trimmed) {
      setPathError('');
      return undefined;
    }
    const id = window.setTimeout(() => {
      const { valid, error } = validateChannelPath(trimmed, type);
      setPathError(valid ? '' : error || '');
    }, 320);
    return () => clearTimeout(id);
  }, [path, type, isOpen]);

  const handleApplySmartSuggestion = useCallback((s) => {
    setType(s.applyType);
    setPath(s.applyPath);
    setShowError(false);
    const { valid, error } = validateChannelPath(s.applyPath.trim(), s.applyType);
    setPathError(valid ? '' : error || '');
  }, [setType, setPath]);

  // Unified app path change handler
  const handleUnifiedAppPathChange = useCallback((config) => {
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
  }, [setType, setPath]);

  // On save, use consolidated store and channels API
  const handleSave = async (handleClose) => {
    const trimmed = path.trim();
    const pathValid = trimmed ? validatePath() : true;

    if (!pathValid || !media) {
      setShowError(true);
      return;
    }

    const persistedPath = trimmed ? normalizeChannelPath(trimmed, type) : null;

    const newChannel = {
      media,
      path: persistedPath || null,
      type: persistedPath ? type : null,
      asAdmin,
      hoverSound: hoverSoundEnabled && hoverSoundUrl ? { url: hoverSoundUrl, name: hoverSoundName, volume: hoverSoundVolume } : null,
      animatedOnHover: animatedOnHover !== 'global' ? animatedOnHover : undefined
    };
    
    // Save channel data to consolidated store
    if (onSave) {
      onSave(channelId, newChannel);
    }
    
    // Save Ken Burns settings to channel configs
    const kenBurnsConfig = {
      kenBurnsEnabled: kenBurnsEnabled !== 'global' ? kenBurnsEnabled : undefined,
      kenBurnsMode: kenBurnsMode !== 'global' ? kenBurnsMode : undefined,
      kenBurnsHoverScale,
      kenBurnsAutoplayScale,
      kenBurnsHoverDuration,
      kenBurnsAutoplayDuration,
      kenBurnsCrossfadeDuration,
      kenBurnsEasing
    };
    
    // Only save config if there are actual settings (not all undefined)
    const hasKenBurnsSettings = Object.values(kenBurnsConfig).some(value => value !== undefined);
    if (hasKenBurnsSettings) {
      actions.updateChannelConfig(channelId, kenBurnsConfig);
    }
    
    // Also save to channels API for persistence
    try {
      const allChannels = await window.api?.channels?.get();
      const updatedChannels = { ...allChannels, [channelId]: newChannel };
      await window.api?.channels?.set(updatedChannels);
    } catch (error) {
      console.error('[ChannelModal] Failed to save to channels API:', error);
    }
    
    handleClose();
  };

  const handleClearChannel = async (handleClose) => {
    // Reset all local state to empty/default values
    setMedia(null);
    setPath('');
    setType('exe');
    setPathError('');
    setAsAdmin(false);
    resetHoverSoundFields();
    setAnimatedOnHover(undefined);
    setKenBurnsEnabled(undefined);
    setKenBurnsMode(undefined);
    setKenBurnsHoverScale(1.1);
    setKenBurnsAutoplayScale(1.15);
    setKenBurnsHoverDuration(8000);
    setKenBurnsAutoplayDuration(12000);
    setKenBurnsCrossfadeDuration(1000);
    setKenBurnsEasing('ease-out');
    setImageGallery([]);
    setGalleryMode(false);
    
    // Save the cleared channel state to consolidated store (passing null to indicate complete reset)
    if (onSave) {
      onSave(channelId, null);
    }
    
    // Clear channel configs
    actions.updateChannelConfig(channelId, null);
    
    // Also clear from channels API for persistence
    try {
      const allChannels = await channelsApi?.get();
      const updatedChannels = { ...allChannels };
      delete updatedChannels[channelId];
      await channelsApi?.set(updatedChannels);
    } catch (error) {
      console.error('[ChannelModal] Failed to clear from channels API:', error);
    }
    
    handleClose();
  };

  // Check if any changes have been made compared to original values
  const hasChanges = useMemo(() => {
    // Check if basic setup has changed
    const mediaChanged = JSON.stringify(media) !== JSON.stringify(currentMedia);
    const pathChanged = path !== (currentPath || '');
    const typeChanged = type !== (currentType || 'exe');
    const asAdminChanged = asAdmin !== currentAsAdmin;
    
    // Check if hover sound has changed
    const currentHoverSoundData = currentHoverSound ? {
      url: currentHoverSound.url,
      name: currentHoverSound.name,
      volume: currentHoverSound.volume
    } : null;
    const newHoverSoundData = hoverSoundEnabled && hoverSoundUrl ? {
      url: hoverSoundUrl,
      name: hoverSoundName,
      volume: hoverSoundVolume
    } : null;
    const hoverSoundChanged = JSON.stringify(currentHoverSoundData) !== JSON.stringify(newHoverSoundData);
    
    // Check if animation settings have changed
    const animatedOnHoverChanged = animatedOnHover !== currentAnimatedOnHover;
    const kenBurnsEnabledChanged = kenBurnsEnabled !== currentKenBurnsEnabled;
    const kenBurnsModeChanged = kenBurnsMode !== currentKenBurnsMode;
    
    // Check if other Ken Burns settings have changed
    const existingConfig = channelConfigs[channelId] || {};
    const kenBurnsHoverScaleChanged = kenBurnsHoverScale !== (existingConfig.kenBurnsHoverScale ?? 1.1);
    const kenBurnsAutoplayScaleChanged = kenBurnsAutoplayScale !== (existingConfig.kenBurnsAutoplayScale ?? 1.15);
    const kenBurnsHoverDurationChanged = kenBurnsHoverDuration !== (existingConfig.kenBurnsHoverDuration ?? 8000);
    const kenBurnsAutoplayDurationChanged = kenBurnsAutoplayDuration !== (existingConfig.kenBurnsAutoplayDuration ?? 12000);
    const kenBurnsCrossfadeDurationChanged = kenBurnsCrossfadeDuration !== (existingConfig.kenBurnsCrossfadeDuration ?? 1000);
    const kenBurnsEasingChanged = kenBurnsEasing !== (existingConfig.kenBurnsEasing ?? 'ease-out');
    
    return mediaChanged || pathChanged || typeChanged || asAdminChanged || 
           hoverSoundChanged || animatedOnHoverChanged || kenBurnsEnabledChanged || kenBurnsModeChanged ||
           kenBurnsHoverScaleChanged || kenBurnsAutoplayScaleChanged || kenBurnsHoverDurationChanged ||
           kenBurnsAutoplayDurationChanged || kenBurnsCrossfadeDurationChanged || kenBurnsEasingChanged;
  }, [
    media, currentMedia,
    path, currentPath,
    type, currentType,
    asAdmin, currentAsAdmin,
    hoverSoundEnabled, hoverSoundUrl, hoverSoundName, hoverSoundVolume, currentHoverSound,
    animatedOnHover, currentAnimatedOnHover,
    kenBurnsEnabled, currentKenBurnsEnabled,
    kenBurnsMode, currentKenBurnsMode,
    kenBurnsHoverScale, kenBurnsAutoplayScale, kenBurnsHoverDuration, kenBurnsAutoplayDuration,
    kenBurnsCrossfadeDuration, kenBurnsEasing, channelConfigs, channelId
  ]);
  
  // Enable save button if there are changes and at least some media is present
  // This allows saving behavior changes even if path requirements aren't fully met
  const canSave = hasChanges && media && !pathError;
  
  // Debug logging for save button state
  // console.log('[ChannelModal] Save button debug:', {
  //   hasMedia: !!media,
  //   hasPath: !!path,
  //   pathError,
  //   hasChanges,
  //   canSave,
  //   changes: {
  //     mediaChanged: JSON.stringify(media) !== JSON.stringify(currentMedia),
  //     pathChanged: path !== (currentPath || ''),
  //     typeChanged: type !== (currentType || 'exe'),
  //     asAdminChanged: asAdmin !== currentAsAdmin,
  //     animatedOnHoverChanged: animatedOnHover !== currentAnimatedOnHover,
  //     kenBurnsEnabledChanged: kenBurnsEnabled !== currentKenBurnsEnabled,
  //     kenBurnsModeChanged: kenBurnsMode !== currentKenBurnsMode
  //   }
  // });
  let saveTooltip = '';
  
  if (!hasChanges) {
    saveTooltip = 'No changes to save.';
  } else if (!media) {
    saveTooltip = 'Please select a channel image.';
  } else if (pathError) {
    saveTooltip = pathError;
  } else if (!path.trim()) {
    saveTooltip = 'Warning: No launch path set. Channel will not launch anything when clicked.';
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
            <Text size="sm" color="hsl(var(--state-warning))">
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
                    <div className="channel-temp-badge">
                      ⚠️ Temporary
                    </div>
                  </div>
                ) : (
                  <>
                    {media && typeof media.type === 'string' && (media.type.startsWith('image/') || media.type === 'image') ? (
                      <img src={media.url} alt="Channel preview" />
                    ) : media && typeof media.type === 'string' && (media.type.startsWith('video/') || media.type === 'video' || media.type === 'gif') ? (
                      <video src={media.url} autoPlay loop muted className="max-w-full max-h-[120px]" />
                    ) : null}
                  </>
                )}
                <button className="remove-image-button" onClick={handleRemoveImage}>
                  Remove
                </button>
              </div>
            ) : (
              <WButton
                variant="primary"
                fullWidth
                rounded
                onClick={() => setShowImageSearch(true)}
                className="text-text-on-accent"
              >
                Add Channel Image
              </WButton>
            )}
          </>
        )}

        {/* Gallery Mode - FEATURE NOT READY: Disabled */}
        {galleryMode && (
          <div className="channel-stack-16">
            {/* Gallery Grid */}
            {imageGallery.length > 0 && (
              <div className="channel-gallery-grid">
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
              id="channel-gallery-add-button"
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
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          multiple
          ref={galleryFileInputRef}
          onChange={(e) => handleGalleryFilesSelect(e.target.files)}
          className="hidden"
        />
      </div>
    );
  };

  const matchingApp = useMemo(() => findMatchingAppForPath(path, type), [path, type]);

  const renderUnifiedAppPathSection = useCallback(() => {
    if (!isOpen) {
      return null;
    }

    return (
      <>
        <UnifiedAppPathCard
          key={`unified-app-path-${channelId}-${isOpen}`}
          value={{
            launchType: type === 'url' ? 'url' : 'application',
            appName: matchingApp ? matchingApp.name : '',
            path,
            selectedApp: matchingApp,
          }}
          onChange={handleUnifiedAppPathChange}
          externalValidationError={pathError}
        />
        <ChannelPathSmartSuggestions path={path} type={type} onApply={handleApplySmartSuggestion} />
      </>
    );
  }, [isOpen, matchingApp, channelId, type, path, pathError, handleUnifiedAppPathChange, handleApplySmartSuggestion]);

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
          <div>{renderHoverSoundSection()}</div>
        )}
        {!hoverSoundEnabled && <span className="channel-inline-help">Set a custom sound to play when hovering over this channel.</span>}
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
    <div className="channel-row-radio">
      <label className="channel-radio-label channel-radio-label-compact">
        <input
          type="radio"
          name={`admin-mode-${channelId}`}
          checked={!asAdmin}
          onChange={() => setAsAdmin(false)}
        />
        Normal Launch
      </label>
      <label className="channel-radio-label channel-radio-label-compact">
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

  const renderHoverSoundSection = () => {
    const channelHoverSounds = getSoundsByCategory('channelHover') || [];
    
    return (
      <div className="channel-stack-16">
        {/* Current Selection */}
        {hoverSoundEnabled && hoverSoundUrl && (
          <div className="channel-surface-block">
            <div className="channel-header-row">
              <Text variant="p" className="!font-semibold !m-0">
                Selected Sound: {hoverSoundName}
              </Text>
              <WButton
                variant="tertiary"
                size="sm"
                onClick={clearHoverSoundSelection}
              >
                Clear
              </WButton>
            </div>
            
            <div className="channel-row-gap-12">
              <WButton
                variant="secondary"
                size="sm"
                onClick={handleTestHoverSound}
                disabled={!hoverSoundUrl}
              >
                {hoverSoundAudio ? 'Stop' : 'Test'}
              </WButton>
              
              <div className="channel-row-gap-8 channel-fill">
                <span className="channel-volume-label">Volume:</span>
                <Slider
                  value={hoverSoundVolume}
                  onChange={(value) => handleHoverSoundVolumeChange(value)}
                  min={0}
                  max={1}
                  step={0.01}
                  className="channel-fill"
                />
                <span className="channel-volume-value">
                  {Math.round(hoverSoundVolume * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sound Library Selection */}
        <div>
          <div className="channel-row-gap-12 channel-row-between channel-mb-12">
            <Text variant="p" className="!font-semibold !m-0">
              Choose from Sound Library
            </Text>
            <WButton
              variant="primary"
              size="sm"
              onClick={handleHoverSoundUpload}
              disabled={uploadingHoverSound}
            >
              {uploadingHoverSound ? 'Uploading...' : 'Upload New Sound'}
            </WButton>
          </div>
          
          {soundLibraryLoading ? (
            <div className="channel-surface-block channel-surface-centered channel-surface-p20 channel-text-tertiary">
              Loading sound library...
            </div>
          ) : channelHoverSounds.length === 0 ? (
            <div className="channel-surface-block channel-surface-centered channel-surface-p20 channel-text-tertiary">
              No hover sounds available. Upload your first sound above.
            </div>
          ) : (
            <div className="channel-sound-grid">
              {channelHoverSounds.map(sound => (
                <div
                  key={sound.id}
                  onClick={() => handleHoverSoundSelect(sound.id)}
                  className={`channel-sound-card ${selectedHoverSoundId === sound.id ? 'channel-sound-card-selected' : ''}`}
                >
                  <div className="channel-header-row">
                    <Text variant="p" className="!font-medium !m-0 !text-[14px]">
                      {sound.name}
                    </Text>
                    {selectedHoverSoundId === sound.id && (
                      <span className="channel-checkmark">✓</span>
                    )}
                  </div>
                  
                  <div className="channel-row-gap-8">
                    <WButton
                      variant="tertiary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Test this specific sound
                        const testAudio = new Audio(sound.url);
                        testAudio.volume = sound.volume ?? 0.5;
                        testAudio.play();
                        testAudio.onended = () => {
                          testAudio.src = '';
                          testAudio.load();
                        };
                      }}
                      className="channel-min-w-60"
                    >
                      Test
                    </WButton>
                    
                    <div className="channel-row-gap-4 channel-fill">
                      <span className="channel-tiny-label">Vol:</span>
                      <span className="channel-tiny-label">
                        {Math.round((sound.volume ?? 0.5) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legacy File Upload (Fallback) */}
        <div className="channel-surface-block channel-surface-subtle">
          <Text variant="p" className="!font-semibold !m-0 !mb-2 !text-[14px]">
            Legacy File Upload
          </Text>
          <div className="channel-row-gap-10">
            <button
              className="file-button"
              id="channel-legacy-upload-button"
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
              className="hidden"
            />
            <span className="channel-legacy-upload-note">
              Direct file upload (not saved to library)
            </span>
          </div>
        </div>

        <Text variant="help" className="channel-help-sm">
          Sound will fade in on hover, and fade out on leave or click. 
          Sounds uploaded to the library are saved permanently and can be reused across channels.
        </Text>
      </div>
    );
  };

  const renderAnimationToggleSection = () => (
    <div className="channel-stack-8">
      <label className="channel-radio-label">
        <input
          type="radio"
          name="animatedOnHover"
          value="global"
          checked={animatedOnHover === undefined || animatedOnHover === 'global'}
          onChange={() => setAnimatedOnHover('global')}
        />
        Use global setting
      </label>
      <label className="channel-radio-label">
        <input
          type="radio"
          name="animatedOnHover"
          value="true"
          checked={animatedOnHover === true}
          onChange={() => setAnimatedOnHover(true)}
        />
        Only play animation on hover (override)
      </label>
      <label className="channel-radio-label">
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
    <div className="channel-stack-16">
      {/* Ken Burns Enabled Setting */}
      <div>
        <Text as="label" size="md" weight={600} className="block mb-2">
          Ken Burns Effect
        </Text>
        <div className="channel-stack-8">
          <label className="channel-radio-label">
            <input
              type="radio"
              name="kenBurnsEnabled"
              value="global"
              checked={kenBurnsEnabled === undefined || kenBurnsEnabled === 'global'}
              onChange={() => setKenBurnsEnabled('global')}
            />
            Use global setting
          </label>
          <label className="channel-radio-label">
            <input
              type="radio"
              name="kenBurnsEnabled"
              value="true"
              checked={kenBurnsEnabled === true}
              onChange={() => setKenBurnsEnabled(true)}
            />
            Enable for this channel (override)
          </label>
          <label className="channel-radio-label">
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
          <Text as="label" size="md" weight={600} className="block mb-2">
            Activation Mode
          </Text>
          <div className="channel-stack-8">
            <label className="channel-radio-label">
              <input
                type="radio"
                name="kenBurnsMode"
                value="global"
                checked={kenBurnsMode === undefined || kenBurnsMode === 'global'}
                onChange={() => setKenBurnsMode('global')}
              />
              Use global setting
            </label>
            <label className="channel-radio-label">
              <input
                type="radio"
                name="kenBurnsMode"
                value="hover"
                checked={kenBurnsMode === 'hover'}
                onChange={() => setKenBurnsMode('hover')}
              />
              Hover to activate (override)
            </label>
            <label className="channel-radio-label">
              <input
                type="radio"
                name="kenBurnsMode"
                value="autoplay"
                checked={kenBurnsMode === 'autoplay'}
                onChange={() => setKenBurnsMode('autoplay')}
              />
              Always active (override)
            </label>
            <label className="channel-radio-label channel-radio-disabled">
              <input
                type="radio"
                name="kenBurnsMode"
                value="slideshow"
                checked={kenBurnsMode === 'slideshow'}
                onChange={() => setKenBurnsMode('slideshow')}
                disabled
              />
              Slideshow mode (override) <span className="text-[hsl(var(--state-error))] text-[11px]">- Not Ready</span>
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
    <div className="flex">
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
        {/* Sticky Tab Navigation */}
        <div className="channel-sticky-tabs">
          {renderTabNavigation()}
        </div>
        
        {/* Scrollable Content */}
        <div className="channel-scroll-body">
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
                <ChannelModalDevDebug path={path} type={type} pathError={pathError} />
              </Card>
              
              <ChannelModalSuggestedGames
                isOpen={isOpen}
                path={path}
                setPath={setPath}
                setType={setType}
                setMedia={setMedia}
                installedApps={installedApps}
                appsLoading={appsLoading}
                appsError={appsError}
                steamGames={steamGames}
                epicGames={epicGames}
                steamLoading={steamLoading}
                epicLoading={epicLoading}
                steamError={steamError}
                epicError={epicError}
                rescanInstalledApps={rescanInstalledApps}
                rescanSteamGames={rescanSteamGames}
                rescanEpicGames={rescanEpicGames}
              />
            </div>
          )}
          
          {activeTab === 'behavior' && renderChannelBehaviorTab()}
        </div>
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