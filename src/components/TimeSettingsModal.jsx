import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Button from '../ui/WButton';
import WToggle from '../ui/WToggle';
import Card from '../ui/Card';
import './settings-modal-forms.css';
import { useTimeState } from '../utils/useConsolidatedAppHooks';


function TimeSettingsModal({ isOpen, onClose, onSettingsChange }) {
  const { time, setTimeState } = useTimeState();
  const timeSettings = time;
  const updateTimeSetting = (key, value) => setTimeState({ [key]: value });

  const [timeColor, setTimeColor] = useState('#ffffff');
  const [recentTimeColors, setRecentTimeColors] = useState([]);
  const [enableTimePill, setEnableTimePill] = useState(true);
  const [timePillBlur, setTimePillBlur] = useState(8);
  const [timePillOpacity, setTimePillOpacity] = useState(0.05);
  const [timeFont, setTimeFont] = useState('default');

  useEffect(() => {
    if (isOpen && timeSettings) {
      setTimeColor(timeSettings.color || '#ffffff');
      setRecentTimeColors(timeSettings.recentColors || []);
      setEnableTimePill(timeSettings.enablePill ?? true);
      setTimePillBlur(timeSettings.pillBlur ?? 8);
      setTimePillOpacity(timeSettings.pillOpacity ?? 0.05);
      setTimeFont(timeSettings.font || 'default');
    }
  }, [isOpen, timeSettings]);

  const updateTimeColor = (newColor) => {
    setTimeColor(newColor);
    setRecentTimeColors(prev => {
      const filtered = prev.filter(color => color !== newColor);
      return [newColor, ...filtered].slice(0, 3);
    });
  };

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
      updateTimeSetting('color', timeColor);
      updateTimeSetting('recentColors', recentTimeColors);
      updateTimeSetting('enablePill', enableTimePill);
      updateTimeSetting('pillBlur', timePillBlur);
      updateTimeSetting('pillOpacity', timePillOpacity);
      updateTimeSetting('font', timeFont);
      
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
        <div className="modal-footer-row">
          <Button 
            variant="secondary" 
            onClick={resetToDefault}
            className="modal-btn-reset-outline"
          >
            Reset to Default
          </Button>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSave(handleClose)} className="min-w-[90px]">Save</Button>
        </div>
      )}
    >
      <Card 
        title="Time Display Color"
        separator
        desc="Choose the color for the time and date display text."
        className="modal-card-tight"
      >
        <div className="modal-section-mt">
          <div className="modal-color-row">
            <input
              type="color"
              value={timeColor}
              onChange={(e) => updateTimeColor(e.target.value)}
              className="modal-color-input"
            />
            <span className="modal-hex-muted">
              {timeColor.toUpperCase()}
            </span>
          </div>
          {recentTimeColors.length > 0 && (
            <div className="modal-prev-row">
              <span className="modal-prev-label">Previous:</span>
              {recentTimeColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateTimeColor(color)}
                  className={`modal-swatch ${color === timeColor ? 'modal-swatch--active' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
        <div className="modal-font-row">
          <label className="modal-font-label">Time Font</label>
          <select
            value={timeFont}
            onChange={e => setTimeFont(e.target.value)}
            className="modal-select-compact"
          >
            <option value="default">Default</option>
            <option value="digital">DigitalDisplayRegular-ODEO</option>
          </select>
        </div>
      </Card>

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
        className="modal-card-tight"
      >
        {enableTimePill && (
          <>
            <div className="modal-section-mt">
              <div className="modal-mb-12">
                <label className="modal-label-block">
                  Backdrop Blur: {timePillBlur}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={timePillBlur}
                  onChange={(e) => setTimePillBlur(Number(e.target.value))}
                  className="modal-range-full"
                />
              </div>
              <div>
                <label className="modal-label-block">
                  Background Opacity: {Math.round(timePillOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.3"
                  step="0.01"
                  value={timePillOpacity}
                  onChange={(e) => setTimePillOpacity(Number(e.target.value))}
                  className="modal-range-full"
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
