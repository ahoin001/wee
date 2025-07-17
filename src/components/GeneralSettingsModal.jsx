import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

function GeneralSettingsModal({ isOpen, onClose, immersivePip, setImmersivePip }) {
  const [pip, setPip] = useState(immersivePip);

  const handleSave = () => {
    setImmersivePip(pip);
    onClose();
  };

  return (
    <BaseModal title="General Settings" onClose={onClose} maxWidth="400px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
};

export default GeneralSettingsModal; 