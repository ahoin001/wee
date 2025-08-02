import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import './BaseModal.css';
import WToggle from '../ui/WToggle';
import Text from '../ui/Text';
import Button from '../ui/WButton';
import Card from '../ui/Card';

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
    <WBaseModal 
      title="General Settings" 
      onClose={onClose} 
      maxWidth="1200px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSave(handleClose)} style={{ minWidth: 90 }}>Save</Button>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Immersive PiP */}
        <Card
          title="Immersive Picture in Picture mode"
          separator
          desc="When enabled, video overlays will use immersive PiP mode for a more cinematic experience."
          headerActions={
            <WToggle
              checked={pip}
              onChange={setPip}
            />
          }
        />

        {/* Start in Fullscreen */}
        <Card
          title="Start in Fullscreen"
          separator
          desc="When enabled, the app will start in fullscreen mode. When disabled, it will start in windowed mode."
          headerActions={
            <WToggle
              checked={fullscreen}
              onChange={setFullscreen}
            />
          }
        />

        {/* Show Presets Button */}
        <Card
          title="Show Presets Button"
          separator
          desc="When enabled, shows a presets button near the time display that allows quick access to saved appearance presets. Right-click the button to customize its icon."
          headerActions={
            <WToggle
              checked={showPresets}
              onChange={setShowPresets}
            />
          }
        />

        {/* Launch on Startup */}
        <Card
          title="Launch app when my computer starts"
          separator
          desc="When enabled, the app will launch automatically when your computer starts."
          headerActions={
            <WToggle
              checked={startOnBoot}
              onChange={handleStartOnBootToggle}
            />
          }
        />
      </div>
    </WBaseModal>
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