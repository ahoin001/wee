import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { WBaseModal } from '../core';
import Card from '../../ui/Card';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import { uploadMedia, downloadMedia, getStoragePublicObjectUrl } from '../../utils/supabase';
import {
  getMediaLibraryPage,
  clearMediaLibraryCache,
  pruneMediaPageCache,
} from '../../utils/mediaLibraryCache';
import {
  ACCEPT_IMAGE_OR_MP4,
  isSupportedImageOrVideoUpload,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../../utils/supportedUploadMedia';
import '../settings/surfaceStyles.css';
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

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 280;
const PAGE_SIZE_OPTIONS = [20, 40, 80];

function ImageSearchModal({ isOpen, onClose, onSelect, onUploadClick }) {
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [mode, setMode] = useState('browse');
  const [viewMode, setViewMode] = useState('grid');

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [items, setItems] = useState([]);

  const [itemLoading, setItemLoading] = useState({});
  const [downloadSuccess, setDownloadSuccess] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    tags: '',
    file: null,
  });
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);

  const requestIdRef = useRef(0);
  const uploadPreviewUrlRef = useRef(null);

  const revokeUploadPreview = useCallback(() => {
    if (uploadPreviewUrlRef.current) {
      URL.revokeObjectURL(uploadPreviewUrlRef.current);
      uploadPreviewUrlRef.current = null;
    }
    setUploadPreviewUrl(null);
  }, []);

  useEffect(() => {
    if (!isOpen) revokeUploadPreview();
  }, [isOpen, revokeUploadPreview]);

  useEffect(() => {
    if (mode !== 'upload') {
      revokeUploadPreview();
      setUploadForm((prev) => (prev.file ? { ...prev, file: null } : prev));
    }
  }, [mode, revokeUploadPreview]);

  useEffect(
    () => () => {
      if (uploadPreviewUrlRef.current) {
        URL.revokeObjectURL(uploadPreviewUrlRef.current);
        uploadPreviewUrlRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const fetchPage = useCallback(
    async ({
      targetPage = 1,
      forceFresh = false,
      asRefresh = false,
    } = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setError(null);
      if (asRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        if (forceFresh) {
          clearMediaLibraryCache();
        }

        const result = await getMediaLibraryPage(
          {
            page: targetPage,
            limit: pageSize,
            fileType: filter,
            searchTerm,
            sortBy,
          },
          { forceFresh }
        );

        if (requestId !== requestIdRef.current) return;

        if (!result.success) {
          throw new Error(result.error || 'Failed to load media');
        }

        setItems(Array.isArray(result.data) ? result.data : []);
        setPage(result.page || targetPage);
        setTotalPages(Math.max(1, Number(result.totalPages) || 1));
        setTotalCount(Math.max(0, Number(result.totalCount) || 0));
        pruneMediaPageCache();
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err?.message || 'Failed to load media library');
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [filter, pageSize, searchTerm, sortBy]
  );

  useEffect(() => {
    if (!isOpen || mode !== 'browse') return;
    fetchPage({ targetPage: page });
  }, [isOpen, mode, page, filter, searchTerm, sortBy, fetchPage]);

  useEffect(() => {
    if (!isOpen || mode !== 'browse' || page >= totalPages) return;

    getMediaLibraryPage({
      page: page + 1,
      limit: pageSize,
      fileType: filter,
      searchTerm,
      sortBy,
    }).catch(() => {});
  }, [filter, isOpen, mode, page, pageSize, searchTerm, sortBy, totalPages]);

  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
  }, [isOpen, filter, searchTerm, sortBy, pageSize]);

  const handleRefresh = useCallback(async () => {
    await fetchPage({ targetPage: 1, forceFresh: true, asRefresh: true });
  }, [fetchPage]);

  const handleMediaSelect = useCallback(
    (mediaItem) => {
      onSelect(mediaItem);
      onClose();
    },
    [onClose, onSelect]
  );

  const handleDownload = useCallback(async (mediaItem) => {
    try {
      setItemLoading((prev) => ({ ...prev, [mediaItem.id]: true }));
      setDownloadSuccess((prev) => ({ ...prev, [mediaItem.id]: false }));

      const result = await downloadMedia(mediaItem.id);
      if (!result.success) {
        throw new Error(result.error || 'Download failed');
      }

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
    } catch (err) {
      setError(err?.message || 'Download error');
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
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      revokeUploadPreview();
      setUploadForm({ title: '', description: '', tags: '', file: null });
      setMode('browse');
      await fetchPage({ targetPage: 1, forceFresh: true, asRefresh: true });
    } catch (err) {
      setError(err?.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  }, [fetchPage, uploadForm, revokeUploadPreview]);

  const handleFileSelect = useCallback((e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (input) input.value = '';
    revokeUploadPreview();
    if (!file) {
      setUploadForm((prev) => ({ ...prev, file: null }));
      return;
    }
    if (!isSupportedImageOrVideoUpload(file)) {
      setError(SUPPORTED_IMAGE_VIDEO_HINT);
      setUploadForm((prev) => ({ ...prev, file: null }));
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    uploadPreviewUrlRef.current = url;
    setUploadPreviewUrl(url);
    setUploadForm((prev) => ({ ...prev, file }));
  }, [revokeUploadPreview]);

  const isInitialLoad = loading && items.length === 0;
  const hasResults = items.length > 0;
  const shouldShowSkeletons = loading;

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
        <Button variant={mode === 'browse' ? 'primary' : 'secondary'} onClick={() => setMode('browse')}>
          Browse Media
        </Button>
        <Button variant={mode === 'upload' ? 'primary' : 'secondary'} onClick={() => setMode('upload')}>
          Upload Media
        </Button>
        {onUploadClick && mode === 'browse' && (
          <Button variant="secondary" onClick={onUploadClick}>
            Upload from Channel
          </Button>
        )}
      </div>

      {mode === 'browse' ? (
        <>
          <Card className="mb-4 image-search-modal__toolbar-card">
            <div className="image-search-modal__toolbar">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search title, description, tags..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="surface-input w-full"
                />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="surface-select">
                {FILETYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="surface-select">
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) || PAGE_SIZE);
                  setPage(1);
                }}
                className="surface-select"
              >
                {PAGE_SIZE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value} / page
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                {viewMode === 'grid' ? 'List view' : 'Grid view'}
              </Button>
              <Button variant="secondary" onClick={handleRefresh} disabled={loading || refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh from cloud'}
              </Button>
              <span className="image-search-modal__meta">
                {totalCount} item{totalCount !== 1 ? 's' : ''} · page {page}/{totalPages}
              </span>
            </div>
          </Card>

          {isInitialLoad ? (
            <div className="text-center p-10 rounded-[var(--radius-md)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))]">
              <Text>Loading media library...</Text>
            </div>
          ) : (
            <div
              className={`image-search-modal__scroll scrollbar-soft scroll-region-inset ${
                viewMode === 'list'
                  ? 'image-search-modal__scroll--list'
                  : 'image-search-modal__scroll--grid'
              }`}
            >
              {shouldShowSkeletons
                ? Array.from({ length: pageSize }, (_, index) => (
                    <SkeletonMediaItem key={`skeleton-${index}`} index={index} viewMode={viewMode} />
                  ))
                : items.map((item, index) => (
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

          {!loading && !hasResults && (
            <div className="text-center p-10 border border-dashed border-[hsl(var(--border-primary))] rounded-[var(--radius-md)] mt-4">
              <Text>No media matches. Try another search, filters, or upload new files.</Text>
            </div>
          )}

          <div className="image-search-modal__pagination mt-4">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
            >
              Previous
            </Button>
            <div className="image-search-modal__pagination-meta">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={loading || page >= totalPages}
            >
              Next
            </Button>
          </div>
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
            <Text variant="help" className="mb-2 block">
              {SUPPORTED_IMAGE_VIDEO_HINT}
            </Text>
            <input
              type="file"
              accept={ACCEPT_IMAGE_OR_MP4}
              onChange={handleFileSelect}
              className="surface-input mb-3 w-full"
            />

            {uploadForm.file && uploadPreviewUrl && (
              <div className="mb-4 rounded-md border border-[hsl(var(--border-primary))] overflow-hidden bg-[hsl(var(--surface-secondary))]">
                <Text variant="small" className="block px-3 py-2 border-b border-[hsl(var(--border-primary))]">
                  {uploadForm.file.name} · {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
                <div className="flex justify-center p-3 max-h-[220px]">
                  {uploadForm.file.type.startsWith('video/') || /\.mp4$/i.test(uploadForm.file.name) ? (
                    <video
                      src={uploadPreviewUrl}
                      className="max-h-[200px] max-w-full object-contain rounded"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={uploadPreviewUrl}
                      alt=""
                      className="max-h-[200px] max-w-full object-contain rounded"
                    />
                  )}
                </div>
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

  return (
    <div className="image-search-modal__card" style={{ '--stagger': Math.min(index, 60) }}>
      <Card
        className={`!mt-0 p-3 cursor-pointer transition-shadow hover:shadow-[var(--shadow-md)] ${
          viewMode === 'list' ? '!flex flex-row gap-4 items-center' : ''
        }`}
        onClick={() => onSelect(item)}
      >
        <div className={`relative mb-2 shrink-0 ${viewMode === 'list' ? 'w-36' : ''}`}>
          {isVideo ? (
            <video
              src={getStoragePublicObjectUrl('media-library', item.file_url)}
              className={`w-full object-cover rounded ${viewMode === 'grid' ? 'h-[120px]' : 'h-[88px]'}`}
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={getStoragePublicObjectUrl('media-library', item.file_url)}
              alt={item.title}
              className={`w-full object-cover rounded ${viewMode === 'grid' ? 'h-[120px]' : 'h-[88px]'}`}
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
            {downloadSuccess[item.id] ? 'Saved' : itemLoading[item.id] ? '...' : 'Download'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const SkeletonMediaItem = ({ index, viewMode }) => (
  <div className="image-search-modal__card" style={{ '--stagger': Math.min(index, 24) }}>
    <Card className={`!mt-0 p-3 ${viewMode === 'list' ? '!flex flex-row gap-4 items-center' : ''}`}>
      <div
        className={`image-search-modal__skeleton image-search-modal__skeleton-media ${
          viewMode === 'grid' ? 'h-[120px]' : 'h-[88px] w-36'
        }`}
      />
      <div className={`mb-2 min-w-0 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="image-search-modal__skeleton image-search-modal__skeleton-title" />
        <div className="image-search-modal__skeleton image-search-modal__skeleton-subtitle" />
      </div>
      <div className="surface-row-between mt-auto">
        <div className="image-search-modal__skeleton image-search-modal__skeleton-meta" />
        <div className="image-search-modal__skeleton image-search-modal__skeleton-button" />
      </div>
    </Card>
  </div>
);

MediaItem.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  itemLoading: PropTypes.object.isRequired,
  downloadSuccess: PropTypes.object.isRequired,
  viewMode: PropTypes.string.isRequired,
};

SkeletonMediaItem.propTypes = {
  index: PropTypes.number.isRequired,
  viewMode: PropTypes.string.isRequired,
};

ImageSearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func,
};

export default ImageSearchModal;
