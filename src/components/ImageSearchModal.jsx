import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import Card from '../ui/Card';

const THUMBNAILS_URL = 'https://raw.githubusercontent.com/ahoin001/wee-images-repo/main/thumbnails.json';
const CACHE_KEY = 'wii_images_cache';
const CACHE_TIMESTAMP_KEY = 'wii_images_cache_timestamp';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

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
  const [downloadSuccess, setDownloadSuccess] = useState({});
  const [cacheStatus, setCacheStatus] = useState(null); // 'cached' | 'fresh' | 'fallback' | null
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 items per page for better performance
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Cache management functions
  const getCachedData = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (!cachedData || !cacheTimestamp) {
        return null;
      }
      
      const now = Date.now();
      const cacheAge = now - parseInt(cacheTimestamp);
      
      // Check if cache is expired (older than 7 days)
      if (cacheAge > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        return null;
      }
      
      return JSON.parse(cachedData);
    } catch (error) {
      console.warn('[ImageCache] Error reading cache, will fetch fresh data:', error);
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
  };

  const setCachedData = (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('[ImageCache] Error caching data:', error);
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('[ImageCache] Error clearing cache:', error);
    }
  };

  // Fetch images function with caching
  const fetchImages = (forceRefresh = false) => {
    setRefreshing(true);
    setLoading(true);
    setError(null);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        setImages(cachedData);
        setCacheStatus('cached');
        setLoading(false);
        setRefreshing(false);
        return;
      }
    } else {
      // Clear cache when force refreshing
      clearCache();
    }

    // Fetch from network
    fetch(THUMBNAILS_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        
        // Cache the fresh data
        setCachedData(data);
        
        setImages(data);
        setCacheStatus('fresh');
        setLoading(false);
        setRefreshing(false);
      })
      .catch(err => {
        console.error('[ImageCache] Network fetch failed:', err);
        setError(`Failed to load images: ${err.message}`);
        setLoading(false);
        setRefreshing(false);
        
                 // Try to fall back to expired cache if network fails
         try {
           const fallbackCache = localStorage.getItem(CACHE_KEY);
           if (fallbackCache) {
             setImages(JSON.parse(fallbackCache));
             setCacheStatus('fallback');
             setError('Using cached data (network unavailable)');
           }
         } catch (fallbackError) {
           console.warn('[ImageCache] Fallback cache also failed:', fallbackError);
         }
      });
  };

  const handleDownload = async (img) => {
    // Prevent multiple simultaneous downloads
    if (itemLoading[img.url]) return;
    
    setItemLoading(prev => ({ ...prev, [img.url]: true }));
    
    try {
  
      
      // Fetch the file
      const response = await fetch(img.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Determine file extension based on format
      let extension = 'png';
      if (img.format === 'gif') extension = 'gif';
      else if (img.format === 'mp4') extension = 'mp4';
      else if (img.format === 'image') {
        // Try to get extension from URL or default to png
        const urlParts = img.url.split('.');
        const lastPart = urlParts[urlParts.length - 1].toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp'].includes(lastPart)) {
          extension = lastPart;
        }
      }
      
      // Clean filename and add extension
      const cleanName = img.name.replace(/[^\w\-_\. ]/g, '').trim();
      const filename = cleanName.includes('.') ? cleanName : `${cleanName}.${extension}`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      
      
      // Show success indicator
      setDownloadSuccess(prev => ({ ...prev, [img.url]: true }));
      setTimeout(() => {
        setDownloadSuccess(prev => ({ ...prev, [img.url]: false }));
      }, 2000);
      
    } catch (error) {
      console.error('Download failed for:', img.name, error);
      
      // Show error notification (you could replace this with a better notification system)
      if (window.confirm) {
        setTimeout(() => {
          alert(`Download failed for "${img.name}". Please try again or download manually from the community site.`);
        }, 100);
      }
    } finally {
      setItemLoading(prev => ({ ...prev, [img.url]: false }));
    }
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageImages = filteredImages.slice(startIndex, endIndex);

  // Reset to page 1 when search/filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

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
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
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
        💡 <strong>Tip:</strong> Click the "DL" button next to any image to download it to your device first, then use "Upload Your Own" for better reliability.
        <br />
        Direct usage from here works but may be less reliable due to free hosting limitations.
        {cacheStatus && (
          <>
            <br />
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              {cacheStatus === 'cached' && '📦 Using cached data (updates weekly)'}
              {cacheStatus === 'fresh' && '🔄 Fresh data loaded from network'}
              {cacheStatus === 'fallback' && '⚠️ Using offline cache (network unavailable)'}
            </span>
          </>
        )}
        <br />
         <a 
          href="https://graceful-cannoli-0197f9.netlify.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#0099ff', 
            textDecoration: 'underline',
            fontWeight: 500
          }}
        >
          Visit the community site
        </a> to upload your own assets or browse more collections.
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
                onClick={() => fetchImages(true)}
                title="Refresh images (clears cache)"
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
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fetchImages(true); }}
                onMouseDown={e => e.preventDefault()}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: refreshing ? 0.5 : 1, transition: 'opacity 0.2s', transform: refreshing ? 'rotate(360deg)' : 'none', transitionProperty: 'opacity, transform', transitionDuration: '0.2s, 0.7s' }}>
                  <path d="M11 3a8 8 0 1 1-7.95 8.7" stroke="#0099ff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 3v5h5" stroke="#0099ff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {/* Filter buttons and view toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
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
              
              {/* View mode toggle */}
              <div style={{ display: 'flex', gap: 4, background: '#f0f0f0', borderRadius: 6, padding: 2 }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: 4,
                    background: viewMode === 'grid' ? '#646cff' : 'transparent',
                    color: viewMode === 'grid' ? 'white' : '#666',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: 4,
                    background: viewMode === 'list' ? '#646cff' : 'transparent',
                    color: viewMode === 'list' ? 'white' : '#666',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Results Grid Card */}
      <Card style={{ marginTop: 18, marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontWeight: 600, fontSize: '1.1em' }}>Results</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            {filteredImages.length} items • Page {currentPage} of {totalPages}
          </div>
        </div>
        <div style={{ height: 1, background: '#e0e0e6', margin: '10px 0' }} />
        <div style={{ color: '#555', fontSize: '0.97em', marginBottom: 10 }}>
          Browse and select an image or video below. Showing {itemsPerPage} items per page for better performance.
        </div>
        <div style={{ marginTop: 14 }}>
          {/* Results UI here */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#333' }}>Loading...</div>
          ) : error ? (
            <div style={{ color: 'red', textAlign: 'center', padding: 32 }}>{error}</div>
          ) : currentPageImages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 32 }}>
              {filteredImages.length === 0 ? 'No images found.' : 'No items on this page.'}
            </div>
          ) : (
            <>
              {/* Pagination Controls - Top */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      background: currentPage === 1 ? '#f5f5f5' : '#fff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      color: currentPage === 1 ? '#999' : '#333'
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <span style={{ fontSize: 14, color: '#666', padding: '0 12px' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      color: currentPage === totalPages ? '#999' : '#333'
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Results Content */}
              {viewMode === 'grid' ? (
                <GridView images={currentPageImages} onSelect={onSelect} onDownload={handleDownload} 
                         itemLoading={itemLoading} downloadSuccess={downloadSuccess} />
              ) : (
                <ListView images={currentPageImages} onSelect={onSelect} onDownload={handleDownload} 
                         itemLoading={itemLoading} downloadSuccess={downloadSuccess} />
              )}

              {/* Pagination Controls - Bottom */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      background: currentPage === 1 ? '#f5f5f5' : '#fff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      color: currentPage === 1 ? '#999' : '#333'
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <span style={{ fontSize: 14, color: '#666', padding: '0 12px' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      color: currentPage === totalPages ? '#999' : '#333'
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
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

// Grid View Component for better performance
const GridView = ({ images, onSelect, onDownload, itemLoading, downloadSuccess }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 18,
  }}>
    {images.map(img => (
      <ImageItem
        key={img.url}
        img={img}
        onSelect={onSelect}
        onDownload={onDownload}
        itemLoading={itemLoading}
        downloadSuccess={downloadSuccess}
        viewMode="grid"
      />
    ))}
  </div>
);

// List View Component for compact browsing
const ListView = ({ images, onSelect, onDownload, itemLoading, downloadSuccess }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {images.map(img => (
      <ImageItem
        key={img.url}
        img={img}
        onSelect={onSelect}
        onDownload={onDownload}
        itemLoading={itemLoading}
        downloadSuccess={downloadSuccess}
        viewMode="list"
      />
    ))}
  </div>
);

// Reusable Image Item Component
const ImageItem = ({ img, onSelect, onDownload, itemLoading, downloadSuccess, viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: '#fff',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onClick={() => onSelect(img)}
      onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
      >
        <div style={{
          width: 60,
          height: 40,
          borderRadius: 4,
          overflow: 'hidden',
          background: '#e9eff3',
          position: 'relative',
          flexShrink: 0
        }}>
          {img.format === 'mp4' ? (
            <video src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
          ) : (
            <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {img.format === 'gif' && (
            <span style={{ position: 'absolute', top: 2, right: 2, background: '#fff', color: '#222', fontSize: 8, borderRadius: 2, padding: '1px 3px', fontWeight: 600 }}>GIF</span>
          )}
          {img.format === 'mp4' && (
            <span style={{ position: 'absolute', top: 2, right: 2, background: '#fff', color: '#222', fontSize: 8, borderRadius: 2, padding: '1px 3px', fontWeight: 600 }}>MP4</span>
          )}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {img.name}
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            {img.format?.toUpperCase() || 'IMAGE'}
          </div>
        </div>
        
        <DownloadButton img={img} onDownload={onDownload} itemLoading={itemLoading} downloadSuccess={downloadSuccess} size="small" />
      </div>
    );
  }

  // Grid view (original layout)
  return (
    <div style={{ padding: 12, boxSizing: 'border-box', position: 'relative' }}>
      <div
        onClick={() => onSelect(img)}
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
          e.currentTarget.style.transform = 'scale(1.05)';
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
      <div style={{ 
        marginTop: 8, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 8
      }}>
        <div style={{ 
          fontSize: 13, 
          color: '#333', 
          fontWeight: 500,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {img.name}
        </div>
        <DownloadButton img={img} onDownload={onDownload} itemLoading={itemLoading} downloadSuccess={downloadSuccess} />
      </div>
    </div>
  );
};

// Reusable Download Button Component
const DownloadButton = ({ img, onDownload, itemLoading, downloadSuccess, size = 'normal' }) => {
  const isSmall = size === 'small';
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDownload(img);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      title={`Download ${img.name}`}
      style={{
        background: downloadSuccess[img.url] ? '#28a745' : '#0099ff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: isSmall ? '3px 6px' : '4px 8px',
        fontSize: isSmall ? '10px' : '11px',
        fontWeight: '500',
        cursor: itemLoading[img.url] ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'background 0.2s',
        flexShrink: 0,
        opacity: itemLoading[img.url] ? 0.7 : 1
      }}
      onMouseEnter={(e) => {
        if (!itemLoading[img.url] && !downloadSuccess[img.url]) {
          e.currentTarget.style.background = '#0077cc';
        }
      }}
      onMouseLeave={(e) => {
        if (!downloadSuccess[img.url]) {
          e.currentTarget.style.background = '#0099ff';
        }
      }}
      disabled={itemLoading[img.url]}
    >
      {itemLoading[img.url] ? (
        <svg width={isSmall ? "10" : "12"} height={isSmall ? "10" : "12"} viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      ) : downloadSuccess[img.url] ? (
        <>
          <svg width={isSmall ? "10" : "12"} height={isSmall ? "10" : "12"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          ✓
        </>
      ) : (
        <>
          <svg width={isSmall ? "10" : "12"} height={isSmall ? "10" : "12"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {!isSmall && 'DL'}
        </>
      )}
    </button>
  );
};

ImageSearchModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func,
};

export default ImageSearchModal; 