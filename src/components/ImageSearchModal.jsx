import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import Card from '../ui/Card';

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
  const [itemLoading, setItemLoading] = useState({});

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
  // Helper spinner
  const Spinner = () => (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(245,247,250,0.85)',
      zIndex: 2,
    }}>
      <div style={{ width: 32, height: 32, display: 'inline-block' }}>
        <svg viewBox="0 0 50 50" style={{ width: 32, height: 32 }}>
          <circle cx="25" cy="25" r="20" fill="none" stroke="#0099ff" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  );

  return (
    <BaseModal title="Search for Channel Image" onClose={onClose} maxWidth="900px">
      {/* Performance Notice */}
      <div style={{ 
        marginBottom: 18, 
        padding: 12, 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: 8, 
        color: '#856404',
        fontSize: 14,
        lineHeight: 1.4
      }}>
        Fetching all the assets can be slow since a free service is used to host them.<br />
        Uploading your own assets or <a 
          href="https://graceful-cannoli-0197f9.netlify.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#0099ff', 
            textDecoration: 'underline',
            fontWeight: 500
          }}
        >
          downloading them from here
        </a> can be quicker.
      </div>
      {/* Search Bar Card */}
      <div className="wee-card" style={{ marginTop: 0, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Search Images & Videos</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Search for images, GIFs, or MP4s to use as your channel art.
          <div style={{ marginTop: 14 }}>
            {/* Search bar UI here */}
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
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
        </div>
      </div>
      {/* Results Grid Card */}
      <Card style={{ marginTop: 18, marginBottom: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '1.1em', marginBottom: 6 }}>Results</div>
        <div style={{ height: 1, background: '#e0e0e6', margin: '10px 0' }} />
        <div style={{ color: '#555', fontSize: '0.97em', marginBottom: 10 }}>Browse and select an image or video below.</div>
        <div style={{ marginTop: 14 }}>
          {/* Results grid UI here */}
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
                  <div key={img.url} style={{ padding: 12, boxSizing: 'border-box', position: 'relative' }}>
                    <div
                      onClick={() => onSelect(img)}
                      onContextMenu={e => {
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
                        cursor: 'pointer',
                        background: '#e9eff3',
                        position: 'relative',
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
                      {img.format === 'mp4' ? (
                        <video src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay loop muted />
                      ) : (
                        <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      {img.format === 'gif' && (
                        <span style={{ position: 'absolute', top: 6, right: 8, background: '#fff', color: '#222', fontSize: 11, borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>GIF</span>
                      )}
                      {img.format === 'mp4' && (
                        <span style={{ position: 'absolute', top: 6, right: 8, background: '#fff', color: '#222', fontSize: 11, borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>MP4</span>
                      )}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: '#333', textAlign: 'center', fontWeight: 500 }}>{img.name}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
      {/* Upload Button/Section Card */}
      <div className="wee-card" style={{ marginTop: 18, marginBottom: 0 }}>
        <div className="wee-card-header">
          <span className="wee-card-title">Upload Your Own</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Upload an image, GIF, or MP4 from your computer.
          <div style={{ marginTop: 14 }}>
            {/* Upload button/section UI here */}
            <button
              onClick={() => {
                if (onUploadClick) onUploadClick();
                onClose();
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: '1px solid #646cff',
                background: '#646cff',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1em',
              }}
            >
              Choose File
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

ImageSearchModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func,
};

export default ImageSearchModal; 