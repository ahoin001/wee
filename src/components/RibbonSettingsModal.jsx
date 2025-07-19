import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Slider from '../ui/Slider';
import { spacing } from '../ui/tokens';
import './BaseModal.css';

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
  const [ribbonGlowStrength, setRibbonGlowStrength] = useState(32);
  const [ribbonGlowStrengthHover, setRibbonGlowStrengthHover] = useState(48);
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
        setRibbonGlowStrength(window.settings.ribbonGlowStrength ?? 32);
        setRibbonGlowStrengthHover(window.settings.ribbonGlowStrengthHover ?? 48);
        setRibbonDockOpacity(window.settings.ribbonDockOpacity ?? 1);
      }
    }
  }, [isOpen, glassWiiRibbon]);

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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md }}>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSave(handleClose)}>Save</Button>
        </div>
      )}
    >
      <Card>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: spacing.md }}>Ribbon Styles</div>
        <Input
          label="Ribbon Color"
          type="color"
          value={ribbonColor}
          onChange={e => setRibbonColor(e.target.value)}
        />
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
        <Input
          label="Ribbon Glow Color"
          type="color"
          value={ribbonGlowColor}
          onChange={e => setRibbonGlowColor(e.target.value)}
        />
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
      </Card>
      <Card>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: spacing.md }}>Glass Effect</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
          <label style={{ fontWeight: 500 }}>Enable Glass Effect</label>
          <input
            type="checkbox"
            checked={glassEnabled}
            onChange={e => setGlassEnabled(e.target.checked)}
            style={{ width: 24, height: 24 }}
          />
        </div>
        {glassEnabled && (
          <>
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
          </>
        )}
      </Card>
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