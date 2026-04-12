import React, { useEffect, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Card from '../ui/Card';
import Button from '../ui/WButton';
import Text from '../ui/Text';
import { searchMedia, uploadMedia, downloadMedia, getStoragePublicObjectUrl } from '../utils/supabase';
import './surfaceStyles.css';

const FILETYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Images', value: 'image' },
  { label: 'GIFs', value: 'gif' },
  { label: 'Videos', value: 'video' },
];

const SORT_OPTIONS = [
  { label: 'Recently Added', value: 'created_at' },
  { label: 'Alphabetical (A-Z)', value: 'title_asc' },
  { label: 'Alphabetical (Z-A)', value: 'title_desc' },
  { label: 'Most Downloaded', value: 'downloads' },
];

function ImageSearchModal({ isOpen, onClose, onSelect, onUploadClick }) {
  const [media, setMedia] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at'); // Default to recently added
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('browse'); // 'browse' | 'upload'
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [itemLoading, setItemLoading] = useState({});
  const [downloadSuccess, setDownloadSuccess] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    tags: '',
    file: null
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [hasMore, setHasMore] = useState(true);

  // Fetch media from Supabase
  const fetchMedia = useCallback(async (page = 1, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        fileType: filter === 'all' ? null : filter,
        searchTerm: search.trim() || null,
        sortBy,
        page,
        limit: itemsPerPage
      };

      const result = await searchMedia(filters);
      
      if (result.success) {
        if (page === 1) {
          setMedia(result.data);
        } else {
          setMedia(prev => [...prev, ...result.data]);
        }
        setHasMore(result.data.length === itemsPerPage);
      } else {
        setError(result.error || 'Failed to load media');
      }
    } catch (error) {
      setError(`Error loading media: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filter, search, sortBy, itemsPerPage]);

  // Load more media (infinite scroll)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchMedia(nextPage);
    }
  }, [loading, hasMore, currentPage, fetchMedia]);

  // Handle search, filter, and sort changes
  useEffect(() => {
    setCurrentPage(1);
    setMedia([]); // Clear existing media when filters change
    fetchMedia(1, true);
  }, [fetchMedia]);

  // Initial load
  useEffect(() => {
    fetchMedia(1);
  }, [fetchMedia]);

  // Handle media selection
  const handleMediaSelect = useCallback((mediaItem) => {
    console.log('ImageSearchModal: handleMediaSelect called with:', mediaItem);
    console.log('ImageSearchModal: Calling onSelect with mediaItem');
    onSelect(mediaItem);
    onClose();
  }, [onSelect, onClose]);

  // Handle download
  const handleDownload = useCallback(async (mediaItem) => {
    try {
      setItemLoading(prev => ({ ...prev, [mediaItem.id]: true }));
      setDownloadSuccess(prev => ({ ...prev, [mediaItem.id]: false }));

      const result = await downloadMedia(mediaItem.id);
      
      if (result.success) {
        // Create download link
        const blob = new Blob([result.data], { type: mediaItem.mime_type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = mediaItem.title || `media-${mediaItem.id}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadSuccess(prev => ({ ...prev, [mediaItem.id]: true }));
        setTimeout(() => {
          setDownloadSuccess(prev => ({ ...prev, [mediaItem.id]: false }));
        }, 2000);
      } else {
        setError(`Download failed: ${result.error}`);
      }
    } catch (error) {
      setError(`Download error: ${error.message}`);
    } finally {
      setItemLoading(prev => ({ ...prev, [mediaItem.id]: false }));
    }
  }, []);

  // Performance optimization: Memoize media items to prevent unnecessary re-renders
  const memoizedMediaItems = useMemo(() => {
    return media.map((item) => (
      <MediaItem
        key={item.id}
        item={item}
        onSelect={handleMediaSelect}
        onDownload={handleDownload}
        itemLoading={itemLoading}
        downloadSuccess={downloadSuccess}
        viewMode={viewMode}
      />
    ));
  }, [media, itemLoading, downloadSuccess, viewMode, handleMediaSelect, handleDownload]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!uploadForm.file || !uploadForm.title.trim()) {
      setError('Please select a file and enter a title');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const metadata = {
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim(),
        tags: uploadForm.tags ? uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []
      };

      const result = await uploadMedia(uploadForm.file, metadata);
      
      if (result.success) {
        // Reset form and switch back to browse mode
        setUploadForm({ title: '', description: '', tags: '', file: null });
        setMode('browse');
        setError(null);
        
        // Refresh the media list
        fetchMedia(1, true);
      } else {
        setError(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      setError(`Upload error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, [uploadForm, fetchMedia]);

  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Determine file type
      let fileType = 'image';
      if (file.type.includes('gif')) fileType = 'gif';
      else if (file.type.includes('video')) fileType = 'video';
      
      setUploadForm(prev => ({
        ...prev,
        file,
        fileType
      }));
    }
  }, []);

  return (
    <WBaseModal
      isOpen={isOpen}
      title="Media Library"
      onClose={onClose}
      maxWidth="1400px"
      maxHeight="80vh"
      footerContent={null}
    >
      {error && (
        <div className="p-3 rounded-[6px] mb-4 bg-[hsl(var(--error-light))] text-[hsl(var(--error))] border border-[hsl(var(--error))]">
          {error}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="surface-actions mb-4">
        <Button
          variant={mode === 'browse' ? 'primary' : 'secondary'}
          onClick={() => setMode('browse')}
        >
          Browse Media
        </Button>
        <Button
          variant={mode === 'upload' ? 'primary' : 'secondary'}
          onClick={() => setMode('upload')}
        >
          Upload Media
        </Button>
      </div>

      {mode === 'browse' ? (
        <>
          {/* Search and Filter Controls */}
          <Card className="mb-4">
            <div className="surface-actions flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search media..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="surface-input"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="surface-select"
              >
                {FILETYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="surface-select"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? '📋' : '🔲'}
              </Button>
            </div>
          </Card>

          {/* Media Grid/List */}
          {loading && media.length === 0 ? (
            <div className="text-center p-10">
              <Text>Loading media...</Text>
            </div>
          ) : (
            <div style={{ 
              display: viewMode === 'grid' ? 'grid' : 'block',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'none',
              gap: '12px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {memoizedMediaItems}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !loading && (
            <div className="text-center mt-4">
              <Button variant="secondary" onClick={loadMore}>
                Load More ({media.length} of {media.length + (hasMore ? '...' : '')} items)
              </Button>
            </div>
          )}

          {/* Loading indicator for pagination */}
          {loading && currentPage > 1 && (
            <div className="text-center mt-4">
              <Text>Loading more items...</Text>
            </div>
          )}

          {!loading && media.length === 0 && (
            <div className="text-center p-10">
              <Text>No media found.</Text>
            </div>
          )}
        </>
      ) : (
        /* Upload Mode */
        <Card>
          <div className="p-4">
            <Text variant="label" className="mb-2">Title *</Text>
            <input
              type="text"
              value={uploadForm.title}
              onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter media title..."
              className="surface-input mb-3"
            />

            <Text variant="label" className="mb-2">Description</Text>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your media..."
              rows={3}
              className="surface-textarea mb-3"
            />

            <Text variant="label" className="mb-2">Tags</Text>
            <input
              type="text"
              value={uploadForm.tags}
              onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="gaming, dark theme, minimal, etc."
              className="surface-input mb-3"
            />

            <Text variant="label" className="mb-2">File *</Text>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="surface-input mb-4"
            />

            {uploadForm.file && (
              <div className="mb-4">
                <Text variant="small" className="text-secondary">
                  Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)
                </Text>
              </div>
            )}

            <div className="surface-actions justify-end">
              <Button
                variant="secondary"
                onClick={() => setMode('browse')}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={uploading || !uploadForm.file || !uploadForm.title.trim()}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </WBaseModal>
  );
}

// Media Item Component
const MediaItem = ({ item, onSelect, onDownload, itemLoading, downloadSuccess, viewMode }) => {
  const isVideo = item.file_type === 'video';
  const isGif = item.file_type === 'gif';
  
  const handleCardClick = () => {
    console.log('MediaItem: Card clicked for item:', item.title);
    onSelect(item);
  };
  
  return (
    <Card className="p-3 cursor-pointer" onClick={handleCardClick}>
      <div className="relative mb-2">
        {isVideo ? (
          <video
            src={getStoragePublicObjectUrl('media-library', item.file_url)}
            className={`w-full object-cover rounded ${viewMode === 'grid' ? 'h-[120px]' : 'h-[80px]'}`}
            muted
            loop
           autoPlay
          />
        ) : (
          <img
            src={getStoragePublicObjectUrl('media-library', item.file_url)}
            alt={item.title}
            className={`w-full object-cover rounded ${viewMode === 'grid' ? 'h-[120px]' : 'h-[80px]'}`}
          />
        )}
        
        {/* File type indicator */}
        <div className="absolute top-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
          {isVideo ? 'video' : isGif ? 'gif' : 'image'}
        </div>
      </div>

      <div className="mb-2">
        <Text variant="p" className="font-semibold mb-0.5 text-[14px]">
          {item.title}
        </Text>
        {item.description && (
          <Text variant="small" className="text-secondary text-[11px]">
            {item.description}
          </Text>
        )}
        
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-0.5">
            {item.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="bg-[hsl(var(--primary))] text-white px-1 py-[1px] rounded-[2px] text-[9px]"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[9px] text-secondary">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="surface-row-between">
        <Text variant="small" className="text-secondary text-[10px]">
          ⬇️ {item.downloads || 0}
        </Text>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(item);
          }}
          disabled={itemLoading[item.id]}
          className="!px-2 !py-1 !text-[10px]"
        >
          {downloadSuccess[item.id] ? '✅' : itemLoading[item.id] ? '⏳' : '⬇️'}
        </Button>
      </div>
    </Card>
  );
};

ImageSearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func
};

export default ImageSearchModal; 