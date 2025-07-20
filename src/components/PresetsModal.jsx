import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';

function PresetsModal({ isOpen, onClose, presets, onSavePreset, onDeletePreset, onApplyPreset, onUpdatePreset, onRenamePreset }) {
  const [newPresetName, setNewPresetName] = useState('');
  const [error, setError] = useState('');
  const [justUpdated, setJustUpdated] = useState(null); // name of last updated preset
  const [editingPreset, setEditingPreset] = useState(null); // preset being edited
  const [editName, setEditName] = useState(''); // temporary edit name
  const [editError, setEditError] = useState(''); // error for edit mode
  const [includeChannels, setIncludeChannels] = useState(false); // toggle for including channel data
  const [includeSounds, setIncludeSounds] = useState(false); // toggle for including sound settings
  const handleCloseRef = useRef(null); // ref to store BaseModal's handleClose function

  const handleSave = () => {
    if (!newPresetName.trim()) {
      setError('Please enter a name for the preset.');
      return;
    }
    if (presets.some(p => p.name === newPresetName.trim())) {
      setError('A preset with this name already exists.');
      return;
    }
    onSavePreset(newPresetName.trim(), includeChannels, includeSounds);
    setNewPresetName('');
    setError('');
  };

  const handleUpdate = (name) => {
    onUpdatePreset(name);
    setJustUpdated(name);
    setTimeout(() => setJustUpdated(null), 1500);
  };

  const handleStartEdit = (preset) => {
    setEditingPreset(preset.name);
    setEditName(preset.name);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
    setEditName('');
    setEditError('');
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      setEditError('Please enter a name for the preset.');
      return;
    }
    if (presets.some(p => p.name === editName.trim() && p.name !== editingPreset)) {
      setEditError('A preset with this name already exists.');
      return;
    }
    if (onRenamePreset) {
      onRenamePreset(editingPreset, editName.trim());
    }
    setEditingPreset(null);
    setEditName('');
    setEditError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Wrapper function to handle apply preset with proper modal closing
  const handleApplyPreset = (preset) => {
    // Call onApplyPreset (which will set showPresetsModal to false)
    onApplyPreset(preset);
    
    // Use BaseModal's handleClose for proper fade-out
    if (handleCloseRef.current) {
      handleCloseRef.current();
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Manage Presets"
      onClose={onClose}
      maxWidth="540px"
      footerContent={({ handleClose }) => {
        // Store the handleClose function in the ref
        handleCloseRef.current = handleClose;
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="cancel-button" onClick={handleClose}>Close</button>
          </div>
        );
      }}
    >
       <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Save Current as Preset</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              placeholder="Preset name"
              value={newPresetName}
              onChange={e => { setNewPresetName(e.target.value); setError(''); }}
              style={{ flex: 1, padding: 8, borderRadius: 6, border: '1.5px solid #bbb', fontSize: 15 }}
              maxLength={32}
              disabled={presets.length >= 6}
            />
            <button
              className="save-button"
              style={{ minWidth: 90 }}
              onClick={handleSave}
              disabled={presets.length >= 6}
            >
              Save Preset
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#666' }}>Include channel data (apps and media)</span>
              <label className="toggle-switch" style={{ margin: 0 }}>
                <input
                  type="checkbox"
                  checked={includeChannels}
                  onChange={(e) => setIncludeChannels(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4, marginLeft: 0 }}>
              When enabled, this preset will also save your current channel apps and media files.
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, color: '#666' }}>Include sound settings (enabled sounds and volumes)</span>
                <label className="toggle-switch" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={includeSounds}
                    onChange={(e) => setIncludeSounds(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4, marginLeft: 0 }}>
                When enabled, this preset will also save your current sound settings and volume levels.
              </div>
            </div>
          </div>
          {error && <div style={{ color: '#dc3545', fontSize: 13, marginTop: 6 }}>{error}</div>}
          {presets.length >= 6 && <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>You can save up to 6 presets.</div>}
        </div>
      </div>
      
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Saved Presets</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          {presets.length === 0 && <div style={{ color: '#888', fontStyle: 'italic' }}>No presets saved yet.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 10 }}>
            {presets.map((preset, idx) => (
              <div key={preset.name} style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1.5px solid #e0e0e6', borderRadius: 8, padding: 12, background: '#f9fafd' }}>
                <div style={{ flex: 1 }}>
                  {editingPreset === preset.name ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => { setEditName(e.target.value); setEditError(''); }}
                        onKeyDown={handleKeyPress}
                        style={{ 
                          flex: 1, 
                          padding: 6, 
                          borderRadius: 4, 
                          border: '1.5px solid #0099ff', 
                          fontSize: 15,
                          fontWeight: 600,
                          background: '#fff',
                          color: '#222'
                        }}
                        maxLength={32}
                        autoFocus
                      />
                      <button
                        className="save-button"
                        style={{ minWidth: 50, padding: '4px 8px', fontSize: 12 }}
                        onClick={handleSaveEdit}
                      >
                        ✓
                      </button>
                      <button
                        className="cancel-button"
                        style={{ minWidth: 50, padding: '4px 8px', fontSize: 12 }}
                        onClick={handleCancelEdit}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{preset.name}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                          {preset.data.channels && (
                            <div style={{ fontSize: 12, color: '#0099ff' }}>
                              📱 Includes channel data
                            </div>
                          )}
                          {preset.data.soundLibrary && (
                            <div style={{ fontSize: 12, color: '#ff9900' }}>
                              🔊 Includes sound settings
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        className="cancel-button"
                        style={{ 
                          minWidth: 50, 
                          padding: '4px 8px', 
                          fontSize: 12,
                          background: '#f0f0f0',
                          border: '1px solid #ccc',
                          color: '#666'
                        }}
                        onClick={() => handleStartEdit(preset)}
                        title="Edit name"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                  {editError && editingPreset === preset.name && (
                    <div style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>{editError}</div>
                  )}
                </div>
                {editingPreset !== preset.name && (
                  <>
                    <button className="save-button" style={{ minWidth: 70 }} onClick={() => handleApplyPreset(preset)}>
                      Apply
                    </button>
                    <button
                      className="save-button"
                      style={{ minWidth: 70, background: justUpdated === preset.name ? '#4CAF50' : undefined }}
                      onClick={() => handleUpdate(preset.name)}
                      disabled={justUpdated === preset.name}
                    >
                      {justUpdated === preset.name ? 'Updated!' : 'Update'}
                    </button>
                    <button className="cancel-button" style={{ minWidth: 70 }} onClick={() => onDeletePreset(preset.name)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
     
    </BaseModal>
  );
}

PresetsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  presets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
  })).isRequired,
  onSavePreset: PropTypes.func.isRequired, // (name, includeChannels, includeSounds) => void
  onDeletePreset: PropTypes.func.isRequired,
  onApplyPreset: PropTypes.func.isRequired,
  onUpdatePreset: PropTypes.func.isRequired,
  onRenamePreset: PropTypes.func,
};

export default PresetsModal; 