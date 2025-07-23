import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';
import Toggle from '../ui/Toggle';
import Text from '../ui/Text';
import Button from '../ui/Button';

function GeneralSettingsModal({ isOpen, onClose, immersivePip, setImmersivePip, glassWiiRibbon, setGlassWiiRibbon, animatedOnHover, setAnimatedOnHover, startInFullscreen, setStartInFullscreen, showPresetsButton, setShowPresetsButton, onSettingsChange, ...props }) {
  const [pip, setPip] = useState(immersivePip);
  const [glassRibbon, setGlassRibbon] = useState(glassWiiRibbon);
  const [hoverAnim, setHoverAnim] = useState(animatedOnHover);
  const [fullscreen, setFullscreen] = useState(startInFullscreen);
  const [showPresets, setShowPresets] = useState(showPresetsButton);
  const [startOnBoot, setStartOnBoot] = useState(false);
  const [channelAnimation, setChannelAnimation] = useState(props.channelAnimation || 'none');

  useEffect(() => {
    if (window.api && window.api.getAutoLaunch) {
      window.api.getAutoLaunch().then(setStartOnBoot);
    }
  }, []);

  const handleSave = (handleClose) => {
    setImmersivePip(pip);
    setGlassWiiRibbon(glassRibbon);
    setAnimatedOnHover(hoverAnim);
    setStartInFullscreen(fullscreen);
    setShowPresetsButton(showPresets);
    if (onSettingsChange) {
      onSettingsChange({ channelAnimation });
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
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={pip}
                onChange={e => setPip(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, video overlays will use immersive PiP mode for a more cinematic experience.</div>
        </div>
        {/* Glass Wii Ribbon */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Glass Wii Ribbon</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={glassRibbon}
                onChange={e => setGlassRibbon(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">Adds a frosted glass effect to the Wii Ribbon for a more modern look.</div>
        </div>
        {/* Only play channel animations on hover */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Only play channel animations on hover</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={hoverAnim}
                onChange={e => setHoverAnim(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, animated channel art (GIFs/MP4s) will only play when you hover over a channel.</div>
        </div>
        {/* Start in Fullscreen */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Start in Fullscreen</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={fullscreen}
                onChange={e => setFullscreen(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, the app will start in fullscreen mode. When disabled, it will start in windowed mode.</div>
        </div>
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Show Presets Button</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={showPresets}
                onChange={e => setShowPresets(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, shows a presets button near the time display that allows quick access to saved appearance presets. Right-click the button to customize its icon.</div>
        </div>
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Launch app when my computer starts</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={startOnBoot}
                onChange={handleStartOnBootToggle}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, the app will launch automatically when your computer starts.</div>
        </div>
        <div className="wee-card" style={{ marginBottom: 18 }}>
          <div className="wee-card-header">
            <Text as="span" size="lg" weight={700} className="wee-card-title">Channel Animations</Text>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            <Text as="label" size="md" weight={500} style={{ display: 'block', marginBottom: 8 }}>Channel Animation Style</Text>
            <select
              value={channelAnimation}
              onChange={e => setChannelAnimation(e.target.value)}
              style={{ fontSize: 15, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #ccc', marginBottom: 8 }}
            >
              <option value="none">None</option>
              <option value="pulse">Pulse</option>
              <option value="bounce">Bounce</option>
              <option value="wiggle">Wiggle</option>
              <option value="glow">Glow</option>
              <option value="parallax">Parallax</option>
              <option value="flip">Flip</option>
              <option value="swing">Swing</option>
              <option value="shake">Shake</option>
              <option value="pop">Pop</option>
              <option value="slide">Slide</option>
              <option value="colorcycle">Color Cycle</option>
              <option value="sparkle">Sparkle</option>
              <option value="heartbeat">Heartbeat</option>
              <option value="orbit">Orbit</option>
              <option value="wave">Wave</option>
              <option value="jelly">Jelly</option>
              <option value="zoom">Zoom</option>
              <option value="rotate">Rotate</option>
              <option value="glowtrail">Glow Trail</option>
              <option value="random">Random</option>
              <option value="fullrandom">Full Random (cycle animations)</option>
            </select>
            <Text as="p" size="sm" color="#888">Choose how your channel icons animate on the home screen. No hover needed—animations will play automatically.</Text>
          </div>
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
  animatedOnHover: PropTypes.bool,
  setAnimatedOnHover: PropTypes.func,
  startInFullscreen: PropTypes.bool,
  setStartInFullscreen: PropTypes.func,
  showPresetsButton: PropTypes.bool,
  setShowPresetsButton: PropTypes.func,
  onSettingsChange: PropTypes.func,
  channelAnimation: PropTypes.string,
};

export default GeneralSettingsModal; 