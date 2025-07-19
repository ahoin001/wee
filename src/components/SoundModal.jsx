import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import ResourceUsageIndicator from './ResourceUsageIndicator';
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
      updated[catKey] = updated[catKey].map(s =>
        s.id === soundId
          ? { ...s, enabled: !s.enabled }
          : { ...s, enabled: false }
      );
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

  // Save all changes (now only updates settings, not files)
  const handleSave = async (handleClose) => {
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
    handleClose();
    if (onSettingsChange) setTimeout(onSettingsChange, 100);
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
        {SOUND_CATEGORIES.map(cat => (
          <div className="sound-section" key={cat.key}>
            <div className="section-header">
              <h3>
                {cat.key === 'backgroundMusic' ? (
                  <ResourceUsageIndicator level="high" tooltip="Background music plays continuously and can use significant CPU and memory resources">
                    {cat.label}
                  </ResourceUsageIndicator>
                ) : cat.key === 'channelHover' ? (
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
                      <label className="toggle-switch" title="Enable/Disable">
                        <input
                          type="checkbox"
                          checked={!!sound.enabled}
                          onChange={() => handleToggleEnable(cat.key, sound.id)}
                        />
                        <span className="slider" />
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