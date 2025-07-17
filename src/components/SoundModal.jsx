import { useState, useEffect, useRef } from 'react';
import './SoundModal.css';
import './BaseModal.css';

// Guard for window.api to prevent errors in browser
const api = window.api || {
  getSoundLibrary: async () => ({}),
  saveSoundLibrary: async () => ({ success: true }),
  addSound: async () => ({ success: false }),
  removeSound: async () => ({ success: false }),
  updateSound: async () => ({ success: false }),
  getSettings: async () => null,
  saveSettings: async () => {},
  debugSounds: async () => null,
  refreshSoundUrls: async () => ({ success: false }),
};

const SOUND_TYPES = {
  channelClick: 'Channel Click',
  channelHover: 'Channel Hover', 
  backgroundMusic: 'Background Music',
  startup: 'Startup Sound'
};

function SoundModal({ isOpen, onClose, onSettingsChange }) {
  const [soundLibrary, setSoundLibrary] = useState({});
  const [soundSettings, setSoundSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [testing, setTesting] = useState({});
  const [audioRefs, setAudioRefs] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingSound, setPendingSound] = useState(null);
  const [customName, setCustomName] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Load sound library and settings on mount
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      loadData();
    }
  }, [isOpen]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Cleanup audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Stop all playing sounds
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
  }, [isOpen, audioRefs]);

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage({ type: 'info', text: 'Loading sounds...' });
      
      // Load sound library
      const library = await api.getSoundLibrary();
      setSoundLibrary(library);
      
      // Load sound settings
      const settings = await api.getSettings();
      const sounds = settings?.sounds || {};
      setSoundSettings(sounds);
      
      console.log('Loaded sound library:', library);
      console.log('Loaded sound settings:', sounds);
      setMessage({ type: 'success', text: 'Sounds loaded successfully!' });
    } catch (error) {
      console.error('Failed to load sound data:', error);
      setMessage({ type: 'error', text: `Failed to load sounds: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSound = async (soundType) => {
    try {
      setUploading(prev => ({ ...prev, [soundType]: true }));
      setMessage({ type: 'info', text: 'Selecting file...' });

      // Use file dialog to select file
      const fileResult = await api.selectSoundFile();
      
      if (!fileResult.success) {
        if (fileResult.error !== 'No file selected') {
          setMessage({ type: 'error', text: `Failed to select file: ${fileResult.error}` });
        }
        return;
      }

      const file = fileResult.file;

      // Validate file type
      const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!validExtensions.includes(fileExtension)) {
        setMessage({ type: 'error', text: `Invalid file type: ${fileExtension}. Supported formats: ${validExtensions.join(', ')}` });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File is too large. Please select a file smaller than 10MB.' });
        return;
      }

      // Show name input dialog
      const defaultName = file.name.replace(/\.[^/.]+$/, '');
      setCustomName(defaultName);
      setPendingSound({ soundType, file });
      setShowNameDialog(true);
      return;
    } catch (error) {
      console.error('[SOUND MODAL] Error adding sound:', error);
      setMessage({ type: 'error', text: `Failed to add sound: ${error.message}` });
    } finally {
      setUploading(prev => ({ ...prev, [soundType]: false }));
    }
  };

  const handleConfirmAddSound = async () => {
    if (!pendingSound || !customName.trim()) {
      setShowNameDialog(false);
      setPendingSound(null);
      setCustomName('');
      return;
    }

    // Validate name length
    if (customName.length > 50) {
      setMessage({ type: 'error', text: 'Sound name is too long. Please use a name shorter than 50 characters.' });
      return;
    }

    try {
      setShowNameDialog(false);
      setMessage({ type: 'info', text: 'Adding sound...' });
      console.log(`[SOUND MODAL] Adding sound: ${customName} (${pendingSound.file.name}) to ${pendingSound.soundType}`);
      
      const result = await api.addSound({
        soundType: pendingSound.soundType,
        file: {
          name: pendingSound.file.name,
          path: pendingSound.file.path
        },
        name: customName.trim()
      });

      if (result.success) {
        // Reload sound library
        await loadData();
        console.log(`[SOUND MODAL] Successfully added sound: ${customName} to ${pendingSound.soundType}`);
        setMessage({ type: 'success', text: `Successfully added "${customName}" to ${SOUND_TYPES[pendingSound.soundType]}` });
      } else {
        console.error(`[SOUND MODAL] Failed to add sound:`, result.error);
        setMessage({ type: 'error', text: `Failed to add sound: ${result.error}` });
      }
    } catch (error) {
      console.error('[SOUND MODAL] Error adding sound:', error);
      setMessage({ type: 'error', text: `Failed to add sound: ${error.message}` });
    } finally {
      setPendingSound(null);
      setCustomName('');
      setUploading(prev => ({ ...prev, [pendingSound?.soundType]: false }));
    }
  };

  const handleCancelAddSound = () => {
    setShowNameDialog(false);
    setPendingSound(null);
    setCustomName('');
    setUploading(prev => ({ ...prev, [pendingSound?.soundType]: false }));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match the CSS animation duration
  };

  const handleRemoveSound = async (soundType, soundId) => {
    const sound = soundLibrary[soundType]?.find(s => s.id === soundId);
    if (!sound) {
      setMessage({ type: 'error', text: 'Sound not found. Please refresh the sound list.' });
      return;
    }

    if (!confirm(`Are you sure you want to remove "${sound.name}"?\n\nThis action cannot be undone.`)) return;

    try {
      console.log(`[SOUND MODAL] Removing sound: ${sound.name} from ${soundType}`);
      setMessage({ type: 'info', text: 'Removing sound...' });
      
      const result = await api.removeSound({ soundType, soundId });
      
      if (result.success) {
        // Reload sound library
        await loadData();
        console.log(`[SOUND MODAL] Successfully removed sound: ${sound.name} from ${soundType}`);
        setMessage({ type: 'success', text: `Successfully removed "${sound.name}"` });
      } else {
        console.error(`[SOUND MODAL] Failed to remove sound:`, result.error);
        setMessage({ type: 'error', text: `Failed to remove sound: ${result.error}` });
      }
    } catch (error) {
      console.error('[SOUND MODAL] Error removing sound:', error);
      setMessage({ type: 'error', text: `Failed to remove sound: ${error.message}` });
    }
  };

  const handleSoundToggle = async (soundType, soundId, enabled) => {
    const sound = soundLibrary[soundType]?.find(s => s.id === soundId);
    if (!sound) {
      setMessage({ type: 'error', text: 'Sound not found. Please refresh the sound list.' });
      return;
    }

    try {
      console.log(`[SOUND MODAL] Toggling sound: ${sound.name} in ${soundType} to ${enabled}`);
      
      // If enabling this sound, disable all other sounds in the same section
      const updates = { enabled };
      if (enabled) {
        // Disable all other sounds in this section
        const soundsToUpdate = soundLibrary[soundType]?.filter(s => s.id !== soundId) || [];
        for (const otherSound of soundsToUpdate) {
          if (otherSound.enabled) {
            await api.updateSound({
              soundType,
              soundId: otherSound.id,
              updates: { enabled: false }
            });
          }
        }
      }
      
      const result = await api.updateSound({
        soundType,
        soundId,
        updates
      });

      if (result.success) {
        // Update local state - disable all other sounds in this section if enabling this one
        setSoundLibrary(prev => ({
      ...prev,
          [soundType]: prev[soundType].map(sound => {
            if (sound.id === soundId) {
              return { ...sound, enabled };
            } else if (enabled) {
              // Disable other sounds when enabling this one
              return { ...sound, enabled: false };
            }
            return sound;
          })
        }));
        console.log(`[SOUND MODAL] Successfully toggled sound: ${sound.name} in ${soundType} to ${enabled}`);
        setMessage({ type: 'success', text: `${sound.name} ${enabled ? 'enabled' : 'disabled'}` });
      } else {
        console.error(`[SOUND MODAL] Failed to toggle sound:`, result.error);
        setMessage({ type: 'error', text: `Failed to update sound: ${result.error}` });
      }
    } catch (error) {
      console.error('[SOUND MODAL] Error updating sound:', error);
      setMessage({ type: 'error', text: `Failed to update sound: ${error.message}` });
    }
  };

  const handleVolumeChange = async (soundType, soundId, volume) => {
    const sound = soundLibrary[soundType]?.find(s => s.id === soundId);
    if (!sound) {
      console.error('[SOUND MODAL] Sound not found for volume change');
      return;
    }

    try {
      const result = await api.updateSound({
        soundType,
        soundId,
        updates: { volume: parseFloat(volume) }
      });

      if (result.success) {
        // Update local state
        setSoundLibrary(prev => ({
      ...prev,
          [soundType]: prev[soundType].map(sound =>
            sound.id === soundId ? { ...sound, volume: parseFloat(volume) } : sound
          )
        }));
      } else {
        console.error(`[SOUND MODAL] Failed to update volume:`, result.error);
        setMessage({ type: 'error', text: `Failed to update volume: ${result.error}` });
      }
    } catch (error) {
      console.error('[SOUND MODAL] Error updating volume:', error);
      setMessage({ type: 'error', text: `Failed to update volume: ${error.message}` });
    }
  };

  const handleTestSound = async (soundType, soundId) => {
    const sound = soundLibrary[soundType]?.find(s => s.id === soundId);
    if (!sound) {
      setMessage({ type: 'error', text: 'Sound not found. Please refresh the sound list.' });
      return;
    }

    if (!sound.enabled) {
      setMessage({ type: 'error', text: 'Cannot test disabled sounds. Please enable the sound first.' });
      return;
    }

    try {
      setTesting(prev => ({ ...prev, [soundId]: true }));
      
      console.log(`[SOUND MODAL] Testing sound: ${sound.name} with URL: ${sound.url}`);
      console.log(`[SOUND MODAL] Sound details:`, {
        id: sound.id,
        name: sound.name,
        filename: sound.filename,
        url: sound.url,
        isDefault: sound.isDefault,
        enabled: sound.enabled
      });
      
      if (!sound.url) {
        throw new Error('Sound URL is missing');
      }
      
      const audio = new Audio(sound.url);
      audio.volume = sound.volume || 0.5;
      
      // Store audio reference for stopping
      setAudioRefs(prev => ({ ...prev, [soundId]: audio }));
      
      audio.addEventListener('ended', () => {
        setTesting(prev => ({ ...prev, [soundId]: false }));
        setAudioRefs(prev => {
          const newRefs = { ...prev };
          delete newRefs[soundId];
          return newRefs;
        });
      });
      
      audio.addEventListener('error', (error) => {
        console.error('[SOUND MODAL] Audio playback error:', error);
        console.error('[SOUND MODAL] Audio error details:', {
          error: error.message,
          soundUrl: sound.url,
          soundName: sound.name,
          soundId: sound.id
        });
        setTesting(prev => ({ ...prev, [soundId]: false }));
        setAudioRefs(prev => {
          const newRefs = { ...prev };
          delete newRefs[soundId];
          return newRefs;
        });
        setMessage({ type: 'error', text: `Failed to play sound: ${sound.name}. Failed to load because no supported source was found.` });
      });
      
      await audio.play();
    } catch (error) {
      console.error('[SOUND MODAL] Error testing sound:', error);
      setTesting(prev => ({ ...prev, [soundId]: false }));
      setAudioRefs(prev => {
        const newRefs = { ...prev };
        delete newRefs[soundId];
        return newRefs;
      });
      setMessage({ type: 'error', text: `Failed to play sound: ${sound.name}. ${error.message}` });
    }
  };

  const handleStopTest = (soundId) => {
    const audio = audioRefs[soundId];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setTesting(prev => ({ ...prev, [soundId]: false }));
      setAudioRefs(prev => {
        const newRefs = { ...prev };
        delete newRefs[soundId];
        return newRefs;
      });
    }
  };

  const handleSave = async () => {
    try {
      // Convert sound library to the format expected by the app
      const appSoundSettings = {};
      
      for (const soundType of Object.keys(SOUND_TYPES)) {
        const sounds = soundLibrary[soundType] || [];
        const enabledSound = sounds.find(s => s.enabled);
        
        if (enabledSound) {
          appSoundSettings[soundType] = {
            soundId: enabledSound.id,
            enabled: true,
            volume: enabledSound.volume || 0.5
          };
        } else {
          // If no sound is enabled, disable this sound type
          appSoundSettings[soundType] = {
            soundId: null,
            enabled: false,
            volume: 0.5
          };
        }
      }
      
      console.log('Converting sound library to app settings:', appSoundSettings);
      
      // Save sound settings
      await api.saveSettings({ sounds: appSoundSettings });
      console.log('Sound settings saved:', appSoundSettings);
      
      // Notify parent component with the properly formatted settings
      if (onSettingsChange) {
        onSettingsChange({ sounds: appSoundSettings });
      }
      
      // Close modal with fade animation
      handleClose();
    } catch (error) {
      console.error('Failed to save sound settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleDebugSounds = async () => {
    try {
      const debugInfo = await api.debugSounds();
      console.log('Sound debug info:', debugInfo);
      alert(`Sound Debug Info:\n${JSON.stringify(debugInfo, null, 2)}`);
    } catch (error) {
      console.error('Failed to get sound debug info:', error);
      alert('Failed to get sound debug info: ' + error.message);
    }
  };

  const handleRefreshUrls = async () => {
    try {
      setMessage({ type: 'info', text: 'Refreshing sound URLs...' });
      const result = await api.refreshSoundUrls();
      
      if (result.success) {
        await loadData();
        setMessage({ type: 'success', text: 'Sound URLs refreshed successfully!' });
        console.log('Refreshed sound library:', result.library);
      } else {
        setMessage({ type: 'error', text: `Failed to refresh URLs: ${result.error}` });
      }
    } catch (error) {
      console.error('Failed to refresh sound URLs:', error);
      setMessage({ type: 'error', text: `Failed to refresh URLs: ${error.message}` });
    }
  };

  const handleFixUserSoundUrls = async () => {
    try {
      setMessage({ type: 'info', text: 'Fixing user sound URLs...' });
      
      // Get current library
      const library = await api.getSoundLibrary();
      let needsUpdate = false;
      
      // Fix URLs for user-added sounds
      for (const soundType of Object.keys(SOUND_TYPES)) {
        const sounds = library[soundType] || [];
        for (const sound of sounds) {
          if (!sound.isDefault && sound.filename) {
            const correctUrl = process.env.NODE_ENV === 'development' 
              ? `http://localhost:5173/sounds/${sound.filename}`
              : `userdata://sounds/${sound.filename}`;
            
            if (sound.url !== correctUrl) {
              console.log(`[SOUND MODAL] Fixing URL for ${sound.name}: ${sound.url} -> ${correctUrl}`);
              sound.url = correctUrl;
              needsUpdate = true;
            }
          }
        }
      }
      
      if (needsUpdate) {
        // Save the updated library
        await api.saveSoundLibrary(library);
        await loadData();
        setMessage({ type: 'success', text: 'User sound URLs fixed successfully!' });
      } else {
        setMessage({ type: 'info', text: 'All user sound URLs are already correct.' });
      }
    } catch (error) {
      console.error('Failed to fix user sound URLs:', error);
      setMessage({ type: 'error', text: `Failed to fix URLs: ${error.message}` });
    }
  };

  const renderSoundList = (soundType) => {
    const sounds = soundLibrary[soundType] || [];
    
    if (sounds.length === 0) {
      return <div className="no-sounds">No sounds available</div>;
    }

    return (
      <div className="sound-list">
        {sounds.map((sound) => (
          <div key={sound.id} className={`sound-item ${sound.isDefault ? 'default' : 'user'} ${sound.enabled ? 'enabled' : 'disabled'}`}>
            <div className="sound-info">
              <div className="sound-name">
                {sound.name}
                {sound.isDefault && <span className="default-badge">Default</span>}
                {sound.enabled && <span className="enabled-badge" style={{ 
                  background: '#4ecdc4', 
                  color: 'white', 
                  padding: '2px 6px', 
                  borderRadius: '3px', 
                  fontSize: '10px', 
                  marginLeft: '8px' 
                }}>ACTIVE</span>}
              </div>
        <div className="sound-controls">
                <label className="toggle-switch" title={sound.enabled ? 'Disable this sound' : 'Enable this sound (will disable others in this section)'}>
            <input
              type="checkbox"
              checked={sound.enabled}
                    onChange={(e) => handleSoundToggle(soundType, sound.id, e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        
        <div className="volume-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
                    value={sound.volume || 0.5}
                    onChange={(e) => handleVolumeChange(soundType, sound.id, e.target.value)}
                    disabled={!sound.enabled}
          />
                  <span className="volume-value">{Math.round((sound.volume || 0.5) * 100)}%</span>
        </div>

                <button
                  className="test-button"
                  onClick={() => testing[sound.id] ? handleStopTest(sound.id) : handleTestSound(soundType, sound.id)}
                  disabled={!sound.enabled}
                >
                  {testing[sound.id] ? 'Stop Test' : 'Test'}
                    </button>
                
                {!sound.isDefault && (
                      <button 
                    className="remove-button"
                    onClick={() => handleRemoveSound(soundType, sound.id)}
                  >
                    Remove
                      </button>
                    )}
              </div>
                  </div>
                </div>
              ))}
            </div>
    );
  };

  const renderSoundSection = (soundType, title) => {
    const isUploading = uploading[soundType];
    const sounds = soundLibrary[soundType] || [];
    const enabledCount = sounds.filter(s => s.enabled).length;
    
    return (
      <div key={soundType} className="sound-section">
        <div className="section-header">
          <h3>{title}</h3>
          <div className="section-info">
            <span className="enabled-info" style={{ 
              fontSize: '12px', 
              color: enabledCount > 1 ? '#ff6b6b' : '#4ecdc4',
              fontWeight: enabledCount > 1 ? 'bold' : 'normal'
            }}>
              {enabledCount === 0 ? 'No sound enabled' : 
               enabledCount === 1 ? '1 sound enabled' : 
               `${enabledCount} sounds enabled (only 1 should be enabled)`}
            </span>
            <button
              className="add-sound-button"
              onClick={() => handleAddSound(soundType)}
              disabled={isUploading}
            >
              {isUploading ? 'Adding...' : 'Add Sound'}
            </button>
          </div>
        </div>
        {renderSoundList(soundType)}
      </div>
    );
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading sounds...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`modal-content sound-modal ${isClosing ? 'closing' : ''}`}>
        <div className="modal-header">
          <h2>Sound Settings</h2>
          <div className="header-buttons">
            <button 
              className="refresh-button" 
              onClick={loadData}
              disabled={loading}
              title="Refresh sound library"
            >
              {loading ? '⏳' : '🔄'}
            </button>
            <button className="close-button" onClick={handleClose}>×</button>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <div className="modal-body">
          <div className="sound-sections">
            {Object.entries(SOUND_TYPES).map(([soundType, title]) =>
              renderSoundSection(soundType, title)
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="debug-button" onClick={handleDebugSounds} style={{ marginLeft: 8, background: '#ff6b6b', color: 'white' }}>Debug Sounds</button>
          <button className="debug-button" onClick={handleRefreshUrls} style={{ marginLeft: 8, background: '#4ecdc4', color: 'white' }}>Refresh URLs</button>
          <button className="debug-button" onClick={handleFixUserSoundUrls} style={{ marginLeft: 8, background: '#f39c12', color: 'white' }}>Fix User URLs</button>
          <button className="save-button" onClick={handleSave}>Save Settings</button>
        </div>
      </div>

      {/* Name Input Dialog */}
      {showNameDialog && (
        <div className="modal-overlay" style={{ zIndex: 1001 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Name Your Sound</h3>
            </div>
            <div className="modal-body">
              <p>Enter a name for your sound file:</p>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter sound name..."
                maxLength={50}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmAddSound();
                  } else if (e.key === 'Escape') {
                    handleCancelAddSound();
                  }
                }}
                autoFocus
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {customName.length}/50 characters
              </div>
                  </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={handleCancelAddSound}>Cancel</button>
                    <button 
                className="save-button" 
                onClick={handleConfirmAddSound}
                disabled={!customName.trim()}
              >
                Add Sound
                      </button>
                </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default SoundModal; 