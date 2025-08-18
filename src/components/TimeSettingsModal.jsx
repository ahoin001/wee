import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Button from '../ui/WButton';
import WToggle from '../ui/WToggle';
import Card from '../ui/Card';
// New unified data layer imports
import { useTimeState } from '../utils/useConsolidatedAppHooks';


function TimeSettingsModal({ isOpen, onClose, onSettingsChange }) {
  // New unified data layer hooks
  const { time, setTimeState } = useTimeState();
const timeSettings = time;
const updateTimeSetting = (key, value) => setTimeState({ [key]: value });
  
  const [timeColor, setTimeColor] = useState('#ffffff'); // Default white
  const [recentTimeColors, setRecentTimeColors] = useState([]); // Color history
  const [enableTimePill, setEnableTimePill] = useState(true); // Default enabled
  const [timePillBlur, setTimePillBlur] = useState(8); // Default blur amount
  const [timePillOpacity, setTimePillOpacity] = useState(0.05); // Default background opacity
  const [timeFont, setTimeFont] = useState('default'); // Default font

  // Load current time settings on mount
  useEffect(() => {
    if (isOpen && timeSettings) {
      // Load current settings from unified data layer
      setTimeColor(timeSettings.color || '#ffffff');
      setRecentTimeColors(timeSettings.recentColors || []);
      setEnableTimePill(timeSettings.enablePill ?? true);
      setTimePillBlur(timeSettings.pillBlur ?? 8);
      setTimePillOpacity(timeSettings.pillOpacity ?? 0.05);
      setTimeFont(timeSettings.font || 'default');
    }
  }, [isOpen, timeSettings]);

  // Update color history when timeColor changes
  const updateTimeColor = (newColor) => {
    setTimeColor(newColor);
    // Add to recent colors (keep only last 3)
    setRecentTimeColors(prev => {
      const filtered = prev.filter(color => color !== newColor);
      return [newColor, ...filtered].slice(0, 3);
    });
  };

  // Reset to default values
  const resetToDefault = () => {
    setTimeColor('#ffffff');
    setEnableTimePill(true);
    setTimePillBlur(8);
    setTimePillOpacity(0.05);
    setTimeFont('default');
    setRecentTimeColors([]);
  };

  const handleSave = async (handleClose) => {
    try {
      // Update using unified data layer
      updateTimeSetting('color', timeColor);
      updateTimeSetting('recentColors', recentTimeColors);
      updateTimeSetting('enablePill', enableTimePill);
      updateTimeSetting('pillBlur', timePillBlur);
      updateTimeSetting('pillOpacity', timePillOpacity);
      updateTimeSetting('font', timeFont);
      
      // Call onSettingsChange to notify parent component of the new settings
      if (onSettingsChange) {
        onSettingsChange({
          timeColor: timeColor,
          recentTimeColors: recentTimeColors,
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
    <WBaseModal
      title="Customize Time"
      onClose={onClose}
      maxWidth="700px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
          <Button 
            variant="secondary" 
            onClick={resetToDefault}
            style={{
              border: '2px solid hsl(var(--wii-blue))',
              color: 'hsl(var(--wii-blue))',
              background: 'transparent'
            }}
          >
            Reset to Default
          </Button>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSave(handleClose)} style={{ minWidth: 90 }}>Save</Button>
        </div>
      )}
    >
      {/* Time Display Color Card */}
      <Card 
        title="Time Display Color"
        separator
        desc="Choose the color for the time and date display text."
        style={{ marginTop: 18, marginBottom: 0 }}
      >
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <input
              type="color"
              value={timeColor}
              onChange={(e) => updateTimeColor(e.target.value)}
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
          {recentTimeColors.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: '#888', marginRight: 2 }}>Previous:</span>
              {recentTimeColors.map((color, idx) => (
                <button
                  key={color}
                  onClick={() => updateTimeColor(color)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: color === timeColor ? '2px solid #0099ff' : '1.5px solid #bbb',
                    background: color,
                    cursor: 'pointer',
                    outline: 'none',
                    marginLeft: idx === 0 ? 0 : 2
                  }}
                  title={color}
                />
              ))}
            </div>
          )}
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
      </Card>



      {/* Time Pill Card */}
      <Card 
        title="Time Pill Display"
        separator
        desc="Enable the Apple-style liquid glass pill container for the time display."
        headerActions={
          <WToggle
            checked={enableTimePill}
            onChange={(checked) => setEnableTimePill(checked)}
          />
        }
        style={{ marginTop: 18, marginBottom: 0 }}
      >
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
      </Card>
    </WBaseModal>
  );
}

TimeSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
};

export default TimeSettingsModal; 