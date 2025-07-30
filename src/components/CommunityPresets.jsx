import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';
import Text from '../ui/Text';
import Button from '../ui/Button';
import ImageModal from './ImageModal';
import { getSharedPresets, downloadPreset } from '../utils/supabase';

const CommunityPresets = ({ onImportPreset, onClose }) => {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [downloading, setDownloading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    loadPresets();
  }, [searchTerm, sortBy]);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const result = await getSharedPresets(searchTerm, sortBy);
      
      if (result.success) {
        setPresets(result.data);
      } else {
        if (result.error === 'Supabase not configured') {
          setMessage({ type: 'error', text: 'Community features are not configured. Please check your environment variables.' });
        } else {
          setMessage({ type: 'error', text: `Failed to load presets: ${result.error}` });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error loading presets: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (preset) => {
    try {
      setDownloading(preset.id);
      setMessage({ type: '', text: '' });

      const result = await downloadPreset(preset);
      
      if (result.success) {
        // Import the preset
        onImportPreset([result.data]);
        setMessage({ type: 'success', text: 'Preset downloaded and installed!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: `Failed to download: ${result.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Download failed: ${error.message}` });
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };



  const handleImageClick = (imageUrl, title) => {
    setSelectedImage({ url: imageUrl, title });
    setImageModalOpen(true);
  };

  return (
    <div style={{ padding: '20px' }}>
      {message.text && (
        <div style={{ 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '16px',
          background: message.type === 'success' ? 'hsl(var(--success-light))' : 'hsl(var(--error-light))',
          color: message.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--error))',
          border: `1px solid ${message.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--error))'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Community Guidelines Notice */}
      <div style={{ 
        padding: '12px', 
        borderRadius: '6px', 
        marginBottom: '16px',
        background: '#fff3cd',
        color: '#856404',
        border: '1px solid #ffeaa7',
        fontSize: '14px'
      }}>
        <strong>ℹ️ Community Guidelines:</strong> Anyone can delete any preset. Please be respectful and only delete content that violates community guidelines or is clearly inappropriate.
      </div>

      {/* Search and Sort Controls */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search presets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid hsl(var(--border-primary))',
                borderRadius: '6px',
                background: 'hsl(var(--surface-primary))',
                color: 'hsl(var(--text-primary))'
              }}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid hsl(var(--border-primary))',
              borderRadius: '6px',
              background: 'hsl(var(--surface-primary))',
              color: 'hsl(var(--text-primary))'
            }}
          >
            <option value="created_at">Newest First</option>
            <option value="downloads">Most Downloaded</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </Card>

      {/* Presets Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text>Loading community presets...</Text>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          maxWidth: '100%'
        }}>
          {presets.map((preset) => (
            <Card key={preset.id} style={{ padding: '12px', position: 'relative', minHeight: '200px' }}>
              {/* Image Section */}
              <div style={{ marginBottom: '8px' }}>
                {preset.thumbnail_url ? (
                  <div 
                    style={{ 
                      position: 'relative',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid hsl(var(--border-primary))'
                    }}
                    onClick={() => handleImageClick(
                      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/thumbnails/${preset.thumbnail_url}`,
                      preset.name
                    )}
                  >
                    <img 
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/thumbnails/${preset.thumbnail_url}`}
                      alt="Preset thumbnail"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      Click to view
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '120px',
                    background: 'hsl(var(--surface-secondary))',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid hsl(var(--border-primary))'
                  }}>
                    <Text variant="small" style={{ fontSize: '36px' }}>🎨</Text>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div style={{ marginBottom: '8px' }}>
                <Text variant="p" style={{ fontWeight: 600, marginBottom: '2px', fontSize: '14px' }}>
                  {preset.name}
                </Text>
                <Text variant="small" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '4px', fontSize: '12px' }}>
                  by {preset.creator_name || 'Anonymous'}
                </Text>
                {preset.description && (
                  <Text variant="small" style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.3', fontSize: '11px' }}>
                    {preset.description}
                  </Text>
                )}
              </div>

              {/* Stats and Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Text variant="small" style={{ color: 'hsl(var(--text-secondary))', fontSize: '11px' }}>
                    ⬇️ {preset.downloads || 0}
                  </Text>
                  <Text variant="small" style={{ color: 'hsl(var(--text-secondary))', fontSize: '11px' }}>
                    📅 {formatDate(preset.created_at)}
                  </Text>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button 
                    variant="primary"
                    onClick={() => handleDownload(preset)}
                    disabled={downloading === preset.id}
                    size="sm"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    {downloading === preset.id ? 'Downloading...' : 'Download'}
                  </Button>
                                      <button
                      className="delete-btn"
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete "${preset.name}"? This action cannot be undone.`)) {
                          try {
                            if (window.api && window.api.supabaseDelete) {
                              const result = await window.api.supabaseDelete({ presetId: preset.id });
                              if (result.success) {
                                // Remove the preset from local state instead of reloading
                                setPresets(prevPresets => prevPresets.filter(p => p.id !== preset.id));
                                setMessage({ type: 'success', text: `"${preset.name}" has been deleted successfully.` });
                                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                              } else {
                                setMessage({ type: 'error', text: 'Failed to delete preset: ' + (result.error || 'Unknown error') });
                              }
                            } else {
                              setMessage({ type: 'error', text: 'Delete functionality not available' });
                            }
                          } catch (error) {
                            setMessage({ type: 'error', text: 'Error deleting preset: ' + error.message });
                          }
                        }
                      }}
                      title="Delete this preset (anyone can delete any preset)"
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginLeft: '8px',
                        transition: 'background-color 0.2s ease',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#c82333';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#dc3545';
                      }}
                    >
                      🗑️ Delete
                    </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && presets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text>No community presets found.</Text>
          <Text variant="small" style={{ color: 'hsl(var(--text-secondary))', marginTop: '8px' }}>
            Be the first to share a preset!
          </Text>
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={selectedImage?.url}
        title={selectedImage?.title}
      />
    </div>
  );
};

CommunityPresets.propTypes = {
  onImportPreset: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CommunityPresets; 
 