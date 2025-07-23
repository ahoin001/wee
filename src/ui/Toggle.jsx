// Toggle.jsx - Universal toggle switch for app settings
// Usage:
// <Toggle checked={value} onChange={fn} label="Label" />
// <Toggle checked={value} onChange={fn} disabled />

import React from "react";
import { colors } from "./tokens";

function getAutoToggleColors(disabled) {
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {
    track: disabled ? (isDark ? '#333' : '#eee') : (isDark ? '#2a4a6a' : '#e0e6ef'),
    trackChecked: disabled ? (isDark ? '#333' : '#eee') : (isDark ? '#0099ff' : colors.primary),
    thumb: isDark ? '#fff' : '#fff',
    border: isDark ? '#222' : '#ccc',
  };
}

export default function Toggle({ checked, onChange, label, disabled = false, style, ...props }) {
  const { track, trackChecked, thumb, border } = getAutoToggleColors(disabled);
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
      <span style={{
        position: 'relative',
        width: 44,
        height: 24,
        display: 'inline-block',
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange && onChange(e.target.checked)}
          disabled={disabled}
          style={{ opacity: 0, width: 44, height: 24, position: 'absolute', left: 0, top: 0, margin: 0, zIndex: 2, cursor: disabled ? 'not-allowed' : 'pointer' }}
          {...props}
        />
        <span style={{
          display: 'block',
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? trackChecked : track,
          border: `1.5px solid ${border}`,
          transition: 'background 0.2s, border 0.2s',
        }} />
        <span style={{
          position: 'absolute',
          left: checked ? 22 : 2,
          top: 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: thumb,
          boxShadow: '0 1px 4px #0002',
          transition: 'left 0.22s cubic-bezier(.4,1.3,.5,1)',
        }} />
      </span>
      {label && <span style={{ fontSize: 15, color: disabled ? '#aaa' : (isDark ? '#fff' : '#222'), fontWeight: 500 }}>{label}</span>}
    </label>
  );
} 