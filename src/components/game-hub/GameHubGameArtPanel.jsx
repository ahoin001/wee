import React, { useState, useCallback, useEffect, useRef, useMemo, useId } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Upload } from 'lucide-react';
import Text from '../../ui/Text';
import { WeeButton, WeeModalFieldCard, WeeSegmentedControl, WeeSectionEyebrow } from '../../ui/wee';
import { useWeeMotion } from '../../design/weeMotion';
import MediaLibraryBrowser from '../media/MediaLibraryBrowser';
import ChannelModalInlineMediaSuggestions from '../channels/channelModal/ChannelModalInlineMediaSuggestions';
import { useMediaLibraryBrowser } from '../../hooks/useMediaLibraryBrowser';
import { getStoragePublicObjectUrl } from '../../utils/supabase';
import { resolveMimeTypeFromMediaLibraryRow } from '../../utils/channelMediaType';
import { uploadFileToMediaLibraryRow } from '../../utils/mediaLibraryUploadApply';
import { preloadMediaLibrary } from '../../utils/mediaLibraryCache';
import {
  ACCEPT_IMAGE_OR_MP4,
  isSupportedImageOrVideoUpload,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../../utils/supportedUploadMedia';
import '../channels/ChannelModal.css';

const ART_SUBTAB_KEY = 'wee.gameHubArt.subtab';

function readStoredArtSubtab() {
  if (typeof sessionStorage === 'undefined') return 'library';
  return sessionStorage.getItem(ART_SUBTAB_KEY) === 'upload' ? 'upload' : 'library';
}

/**
 * Build media preview object for Framer preview + inline suggestions (mirrors Configure Channel art panel).
 * @param {object|null} game
 * @param {object|null|undefined} customEntry — from `customArtByGameId[game.id]`
 */
export function buildHubDisplayMedia(game, customEntry) {
  if (!game) return null;
  const url = customEntry?.url || game.imageUrl;
  if (!url) return null;
  let type = customEntry?.type;
  if (!type) {
    if (url.match(/\.(mp4|webm)($|\?)/i)) type = 'video/mp4';
    else type = 'image/jpeg';
  }
  const name = customEntry ? 'Custom art' : 'Default library art';
  return { url, type, name };
}

/**
 * Game Hub: pick cover art — same flow as Configure Channel → Setup → Channel art (Library | Upload + suggestions).
 */
function GameHubGameArtPanel({ game, enabled, customEntry, onApplyArt }) {
  const matchingApp = useMemo(() => (game?.name ? { name: game.name } : null), [game?.name]);
  const path = game?.launchPath || '';
  const type = 'exe';

  const browser = useMediaLibraryBrowser({
    enabled: Boolean(enabled && game?.id),
    initialSearchTerm: game?.name ? String(game.name).slice(0, 80) : '',
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
  const prevResolvedMediaUrlRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { tabTransition } = useWeeMotion();
  const uploadFieldId = useId();
  const [mediaUploadHint, setMediaUploadHint] = useState('');
  const [libraryUploading, setLibraryUploading] = useState(false);

  const uploadInputClass =
    'w-full rounded-2xl border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] px-4 py-3 font-[family-name:var(--font-ui)] text-sm font-bold italic text-[hsl(var(--text-primary))] outline-none shadow-[var(--wee-shadow-field)] transition-[border-color,box-shadow] placeholder:font-[family-name:var(--font-ui)] placeholder:font-normal placeholder:not-italic placeholder:text-[hsl(var(--text-tertiary))] focus:border-[hsl(var(--border-accent))] focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] hover:border-[hsl(var(--wee-border-field-hover))]';

  const displayMedia = useMemo(() => buildHubDisplayMedia(game, customEntry), [game, customEntry]);

  const [artToolsExpanded, setArtToolsExpanded] = useState(() => !(displayMedia && !displayMedia?.loading));

  useEffect(() => {
    if (enabled && game?.id) {
      preloadMediaLibrary().catch(() => {});
    }
  }, [enabled, game?.id]);

  useEffect(() => {
    if (!displayMedia) {
      setArtToolsExpanded(true);
      prevResolvedMediaUrlRef.current = null;
      return;
    }
    if (displayMedia.loading) return;
    const url = displayMedia.url;
    const prevUrl = prevResolvedMediaUrlRef.current;
    if (prevUrl === url) return;
    prevResolvedMediaUrlRef.current = url;
    setArtToolsExpanded(false);
  }, [displayMedia]);

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
        setMediaUploadHint(SUPPORTED_IMAGE_VIDEO_HINT);
        return;
      }
      setMediaUploadHint('');
      const url = URL.createObjectURL(file);
      uploadPreviewRef.current = url;
      setUploadPreviewUrl(url);
      setUploadFile(file);
      setUploadTitle((t) => t.trim() || file.name.replace(/\.[^.]+$/, '') || file.name);
    },
    [revokePreview]
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

  const handleApplySuggested = useCallback(
    (mediaData) => {
      if (!game?.id || !mediaData?.url) return;
      onApplyArt(game.id, {
        url: mediaData.url,
        type: mediaData.type,
        headerUrl: mediaData.headerUrl || mediaData.url,
      });
    },
    [game?.id, onApplyArt]
  );

  const handleSelectFromLibrary = useCallback(
    (mediaItem) => {
      if (!game?.id || !mediaItem) return;
      const url = getStoragePublicObjectUrl('media-library', mediaItem.file_url);
      const mime = resolveMimeTypeFromMediaLibraryRow(mediaItem);
      onApplyArt(game.id, { url, type: mime, headerUrl: url });
    },
    [game?.id, onApplyArt]
  );

  const handleSubmitUpload = useCallback(async () => {
    if (!uploadFile || !game?.id) return;
    setMediaUploadHint('');
    if (!isSupportedImageOrVideoUpload(uploadFile)) {
      setMediaUploadHint(SUPPORTED_IMAGE_VIDEO_HINT);
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
      description: '',
      tags: [],
    };
    setLibraryUploading(true);
    try {
      const result = await uploadFileToMediaLibraryRow(uploadFile, meta);
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      onApplyArt(game.id, { url: result.url, type: result.type, headerUrl: result.url });
      revokePreview();
      setUploadFile(null);
      setUploadTitle('');
      setArtSubTabPersist('library');
      await handleRefresh();
    } catch (err) {
      setMediaUploadHint(err?.message || 'Upload failed');
    } finally {
      setLibraryUploading(false);
    }
  }, [
    uploadFile,
    game?.id,
    uploadTitle,
    onApplyArt,
    revokePreview,
    handleRefresh,
    setArtSubTabPersist,
  ]);

  const mediaLabel =
    displayMedia?.name ||
    (typeof displayMedia?.type === 'string' && displayMedia.type.startsWith('video') ? 'Video' : 'Image');

  const artSummaryOnly = Boolean(displayMedia && !displayMedia.loading && !artToolsExpanded);

  if (!game?.id) {
    return null;
  }

  return (
    <div
      className={`channel-art-panel channel-art-panel--tabbed space-y-4${
        artSummaryOnly ? ' channel-art-panel--summary-only' : ''
      }`}
    >
      {artToolsExpanded ? (
        <Text variant="desc" className="block text-[hsl(var(--text-secondary))]">
          Pick art from suggestions or your library—or upload once and we apply it for this game in the hub (saved
          automatically).
        </Text>
      ) : null}

      <AnimatePresence>
        {displayMedia && !displayMedia.loading ? (
          <motion.div
            key="hub-art-preview"
            className="rounded-2xl border-2 border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] p-3 shadow-[var(--shadow-card)] sm:p-5"
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={tabTransition}
            layout
          >
            <div className="flex min-w-0 flex-nowrap items-center gap-3 sm:gap-5">
              <div className="relative h-[72px] w-[140px] max-h-[28vh] shrink-0 -rotate-2 overflow-hidden rounded-[16px] border-4 border-[hsl(var(--wee-border-outer))] shadow-[var(--shadow-card)] sm:h-[80px] sm:w-[156px]">
                {displayMedia.type?.startsWith?.('image/') || displayMedia.type === 'image' ? (
                  <img src={displayMedia.url} alt="" className="h-full w-full object-cover" />
                ) : displayMedia.type?.startsWith?.('video/') ||
                  displayMedia.type === 'video' ||
                  displayMedia.type === 'gif' ? (
                  <video src={displayMedia.url} className="h-full w-full object-cover" autoPlay loop muted playsInline />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="mb-0.5 flex flex-nowrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
                    Active cover
                  </span>
                  {customEntry?.url ? (
                    <span className="shrink-0 rounded bg-[hsl(var(--state-success)/0.18)] px-1.5 py-0.5 text-[0.6rem] font-bold text-[hsl(var(--state-success))]">
                      Custom
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
                Change art
              </WeeButton>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="sync">
        {artToolsExpanded ? (
          <motion.div
            key="hub-art-tools"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -14, scale: 0.99 }}
            transition={tabTransition}
            layout
            className="space-y-4 overflow-hidden"
          >
            <WeeSegmentedControl
              ariaLabel="Game art source"
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
                  <motion.div
                    key="library"
                    id="hub-game-art-panel-library"
                    role="tabpanel"
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
                      onApplyMedia={handleApplySuggested}
                      appliedMedia={displayMedia}
                      sectionHeading="Suggested art"
                      appliedPillText="In use"
                    />
                    <MediaLibraryBrowser
                      {...browserForLibrary}
                      onSelect={handleSelectFromLibrary}
                      showDownload={false}
                      compact
                      channelPicker
                    />
                  </motion.div>
                )}

                {artSubTab === 'upload' && (
                  <motion.div
                    key="upload"
                    id="hub-game-art-panel-upload"
                    role="tabpanel"
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -10, scale: 0.995 }}
                    transition={tabTransition}
                    layout
                  >
                    <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-6 md:p-10" className="!mt-0">
                      <WeeSectionEyebrow className="mb-1">Upload &amp; apply</WeeSectionEyebrow>
                      <Text variant="help" className="mb-6 mt-2 block max-w-prose">
                        Add a file to your media library and use it as this game&apos;s cover in one step.
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
                          layout
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
                              <img
                                src={uploadPreviewUrl}
                                alt=""
                                className="max-h-[200px] max-w-full rounded-xl object-contain"
                              />
                            )}
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
                        {libraryUploading ? 'Uploading…' : 'Upload & apply to game'}
                      </WeeButton>
                    </WeeModalFieldCard>
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

GameHubGameArtPanel.propTypes = {
  game: PropTypes.object.isRequired,
  enabled: PropTypes.bool,
  customEntry: PropTypes.object,
  onApplyArt: PropTypes.func.isRequired,
};

GameHubGameArtPanel.defaultProps = {
  enabled: true,
  customEntry: null,
};

export default React.memo(GameHubGameArtPanel);
