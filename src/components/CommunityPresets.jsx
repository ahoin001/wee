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
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [downloading, setDownloading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Get unique tags from all presets
  const allTags = [...new Set(presets.flatMap(preset => preset.tags || []))].sort();

  // Filter presets by search term and selected tag
  const filteredPresets = presets.filter(preset => {
    const matchesSearch = !searchTerm || 
      preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.creator_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || 
      (preset.tags && preset.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });

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

      const result = await downloadPreset(preset.id);
      
      if (result.success) {
        // Import the preset - result.data contains { name, settings, id, wallpaper }
        const presetData = result.data;
        
        console.log('[CommunityPresets] Downloaded preset data:', presetData);
        
        // Ensure the preset has required fields
        if (!presetData || !presetData.name || !presetData.settings) {
          throw new Error('Invalid preset data received');
        }
        
        // Create the import data structure
        const importData = {
          name: presetData.name,
          settings: presetData.settings,
          id: presetData.id,
          wallpaper: presetData.wallpaper
        };
        
        console.log('[CommunityPresets] Import data structure:', importData);
        
        onImportPreset([importData]);
        setMessage({ type: 'success', text: 'Preset downloaded and installed!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        
        // Refresh the presets list to update download counts
        await loadPresets();
      } else {
        setMessage({ type: 'error', text: `Failed to download: ${result.error}` });
      }
    } catch (error) {
      console.error('[CommunityPresets] Download error:', error);
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
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid hsl(var(--border-primary))',
              borderRadius: '6px',
              background: 'hsl(var(--surface-primary))',
              color: 'hsl(var(--text-primary))',
              minWidth: '120px'
            }}
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
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
          {filteredPresets.map((preset) => (
            <Card key={preset.id} style={{ padding: '12px', position: 'relative', minHeight: '200px' }}>
              {/* Image Section */}
              <div style={{ marginBottom: '8px' }}>
                {preset.display_image_url ? (
                  <div 
                    style={{ 
                      position: 'relative',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid hsl(var(--border-primary))'
                    }}
                    onClick={() => handleImageClick(
                      `https://bmlcydwltfexgbsyunkf.supabase.co/storage/v1/object/public/preset-displays/${preset.display_image_url}`,
                      preset.name
                    )}
                  >
                    <img 
                      src={`https://bmlcydwltfexgbsyunkf.supabase.co/storage/v1/object/public/preset-displays/${preset.display_image_url}`}
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
                <br />
                {preset.description && (
                  <Text variant="small" style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.3', fontSize: '11px' }}>
                    {preset.description}
                  </Text>
                )}
                
                {/* Tags Section */}
                {preset.tags && preset.tags.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {preset.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          background: 'hsl(var(--primary))',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          opacity: selectedTag === tag ? 1 : 0.7
                        }}
                        onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                        title={`Filter by ${tag}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
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
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredPresets.length === 0 && (
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
 