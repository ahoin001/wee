import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';

function TimeSettingsModal({ isOpen, onClose, onSettingsChange }) {
  const [timeColor, setTimeColor] = useState('#ffffff'); // Default white
  const [timeFormat24hr, setTimeFormat24hr] = useState(true); // Default 24hr format
  const [enableTimePill, setEnableTimePill] = useState(true); // Default enabled
  const [timePillBlur, setTimePillBlur] = useState(8); // Default blur amount
  const [timePillOpacity, setTimePillOpacity] = useState(0.05); // Default background opacity
  const [timeFont, setTimeFont] = useState('default'); // Default font

  // Load current time settings on mount
  useEffect(() => {
    if (isOpen) {
      // Load current settings from window.settings (set by App.jsx)
      if (window.settings) {
        setTimeColor(window.settings.timeColor || '#ffffff');
        setTimeFormat24hr(window.settings.timeFormat24hr ?? true);
        setEnableTimePill(window.settings.enableTimePill ?? true);
        setTimePillBlur(window.settings.timePillBlur ?? 8);
        setTimePillOpacity(window.settings.timePillOpacity ?? 0.05);
        setTimeFont(window.settings.timeFont || 'default');
      }
    }
  }, [isOpen]);

  const handleSave = async (handleClose) => {
    try {
      // Call onSettingsChange to notify parent component of the new settings
      if (onSettingsChange) {
        onSettingsChange({
          timeColor: timeColor,
          timeFormat24hr: timeFormat24hr,
          enableTimePill: enableTimePill,
          timePillBlur: timePillBlur,
          timePillOpacity: timePillOpacity,
          timeFont: timeFont,
        });
      }
      handleClose();
    } catch (err) {
      console.error('Failed to save time settings:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Customize Time"
      onClose={onClose}
      maxWidth="480px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={() => handleSave(handleClose)} style={{ minWidth: 90 }}>Save</button>
        </div>
      )}
    >
      {/* Time Display Color Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Time Display Color</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose the color for the time and date display text.
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="color"
                value={timeColor}
                onChange={(e) => setTimeColor(e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <span style={{ color: '#888', fontSize: 14 }}>
                {timeColor.toUpperCase()}
              </span>
            </div>
          </div>
          {/* Font Selection */}
          <div style={{ marginTop: 18 }}>
            <label style={{ fontWeight: 500, marginRight: 10 }}>Time Font</label>
            <select
              value={timeFont}
              onChange={e => setTimeFont(e.target.value)}
              style={{ padding: 4, borderRadius: 6 }}
            >
              <option value="default">Default</option>
              <option value="digital">DigitalDisplayRegular-ODEO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Time Format Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Time Format</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose between 12-hour and 24-hour time format.
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', gap: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="timeFormat"
                  value="24hr"
                  checked={timeFormat24hr}
                  onChange={() => setTimeFormat24hr(true)}
                />
                24-Hour (13:30)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="timeFormat"
                  value="12hr"
                  checked={!timeFormat24hr}
                  onChange={() => setTimeFormat24hr(false)}
                />
                12-Hour (1:30 PM)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Time Pill Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Time Pill Display</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={enableTimePill}
              onChange={(e) => setEnableTimePill(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Enable the Apple-style liquid glass pill container for the time display.
          {enableTimePill && (
            <>
              <div style={{ marginTop: 14 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Backdrop Blur: {timePillBlur}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={timePillBlur}
                    onChange={(e) => setTimePillBlur(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Background Opacity: {Math.round(timePillOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.3"
                    step="0.01"
                    value={timePillOpacity}
                    onChange={(e) => setTimePillOpacity(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

TimeSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
};

export default TimeSettingsModal; 