import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';
import Toggle from '../ui/Toggle';
import Text from '../ui/Text';
import Button from '../ui/Button';

function GeneralSettingsModal({ isOpen, onClose, immersivePip, setImmersivePip, glassWiiRibbon, setGlassWiiRibbon, startInFullscreen, setStartInFullscreen, showPresetsButton, setShowPresetsButton, onSettingsChange, ...props }) {
  const [pip, setPip] = useState(immersivePip);
  const [glassRibbon, setGlassRibbon] = useState(glassWiiRibbon);
  const [fullscreen, setFullscreen] = useState(startInFullscreen);
  const [showPresets, setShowPresets] = useState(showPresetsButton);
  const [startOnBoot, setStartOnBoot] = useState(false);

  useEffect(() => {
    if (window.api && window.api.getAutoLaunch) {
      window.api.getAutoLaunch().then(setStartOnBoot);
    }
  }, []);

  const handleSave = (handleClose) => {
    setImmersivePip(pip);
    setGlassWiiRibbon(glassRibbon);
    setStartInFullscreen(fullscreen);
    setShowPresetsButton(showPresets);
    if (onSettingsChange) {
      onSettingsChange({});
    }
    handleClose();
  };

  const handleStartOnBootToggle = (e) => {
    const checked = e.target.checked;
    setStartOnBoot(checked);
    if (window.api && window.api.setAutoLaunch) {
      window.api.setAutoLaunch(checked);
    }
    // Optionally, persist in your own settings file as well
    if (onSettingsChange) {
      onSettingsChange({ startOnBoot: checked });
    }
  };

  return (
    <BaseModal 
      title="General Settings" 
      onClose={onClose} 
      maxWidth="900px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={() => handleSave(handleClose)} style={{ minWidth: 90 }}>Save</button>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Immersive PiP */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Immersive Picture in Picture mode</span>
            <Toggle
                checked={pip}
              onChange={setPip}
              />
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, video overlays will use immersive PiP mode for a more cinematic experience.</div>
        </div>

        {/* Start in Fullscreen */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Start in Fullscreen</span>
            <Toggle
                checked={fullscreen}
              onChange={setFullscreen}
              />
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, the app will start in fullscreen mode. When disabled, it will start in windowed mode.</div>
        </div>

        {/* Show Presets Button */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Show Presets Button</span>
            <Toggle
                checked={showPresets}
              onChange={setShowPresets}
              />
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, shows a presets button near the time display that allows quick access to saved appearance presets. Right-click the button to customize its icon.</div>
        </div>

        {/* Launch on Startup */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Launch app when my computer starts</span>
            <Toggle
                checked={startOnBoot}
                onChange={handleStartOnBootToggle}
              />
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, the app will launch automatically when your computer starts.</div>
        </div>
      </div>
    </BaseModal>
  );
}

GeneralSettingsModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  immersivePip: PropTypes.bool,
  setImmersivePip: PropTypes.func,
  glassWiiRibbon: PropTypes.bool,
  setGlassWiiRibbon: PropTypes.func,
  startInFullscreen: PropTypes.bool,
  setStartInFullscreen: PropTypes.func,
  showPresetsButton: PropTypes.bool,
  setShowPresetsButton: PropTypes.func,
  onSettingsChange: PropTypes.func,
};

export default GeneralSettingsModal; 