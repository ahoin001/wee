import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

const THUMBNAILS_URL = 'https://raw.githubusercontent.com/ahoin001/wee-images-repo/main/thumbnails.json';

const FILETYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'PNG', value: 'image' },
  { label: 'GIF', value: 'gif' },
  { label: 'MP4', value: 'mp4' },
];

function ImageSearchModal({ onClose, onSelect, onUploadClick }) {
  const [images, setImages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null); // null | 'browse' | 'upload'
  const [propertiesImg, setPropertiesImg] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, img: null });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch images function
  const fetchImages = () => {
    setRefreshing(true);
    setLoading(true);
    fetch(THUMBNAILS_URL)
      .then(res => {
        console.log('Fetched thumbnails.json response:', res);
        return res.json();
      })
      .then(data => {
        console.log('Fetched thumbnails.json data:', data);
        setImages(data);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(err => {
        console.error('Failed to load images:', err);
        setError('Failed to load images');
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    if (mode === 'browse') {
      fetchImages();
    }
  }, [mode]);

  const filteredImages = images.filter(img => {
    if (filter !== 'all') {
      if (filter === 'image' && img.format !== 'image') return false;
      if (filter === 'gif' && img.format !== 'gif') return false;
      if (filter === 'mp4' && img.format !== 'mp4') return false;
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      return (
        img.name.toLowerCase().includes(s) ||
        (img.tags && img.tags.some(tag => tag.toLowerCase().includes(s)))
      );
    }
    return true;
  });

  // Option cards for initial choice
  if (!mode) {
    return (
      <BaseModal title="Choose Image Source" onClose={onClose} maxWidth="500px">
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 24 }}>
          <div
            style={{
              flex: 1,
              background: '#f7fafd',
              border: '2px solid #b0c4d8',
              borderRadius: 12,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, border-color 0.2s',
              color: '#222',
            }}
            onClick={() => setMode('browse')}
            tabIndex={0}
          >
            <span style={{ fontSize: 38, marginBottom: 10 }}>🔍</span>
            <div style={{ fontWeight: 600, fontSize: '1.1em', marginBottom: 6 }}>Browse Built-in Images</div>
            <div style={{ fontSize: '0.97em', color: '#555', textAlign: 'center' }}>Search and filter from a curated library of icons, GIFs, and videos.</div>
          </div>
          <div
            style={{
              flex: 1,
              background: '#fafbfc',
              border: '2px solid #b0c4d8',
              borderRadius: 12,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, border-color 0.2s',
              color: '#222',
            }}
            onClick={() => {
              setMode('upload');
              if (onUploadClick) onUploadClick();
              onClose();
            }}
            tabIndex={0}
          >
            <span style={{ fontSize: 38, marginBottom: 10 }}>⬆️</span>
            <div style={{ fontWeight: 600, fontSize: '1.1em', marginBottom: 6 }}>Upload Your Own</div>
            <div style={{ fontSize: '0.97em', color: '#555', textAlign: 'center' }}>Choose a custom image, GIF, or video from your device.</div>
          </div>
        </div>
      </BaseModal>
    );
  }

  // Browse mode UI
  return (
    <BaseModal title="Browse Built-in Images" onClose={onClose} maxWidth="900px">
      {/* Properties Modal */}
      {propertiesImg && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setPropertiesImg(null)}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, minWidth: 320, boxShadow: '0 8px 32px #0002', position: 'relative', color: '#222' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#222' }}>Image Properties</h3>
            <div style={{ marginBottom: 10, color: '#222' }}><b>Name:</b> {propertiesImg.name}</div>
            <div style={{ marginBottom: 10, color: '#222' }}><b>URL:</b> <span style={{ wordBreak: 'break-all', color: '#222' }}>{propertiesImg.url}</span></div>
            <button style={{ marginTop: 10 }} onClick={() => setPropertiesImg(null)}>Close</button>
          </div>
        </div>
      )}
      {/* Custom Context Menu */}
      {contextMenu.visible && (
        <div style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          background: '#fff',
          border: '1.5px solid #b0c4d8',
          borderRadius: 8,
          boxShadow: '0 4px 16px #0002',
          zIndex: 10002,
          minWidth: 120,
        }}
          onClick={() => setContextMenu({ ...contextMenu, visible: false })}
        >
          <div
            style={{ padding: '10px 18px', cursor: 'pointer', fontWeight: 500, color: '#222' }}
            onClick={() => {
              setPropertiesImg(contextMenu.img);
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            Properties
          </div>
        </div>
      )}
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text"
            placeholder="Search by name or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: 8, fontSize: '1em', borderRadius: 6, border: '1px solid #ccc', color: '#222', background: '#fff', marginBottom: 0, flex: 1 }}
          />
          <button
            onClick={fetchImages}
            title="Refresh images"
            aria-label="Refresh images"
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              marginLeft: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              transition: 'background 0.2s',
              outline: 'none',
              boxShadow: refreshing ? '0 0 0 2px #0099ff55' : 'none',
            }}
            disabled={refreshing}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fetchImages(); }}
            onMouseDown={e => e.preventDefault()}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: refreshing ? 0.5 : 1, transition: 'opacity 0.2s', transform: refreshing ? 'rotate(360deg)' : 'none', transitionProperty: 'opacity, transform', transitionDuration: '0.2s, 0.7s' }}>
              <path d="M11 3a8 8 0 1 1-7.95 8.7" stroke="#0099ff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 3v5h5" stroke="#0099ff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, marginBottom: 0 }}>
          {FILETYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: filter === opt.value ? '2px solid #646cff' : '1px solid #ccc',
                background: filter === opt.value ? '#e6eaff' : '#f9f9f9',
                fontWeight: filter === opt.value ? 'bold' : 'normal',
                color: '#222',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#333' }}>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center', padding: 32 }}>{error}</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 18,
          maxHeight: 480,
          overflowY: 'auto',
        }}>
          {filteredImages.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888' }}>No images found.</div>
          ) : (
            filteredImages.map(img => (
              <div key={img.url} style={{ padding: 12, boxSizing: 'border-box' }}>
                <div
                  onClick={() => onSelect(img)}
                  onContextMenu={e => {
                    e.preventDefault();
                    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, img });
                  }}
                  style={{
                    width: 200,
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    overflow: 'hidden',
                    transition: 'transform 0.18s cubic-bezier(.4,1.3,.5,1), box-shadow 0.18s cubic-bezier(.4,1.3,.5,1)',
                    // boxShadow: '0 0 0 0 rgba(0,153,255,0)',
                    cursor: 'pointer',
                    // background: '#e9eff3',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 0 24px 4px #0099ff33';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 0 0 rgba(0,153,255,0)';
                  }}
                >
                  {img.format === 'image' ? (
                    <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : img.format === 'gif' ? (
                    <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : img.format === 'mp4' ? (
                    <video src={img.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} autoPlay loop muted />
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </BaseModal>
  );
}

ImageSearchModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func,
};

export default ImageSearchModal; 