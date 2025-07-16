import { useState, useEffect, useRef } from 'react';
import './SoundModal.css';

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

  // Load sound library and settings on mount
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

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
    }
  }, [isOpen, audioRefs]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load sound library
      const library = await api.getSoundLibrary();
      setSoundLibrary(library);
      
      // Load sound settings
      const settings = await api.getSettings();
      const sounds = settings?.sounds || {};
      setSoundSettings(sounds);
      
      console.log('Loaded sound library:', library);
      console.log('Loaded sound settings:', sounds);
    } catch (error) {
      console.error('Failed to load sound data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSound = async (soundType) => {
    try {
      setUploading(prev => ({ ...prev, [soundType]: true }));

      // Use file dialog to select file
      const fileResult = await api.selectSoundFile();
      
      if (!fileResult.success) {
        if (fileResult.error !== 'No file selected') {
          alert(`Failed to select file: ${fileResult.error}`);
        }
        return;
      }

      const file = fileResult.file;

      // Prompt for custom name
      const defaultName = file.name.replace(/\.[^/.]+$/, '');
      const customName = prompt('Enter a name for this sound:', defaultName);
      
      if (!customName) return;

      const result = await api.addSound({
        soundType,
        file: {
          name: file.name,
          path: file.path
        },
        name: customName
      });

      if (result.success) {
        // Reload sound library
        await loadData();
        console.log(`Added sound: ${customName} to ${soundType}`);
      } else {
        alert(`Failed to add sound: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding sound:', error);
      alert('Failed to add sound');
    } finally {
      setUploading(prev => ({ ...prev, [soundType]: false }));
    }
  };

  const handleRemoveSound = async (soundType, soundId) => {
    if (!confirm('Are you sure you want to remove this sound?')) return;

    try {
      const result = await api.removeSound({ soundType, soundId });
      
      if (result.success) {
        // Reload sound library
        await loadData();
        console.log(`Removed sound from ${soundType}`);
      } else {
        alert(`Failed to remove sound: ${result.error}`);
      }
    } catch (error) {
      console.error('Error removing sound:', error);
      alert('Failed to remove sound');
    }
  };

  const handleSoundToggle = async (soundType, soundId, enabled) => {
    try {
      const result = await api.updateSound({
        soundType,
        soundId,
        updates: { enabled }
      });

      if (result.success) {
        // Update local state
        setSoundLibrary(prev => ({
          ...prev,
          [soundType]: prev[soundType].map(sound =>
            sound.id === soundId ? { ...sound, enabled } : sound
          )
        }));
        console.log(`Toggled sound ${soundId} in ${soundType}: ${enabled}`);
      } else {
        alert(`Failed to update sound: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating sound:', error);
      alert('Failed to update sound');
    }
  };

  const handleVolumeChange = async (soundType, soundId, volume) => {
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
        alert(`Failed to update volume: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating volume:', error);
    }
  };

  const handleTestSound = async (soundType, soundId) => {
    const sound = soundLibrary[soundType]?.find(s => s.id === soundId);
    if (!sound || !sound.enabled) return;

    try {
      setTesting(prev => ({ ...prev, [soundId]: true }));
      
      console.log(`[SOUND TEST] Playing sound: ${sound.name} with URL: ${sound.url}`);
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
        console.error('Audio playback error:', error);
        setTesting(prev => ({ ...prev, [soundId]: false }));
        setAudioRefs(prev => {
          const newRefs = { ...prev };
          delete newRefs[soundId];
          return newRefs;
        });
        alert(`Failed to play sound: ${sound.url}`);
      });
      
      await audio.play();
    } catch (error) {
      console.error('Error testing sound:', error);
      setTesting(prev => ({ ...prev, [soundId]: false }));
      setAudioRefs(prev => {
        const newRefs = { ...prev };
        delete newRefs[soundId];
        return newRefs;
      });
      alert('Failed to play sound');
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
      // Save sound settings
      await api.saveSettings({ sounds: soundSettings });
      console.log('Sound settings saved:', soundSettings);
      
      // Notify parent component
      if (onSettingsChange) {
        onSettingsChange(soundSettings);
      }
      
      onClose();
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

  const renderSoundList = (soundType) => {
    const sounds = soundLibrary[soundType] || [];
    
    if (sounds.length === 0) {
      return <div className="no-sounds">No sounds available</div>;
    }

    return (
      <div className="sound-list">
        {sounds.map((sound) => (
          <div key={sound.id} className={`sound-item ${sound.isDefault ? 'default' : 'user'}`}>
            <div className="sound-info">
              <div className="sound-name">
                {sound.name}
                {sound.isDefault && <span className="default-badge">Default</span>}
              </div>
              <div className="sound-controls">
                <label className="toggle-switch">
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
    
    return (
      <div key={soundType} className="sound-section">
        <div className="section-header">
          <h3>{title}</h3>
          <button
            className="add-sound-button"
            onClick={() => handleAddSound(soundType)}
            disabled={isUploading}
          >
            {isUploading ? 'Adding...' : 'Add Sound'}
          </button>

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
    <div className="modal-overlay">
      <div className="modal-content sound-modal">
        <div className="modal-header">
          <h2>Sound Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="sound-sections">
            {Object.entries(SOUND_TYPES).map(([soundType, title]) =>
              renderSoundSection(soundType, title)
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="debug-button" onClick={handleDebugSounds} style={{ marginLeft: 8, background: '#ff6b6b', color: 'white' }}>Debug Sounds</button>
          <button className="save-button" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}

export default SoundModal; 