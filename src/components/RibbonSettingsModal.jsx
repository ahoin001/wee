import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Button from '../ui/WButton';
import Slider from '../ui/Slider';
import WToggle from '../ui/WToggle';
import Card from '../ui/Card';
// New unified data layer imports
import { useRibbonState } from '../utils/useConsolidatedAppHooks';

import './SoundModal.css';
import './settings-modal-forms.css';
import {
  DEFAULT_RIBBON_GLOW_HEX,
  DEFAULT_RIBBON_SURFACE_HEX,
} from '../design/runtimeColorStrings.js';

function RibbonSettingsModal({ isOpen, onClose, onSettingsChange, glassWiiRibbon, setGlassWiiRibbon }) {
  // New unified data layer hooks
  const { ribbon, setRibbonState } = useRibbonState();
  const ribbonSettings = ribbon;
  const updateRibbonSetting = (key, value) => setRibbonState({ [key]: value });

  const [glassEnabled, setGlassEnabled] = useState(glassWiiRibbon);
  const [glassOpacity, setGlassOpacity] = useState(0.18);
  const [glassBlur, setGlassBlur] = useState(2.5);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(0.5);
  const [glassShineOpacity, setGlassShineOpacity] = useState(0.7);
  const [ribbonColor, setRibbonColor] = useState(DEFAULT_RIBBON_SURFACE_HEX);
  const [recentRibbonColors, setRecentRibbonColors] = useState([]);
  const [ribbonGlowColor, setRibbonGlowColor] = useState(DEFAULT_RIBBON_GLOW_HEX);
  const [recentRibbonGlowColors, setRecentRibbonGlowColors] = useState([]);
  const [ribbonGlowStrength, setRibbonGlowStrength] = useState(20);
  const [ribbonGlowStrengthHover, setRibbonGlowStrengthHover] = useState(28);
  const [ribbonDockOpacity, setRibbonDockOpacity] = useState(1);
  const [ribbonHoverAnimationEnabled, setRibbonHoverAnimationEnabled] = useState(true);

  useEffect(() => {
    if (isOpen && ribbonSettings) {
      setGlassEnabled(glassWiiRibbon);
      setGlassOpacity(ribbonSettings.glassOpacity ?? 0.18);
      setGlassBlur(ribbonSettings.glassBlur ?? 2.5);
      setGlassBorderOpacity(ribbonSettings.glassBorderOpacity ?? 0.5);
      setGlassShineOpacity(ribbonSettings.glassShineOpacity ?? 0.7);
      setRibbonColor(ribbonSettings.ribbonColor ?? DEFAULT_RIBBON_SURFACE_HEX);
      setRecentRibbonColors(ribbonSettings.recentRibbonColors ?? []);
      setRibbonGlowColor(ribbonSettings.ribbonGlowColor ?? DEFAULT_RIBBON_GLOW_HEX);
      setRecentRibbonGlowColors(ribbonSettings.recentRibbonGlowColors ?? []);
      setRibbonGlowStrength(ribbonSettings.ribbonGlowStrength ?? 20);
      setRibbonGlowStrengthHover(ribbonSettings.ribbonGlowStrengthHover ?? 28);
      setRibbonDockOpacity(ribbonSettings.ribbonDockOpacity ?? 1);
      setRibbonHoverAnimationEnabled(ribbonSettings.ribbonHoverAnimationEnabled ?? true);
    }
  }, [isOpen, glassWiiRibbon, ribbonSettings]);

  // Reset to default values
  const resetToDefault = () => {
    setRibbonColor(DEFAULT_RIBBON_SURFACE_HEX);
    setRibbonGlowColor(DEFAULT_RIBBON_GLOW_HEX);
    setRibbonGlowStrength(20);
    setRibbonGlowStrengthHover(28);
    setRibbonDockOpacity(1);
    setRibbonHoverAnimationEnabled(true);
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
      
      // Update using unified data layer
      updateRibbonSetting('glassWiiRibbon', glassEnabled);
      updateRibbonSetting('glassOpacity', glassOpacity);
      updateRibbonSetting('glassBlur', glassBlur);
      updateRibbonSetting('glassBorderOpacity', glassBorderOpacity);
      updateRibbonSetting('glassShineOpacity', glassShineOpacity);
      updateRibbonSetting('ribbonColor', ribbonColor);
      updateRibbonSetting('recentRibbonColors', newRecent);
      updateRibbonSetting('ribbonGlowColor', ribbonGlowColor);
      updateRibbonSetting('recentRibbonGlowColors', newRecentGlow);
      updateRibbonSetting('ribbonGlowStrength', ribbonGlowStrength);
      updateRibbonSetting('ribbonGlowStrengthHover', ribbonGlowStrengthHover);
      updateRibbonSetting('ribbonDockOpacity', ribbonDockOpacity);
      updateRibbonSetting('ribbonHoverAnimationEnabled', ribbonHoverAnimationEnabled);
      
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
          ribbonHoverAnimationEnabled,
        });
      }
      handleClose();
    } catch (err) {
      console.error('Failed to save ribbon settings:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <WBaseModal
      title="Customize Ribbon"
      onClose={onClose}
      maxWidth="700px"
      footerContent={({ handleClose }) => (
        <div className="modal-footer-row">
          <button 
            type="button"
            className="ribbon-reset-btn" 
            onClick={resetToDefault}
          >
            Reset to Default
          </button>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSave(handleClose)}>Save</Button>
        </div>
      )}
    >
      <Card
        title="Ribbon Style"
        separator
        desc="Switch between solid/glass rendering and tune surface/glow behavior."
        className="modal-card-tight"
      >
        <div className="modal-section-mt">
          <div className="flex items-center justify-between mb-3">
            <label className="modal-label-inline !mb-0">Ribbon Style</label>
            <WToggle
              checked={glassEnabled}
              onChange={(checked) => setGlassEnabled(checked)}
              label={glassEnabled ? 'Glass' : 'Solid'}
            />
          </div>
          <div className="flex items-center justify-between mb-3">
            <label className="modal-label-inline !mb-0">Ribbon Hover Animation</label>
            <WToggle
              checked={ribbonHoverAnimationEnabled}
              onChange={(checked) => setRibbonHoverAnimationEnabled(checked)}
            />
          </div>
          <p className="text-xs text-[hsl(var(--text-secondary))] mb-3">
            Hover animation controls lift/stretch and hover glow boost.
          </p>

          <div className={`modal-color-row ${glassEnabled ? 'opacity-60' : ''}`}>
            <label className="modal-label-inline">Ribbon Color</label>
            <input
              type="color"
              value={ribbonColor}
              onChange={e => setRibbonColor(e.target.value)}
              disabled={glassEnabled}
              className="modal-color-input"
            />
            <span className="modal-hex-muted">
              {ribbonColor.toUpperCase()}
            </span>
          </div>
          {recentRibbonColors.length > 0 && (
            <div className="modal-prev-row mb-4">
              <span className="modal-prev-label">Previous:</span>
              {recentRibbonColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setRibbonColor(color)}
                  className={`modal-swatch ${color === ribbonColor ? 'modal-swatch--active' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
          <div className="modal-color-row">
            <label className="modal-label-inline">Glow Color</label>
            <input
              type="color"
              value={ribbonGlowColor}
              onChange={e => setRibbonGlowColor(e.target.value)}
              className="modal-color-input"
            />
            <span className="modal-hex-muted">
              {ribbonGlowColor.toUpperCase()}
            </span>
          </div>
          {recentRibbonGlowColors.length > 0 && (
            <div className="modal-prev-row mb-4">
              <span className="modal-prev-label">Previous:</span>
              {recentRibbonGlowColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setRibbonGlowColor(color)}
                  className={`modal-swatch ${color === ribbonGlowColor ? 'modal-swatch--active' : ''}`}
                  style={{ backgroundColor: color }}
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
            onChange={value => setRibbonGlowStrength(value)}
          />
          <Slider
            label="Hover Glow Boost"
            value={ribbonGlowStrengthHover}
            min={0}
            max={96}
            step={1}
            disabled={!ribbonHoverAnimationEnabled}
            onChange={value => setRibbonGlowStrengthHover(value)}
          />
          <Slider
            label="Ribbon Opacity (Solid Mode)"
            value={ribbonDockOpacity}
            min={0.1}
            max={1}
            step={0.01}
            disabled={glassEnabled}
            onChange={value => setRibbonDockOpacity(value)}
          />
        </div>
      </Card>

      <Card
        title="Glass Surface"
        separator
        desc={glassEnabled
          ? 'Glass mode is active. These settings affect the ribbon surface.'
          : 'Enable Glass style above to apply these settings.'}
        className="modal-card-tight"
      >
        <div className={`modal-section-mt ${glassEnabled ? '' : 'opacity-60'}`}>
          <Slider
            label="Glass Opacity"
            value={glassOpacity}
            min={0}
            max={0.5}
            step={0.01}
            disabled={!glassEnabled}
            onChange={value => setGlassOpacity(value)}
          />
          <Slider
            label="Glass Blur"
            value={glassBlur}
            min={0}
            max={10}
            step={0.1}
            disabled={!glassEnabled}
            onChange={value => setGlassBlur(value)}
          />
          <Slider
            label="Glass Border Intensity"
            value={glassBorderOpacity}
            min={0}
            max={1}
            step={0.05}
            disabled={!glassEnabled}
            onChange={value => setGlassBorderOpacity(value)}
          />
          <Slider
            label="Glass Shine Intensity"
            value={glassShineOpacity}
            min={0}
            max={1}
            step={0.05}
            disabled={!glassEnabled}
            onChange={value => setGlassShineOpacity(value)}
          />
        </div>
      </Card>
    </WBaseModal>
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