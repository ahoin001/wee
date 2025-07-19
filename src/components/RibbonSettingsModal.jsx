import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import Button from '../ui/Button';
import Slider from '../ui/Slider';
import { spacing } from '../ui/tokens';
import './BaseModal.css';
import './SoundModal.css';

function RibbonSettingsModal({ isOpen, onClose, onSettingsChange, glassWiiRibbon, setGlassWiiRibbon }) {
  const [glassEnabled, setGlassEnabled] = useState(glassWiiRibbon);
  const [glassOpacity, setGlassOpacity] = useState(0.18);
  const [glassBlur, setGlassBlur] = useState(2.5);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(0.5);
  const [glassShineOpacity, setGlassShineOpacity] = useState(0.7);
  const [ribbonColor, setRibbonColor] = useState('#e0e6ef');
  const [recentRibbonColors, setRecentRibbonColors] = useState([]);
  const [ribbonGlowColor, setRibbonGlowColor] = useState('#0099ff');
  const [recentRibbonGlowColors, setRecentRibbonGlowColors] = useState([]);
  const [ribbonGlowStrength, setRibbonGlowStrength] = useState(20);
  const [ribbonGlowStrengthHover, setRibbonGlowStrengthHover] = useState(28);
  const [ribbonDockOpacity, setRibbonDockOpacity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setGlassEnabled(glassWiiRibbon);
      if (window.settings) {
        setGlassOpacity(window.settings.glassOpacity ?? 0.18);
        setGlassBlur(window.settings.glassBlur ?? 2.5);
        setGlassBorderOpacity(window.settings.glassBorderOpacity ?? 0.5);
        setGlassShineOpacity(window.settings.glassShineOpacity ?? 0.7);
        setRibbonColor(window.settings.ribbonColor ?? '#e0e6ef');
        setRecentRibbonColors(window.settings.recentRibbonColors ?? []);
        setRibbonGlowColor(window.settings.ribbonGlowColor ?? '#0099ff');
        setRecentRibbonGlowColors(window.settings.recentRibbonGlowColors ?? []);
        setRibbonGlowStrength(window.settings.ribbonGlowStrength ?? 20);
        setRibbonGlowStrengthHover(window.settings.ribbonGlowStrengthHover ?? 28);
        setRibbonDockOpacity(window.settings.ribbonDockOpacity ?? 1);
      }
    }
  }, [isOpen, glassWiiRibbon]);

  // Reset to default values
  const resetToDefault = () => {
    setRibbonColor('#e0e6ef');
    setRibbonGlowColor('#0099ff');
    setRibbonGlowStrength(20);
    setRibbonGlowStrengthHover(28);
    setRibbonDockOpacity(1);
    setGlassEnabled(false);
    setGlassOpacity(0.18);
    setGlassBlur(2.5);
    setGlassBorderOpacity(0.5);
    setGlassShineOpacity(0.7);
    setRecentRibbonColors([]);
    setRecentRibbonGlowColors([]);
  };

  const handleSave = async (handleClose) => {
    try {
      if (setGlassWiiRibbon) setGlassWiiRibbon(glassEnabled);
      let newRecent = [ribbonColor, ...recentRibbonColors.filter(c => c !== ribbonColor)].slice(0, 3);
      setRecentRibbonColors(newRecent);
      let newRecentGlow = [ribbonGlowColor, ...recentRibbonGlowColors.filter(c => c !== ribbonGlowColor)].slice(0, 3);
      setRecentRibbonGlowColors(newRecentGlow);
      if (onSettingsChange) {
        onSettingsChange({
          glassWiiRibbon: glassEnabled,
          glassOpacity,
          glassBlur,
          glassBorderOpacity,
          glassShineOpacity,
          ribbonColor,
          recentRibbonColors: newRecent,
          ribbonGlowColor,
          recentRibbonGlowColors: newRecentGlow,
          ribbonGlowStrength,
          ribbonGlowStrengthHover,
          ribbonDockOpacity,
        });
      }
      handleClose();
    } catch (err) {
      console.error('Failed to save ribbon settings:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Customize Ribbon"
      onClose={onClose}
      maxWidth="480px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            className="reset-button" 
            onClick={resetToDefault}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '2px solid #0099ff',
              background: 'transparent',
              color: '#0099ff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#0099ff';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#0099ff';
            }}
          >
            Reset to Default
          </button>
          <div style={{ display: 'flex', gap: spacing.md }}>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={() => handleSave(handleClose)}>Save</Button>
          </div>
        </div>
      )}
    >
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Ribbon Styles</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the appearance of the Wii Ribbon including colors and glow effects.
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <label style={{ fontWeight: 500, minWidth: 120 }}>Ribbon Color</label>
              <input
                type="color"
                value={ribbonColor}
                onChange={e => setRibbonColor(e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <span style={{ color: '#888', fontSize: 14 }}>
                {ribbonColor.toUpperCase()}
              </span>
            </div>
            {recentRibbonColors.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
                <span style={{ fontSize: 13, color: '#888', marginRight: 2 }}>Previous:</span>
                {recentRibbonColors.map((color, idx) => (
                  <button
                    key={color}
                    onClick={() => setRibbonColor(color)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: color === ribbonColor ? '2px solid #0099ff' : '1.5px solid #bbb',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <label style={{ fontWeight: 500, minWidth: 120 }}>Ribbon Glow Color</label>
              <input
                type="color"
                value={ribbonGlowColor}
                onChange={e => setRibbonGlowColor(e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <span style={{ color: '#888', fontSize: 14 }}>
                {ribbonGlowColor.toUpperCase()}
              </span>
            </div>
            {recentRibbonGlowColors.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
                <span style={{ fontSize: 13, color: '#888', marginRight: 2 }}>Previous:</span>
                {recentRibbonGlowColors.map((color, idx) => (
                  <button
                    key={color}
                    onClick={() => setRibbonGlowColor(color)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: color === ribbonGlowColor ? '2px solid #0099ff' : '1.5px solid #bbb',
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
            <Slider
              label="Glow Strength"
              value={ribbonGlowStrength}
              min={0}
              max={64}
              step={1}
              onChange={e => setRibbonGlowStrength(Number(e.target.value))}
            />
            <Slider
              label="Glow Strength on Hover"
              value={ribbonGlowStrengthHover}
              min={0}
              max={96}
              step={1}
              onChange={e => setRibbonGlowStrengthHover(Number(e.target.value))}
            />
            {!glassEnabled && (
              <Slider
                label="Dock Transparency"
                value={ribbonDockOpacity}
                min={0.1}
                max={1}
                step={0.01}
                onChange={e => setRibbonDockOpacity(Number(e.target.value))}
              />
            )}
          </div>
        </div>
      </div>
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Glass Effect</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={glassEnabled}
              onChange={e => setGlassEnabled(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Add a frosted glass effect to the Wii Ribbon for a more modern look.
          {glassEnabled && (
            <div style={{ marginTop: 14 }}>
              <Slider
                label="Background Opacity"
                value={glassOpacity}
                min={0.05}
                max={0.4}
                step={0.01}
                onChange={e => setGlassOpacity(Number(e.target.value))}
              />
              <Slider
                label="Backdrop Blur"
                value={glassBlur}
                min={0}
                max={8}
                step={0.1}
                onChange={e => setGlassBlur(Number(e.target.value))}
              />
              <Slider
                label="Border Opacity"
                value={glassBorderOpacity}
                min={0}
                max={1}
                step={0.05}
                onChange={e => setGlassBorderOpacity(Number(e.target.value))}
              />
              <Slider
                label="Shine Effect"
                value={glassShineOpacity}
                min={0}
                max={1}
                step={0.05}
                onChange={e => setGlassShineOpacity(Number(e.target.value))}
              />
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

RibbonSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
  glassWiiRibbon: PropTypes.bool,
  setGlassWiiRibbon: PropTypes.func,
};

export default RibbonSettingsModal; 