import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import ResourceUsageIndicator from './ResourceUsageIndicator';
import Text from '../ui/Text';
import Button from '../ui/WButton';
import WToggle from '../ui/WToggle';
import Card from '../ui/Card';
import useSoundManager from '../utils/useSoundManager';

const SOUND_CATEGORIES = [
  { key: 'backgroundMusic', label: 'Background Music' },
  { key: 'channelClick', label: 'Channel Click Sound' },
  { key: 'channelHover', label: 'Channel Hover Sound' },
];

// Sound API interface
const soundsApi = window.api?.sounds || {
  getLibrary: async () => {
    try {
      return await window.api.invoke('get-sound-library');
    } catch (error) {
      console.error('Failed to get sound library:', error);
      return {};
    }
  },
  selectFile: async () => {
    try {
      return await window.api.invoke('select-sound-file');
    } catch (error) {
      console.error('Failed to select sound file:', error);
      return { success: false, error: error.message };
    }
  },
  add: async ({ soundType, file, name }) => {
    try {
      return await window.api.invoke('add-sound', { soundType, file, name });
    } catch (error) {
      console.error('Failed to add sound:', error);
      return { success: false, error: error.message };
    }
  },
  remove: async ({ soundType, soundId }) => {
    try {
      return await window.api.invoke('remove-sound', { soundType, soundId });
    } catch (error) {
      console.error('Failed to remove sound:', error);
      return { success: false, error: error.message };
    }
  },
  update: async ({ soundType, soundId, updates }) => {
    try {
      return await window.api.invoke('update-sound', { soundType, soundId, updates });
    } catch (error) {
      console.error('Failed to update sound:', error);
      return { success: false, error: error.message };
    }
  },
  toggleLike: async ({ soundId }) => {
    try {
      return await window.api.invoke('sounds:toggleLike', { soundId });
    } catch (error) {
      console.error('Failed to toggle like:', error);
      return { success: false, error: error.message };
    }
  },
  getBackgroundMusicSettings: async () => {
    try {
      return await window.api.invoke('sounds:getBackgroundMusicSettings');
    } catch (error) {
      console.error('Failed to get background music settings:', error);
      return { success: false, error: error.message };
    }
  },
  setBackgroundMusicSettings: async (settings) => {
    try {
      return await window.api.invoke('sounds:setBackgroundMusicSettings', settings);
    } catch (error) {
      console.error('Failed to set background music settings:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * Core sound management component that can be used in different contexts
 * (settings tab, standalone modal, etc.)
 */
const SoundManagementCore = React.memo(({ 
  isModal = false, 
  onClose, 
  onSettingsChange,
  showHeader = true,
  autoSave = false, // Whether to auto-save changes immediately
  showSaveButton = true // Whether to show the save button
}) => {
  // Use the sound manager hook
  const {
    soundSettings,
    toggleBackgroundMusic,
    toggleBackgroundMusicLooping,
    togglePlaylistMode,
    updateChannelClickSound,
    updateChannelHoverSound,
    playSoundEffect,
    saveSoundSettings
  } = useSoundManager();

  // Local state for sound management
  const [soundLibrary, setSoundLibrary] = useState({});
  const [localState, setLocalState] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState({});
  const [testing, setTesting] = useState({});
  const [audioRefs, setAudioRefs] = useState({});
  
  // Drag and drop state for playlist reordering
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  // Debug logging
  console.log('[SoundManagementCore] Current soundSettings:', soundSettings);
  console.log('[SoundManagementCore] soundSettings type:', typeof soundSettings);
  console.log('[SoundManagementCore] soundSettings keys:', soundSettings ? Object.keys(soundSettings) : 'undefined');

  // Load sound library and settings
  const loadData = useCallback(async () => {
    try {
      setMessage({ type: 'info', text: 'Loading sounds...' });
      const library = await soundsApi.getLibrary();
      setSoundLibrary(library || {});
      
      // Build local state for editing
      const local = {};
      SOUND_CATEGORIES.forEach(cat => {
        local[cat.key] = (library?.[cat.key] || []).map(sound => ({ ...sound }));
      });
      setLocalState(local);
      
      setMessage({ type: '', text: '' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load sounds: ' + err.message });
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronize local state with consolidated store when soundSettings change
  useEffect(() => {
    console.log('[SoundManagementCore] soundSettings changed, synchronizing local state');
    console.log('[SoundManagementCore] New soundSettings:', soundSettings);
    
    // Update local state to reflect current sound settings
    if (soundSettings && Object.keys(soundSettings).length > 0) {
      setLocalState(prev => {
        const updated = { ...prev };
        
        // Update background music enabled states based on consolidated store
        if (updated.backgroundMusic) {
          updated.backgroundMusic = updated.backgroundMusic.map(sound => ({
            ...sound,
            // Keep existing enabled state from local state, but ensure it's consistent
            enabled: sound.enabled
          }));
        }
        
        return updated;
      });
    }
  }, [soundSettings]);

  // Stop all audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, [audioRefs]);

  // Clear message after 3s
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  // Handle file upload
  const handleUploadClick = useCallback(async (catKey) => {
    // Use IPC file picker
    const fileResult = await soundsApi.selectFile();
    if (!fileResult.success) {
      setMessage({ type: 'error', text: fileResult.error || 'File selection cancelled.' });
      return;
    }
    const { file } = fileResult;
    // Prompt for name (optional: could use a modal or prompt)
    let name = file.name.replace(/\.[^/.]+$/, '');
    // Add sound via IPC
    setUploading(u => ({ ...u, [catKey]: true }));
    setMessage({ type: '', text: '' });
    const addResult = await soundsApi.add({ soundType: catKey, file, name });
    if (!addResult.success) {
      setMessage({ type: 'error', text: addResult.error || 'Failed to add sound.' });
      setUploading(u => ({ ...u, [catKey]: false }));
      return;
    }
    setMessage({ type: 'success', text: 'Sound uploaded!' });
    await loadData();
    setUploading(u => ({ ...u, [catKey]: false }));
  }, [loadData]);

  // Enable/disable all sounds in a category (local only)
  const handleDisableAll = useCallback((catKey) => {
    setLocalState(prev => {
      const updated = { ...prev };
      updated[catKey] = updated[catKey].map(s => ({ ...s, enabled: false }));
      return updated;
    });
  }, []);

  // Toggle enable/disable for a sound and update sound manager
  const handleToggleEnable = useCallback(async (catKey, soundId) => {
    console.log('[SoundManagementCore] handleToggleEnable called:', { catKey, soundId });
    
    // Update local state first
    setLocalState(prev => {
      const updated = { ...prev };
      
      // Special handling for background music in playlist mode
      if (catKey === 'backgroundMusic' && soundSettings?.backgroundMusicPlaylistMode) {
        // In playlist mode, allow multiple enabled sounds
        updated[catKey] = updated[catKey].map(s =>
          s.id === soundId ? { ...s, enabled: !s.enabled } : s
        );
      } else {
        // For non-playlist mode or other sound types, only allow one enabled at a time
        updated[catKey] = updated[catKey].map(s =>
          s.id === soundId
            ? { ...s, enabled: !s.enabled }
            : { ...s, enabled: false }
        );
      }
      
      return updated;
    });

    // Wait for state update, then update sound manager
    setTimeout(async () => {
      try {
        // Get the updated state
        const updatedLocalState = await new Promise(resolve => {
          setLocalState(prev => {
            const updated = { ...prev };
            
            // Special handling for background music in playlist mode
            if (catKey === 'backgroundMusic' && soundSettings?.backgroundMusicPlaylistMode) {
              updated[catKey] = updated[catKey].map(s =>
                s.id === soundId ? { ...s, enabled: !s.enabled } : s
              );
            } else {
              updated[catKey] = updated[catKey].map(s =>
                s.id === soundId
                  ? { ...s, enabled: !s.enabled }
                  : { ...s, enabled: false }
              );
            }
            
            resolve(updated);
            return updated;
          });
        });

        console.log('[SoundManagementCore] Updated local state:', updatedLocalState);

        // Update sound manager based on category
        if (catKey === 'backgroundMusic') {
          // Background music is handled by the sound manager automatically
          // Just trigger a refresh of background music
          if (soundSettings?.backgroundMusicEnabled) {
            await toggleBackgroundMusic(true);
          }
        } else if (catKey === 'channelClick') {
          const enabledSound = updatedLocalState.channelClick?.find(s => s.enabled);
          console.log('[SoundManagementCore] Updating channel click sound:', { enabled: !!enabledSound, volume: enabledSound?.volume || 0.5 });
          updateChannelClickSound(!!enabledSound, enabledSound?.volume || 0.5);
          // Auto-save if enabled
          if (autoSave) {
            await saveSoundSettings();
          }
        } else if (catKey === 'channelHover') {
          const enabledSound = updatedLocalState.channelHover?.find(s => s.enabled);
          console.log('[SoundManagementCore] Updating channel hover sound:', { enabled: !!enabledSound, volume: enabledSound?.volume || 0.5 });
          updateChannelHoverSound(!!enabledSound, enabledSound?.volume || 0.5);
          // Auto-save if enabled
          if (autoSave) {
            await saveSoundSettings();
          }
        }
        
        console.log('[SoundManagementCore] Sound toggle completed successfully');
      } catch (error) {
        console.error('[SoundManagementCore] Error in handleToggleEnable:', error);
        setMessage({ type: 'error', text: 'Failed to update sound setting: ' + error.message });
      }
    }, 0);
  }, [soundSettings?.backgroundMusicPlaylistMode, soundSettings?.backgroundMusicEnabled, toggleBackgroundMusic, updateChannelClickSound, updateChannelHoverSound, saveSoundSettings, autoSave]);

  // Set volume for a sound and update sound manager
  const handleVolumeChange = useCallback((catKey, soundId, value) => {
    console.log('[SoundManagementCore] handleVolumeChange called:', { catKey, soundId, value });
    
    setLocalState(prev => {
      const updated = { ...prev };
      updated[catKey] = updated[catKey].map(s =>
        s.id === soundId ? { ...s, volume: value } : s
      );
      return updated;
    });
    
    // Live update test audio volume if this sound is being tested
    if (audioRefs[soundId]) {
      audioRefs[soundId].volume = value;
    }
    
    // Update sound manager based on category
    setTimeout(async () => {
      try {
        if (catKey === 'channelClick') {
          const enabledSound = localState.channelClick?.find(s => s.enabled);
          updateChannelClickSound(!!enabledSound, enabledSound?.volume || value);
          if (autoSave) {
            await saveSoundSettings();
          }
        } else if (catKey === 'channelHover') {
          const enabledSound = localState.channelHover?.find(s => s.enabled);
          updateChannelHoverSound(!!enabledSound, enabledSound?.volume || value);
          if (autoSave) {
            await saveSoundSettings();
          }
        }
      } catch (error) {
        console.error('[SoundManagementCore] Error updating volume:', error);
      }
    }, 0);
  }, [audioRefs, localState, updateChannelClickSound, updateChannelHoverSound, saveSoundSettings, autoSave]);

  // Delete a user sound
  const handleDeleteSound = useCallback(async (catKey, soundId) => {
    setMessage({ type: '', text: '' });
    const result = await soundsApi.remove({ soundType: catKey, soundId });
    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Failed to delete sound.' });
      return;
    }
    setMessage({ type: 'success', text: 'Sound deleted.' });
    await loadData();
  }, [loadData]);

  // Test/stop sound playback
  const handleTestSound = useCallback((catKey, sound) => {
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

  // Background music specific handlers
  const handleToggleLike = useCallback(async (soundId) => {
    try {
      const result = await soundsApi.toggleLike({ soundId });
      if (result.success) {
        setMessage({ type: 'success', text: result.liked ? 'Sound liked!' : 'Sound unliked.' });
        
        // Update local state directly instead of reloading everything
        setLocalState(prev => {
          const updated = { ...prev };
          // Update the like status in all categories
          Object.keys(updated).forEach(catKey => {
            updated[catKey] = updated[catKey].map(sound =>
              sound.id === soundId ? { ...sound, liked: result.liked } : sound
            );
          });
          return updated;
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to toggle like.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to toggle like: ' + err.message });
    }
  }, []);

  const handleBackgroundMusicSettingChange = useCallback(async (setting, value) => {
    console.log('[SoundManagementCore] handleBackgroundMusicSettingChange:', setting, value);
    console.log('[SoundManagementCore] Current soundSettings before change:', soundSettings);
    
    try {
      // Use the sound manager to update settings
      if (setting === 'enabled') {
        await toggleBackgroundMusic(value);
      } else if (setting === 'looping') {
        await toggleBackgroundMusicLooping(value);
      } else if (setting === 'playlistMode') {
        await togglePlaylistMode(value);
      
        // Handle playlist mode UI updates
        if (!value) {
          // When disabling playlist mode, keep only the first enabled sound
          setLocalState(prev => {
            const updated = { ...prev };
            const bgMusic = updated.backgroundMusic || [];
            
            // Find the first enabled sound
            const firstEnabledIndex = bgMusic.findIndex(s => s.enabled);
            
            if (firstEnabledIndex !== -1) {
              // Keep only the first enabled sound, disable all others
              updated.backgroundMusic = bgMusic.map((s, index) => ({
                ...s,
                enabled: index === firstEnabledIndex
              }));
              
              setMessage({ type: 'info', text: 'Playlist mode disabled. Only the first enabled sound will play.' });
            }
            
            return updated;
          });
        } else {
          // When enabling playlist mode, show info message
          setMessage({ type: 'info', text: 'Playlist mode enabled. You can now enable multiple sounds for your playlist.' });
        }
      }
      
      // Auto-save if enabled
      if (autoSave) {
        await saveSoundSettings();
      }
      
      console.log('[SoundManagementCore] Background music setting change completed successfully');
    } catch (error) {
      console.error('[SoundManagementCore] Error in handleBackgroundMusicSettingChange:', error);
      setMessage({ type: 'error', text: 'Failed to update background music setting: ' + error.message });
    }
  }, [toggleBackgroundMusic, toggleBackgroundMusicLooping, togglePlaylistMode, saveSoundSettings, autoSave]);

  const getLikedBackgroundMusic = useCallback(() => {
    return localState.backgroundMusic?.filter(sound => sound.liked) || [];
  }, [localState.backgroundMusic]);

  const getEnabledBackgroundMusic = useCallback(() => {
    return localState.backgroundMusic?.filter(sound => sound.enabled) || [];
  }, [localState.backgroundMusic]);

  // Drag and drop handlers for playlist reordering
  const handleDragStart = useCallback((e, soundId) => {
    if (!soundSettings?.backgroundMusicPlaylistMode) return;
    setDraggedItem(soundId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  }, [soundSettings?.backgroundMusicPlaylistMode]);

  const handleDragOver = useCallback((e, soundId) => {
    if (!soundSettings?.backgroundMusicPlaylistMode || !draggedItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(soundId);
  }, [soundSettings?.backgroundMusicPlaylistMode, draggedItem]);

  const handleDragEnter = useCallback((e, soundId) => {
    if (!soundSettings?.backgroundMusicPlaylistMode || !draggedItem) return;
    e.preventDefault();
    setDragOverItem(soundId);
  }, [soundSettings?.backgroundMusicPlaylistMode, draggedItem]);

  const handleDragLeave = useCallback((e) => {
    if (!soundSettings?.backgroundMusicPlaylistMode) return;
    e.preventDefault();
    setDragOverItem(null);
  }, [soundSettings?.backgroundMusicPlaylistMode]);

  const handleDrop = useCallback((e, targetSoundId) => {
    if (!soundSettings?.backgroundMusicPlaylistMode || !draggedItem || draggedItem === targetSoundId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }
    
    e.preventDefault();
    
    // Reorder the background music array
    const currentSounds = [...(localState.backgroundMusic || [])];
    const draggedIndex = currentSounds.findIndex(s => s.id === draggedItem);
    const targetIndex = currentSounds.findIndex(s => s.id === targetSoundId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedSound] = currentSounds.splice(draggedIndex, 1);
      currentSounds.splice(targetIndex, 0, draggedSound);
      
      setLocalState(prev => ({
        ...prev,
        backgroundMusic: currentSounds
      }));
      
      setMessage({ type: 'success', text: 'Playlist order updated!' });
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  }, [soundSettings?.backgroundMusicPlaylistMode, draggedItem, localState.backgroundMusic]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItem(null);
  }, []);

  // Save all changes
  const handleSave = useCallback(async (handleClose) => {
    try {
      // Save background music settings first
      const bgmSettings = {
        enabled: soundSettings?.backgroundMusicEnabled ?? true,
        looping: soundSettings?.backgroundMusicLooping ?? true,
        playlistMode: soundSettings?.backgroundMusicPlaylistMode ?? false
      };
      const bgmResult = await soundsApi.setBackgroundMusicSettings(bgmSettings);
      if (!bgmResult.success) {
        setMessage({ type: 'error', text: 'Failed to save background music settings: ' + bgmResult.error });
        return;
      }

      // Compare localState to soundLibrary and persist only changes
      for (const cat of SOUND_CATEGORIES) {
        const orig = soundLibrary[cat.key] || [];
        const curr = localState[cat.key] || [];
        for (let i = 0; i < curr.length; i++) {
          const origSound = orig[i];
          const currSound = curr[i];
          if (!origSound) continue;
          if (
            origSound.enabled !== currSound.enabled ||
            origSound.volume !== currSound.volume
          ) {
            await soundsApi.update({
              soundType: cat.key,
              soundId: currSound.id,
              updates: {
                enabled: currSound.enabled,
                volume: currSound.volume,
              },
            });
          }
        }
      }
      
      setMessage({ type: 'success', text: 'Sound settings saved.' });
      
      // Use sound manager to save settings
      await saveSoundSettings();
      
      if (handleClose) handleClose();
      if (onSettingsChange) setTimeout(onSettingsChange, 100);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings: ' + err.message });
    }
  }, [soundSettings, soundLibrary, localState, saveSoundSettings, onSettingsChange]);

  // Render sound section
  const renderSoundSection = (cat) => {
    // Special handling for background music
    if (cat.key === 'backgroundMusic') {
      return (
        <Card
          key={cat.key}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ResourceUsageIndicator 
                level="high" 
                tooltip="Background music plays continuously and can use significant CPU and memory resources"
              />
              {cat.label}
            </div>
          }
          separator
          style={{ marginBottom: '20px' }}
        >
          <div style={{ padding: '20px' }}>
            {/* Background Music Settings */}
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
                    onChange={(checked) => {
                      console.log('[SoundManagementCore] Background music enabled toggle:', { 
                        current: soundSettings?.backgroundMusicEnabled, 
                        new: checked 
                      });
                      handleBackgroundMusicSettingChange('enabled', checked);
                    }}
                    label="Enable Background Music"
                  />
                  
                  {soundSettings?.backgroundMusicEnabled && (
                    <>
                      <WToggle
                        checked={soundSettings?.backgroundMusicLooping ?? true}
                        onChange={(checked) => {
                          console.log('[SoundManagementCore] Background music looping toggle:', { 
                            current: soundSettings?.backgroundMusicLooping, 
                            new: checked 
                          });
                          handleBackgroundMusicSettingChange('looping', checked);
                        }}
                        label="Loop Music"
                      />
                      
                      <WToggle
                        checked={soundSettings?.backgroundMusicPlaylistMode ?? false}
                        onChange={(checked) => {
                          console.log('[SoundManagementCore] Background music playlist mode toggle:', { 
                            current: soundSettings?.backgroundMusicPlaylistMode, 
                            new: checked 
                          });
                          handleBackgroundMusicSettingChange('playlistMode', checked);
                        }}
                        label="Playlist Mode (Play liked sounds in order)"
                      />
                    </>
                  )}
                </div>
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
                  🎵 Playlist Mode Active ({getLikedBackgroundMusic().length} liked sounds)
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

            {/* Sound List */}
            <div style={{ marginBottom: '16px' }}>
              {localState[cat.key]?.length === 0 && (
                <Text variant="help" style={{ fontStyle: 'italic' }}>No sounds yet.</Text>
              )}
              {localState[cat.key]?.map(sound => (
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
                    opacity: !soundSettings?.backgroundMusicEnabled ? 0.6 : 1,
                    cursor: soundSettings?.backgroundMusicPlaylistMode ? 'grab' : 'default',
                    transform: draggedItem === sound.id ? 'scale(0.98)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  draggable={soundSettings?.backgroundMusicPlaylistMode}
                  onDragStart={(e) => handleDragStart(e, sound.id)}
                  onDragOver={(e) => handleDragOver(e, sound.id)}
                  onDragEnter={(e) => handleDragEnter(e, sound.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, sound.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    {soundSettings?.backgroundMusicPlaylistMode && (
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
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={sound.volume ?? 0.5}
                            onChange={e => handleVolumeChange(cat.key, sound.id, Number(e.target.value))}
                            disabled={!soundSettings?.backgroundMusicEnabled}
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
                        onClick={() => handleTestSound(cat.key, sound)} 
                        style={{ minWidth: 60 }}
                        disabled={!soundSettings?.backgroundMusicEnabled}
                      >
                        Test
                      </Button>
                    )}
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
                    {!sound.isDefault && (
                      <Button 
                        variant="danger-secondary" 
                        size="sm" 
                        onClick={() => handleDeleteSound(cat.key, sound.id)} 
                        title="Delete Sound"
                        style={{ minWidth: 40, padding: '4px 8px' }}
                      >
                        🗑️
                      </Button>
                    )}
                    <WToggle
                      checked={!!sound.enabled}
                      onChange={(checked) => {
                        console.log('[SoundManagementCore] WToggle onChange called:', { 
                          soundId: sound.id, 
                          soundName: sound.name, 
                          currentEnabled: sound.enabled, 
                          newChecked: checked 
                        });
                        handleToggleEnable(cat.key, sound.id);
                      }}
                      disabled={!soundSettings?.backgroundMusicEnabled}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleDisableAll(cat.key)}
                style={{ background: '#bbb', color: '#222' }}
              >
                Disable All
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUploadClick(cat.key)}
                disabled={uploading[cat.key]}
              >
                {uploading[cat.key] ? 'Uploading...' : 'Add Sound'}
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    // Regular sound sections for other categories
    return (
      <Card
        key={cat.key}
        title={
          cat.key === 'channelHover' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ResourceUsageIndicator 
                level="medium" 
                tooltip="Hover sounds play frequently and can impact performance with many channels"
              />
              {cat.label}
            </div>
          ) : (
            cat.label
          )
        }
        separator
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            {localState[cat.key]?.length === 0 && (
              <Text variant="help" style={{ fontStyle: 'italic' }}>No sounds yet.</Text>
            )}
            {localState[cat.key]?.map(sound => (
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
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
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
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '12px', minWidth: '40px' }}>Volume:</span>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={sound.volume ?? 0.5}
                          onChange={e => handleVolumeChange(cat.key, sound.id, Number(e.target.value))}
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
                      onClick={() => handleTestSound(cat.key, sound)}
                      style={{ minWidth: 60 }}
                    >
                      Test
                    </Button>
                  )}
                  {!sound.isDefault && (
                    <Button 
                      variant="danger-secondary" 
                      size="sm" 
                      onClick={() => handleDeleteSound(cat.key, sound.id)} 
                      title="Delete Sound"
                      style={{ minWidth: 40, padding: '4px 8px' }}
                    >
                      🗑️
                    </Button>
                  )}
                  <WToggle
                    checked={!!sound.enabled}
                    onChange={(checked) => {
                      console.log('[SoundManagementCore] Other sound toggle:', { 
                        catKey: cat.key,
                        soundId: sound.id, 
                        soundName: sound.name, 
                        currentEnabled: sound.enabled, 
                        newChecked: checked 
                      });
                      handleToggleEnable(cat.key, sound.id);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleDisableAll(cat.key)}
              style={{ background: '#bbb', color: '#222' }}
            >
              Disable All
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUploadClick(cat.key)}
              disabled={uploading[cat.key]}
            >
              {uploading[cat.key] ? 'Uploading...' : 'Add Sound'}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div>
      {showHeader && (
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
              Upload, manage, and configure individual sound files
            </p>
          </div>
          {showSaveButton && isModal && onClose && (
            <Button
              variant="primary"
              onClick={() => handleSave(onClose)}
              style={{ minWidth: '120px' }}
            >
              Save & Close
            </Button>
          )}
          {showSaveButton && !isModal && (
            <Button
              variant="primary"
              onClick={() => handleSave()}
              style={{ minWidth: '120px' }}
            >
              Save Settings
            </Button>
          )}
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

SoundManagementCore.propTypes = {
  isModal: PropTypes.bool,
  onClose: PropTypes.func,
  onSettingsChange: PropTypes.func,
  showHeader: PropTypes.bool,
  autoSave: PropTypes.bool,
  showSaveButton: PropTypes.bool
};

SoundManagementCore.displayName = 'SoundManagementCore';

export default SoundManagementCore;
