import React, { useState, useEffect } from 'react';
import SettingsButton from './SettingsButton';
import './WiiBar.css';

// Placeholder SVG icons
const WiiIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="#888" strokeWidth="2" fill="none"/><text x="16" y="21" textAnchor="middle" fontSize="12" fill="#888">Wii</text></svg>
);
const MailIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="2" y="6" width="24" height="16" rx="4" stroke="#888" strokeWidth="2" fill="#fff"/><polyline points="2,6 14,18 26,6" stroke="#888" strokeWidth="2" fill="none"/></svg>
);

function WiiBar(props) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'numeric' }));
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="wii-bar" style={{ WebkitAppRegion: 'drag' }}>
      <svg className="wii-bar-bg" viewBox="0 0 1920 80" width="100%" height="80" preserveAspectRatio="none">
        <path d="M0,0 H1920 V60 Q960,100 0,60 Z" fill="#E9EFF3" stroke="#b0c4d8" strokeWidth="2" />
      </svg>
      <div className="wii-bar-content">
        <button className="wii-bar-btn wii-btn" style={{ left: 32, WebkitAppRegion: 'no-drag' }}>
          <WiiIcon />
        </button>
        <div className="wii-bar-btn sd-btn" style={{ left: 100, WebkitAppRegion: 'no-drag' }}>
          <SettingsButton
            onClick={props.onSettingsClick}
            isActive={props.isEditMode}
            onToggleDarkMode={props.onToggleDarkMode}
            onToggleCursor={props.onToggleCursor}
            useCustomCursor={props.useCustomCursor}
            onSettingsChange={props.onSettingsChange}
            barType={props.barType}
            onBarTypeChange={props.onBarTypeChange}
          />
        </div>
        <div className="wii-bar-clock">
          <div className="wii-bar-time">{time}</div>
          <div className="wii-bar-date">{date}</div>
        </div>
        <button className="wii-bar-btn mail-btn" style={{ right: 32, WebkitAppRegion: 'no-drag' }}>
          <MailIcon />
        </button>
      </div>
    </footer>
  );
}

export default WiiBar; 