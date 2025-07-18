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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [fadeState, setFadeState] = useState('fade-in');
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [wallpaperOpacity, setWallpaperOpacity] = useState(1);

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
      setWallpaperOpacity(typeof data.wallpaperOpacity === 'number' ? data.wallpaperOpacity : 1);
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
      if (selectedWallpaper) {
        await api.setActive({ url: selectedWallpaper.url });
      }
      await api.setCyclingSettings({
        enabled: cycling,
        interval: cycleInterval,
        animation: cycleAnimation,
      });
      // Save opacity
      let data = await api.get();
      data.wallpaperOpacity = wallpaperOpacity;
      await api.set(data);
      setMessage({ type: 'success', text: 'Wallpaper and settings saved.' });
      await loadWallpapers();
      // Immediately update app background
      if (onSettingsChange) onSettingsChange();
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
              <option value="carousel">Carousel</option>
              <option value="none">None</option>
            </select>
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