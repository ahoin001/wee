import React, { useEffect, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Card from '../ui/Card';
import Button from '../ui/WButton';
import Text from '../ui/Text';
import { uploadMedia, downloadMedia, getStoragePublicObjectUrl } from '../utils/supabase';
import {
  preloadMediaLibrary,
  filterMediaLibraryCache,
  clearMediaLibraryCache,
} from '../utils/mediaLibraryCache';
import './surfaceStyles.css';
import './ImageSearchModal.css';

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

const PAGE_SIZE = 48;

function ImageSearchModal({ isOpen, onClose, onSelect, onUploadClick }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('browse');
  const [itemLoading, setItemLoading] = useState({});
  const [downloadSuccess, setDownloadSuccess] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    tags: '',
    file: null,
  });

  const [viewMode, setViewMode] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  /** Bumps when cache refreshes so useMemo re-runs against new in-memory data */
  const [cacheEpoch, setCacheEpoch] = useState(0);

  const filteredItems = useMemo(() => {
    void cacheEpoch;
    return filterMediaLibraryCache({
      fileType: filter,
      searchTerm: search,
      sortBy,
    });
  }, [cacheEpoch, filter, search, sortBy]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );

  const hasMoreLocal = visibleCount < filteredItems.length;

  const refreshFromNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      clearMediaLibraryCache();
      await preloadMediaLibrary(true);
      setCacheEpoch((e) => e + 1);
    } catch (err) {
      setError(err?.message || 'Failed to refresh library');
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureLibraryLoaded = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await preloadMediaLibrary(false);
      setCacheEpoch((e) => e + 1);
    } catch (err) {
      setError(err?.message || 'Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    setVisibleCount(PAGE_SIZE);
    ensureLibraryLoaded();
    return undefined;
  }, [isOpen, ensureLibraryLoaded]);

  useEffect(() => {
    if (!isOpen) return;
    setVisibleCount(PAGE_SIZE);
  }, [isOpen, filter, search, sortBy]);

  const handleMediaSelect = useCallback(
    (mediaItem) => {
      onSelect(mediaItem);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleDownload = useCallback(async (mediaItem) => {
    try {
      setItemLoading((prev) => ({ ...prev, [mediaItem.id]: true }));
      setDownloadSuccess((prev) => ({ ...prev, [mediaItem.id]: false }));

      const result = await downloadMedia(mediaItem.id);

      if (result.success) {
        const blob = new Blob([result.data], { type: mediaItem.mime_type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = mediaItem.title || `media-${mediaItem.id}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadSuccess((prev) => ({ ...prev, [mediaItem.id]: true }));
        setTimeout(() => {
          setDownloadSuccess((prev) => ({ ...prev, [mediaItem.id]: false }));
        }, 2000);
      } else {
        setError(`Download failed: ${result.error}`);
      }
    } catch (err) {
      setError(`Download error: ${err.message}`);
    } finally {
      setItemLoading((prev) => ({ ...prev, [mediaItem.id]: false }));
    }
  }, []);

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
        tags: uploadForm.tags
          ? uploadForm.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
          : [],
      };

      const result = await uploadMedia(uploadForm.file, metadata);

      if (result.success) {
        setUploadForm({ title: '', description: '', tags: '', file: null });
        setMode('browse');
        setError(null);
        await refreshFromNetwork();
      } else {
        setError(`Upload failed: ${result.error}`);
      }
    } catch (err) {
      setError(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }, [uploadForm, refreshFromNetwork]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm((prev) => ({
        ...prev,
        file,
      }));
    }
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
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
        <div className="p-3 rounded-[6px] mb-4 bg-[hsl(var(--state-error-light))] text-[hsl(var(--state-error))] border border-[hsl(var(--state-error))]">
          {error}
        </div>
      )}

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
          <Card className="mb-4">
            <div className="image-search-modal__toolbar">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search title, description, tags…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="surface-input w-full"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="surface-select"
              >
                {FILETYPE_OPTIONS.map((option) => (
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
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? 'List view' : 'Grid view'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => refreshFromNetwork()}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh from cloud'}
              </Button>
              <span className="image-search-modal__meta">
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                {visibleItems.length < filteredItems.length
                  ? ` · showing ${visibleItems.length}`
                  : ''}
              </span>
            </div>
          </Card>

          {loading && filteredItems.length === 0 ? (
            <div className="text-center p-10 rounded-[var(--radius-md)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))]">
              <Text>Loading media library…</Text>
            </div>
          ) : (
            <div
              className={`image-search-modal__scroll scrollbar-soft scroll-region-inset ${
                viewMode === 'list'
                  ? 'image-search-modal__scroll--list'
                  : 'image-search-modal__scroll--grid'
              }`}
            >
              {visibleItems.map((item, index) => (
                <MediaItem
                  key={item.id}
                  item={item}
                  index={index}
                  onSelect={handleMediaSelect}
                  onDownload={handleDownload}
                  itemLoading={itemLoading}
                  downloadSuccess={downloadSuccess}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}

          {hasMoreLocal && !loading && (
            <div className="text-center mt-4">
              <Button variant="secondary" onClick={loadMore}>
                Load more ({visibleItems.length} of {filteredItems.length})
              </Button>
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="text-center p-10 border border-dashed border-[hsl(var(--border-primary))] rounded-[var(--radius-md)]">
              <Text>No media matches. Try another search or upload new files.</Text>
            </div>
          )}
        </>
      ) : (
        <Card>
          <div className="p-4">
            <Text variant="label" className="mb-2">
              Title *
            </Text>
            <input
              type="text"
              value={uploadForm.title}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter media title..."
              className="surface-input mb-3 w-full"
            />

            <Text variant="label" className="mb-2">
              Description
            </Text>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your media..."
              rows={3}
              className="surface-textarea mb-3 w-full"
            />

            <Text variant="label" className="mb-2">
              Tags
            </Text>
            <input
              type="text"
              value={uploadForm.tags}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="gaming, dark theme, minimal, etc."
              className="surface-input mb-3 w-full"
            />

            <Text variant="label" className="mb-2">
              File *
            </Text>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="surface-input mb-4 w-full"
            />

            {uploadForm.file && (
              <div className="mb-4">
                <Text variant="small" className="text-secondary">
                  Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024 / 1024).toFixed(2)}{' '}
                  MB)
                </Text>
              </div>
            )}

            <div className="surface-actions justify-end">
              <Button variant="secondary" onClick={() => setMode('browse')} disabled={uploading}>
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

const MediaItem = ({
  item,
  index,
  onSelect,
  onDownload,
  itemLoading,
  downloadSuccess,
  viewMode,
}) => {
  const isVideo = item.file_type === 'video';
  const isGif = item.file_type === 'gif';

  const handleCardClick = () => {
    onSelect(item);
  };

  return (
    <div
      className="image-search-modal__card"
      style={{ '--stagger': Math.min(index, 60) }}
    >
    <Card
      className={`!mt-0 p-3 cursor-pointer transition-shadow hover:shadow-[var(--shadow-md)] ${
        viewMode === 'list' ? '!flex flex-row gap-4 items-center' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className={`relative mb-2 shrink-0 ${viewMode === 'list' ? 'w-36' : ''}`}>
        {isVideo ? (
          <video
            src={getStoragePublicObjectUrl('media-library', item.file_url)}
            className={`w-full object-cover rounded ${
              viewMode === 'grid' ? 'h-[120px]' : 'h-[88px]'
            }`}
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={getStoragePublicObjectUrl('media-library', item.file_url)}
            alt={item.title}
            className={`w-full object-cover rounded ${
              viewMode === 'grid' ? 'h-[120px]' : 'h-[88px]'
            }`}
            loading="lazy"
          />
        )}

        <div className="absolute top-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
          {isVideo ? 'video' : isGif ? 'gif' : 'image'}
        </div>
      </div>

      <div className={`mb-2 min-w-0 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <Text variant="p" className="font-semibold mb-0.5 text-[14px] line-clamp-2">
          {item.title}
        </Text>
        {item.description && (
          <Text variant="small" className="text-secondary text-[11px] line-clamp-2">
            {item.description}
          </Text>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-0.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-[hsl(var(--wii-blue))] text-text-on-accent px-1 py-[1px] rounded-[2px] text-[9px]"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[9px] text-secondary">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="surface-row-between mt-auto">
        <Text variant="small" className="text-secondary text-[10px]">
          {item.downloads || 0} downloads
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
          {downloadSuccess[item.id] ? 'Saved' : itemLoading[item.id] ? '…' : 'Download'}
        </Button>
      </div>
    </Card>
    </div>
  );
};

MediaItem.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  itemLoading: PropTypes.object.isRequired,
  downloadSuccess: PropTypes.object.isRequired,
  viewMode: PropTypes.string.isRequired,
};

ImageSearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func,
};

export default ImageSearchModal;
