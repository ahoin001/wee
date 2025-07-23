import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './InstallerExperienceModal.css';

const shortcutOptions = [
  { key: 'desktop', label: 'Desktop' },
  { key: 'startMenu', label: 'Start Menu' },
  { key: 'taskbar', label: 'Taskbar' },
];

function InstallerExperienceModal({ isOpen, onFinish }) {
  const [selected, setSelected] = useState(['desktop', 'startMenu']);

  const toggleOption = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="installer-experience-modal">
      <div className="installer-content">
        {/* Fun Animation Placeholder */}
        <div className="installer-animation">
          {/* Replace with Lottie/SVG/CSS animation */}
          <div className="wii-animation-placeholder">
            <span role="img" aria-label="Wii">🎮</span>
            <span className="bounce">Welcome to WiiDesktopLauncher!</span>
          </div>
        </div>
        <h2>Let’s get you set up!</h2>
        <p style={{ fontSize: 18, marginBottom: 24 }}>
          Where would you like your app shortcuts?
        </p>
        <div className="shortcut-options">
          {shortcutOptions.map(opt => (
            <label key={opt.key} className={`shortcut-option${selected.includes(opt.key) ? ' selected' : ''}`}> 
              <input
                type="checkbox"
                checked={selected.includes(opt.key)}
                onChange={() => toggleOption(opt.key)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <button
          className="finish-button"
          onClick={() => onFinish(selected)}
          style={{ marginTop: 32, fontSize: 18, padding: '12px 32px', borderRadius: 8 }}
        >
          Finish & Launch!
        </button>
        <div className="installer-footer">
          <span role="img" aria-label="sparkle">✨</span> Enjoy your new Wii-inspired desktop!
        </div>
      </div>
    </div>
  );
}

InstallerExperienceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onFinish: PropTypes.func.isRequired,
};

export default InstallerExperienceModal; 