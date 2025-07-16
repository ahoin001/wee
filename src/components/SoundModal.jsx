import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './SoundModal.css';

// Guard for window.api to prevent errors in browser
const api = window.api || {
  getSavedSounds: async () => null,
  saveSavedSounds: async () => {},
};

// Default sounds configuration
const DEFAULT_SOUNDS = {
  channelClick: [
    { name: 'Wii Click 1', url: '/sounds/wii-click-1.mp3', volume: 0.5 },
    { name: 'Wii Click 2', url: '/sounds/wii-click-2.mp3', volume: 0.5 },
    { name: 'Wii Click 3', url: '/sounds/wii-click-3.mp3', volume: 0.5 }
  ],
  channelHover: [
    { name: 'Wii Hover 1', url: '/sounds/wii-hover-1.mp3', volume: 0.3 },
    { name: 'Wii Hover 2', url: '/sounds/wii-hover-2.mp3', volume: 0.3 },
    { name: 'Wii Hover 3', url: '/sounds/wii-hover-3.mp3', volume: 0.3 }
  ],
  backgroundMusic: [
    { name: 'Wii Menu Music', url: '/sounds/wii-menu-music.mp3', volume: 0.4 },
    { name: 'Wii Channel Music', url: '/sounds/wii-channel-music.mp3', volume: 0.4 },
    { name: 'Wii Ambient Music', url: '/sounds/wii-ambient-music.mp3', volume: 0.4 }
  ],
  startup: [
    { name: 'Wii Startup 1', url: '/sounds/wii-startup-1.mp3', volume: 0.6 },
    { name: 'Wii Startup 2', url: '/sounds/wii-startup-2.mp3', volume: 0.6 },
    { name: 'Wii Startup 3', url: '/sounds/wii-startup-3.mp3', volume: 0.6 }
  ]
};

function SoundModal({ onClose, onSettingsChange }) {
  const [sounds, setSounds] = useState({
    channelClick: { file: null, volume: 0.5, enabled: true },
    channelHover: { file: null, volume: 0.3, enabled: true },
    backgroundMusic: { 
      file: null, 
      volume: 0.4, 
      enabled: false, 
      loopMode: 'single', // 'single' or 'playlist'
      playlist: []
    },
    startup: { file: null, volume: 0.6, enabled: true }
  });

  const [savedSounds, setSavedSounds] = useState({
    channelClick: [],
    channelHover: [],
    backgroundMusic: [],
    startup: []
  });

  const fileInputs = {
    channelClick: useRef(),
    channelHover: useRef(),
    backgroundMusic: useRef(),
    startup: useRef()
  };

  // Function to load default sounds
  const loadDefaultSounds = () => {
    const defaultSoundsWithIds = {};
    
    Object.entries(DEFAULT_SOUNDS).forEach(([soundType, soundList]) => {
      defaultSoundsWithIds[soundType] = soundList.map((sound, index) => ({
        id: `default-${soundType}-${index}`,
        name: sound.name,
        url: sound.url,
        volume: sound.volume,
        isDefault: true
      }));
    });
    
    return defaultSoundsWithIds;
  };

  // Load saved sounds from persistent storage on component mount
  useEffect(() => {
    async function loadSavedSounds() {
      let saved = await api.getSavedSounds();
      if (!saved) {
        // fallback to localStorage for migration (optional)
        const legacy = localStorage.getItem('wiiDesktopSounds');
        if (legacy) {
          try {
            saved = JSON.parse(legacy);
            await api.saveSavedSounds(saved);
          } catch {}
        }
      }
      if (saved) {
        setSavedSounds(saved);
      } else {
        // If no saved sounds exist, load default sounds
        const defaultSounds = loadDefaultSounds();
        setSavedSounds(defaultSounds);
        api.saveSavedSounds(defaultSounds);
      }
    }
    loadSavedSounds();

    // Load current sound settings
    const savedSettings = localStorage.getItem('wiiDesktopSoundSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        // Ensure backgroundMusic has the new properties
        if (settings.backgroundMusic && !settings.backgroundMusic.loopMode) {
          settings.backgroundMusic.loopMode = 'single';
          settings.backgroundMusic.playlist = [];
        }
        setSounds(settings);
      } catch (error) {
        console.error('Error loading sound settings:', error);
      }
    }
  }, []);

  // Whenever savedSounds changes, persist to Electron
  useEffect(() => {
    if (savedSounds) {
      api.saveSavedSounds(savedSounds);
    }
  }, [savedSounds]);

  const handleFileSelect = (soundType, file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setSounds(prev => ({
        ...prev,
        [soundType]: {
          ...prev[soundType],
          file: { url, name: file.name }
        }
      }));
    }
  };

  const handleVolumeChange = (soundType, volume) => {
    setSounds(prev => ({
      ...prev,
      [soundType]: {
        ...prev[soundType],
        volume: parseFloat(volume)
      }
    }));
  };

  const handleToggleSound = (soundType) => {
    setSounds(prev => ({
      ...prev,
      [soundType]: {
        ...prev[soundType],
        enabled: !prev[soundType].enabled
      }
    }));
  };

  const handleBackgroundMusicModeChange = (mode) => {
    setSounds(prev => ({
      ...prev,
      backgroundMusic: {
        ...prev.backgroundMusic,
        loopMode: mode
      }
    }));
  };

  const handleAddToPlaylist = (savedSound) => {
    setSounds(prev => ({
      ...prev,
      backgroundMusic: {
        ...prev.backgroundMusic,
        playlist: [...prev.backgroundMusic.playlist, savedSound]
      }
    }));
  };

  const handleRemoveFromPlaylist = (index) => {
    setSounds(prev => ({
      ...prev,
      backgroundMusic: {
        ...prev.backgroundMusic,
        playlist: prev.backgroundMusic.playlist.filter((_, i) => i !== index)
      }
    }));
  };

  const handleTestSound = (soundType) => {
    const sound = sounds[soundType];
    if (sound.file && sound.enabled) {
      const audio = new Audio(sound.file.url);
      audio.volume = sound.volume;
      audio.play();
    }
  };

  const handleSaveSound = (soundType) => {
    const sound = sounds[soundType];
    if (sound.file) {
      const newSound = {
        id: Date.now(),
        name: sound.file.name,
        url: sound.file.url,
        volume: sound.volume
      };

      setSavedSounds(prev => {
        const updated = {
          ...prev,
          [soundType]: [...prev[soundType], newSound]
        };
        return updated;
      });
    }
  };

  const handleSelectSavedSound = (soundType, savedSound) => {
    setSounds(prev => ({
      ...prev,
      [soundType]: {
        ...prev[soundType],
        file: { url: savedSound.url, name: savedSound.name },
        volume: savedSound.volume
      }
    }));
  };

  const handleTestSavedSound = (savedSound) => {
    const audio = new Audio(savedSound.url);
    audio.volume = savedSound.volume;
    audio.play();
  };

  const handleDeleteSavedSound = (soundType, soundId) => {
    setSavedSounds(prev => {
      const updated = {
        ...prev,
        [soundType]: prev[soundType].filter(sound => sound.id !== soundId)
      };
      return updated;
    });
  };

  const handleSave = () => {
    // Save current sound settings
    localStorage.setItem('wiiDesktopSoundSettings', JSON.stringify(sounds));
    console.log('Sound settings saved:', sounds);
    
    // Notify parent component about settings change
    if (onSettingsChange) {
      onSettingsChange(sounds);
    }
    
    onClose();
  };

  const renderSoundSection = (soundType, title) => {
    const sound = sounds[soundType];
    const saved = savedSounds[soundType];

    return (
      <div className="sound-section">
        <h3>{title}</h3>
        <div className="sound-controls">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={sound.enabled}
              onChange={() => handleToggleSound(soundType)}
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">Enable</span>
        </div>
        
        <div className="file-input-group">
          <button 
            className="file-button"
            onClick={() => fileInputs[soundType].current?.click()}
          >
            {sound.file ? sound.file.name : 'Select Audio File'}
          </button>
          <input
            type="file"
            accept="audio/*"
            ref={fileInputs[soundType]}
            onChange={(e) => handleFileSelect(soundType, e.target.files[0])}
            style={{ display: 'none' }}
          />
          {sound.file && (
            <>
              <button 
                className="test-button"
                onClick={() => handleTestSound(soundType)}
              >
                Test
              </button>
              <button 
                className="save-sound-button"
                onClick={() => handleSaveSound(soundType)}
              >
                Save
              </button>
            </>
          )}
        </div>
        
        <div className="volume-control">
          <label>Volume: {Math.round(sound.volume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={sound.volume}
            onChange={(e) => handleVolumeChange(soundType, e.target.value)}
          />
        </div>

        {saved.length > 0 && (
          <div className="saved-sounds">
            <h4>Saved Sounds</h4>
            <div className="sound-playlist">
              {saved.map((savedSound) => (
                <div 
                  key={savedSound.id}
                  className={`sound-item ${sound.file?.url === savedSound.url ? 'active' : ''}`}
                  onClick={() => handleSelectSavedSound(soundType, savedSound)}
                >
                  <div className="sound-item-info">
                    <div className="sound-item-name">{savedSound.name}</div>
                    {savedSound.isDefault && (
                      <span className="default-badge">Default</span>
                    )}
                  </div>
                  <div className="sound-item-actions">
                    <button 
                      className="sound-item-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestSavedSound(savedSound);
                      }}
                    >
                      Test
                    </button>
                    {!savedSound.isDefault && (
                      <button 
                        className="sound-item-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedSound(soundType, savedSound.id);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBackgroundMusicSection = () => {
    const sound = sounds.backgroundMusic;
    const saved = savedSounds.backgroundMusic;

    return (
      <div className="sound-section">
        <h3>Background Music</h3>
        <div className="sound-controls">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={sound.enabled}
              onChange={() => handleToggleSound('backgroundMusic')}
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">Enable</span>
        </div>

        <div className="loop-mode-selector">
          <h4>Playback Mode</h4>
          <div className="mode-options">
            <label className="mode-option">
              <input
                type="radio"
                name="loopMode"
                value="single"
                checked={sound.loopMode === 'single'}
                onChange={(e) => handleBackgroundMusicModeChange(e.target.value)}
              />
              <span className="radio-custom"></span>
              Loop Single Song
            </label>
            <label className="mode-option">
              <input
                type="radio"
                name="loopMode"
                value="playlist"
                checked={sound.loopMode === 'playlist'}
                onChange={(e) => handleBackgroundMusicModeChange(e.target.value)}
              />
              <span className="radio-custom"></span>
              Playlist Mode
            </label>
          </div>
        </div>

        {sound.loopMode === 'single' ? (
          <>
            <div className="file-input-group">
              <button 
                className="file-button"
                onClick={() => fileInputs.backgroundMusic.current?.click()}
              >
                {sound.file ? sound.file.name : 'Select Audio File'}
              </button>
              <input
                type="file"
                accept="audio/*"
                ref={fileInputs.backgroundMusic}
                onChange={(e) => handleFileSelect('backgroundMusic', e.target.files[0])}
                style={{ display: 'none' }}
              />
              {sound.file && (
                <>
                  <button 
                    className="test-button"
                    onClick={() => handleTestSound('backgroundMusic')}
                  >
                    Test
                  </button>
                  <button 
                    className="save-sound-button"
                    onClick={() => handleSaveSound('backgroundMusic')}
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="playlist-section">
            <h4>Playlist ({sound.playlist.length} songs)</h4>
            {sound.playlist.length > 0 ? (
              <div className="playlist-items">
                {sound.playlist.map((item, index) => (
                  <div key={index} className="playlist-item">
                    <div className="playlist-item-name">{item.name}</div>
                    <div className="playlist-item-actions">
                      <button 
                        className="playlist-item-button"
                        onClick={() => handleTestSavedSound(item)}
                      >
                        Test
                      </button>
                      <button 
                        className="playlist-item-button remove"
                        onClick={() => handleRemoveFromPlaylist(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="playlist-empty">No songs in playlist. Add songs from below.</p>
            )}
          </div>
        )}
        
        <div className="volume-control">
          <label>Volume: {Math.round(sound.volume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={sound.volume}
            onChange={(e) => handleVolumeChange('backgroundMusic', e.target.value)}
          />
        </div>

        {saved.length > 0 && (
          <div className="saved-sounds">
            <h4>Saved Sounds</h4>
            <div className="sound-playlist">
              {saved.map((savedSound) => (
                <div 
                  key={savedSound.id}
                  className={`sound-item ${sound.file?.url === savedSound.url ? 'active' : ''}`}
                  onClick={() => {
                    if (sound.loopMode === 'single') {
                      handleSelectSavedSound('backgroundMusic', savedSound);
                    } else {
                      handleAddToPlaylist(savedSound);
                    }
                  }}
                >
                  <div className="sound-item-info">
                    <div className="sound-item-name">{savedSound.name}</div>
                    {savedSound.isDefault && (
                      <span className="default-badge">Default</span>
                    )}
                  </div>
                  <div className="sound-item-actions">
                    <button 
                      className="sound-item-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestSavedSound(savedSound);
                      }}
                    >
                      Test
                    </button>
                    {sound.loopMode === 'playlist' && (
                      <button 
                        className="sound-item-button add"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToPlaylist(savedSound);
                        }}
                      >
                        Add to Playlist
                      </button>
                    )}
                    {!savedSound.isDefault && (
                      <button 
                        className="sound-item-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedSound('backgroundMusic', savedSound.id);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const footerContent = (
    <>
      <button className="cancel-button" onClick={onClose}>Cancel</button>
      <button className="save-button" onClick={handleSave}>Save Settings</button>
    </>
  );

  return (
    <BaseModal
      title="Sound Settings"
      onClose={onClose}
      footerContent={footerContent}
      className="sound-modal"
    >
      {renderSoundSection('channelClick', 'Channel Click Sound')}
      {renderSoundSection('channelHover', 'Channel Hover Sound')}
      {renderBackgroundMusicSection()}
      {renderSoundSection('startup', 'Startup Sound')}
    </BaseModal>
  );
}

SoundModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
};

export default SoundModal; 