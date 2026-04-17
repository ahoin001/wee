import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { WBaseModal } from '../core';
import Card from '../../ui/Card';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import MediaLibraryBrowser from '../media/MediaLibraryBrowser';
import { uploadMedia } from '../../utils/supabase';
import { clearMediaLibraryCache } from '../../utils/mediaLibraryCache';
import {
  useMediaLibraryBrowser,
  MEDIA_LIBRARY_DEFAULT_PAGE_SIZE,
} from '../../hooks/useMediaLibraryBrowser';
import {
  ACCEPT_IMAGE_OR_MP4,
  isSupportedImageOrVideoUpload,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../../utils/supportedUploadMedia';
import '../settings/surfaceStyles.css';
import './ImageSearchModal.css';

function ImageSearchModal({ isOpen, onClose, onSelect, onUploadClick }) {
  const [mode, setMode] = useState('browse');
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    tags: '',
    file: null,
  });
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const uploadPreviewUrlRef = useRef(null);

  const browser = useMediaLibraryBrowser({
    enabled: isOpen && mode === 'browse',
    initialSearchTerm: '',
    defaultPageSize: MEDIA_LIBRARY_DEFAULT_PAGE_SIZE,
  });

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
      setUploadError('');
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

  const handleMediaSelect = useCallback(
    (mediaItem) => {
      onSelect(mediaItem);
      onClose();
    },
    [onClose, onSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!uploadForm.file || !uploadForm.title.trim()) {
      setUploadError('Please select a file and enter a title');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');

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

      clearMediaLibraryCache();
      revokeUploadPreview();
      setUploadForm({ title: '', description: '', tags: '', file: null });
      setMode('browse');
      await browser.handleRefresh();
    } catch (err) {
      setUploadError(err?.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  }, [uploadForm, revokeUploadPreview, browser]);

  const handleFileSelect = useCallback(
    (e) => {
      const input = e.target;
      const file = input.files?.[0];
      if (input) input.value = '';
      revokeUploadPreview();
      if (!file) {
        setUploadForm((prev) => ({ ...prev, file: null }));
        return;
      }
      if (!isSupportedImageOrVideoUpload(file)) {
        setUploadError(SUPPORTED_IMAGE_VIDEO_HINT);
        setUploadForm((prev) => ({ ...prev, file: null }));
        return;
      }
      setUploadError('');
      const url = URL.createObjectURL(file);
      uploadPreviewUrlRef.current = url;
      setUploadPreviewUrl(url);
      setUploadForm((prev) => ({ ...prev, file }));
    },
    [revokeUploadPreview]
  );

  return (
    <WBaseModal
      isOpen={isOpen}
      title="Media Library"
      onClose={onClose}
      maxWidth="1400px"
      maxHeight="80vh"
      footerContent={null}
    >
      {uploadError && mode === 'upload' ? (
        <div className="mb-4 rounded-[6px] border border-[hsl(var(--state-error))] bg-[hsl(var(--state-error-light))] p-3 text-[hsl(var(--state-error))]">
          {uploadError}
        </div>
      ) : null}

      <div className="surface-actions mb-4">
        <Button variant={mode === 'browse' ? 'primary' : 'secondary'} onClick={() => setMode('browse')}>
          Browse Media
        </Button>
        <Button variant={mode === 'upload' ? 'primary' : 'secondary'} onClick={() => setMode('upload')}>
          Upload Media
        </Button>
        {onUploadClick && mode === 'browse' ? (
          <Button variant="secondary" onClick={onUploadClick}>
            Upload from Channel
          </Button>
        ) : null}
      </div>

      {mode === 'browse' ? (
        <MediaLibraryBrowser
          filter={browser.filter}
          setFilter={browser.setFilter}
          searchInput={browser.searchInput}
          setSearchInput={browser.setSearchInput}
          sortBy={browser.sortBy}
          setSortBy={browser.setSortBy}
          pageSize={browser.pageSize}
          setPageSize={browser.setPageSize}
          viewMode={browser.viewMode}
          setViewMode={browser.setViewMode}
          loading={browser.loading}
          refreshing={browser.refreshing}
          error={browser.error}
          setError={browser.setError}
          page={browser.page}
          setPage={browser.setPage}
          totalPages={browser.totalPages}
          totalCount={browser.totalCount}
          items={browser.items}
          handleRefresh={browser.handleRefresh}
          onSelect={handleMediaSelect}
          showDownload
          compact={false}
        />
      ) : (
        <Card className="image-search-modal__upload-card">
          <div className="p-4">
            <Text variant="label" className="mb-2 playful-system-label">
              Title *
            </Text>
            <input
              type="text"
              value={uploadForm.title}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter media title..."
              className="surface-input mb-3 w-full"
            />

            <Text variant="label" className="mb-2 playful-system-label">
              Description
            </Text>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your media..."
              rows={3}
              className="surface-textarea mb-3 w-full"
            />

            <Text variant="label" className="mb-2 playful-system-label">
              Tags
            </Text>
            <input
              type="text"
              value={uploadForm.tags}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="gaming, dark theme, minimal, etc."
              className="surface-input mb-3 w-full"
            />

            <Text variant="label" className="mb-2 playful-system-label">
              File *
            </Text>
            <Text variant="help" className="mb-2 block">
              {SUPPORTED_IMAGE_VIDEO_HINT}
            </Text>
            <input type="file" accept={ACCEPT_IMAGE_OR_MP4} onChange={handleFileSelect} className="surface-input mb-3 w-full" />

            {uploadForm.file && uploadPreviewUrl ? (
              <div className="mb-4 overflow-hidden rounded-md border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))]">
                <Text variant="small" className="block border-b border-[hsl(var(--border-primary))] px-3 py-2">
                  {uploadForm.file.name} · {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
                <div className="flex max-h-[220px] justify-center p-3">
                  {uploadForm.file.type.startsWith('video/') || /\.mp4$/i.test(uploadForm.file.name) ? (
                    <video
                      src={uploadPreviewUrl}
                      className="max-h-[200px] max-w-full rounded object-contain"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <img src={uploadPreviewUrl} alt="" className="max-h-[200px] max-w-full rounded object-contain" />
                  )}
                </div>
              </div>
            ) : null}

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

ImageSearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func,
};

export default ImageSearchModal;
