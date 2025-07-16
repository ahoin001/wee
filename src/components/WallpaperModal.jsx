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
    }
  };

  // Like/unlike a wallpaper
  const handleToggleLike = (url) => {
    setLiked(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
  };

  // Select a saved wallpaper
  const handleSelectSaved = (w) => {
    setWallpaper(w);
    setWallpaperUrl('');
  };

  // Remove a saved wallpaper
  const handleRemoveSaved = (url) => {
    setSaved(prev => prev.filter(w => w.url !== url));
    setLiked(prev => prev.filter(u => u !== url));
    if (wallpaper && wallpaper.url === url) setWallpaper(null);
  };

  // File upload
  const handleFileSelect = (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setWallpaper({ url, name: file.name, type: file.type });
      setWallpaperUrl('');
    }
  };

  // URL input
  const handleUrlChange = (e) => {
    setWallpaperUrl(e.target.value);
    setWallpaper({ url: e.target.value, name: e.target.value, type: 'url' });
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
  const handleSave = () => {
    onSettingsChange({
      wallpaper,
      wallpaperOpacity: opacity,
      savedWallpapers: saved,
      likedWallpapers: liked,
      cycleWallpapers: isCycling,
      cycleInterval: interval,
      cycleAnimation: animation,
    });
    onClose();
  };

  // Get wallpapers to cycle through
  const cycleList = saved.filter(w => liked.includes(w.url));
  const nextWallpaper = isCycling && cycleList.length > 1 && wallpaper ? cycleList[(cycleList.findIndex(w => w.url === wallpaper.url) + 1) % cycleList.length] : null;

  return (
    <BaseModal title="Change Wallpaper" onClose={onClose} maxWidth="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Upload/URL */}
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Upload Image</label>
            <button
              className="file-button"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: 8 }}
            >
              {wallpaper && wallpaper.type !== 'url' ? wallpaper.name : 'Choose File'}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={e => handleFileSelect(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Or Enter Image URL</label>
            <input
              type="text"
              placeholder="https://example.com/wallpaper.jpg"
              value={wallpaperUrl}
              onChange={handleUrlChange}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: '1em' }}
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
          <button className="save-button" style={{ marginRight: 12 }} onClick={handleSaveWallpaper} disabled={!wallpaper || !wallpaper.url || saved.some(w => w.url === wallpaper.url)}>Save Wallpaper</button>
        </div>
        <div style={{ margin: '8px 0' }}>
          <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Saved Wallpapers</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: 14,
            alignItems: 'center',
            justifyItems: 'center',
            minHeight: 60,
            background: '#f8f9fa',
            borderRadius: 8,
            padding: 8
          }}>
            {saved.length === 0 && <span style={{ color: '#888' }}>No saved wallpapers yet.</span>}
            {saved.map(w => (
              <div
                key={w.url}
                style={{
                  position: 'relative',
                  width: 80,
                  height: 50,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: wallpaper && wallpaper.url === w.url ? '2.5px solid #0099ff' : '1.5px solid #ccc',
                  background: '#fff',
                  cursor: 'pointer',
                  boxShadow: wallpaper && wallpaper.url === w.url ? '0 0 0 2px #b0e0ff' : 'none',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                tabIndex={0}
                aria-label={`Select wallpaper ${w.name}`}
                onClick={() => handleSelectSaved(w)}
                onKeyDown={e => { if (e.key === 'Enter') handleSelectSaved(w); }}
              >
                <img src={w.url} alt={w.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                {/* Like button */}
                <button
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    background: 'rgba(255,255,255,0.85)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    color: liked.includes(w.url) ? '#e74c3c' : '#bbb',
                    zIndex: 2,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'color 0.2s, background 0.2s',
                  }}
                  title={liked.includes(w.url) ? 'Unlike' : 'Like'}
                  aria-label={liked.includes(w.url) ? 'Unlike wallpaper' : 'Like wallpaper'}
                  onClick={e => { e.stopPropagation(); handleToggleLike(w.url); }}
                >
                  {liked.includes(w.url) ? <FaHeart /> : <FaRegHeart />}
                </button>
                {/* Remove button */}
                <button
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    background: 'rgba(255,255,255,0.85)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    color: '#888',
                    zIndex: 2,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'color 0.2s, background 0.2s',
                  }}
                  title="Remove wallpaper"
                  aria-label="Remove wallpaper"
                  onClick={e => { e.stopPropagation(); handleRemoveSaved(w.url); }}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Cycle Settings */}
        <div style={{ margin: '8px 0', padding: 12, border: '1px solid #e0e0e6', borderRadius: 8, background: '#f8f9fa' }}>
          <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
            <input type="checkbox" checked={isCycling} onChange={handleCycleToggle} style={{ marginRight: 8 }} />
            Cycle through liked wallpapers
          </label>
          {isCycling && (
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 8 }}>
              <div>
                <label style={{ fontWeight: 500 }}>Time per image (seconds):</label>
                <input type="number" min={5} max={600} value={interval} onChange={handleIntervalChange} style={{ width: 60, marginLeft: 8, borderRadius: 4, border: '1px solid #ccc', padding: 2 }} />
              </div>
              <div>
                <label style={{ fontWeight: 500 }}>Animation:</label>
                <select value={animation} onChange={handleAnimationChange} style={{ marginLeft: 8, borderRadius: 4, border: '1px solid #ccc', padding: 2 }}>
                  {DEFAULT_ANIMATIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginLeft: 12 }}>
                {cycleList.length} liked wallpaper{cycleList.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
        {/* Save/Cancel */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="save-button" onClick={handleSave} disabled={!wallpaper || !wallpaper.url}>Save</button>
        </div>
      </div>
    </BaseModal>
  );
}

WallpaperModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
  currentWallpaper: PropTypes.object,
  currentOpacity: PropTypes.number,
  savedWallpapers: PropTypes.array,
  likedWallpapers: PropTypes.array,
  cycleWallpapers: PropTypes.bool,
  cycleInterval: PropTypes.number,
  cycleAnimation: PropTypes.string,
};

export default WallpaperModal; 