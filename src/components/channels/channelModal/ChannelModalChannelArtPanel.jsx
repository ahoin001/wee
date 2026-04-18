import React, { useState, useCallback, useEffect, useRef, useId } from 'react';
import PropTypes from 'prop-types';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Upload } from 'lucide-react';
import Text from '../../../ui/Text';
import { WeeButton, WeeModalFieldCard, WeeSegmentedControl, WeeSectionEyebrow } from '../../../ui/wee';
import { useWeeMotion } from '../../../design/weeMotion';
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
  onRemoveMedia: _onRemoveMedia,
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
  const { tabTransition } = useWeeMotion();
  const uploadFieldId = useId();
  const uploadInputClass =
    'w-full rounded-2xl border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] px-4 py-3 font-[family-name:var(--font-ui)] text-sm font-bold italic text-[hsl(var(--text-primary))] outline-none shadow-[var(--wee-shadow-field)] transition-[border-color,box-shadow] placeholder:font-[family-name:var(--font-ui)] placeholder:font-normal placeholder:not-italic placeholder:text-[hsl(var(--text-tertiary))] focus:border-[hsl(var(--border-accent))] focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] hover:border-[hsl(var(--wee-border-field-hover))]';

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
      ) : null}

      <AnimatePresence>
        {media && !media.loading ? (
          <m.div
            key="channel-art-preview"
            className="rounded-2xl border-2 border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] p-3 shadow-[var(--shadow-card)] sm:p-5"
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={tabTransition}
            layout
          >
            <div className="flex min-w-0 flex-nowrap items-center gap-3 sm:gap-5">
              <div className="relative h-[72px] w-[140px] max-h-[28vh] shrink-0 -rotate-2 overflow-hidden rounded-[16px] border-4 border-[hsl(var(--wee-border-outer))] shadow-[var(--shadow-card)] sm:h-[80px] sm:w-[156px]">
                {media.type?.startsWith?.('image/') || media.type === 'image' ? (
                  <img src={media.url} alt="" className="h-full w-full object-cover" />
                ) : media.type?.startsWith?.('video/') || media.type === 'video' || media.type === 'gif' ? (
                  <video src={media.url} className="h-full w-full object-cover" autoPlay loop muted playsInline />
                ) : null}
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
          </m.div>
        ) : media?.loading ? (
          <div className="rounded-2xl border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] px-4 py-3 text-sm text-[hsl(var(--text-secondary))] shadow-[var(--wee-shadow-field)]">
            Processing…
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="sync">
        {artToolsExpanded ? (
          <m.div
            key="channel-art-tools"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -14, scale: 0.99 }}
            transition={tabTransition}
            layout
            className="space-y-4 overflow-hidden"
          >
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
                {artSubTab === 'library' && (
                  <m.div
                    key="library"
                    id="channel-art-panel-library"
                    role="tabpanel"
                    aria-labelledby="channel-art-tab-library"
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -10, scale: 0.995 }}
                    transition={tabTransition}
                    layout
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
                  </m.div>
                )}

                {artSubTab === 'upload' && (
                  <m.div
                    key="upload"
                    id="channel-art-panel-upload"
                    role="tabpanel"
                    aria-labelledby="channel-art-tab-upload"
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -10, scale: 0.995 }}
                    transition={tabTransition}
                    layout
                  >
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
                        <m.div
                          layout
                          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={tabTransition}
                          className="mt-6 overflow-hidden rounded-2xl border-2 border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] shadow-[var(--shadow-card)]"
                        >
                          <Text variant="small" className="block border-b border-[hsl(var(--border-primary)/0.5)] px-4 py-2.5 font-bold uppercase tracking-wide text-[hsl(var(--text-secondary))]">
                            {uploadFile.name}
                          </Text>
                          <div className="flex max-h-[220px] justify-center p-4">
                            {uploadFile.type.startsWith('video/') || /\.mp4$/i.test(uploadFile.name) ? (
                              <video
                                src={uploadPreviewUrl}
                                className="max-h-[200px] max-w-full rounded-xl object-contain"
                                controls
                                muted
                                playsInline
                              />
                            ) : (
                              <img src={uploadPreviewUrl} alt="" className="max-h-[200px] max-w-full rounded-xl object-contain" />
                            )}
                          </div>
                        </m.div>
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
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </m.div>
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
