import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import useSoundManager from '../../utils/useSoundManager';
import useSoundLibrary from '../../utils/useSoundLibrary';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import WToggle from '../../ui/WToggle';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import Button from '../../ui/WButton';
import ResourceUsageIndicator from '../ResourceUsageIndicator';
import Slider from '../../ui/Slider';
import '../sound-management.css';

/**
 * Sound Settings Tab - Complete sound management interface
 * Manages background music, channel click sounds, and channel hover sounds
 */
const SoundsSettingsTab = React.memo(() => {
  // Sound management hooks
  const {
    soundSettings,
    playChannelClickSound,
    playChannelHoverSound,
    stopAllSounds,
    toggleBackgroundMusic,
    toggleBackgroundMusicLooping,
    togglePlaylistMode,
    updateChannelClickSound,
    updateChannelHoverSound,
    saveSoundSettings,
    updateBackgroundMusic
  } = useSoundManager();

  const {
    soundLibrary,
    loading,
    error,
    SOUND_CATEGORIES,
    addSound,
    removeSound,
    updateSound,
    toggleLike,
    selectSoundFile,
    getSoundsByCategory,
    getEnabledSoundsByCategory,
    getLikedSoundsByCategory,
    clearError,
    loadSoundLibrary
  } = useSoundLibrary();

  // Local state
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState({});
  const [testing, setTesting] = useState({});
  const [audioRefs, setAudioRefs] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  
  // Get sounds state from consolidated store
  const sounds = useConsolidatedAppStore((state) => state.sounds);
  const { setSoundsState } = useConsolidatedAppStore(state => state.actions);
  






  // Clear message after 3 seconds
  React.useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  // Stop all audio on unmount
  React.useEffect(() => {
    return () => {
      Object.values(audioRefs).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, [audioRefs]);

  // Debug: Log current sound library state (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SoundsSettingsTab] Current sound library:', soundLibrary);
      console.log('[SoundsSettingsTab] Background music sounds:', soundLibrary.backgroundMusic);
      console.log('[SoundsSettingsTab] Sound settings:', soundSettings);
    }
  }, [soundLibrary, soundSettings]);





  // Show message helper
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
  }, []);

  // Handle file upload
  const handleUploadClick = useCallback(async (category) => {
    try {
      console.log('[SoundsSettingsTab] Starting upload for category:', category);
      setUploading(prev => ({ ...prev, [category]: true }));
      showMessage('info', 'Selecting sound file...');

      const fileResult = await selectSoundFile();
      console.log('[SoundsSettingsTab] File selection result:', fileResult);
      
      if (!fileResult.success) {
        throw new Error(fileResult.error || 'File selection failed');
      }
      
      const { file } = fileResult;
      console.log('[SoundsSettingsTab] Selected file:', file);
      
      // Generate name from filename
      const name = file.name.replace(/\.[^/.]+$/, '');
      console.log('[SoundsSettingsTab] Generated name:', name);
      
      showMessage('info', 'Uploading sound...');
      console.log('[SoundsSettingsTab] Adding sound to library...');
      
      const addResult = await addSound(category, file, name);
      console.log('[SoundsSettingsTab] Add sound result:', addResult);
      
      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add sound');
      }
      
      showMessage('success', 'Sound uploaded successfully!');
      console.log('[SoundsSettingsTab] Sound uploaded successfully');
      
      // Reload the sound library to get the updated state
      console.log('[SoundsSettingsTab] Reloading sound library...');
      await loadSoundLibrary();
      console.log('[SoundsSettingsTab] Sound library reloaded');
      
    } catch (err) {
      console.error('[SoundsSettingsTab] Upload error:', err);
      showMessage('error', err.message || 'Failed to upload sound');
    } finally {
      setUploading(prev => ({ ...prev, [category]: false }));
    }
  }, [selectSoundFile, addSound, loadSoundLibrary, showMessage]);

  // Handle sound deletion
  const handleDeleteSound = useCallback(async (category, soundId) => {
    try {
      await removeSound(category, soundId);
      showMessage('success', 'Sound deleted successfully');
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete sound');
    }
  }, [removeSound, showMessage]);

  // Handle sound testing
  const handleTestSound = useCallback((category, sound) => {
    // Stop all other audio
    Object.values(audioRefs).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setAudioRefs({});
    setTesting({});

    // Play new audio
    const audio = new Audio(sound.url);
    audio.volume = sound.volume ?? 0.5;
    audio.play();
    setAudioRefs({ [sound.id]: audio });
    setTesting({ [sound.id]: true });
    
    audio.onended = () => {
      setTesting({});
      setAudioRefs({});
    };
  }, [audioRefs]);

  const handleStopTest = useCallback((soundId) => {
    const audio = audioRefs[soundId];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setTesting({});
      setAudioRefs({});
    }
  }, [audioRefs]);

  // Handle sound toggle (enable/disable)
  const handleToggleSound = useCallback(async (category, soundId) => {
    try {
      const sounds = getSoundsByCategory(category);
      const sound = sounds.find(s => s.id === soundId);
      
      if (!sound) return;

      // For non-playlist categories, disable all others first
      if (category !== 'backgroundMusic' || !soundSettings.backgroundMusicPlaylistMode) {
        for (const s of sounds) {
          if (s.id !== soundId && s.enabled) {
            await updateSound(category, s.id, { enabled: false });
          }
        }
      }

      // Toggle the selected sound
      await updateSound(category, soundId, { enabled: !sound.enabled });
      
      // Update sound manager settings
      if (category === 'channelClick') {
        const enabledSound = getEnabledSoundsByCategory(category)[0];
        updateChannelClickSound(!!enabledSound, enabledSound?.volume ?? 0.5);
      } else if (category === 'channelHover') {
        const enabledSound = getEnabledSoundsByCategory(category)[0];
        updateChannelHoverSound(!!enabledSound, enabledSound?.volume ?? 0.5);
      } else if (category === 'backgroundMusic') {
        // Update background music when background music settings change
        updateBackgroundMusic();
      }

      showMessage('success', `Sound ${sound.enabled ? 'disabled' : 'enabled'} successfully`);
    } catch (err) {
      showMessage('error', err.message || 'Failed to toggle sound');
    }
  }, [getSoundsByCategory, getEnabledSoundsByCategory, soundSettings.backgroundMusicPlaylistMode, updateSound, updateChannelClickSound, updateChannelHoverSound, updateBackgroundMusic, showMessage]);

  // Handle volume change
  const handleVolumeChange = useCallback(async (category, soundId, volume) => {
    try {
      await updateSound(category, soundId, { volume });
      
      // Update sound manager settings
      if (category === 'channelClick') {
        const enabledSound = getEnabledSoundsByCategory(category)[0];
        updateChannelClickSound(!!enabledSound, enabledSound?.volume ?? volume);
      } else if (category === 'channelHover') {
        const enabledSound = getEnabledSoundsByCategory(category)[0];
        updateChannelHoverSound(!!enabledSound, enabledSound?.volume ?? volume);
      } else if (category === 'backgroundMusic') {
        // Update background music when background music volume changes
        updateBackgroundMusic();
      }

      // Update test audio volume if playing
      if (audioRefs[soundId]) {
        audioRefs[soundId].volume = volume;
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to update volume');
    }
  }, [updateSound, getEnabledSoundsByCategory, updateChannelClickSound, updateChannelHoverSound, updateBackgroundMusic, audioRefs, showMessage]);

  // Handle like toggle
  const handleToggleLike = useCallback(async (soundId) => {
    try {
      await toggleLike(soundId);
      showMessage('success', 'Like status updated');
    } catch (err) {
      showMessage('error', err.message || 'Failed to update like status');
    }
  }, [toggleLike, showMessage]);



  // Handle setting changes - update consolidated store and save immediately
  const handleSettingChange = useCallback((key, value) => {
    setSoundsState({ [key]: value });
  }, [setSoundsState]);



  // Drag and drop handlers for playlist reordering
  const handleDragStart = useCallback((e, soundId) => {
    if (!(sounds?.backgroundMusicPlaylistMode ?? false)) return;
    setDraggedItem(soundId);
    e.dataTransfer.effectAllowed = 'move';
  }, [sounds?.backgroundMusicPlaylistMode]);

  const handleDragOver = useCallback((e, soundId) => {
    if (!(sounds?.backgroundMusicPlaylistMode ?? false) || !draggedItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(soundId);
  }, [sounds?.backgroundMusicPlaylistMode, draggedItem]);

  const handleDrop = useCallback((e, targetSoundId) => {
    if (!(sounds?.backgroundMusicPlaylistMode ?? false) || !draggedItem || draggedItem === targetSoundId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }
    
    e.preventDefault();
    
    // Reorder the background music array
    const currentSounds = [...getSoundsByCategory('backgroundMusic')];
    const draggedIndex = currentSounds.findIndex(s => s.id === draggedItem);
    const targetIndex = currentSounds.findIndex(s => s.id === targetSoundId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedSound] = currentSounds.splice(draggedIndex, 1);
      currentSounds.splice(targetIndex, 0, draggedSound);
      
      // Update the order in the backend
      currentSounds.forEach((sound, index) => {
        updateSound('backgroundMusic', sound.id, { order: index });
      });
      
      showMessage('success', 'Playlist order updated!');
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  }, [sounds?.backgroundMusicPlaylistMode, draggedItem, getSoundsByCategory, updateSound, showMessage]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItem(null);
  }, []);

  // Test channel click sound
  const handleTestChannelClick = useCallback(async () => {
    try {
      await playChannelClickSound();
      showMessage('success', 'Channel click sound played');
    } catch (err) {
      showMessage('error', 'No channel click sound enabled');
    }
  }, [playChannelClickSound, showMessage]);

  // Test channel hover sound
  const handleTestChannelHover = useCallback(async () => {
    try {
      await playChannelHoverSound();
      showMessage('success', 'Channel hover sound played');
    } catch (err) {
      showMessage('error', 'No channel hover sound enabled');
    }
  }, [playChannelHoverSound, showMessage]);

  // Render sound section
  const renderSoundSection = (category) => {
    const sounds = getSoundsByCategory(category.key);
    const enabledSounds = getEnabledSoundsByCategory(category.key);
    const likedSounds = getLikedSoundsByCategory(category.key);
    const catIconClass =
      category.key === 'backgroundMusic'
        ? 'sound-cat-icon--bg-music'
        : category.key === 'channelClick'
          ? 'sound-cat-icon--click'
          : 'sound-cat-icon--hover';
    const catEmoji =
      category.key === 'backgroundMusic' ? '🎵' : category.key === 'channelClick' ? '🖱️' : '🎧';

  return (
      <Card
        key={category.key}
        className="sound-settings-card"
        title={
          <div className="sound-mgmt-title-row">
            <div className={`sound-cat-icon ${catIconClass}`}>
              {catEmoji}
            </div>
            <div>
              <div className="sound-cat-title-row">
                <span className="sound-cat-label">{category.label}</span>
                {category.key === 'backgroundMusic' && (
                  <ResourceUsageIndicator 
                    level="high" 
                    tooltip="Background music plays continuously and can use significant CPU and memory resources"
                  />
                )}
                {category.key === 'channelHover' && (
                  <ResourceUsageIndicator 
                    level="medium" 
                    tooltip="Hover sounds play frequently and can impact performance with many channels"
                  />
                )}
              </div>
              <div className="sound-cat-desc">
                {category.key === 'backgroundMusic' ? 'Continuous background audio' :
                 category.key === 'channelClick' ? 'Sounds when clicking channels' :
                 'Sounds when hovering over channels'}
              </div>
            </div>
          </div>
        }
        separator
      >
        <div className="sound-card-pad">
          {/* Category-specific settings */}
          {category.key === 'backgroundMusic' && (
          <div className="sound-mb-20">
              <div className="sound-panel">
                <div className="sound-panel-head">
                  <div className="sound-panel-head-row">
                    <span className="sound-emoji-lg">⚙️</span>
                    <Text variant="p" className="sound-section-heading">
                      Background Music Settings
                    </Text>
                  </div>
                </div>
                
                <div className="sound-stack-12">
                  <WToggle
                    checked={sounds?.backgroundMusicEnabled ?? true}
                    onChange={(checked) => handleSettingChange('backgroundMusicEnabled', checked)}
                    label="Enable Background Music"
                  />
                  
                  {(sounds?.backgroundMusicEnabled ?? true) && (
                    <>
                      <WToggle
                        checked={sounds?.backgroundMusicLooping ?? true}
                        onChange={(checked) => handleSettingChange('backgroundMusicLooping', checked)}
                        label="Loop Music"
                      />
                      
                      <WToggle
                        checked={sounds?.backgroundMusicPlaylistMode ?? false}
                        onChange={(checked) => handleSettingChange('backgroundMusicPlaylistMode', checked)}
                        label="Playlist Mode (Play liked sounds in order)"
                      />
                      
              </>
            )}
          </div>
              </div>

              {/* Playlist Mode Info */}
              {(sounds?.backgroundMusicEnabled ?? true) && (sounds?.backgroundMusicPlaylistMode ?? false) && (
                <div className="sound-callout sound-callout--playlist">
                  <div className="sound-callout-head">
                    <span className="sound-emoji-lg">🎵</span>
                    <div className="sound-callout--playlist-title">
                      Playlist Mode Active ({likedSounds.length} liked sounds)
                    </div>
                  </div>
                  <div className="sound-callout--playlist-body">
                    Only liked sounds will play in the order they appear below. 
                    Click the ❤️ to like/unlike sounds and drag items to reorder your playlist.
                  </div>
                </div>
              )}

          {/* Background Music Disabled Warning */}
              {!(sounds?.backgroundMusicEnabled ?? true) && (
            <div className="sound-callout sound-callout--warn-music">
              <div className="sound-callout-head">
                <span className="sound-emoji-lg">🔇</span>
                <div className="sound-callout--warn-music-title">
                  Background Music Disabled
                </div>
              </div>
              <div className="sound-callout--warn-music-body">
                Background music is currently disabled. Enable it above to hear background music sounds.
              </div>
            </div>
          )}
              </div>
          )}

          {/* Channel Click Settings */}
          {category.key === 'channelClick' && (
            <div className="sound-mb-20">
              <div className="sound-panel">
                <div className="sound-panel-head">
                  <div className="sound-panel-head-row">
                    <span className="sound-emoji-lg">⚙️</span>
                    <Text variant="p" className="sound-section-heading">
                      Channel Click Settings
                    </Text>
                  </div>
                </div>
                
                <WToggle
                  checked={sounds?.channelClickEnabled ?? true}
                  onChange={(checked) => handleSettingChange('channelClickEnabled', checked)}
                  label="Enable Channel Click Sounds"
                />
              </div>
            </div>
          )}

          {/* Channel Hover Settings */}
          {category.key === 'channelHover' && (
            <div className="sound-mb-20">
              <div className="sound-panel">
                <div className="sound-panel-head">
                  <div className="sound-panel-head-row">
                    <span className="sound-emoji-lg">⚙️</span>
                    <Text variant="p" className="sound-section-heading">
                      Channel Hover Settings
                    </Text>
                  </div>
                </div>
                
                <WToggle
                  checked={sounds?.channelHoverEnabled ?? true}
                  onChange={(checked) => handleSettingChange('channelHoverEnabled', checked)}
                  label="Enable Channel Hover Sounds"
                />
              </div>
            </div>
          )}

          {/* Other category test buttons */}
          {category.key === 'channelClick' && (
            <div className="sound-mb-16">
              <Button
                variant="secondary"
                size="sm"
                className="sound-btn-test-click"
                onClick={handleTestChannelClick}
                disabled={!(sounds?.channelClickEnabled ?? true) || enabledSounds.length === 0}
              >
                🎵 Test Channel Click Sound
              </Button>
            </div>
          )}

          {category.key === 'channelHover' && (
            <div className="sound-mb-16">
              <Button
                variant="secondary"
                size="sm"
                className="sound-btn-test-hover"
                onClick={handleTestChannelHover}
                disabled={!(sounds?.channelHoverEnabled ?? true) || enabledSounds.length === 0}
              >
                🎵 Test Channel Hover Sound
              </Button>
        </div>
          )}

          {/* Sound List */}
          <div className="sound-mb-16">
            {sounds.length === 0 && (
              <Text variant="help" className="sound-help-italic">No sounds yet. Add your first sound below.</Text>
            )}
            
            {sounds.map(sound => (
              <div
                key={sound.id}
                className={[
                  'sound-row',
                  sound.enabled ? 'sound-row--enabled' : 'sound-row--disabled',
                  draggedItem === sound.id ? 'sound-row--dragging' : '',
                  category.key === 'backgroundMusic' && !(sounds?.backgroundMusicEnabled ?? true) ? 'sound-row--faded' : '',
                  category.key === 'backgroundMusic' && (sounds?.backgroundMusicPlaylistMode ?? false) ? 'sound-row--draggable' : '',
                ].filter(Boolean).join(' ')}
                draggable={category.key === 'backgroundMusic' && (sounds?.backgroundMusicPlaylistMode ?? false)}
                onDragStart={(e) => handleDragStart(e, sound.id)}
                onDragOver={(e) => handleDragOver(e, sound.id)}
                onDrop={(e) => handleDrop(e, sound.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="sound-row-main">
                  {category.key === 'backgroundMusic' && (sounds?.backgroundMusicPlaylistMode ?? false) && (
                    <span className="sound-drag-handle" title="Drag to reorder">⋮⋮</span>
                  )}
                  
                  <div className="sound-row-body">
                    <div className="sound-name-row">
                      <span className="sound-name">{sound.name}</span>
                      {sound.isDefault && (
                        <span className="sound-badge-default">
                          Default
                        </span>
                      )}
                      {sound.liked && <span>❤️</span>}
          </div>
          
                    <div className="sound-vol-row">
                      <div className="sound-vol-group">
                        <span className="sound-vol-label">Volume:</span>
                        <Slider
                          value={sound.volume ?? 0.5}
                          onChange={(value) => handleVolumeChange(category.key, sound.id, value)}
                    min={0}
                    max={1}
                    step={0.01}
                          disabled={category.key === 'backgroundMusic' && !(sounds?.backgroundMusicEnabled ?? true)}
                          hideValue
                          containerClassName="!mb-0 sound-slider-grow"
                  />
                        <span className="sound-vol-pct">
                          {Math.round((sound.volume ?? 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>
                </div>
                
                <div className="sound-actions">
                  {testing[sound.id] ? (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="sound-btn-min-60"
                      onClick={() => handleStopTest(sound.id)}
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="sound-btn-min-60"
                      onClick={() => handleTestSound(category.key, sound)} 
                      disabled={category.key === 'backgroundMusic' && !(sounds?.backgroundMusicEnabled ?? true)}
                    >
                      Test
                    </Button>
                  )}
                  
                  {category.key === 'backgroundMusic' && (
                    <Button 
                      variant="tertiary" 
                      size="sm" 
                      className={`sound-btn-icon ${sound.liked ? 'sound-like--active' : 'sound-like--inactive'}`}
                      onClick={() => handleToggleLike(sound.id)}
                      title={sound.liked ? 'Unlike' : 'Like'}
                      disabled={!(sounds?.backgroundMusicEnabled ?? true)}
                    >
                      {sound.liked ? '❤️' : '🤍'}
                    </Button>
                  )}
                  
                  {!sound.isDefault && (
                    <Button 
                      variant="danger-secondary" 
                      size="sm" 
                      className="sound-btn-icon"
                      onClick={() => handleDeleteSound(category.key, sound.id)} 
                      title="Delete Sound"
                    >
                      🗑️
                    </Button>
                  )}
                  
            <WToggle
                    checked={!!sound.enabled}
                    onChange={() => handleToggleSound(category.key, sound.id)}
                    disabled={category.key === 'backgroundMusic' && !(sounds?.backgroundMusicEnabled ?? true)}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="sound-row-actions">
            <Button
              variant="primary"
              size="sm"
              className="sound-btn-add"
              onClick={() => handleUploadClick(category.key)}
              disabled={uploading[category.key]}
            >
              {uploading[category.key] ? '⏳ Uploading...' : '➕ Add Sound'}
            </Button>
            </div>
        </div>
      </Card>
    );
  };

  const messageToneClass =
    message.type === 'error'
      ? 'sound-msg--error'
      : message.type === 'success'
        ? 'sound-msg--success'
        : message.type === 'info'
          ? 'sound-msg--info'
          : 'sound-msg--hint';

  return (
    <div className="sound-mgmt">
      {/* Enhanced Header */}
      <div className="sound-mgmt-header">
        <div className="sound-mgmt-title-row">
          <div className="sound-mgmt-header-icon">
            🔊
          </div>
          <div>
            <h3 className="sound-mgmt-title">
              Sound Management
            </h3>
            <p className="sound-mgmt-subtitle">
              Manage background music, channel click sounds, and hover effects
            </p>
          </div>
        </div>

      </div>

      {/* Enhanced Error/Message Display */}
      {error && (
        <div className="sound-alert sound-alert--error">
          <div className="sound-msg-row">
            <span className="sound-emoji-md">⚠️</span>
            <strong>Error:</strong> {error}
          </div>
          <Button 
            variant="tertiary" 
            size="sm" 
            className="sound-msg-dismiss"
            onClick={clearError}
          >
            Dismiss
          </Button>
        </div>
      )}

      {message.text && (
        <div className={`sound-msg ${messageToneClass}`}>
          <div className="sound-msg-row">
            <span className="sound-emoji-md">
              {message.type === 'error' ? '⚠️' : 
               message.type === 'success' ? '✅' : 
               message.type === 'info' ? 'ℹ️' : '💡'}
            </span>
            {message.text}
          </div>
        </div>
      )}

      {/* Enhanced Loading State */}
      {loading && (
        <div className="sound-loading">
          <div className="sound-loading-spinner" aria-hidden />
          <span className="sound-loading-label">Loading sound library...</span>
        </div>
      )}

      {/* Sound Sections */}
      <div>
        {SOUND_CATEGORIES.map(cat => renderSoundSection(cat))}
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
      <Card
          title="Debug Info"
        separator
        className="sound-settings-card--tight sound-card-pad--debug"
      >
        <div className="sound-card-pad">
            <Text variant="p" className="sound-debug-pre">
              {JSON.stringify(soundSettings, null, 2)}
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
});

SoundsSettingsTab.displayName = 'SoundsSettingsTab';

export default SoundsSettingsTab; 