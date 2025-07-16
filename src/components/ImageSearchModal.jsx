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

  useEffect(() => {
    if (mode === 'browse') {
      setLoading(true);
      fetch(THUMBNAILS_URL)
        .then(res => res.json())
        .then(data => {
          setImages(data);
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load images');
          setLoading(false);
        });
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
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="text"
          placeholder="Search by name or tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, fontSize: '1em', borderRadius: 6, border: '1px solid #ccc', color: '#222', background: '#fff', marginBottom: 0 }}
        />
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
              <div
                key={img.url}
                style={{
                  border: '1.5px solid #b0c4d8',
                  borderRadius: 10,
                  background: '#f7fafd',
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  color: '#222',
                }}
                onClick={() => onSelect(img)}
                tabIndex={0}
                title={img.name}
              >
                <div style={{ width: 200, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e9eff3', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                  {img.format === 'image' ? (
                    <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : img.format === 'gif' ? (
                    <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : img.format === 'mp4' ? (
                    <video src={img.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} autoPlay loop muted />
                  ) : null}
                </div>
                <div style={{ fontWeight: 500, fontSize: '1em', marginBottom: 2 }}>{img.name}</div>
                <div style={{ fontSize: '0.9em', color: '#555', textAlign: 'center' }}>{img.tags?.slice(0, 3).join(', ')}</div>
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