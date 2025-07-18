import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

function GeneralSettingsModal({ isOpen, onClose, immersivePip, setImmersivePip, defaultBarType, setDefaultBarType }) {
  const [pip, setPip] = useState(immersivePip);
  const [barType, setBarType] = useState(defaultBarType);

  const handleSave = () => {
    setImmersivePip(pip);
    setDefaultBarType(barType);
    onClose();
  };

  return (
    <BaseModal title="General Settings" onClose={onClose} maxWidth="400px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={pip}
              onChange={e => setPip(e.target.checked)}
            />
            Immersive Picture in Picture mode
          </label>
          <div style={{ color: '#666', fontSize: 14, marginLeft: 28 }}>
            When enabled, opening a URL from a channel will open it in a window inside the app. When disabled, URLs open in your default browser.
          </div>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            Default Bar Type
          </label>
          <select 
            value={barType} 
            onChange={e => setBarType(e.target.value)}
            style={{ 
              marginLeft: 28, 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ccc',
              backgroundColor: 'white',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            <option value="flat">Flat Bar</option>
            <option value="wii-ribbon">Wii Ribbon</option>
            <option value="wii">Wii Bar</option>
          </select>
          <div style={{ color: '#666', fontSize: 14, marginLeft: 28, marginTop: 4 }}>
            Choose which bar type to use by default when the app starts.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </BaseModal>
  );
}

GeneralSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  immersivePip: PropTypes.bool.isRequired,
  setImmersivePip: PropTypes.func.isRequired,
  defaultBarType: PropTypes.string.isRequired,
  setDefaultBarType: PropTypes.func.isRequired,
};

export default GeneralSettingsModal; 