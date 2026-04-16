import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Text from '../../../ui/Text';
import WButton from '../../../ui/WButton';
import Card from '../../../ui/Card';
import MediaLibraryBrowser from '../../media/MediaLibraryBrowser';
import ChannelModalInlineMediaSuggestions, {
  deriveChannelArtSearchQuery,
} from './ChannelModalInlineMediaSuggestions';
import { useMediaLibraryBrowser } from '../../../hooks/useMediaLibraryBrowser';
import {
  ACCEPT_IMAGE_OR_MP4,
  isSupportedImageOrVideoUpload,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../../../utils/supportedUploadMedia';

const ART_SUBTAB_KEY = 'wee.channelArt.subtab';

function readStoredArtSubtab() {
  if (typeof sessionStorage === 'undefined') return 'library';
  return sessionStorage.getItem(ART_SUBTAB_KEY) === 'upload' ? 'upload' : 'library';
}

/**
 * Channel art: quick picks + tabbed Library | Upload, dense home-style media tiles in Library.
 */
function ChannelModalChannelArtPanel({
  path,
  type,
  matchingApp,
  onApplySuggestedMedia,
  media,
  onSelectFromLibrary,
  onUploadToLibraryAndChannel,
  libraryUploading,
  onRemoveMedia,
  mediaUploadHint,
  setMediaUploadHint,
}) {
  const initialSearch = deriveChannelArtSearchQuery({ path, type, matchingApp });
  const browser = useMediaLibraryBrowser({
    enabled: true,
    initialSearchTerm: initialSearch,
    defaultPageSize: 12,
  });

  const [artSubTab, setArtSubTab] = useState(readStoredArtSubtab);
  const setArtSubTabPersist = useCallback((tab) => {
    setArtSubTab(tab);
    try {
      sessionStorage.setItem(ART_SUBTAB_KEY, tab);
    } catch {
      /* ignore */
    }
  }, []);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);
  const uploadPreviewRef = useRef(null);
  /** Last resolved media URL — collapse Library/Upload when URL changes to a new pick (incl. picks with no loading state). */
  const prevResolvedMediaUrlRef = useRef(null);
  const reduceMotion = useReducedMotion();

  /** Library / Upload UI: hidden once art is chosen so the panel stays calm; user can reopen. */
  const [artToolsExpanded, setArtToolsExpanded] = useState(
    () => !(media && !media?.loading)
  );

  useEffect(() => {
    if (!media) {
      setArtToolsExpanded(true);
      prevResolvedMediaUrlRef.current = null;
      return;
    }
    if (media.loading) {
      return;
    }
    const url = media.url;
    const prevUrl = prevResolvedMediaUrlRef.current;
    if (prevUrl === url) {
      return;
    }
    prevResolvedMediaUrlRef.current = url;
    setArtToolsExpanded(false);
  }, [media]);

  const revokePreview = useCallback(() => {
    if (uploadPreviewRef.current) {
      URL.revokeObjectURL(uploadPreviewRef.current);
      uploadPreviewRef.current = null;
    }
    setUploadPreviewUrl(null);
  }, []);

  useEffect(() => () => revokePreview(), [revokePreview]);

  const handlePickFile = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (e.target) e.target.value = '';
      revokePreview();
      setUploadFile(null);
      if (!file) return;
      if (!isSupportedImageOrVideoUpload(file)) {
        setMediaUploadHint?.(SUPPORTED_IMAGE_VIDEO_HINT);
        return;
      }
      setMediaUploadHint?.('');
      const url = URL.createObjectURL(file);
      uploadPreviewRef.current = url;
      setUploadPreviewUrl(url);
      setUploadFile(file);
      setUploadTitle((t) => t.trim() || file.name.replace(/\.[^.]+$/, '') || file.name);
    },
    [revokePreview, setMediaUploadHint]
  );

  const { handleRefresh, fetchPage: _omitFetch, ...browserForLibrary } = browser;

  const handleSubmitUpload = useCallback(async () => {
    if (!uploadFile) return;
    await onUploadToLibraryAndChannel?.(uploadFile, {
      title: uploadTitle,
    });
    revokePreview();
    setUploadFile(null);
    setUploadTitle('');
    setArtSubTabPersist('library');
    await handleRefresh();
  }, [uploadFile, uploadTitle, onUploadToLibraryAndChannel, revokePreview, handleRefresh, setArtSubTabPersist]);

  const tabTransition = reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] };
  const previewTransition = reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] };

  const mediaLabel =
    media?.name || (typeof media?.type === 'string' && media.type.startsWith('video') ? 'Video' : 'Image');

  const artSummaryOnly = Boolean(media && !media.loading && !artToolsExpanded);

  return (
    <div
      className={`channel-art-panel channel-art-panel--tabbed space-y-4${
        artSummaryOnly ? ' channel-art-panel--summary-only' : ''
      }`}
    >
      {artToolsExpanded ? (
        <Text variant="desc" className="block text-[hsl(var(--text-secondary))]">
          Pick art from suggestions or your library—or upload once and we apply it here.
        </Text>
      ) : (
        <Text variant="desc" className="block text-[hsl(var(--text-secondary))]">
          Here&apos;s what will show on your channel. Change it anytime.
        </Text>
      )}

      <AnimatePresence>
        {media && !media.loading ? (
          <motion.div
            key="channel-art-preview"
            className="channel-art-panel__preview"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
            transition={previewTransition}
          >
            <div className="channel-art-panel__preview-inner">
              <div className="channel-art-panel__preview-thumb">
                {media.type?.startsWith?.('image/') || media.type === 'image' ? (
                  <img src={media.url} alt="" />
                ) : media.type?.startsWith?.('video/') || media.type === 'video' || media.type === 'gif' ? (
                  <video src={media.url} autoPlay loop muted playsInline />
                ) : null}
              </div>
              <div className="channel-art-panel__preview-copy">
                <div className="channel-art-panel__preview-kicker">
                  Channel art
                  {media.temporary ? (
                    <span className="ml-2 rounded bg-[hsl(var(--state-warning)/0.2)] px-1.5 py-0.5 text-[0.6rem] font-bold text-[hsl(var(--state-warning))]">
                      Temp
                    </span>
                  ) : null}
                </div>
                <div className="channel-art-panel__preview-title">{mediaLabel}</div>
              </div>
              <div className="channel-art-panel__preview-actions flex flex-wrap items-center gap-2">
                <WButton
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setArtToolsExpanded(true)}
                >
                  Change channel art
                </WButton>
                <WButton variant="secondary" size="sm" type="button" onClick={onRemoveMedia}>
                  Remove
                </WButton>
              </div>
            </div>
          </motion.div>
        ) : media?.loading ? (
          <div className="channel-art-panel__preview rounded-[var(--radius-lg)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-4 py-3 text-sm text-[hsl(var(--text-secondary))]">
            Processing…
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {artToolsExpanded ? (
          <motion.div
            key="channel-art-tools"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="channel-art-panel__tools"
          >
            <div className="channel-art-panel__tabs" role="tablist" aria-label="Channel art source">
              <button
                type="button"
                role="tab"
                id="channel-art-tab-library"
                aria-selected={artSubTab === 'library'}
                aria-controls="channel-art-panel-library"
                className="channel-art-panel__tab"
                onClick={() => setArtSubTabPersist('library')}
              >
                Library
              </button>
              <button
                type="button"
                role="tab"
                id="channel-art-tab-upload"
                aria-selected={artSubTab === 'upload'}
                aria-controls="channel-art-panel-upload"
                className="channel-art-panel__tab"
                onClick={() => setArtSubTabPersist('upload')}
              >
                Upload
              </button>
            </div>

            <div className="channel-art-panel__tab-panels">
              <AnimatePresence mode="wait">
                {artSubTab === 'library' && (
                  <motion.div
                    key="library"
                    id="channel-art-panel-library"
                    role="tabpanel"
                    aria-labelledby="channel-art-tab-library"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={tabTransition}
                    className="space-y-4"
                  >
                    <ChannelModalInlineMediaSuggestions
                      path={path}
                      type={type}
                      matchingApp={matchingApp}
                      onApplyMedia={onApplySuggestedMedia}
                      appliedMedia={media}
                    />
                    <MediaLibraryBrowser
                      {...browserForLibrary}
                      onSelect={onSelectFromLibrary}
                      showDownload={false}
                      compact
                      channelPicker
                    />
                  </motion.div>
                )}

                {artSubTab === 'upload' && (
                  <motion.div
                    key="upload"
                    id="channel-art-panel-upload"
                    role="tabpanel"
                    aria-labelledby="channel-art-tab-upload"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={tabTransition}
                  >
                    <Card className="!mt-0">
                      <Text variant="h3" className="mb-2 mt-0 text-[0.95rem]">
                        Upload & apply
                      </Text>
                      <Text variant="help" className="mb-3 block">
                        {SUPPORTED_IMAGE_VIDEO_HINT} Saved to your media library and set as this channel&apos;s art.
                      </Text>
                      {mediaUploadHint ? (
                        <Text size="sm" className="mb-2 block" color="hsl(var(--state-warning))">
                          {mediaUploadHint}
                        </Text>
                      ) : null}

                      <div className="channel-stack-8 mb-3">
                        <div>
                          <Text variant="label" className="mb-1 block">
                            Title
                          </Text>
                          <input
                            type="text"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            placeholder="Name shown in your library"
                            className="text-input w-full rounded-[var(--radius-md)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] px-3 py-2 text-[hsl(var(--text-primary))]"
                          />
                        </div>
                        <div>
                          <Text variant="label" className="mb-1 block">
                            File
                          </Text>
                          <input
                            type="file"
                            accept={ACCEPT_IMAGE_OR_MP4}
                            onChange={handlePickFile}
                            className="text-input w-full text-sm"
                          />
                        </div>
                      </div>

                      {uploadFile && uploadPreviewUrl ? (
                        <div className="mb-3 overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))]">
                          <Text variant="small" className="block border-b border-[hsl(var(--border-primary))] px-3 py-2">
                            {uploadFile.name}
                          </Text>
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
                        disabled={libraryUploading || !uploadFile || !String(uploadTitle || '').trim()}
                        onClick={handleSubmitUpload}
                        className="text-text-on-accent"
                      >
                        {libraryUploading ? 'Uploading…' : 'Upload & apply to channel'}
                      </WButton>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

ChannelModalChannelArtPanel.propTypes = {
  path: PropTypes.string,
  type: PropTypes.string,
  matchingApp: PropTypes.object,
  onApplySuggestedMedia: PropTypes.func.isRequired,
  media: PropTypes.object,
  onSelectFromLibrary: PropTypes.func.isRequired,
  onUploadToLibraryAndChannel: PropTypes.func.isRequired,
  libraryUploading: PropTypes.bool,
  onRemoveMedia: PropTypes.func.isRequired,
  mediaUploadHint: PropTypes.string,
  setMediaUploadHint: PropTypes.func,
};

ChannelModalChannelArtPanel.defaultProps = {
  path: '',
  type: 'exe',
  matchingApp: null,
  media: null,
  libraryUploading: false,
  mediaUploadHint: '',
  setMediaUploadHint: undefined,
};

export default React.memo(ChannelModalChannelArtPanel);
