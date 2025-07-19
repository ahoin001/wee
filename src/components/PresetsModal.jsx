import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';

function PresetsModal({ isOpen, onClose, presets, onSavePreset, onDeletePreset, onApplyPreset, onUpdatePreset }) {
  const [newPresetName, setNewPresetName] = useState('');
  const [error, setError] = useState('');
  const [justUpdated, setJustUpdated] = useState(null); // name of last updated preset

  const handleSave = () => {
    if (!newPresetName.trim()) {
      setError('Please enter a name for the preset.');
      return;
    }
    if (presets.some(p => p.name === newPresetName.trim())) {
      setError('A preset with this name already exists.');
      return;
    }
    onSavePreset(newPresetName.trim());
    setNewPresetName('');
    setError('');
  };

  const handleUpdate = (name) => {
    onUpdatePreset(name);
    setJustUpdated(name);
    setTimeout(() => setJustUpdated(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Manage Presets"
      onClose={onClose}
      maxWidth="540px"
      footerContent={null}
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
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{preset.name}</div>
                </div>
                <button className="save-button" style={{ minWidth: 70 }} onClick={() => onApplyPreset(preset)}>
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
  onSavePreset: PropTypes.func.isRequired,
  onDeletePreset: PropTypes.func.isRequired,
  onApplyPreset: PropTypes.func.isRequired,
  onUpdatePreset: PropTypes.func.isRequired,
};

export default PresetsModal; 