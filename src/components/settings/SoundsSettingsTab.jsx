import React, { useState, useCallback, useRef, useEffect } from 'react';
import useSoundManager from '../../utils/useSoundManager';
import useSoundLibrary from '../../utils/useSoundLibrary';
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

  // Debug: Log current sound library state
  useEffect(() => {
    console.log('[SoundsSettingsTab] Current sound library:', soundLibrary);
    console.log('[SoundsSettingsTab] Background music sounds:', soundLibrary.backgroundMusic);
    console.log('[SoundsSettingsTab] Enabled background music:', getEnabledSoundsByCategory('backgroundMusic'));
    console.log('[SoundsSettingsTab] Sound settings:', soundSettings);
  }, [soundLibrary, soundSettings, getEnabledSoundsByCategory]);

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

  // Drag and drop handlers for playlist reordering
  const handleDragStart = useCallback((e, soundId) => {
    if (!soundSettings.backgroundMusicPlaylistMode) return;
    setDraggedItem(soundId);
    e.dataTransfer.effectAllowed = 'move';
  }, [soundSettings.backgroundMusicPlaylistMode]);

  const handleDragOver = useCallback((e, soundId) => {
    if (!soundSettings.backgroundMusicPlaylistMode || !draggedItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(soundId);
  }, [soundSettings.backgroundMusicPlaylistMode, draggedItem]);

  const handleDrop = useCallback((e, targetSoundId) => {
    if (!soundSettings.backgroundMusicPlaylistMode || !draggedItem || draggedItem === targetSoundId) {
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
  }, [soundSettings.backgroundMusicPlaylistMode, draggedItem, getSoundsByCategory, updateSound, showMessage]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            {category.label}
          </div>
        }
        separator
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
          {/* Category-specific settings */}
          {category.key === 'backgroundMusic' && (
          <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                padding: '16px',
                background: 'hsl(var(--surface-secondary))',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border-primary))',
                marginBottom: '16px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid hsl(var(--border-primary))'
                }}>
                  <Text variant="p" style={{ fontWeight: 600, margin: 0 }}>
                    Background Music Settings
                  </Text>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <WToggle
                    checked={soundSettings?.backgroundMusicEnabled ?? true}
                    onChange={(checked) => toggleBackgroundMusic(checked)}
                    label="Enable Background Music"
                  />
                  
                  {soundSettings?.backgroundMusicEnabled && (
                    <>
                      <WToggle
                        checked={soundSettings?.backgroundMusicLooping ?? true}
                        onChange={(checked) => toggleBackgroundMusicLooping(checked)}
                        label="Loop Music"
                      />
                      
                      <WToggle
                        checked={soundSettings?.backgroundMusicPlaylistMode ?? false}
                        onChange={(checked) => togglePlaylistMode(checked)}
                        label="Playlist Mode (Play liked sounds in order)"
                      />
                      
                      {/* Debug button for background music */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          console.log('[SoundsSettingsTab] Manual background music update triggered');
                          updateBackgroundMusic();
                        }}
                        style={{ marginTop: '8px' }}
                      >
                        Test Background Music
                      </Button>
                      
                      {/* Debug button to check AudioManager state */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          console.log('[SoundsSettingsTab] Checking AudioManager state...');
                          if (audioManager) {
                            console.log('[SoundsSettingsTab] AudioManager:', audioManager);
                            console.log('[SoundsSettingsTab] Background audio:', audioManager.backgroundAudio);
                            console.log('[SoundsSettingsTab] Background audio paused:', audioManager.backgroundAudio?.paused);
                            console.log('[SoundsSettingsTab] Background audio src:', audioManager.backgroundAudio?.src);
                            console.log('[SoundsSettingsTab] Background audio volume:', audioManager.backgroundAudio?.volume);
                          } else {
                            console.log('[SoundsSettingsTab] AudioManager not available');
                          }
                        }}
                        style={{ marginTop: '8px' }}
                      >
                        Debug AudioManager
                      </Button>
                      
                      {/* Debug button to test sound URLs */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          console.log('[SoundsSettingsTab] Testing sound URLs...');
                          const backgroundMusic = soundLibrary.backgroundMusic || [];
                          console.log('[SoundsSettingsTab] All background music:', backgroundMusic);
                          
                          backgroundMusic.forEach((sound, index) => {
                            console.log(`[SoundsSettingsTab] Sound ${index}:`, {
                              name: sound.name,
                              url: sound.url,
                              enabled: sound.enabled,
                              volume: sound.volume,
                              filename: sound.filename
                            });
                            
                            // Test if the URL is accessible
                            if (sound.url) {
                              const testAudio = new Audio(sound.url);
                              testAudio.addEventListener('canplaythrough', () => {
                                console.log(`[SoundsSettingsTab] ✅ Sound ${sound.name} URL is accessible`);
                              });
                              testAudio.addEventListener('error', (e) => {
                                console.error(`[SoundsSettingsTab] ❌ Sound ${sound.name} URL failed:`, e);
                                console.error(`[SoundsSettingsTab] Error details:`, {
                                  error: testAudio.error,
                                  readyState: testAudio.readyState,
                                  networkState: testAudio.networkState
                                });
                              });
                              testAudio.load();
                            }
                          });
                        }}
                        style={{ marginTop: '8px' }}
                      >
                        Test Sound URLs
                      </Button>
                      
                      {/* Debug button to test immediate background music start */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          console.log('[SoundsSettingsTab] Testing immediate background music start...');
                          console.log('[SoundsSettingsTab] Current sound settings:', soundSettings);
                          console.log('[SoundsSettingsTab] Background music enabled:', soundSettings?.backgroundMusicEnabled);
                          console.log('[SoundsSettingsTab] Enabled background music sounds:', getEnabledSoundsByCategory('backgroundMusic'));
                          
                          if (soundSettings?.backgroundMusicEnabled) {
                            console.log('[SoundsSettingsTab] ✅ Background music should be playing now');
                            updateBackgroundMusic();
                          } else {
                            console.log('[SoundsSettingsTab] ❌ Background music is disabled');
                          }
                        }}
                        style={{ marginTop: '8px' }}
                      >
                        Test Immediate Start
                      </Button>
                      
                      {/* Debug button to test AudioManager readiness */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          console.log('[SoundsSettingsTab] Testing AudioManager readiness...');
                          console.log('[SoundsSettingsTab] AudioManager:', audioManager);
                          console.log('[SoundsSettingsTab] AudioManager ready:', audioManager ? 'Yes' : 'No');
                          console.log('[SoundsSettingsTab] Background music enabled:', soundSettings?.backgroundMusicEnabled);
                          console.log('[SoundsSettingsTab] Enabled background music sounds:', getEnabledSoundsByCategory('backgroundMusic'));
                          
                          if (audioManager && soundSettings?.backgroundMusicEnabled) {
                            console.log('[SoundsSettingsTab] ✅ Conditions met for background music');
                            updateBackgroundMusic();
                          } else {
                            console.log('[SoundsSettingsTab] ❌ Conditions not met for background music');
                            if (!audioManager) console.log('[SoundsSettingsTab]   - AudioManager not available');
                            if (!soundSettings?.backgroundMusicEnabled) console.log('[SoundsSettingsTab]   - Background music not enabled');
                          }
                        }}
                        style={{ marginTop: '8px' }}
                      >
                        Test AudioManager Readiness
                      </Button>
              </>
            )}
          </div>
              </div>

              {/* Playlist Mode Info */}
              {soundSettings?.backgroundMusicEnabled && soundSettings?.backgroundMusicPlaylistMode && (
                <div style={{ 
                  padding: '15px', 
                  background: '#d1ecf1', 
                  border: '1px solid #bee5eb', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    🎵 Playlist Mode Active ({likedSounds.length} liked sounds)
                  </div>
                  <div style={{ fontSize: '14px', color: '#0c5460' }}>
                    Only liked sounds will play in the order they appear below. 
                    Click the ❤️ to like/unlike sounds and drag items to reorder your playlist.
                  </div>
                </div>
              )}

          {/* Background Music Disabled Warning */}
              {!soundSettings?.backgroundMusicEnabled && (
            <div style={{ 
              padding: '15px', 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔇 Background Music Disabled</div>
              <div style={{ fontSize: '14px', color: '#856404' }}>
                Background music is currently disabled. Enable it above to hear background music sounds.
              </div>
            </div>
          )}
              </div>
          )}

          {/* Other category test buttons */}
          {category.key === 'channelClick' && (
            <div style={{ marginBottom: '16px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestChannelClick}
                disabled={!soundSettings?.channelClickEnabled || enabledSounds.length === 0}
              >
                Test Channel Click Sound
              </Button>
            </div>
          )}

          {category.key === 'channelHover' && (
            <div style={{ marginBottom: '16px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestChannelHover}
                disabled={!soundSettings?.channelHoverEnabled || enabledSounds.length === 0}
              >
                Test Channel Hover Sound
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
                  padding: '12px',
                  marginBottom: '8px',
                  background: sound.enabled ? 'hsl(var(--surface-secondary))' : 'hsl(var(--surface-tertiary))',
                  border: '1px solid hsl(var(--border-primary))',
                  borderRadius: '8px',
                  opacity: category.key === 'backgroundMusic' && !soundSettings?.backgroundMusicEnabled ? 0.6 : 1,
                  cursor: category.key === 'backgroundMusic' && soundSettings?.backgroundMusicPlaylistMode ? 'grab' : 'default',
                  transform: draggedItem === sound.id ? 'scale(0.98)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                draggable={category.key === 'backgroundMusic' && soundSettings?.backgroundMusicPlaylistMode}
                onDragStart={(e) => handleDragStart(e, sound.id)}
                onDragOver={(e) => handleDragOver(e, sound.id)}
                onDrop={(e) => handleDrop(e, sound.id)}
                onDragEnd={handleDragEnd}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {category.key === 'backgroundMusic' && soundSettings?.backgroundMusicPlaylistMode && (
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
                          disabled={category.key === 'backgroundMusic' && !soundSettings?.backgroundMusicEnabled}
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
                      disabled={category.key === 'backgroundMusic' && !soundSettings?.backgroundMusicEnabled}
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
                      disabled={!soundSettings?.backgroundMusicEnabled}
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
                    disabled={category.key === 'backgroundMusic' && !soundSettings?.backgroundMusicEnabled}
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
            >
              {uploading[category.key] ? 'Uploading...' : 'Add Sound'}
            </Button>
            </div>
        </div>
      </Card>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '16px',
        background: 'hsl(var(--surface-secondary))',
        borderRadius: '8px',
        border: '1px solid hsl(var(--border-primary))'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
            🔊 Sound Management
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--text-secondary))' }}>
            Manage background music, channel click sounds, and hover effects
          </p>
        </div>
      </div>

      {/* Error/Message Display */}
      {error && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          borderRadius: '8px',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24'
        }}>
          <strong>Error:</strong> {error}
          <Button 
            variant="tertiary" 
            size="sm" 
            onClick={clearError}
            style={{ marginLeft: '8px' }}
          >
            Dismiss
          </Button>
        </div>
      )}

      {message.text && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          borderRadius: '8px',
          background: message.type === 'error' ? '#f8d7da' : 
                     message.type === 'success' ? '#d4edda' : 
                     message.type === 'info' ? '#d1ecf1' : '#fff3cd',
          border: `1px solid ${message.type === 'error' ? '#f5c6cb' : 
                               message.type === 'success' ? '#c3e6cb' : 
                               message.type === 'info' ? '#bee5eb' : '#ffeaa7'}`,
          color: message.type === 'error' ? '#721c24' : 
                 message.type === 'success' ? '#155724' : 
                 message.type === 'info' ? '#0c5460' : '#856404'
        }}>
          {message.text}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          borderRadius: '8px',
          background: '#d1ecf1',
          border: '1px solid #bee5eb',
          color: '#0c5460'
        }}>
          Loading sound library...
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