import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

function GeneralSettingsModal({ isOpen, onClose, immersivePip, setImmersivePip, glassWiiRibbon, setGlassWiiRibbon }) {
  const [pip, setPip] = useState(immersivePip);
  const [glassRibbon, setGlassRibbon] = useState(glassWiiRibbon);

  const handleSave = () => {
    setImmersivePip(pip);
    setGlassWiiRibbon(glassRibbon);
    onClose();
  };

  return (
    <BaseModal title="General Settings" onClose={onClose} maxWidth="400px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span>Immersive Picture in Picture mode</span>
            <span className="toggle-switch">
              <input
                type="checkbox"
                checked={pip}
                onChange={e => setPip(e.target.checked)}
              />
              <span className="slider" />
            </span>
          </label>
          <div style={{ color: '#666', fontSize: 14, marginLeft: 28 }}>
            When enabled, opening a URL from a channel will open it in a window inside the app. When disabled, URLs open in your default browser.
          </div>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span>Glass Wii Ribbon</span>
            <span className="toggle-switch">
              <input
                type="checkbox"
                checked={glassRibbon}
                onChange={e => setGlassRibbon(e.target.checked)}
              />
              <span className="slider" />
            </span>
          </label>
          <div style={{ color: '#666', fontSize: 14, marginLeft: 28 }}>
            When enabled, the Wii Ribbon will have a frosted glass effect, allowing you to see the wallpaper behind it while maintaining button visibility.
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
  glassWiiRibbon: PropTypes.bool.isRequired,
  setGlassWiiRibbon: PropTypes.func.isRequired,
};

export default GeneralSettingsModal; 