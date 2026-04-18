import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import Button from '../../ui/WButton';
import { ImageModal } from '../modals';
import { getSharedPresets, downloadPreset, getStoragePublicObjectUrl } from '../../utils/supabase';
import './community-presets.css';

const CommunityPresets = ({ onImportPreset, onClose: _onClose }) => {
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
    <div className="community-presets-root">
      {message.text && (
        <div
          className={`community-msg ${
            message.type === 'success' ? 'community-msg--success' : 'community-msg--error'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search and Sort Controls */}
      <Card className="mb-4">
        <div className="community-toolbar">
          <div className="community-search-grow">
            <input
              type="text"
              placeholder="Search presets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="community-input"
            />
          </div>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="community-select community-select--tags"
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="community-select"
          >
            <option value="created_at">Newest First</option>
            <option value="downloads">Most Downloaded</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </Card>

      {/* Presets Grid */}
      {loading ? (
        <div className="community-center-pad">
          <Text>Loading community presets...</Text>
        </div>
      ) : (
        <div className="community-grid">
          {filteredPresets.map((preset) => (
            <Card key={preset.id} className="community-preset-card">
              {/* Image Section */}
              <div className="community-mb-8">
                {preset.display_image_url ? (
                  <div 
                    className="community-thumb-wrap"
                    onClick={() => handleImageClick(
                      getStoragePublicObjectUrl('preset-displays', preset.display_image_url),
                      preset.name
                    )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleImageClick(
                          getStoragePublicObjectUrl('preset-displays', preset.display_image_url),
                          preset.name
                        );
                      }
                    }}
                  >
                    <img 
                      src={getStoragePublicObjectUrl('preset-displays', preset.display_image_url)}
                      alt="Preset thumbnail"
                    />
                    <div className="community-thumb-badge">
                      Click to view
                    </div>
                  </div>
                ) : (
                  <div className="community-placeholder">
                    <span className="community-placeholder-emoji" aria-hidden>🎨</span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="community-mb-8">
                <Text variant="p" className="community-preset-title">
                  {preset.name}
                </Text>
                <Text variant="small" className="community-preset-meta">
                  by {preset.creator_name || 'Anonymous'}
                </Text>
                <br />
                {preset.description && (
                  <Text variant="small" className="community-preset-desc">
                    {preset.description}
                  </Text>
                )}
                
                {/* Tags Section */}
                {preset.tags && preset.tags.length > 0 && (
                  <div className="community-tags">
                    {preset.tags.map(tag => (
                      <span
                        key={tag}
                        className={`community-tag ${selectedTag === tag ? '' : 'community-tag--dim'}`}
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
              <div className="community-footer-row">
                <div className="community-stat-group">
                  <Text variant="small" className="community-stat">
                    ⬇️ {preset.downloads || 0}
                  </Text>
                  <Text variant="small" className="community-stat">
                    📅 {formatDate(preset.created_at)}
                  </Text>
                </div>
                <div className="community-actions">
                  <Button 
                    variant="primary"
                    onClick={() => handleDownload(preset)}
                    disabled={downloading === preset.id}
                    size="sm"
                    className="community-btn-download"
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
        <div className="community-center-pad">
          <Text>No community presets found.</Text>
          <Text variant="small" className="community-empty-sub">
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
 
