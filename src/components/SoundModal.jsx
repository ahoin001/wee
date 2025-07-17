import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './SoundModal.css';

const SOUND_CATEGORIES = [
  { key: 'channelClick', label: 'Channel Click Sound' },
  { key: 'channelHover', label: 'Channel Hover Sound' },
  { key: 'backgroundMusic', label: 'Background Music' },
];

const soundsApi = window.api?.sounds || {
  get: async () => ({}),
  set: async () => {},
  reset: async () => {},
};

function SoundModal({ isOpen, onClose, onSettingsChange }) {
  const [soundLibrary, setSoundLibrary] = useState({});
  const [soundSettings, setSoundSettings] = useState({});
  const [localState, setLocalState] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState({});
  const [testing, setTesting] = useState({});
  const [audioRefs, setAudioRefs] = useState({});
  const [fadeState, setFadeState] = useState('fade-in');
  const fileInputRefs = useRef({});
  const [pendingUploadType, setPendingUploadType] = useState(null);

  // Load sound library and settings on open
  useEffect(() => {
    if (isOpen) {
      setFadeState('fade-in');
      loadData();
    }
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
  }, [isOpen, audioRefs]);

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
      const data = await soundsApi.get();
      setSoundLibrary(data?.library || {});
      setSoundSettings(data?.settings || {});
      // Build local state for editing
      const local = {};
      SOUND_CATEGORIES.forEach(cat => {
        local[cat.key] = (data?.library?.[cat.key] || []).map(sound => ({ ...sound }));
      });
      setLocalState(local);
      setMessage({ type: '', text: '' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load sounds: ' + err.message });
    }
  };

  // Handle file upload
  const handleUploadClick = (catKey) => {
    setPendingUploadType(catKey);
    fileInputRefs.current[catKey]?.click();
  };

  const handleFileChange = async (catKey, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(u => ({ ...u, [catKey]: true }));
    setMessage({ type: '', text: '' });
    try {
      // Validate file type
      const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!validExtensions.includes(ext)) {
        setMessage({ type: 'error', text: `Invalid file type: ${ext}. Supported: ${validExtensions.join(', ')}` });
        setUploading(u => ({ ...u, [catKey]: false }));
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File is too large. Max 10MB.' });
        setUploading(u => ({ ...u, [catKey]: false }));
        return;
      }
      // Create a local URL for preview
      const url = URL.createObjectURL(file);
      const newSound = {
        id: `user-${catKey}-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
        url,
        volume: 0.5,
        enabled: true,
        isDefault: false,
        file,
      };
      setLocalState(prev => ({
        ...prev,
        [catKey]: [...prev[catKey], newSound],
      }));
      setMessage({ type: 'success', text: 'Sound added (not saved yet).' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload failed: ' + err.message });
    } finally {
      setUploading(u => ({ ...u, [catKey]: false }));
      e.target.value = '';
    }
  };

  // Enable/disable all sounds in a category
  const handleDisableAll = (catKey) => {
    setLocalState(prev => ({
      ...prev,
      [catKey]: prev[catKey].map(s => ({ ...s, enabled: false })),
    }));
  };

  // Select a sound as active (enables it, disables others)
  const handleSelectSound = (catKey, soundId) => {
    setLocalState(prev => ({
      ...prev,
      [catKey]: prev[catKey].map(s => ({ ...s, enabled: s.id === soundId })),
    }));
  };

  // Toggle enable/disable for a sound
  const handleToggleEnable = (catKey, soundId) => {
    setLocalState(prev => ({
      ...prev,
      [catKey]: prev[catKey].map(s => s.id === soundId ? { ...s, enabled: !s.enabled } : s),
    }));
  };

  // Set volume for a sound
  const handleVolumeChange = (catKey, soundId, value) => {
    setLocalState(prev => ({
      ...prev,
      [catKey]: prev[catKey].map(s => s.id === soundId ? { ...s, volume: value } : s),
    }));
    // Live update test audio volume if this sound is being tested
    if (audioRefs[soundId]) {
      audioRefs[soundId].volume = value;
    }
  };

  // Delete a user sound
  const handleDeleteSound = (catKey, soundId) => {
    setLocalState(prev => ({
      ...prev,
      [catKey]: prev[catKey].filter(s => s.id !== soundId),
    }));
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

  // Save all changes
  const handleSave = async () => {
    try {
      // Build new library
      const newLibrary = {};
      SOUND_CATEGORIES.forEach(cat => {
        newLibrary[cat.key] = localState[cat.key].map(s => {
          const { file, ...rest } = s;
          return rest;
        });
      });
      await soundsApi.set({ library: newLibrary });
      setMessage({ type: 'success', text: 'Sounds saved.' });
      if (onSettingsChange) onSettingsChange();
      setTimeout(() => handleClose(), 400);
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed: ' + err.message });
    }
  };

  const handleClose = () => {
    setFadeState('fade-out');
    setTimeout(() => onClose(), 280);
  };

  if (!isOpen && fadeState !== 'fade-out') return null;

  return (
    <BaseModal
      title="Manage App Sounds"
      onClose={handleClose}
      className="sound-modal"
      maxWidth="900px"
      footerContent={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={handleSave} style={{ minWidth: 90 }}>Save</button>
        </div>
      }
    >
      {message.text && (
        <div className={`message ${message.type}`} style={{ marginBottom: 10, fontWeight: 500 }}>
          {message.text}
        </div>
      )}
      <div className="sound-sections">
        {SOUND_CATEGORIES.map(cat => (
          <div className="sound-section" key={cat.key}>
            <div className="section-header">
              <h3>{cat.label}</h3>
              <button
                className="add-sound-button"
                onClick={() => handleUploadClick(cat.key)}
                disabled={uploading[cat.key]}
              >
                {uploading[cat.key] ? 'Uploading...' : 'Add Sound'}
              </button>
              <input
                type="file"
                accept="audio/*"
                ref={el => (fileInputRefs.current[cat.key] = el)}
                style={{ display: 'none' }}
                onChange={e => handleFileChange(cat.key, e)}
              />
            </div>
            <div className="sound-list">
              {localState[cat.key]?.length === 0 && (
                <span className="no-sounds" style={{ color: '#888' }}>No sounds yet.</span>
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
                      <label className="toggle-switch" title="Enable/Disable">
                        <input
                          type="checkbox"
                          checked={!!sound.enabled}
                          onChange={() => handleToggleEnable(cat.key, sound.id)}
                          disabled={sound.isDefault && !sound.enabled}
                        />
                        <span className="slider" />
                      </label>
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
                      <label style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
                        <input
                          type="radio"
                          name={`active-${cat.key}`}
                          checked={!!sound.enabled}
                          onChange={() => handleSelectSound(cat.key, sound.id)}
                        />
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button className="add-sound-button" style={{ background: '#bbb', color: '#222' }} onClick={() => handleDisableAll(cat.key)}>Disable All</button>
            </div>
          </div>
        ))}
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