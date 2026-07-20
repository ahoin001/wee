import React, { useState, useCallback, useEffect, useRef, useId, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, Upload } from 'lucide-react';
import Text from '../../../ui/Text';
import {
  WeeButton,
  WeeContentCollapse,
  WeeMorphStack,
  WeeModalFieldCard,
  WeeRevealWhen,
  WeeSegmentedControl,
  WeeSectionEyebrow,
  WeeToggle,
} from '../../../ui/wee';
import { useWeeMotion } from '../../../design/weeMotion';
import MediaLibraryBrowser from '../../media/MediaLibraryBrowser';
import ChannelModalInlineMediaSuggestions, {
  deriveChannelArtSearchQuery,
} from './ChannelModalInlineMediaSuggestions';
import ChannelTileArtFrame from '../ChannelTileArtFrame';
import KenBurnsImage from '../KenBurnsImage';
import { useMediaLibraryBrowser } from '../../../hooks/useMediaLibraryBrowser';
import {
  ACCEPT_GALLERY_STILLS,
  ACCEPT_IMAGE_OR_MP4,
  isSupportedImageOrVideoUpload,
  SUPPORTED_GALLERY_HINT,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../../../utils/supportedUploadMedia';
import {
  applyChannelMediaFocalPreset,
  CHANNEL_ART_MOTION,
  CHANNEL_GALLERY_MAX_STILLS,
  CHANNEL_MEDIA_FOCAL_PRESETS,
  channelTileAspectRatioCss,
  getChannelGalleryUrls,
  isChannelGalleryStillType,
  matchChannelMediaFocalPresetId,
  resolveChannelArtMotion,
} from '../../../utils/channelMediaFit';
import { isVideoMediaType } from '../../../utils/channelMediaType';

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
  onRemoveMedia: _onRemoveMedia,
  mediaUploadHint,
  setMediaUploadHint,
  imageGallery = [],
  artMotion,
  onArtMotionChange,
  galleryFileInputRef,
  onGalleryFilesSelect,
  onRemoveGalleryImage,
  onReorderGallery,
  onAddLibraryStillToGallery,
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
  /** Last resolved media URL — collapse Library/Upload when URL changes to a new pick. */
  const prevResolvedMediaUrlRef = useRef(null);
  /** Preview enter animation only on first appear — not on every tools collapse. */
  const previewHasEnteredRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const { tabTransition } = useWeeMotion();
  const uploadFieldId = useId();
  const uploadInputClass =
    'w-full rounded-2xl border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] px-4 py-3 font-[family-name:var(--font-ui)] text-sm font-bold italic text-[hsl(var(--text-primary))] outline-none shadow-[var(--wee-shadow-field)] transition-[border-color,box-shadow] placeholder:font-[family-name:var(--font-ui)] placeholder:font-normal placeholder:not-italic placeholder:text-[hsl(var(--text-tertiary))] focus:border-[hsl(var(--border-accent))] focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] hover:border-[hsl(var(--wee-border-field-hover))]';

  const [artToolsExpanded, setArtToolsExpanded] = useState(
    () => !(media && !media?.loading)
  );
  /** When adding from library: replace cover vs append slideshow still. */
  const [libraryPickMode, setLibraryPickMode] = useState('cover');

  useEffect(() => {
    if (!media) {
      setArtToolsExpanded(true);
      prevResolvedMediaUrlRef.current = null;
      previewHasEnteredRef.current = false;
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

  useEffect(() => {
    if (media && !media.loading) {
      previewHasEnteredRef.current = true;
    }
  }, [media]);

  const revokePreview = useCallback(() => {
    if (uploadPreviewRef.current) {
      URL.revokeObjectURL(uploadPreviewRef.current);
      uploadPreviewRef.current = null;
    }
    setUploadPreviewUrl(null);
  }, []);

  useEffect(() => () => revokePreview(), [revokePreview]);

  const applyPickedFile = useCallback(
    (file) => {
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

  const handlePickFile = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (e.target) e.target.value = '';
      applyPickedFile(file);
    },
    [applyPickedFile]
  );

  const handleUploadDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      applyPickedFile(file);
    },
    [applyPickedFile]
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

  const mediaLabel =
    media?.name || (typeof media?.type === 'string' && media.type.startsWith('video') ? 'Video' : 'Image');

  const focalPresetId = useMemo(
    () => matchChannelMediaFocalPresetId(media),
    [media]
  );
  const focalPresetOptions = useMemo(
    () => CHANNEL_MEDIA_FOCAL_PRESETS.map((p) => ({ value: p.id, label: p.label })),
    []
  );

  const handleFocalPresetChange = useCallback(
    (presetId) => {
      if (!media || media.loading) return;
      onApplySuggestedMedia(applyChannelMediaFocalPreset(media, presetId));
    },
    [media, onApplySuggestedMedia]
  );

  const resolvedArtMotion = resolveChannelArtMotion(media || { gallery: imageGallery, artMotion });
  const galleryUrls = useMemo(
    () => getChannelGalleryUrls(media || { gallery: imageGallery, url: media?.url, type: media?.type }),
    [media, imageGallery]
  );
  const canUseGallery = Boolean(
    media && !media.loading && !isVideoMediaType(media.type) && isChannelGalleryStillType(media.type)
  );
  const cinematicEnabled = resolvedArtMotion === CHANNEL_ART_MOTION.CINEMATIC;
  const showGalleryPreview = galleryUrls.length > 1 || cinematicEnabled;

  const handleLibrarySelect = useCallback(
    (item) => {
      if (libraryPickMode === 'gallery' && onAddLibraryStillToGallery) {
        onAddLibraryStillToGallery(item);
        return;
      }
      onSelectFromLibrary?.(item);
    },
    [libraryPickMode, onAddLibraryStillToGallery, onSelectFromLibrary]
  );

  const handleGalleryInputChange = useCallback(
    (e) => {
      const files = e.target.files;
      if (e.target) e.target.value = '';
      onGalleryFilesSelect?.(files);
    },
    [onGalleryFilesSelect]
  );

  const artSummaryOnly = Boolean(media && !media.loading && !artToolsExpanded);
  const previewEnterInitial =
    reduceMotion || previewHasEnteredRef.current
      ? false
      : { opacity: 0, y: 10, scale: 0.97 };

  const libraryPanel = (
    <div className="space-y-4">
      <ChannelModalInlineMediaSuggestions
        path={path}
        type={type}
        matchingApp={matchingApp}
        onApplyMedia={onApplySuggestedMedia}
        appliedMedia={media}
      />
      {canUseGallery ? (
        <WeeSegmentedControl
          ariaLabel="Library pick mode"
          value={libraryPickMode}
          onChange={setLibraryPickMode}
          options={[
            { value: 'cover', label: 'Set as cover' },
            { value: 'gallery', label: 'Add to slideshow' },
          ]}
          size="sm"
          className="!flex w-full max-w-full"
        />
      ) : null}
      <MediaLibraryBrowser
        {...browserForLibrary}
        onSelect={handleLibrarySelect}
        showDownload={false}
        compact
        channelPicker
      />
    </div>
  );

  const uploadPanel = (
    <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-6 md:p-10" className="!mt-0">
      <WeeSectionEyebrow className="mb-1">Upload & apply</WeeSectionEyebrow>
      <Text variant="help" className="mb-6 mt-2 block max-w-prose">
        Add a file to your library and set it as this channel&apos;s art in one step.
      </Text>
      {mediaUploadHint ? (
        <Text size="sm" className="mb-4 block" color="hsl(var(--state-warning))">
          {mediaUploadHint}
        </Text>
      ) : null}

      <div className="space-y-6">
        <div>
          <WeeSectionEyebrow className="mb-2">Library title</WeeSectionEyebrow>
          <input
            type="text"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="Name shown in your library"
            className={uploadInputClass}
          />
        </div>

        <div>
          <WeeSectionEyebrow className="mb-2">File</WeeSectionEyebrow>
          <input
            id={uploadFieldId}
            type="file"
            accept={ACCEPT_IMAGE_OR_MP4}
            onChange={handlePickFile}
            className="sr-only"
          />
          <label
            htmlFor={uploadFieldId}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={handleUploadDrop}
            className="flex min-h-[11rem] cursor-pointer flex-col items-center justify-center rounded-[var(--wee-radius-card)] border-4 border-dashed border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--wee-surface-input))] px-6 py-8 text-center transition-[border-color,background-color,box-shadow,transform] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--surface-tertiary)/0.35)] hover:shadow-[var(--shadow-sm)] motion-safe:active:scale-[0.99]"
          >
            <Upload
              className="mb-3 h-9 w-9 text-[hsl(var(--wee-text-rail-muted))]"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="m-0 text-[11px] font-black uppercase tracking-[0.14em] text-[hsl(var(--wee-text-header))]">
              Drop files or browse
            </p>
            <p className="mt-2 m-0 max-w-sm text-[10px] font-bold uppercase leading-relaxed tracking-wide text-[hsl(var(--text-tertiary))]">
              {SUPPORTED_IMAGE_VIDEO_HINT}
            </p>
          </label>
        </div>
      </div>

      {uploadFile && uploadPreviewUrl ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tabTransition}
          className="mt-6 overflow-hidden rounded-2xl border-2 border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] shadow-[var(--shadow-card)]"
        >
          <Text
            variant="small"
            className="block border-b border-[hsl(var(--border-primary)/0.5)] px-4 py-2.5 font-bold uppercase tracking-wide text-[hsl(var(--text-secondary))]"
          >
            {uploadFile.name}
          </Text>
          <div className="p-4">
            <Text variant="desc" className="mb-2 block text-[hsl(var(--text-secondary))]">
              Channel tile preview
            </Text>
            <ChannelTileArtFrame
              media={{
                url: uploadPreviewUrl,
                type: uploadFile.type,
                focalX: 0.5,
                focalY: 0.5,
              }}
              className="max-w-[280px]"
              autoPlayVideo={false}
            />
          </div>
        </motion.div>
      ) : null}

      <WeeButton
        variant="primary"
        fullWidth
        rounded
        disabled={libraryUploading || !uploadFile || !String(uploadTitle || '').trim()}
        onClick={handleSubmitUpload}
        className="mt-8 !py-4 text-[hsl(var(--text-on-accent))]"
      >
        {libraryUploading ? 'Uploading…' : 'Upload & apply to channel'}
      </WeeButton>
    </WeeModalFieldCard>
  );

  return (
    <WeeMorphStack
      open={!artSummaryOnly}
      className={`channel-art-panel channel-art-panel--tabbed${
        artSummaryOnly ? ' channel-art-panel--summary-only' : ''
      }`}
    >
      <AnimatePresence>
        {media && !media.loading ? (
          <motion.div
            key="channel-art-preview"
            className="rounded-2xl border-2 border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] p-3 shadow-[var(--shadow-card)] sm:p-5"
            initial={previewEnterInitial}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={tabTransition}
          >
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex min-w-0 flex-nowrap items-center gap-3 sm:gap-5">
                <div className="w-[140px] shrink-0 sm:w-[168px]">
                  <ChannelTileArtFrame
                    media={media}
                    className="-rotate-2"
                    roundedClassName="rounded-[16px]"
                  />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="mb-0.5 flex flex-nowrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
                      Active asset
                    </span>
                    {media.temporary ? (
                      <span className="shrink-0 rounded bg-[hsl(var(--state-warning)/0.2)] px-1.5 py-0.5 text-[0.6rem] font-bold text-[hsl(var(--state-warning))]">
                        Temp
                      </span>
                    ) : null}
                  </div>
                  <div className="truncate text-lg font-black italic leading-tight text-[hsl(var(--text-primary))] sm:text-xl">
                    {mediaLabel}
                  </div>
                </div>
                <WeeButton
                  type="button"
                  variant="primary"
                  onClick={() => setArtToolsExpanded(true)}
                  className="shrink-0 !px-4 !py-2.5 sm:!px-5 sm:!py-3"
                >
                  Change channel art
                </WeeButton>
              </div>

              <div className="space-y-2">
                <Text
                  variant="small"
                  className="block font-bold uppercase tracking-wide text-[hsl(var(--text-secondary))]"
                >
                  Frame on tile
                </Text>
                <WeeSegmentedControl
                  ariaLabel="Channel art framing"
                  value={focalPresetId}
                  onChange={handleFocalPresetChange}
                  options={focalPresetOptions}
                  size="sm"
                  wrap
                  layoutId="channelArtFocalPreset"
                  className="!flex w-full max-w-full"
                />
              </div>

              {canUseGallery ? (
                <div className="space-y-3 border-t border-[hsl(var(--border-primary)/0.35)] pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text
                      variant="small"
                      className="block font-bold uppercase tracking-wide text-[hsl(var(--text-secondary))]"
                    >
                      Slideshow stills
                    </Text>
                    <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                      {imageGallery.length}/{CHANNEL_GALLERY_MAX_STILLS}
                    </Text>
                  </div>
                  <Text variant="help" className="!m-0">
                    Add up to {CHANNEL_GALLERY_MAX_STILLS} stills for an idle crossfade loop.
                    Channel presentation wins over global Ken Burns for this tile.
                  </Text>

                  {imageGallery.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {imageGallery.map((item, index) => (
                        <div
                          key={item.id || item.url || `g-${index}`}
                          className="relative w-16 overflow-hidden rounded-lg border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-tertiary))]"
                        >
                          <img
                            src={item.url}
                            alt={item.name || `Still ${index + 1}`}
                            className="h-14 w-full object-cover"
                            draggable={false}
                          />
                          <div className="flex items-center justify-between gap-0.5 bg-[hsl(var(--surface-secondary)/0.9)] px-0.5 py-0.5">
                            <button
                              type="button"
                              className="rounded p-0.5 text-[hsl(var(--text-secondary))] disabled:opacity-30"
                              disabled={index === 0}
                              aria-label="Move left"
                              onClick={() => onReorderGallery?.(index, index - 1)}
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <button
                              type="button"
                              className="rounded p-0.5 text-[hsl(var(--state-error))]"
                              aria-label="Remove still"
                              onClick={() => onRemoveGalleryImage?.(item.id || item.url)}
                            >
                              <Trash2 size={12} />
                            </button>
                            <button
                              type="button"
                              className="rounded p-0.5 text-[hsl(var(--text-secondary))] disabled:opacity-30"
                              disabled={index >= imageGallery.length - 1}
                              aria-label="Move right"
                              onClick={() => onReorderGallery?.(index, index + 1)}
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <WeeButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="!inline-flex !items-center !gap-1.5"
                      disabled={imageGallery.length >= CHANNEL_GALLERY_MAX_STILLS}
                      onClick={() => galleryFileInputRef?.current?.click()}
                    >
                      <Plus size={14} />
                      Add stills
                    </WeeButton>
                    <input
                      ref={galleryFileInputRef}
                      type="file"
                      accept={ACCEPT_GALLERY_STILLS}
                      multiple
                      className="sr-only"
                      onChange={handleGalleryInputChange}
                    />
                  </div>
                  <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                    {SUPPORTED_GALLERY_HINT}
                  </Text>

                  <WeeRevealWhen when={imageGallery.length > 1 || cinematicEnabled}>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <WeeToggle
                          checked={cinematicEnabled}
                          onChange={(checked) =>
                            onArtMotionChange?.(
                              checked
                                ? CHANNEL_ART_MOTION.CINEMATIC
                                : imageGallery.length > 1
                                  ? CHANNEL_ART_MOTION.GALLERY_IDLE
                                  : CHANNEL_ART_MOTION.COVER
                            )
                          }
                          label="Cinematic loop"
                        />
                        <Text variant="help" className="!m-0">
                          Continuous pan + crossfade. Off uses a soft idle slideshow.
                        </Text>
                      </div>
                      {showGalleryPreview ? (
                        <div
                          className="overflow-hidden rounded-xl border border-[hsl(var(--border-primary)/0.35)]"
                          style={{ aspectRatio: channelTileAspectRatioCss(), maxWidth: 280 }}
                        >
                          <KenBurnsImage
                            images={galleryUrls}
                            mode="slideshow"
                            width="100%"
                            height="100%"
                            borderRadius="0"
                            slideshowDuration={cinematicEnabled ? 9000 : 8000}
                            slideshowScale={cinematicEnabled ? 1.12 : 1.06}
                            crossfadeDuration={1400}
                            enableIntersectionObserver={false}
                            alt="Gallery preview"
                          />
                        </div>
                      ) : null}
                    </div>
                  </WeeRevealWhen>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : media?.loading ? (
          <div
            key="channel-art-loading"
            className="rounded-2xl border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] px-4 py-3 text-sm text-[hsl(var(--text-secondary))] shadow-[var(--wee-shadow-field)]"
          >
            Processing…
          </div>
        ) : null}
      </AnimatePresence>

      <WeeContentCollapse
        open={artToolsExpanded}
        keepMounted={false}
        className="channel-art-panel__tools-collapse"
      >
        <div className="space-y-4">
          <Text variant="desc" className="block text-[hsl(var(--text-secondary))]">
            Pick art from suggestions or your library—or upload once and we apply it here.
          </Text>

          <WeeSegmentedControl
            ariaLabel="Channel art source"
            value={artSubTab}
            onChange={setArtSubTabPersist}
            options={[
              { value: 'library', label: 'Library' },
              { value: 'upload', label: 'Upload' },
            ]}
            className="!flex w-full max-w-full [&>button]:min-w-0 [&>button]:flex-1"
          />

          <div className="relative min-h-0">
            <AnimatePresence mode="wait" initial={false}>
              {artSubTab === 'library' ? (
                <motion.div
                  key="library"
                  id="channel-art-panel-library"
                  role="tabpanel"
                  aria-labelledby="channel-art-tab-library"
                  initial={reduceMotion || !artToolsExpanded ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion || !artToolsExpanded ? undefined : { opacity: 0, y: -10 }}
                  transition={tabTransition}
                  className="space-y-4"
                >
                  {libraryPanel}
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  id="channel-art-panel-upload"
                  role="tabpanel"
                  aria-labelledby="channel-art-tab-upload"
                  initial={reduceMotion || !artToolsExpanded ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion || !artToolsExpanded ? undefined : { opacity: 0, y: -10 }}
                  transition={tabTransition}
                >
                  {uploadPanel}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </WeeContentCollapse>
    </WeeMorphStack>
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
  imageGallery: PropTypes.array,
  artMotion: PropTypes.string,
  onArtMotionChange: PropTypes.func,
  galleryFileInputRef: PropTypes.object,
  onGalleryFilesSelect: PropTypes.func,
  onRemoveGalleryImage: PropTypes.func,
  onReorderGallery: PropTypes.func,
  onAddLibraryStillToGallery: PropTypes.func,
};

ChannelModalChannelArtPanel.defaultProps = {
  path: '',
  type: 'exe',
  matchingApp: null,
  media: null,
  libraryUploading: false,
  mediaUploadHint: '',
  setMediaUploadHint: undefined,
  imageGallery: [],
  artMotion: undefined,
  onArtMotionChange: undefined,
  galleryFileInputRef: undefined,
  onGalleryFilesSelect: undefined,
  onRemoveGalleryImage: undefined,
  onReorderGallery: undefined,
  onAddLibraryStillToGallery: undefined,
};

export default React.memo(ChannelModalChannelArtPanel);
