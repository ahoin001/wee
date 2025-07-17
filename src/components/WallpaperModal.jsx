import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import { FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';

const DEFAULT_ANIMATIONS = [
  { label: 'Fade', value: 'fade' },
  { label: 'Carousel', value: 'carousel' },
  { label: 'None', value: 'none' },
];

function WallpaperModal({ onClose, onSettingsChange, currentWallpaper, currentOpacity = 1, savedWallpapers = [], likedWallpapers = [], cycleWallpapers = false, cycleInterval = 30, cycleAnimation = 'fade' }) {
  // State for current wallpaper selection
  const [wallpaper, setWallpaper] = useState(currentWallpaper || null);
  const [wallpaperUrl, setWallpaperUrl] = useState('');
  const [opacity, setOpacity] = useState(currentOpacity);
  const [saved, setSaved] = useState(savedWallpapers);
  const [liked, setLiked] = useState(likedWallpapers);
  const [isCycling, setIsCycling] = useState(cycleWallpapers);
  const [interval, setIntervalSec] = useState(cycleInterval);
  const [animation, setAnimation] = useState(cycleAnimation);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef();

  // If currentWallpaper changes, update state
  useEffect(() => {
    if (currentWallpaper) setWallpaper(currentWallpaper);
    setOpacity(currentOpacity);
  }, [currentWallpaper, currentOpacity]);

  // Save wallpaper to saved list
  const handleSaveWallpaper = () => {
    if (wallpaper && wallpaper.url && !saved.some(w => w.url === wallpaper.url)) {
      setSaved(prev => [...prev, wallpaper]);
      setMessage({ type: 'success', text: 'Wallpaper saved!' });
    } else {
      setMessage({ type: 'info', text: 'Wallpaper already saved.' });
    }
  };

  // Like/unlike a wallpaper
  const handleToggleLike = (url) => {
    setLiked(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
    setMessage({ type: 'info', text: prev.includes(url) ? 'Wallpaper unliked.' : 'Wallpaper liked!' });
  };

  // Select a saved wallpaper
  const handleSelectSaved = (w) => {
    setWallpaper(w);
    setWallpaperUrl('');
    setMessage({ type: 'info', text: `Selected wallpaper: ${w.name}` });
  };

  // Remove a saved wallpaper
  const handleRemoveSaved = (url) => {
    setSaved(prev => prev.filter(w => w.url !== url));
    setLiked(prev => prev.filter(u => u !== url));
    if (wallpaper && wallpaper.url === url) setWallpaper(null);
    setMessage({ type: 'success', text: 'Wallpaper removed.' });
  };

  // Remove current wallpaper
  const handleRemoveCurrent = () => {
    setWallpaper(null);
    setWallpaperUrl('');
    setMessage({ type: 'success', text: 'Current wallpaper removed.' });
  };

  // File upload
  const handleFileUpload = async () => {
    if (window.api && window.api.selectWallpaperFile) {
      // Use Electron dialog for file selection
      const fileResult = await window.api.selectWallpaperFile();
      if (!fileResult.success) {
        setMessage({ type: 'error', text: `Failed to select file: ${fileResult.error}` });
        return;
      }
      const file = fileResult.file;
      // Copy to user wallpapers directory
      if (window.api.copyWallpaperToUserDirectory) {
        const result = await window.api.copyWallpaperToUserDirectory({ filePath: file.path, filename: file.name });
        if (result.success) {
          setWallpaper({ url: result.url, name: file.name, type: file.name.split('.').pop() });
          setWallpaperUrl('');
          setMessage({ type: 'success', text: 'Wallpaper loaded and saved to user directory.' });
        } else {
          setMessage({ type: 'error', text: `Failed to save wallpaper: ${result.error}` });
        }
      }
      return;
    }
    // Fallback for browser/dev: use <input type='file'>
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (file) => {
    if (file) {
      // Fallback for browser/dev: use blob URL (not persistent)
      const url = URL.createObjectURL(file);
      setWallpaper({ url, name: file.name, type: file.type });
      setWallpaperUrl('');
      setMessage({ type: 'success', text: 'Wallpaper loaded from file (not persistent).' });
    }
  };

  // URL input
  const handleUrlChange = (e) => {
    setWallpaperUrl(e.target.value);
    setWallpaper({ url: e.target.value, name: e.target.value, type: 'url' });
    setMessage({ type: 'info', text: 'Wallpaper loaded from URL.' });
  };

  // Opacity
  const handleOpacityChange = (e) => {
    setOpacity(parseFloat(e.target.value));
  };

  // Cycle settings
  const handleCycleToggle = () => setIsCycling(v => !v);
  const handleIntervalChange = (e) => setIntervalSec(Number(e.target.value));
  const handleAnimationChange = (e) => setAnimation(e.target.value);

  // Save all settings
  const handleSave = async () => {
    let finalWallpaper = wallpaper;
    // If wallpaper is a blob: URL, try to persist it
    if (wallpaper && wallpaper.url && wallpaper.url.startsWith('blob:') && window.api && window.api.copyWallpaperToUserDirectory) {
      // Try to fetch the blob and save it
      try {
        const response = await fetch(wallpaper.url);
        const blob = await response.blob();
        const ext = wallpaper.name ? wallpaper.name.split('.').pop() : 'jpg';
        const filename = `wallpaper-${Date.now()}.${ext}`;
        // Save blob to temp file
        const arrayBuffer = await blob.arrayBuffer();
        const tempPath = window.api.saveTempFile ? await window.api.saveTempFile(arrayBuffer, filename) : null;
        if (tempPath) {
          const result = await window.api.copyWallpaperToUserDirectory({ filePath: tempPath, filename });
          if (result.success) {
            finalWallpaper = { url: result.url, name: filename, type: blob.type };
          }
        }
      } catch (e) { /* ignore */ }
    }
    const newSettings = {
      wallpaper: finalWallpaper,
      wallpaperOpacity: opacity,
      savedWallpapers: saved,
      likedWallpapers: liked,
      cycleWallpapers: isCycling,
      cycleInterval: interval,
      cycleAnimation: animation,
    };
    onSettingsChange(newSettings);
    if (window.api && window.api.saveSettings) {
      await window.api.saveSettings(newSettings);
    }
    setMessage({ type: 'success', text: 'Wallpaper settings saved!' });
    setTimeout(() => onClose(), 400); // Give user feedback before closing
  };

  // Get wallpapers to cycle through
  const cycleList = saved.filter(w => liked.includes(w.url));
  const nextWallpaper = isCycling && cycleList.length > 1 && wallpaper ? cycleList[(cycleList.findIndex(w => w.url === wallpaper.url) + 1) % cycleList.length] : null;

  // Footer content for modal
  const footerContent = (
    <>
      <button className="cancel-button" onClick={onClose} aria-label="Cancel and close wallpaper settings">Cancel</button>
      {wallpaper && wallpaper.url && (
        <button className="remove-button" style={{ marginLeft: 8, color: '#dc3545', border: '1.5px solid #dc3545', background: '#fff', fontWeight: 600 }} onClick={handleRemoveCurrent} aria-label="Remove current wallpaper">Remove Current</button>
      )}
      <button className="save-button" style={{ marginLeft: 8 }} onClick={handleSave} disabled={!wallpaper || !wallpaper.url} aria-label="Save wallpaper settings">Save</button>
    </>
  );

  // Message feedback
  const renderMessage = () => message.text && (
    <div className={`message ${message.type}`} style={{ marginBottom: 10, fontWeight: 500 }}>
      {message.text}
    </div>
  );

  return (
    <BaseModal title="Change Wallpaper" onClose={onClose} maxWidth="600px" footerContent={footerContent}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {renderMessage()}
        {/* Upload/URL */}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Upload Image</label>
            <button
              className="file-button"
              onClick={handleFileUpload}
              style={{ marginBottom: 8 }}
              aria-label="Upload Wallpaper"
              title="Upload Wallpaper from Device"
            >
              Upload from Device
            </button>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm,video/avi,video/mov,video/mkv"
              ref={fileInputRef}
              onChange={e => handleFileSelect(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Or Enter Image URL</label>
            <input
              type="text"
              placeholder="https://example.com/wallpaper.jpg"
              value={wallpaperUrl}
              onChange={handleUrlChange}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: '1em' }}
              aria-label="Enter wallpaper image URL"
              title="Enter wallpaper image URL"
            />
          </div>
        </div>
        {/* Opacity */}
        <div>
          <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Opacity: {Math.round(opacity * 100)}%</label>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={opacity}
            onChange={handleOpacityChange}
            style={{ width: '100%' }}
            aria-label="Wallpaper opacity"
            title="Wallpaper opacity"
          />
        </div>
        {/* Preview */}
        <div style={{ margin: '12px 0', minHeight: 120, border: '1px solid #e0e0e6', borderRadius: 8, background: '#f7f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {wallpaper && wallpaper.url ? (
            <img
              src={wallpaper.url}
              alt="Wallpaper preview"
              style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, opacity, transition: animation === 'fade' ? 'opacity 0.8s' : undefined }}
            />
          ) : (
            <span style={{ color: '#888' }}>No wallpaper selected</span>
          )}
          {isCycling && nextWallpaper && (
            <img
              src={nextWallpaper.url}
              alt="Next wallpaper preview"
              style={{ position: 'absolute', right: 12, bottom: 12, width: 60, height: 40, objectFit: 'cover', border: '2px solid #0099ff', borderRadius: 6, opacity: 0.7, background: '#fff' }}
            />
          )}
        </div>
        {/* Save/Like/Remove Saved Wallpapers */}
        <div>
          <button className="save-button" style={{ marginRight: 12 }} onClick={handleSaveWallpaper} disabled={!wallpaper || !wallpaper.url || saved.some(w => w.url === wallpaper.url)} aria-label="Save current wallpaper to list" title="Save current wallpaper to list">Save Wallpaper</button>
        </div>
        <div style={{ margin: '8px 0' }}>
          <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Saved Wallpapers</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 20,
            alignItems: 'center',
            justifyItems: 'center',
            minHeight: 80,
            background: '#f8f9fa',
            borderRadius: 8,
            padding: 12
          }}>
            {saved.length === 0 && <span style={{ color: '#888' }}>No saved wallpapers yet.</span>}
            {saved.map(w => (
              <div
                key={w.url}
                style={{
                  position: 'relative',
                  width: 120,
                  height: 80,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: wallpaper && wallpaper.url === w.url ? '2.5px solid #0099ff' : '1.5px solid #ccc',
                  background: '#fff',
                  cursor: 'pointer',
                  boxShadow: wallpaper && wallpaper.url === w.url ? '0 0 0 2px #b0e0ff' : '0 2px 8px #0001',
                  transition: 'border 0.2s, box-shadow 0.2s, transform 0.18s cubic-bezier(.4,1.3,.5,1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 2,
                }}
                tabIndex={0}
                aria-label={`Select wallpaper ${w.name}`}
                onClick={() => handleSelectSaved(w)}
                onKeyDown={e => { if (e.key === 'Enter') handleSelectSaved(w); }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <img src={w.url} alt={w.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                {/* Like button */}
                <button
                  style={{
                    position: 'absolute',
                    top: 7,
                    left: 7,
                    background: 'rgba(255,255,255,0.92)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: liked.includes(w.url) ? '#e74c3c' : '#333',
                    zIndex: 2,
                    cursor: 'pointer',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
                    transition: 'color 0.2s, background 0.2s',
                  }}
                  title={liked.includes(w.url) ? 'Unlike' : 'Like'}
                  aria-label={liked.includes(w.url) ? 'Unlike wallpaper' : 'Like wallpaper'}
                  onClick={e => { e.stopPropagation(); handleToggleLike(w.url); }}
                >
                  {liked.includes(w.url) ? <FaHeart style={{ fill: '#e74c3c', color: '#e74c3c' }} /> : <FaRegHeart style={{ color: '#333', fill: 'none' }} />}
                </button>
                {/* Remove button */}
                <button
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
                  }}
                  title="Remove saved wallpaper"
                  aria-label="Remove saved wallpaper"
                  onClick={e => { e.stopPropagation(); handleRemoveSaved(w.url); }}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Cycling Controls */}
        <div style={{ marginTop: 18 }}>
          <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Wallpaper Cycling</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={isCycling} onChange={handleCycleToggle} aria-label="Enable wallpaper cycling" /> Enable cycling
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Interval:
              <input type="number" min={2} max={600} value={interval} onChange={handleIntervalChange} style={{ width: 60 }} aria-label="Cycle interval (seconds)" /> sec
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Animation:
              <select value={animation} onChange={handleAnimationChange} aria-label="Cycle animation">
                {DEFAULT_ANIMATIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

WallpaperModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func.isRequired,
  currentWallpaper: PropTypes.object,
  currentOpacity: PropTypes.number,
  savedWallpapers: PropTypes.array,
  likedWallpapers: PropTypes.array,
  cycleWallpapers: PropTypes.bool,
  cycleInterval: PropTypes.number,
  cycleAnimation: PropTypes.string,
};

export default WallpaperModal; 