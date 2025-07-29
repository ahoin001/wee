import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import ResourceUsageIndicator from './ResourceUsageIndicator';
import Text from '../ui/Text';
import './SoundModal.css';

const SOUND_CATEGORIES = [
  { key: 'backgroundMusic', label: 'Background Music' },
  { key: 'channelClick', label: 'Channel Click Sound' },
  { key: 'channelHover', label: 'Channel Hover Sound' },
  { key: 'startup', label: 'Startup Sound' },
];

const soundsApi = window.api?.sounds || {
  get: async () => ({}),
  set: async () => {},
  reset: async () => {},
  add: async () => {},
  remove: async () => {},
  update: async () => {},
  getLibrary: async () => ({}),
  selectFile: async () => ({}),
};

function SoundModal({ isOpen, onClose, onSettingsChange }) {
  const [soundLibrary, setSoundLibrary] = useState({});
  const [soundSettings, setSoundSettings] = useState({});
  const [localState, setLocalState] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState({});
  const [testing, setTesting] = useState({});
  const [audioRefs, setAudioRefs] = useState({});
  const fileInputRefs = useRef({});
  const [pendingUploadType, setPendingUploadType] = useState(null);
  const [backgroundMusicSettings, setBackgroundMusicSettings] = useState({
    looping: true,
    playlistMode: false,
    enabled: true
  });
  
  // Drag and drop state for playlist reordering
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  // Load sound library and settings on open
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
    // Only run when isOpen changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Stop all audio on close
  useEffect(() => {
    if (!isOpen) {
      Object.values(audioRefs).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      setAudioRefs({});
      setTesting({});
      setMessage({ type: '', text: '' });
    }
    // Only depend on isOpen!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Clear message after 3s
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadData = async () => {
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
      
      // Load background music settings
      try {
        const settings = await soundsApi.getBackgroundMusicSettings();
        if (settings.success) {
          setBackgroundMusicSettings(settings.settings);
        }
      } catch (err) {
        console.warn('Failed to load background music settings:', err);
      }
      
      setMessage({ type: '', text: '' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load sounds: ' + err.message });
    }
  };

  // Handle file upload
  const handleUploadClick = async (catKey) => {
    setPendingUploadType(catKey);
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
  };

  // (File input is no longer needed)

  // Enable/disable all sounds in a category (local only)
  const handleDisableAll = (catKey) => {
    setLocalState(prev => {
      const updated = { ...prev };
      updated[catKey] = updated[catKey].map(s => ({ ...s, enabled: false }));
      return updated;
    });
  };

  // Toggle enable/disable for a sound (local only)
  const handleToggleEnable = (catKey, soundId) => {
    setLocalState(prev => {
      const updated = { ...prev };
      
      // Special handling for background music in playlist mode
      if (catKey === 'backgroundMusic' && backgroundMusicSettings.playlistMode) {
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
  };

  // Set volume for a sound (local only)
  const handleVolumeChange = (catKey, soundId, value) => {
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
    
    // Also update the cached audio instance in AudioManager for immediate effect
    const sound = localState[catKey]?.find(s => s.id === soundId);
    if (sound && sound.url) {
      // Import audioManager dynamically to avoid circular imports
      import('../utils/AudioManager').then(module => {
        const audioManager = module.default;
        audioManager.updateVolume(sound.url, value);
      }).catch(err => {
        console.warn('Failed to update audio volume:', err);
      });
    }
  };

  // Delete a user sound
  const handleDeleteSound = async (catKey, soundId) => {
    setMessage({ type: '', text: '' });
    const result = await soundsApi.remove({ soundType: catKey, soundId });
    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Failed to delete sound.' });
      return;
    }
    setMessage({ type: 'success', text: 'Sound deleted.' });
    await loadData();
  };

  // Test/stop sound playback
  const handleTestSound = (catKey, sound) => {
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
  };
  const handleStopTest = (soundId) => {
    const audio = audioRefs[soundId];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setTesting({});
      setAudioRefs({});
    }
  };

  // Background music specific handlers
  const handleToggleLike = async (soundId) => {
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
  };

  const handleBackgroundMusicSettingChange = async (setting, value) => {
    const newSettings = { ...backgroundMusicSettings, [setting]: value };
    setBackgroundMusicSettings(newSettings);
    
    // Update looping setting immediately if it changed
    if (setting === 'looping') {
      try {
        const audioManager = await import('../utils/AudioManager');
        audioManager.default.updateBackgroundMusicLooping(value);
      } catch (err) {
        console.warn('Failed to update background music looping:', err);
      }
    }
    
    // Handle playlist mode toggle
    if (setting === 'playlistMode') {
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
  };

  const getLikedBackgroundMusic = () => {
    return localState.backgroundMusic?.filter(sound => sound.liked) || [];
  };

  const getEnabledBackgroundMusic = () => {
    return localState.backgroundMusic?.filter(sound => sound.enabled) || [];
  };

  // Drag and drop handlers for playlist reordering
  const handleDragStart = (e, soundId) => {
    if (!backgroundMusicSettings.playlistMode) return;
    setDraggedItem(soundId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, soundId) => {
    if (!backgroundMusicSettings.playlistMode || !draggedItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(soundId);
  };

  const handleDragEnter = (e, soundId) => {
    if (!backgroundMusicSettings.playlistMode || !draggedItem) return;
    e.preventDefault();
    setDragOverItem(soundId);
  };

  const handleDragLeave = (e) => {
    if (!backgroundMusicSettings.playlistMode) return;
    e.preventDefault();
    setDragOverItem(null);
  };

  const handleDrop = (e, targetSoundId) => {
    if (!backgroundMusicSettings.playlistMode || !draggedItem || draggedItem === targetSoundId) {
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
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Save all changes (now only updates settings, not files)
  const handleSave = async (handleClose) => {
    try {
      // Save background music settings first
      const bgmResult = await soundsApi.setBackgroundMusicSettings(backgroundMusicSettings);
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
      
      // Update audio manager volumes to reflect new settings (without clearing cache)
      try {
        const audioManager = await import('../utils/AudioManager');
        await audioManager.default.updateVolumesFromLibrary();
        // Also update background music based on new settings
        await audioManager.default.updateBackgroundMusicFromSettings();
      } catch (err) {
        console.warn('Failed to update audio volumes:', err);
      }
      
    setMessage({ type: 'success', text: 'Sound settings saved.' });
      handleClose();
    if (onSettingsChange) setTimeout(onSettingsChange, 100);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings: ' + err.message });
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Manage App Sounds"
      onClose={onClose}
      className="sound-modal"
      maxWidth="900px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={() => handleSave(handleClose)} style={{ minWidth: 90 }}>Save</button>
        </div>
      )}
    >
      {message.text && (
        <div className={`message ${message.type}`} style={{ marginBottom: 10, fontWeight: 500 }}>
          {message.text}
        </div>
      )}
      <div className="sound-sections">
        {SOUND_CATEGORIES.map(cat => {
          // Special handling for background music
          if (cat.key === 'backgroundMusic') {
            return (
              <div className="sound-section" key={cat.key}>
                <div className="section-header">
                  <h3>
                    <ResourceUsageIndicator level="high" tooltip="Background music plays continuously and can use significant CPU and memory resources">
                      {cat.label}
                    </ResourceUsageIndicator>
                  </h3>
                  <button
                    className="add-sound-button"
                    onClick={() => handleUploadClick(cat.key)}
                    disabled={uploading[cat.key]}
                  >
                    {uploading[cat.key] ? 'Uploading...' : 'Add Sound'}
                  </button>
                </div>

                {/* Background Music Settings */}
                <div className="background-music-settings">
                  <div className="settings-row">
                    <Toggle
                          checked={backgroundMusicSettings.enabled}
                      onChange={(checked) => handleBackgroundMusicSettingChange('enabled', checked)}
                      label="Enable Background Music"
                        />
                  </div>
                  
                  {backgroundMusicSettings.enabled && (
                    <>
                      <div className="settings-row">
                        <Toggle
                              checked={backgroundMusicSettings.looping}
                          onChange={(checked) => handleBackgroundMusicSettingChange('looping', checked)}
                          label="Loop Music"
                            />
                      </div>
                      
                      <div className="settings-row">
                        <Toggle
                              checked={backgroundMusicSettings.playlistMode}
                          onChange={(checked) => handleBackgroundMusicSettingChange('playlistMode', checked)}
                          label="Playlist Mode (Play liked sounds in order)"
                            />
                      </div>
                    </>
                  )}
                </div>

                {/* Playlist Mode Info */}
                {backgroundMusicSettings.enabled && backgroundMusicSettings.playlistMode && (
                  <div className="playlist-info">
                    <div className="info-header">
                      <span>🎵 Playlist Mode Active</span>
                      <span className="playlist-count">
                        {getLikedBackgroundMusic().length} liked sounds
                      </span>
                    </div>
                    <p className="info-text">
                      Only liked sounds will play in the order they appear below. 
                      Click the ❤️ to like/unlike sounds and drag items to reorder your playlist.
                    </p>
                  </div>
                )}

                {/* Background Music Disabled Warning */}
                {!backgroundMusicSettings.enabled && (
                  <div className="bgm-disabled-warning">
                    <div className="warning-header">
                      <span>🔇 Background Music Disabled</span>
                    </div>
                    <p className="warning-text">
                      Background music is currently disabled. Enable it above to hear background music sounds.
                    </p>
                  </div>
                )}

                {/* Sound List */}
                <div className="sound-list">
                  {localState[cat.key]?.length === 0 && (
                    <Text variant="help" className="no-sounds">No sounds yet.</Text>
                  )}
                  {localState[cat.key]?.map(sound => (
                    <div
                      className={`sound-item ${sound.isDefault ? 'default' : 'user'}${sound.enabled ? ' enabled' : ''}${!sound.enabled ? ' disabled' : ''}${sound.liked ? ' liked' : ''}${!backgroundMusicSettings.enabled ? ' bgm-disabled' : ''}${draggedItem === sound.id ? ' dragging' : ''}${dragOverItem === sound.id ? ' drag-over' : ''}`}
                      key={sound.id}
                      draggable={backgroundMusicSettings.playlistMode}
                      onDragStart={(e) => handleDragStart(e, sound.id)}
                      onDragOver={(e) => handleDragOver(e, sound.id)}
                      onDragEnter={(e) => handleDragEnter(e, sound.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, sound.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="sound-info">
                        <div className="sound-name">
                          {backgroundMusicSettings.playlistMode && (
                            <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
                          )}
                          {sound.name}
                          {sound.isDefault && <span className="default-badge">Default</span>}
                          {sound.liked && <span className="liked-badge">❤️</span>}
                        </div>
                        <div className="sound-controls">
                          <div className="volume-control">
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.01}
                              value={sound.volume ?? 0.5}
                              onChange={e => handleVolumeChange(cat.key, sound.id, Number(e.target.value))}
                              disabled={!backgroundMusicSettings.enabled}
                            />
                            <span className="volume-value">{Math.round((sound.volume ?? 0.5) * 100)}%</span>
                          </div>
                          {testing[sound.id] ? (
                            <button className="test-button" onClick={() => handleStopTest(sound.id)} style={{ minWidth: 60 }}>Stop</button>
                          ) : (
                            <button 
                              className="test-button" 
                              onClick={() => handleTestSound(cat.key, sound)} 
                              style={{ minWidth: 60 }}
                              disabled={!backgroundMusicSettings.enabled}
                            >
                              Test
                            </button>
                          )}
                          <button 
                            className={`like-button ${sound.liked ? 'liked' : ''}`}
                            onClick={() => handleToggleLike(sound.id)}
                            title={sound.liked ? 'Unlike' : 'Like'}
                            disabled={!backgroundMusicSettings.enabled}
                          >
                            {sound.liked ? '❤️' : '🤍'}
                          </button>
                          {!sound.isDefault && (
                            <button className="remove-button" onClick={() => handleDeleteSound(cat.key, sound.id)} title="Delete Sound">🗑️</button>
                          )}
                          <Toggle
                              checked={!!sound.enabled}
                            onChange={(checked) => handleToggleEnable(cat.key, sound.id)}
                              disabled={!backgroundMusicSettings.enabled}
                            />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, textAlign: 'right' }}>
                  <button className="add-sound-button" style={{ background: '#bbb', color: '#222' }} onClick={() => handleDisableAll(cat.key)}>Disable All</button>
                </div>
              </div>
            );
          }

          // Regular sound sections for other categories
          return (
          <div className="sound-section" key={cat.key}>
            <div className="section-header">
                <h3>
                  {cat.key === 'channelHover' ? (
                    <ResourceUsageIndicator level="medium" tooltip="Hover sounds play frequently and can impact performance with many channels">
                      {cat.label}
                    </ResourceUsageIndicator>
                  ) : (
                    cat.label
                  )}
                </h3>
              <button
                className="add-sound-button"
                onClick={() => handleUploadClick(cat.key)}
                disabled={uploading[cat.key]}
              >
                {uploading[cat.key] ? 'Uploading...' : 'Add Sound'}
              </button>
            </div>
            <div className="sound-list">
              {localState[cat.key]?.length === 0 && (
                <Text variant="help" className="no-sounds">No sounds yet.</Text>
              )}
              {localState[cat.key]?.map(sound => (
                <div
                  className={`sound-item ${sound.isDefault ? 'default' : 'user'}${sound.enabled ? ' enabled' : ''}${!sound.enabled ? ' disabled' : ''}`}
                  key={sound.id}
                >
                  <div className="sound-info">
                    <div className="sound-name">
                      {sound.name}
                      {sound.isDefault && <span className="default-badge">Default</span>}
                    </div>
                    <div className="sound-controls">
                      <div className="volume-control">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={sound.volume ?? 0.5}
                          onChange={e => handleVolumeChange(cat.key, sound.id, Number(e.target.value))}
                        />
                        <span className="volume-value">{Math.round((sound.volume ?? 0.5) * 100)}%</span>
                      </div>
                      {testing[sound.id] ? (
                        <button className="test-button" onClick={() => handleStopTest(sound.id)} style={{ minWidth: 60 }}>Stop</button>
                      ) : (
                        <button className="test-button" onClick={() => handleTestSound(cat.key, sound)} style={{ minWidth: 60 }}>Test</button>
                      )}
                      {!sound.isDefault && (
                        <button className="remove-button" onClick={() => handleDeleteSound(cat.key, sound.id)} title="Delete Sound">🗑️</button>
                      )}
                      <Toggle
                          checked={!!sound.enabled}
                        onChange={(checked) => handleToggleEnable(cat.key, sound.id)}
                        />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button className="add-sound-button" style={{ background: '#bbb', color: '#222' }} onClick={() => handleDisableAll(cat.key)}>Disable All</button>
            </div>
          </div>
          );
        })}
      </div>
    </BaseModal>
  );
}

SoundModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
};

export default SoundModal; 