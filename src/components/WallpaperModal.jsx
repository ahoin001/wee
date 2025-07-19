import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';

const WALLPAPER_ANIMATIONS = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
];

const api = window.api?.wallpapers || {};
const selectFile = window.api?.selectWallpaperFile;

function WallpaperModal({ isOpen, onClose, onSettingsChange }) {
  const [wallpapers, setWallpapers] = useState([]);
  const [activeWallpaper, setActiveWallpaper] = useState(null);
  const [likedWallpapers, setLikedWallpapers] = useState([]);
  const [cycling, setCycling] = useState(false);
  const [cycleInterval, setCycleInterval] = useState(30);
  const [cycleAnimation, setCycleAnimation] = useState('fade');
  const [slideDirection, setSlideDirection] = useState('right');
  const [crossfadeDuration, setCrossfadeDuration] = useState(1.2); // Duration in seconds
  const [crossfadeEasing, setCrossfadeEasing] = useState('ease-out'); // Easing function
  const [slideRandomDirection, setSlideRandomDirection] = useState(false); // Random vs fixed direction
  const [slideDuration, setSlideDuration] = useState(1.5); // Duration in seconds
  const [slideEasing, setSlideEasing] = useState('ease-out'); // Easing function
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [fadeState, setFadeState] = useState('fade-in');
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [wallpaperOpacity, setWallpaperOpacity] = useState(1);
  const [timeColor, setTimeColor] = useState('#ffffff'); // Default white
  const [timeFormat24hr, setTimeFormat24hr] = useState(true); // Default 24hr format
  const [enableTimePill, setEnableTimePill] = useState(true); // Default enabled
  const [timePillBlur, setTimePillBlur] = useState(8); // Default blur amount
  const [timePillOpacity, setTimePillOpacity] = useState(0.05); // Default background opacity
  const [channelAutoFadeTimeout, setChannelAutoFadeTimeout] = useState(5); // Default 5 seconds

  // Load wallpapers from backend
  const loadWallpapers = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await api.get();
      setWallpapers(data.savedWallpapers || []);
      setActiveWallpaper(data.wallpaper || null);
      setLikedWallpapers(data.likedWallpapers || []);
      setCycling(data.cyclingSettings?.enabled ?? false);
      setCycleInterval(data.cyclingSettings?.interval ?? 30);
      setCycleAnimation(data.cyclingSettings?.animation ?? 'fade');
      setSlideDirection(data.cyclingSettings?.slideDirection ?? 'right');
      setCrossfadeDuration(data.cyclingSettings?.crossfadeDuration ?? 1.2);
      setCrossfadeEasing(data.cyclingSettings?.crossfadeEasing ?? 'ease-out');
      setSlideRandomDirection(data.cyclingSettings?.slideRandomDirection ?? false);
      setSlideDuration(data.cyclingSettings?.slideDuration ?? 1.5);
      setSlideEasing(data.cyclingSettings?.slideEasing ?? 'ease-out');
      setWallpaperOpacity(typeof data.wallpaperOpacity === 'number' ? data.wallpaperOpacity : 1);
      setTimeColor(data.timeColor || '#ffffff'); // Load time color setting
      setTimeFormat24hr(data.timeFormat24hr ?? true); // Load time format setting
      setEnableTimePill(data.enableTimePill ?? true); // Load time pill enabled setting
      setTimePillBlur(data.timePillBlur ?? 8); // Load time pill blur setting
      setTimePillOpacity(data.timePillOpacity ?? 0.05); // Load time pill opacity setting
      setChannelAutoFadeTimeout(data.channelAutoFadeTimeout ?? 5); // Load channel auto-fade timeout setting
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load wallpapers: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) setFadeState('fade-in');
  }, [isOpen]);

  const handleClose = () => {
    setFadeState('fade-out');
    setTimeout(() => onClose(), 280); // match CSS transition
  };

  useEffect(() => {
    if (isOpen) loadWallpapers();
    // Listen for backend updates
    if (window.api && window.api.onWallpapersUpdated) {
      window.api.onWallpapersUpdated(loadWallpapers);
    }
    // Cleanup
    return () => {
      if (window.api && window.api.offWallpapersUpdated) {
        window.api.offWallpapersUpdated(loadWallpapers);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (wallpapers && wallpapers.length > 0) {
      console.log('Saved wallpapers:', wallpapers);
      wallpapers.forEach(wp => console.log('Wallpaper URL:', wp.url));
    }
  }, [wallpapers]);

  // Upload a new wallpaper
  const handleUpload = async () => {
    setUploading(true);
    setMessage({ type: '', text: '' });
    try {
      const fileResult = await selectFile();
      if (!fileResult.success) {
        setMessage({ type: 'error', text: fileResult.error || 'File selection cancelled.' });
        setUploading(false);
        return;
      }
      const file = fileResult.file;
      const addResult = await api.add({ filePath: file.path, filename: file.name });
      if (!addResult.success) {
        setMessage({ type: 'error', text: addResult.error || 'Failed to add wallpaper.' });
        setUploading(false);
        return;
      }
      setMessage({ type: 'success', text: 'Wallpaper uploaded!' });
      await loadWallpapers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload failed: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  // Delete a wallpaper
  const handleDelete = async (url) => {
    setDeleting(prev => ({ ...prev, [url]: true }));
    setMessage({ type: '', text: '' });
    try {
      const result = await api.delete({ url });
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to delete wallpaper.' });
      } else {
        setMessage({ type: 'success', text: 'Wallpaper deleted.' });
        await loadWallpapers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Delete failed: ' + err.message });
    } finally {
      setDeleting(prev => ({ ...prev, [url]: false }));
    }
  };

  // Like/unlike a wallpaper
  const handleLike = async (url) => {
    try {
      const result = await api.toggleLike({ url });
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to toggle like.' });
      } else {
        setLikedWallpapers(result.likedWallpapers);
        setMessage({ type: 'success', text: result.liked ? 'Wallpaper liked!' : 'Wallpaper unliked.' });
        await loadWallpapers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Like/unlike failed: ' + err.message });
    }
  };

  // Set as current wallpaper
  const handleSetCurrent = async (w) => {
    try {
      const result = await api.setActive({ url: w.url });
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to set wallpaper.' });
      } else {
        setActiveWallpaper(w);
        setMessage({ type: 'success', text: 'Wallpaper set as current.' });
        await loadWallpapers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Set wallpaper failed: ' + err.message });
    }
  };

  // Save cycling settings
  const handleSaveCycling = async () => {
    try {
      const result = await api.setCyclingSettings({
        enabled: cycling,
        interval: cycleInterval,
        animation: cycleAnimation,
        slideDirection: slideDirection,
        crossfadeDuration: crossfadeDuration,
        crossfadeEasing: crossfadeEasing,
        slideRandomDirection: slideRandomDirection,
        slideDuration: slideDuration,
        slideEasing: slideEasing,
      });
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to save cycling settings.' });
      } else {
        setMessage({ type: 'success', text: 'Cycling settings saved.' });
        await loadWallpapers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Save cycling failed: ' + err.message });
    }
  };

  // Set selected wallpaper when modal opens or wallpapers change
  useEffect(() => {
    if (isOpen) {
      setSelectedWallpaper(activeWallpaper);
    }
  }, [isOpen, activeWallpaper]);

  // Save both selected wallpaper and cycling settings
  const handleSaveAll = async () => {
    try {
      // First, save all the settings to prevent race conditions
      let data = await api.get();
      data.wallpaperOpacity = wallpaperOpacity;
      data.timeColor = timeColor; // Save time color setting
      data.timeFormat24hr = timeFormat24hr; // Save time format setting
      data.enableTimePill = enableTimePill; // Save time pill enabled setting
      data.timePillBlur = timePillBlur; // Save time pill blur setting
      data.timePillOpacity = timePillOpacity; // Save time pill opacity setting
      data.channelAutoFadeTimeout = channelAutoFadeTimeout; // Save channel auto-fade timeout setting
      await api.set(data);
      
      // Then handle wallpaper and cycling settings
      if (selectedWallpaper) {
        await api.setActive({ url: selectedWallpaper.url });
      }
      await api.setCyclingSettings({
        enabled: cycling,
        interval: cycleInterval,
        animation: cycleAnimation,
        slideDirection: slideDirection,
        crossfadeDuration: crossfadeDuration,
        crossfadeEasing: crossfadeEasing,
        slideRandomDirection: slideRandomDirection,
        slideDuration: slideDuration,
        slideEasing: slideEasing,
      });
      
      setMessage({ type: 'success', text: 'Wallpaper and settings saved.' });
      
      // Immediately update app background and time color
      if (window.settings) {
        window.settings.timeColor = timeColor; // Update window.settings immediately
        window.settings.timeFormat24hr = timeFormat24hr; // Update time format immediately
        window.settings.enableTimePill = enableTimePill; // Update time pill enabled immediately
        window.settings.timePillBlur = timePillBlur; // Update time pill blur immediately
        window.settings.timePillOpacity = timePillOpacity; // Update time pill opacity immediately
        window.settings.channelAutoFadeTimeout = channelAutoFadeTimeout; // Update channel auto-fade timeout immediately
      }
      
      // Update local state to match what we just saved
      setTimeColor(timeColor);
      setTimeFormat24hr(timeFormat24hr);
      setEnableTimePill(enableTimePill);
      setTimePillBlur(timePillBlur);
      setTimePillOpacity(timePillOpacity);
      setChannelAutoFadeTimeout(channelAutoFadeTimeout);
      
      // Don't call loadWallpapers() as it overwrites our settings
      // Call onSettingsChange to notify parent component of the new settings
      if (onSettingsChange) {
        onSettingsChange({
          channelAutoFadeTimeout: channelAutoFadeTimeout,
          timeColor: timeColor,
          timeFormat24hr: timeFormat24hr,
          enableTimePill: enableTimePill,
          timePillBlur: timePillBlur,
          timePillOpacity: timePillOpacity
        });
      }
      handleClose(); // Use fade-out close
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed: ' + err.message });
    }
  };

  if (!isOpen && fadeState !== 'fade-out') return null;
  return (
    <BaseModal
      title="Manage Wallpapers"
      onClose={handleClose}
      maxWidth="900px"
      footerContent={({ handleClose }) => (
        <div style={{ marginTop: 18, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={handleSaveAll} style={{ minWidth: 90 }}>Save</button>
        </div>
      )}
    >
      {message.text && (
        <div className={`message ${message.type}`} style={{ marginBottom: 10, fontWeight: 500 }}>
          {message.text}
        </div>
      )}
      {/* Upload Wallpaper Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Upload New Wallpaper</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Add a new wallpaper from your computer. Supported formats: JPG, PNG, GIF, MP4, WEBM, etc.
          <div style={{ marginTop: 14 }}>
            {/* Upload button and logic here */}
            <button className="file-button" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload New Wallpaper'}
            </button>
          </div>
        </div>
      </div>
      {/* Saved Wallpapers Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Saved Wallpapers</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Browse, select, and manage your saved wallpapers below.
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'flex-start' }}>
              {wallpapers.length === 0 && <span style={{ color: '#888' }}>No saved wallpapers yet.</span>}
              {wallpapers.map((wallpaper, idx) => (
                <div key={wallpaper.url || idx} style={{ minWidth: 120, maxWidth: 160, flex: '1 1 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      position: 'relative',
                      width: 110,
                      height: 70,
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: selectedWallpaper && selectedWallpaper.url === wallpaper.url ? '2.5px solid #0099ff' : '1.5px solid #ccc',
                      background: '#fff',
                      cursor: 'pointer',
                      boxShadow: selectedWallpaper && selectedWallpaper.url === wallpaper.url ? '0 0 0 2px #b0e0ff' : '0 2px 8px #0001',
                      transition: 'border 0.2s, box-shadow 0.2s, transform 0.18s cubic-bezier(.4,1.3,.5,1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 2,
                    }}
                    tabIndex={0}
                    aria-label={`Select wallpaper ${wallpaper.name}`}
                    onClick={() => setSelectedWallpaper(wallpaper)}
                    onKeyDown={e => { if (e.key === 'Enter') setSelectedWallpaper(wallpaper); }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <img
                      src={wallpaper.url}
                      alt={wallpaper.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                    />
                    {/* Like button */}
                    <button
                      className="wallpaper-action-btn like-btn"
                      style={{
                        position: 'absolute',
                        top: 7,
                        left: 7,
                        background: likedWallpapers.includes(wallpaper.url) ? 'rgba(231,76,60,0.13)' : 'rgba(255,255,255,0.92)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        color: likedWallpapers.includes(wallpaper.url) ? '#e74c3c' : '#333',
                        zIndex: 2,
                        cursor: 'pointer',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
                        transition: 'color 0.2s, background 0.2s',
                      }}
                      title={likedWallpapers.includes(wallpaper.url) ? 'Unlike' : 'Like'}
                      aria-label={likedWallpapers.includes(wallpaper.url) ? 'Unlike wallpaper' : 'Like wallpaper'}
                      onClick={e => { e.stopPropagation(); handleLike(wallpaper.url); }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.18)'; e.currentTarget.style.color = '#e74c3c'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = likedWallpapers.includes(wallpaper.url) ? 'rgba(231,76,60,0.13)' : 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = likedWallpapers.includes(wallpaper.url) ? '#e74c3c' : '#333'; }}
                    >
                      {likedWallpapers.includes(wallpaper.url) ? '♥' : '♡'}
                    </button>
                    {/* Delete button */}
                    <button
                      className="wallpaper-action-btn delete-btn"
                      style={{
                        position: 'absolute',
                        top: 7,
                        right: 7,
                        background: 'rgba(255,255,255,0.92)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        color: '#222',
                        zIndex: 2,
                        cursor: 'pointer',
                        transition: 'background 0.2s, color 0.2s',
                      }}
                      title="Remove saved wallpaper"
                      aria-label="Remove saved wallpaper"
                      onClick={e => { e.stopPropagation(); handleDelete(wallpaper.url); }}
                      disabled={deleting[wallpaper.url]}
                      onMouseEnter={e => { e.currentTarget.style.background = '#888'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = '#222'; }}
                    >
                      {deleting[wallpaper.url] ? '⏳' : <span style={{ color: 'inherit' }}>🗑️</span>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Enable Cycling Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Enable Wallpaper Cycling</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={cycling}
              onChange={e => setCycling(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          When enabled, your wallpapers will automatically cycle through your liked wallpapers at the interval you set below.
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 16 }}>
            <span style={{ fontWeight: 500, minWidth: 120 }}>Time per wallpaper</span>
            <input
              type="number"
              min={2}
              max={600}
              value={cycleInterval}
              onChange={e => setCycleInterval(Number(e.target.value))}
              style={{ width: 70, fontSize: 15, padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', marginRight: 8 }}
            />
            <span style={{ color: '#666', fontSize: 15 }}>seconds</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
            <span style={{ fontWeight: 500, minWidth: 120 }}>Animation</span>
            <select
              value={cycleAnimation}
              onChange={e => setCycleAnimation(e.target.value)}
              style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc' }}
            >
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
            </select>
          </div>
          
          {/* Crossfade Animation Parameters */}
          {cycleAnimation === 'fade' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Crossfade Duration</span>
                <input
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={crossfadeDuration}
                  onChange={e => setCrossfadeDuration(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: '#555' }}>{crossfadeDuration}s</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Easing Function</span>
                <select
                  value={crossfadeEasing}
                  onChange={e => setCrossfadeEasing(e.target.value)}
                  style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                >
                  <option value="ease-out">Ease Out (Smooth)</option>
                  <option value="ease-in">Ease In (Accelerate)</option>
                  <option value="ease-in-out">Ease In-Out (Smooth)</option>
                  <option value="linear">Linear (Constant)</option>
                </select>
              </div>
            </>
          )}
          
          {/* Slide Animation Parameters */}
          {cycleAnimation === 'slide' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Direction Mode</span>
                <select
                  value={slideRandomDirection ? 'random' : 'fixed'}
                  onChange={e => setSlideRandomDirection(e.target.value === 'random')}
                  style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                >
                  <option value="fixed">Fixed Direction</option>
                  <option value="random">Random Direction</option>
                </select>
              </div>
              
              {!slideRandomDirection && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                  <span style={{ fontWeight: 500, minWidth: 120 }}>Slide Direction</span>
                  <select
                    value={slideDirection}
                    onChange={e => setSlideDirection(e.target.value)}
                    style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="up">Up</option>
                    <option value="down">Down</option>
                  </select>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Slide Duration</span>
                <input
                  type="range"
                  min={0.8}
                  max={3.0}
                  step={0.1}
                  value={slideDuration}
                  onChange={e => setSlideDuration(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: '#555' }}>{slideDuration}s</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Easing Function</span>
                <select
                  value={slideEasing}
                  onChange={e => setSlideEasing(e.target.value)}
                  style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                >
                  <option value="ease-out">Ease Out (Smooth)</option>
                  <option value="ease-in">Ease In (Accelerate)</option>
                  <option value="ease-in-out">Ease In-Out (Smooth)</option>
                  <option value="linear">Linear (Constant)</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Wallpaper Transparency Slider */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Wallpaper Transparency</span>
        </div>
        <div className="wee-card-separator" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0 0 0' }}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={1 - wallpaperOpacity}
            onChange={e => setWallpaperOpacity(1 - Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: 38, fontWeight: 600, color: '#555' }}>{Math.round((1 - wallpaperOpacity) * 100)}%</span>
        </div>
        <div className="wee-card-desc">Higher transparency makes the wallpaper more see-through. 0% = fully visible, 100% = fully transparent.</div>
      </div>
      {/* Time Format Toggle Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Time Format</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose how the time is displayed on the homescreen.
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="timeFormat"
                checked={timeFormat24hr}
                onChange={() => setTimeFormat24hr(true)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 500 }}>24-Hour (14:30)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="timeFormat"
                checked={!timeFormat24hr}
                onChange={() => setTimeFormat24hr(false)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 500 }}>12-Hour (2:30 PM)</span>
            </label>
          </div>
        </div>
      </div>
      {/* Time Display Color Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Time Display Color</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose the color for the time and date display on the homescreen. This helps ensure the time is visible against different wallpapers.
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
            {[
              { color: '#ffffff', name: 'White', label: 'White' },
              { color: '#000000', name: 'Black', label: 'Black' },
              { color: '#808080', name: 'Gray', label: 'Gray' },
              { color: '#ffd700', name: 'Gold', label: 'Gold' }
            ].map((option) => (
              <button
                key={option.color}
                onClick={() => setTimeColor(option.color)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: timeColor === option.color ? '2px solid #0099ff' : '2px solid #e0e0e0',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.1s',
                  minWidth: 80,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: option.color,
                    border: option.color === '#ffffff' ? '1px solid #ccc' : 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Time Pill Configuration Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Time Pill</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={enableTimePill}
              onChange={e => setEnableTimePill(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Control the appearance of the time display pill on the homescreen. The pill provides a glass-like container around the time for better visibility.
          {enableTimePill && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 16 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Backdrop Blur</span>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={timePillBlur}
                  onChange={e => setTimePillBlur(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 30, fontWeight: 600, color: '#555' }}>{timePillBlur}px</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Background Opacity</span>
                <input
                  type="range"
                  min={0}
                  max={0.3}
                  step={0.01}
                  value={timePillOpacity}
                  onChange={e => setTimePillOpacity(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: '#555' }}>{Math.round(timePillOpacity * 100)}%</span>
              </div>
              <div style={{ fontSize: 14, color: '#666', marginTop: 12 }}>
                <strong>Backdrop Blur:</strong> Controls how much the background is blurred behind the pill. Lower values make it more see-through.<br/>
                <strong>Background Opacity:</strong> Controls the transparency of the pill's background. Lower values make it more transparent.
              </div>
            </>
          )}
        </div>
      </div>
      {/* Channel Auto-Fade Configuration Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Channel Auto-Fade</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Automatically lower the opacity of channel items when they haven't been hovered over for a while, allowing the wallpaper to shine through. Hovering over any channel will restore full opacity.
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 16 }}>
            <span style={{ fontWeight: 500, minWidth: 120 }}>Fade Timeout</span>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={channelAutoFadeTimeout}
              onChange={e => setChannelAutoFadeTimeout(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 40, fontWeight: 600, color: '#555' }}>{channelAutoFadeTimeout === 0 ? 'Off' : `${channelAutoFadeTimeout}s`}</span>
          </div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 12 }}>
            <strong>Fade Timeout:</strong> The time in seconds before channels start to fade out when not hovered. Set to 0 to disable auto-fade completely.
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

WallpaperModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export default WallpaperModal; 