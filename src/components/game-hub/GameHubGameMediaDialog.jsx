import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import Card from '../../ui/Card';
import MediaLibraryBrowser from '../media/MediaLibraryBrowser';
import { useMediaLibraryBrowser } from '../../hooks/useMediaLibraryBrowser';
import { getStoragePublicObjectUrl } from '../../utils/supabase';
import { resolveMimeTypeFromMediaLibraryRow } from '../../utils/channelMediaType';
import { uploadFileToMediaLibraryRow } from '../../utils/mediaLibraryUploadApply';
import {
  ACCEPT_IMAGE_OR_MP4,
  isSupportedImageOrVideoUpload,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../../utils/supportedUploadMedia';
import '../modals/ImageSearchModal.css';
import '../settings/surfaceStyles.css';
import AuraHubModalFrame from './AuraHubModalFrame';

/**
 * Pick from media library or upload — applies to Game Hub game art via parent callback.
 */
function GameHubGameMediaDialog({ open, onOpenChange, game, onApplyArt }) {
  const browser = useMediaLibraryBrowser({
    enabled: open,
    initialSearchTerm: game?.name ? String(game.name).slice(0, 80) : '',
    defaultPageSize: 12,
  });
  const { handleRefresh, fetchPage: _omitFetch, ...browserForLibrary } = browser;

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadErr, setUploadErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const uploadPreviewRef = useRef(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);

  const revokePreview = useCallback(() => {
    if (uploadPreviewRef.current) {
      URL.revokeObjectURL(uploadPreviewRef.current);
      uploadPreviewRef.current = null;
    }
    setUploadPreviewUrl(null);
  }, []);

  useEffect(() => {
    if (!open) {
      revokePreview();
      setUploadFile(null);
      setUploadDescription('');
      setUploadTags('');
      setUploadTitle('');
      setUploadErr('');
      setUploading(false);
    }
  }, [open, revokePreview]);

  const handlePickFile = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (e.target) e.target.value = '';
      revokePreview();
      setUploadFile(null);
      setUploadErr('');
      if (!file) return;
      if (!isSupportedImageOrVideoUpload(file)) {
        setUploadErr(SUPPORTED_IMAGE_VIDEO_HINT);
        return;
      }
      const url = URL.createObjectURL(file);
      uploadPreviewRef.current = url;
      setUploadPreviewUrl(url);
      setUploadFile(file);
      setUploadTitle((t) => t.trim() || file.name.replace(/\.[^.]+$/, '') || file.name);
    },
    [revokePreview]
  );

  const handleSelectLibrary = useCallback(
    (mediaItem) => {
      if (!game?.id || !mediaItem) return;
      const url = getStoragePublicObjectUrl('media-library', mediaItem.file_url);
      const type = resolveMimeTypeFromMediaLibraryRow(mediaItem);
      onApplyArt?.(game.id, { url, type });
      onOpenChange(false);
    },
    [game?.id, onApplyArt, onOpenChange]
  );

  const handleUploadSubmit = useCallback(async () => {
    if (!uploadFile || !game?.id) return;
    setUploadErr('');
    if (!isSupportedImageOrVideoUpload(uploadFile)) {
      setUploadErr(SUPPORTED_IMAGE_VIDEO_HINT);
      return;
    }
    const baseTitle =
      String(uploadTitle || '')
        .trim()
        .replace(/\.[^.]+$/, '') ||
      uploadFile.name.replace(/\.[^.]+$/, '') ||
      'Game Hub media';
    const meta = {
      title: baseTitle,
      description: String(uploadDescription || '').trim(),
      tags: String(uploadTags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    setUploading(true);
    try {
      const result = await uploadFileToMediaLibraryRow(uploadFile, meta);
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      onApplyArt?.(game.id, { url: result.url, type: result.type });
      revokePreview();
      setUploadFile(null);
      await handleRefresh();
      onOpenChange(false);
    } catch (err) {
      setUploadErr(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [
    uploadFile,
    game?.id,
    uploadTitle,
    uploadDescription,
    uploadTags,
    onApplyArt,
    revokePreview,
    handleRefresh,
    onOpenChange,
  ]);

  return (
    <AuraHubModalFrame
      open={open}
      onOpenChange={onOpenChange}
      ariaLabelledBy="hub-game-media-title"
      panelClassName="max-h-[min(92vh,900px)] max-w-[min(960px,96vw)] overflow-y-auto"
    >
      <div className="aura-hub-modal__header">
        <h2 id="hub-game-media-title" className="aura-hub-modal__title">
          Art for {game?.name || 'game'}
        </h2>
        <button type="button" className="aura-hub-modal__close" onClick={() => onOpenChange(false)} aria-label="Close">
          ×
        </button>
      </div>

      <div className="aura-hub-modal__body space-y-4 px-1 pb-2">
          <Text variant="desc" className="block text-[hsl(var(--text-secondary))]">
            Choose from your media library or upload. This replaces the default Steam/Epic art for this game in the hub.
          </Text>

          <div>
            <Text variant="h3" className="mb-2 mt-0 text-[0.95rem]">
              Media library
            </Text>
            <MediaLibraryBrowser
              {...browserForLibrary}
              onSelect={handleSelectLibrary}
              showDownload={false}
              compact
            />
          </div>

          <Card className="!mt-0">
            <Text variant="h3" className="mb-2 mt-0 text-[0.95rem]">
              Upload to library & use
            </Text>
            <Text variant="help" className="mb-3 block">
              {SUPPORTED_IMAGE_VIDEO_HINT}
            </Text>
            {uploadErr ? (
              <Text size="sm" className="mb-2 block text-[hsl(var(--state-error))]">
                {uploadErr}
              </Text>
            ) : null}

            <div className="mb-3 space-y-2">
              <div>
                <Text variant="label" className="mb-1 block">
                  Title
                </Text>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="surface-input w-full rounded-[var(--radius-md)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] px-3 py-2 text-[hsl(var(--text-primary))]"
                />
              </div>
              <div>
                <Text variant="label" className="mb-1 block">
                  Description <span className="font-normal text-[hsl(var(--text-tertiary))]">(optional)</span>
                </Text>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                  className="surface-input min-h-[3rem] w-full resize-y rounded-[var(--radius-md)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] px-3 py-2 text-[hsl(var(--text-primary))]"
                />
              </div>
              <div>
                <Text variant="label" className="mb-1 block">
                  Tags <span className="font-normal text-[hsl(var(--text-tertiary))]">(optional)</span>
                </Text>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  className="surface-input w-full rounded-[var(--radius-md)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] px-3 py-2 text-[hsl(var(--text-primary))]"
                />
              </div>
              <div>
                <Text variant="label" className="mb-1 block">
                  File
                </Text>
                <input type="file" accept={ACCEPT_IMAGE_OR_MP4} onChange={handlePickFile} className="surface-input w-full text-sm" />
              </div>
            </div>

            {uploadFile && uploadPreviewUrl ? (
              <div className="mb-3 overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))]">
                <div className="flex max-h-[200px] justify-center p-3">
                  {uploadFile.type.startsWith('video/') || /\.mp4$/i.test(uploadFile.name) ? (
                    <video
                      src={uploadPreviewUrl}
                      className="max-h-[180px] max-w-full rounded object-contain"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <img src={uploadPreviewUrl} alt="" className="max-h-[180px] max-w-full rounded object-contain" />
                  )}
                </div>
              </div>
            ) : null}

            <WButton
              variant="primary"
              rounded
              fullWidth
              disabled={uploading || !uploadFile || !String(uploadTitle || '').trim()}
              onClick={handleUploadSubmit}
              className="text-text-on-accent"
            >
              {uploading ? 'Uploading…' : 'Upload to library & apply'}
            </WButton>
          </Card>
      </div>
    </AuraHubModalFrame>
  );
}

GameHubGameMediaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  game: PropTypes.object,
  onApplyArt: PropTypes.func.isRequired,
};

export default React.memo(GameHubGameMediaDialog);
