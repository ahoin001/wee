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
  const { sounds } = useConsolidatedAppStore();
  const { setSoundState } = useConsolidatedAppStore(state => state.actions);
  






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
  const handleSettingChange = useCallback(async (key, value) => {
    setSoundState({ [key]: value });
    
    // Save to backend immediately
    try {
      if (window.api?.settings?.get && window.api?.settings?.set) {
        const currentSettings = await window.api.settings.get();
        const updatedSettings = {
          ...currentSettings,
          [key]: value
        };
        await window.api.settings.set(updatedSettings);
      }
    } catch (error) {
      console.error('[SoundsSettingsTab] Failed to save setting:', error);
    }
  }, [setSoundState]);



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

  return (
      <Card
        key={category.key}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: category.key === 'backgroundMusic' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                         category.key === 'channelClick' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                         'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: 'white'
            }}>
              {category.key === 'backgroundMusic' ? '🎵' : 
               category.key === 'channelClick' ? '🖱️' : '🎧'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>{category.label}</span>
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
              <div style={{ 
                fontSize: '12px', 
                color: 'hsl(var(--text-secondary))',
                fontWeight: '500'
              }}>
                {category.key === 'backgroundMusic' ? 'Continuous background audio' :
                 category.key === 'channelClick' ? 'Sounds when clicking channels' :
                 'Sounds when hovering over channels'}
              </div>
            </div>
          </div>
        }
        separator
        style={{ 
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid hsl(var(--border-primary))'
        }}
      >
        <div style={{ padding: '20px' }}>
          {/* Category-specific settings */}
          {category.key === 'backgroundMusic' && (
          <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px',
                padding: '20px',
                background: 'linear-gradient(135deg, hsl(var(--surface-secondary)) 0%, hsl(var(--surface-tertiary)) 100%)',
                borderRadius: '12px',
                border: '1px solid hsl(var(--border-primary))',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '2px solid hsl(var(--border-primary))'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⚙️</span>
                    <Text variant="p" style={{ fontWeight: 700, margin: 0, fontSize: '16px' }}>
                      Background Music Settings
                    </Text>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                <div style={{ 
                  padding: '16px', 
                  background: 'linear-gradient(135deg, #eef 0%, #ccf 100%)', 
                  border: '1px solid #bee5eb', 
                  borderRadius: '12px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(23, 162, 184, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🎵</span>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0c5460' }}>
                      Playlist Mode Active ({likedSounds.length} liked sounds)
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#0c5460', lineHeight: '1.4' }}>
                    Only liked sounds will play in the order they appear below. 
                    Click the ❤️ to like/unlike sounds and drag items to reorder your playlist.
                  </div>
                </div>
              )}

          {/* Background Music Disabled Warning */}
              {!(sounds?.backgroundMusicEnabled ?? true) && (
            <div style={{ 
              padding: '16px', 
              background: 'linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%)', 
              border: '1px solid #ffeaa7', 
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>🔇</span>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#856404' }}>
                  Background Music Disabled
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#856404', lineHeight: '1.4' }}>
                Background music is currently disabled. Enable it above to hear background music sounds.
              </div>
            </div>
          )}
              </div>
          )}

          {/* Channel Click Settings */}
          {category.key === 'channelClick' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px',
                padding: '20px',
                background: 'linear-gradient(135deg, hsl(var(--surface-secondary)) 0%, hsl(var(--surface-tertiary)) 100%)',
                borderRadius: '12px',
                border: '1px solid hsl(var(--border-primary))',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '2px solid hsl(var(--border-primary))'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⚙️</span>
                    <Text variant="p" style={{ fontWeight: 700, margin: 0, fontSize: '16px' }}>
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
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px',
                padding: '20px',
                background: 'linear-gradient(135deg, hsl(var(--surface-secondary)) 0%, hsl(var(--surface-tertiary)) 100%)',
                borderRadius: '12px',
                border: '1px solid hsl(var(--border-primary))',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '2px solid hsl(var(--border-primary))'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⚙️</span>
                    <Text variant="p" style={{ fontWeight: 700, margin: 0, fontSize: '16px' }}>
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
            <div style={{ marginBottom: '16px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestChannelClick}
                disabled={!(sounds?.channelClickEnabled ?? true) || enabledSounds.length === 0}
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '600',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(240, 147, 251, 0.3)'
                }}
              >
                🎵 Test Channel Click Sound
              </Button>
            </div>
          )}

          {category.key === 'channelHover' && (
            <div style={{ marginBottom: '16px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestChannelHover}
                disabled={!(sounds?.channelHoverEnabled ?? true) || enabledSounds.length === 0}
                style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '600',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(79, 172, 254, 0.3)'
                }}
              >
                🎵 Test Channel Hover Sound
              </Button>
        </div>
          )}

          {/* Sound List */}
          <div style={{ marginBottom: '16px' }}>
            {sounds.length === 0 && (
              <Text variant="help" style={{ fontStyle: 'italic' }}>No sounds yet. Add your first sound below.</Text>
            )}
            
            {sounds.map(sound => (
              <div
                key={sound.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  marginBottom: '12px',
                  background: sound.enabled ? 
                    'linear-gradient(135deg, hsl(var(--surface-secondary)) 0%, hsl(var(--surface-tertiary)) 100%)' : 
                    'hsl(var(--surface-tertiary))',
                  border: `2px solid ${sound.enabled ? 'hsl(var(--border-primary))' : 'hsl(var(--border-secondary))'}`,
                  borderRadius: '12px',
                  opacity: category.key === 'backgroundMusic' && !(sounds?.backgroundMusicEnabled ?? true) ? 0.6 : 1,
                  cursor: category.key === 'backgroundMusic' && (sounds?.backgroundMusicPlaylistMode ?? false) ? 'grab' : 'default',
                  transform: draggedItem === sound.id ? 'scale(0.98)' : 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: sound.enabled ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                draggable={category.key === 'backgroundMusic' && (sounds?.backgroundMusicPlaylistMode ?? false)}
                onDragStart={(e) => handleDragStart(e, sound.id)}
                onDragOver={(e) => handleDragOver(e, sound.id)}
                onDrop={(e) => handleDrop(e, sound.id)}
                onDragEnd={handleDragEnd}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {category.key === 'backgroundMusic' && (sounds?.backgroundMusicPlaylistMode ?? false) && (
                    <span style={{ cursor: 'grab', fontSize: '16px' }} title="Drag to reorder">⋮⋮</span>
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500 }}>{sound.name}</span>
                      {sound.isDefault && (
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '2px 6px', 
                          background: '#007bff', 
                          color: 'white', 
                          borderRadius: '4px' 
                        }}>
                          Default
                        </span>
                      )}
                      {sound.liked && <span>❤️</span>}
          </div>
          
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '12px', minWidth: '40px' }}>Volume:</span>
                        <Slider
                          value={sound.volume ?? 0.5}
                          onChange={(value) => handleVolumeChange(category.key, sound.id, value)}
                    min={0}
                    max={1}
                    step={0.01}
                          disabled={category.key === 'backgroundMusic' && !(sounds?.backgroundMusicEnabled ?? true)}
                          style={{ flex: 1 }}
                  />
                        <span style={{ fontSize: '12px', minWidth: '30px' }}>
                          {Math.round((sound.volume ?? 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {testing[sound.id] ? (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleStopTest(sound.id)}
                      style={{ minWidth: 60 }}
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleTestSound(category.key, sound)} 
                      style={{ minWidth: 60 }}
                      disabled={category.key === 'backgroundMusic' && !(sounds?.backgroundMusicEnabled ?? true)}
                    >
                      Test
                    </Button>
                  )}
                  
                  {category.key === 'backgroundMusic' && (
                    <Button 
                      variant="tertiary" 
                      size="sm" 
                      onClick={() => handleToggleLike(sound.id)}
                      title={sound.liked ? 'Unlike' : 'Like'}
                      disabled={!(sounds?.backgroundMusicEnabled ?? true)}
                      style={{ 
                        minWidth: 40, 
                        padding: '4px 8px',
                        color: sound.liked ? '#e91e63' : 'hsl(var(--text-secondary))'
                      }}
                    >
                      {sound.liked ? '❤️' : '🤍'}
                    </Button>
                  )}
                  
                  {!sound.isDefault && (
                    <Button 
                      variant="danger-secondary" 
                      size="sm" 
                      onClick={() => handleDeleteSound(category.key, sound.id)} 
                      title="Delete Sound"
                      style={{ minWidth: 40, padding: '4px 8px' }}
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUploadClick(category.key)}
              disabled={uploading[category.key]}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: 'white',
                fontWeight: '600',
                padding: '10px 20px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {uploading[category.key] ? '⏳ Uploading...' : '➕ Add Sound'}
            </Button>
            </div>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      {/* Enhanced Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        padding: '20px',
        background: 'linear-gradient(135deg, hsl(var(--surface-secondary)) 0%, hsl(var(--surface-tertiary)) 100%)',
        borderRadius: '12px',
        border: '1px solid hsl(var(--border-primary))',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🔊
          </div>
          <div>
            <h3 style={{ 
              margin: '0 0 4px 0', 
              fontSize: '18px', 
              fontWeight: '700',
              background: 'linear-gradient(135deg, hsl(var(--text-primary)) 0%, hsl(var(--text-secondary)) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Sound Management
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: 'hsl(var(--text-secondary))',
              fontWeight: '500'
            }}>
              Manage background music, channel click sounds, and hover effects
            </p>
          </div>
        </div>

      </div>

      {/* Enhanced Error/Message Display */}
      {error && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '16px', 
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #fee 0%, #fcc 100%)',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(220, 53, 69, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <strong>Error:</strong> {error}
          </div>
          <Button 
            variant="tertiary" 
            size="sm" 
            onClick={clearError}
            style={{ 
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          >
            Dismiss
          </Button>
        </div>
      )}

      {message.text && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '16px', 
          borderRadius: '12px',
          background: message.type === 'error' ? 'linear-gradient(135deg, #fee 0%, #fcc 100%)' : 
                     message.type === 'success' ? 'linear-gradient(135deg, #efe 0%, #cfc 100%)' : 
                     message.type === 'info' ? 'linear-gradient(135deg, #eef 0%, #ccf 100%)' : 
                     'linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%)',
          border: `1px solid ${message.type === 'error' ? '#f5c6cb' : 
                               message.type === 'success' ? '#c3e6cb' : 
                               message.type === 'info' ? '#bee5eb' : '#ffeaa7'}`,
          color: message.type === 'error' ? '#721c24' : 
                 message.type === 'success' ? '#155724' : 
                 message.type === 'info' ? '#0c5460' : '#856404',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: `0 2px 8px ${message.type === 'error' ? 'rgba(220, 53, 69, 0.1)' : 
                                    message.type === 'success' ? 'rgba(40, 167, 69, 0.1)' : 
                                    message.type === 'info' ? 'rgba(23, 162, 184, 0.1)' : 
                                    'rgba(255, 193, 7, 0.1)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>
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
        <div style={{ 
          marginBottom: '16px', 
          padding: '16px', 
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #eef 0%, #ccf 100%)',
          border: '1px solid #bee5eb',
          color: '#0c5460',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(23, 162, 184, 0.1)'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #bee5eb',
            borderTop: '2px solid #0c5460',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ fontWeight: '600' }}>Loading sound library...</span>
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
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
            <Text variant="p" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
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