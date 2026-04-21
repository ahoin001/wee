import React, { useState, useEffect, useCallback, useMemo } from 'react';
import isEqual from 'fast-deep-equal';
import PropTypes from 'prop-types';
import ChannelModalSuggestedGames from './ChannelModalSuggestedGames';
import ChannelModalUnifiedPathBlock from './channelModal/ChannelModalUnifiedPathBlock';
import ChannelModalSetupTab from './channelModal/ChannelModalSetupTab';
import ChannelModalSuggestedTab from './channelModal/ChannelModalSuggestedTab';
import ChannelModalBehaviorTab from './channelModal/ChannelModalBehaviorTab';
import WeeChannelModal from './WeeChannelModal';
import WeeButton from '../../ui/wee/WeeButton';
import { useChannelModalHoverSound } from '../../hooks/useChannelModalHoverSound';
import { useChannelModalInitialization } from '../../hooks/useChannelModalInitialization';
import { useChannelModalMedia } from '../../hooks/useChannelModalMedia';
// Remove unused imports related to old fetching/caching logic
// import { loadGames, clearGamesCache, searchGames, getLastUpdated, getLastError } from '../../utils/steamGames';
import { resolveAppForUnifiedPath } from '../../utils/channelModalFindMatchingApp';
import { validateChannelPath, normalizeChannelPath } from '../../utils/channelPathValidation';
import { useAppLibraryState } from '../../utils/useConsolidatedAppHooks';
import { preloadMediaLibrary } from '../../utils/mediaLibraryCache';
import useSoundLibrary from '../../utils/useSoundLibrary';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { getChannelDataSlice } from '../../utils/channelSpaces';
import './ChannelModal.css';

const channelsApi = window.api?.channels;

function ChannelModal({
  channelId,
  channelSpaceKey = 'home',
  onClose,
  onSave,
  currentMedia,
  currentPath,
  currentType,
  currentHoverSound,
  currentAsAdmin,
  currentAnimatedOnHover,
  currentKenBurnsEnabled,
  currentKenBurnsMode,
  isOpen = true,
  onExitAnimationComplete,
}) {
  const {
    media,
    setMedia,
    setImageGallery,
    setGalleryMode,
    handleImageSelect,
    handleRemoveImage,
    mediaUploadHint,
    setMediaUploadHint,
    clearMediaUploadHint,
    libraryUploading,
    handleUploadToLibraryAndChannel,
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
    () => getChannelDataSlice(channels, channelSpaceKey).channelConfigs || {},
    [channels, channelSpaceKey]
  );
  const configuredChannels = useMemo(
    () => getChannelDataSlice(channels, channelSpaceKey).configuredChannels || {},
    [channels, channelSpaceKey]
  );

  const setUnifiedAppsState = useConsolidatedAppStore((state) => state.actions.setUnifiedAppsState);

  /** Clear global app picker selection so UnifiedAppPathCard does not show the previous channel's app */
  useEffect(() => {
    if (!isOpen) return;
    setUnifiedAppsState({ selectedApp: null, selectedAppType: 'all', searchQuery: '' });
  }, [isOpen, channelId, setUnifiedAppsState]);

  useEffect(() => {
    if (isOpen) clearMediaUploadHint();
  }, [isOpen, channelId, clearMediaUploadHint]);

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
    isOpen: Boolean(isOpen),
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
    const buildPathFromSelectedApp = (app) => {
      if (!app?.path) return '';
      const args = typeof app.args === 'string' ? app.args.trim() : '';
      return args ? `${app.path} ${args}` : app.path;
    };

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
      const derivedPath = config.selectedApp
        ? buildPathFromSelectedApp(config.selectedApp)
        : (config.path || '');
      setType(newType);
      setPath(derivedPath);
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

    const resolvedAnimatedOnHover = animatedOnHover === 'global' ? undefined : animatedOnHover;
    const newChannel = {
      media,
      path: persistedPath || null,
      type: persistedPath ? type : null,
      asAdmin,
      hoverSound: hoverSoundEnabled && hoverSoundUrl ? { url: hoverSoundUrl, name: hoverSoundName, volume: hoverSoundVolume } : null,
      animatedOnHover: resolvedAnimatedOnHover,
    };
    
    // Save channel data to consolidated store
    if (onSave) {
      onSave(channelId, newChannel);
    }
    
    // Save Ken Burns settings to channel configs
    const resolvedKenBurnsEnabled = kenBurnsEnabled === 'global' ? undefined : kenBurnsEnabled;
    const resolvedKenBurnsMode = kenBurnsMode === 'global' ? undefined : kenBurnsMode;
    const kenBurnsConfig = {
      kenBurnsEnabled: resolvedKenBurnsEnabled,
      kenBurnsMode: resolvedKenBurnsMode,
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
      actions.updateChannelConfigForSpace(channelSpaceKey, channelId, kenBurnsConfig);
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
    actions.updateChannelConfigForSpace(channelSpaceKey, channelId, null);
    
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
    const mediaChanged = !isEqual(media, currentMedia);
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
    const hoverSoundChanged = !isEqual(currentHoverSoundData, newHoverSoundData);
    
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
      <div className="flex flex-row flex-wrap justify-end gap-3 channel-modal-footer-row">
        <WeeButton variant="secondary" onClick={handleClose}>Cancel</WeeButton>
        <WeeButton
          variant="danger"
          onClick={() => handleClearChannel(handleClose)}
        >
          Clear Channel
        </WeeButton>
        <WeeButton
          variant="primary"
          onClick={() => handleSave(handleClose)}
          disabled={!canSave}
          title={saveTooltip}
        >
          Save Channel
        </WeeButton>
      </div>
      {showError && saveTooltip && (
        <div className="mt-2 text-sm font-medium text-[hsl(var(--state-error))]">{saveTooltip}</div>
      )}
    </>
  );

  const headerTitle =
    activeTab === 'setup' ? 'Channel Setup' : activeTab === 'behavior' ? 'Runtime Logic' : 'Suggested';
  const statusReady = Boolean(media && (!path.trim() || !pathError));

  const storeSelectedApp = useConsolidatedAppStore((s) => s.unifiedApps.selectedApp);
  const matchingApp = useMemo(
    () => resolveAppForUnifiedPath(path, type, storeSelectedApp),
    [path, type, storeSelectedApp]
  );

  return (
    <>
      <WeeChannelModal
        key={`channel-modal-${channelId}`}
        isOpen={isOpen}
        onClose={onClose}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        headerTitle={headerTitle}
        statusReady={statusReady}
        footerContent={footerContent}
        maxWidth="min(1400px, 96vw)"
        onExitAnimationComplete={onExitAnimationComplete}
      >
        <div className="channel-modal-wee-inner min-w-0">
          {activeTab === 'setup' && (
            <ChannelModalSetupTab
              pathCardContent={
                <ChannelModalUnifiedPathBlock
                  channelId={channelId}
                  isOpen={isOpen}
                  path={path}
                  type={type}
                  pathError={pathError}
                  matchingApp={matchingApp}
                  onUnifiedAppPathChange={handleUnifiedAppPathChange}
                  onApplySmartSuggestion={handleApplySmartSuggestion}
                  onApplySuggestedMedia={setMedia}
                  onSelectFromLibrary={handleImageSelect}
                  onUploadToLibraryAndChannel={handleUploadToLibraryAndChannel}
                  libraryUploading={libraryUploading}
                  onRemoveMedia={handleRemoveImage}
                  media={media}
                  mediaUploadHint={mediaUploadHint}
                  setMediaUploadHint={setMediaUploadHint}
                />
              }
            />
          )}

          {activeTab === 'suggested' && (
            <ChannelModalSuggestedTab
              suggestedGames={
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
              }
            />
          )}

          {activeTab === 'behavior' && (
            <ChannelModalBehaviorTab
              channelId={channelId}
              asAdmin={asAdmin}
              setAsAdmin={setAsAdmin}
              hoverSoundEnabled={hoverSoundEnabled}
              setHoverSoundEnabled={setHoverSoundEnabled}
              hoverSoundUrl={hoverSoundUrl}
              hoverSoundName={hoverSoundName}
              hoverSoundVolume={hoverSoundVolume}
              hoverSoundAudio={hoverSoundAudio}
              selectedHoverSoundId={selectedHoverSoundId}
              uploadingHoverSound={uploadingHoverSound}
              hoverSoundInputRef={hoverSoundInputRef}
              soundLibraryLoading={soundLibraryLoading}
              getSoundsByCategory={getSoundsByCategory}
              clearHoverSoundSelection={clearHoverSoundSelection}
              handleTestHoverSound={handleTestHoverSound}
              handleHoverSoundVolumeChange={handleHoverSoundVolumeChange}
              handleHoverSoundSelect={handleHoverSoundSelect}
              handleHoverSoundUpload={handleHoverSoundUpload}
              handleHoverSoundFile={handleHoverSoundFile}
              animatedOnHover={animatedOnHover}
              setAnimatedOnHover={setAnimatedOnHover}
              kenBurnsEnabled={kenBurnsEnabled}
              setKenBurnsEnabled={setKenBurnsEnabled}
              kenBurnsMode={kenBurnsMode}
              setKenBurnsMode={setKenBurnsMode}
            />
          )}
        </div>
      </WeeChannelModal>
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
  isOpen: PropTypes.bool,
  onExitAnimationComplete: PropTypes.func,
};

export default ChannelModal; 

