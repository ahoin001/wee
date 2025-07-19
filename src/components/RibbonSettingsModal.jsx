import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';

function RibbonSettingsModal({ isOpen, onClose, onSettingsChange, glassWiiRibbon, setGlassWiiRibbon }) {
  const [glassEnabled, setGlassEnabled] = useState(glassWiiRibbon);
  const [glassOpacity, setGlassOpacity] = useState(0.18); // Default glass background opacity
  const [glassBlur, setGlassBlur] = useState(2.5); // Default backdrop blur
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(0.5); // Default border opacity
  const [glassShineOpacity, setGlassShineOpacity] = useState(0.7); // Default shine effect opacity
  const [ribbonColor, setRibbonColor] = useState('#e0e6ef'); // Default Wii blue
  const [recentRibbonColors, setRecentRibbonColors] = useState([]); // Last 3 used colors
  const [ribbonGlowColor, setRibbonGlowColor] = useState('#0099ff'); // Default glow color
  const [recentRibbonGlowColors, setRecentRibbonGlowColors] = useState([]); // Last 3 used glow colors
  const [ribbonGlowStrength, setRibbonGlowStrength] = useState(32); // Default normal glow
  const [ribbonGlowStrengthHover, setRibbonGlowStrengthHover] = useState(48); // Default hover glow
  const [ribbonDockOpacity, setRibbonDockOpacity] = useState(1);

  // Load current ribbon settings on mount
  useEffect(() => {
    if (isOpen) {
      setGlassEnabled(glassWiiRibbon);
      // Load current settings from window.settings (set by App.jsx)
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
      // Update the glass enabled state in parent first
      if (setGlassWiiRibbon) {
        setGlassWiiRibbon(glassEnabled);
      }
      // Update recent colors (most recent first, no duplicates, max 3)
      let newRecent = [ribbonColor, ...recentRibbonColors.filter(c => c !== ribbonColor)].slice(0, 3);
      setRecentRibbonColors(newRecent);
      let newRecentGlow = [ribbonGlowColor, ...recentRibbonGlowColors.filter(c => c !== ribbonGlowColor)].slice(0, 3);
      setRecentRibbonGlowColors(newRecentGlow);
      // Call onSettingsChange to notify parent component of the new settings
      if (onSettingsChange) {
        onSettingsChange({
          glassWiiRibbon: glassEnabled,
          glassOpacity: glassOpacity,
          glassBlur: glassBlur,
          glassBorderOpacity: glassBorderOpacity,
          glassShineOpacity: glassShineOpacity,
          ribbonColor: ribbonColor,
          recentRibbonColors: newRecent,
          ribbonGlowColor: ribbonGlowColor,
          recentRibbonGlowColors: newRecentGlow,
          ribbonGlowStrength: ribbonGlowStrength,
          ribbonGlowStrengthHover: ribbonGlowStrengthHover,
          ribbonDockOpacity: ribbonDockOpacity
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={() => handleSave(handleClose)} style={{ minWidth: 90 }}>Save</button>
        </div>
      )}
    >
      {/* Ribbon Styles Card (contains both color pickers and glow controls) */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Ribbon Styles</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose the color for the Wii Ribbon background (applies only when glass effect is off).
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
            <input
              type="color"
              value={ribbonColor}
              onChange={e => setRibbonColor(e.target.value)}
              style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600, color: '#555', fontSize: 15 }}>{ribbonColor.toUpperCase()}</span>
            {/* Previous colors */}
            {recentRibbonColors.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 18 }}>
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
          </div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 18 }}>
            Change the color of the ribbon's glow effect (the outer glow around the ribbon SVG).
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
            <input
              type="color"
              value={ribbonGlowColor}
              onChange={e => setRibbonGlowColor(e.target.value)}
              style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600, color: '#555', fontSize: 15 }}>{ribbonGlowColor.toUpperCase()}</span>
            {/* Previous glow colors */}
            {recentRibbonGlowColors.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 18 }}>
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
          </div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 18 }}>
            Adjust the strength of the ribbon's glow effect.
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
            <input
              type="range"
              min="0"
              max="64"
              step="1"
              value={ribbonGlowStrength}
              onChange={e => setRibbonGlowStrength(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 38, fontWeight: 600, color: '#555' }}>{ribbonGlowStrength}px</span>
          </div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 18 }}>
            Adjust the strength of the glow effect when hovering over the ribbon.
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
            <input
              type="range"
              min="0"
              max="96"
              step="1"
              value={ribbonGlowStrengthHover}
              onChange={e => setRibbonGlowStrengthHover(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 38, fontWeight: 600, color: '#555' }}>{ribbonGlowStrengthHover}px</span>
          </div>
          {!glassEnabled && (
            <>
              <div style={{ fontSize: 14, color: '#666', marginTop: 18 }}>
                Adjust the transparency of the dock (ribbon background) when glass effect is off.
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={ribbonDockOpacity}
                  onChange={e => setRibbonDockOpacity(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 38, fontWeight: 600, color: '#555' }}>{Math.round(ribbonDockOpacity * 100)}%</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Glass Effect Toggle Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Glass Effect</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={glassEnabled}
              onChange={(e) => setGlassEnabled(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Enable the frosted glass effect for the Wii Ribbon. This creates a modern, translucent appearance. 
          <br /><br />
          <span style={{ fontSize: '13px', color: '#888', fontStyle: 'italic' }}>
            💡 Tip: Right-click anywhere on the Wii Ribbon to quickly access this customization panel.
          </span>
        </div>
      </div>

      {/* Glass Effect Properties - Only show when enabled */}
      {glassEnabled && (
        <>
          {/* Background Opacity Card */}
          <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
            <div className="wee-card-header">
              <span className="wee-card-title">Background Opacity</span>
            </div>
            <div className="wee-card-separator" />
            <div className="wee-card-desc">
              Control the transparency of the ribbon's background.
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0 0 0' }}>
                  <input
                    type="range"
                    min="0.05"
                    max="0.4"
                    step="0.01"
                    value={glassOpacity}
                    onChange={(e) => setGlassOpacity(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ minWidth: 38, fontWeight: 600, color: '#555' }}>{Math.round(glassOpacity * 100)}%</span>
                </div>
                <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
                  Higher values make the background more opaque, lower values make it more transparent.
                </div>
              </div>
            </div>
          </div>

          {/* Backdrop Blur Card */}
          <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
            <div className="wee-card-header">
              <span className="wee-card-title">Backdrop Blur</span>
            </div>
            <div className="wee-card-separator" />
            <div className="wee-card-desc">
              Control how much the background is blurred behind the ribbon.
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0 0 0' }}>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.1"
                    value={glassBlur}
                    onChange={(e) => setGlassBlur(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ minWidth: 38, fontWeight: 600, color: '#555' }}>{glassBlur}px</span>
                </div>
                <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
                  Higher values create more blur, lower values make the background clearer.
                </div>
              </div>
            </div>
          </div>

          {/* Border Opacity Card */}
          <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
            <div className="wee-card-header">
              <span className="wee-card-title">Border Opacity</span>
            </div>
            <div className="wee-card-separator" />
            <div className="wee-card-desc">
              Control the visibility of the ribbon's border.
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0 0 0' }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={glassBorderOpacity}
                    onChange={(e) => setGlassBorderOpacity(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ minWidth: 38, fontWeight: 600, color: '#555' }}>{Math.round(glassBorderOpacity * 100)}%</span>
                </div>
                <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
                  Higher values make the border more visible, lower values make it more subtle.
                </div>
              </div>
            </div>
          </div>

          {/* Shine Effect Opacity Card */}
          <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
            <div className="wee-card-header">
              <span className="wee-card-title">Shine Effect</span>
            </div>
            <div className="wee-card-separator" />
            <div className="wee-card-desc">
              Control the intensity of the glass shine effect on the ribbon.
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0 0 0' }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={glassShineOpacity}
                    onChange={(e) => setGlassShineOpacity(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ minWidth: 38, fontWeight: 600, color: '#555' }}>{Math.round(glassShineOpacity * 100)}%</span>
                </div>
                <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
                  Higher values create a more pronounced shine effect, lower values make it more subtle.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
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