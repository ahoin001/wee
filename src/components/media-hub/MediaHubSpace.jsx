import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import {
  Calendar,
  Clapperboard,
  ExternalLink,
  Film,
  FolderSearch,
  HardDrive,
  Info,
  ListVideo,
  Play,
  RefreshCcw,
  Search,
  Tv,
  Video,
  X,
} from 'lucide-react';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import MediaHubDiscoverGrid, { MEDIA_HUB_DISCOVER_VIRTUAL_THRESHOLD } from './MediaHubDiscoverGrid';
import { buildStremioDetailUrl } from '../../utils/mediaHubStremio';
import {
  WEE_EASING,
  createHubEntranceOrchestratorVariants,
  createMediaHubGridContainerVariants,
  createMediaHubGridItemVariants,
  createMediaHubShellBandVariants,
  getMediaHubAsideMotion,
  getMediaHubOverlayPanelMotion,
} from '../../design/weeMotion';
import { useHubSpaceEntrance } from '../../hooks/useHubSpaceEntrance';
import './MediaHubSpace.css';

const MotionDiv = m.div;
const MotionButton = m.button;
const MotionHeader = m.header;
const CINEMETA_URL = 'https://v3-cinemeta.strem.io';
const LOCAL_MEDIA_LIMIT = 350;
const CARD_EASE = WEE_EASING.mediaHubCard;
const EMPTY_OBJECT = Object.freeze({});
/** Parent list for poster grid — item delays come from `createMediaHubGridItemVariants` + `custom` index. */
const GRID_LIST_PARENT_VARIANTS = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0, delayChildren: 0 },
  },
};

function useMinWidth1024() {
  const [ok, setOk] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const fn = () => setOk(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return ok;
}

function getPosterUrl(item) {
  if (!item) return '';
  return item.poster || item.logo || '';
}

function formatBytes(size) {
  if (!Number.isFinite(size) || size <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = size;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

function pickDiscoverGenre(item) {
  if (!item) return '';
  if (Array.isArray(item.genres) && item.genres.length) return String(item.genres[0]);
  if (item.genre) return String(item.genre);
  return '';
}

function pickFirstEpisode(videos) {
  const list = Array.isArray(videos)
    ? videos.filter((v) => v && Number.isFinite(Number(v.season)) && Number.isFinite(Number(v.episode)))
    : [];
  if (!list.length) return null;
  const sorted = [...list].sort(
    (a, b) => Number(a.season) - Number(b.season) || Number(a.episode) - Number(b.episode)
  );
  return sorted[0];
}

function seasonsFromVideos(videos) {
  const set = new Set();
  for (const v of Array.isArray(videos) ? videos : []) {
    if (v && Number.isFinite(Number(v.season))) set.add(Number(v.season));
  }
  return [...set].sort((a, b) => a - b);
}

function episodesForSeason(videos, season) {
  const s = Number(season);
  return (Array.isArray(videos) ? videos : [])
    .filter((v) => v && Number(v.season) === s && Number.isFinite(Number(v.episode)))
    .sort((a, b) => Number(a.episode) - Number(b.episode));
}

/**
 * Shared detail body: hero + badges + description + Stremio / local actions (hub-stremio hierarchy, tokenized).
 */
function MediaHubItemDetail({
  variant,
  selectedItem,
  activeTab,
  contentMode,
  onClose,
  canOpenStremioDetail = false,
  onOpenStremioDetail,
  onPlayLocal,
  formatBytes: fmtBytes,
  seriesMetaLoading,
  seriesMetaError,
  seriesVideos,
  selectedSeason,
  selectedEpisode,
  seasonOptions,
  episodeOptions,
  onSeasonChange,
  onEpisodeChange,
}) {
  const isDiscover = activeTab === 'discover';
  const posterUrl = getPosterUrl(selectedItem);
  const description = isDiscover ? String(selectedItem.description || '').trim() : '';
  const ratingRaw = isDiscover ? selectedItem.imdbRating : null;
  const rating =
    ratingRaw !== undefined && ratingRaw !== null && Number.isFinite(Number(ratingRaw))
      ? Number(ratingRaw)
      : null;
  const genreLabel = isDiscover ? pickDiscoverGenre(selectedItem) : '';
  const yearLabel = isDiscover ? String(selectedItem.year || '').trim() : '';
  const typeLabel = isDiscover ? (contentMode === 'movie' ? 'Movie' : 'Series') : 'Local file';
  const showEpisodePicker =
    isDiscover &&
    contentMode === 'series' &&
    (seriesMetaLoading || seriesMetaError || (Array.isArray(seriesVideos) && seriesVideos.length > 0));

  const stremioOpenDisabled =
    !canOpenStremioDetail || (contentMode === 'series' && seriesMetaLoading);

  const shellClass =
    variant === 'overlay'
      ? 'media-hub-detail-surface media-hub-detail-surface--overlay flex max-h-[min(92vh,880px)] min-h-0 w-full max-w-lg flex-col overflow-hidden sm:max-w-xl'
      : 'media-hub-detail-surface media-hub-detail-surface--aside flex h-full min-h-0 flex-col overflow-hidden';

  return (
    <div className={shellClass}>
      <div className="media-hub-detail__hero relative min-h-[220px] shrink-0 overflow-hidden sm:min-h-[280px]">
        {posterUrl ? (
          <img src={posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center bg-[hsl(var(--surface-tertiary))] sm:min-h-[280px]">
            <Video className="text-[hsl(var(--text-tertiary))]" size={48} strokeWidth={1.25} />
          </div>
        )}
        <div className="media-hub-detail__hero-scrim absolute inset-0" aria-hidden />
        <div className="absolute right-4 top-4 z-[2]">
          <MotionButton
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[hsl(var(--border-primary)/0.65)] bg-[hsl(var(--color-pure-black)/0.45)] text-[hsl(var(--text-primary))] backdrop-blur-md"
            aria-label="Close details"
          >
            <X size={18} />
          </MotionButton>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-[1] px-6 pb-6 pt-12 sm:px-8">
          <h2 className="m-0 text-2xl font-black uppercase italic leading-none tracking-tighter text-[hsl(var(--text-primary))] sm:text-3xl">
            {selectedItem.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--primary))]">
            {genreLabel ? <span>{genreLabel}</span> : null}
            {genreLabel && (isDiscover || yearLabel) ? (
              <span className="h-1 w-1 rounded-full bg-[hsl(var(--text-tertiary)/0.6)]" aria-hidden />
            ) : null}
            {isDiscover ? <span>{typeLabel}</span> : <span>{selectedItem.extension || 'File'}</span>}
          </div>
        </div>
      </div>

      <div className="media-hub-detail__body flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-wrap gap-2">
          {isDiscover && yearLabel ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-[hsl(var(--text-secondary))]">
              <Calendar className="text-[hsl(var(--primary))]" size={12} aria-hidden />
              {yearLabel}
            </div>
          ) : null}
          {isDiscover ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-[hsl(var(--text-secondary))]">
              <Film className="text-[hsl(var(--primary))]" size={12} aria-hidden />
              {typeLabel}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-[hsl(var(--text-secondary))]">
              <Video className="text-[hsl(var(--primary))]" size={12} aria-hidden />
              {fmtBytes(selectedItem.size)}
            </div>
          )}
          {rating !== null ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-[hsl(var(--text-secondary))]">
              <Info className="text-[hsl(var(--primary))]" size={12} aria-hidden />
              {rating.toFixed(1)} IMDb
            </div>
          ) : null}
        </div>

        {description ? (
          <p className="m-0 text-sm font-medium leading-relaxed text-[hsl(var(--text-secondary))]">{description}</p>
        ) : null}
        {!isDiscover ? (
          <p className="m-0 break-all font-mono text-[11px] leading-relaxed text-[hsl(var(--text-tertiary))]">
            {selectedItem.path}
          </p>
        ) : null}

        {showEpisodePicker ? (
          <div className="rounded-2xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.4)] p-4">
            <h3 className="m-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--text-tertiary))]">
              <ListVideo size={14} className="text-[hsl(var(--primary))]" aria-hidden />
              Episode
            </h3>
            {seriesMetaLoading ? (
              <p className="m-0 mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                Loading episodes…
              </p>
            ) : seriesMetaError ? (
              <p className="m-0 mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--state-error))]">
                {seriesMetaError}
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
                    Season
                  </span>
                  <select
                    value={selectedSeason != null ? String(selectedSeason) : ''}
                    onChange={(e) => onSeasonChange?.(Number(e.target.value))}
                    className="media-hub-tray-select w-full min-w-0 px-3 py-2 text-[12px] font-bold"
                  >
                    {(seasonOptions || []).map((s) => (
                      <option key={s} value={String(s)}>
                        Season {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
                    Episode
                  </span>
                  <select
                    value={selectedEpisode != null ? String(selectedEpisode) : ''}
                    onChange={(e) => onEpisodeChange?.(Number(e.target.value))}
                    className="media-hub-tray-select w-full min-w-0 px-3 py-2 text-[12px] font-bold"
                  >
                    {(episodeOptions || []).map((ep) => (
                      <option key={ep} value={String(ep)}>
                        Episode {ep}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        ) : null}

        {isDiscover ? (
          <div className="mt-auto border-t border-[hsl(var(--border-primary)/0.35)] pt-4">
            <p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-[0.11em] leading-relaxed text-[hsl(var(--text-secondary))]">
              Opens this title in the Stremio app using the catalog.
            </p>
            <MotionButton
              type="button"
              disabled={stremioOpenDisabled}
              whileHover={!stremioOpenDisabled ? { scale: 1.01 } : undefined}
              whileTap={!stremioOpenDisabled ? { scale: 0.99 } : undefined}
              onClick={() => onOpenStremioDetail?.()}
              className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] border border-[hsl(var(--primary)/0.55)] bg-[hsl(var(--primary))] py-4 text-[10px] font-black uppercase tracking-[0.25em] text-[hsl(var(--text-on-accent))] shadow-[0_12px_28px_-12px_hsl(var(--primary)/0.55)] disabled:cursor-not-allowed disabled:border-[hsl(var(--border-primary)/0.6)] disabled:bg-[hsl(var(--surface-tertiary)/0.8)] disabled:text-[hsl(var(--text-tertiary))] disabled:shadow-none"
            >
              <Clapperboard size={18} aria-hidden />
              Open in Stremio
            </MotionButton>
          </div>
        ) : (
          <div className="mt-auto border-t border-[hsl(var(--border-primary)/0.35)] pt-4">
            <p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-[0.11em] text-[hsl(var(--text-secondary))]">
              {fmtBytes(selectedItem.size)}
              {selectedItem.modifiedAt ? ` · ${new Date(selectedItem.modifiedAt).toLocaleDateString()}` : ''}
            </p>
            <MotionButton
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onPlayLocal(selectedItem)}
              className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] border border-[hsl(var(--primary)/0.55)] bg-[hsl(var(--primary))] py-4 text-[10px] font-black uppercase tracking-[0.25em] text-[hsl(var(--text-on-accent))] shadow-[0_12px_28px_-12px_hsl(var(--primary)/0.55)]"
            >
              <Play size={18} fill="currentColor" />
              Open file
            </MotionButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MediaHubSpace() {
  const {
    activeTabRaw,
    contentModeRaw,
    searchQueryRaw,
    selectedItemIdRaw,
    preferredPlayerPathRaw,
    preferredPlayerArgsRaw,
    launchFallbackMessageRaw,
    cinemetaStateRaw,
    localStateRaw,
    seriesMetaByIdRaw,
    libraryRaw,
    setMediaHubState,
    activeSpaceId,
    selectedSeriesSeasonRaw,
    selectedSeriesEpisodeRaw,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      activeTabRaw: state.mediaHub?.ui?.activeTab,
      contentModeRaw: state.mediaHub?.ui?.contentMode,
      searchQueryRaw: state.mediaHub?.ui?.searchQuery,
      selectedItemIdRaw: state.mediaHub?.ui?.selectedItemId,
      preferredPlayerPathRaw: state.mediaHub?.ui?.preferredPlayerPath,
      preferredPlayerArgsRaw: state.mediaHub?.ui?.preferredPlayerArgs,
      launchFallbackMessageRaw: state.mediaHub?.ui?.launchFallbackMessage,
      selectedSeriesSeasonRaw: state.mediaHub?.ui?.selectedSeriesSeason,
      selectedSeriesEpisodeRaw: state.mediaHub?.ui?.selectedSeriesEpisode,
      cinemetaStateRaw: state.mediaHub?.sources?.cinemeta,
      localStateRaw: state.mediaHub?.sources?.local,
      seriesMetaByIdRaw: state.mediaHub?.sources?.seriesMetaById,
      libraryRaw: state.mediaHub?.library,
      setMediaHubState: state.actions.setMediaHubState,
      activeSpaceId: state.spaces.activeSpaceId,
    }))
  );
  const { beginLaunchFeedback, endLaunchFeedback, showLaunchError } = useLaunchFeedback();
  const discoverAbortRef = useRef(null);
  const seriesMetaAbortRef = useRef(null);
  const autoScannedFolderKeysRef = useRef(new Set());
  const hubScrollRef = useRef(null);
  const thumbMtimeRef = useRef(new Map());
  const thumbnailByPathRef = useRef({});
  const [thumbnailByPath, setThumbnailByPath] = useState({});
  const isLgUp = useMinWidth1024();
  const reducedMotion = useReducedMotion();
  const mediaHubAsideMotion = useMemo(() => getMediaHubAsideMotion(reducedMotion), [reducedMotion]);
  const mediaHubOverlayPanelMotion = useMemo(
    () => getMediaHubOverlayPanelMotion(reducedMotion),
    [reducedMotion]
  );
  const { entranceKey, tier: hubEntranceTier, animateState: hubEntranceState, onEntranceComplete } = useHubSpaceEntrance(
    'mediahub',
    reducedMotion
  );
  const hubOrchestratorVariants = useMemo(
    () => createHubEntranceOrchestratorVariants(hubEntranceTier, reducedMotion),
    [hubEntranceTier, reducedMotion]
  );
  const mediaHubShellBandVariants = useMemo(
    () => createMediaHubShellBandVariants(hubEntranceTier, reducedMotion),
    [hubEntranceTier, reducedMotion]
  );
  const mediaHubGridContainerVariants = useMemo(
    () => createMediaHubGridContainerVariants(hubEntranceTier, reducedMotion),
    [hubEntranceTier, reducedMotion]
  );
  const mediaHubGridItemVariants = useMemo(
    () => createMediaHubGridItemVariants(hubEntranceTier, reducedMotion),
    [hubEntranceTier, reducedMotion]
  );
  const activeTab = activeTabRaw || 'discover';
  const contentMode = contentModeRaw || 'movie';
  const searchQuery = searchQueryRaw || '';
  const selectedItemId = selectedItemIdRaw || null;
  const preferredPlayerPath = preferredPlayerPathRaw || '';
  const preferredPlayerArgs = preferredPlayerArgsRaw || '';
  const launchFallbackMessage = launchFallbackMessageRaw || '';
  const selectedSeriesSeason =
    selectedSeriesSeasonRaw != null && Number.isFinite(Number(selectedSeriesSeasonRaw))
      ? Number(selectedSeriesSeasonRaw)
      : null;
  const selectedSeriesEpisode =
    selectedSeriesEpisodeRaw != null && Number.isFinite(Number(selectedSeriesEpisodeRaw))
      ? Number(selectedSeriesEpisodeRaw)
      : null;
  const cinemetaState = cinemetaStateRaw || EMPTY_OBJECT;
  const localState = localStateRaw || EMPTY_OBJECT;
  const seriesMetaById = seriesMetaByIdRaw || EMPTY_OBJECT;
  const library = libraryRaw || EMPTY_OBJECT;

  const discoveryItems = Array.isArray(cinemetaState.items) ? cinemetaState.items : [];
  const localFiles = Array.isArray(localState.files) ? localState.files : [];

  const selectedDiscoverItem = useMemo(
    () => discoveryItems.find((item) => item.id === selectedItemId) || null,
    [discoveryItems, selectedItemId]
  );
  const selectedLocalFile = useMemo(
    () => localFiles.find((item) => item.id === selectedItemId) || null,
    [localFiles, selectedItemId]
  );
  const selectedItem = activeTab === 'local' ? selectedLocalFile : selectedDiscoverItem;

  const stremioDetailUrl = useMemo(
    () =>
      selectedDiscoverItem && activeTab === 'discover'
        ? buildStremioDetailUrl(contentMode, selectedDiscoverItem, selectedSeriesSeason, selectedSeriesEpisode)
        : null,
    [activeTab, contentMode, selectedDiscoverItem, selectedSeriesEpisode, selectedSeriesSeason]
  );

  const canOpenStremioDetail = Boolean(stremioDetailUrl);

  const seriesMetaEntry = selectedDiscoverItem ? seriesMetaById[selectedDiscoverItem.id] : null;
  const seriesVideos = Array.isArray(seriesMetaEntry?.videos) ? seriesMetaEntry.videos : [];
  const seriesMetaLoading = Boolean(
    contentMode === 'series' && selectedDiscoverItem && (!seriesMetaEntry || seriesMetaEntry.loading)
  );
  const seriesMetaError = seriesMetaEntry?.error ? String(seriesMetaEntry.error) : '';

  const seasonOptions = useMemo(() => seasonsFromVideos(seriesVideos), [seriesVideos]);
  const episodeOptions = useMemo(
    () => episodesForSeason(seriesVideos, selectedSeriesSeason).map((v) => Number(v.episode)),
    [selectedSeriesSeason, seriesVideos]
  );

  const filteredDiscovery = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return discoveryItems;
    return discoveryItems.filter((item) => String(item.name || '').toLowerCase().includes(q));
  }, [discoveryItems, searchQuery]);
  const filteredLocal = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return localFiles;
    return localFiles.filter((item) => String(item.name || '').toLowerCase().includes(q));
  }, [localFiles, searchQuery]);

  const localFilesThumbSignature = useMemo(
    () => filteredLocal.map((f) => `${f.path}\0${f.modifiedAt || ''}`).join('|'),
    [filteredLocal]
  );

  useEffect(() => {
    thumbnailByPathRef.current = thumbnailByPath;
  }, [thumbnailByPath]);

  useEffect(() => {
    if (activeSpaceId !== 'mediahub' || activeTab !== 'local') return undefined;
    const api = window.api?.mediaHub?.getFileThumbnail;
    if (typeof api !== 'function') return undefined;

    const paths = new Set(filteredLocal.map((f) => f.path).filter(Boolean));
    for (const p of thumbMtimeRef.current.keys()) {
      if (!paths.has(p)) thumbMtimeRef.current.delete(p);
    }
    setThumbnailByPath((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!paths.has(k)) delete next[k];
      }
      return next;
    });

    let cancelled = false;
    const queue = [];
    for (const file of filteredLocal) {
      if (!file?.path) continue;
      const m = file.modifiedAt || '';
      if (
        thumbMtimeRef.current.get(file.path) === m &&
        thumbnailByPathRef.current[file.path]
      ) {
        continue;
      }
      queue.push(file);
    }

    let active = 0;
    const maxConcurrent = 3;

    const pump = () => {
      if (cancelled) return;
      while (active < maxConcurrent && queue.length > 0) {
        const file = queue.shift();
        if (!file?.path) continue;
        active += 1;
        api({ filePath: file.path, maxWidth: 400, maxHeight: 400 })
          .then((res) => {
            if (cancelled) return;
            if (res?.success && res?.fileUrl) {
              thumbMtimeRef.current.set(file.path, file.modifiedAt || '');
              setThumbnailByPath((prev) => {
                if (prev[file.path] === res.fileUrl) return prev;
                return { ...prev, [file.path]: res.fileUrl };
              });
            }
          })
          .finally(() => {
            active -= 1;
            if (!cancelled) pump();
          });
      }
    };

    pump();
    return () => {
      cancelled = true;
    };
  }, [activeSpaceId, activeTab, localFilesThumbSignature]);
  const updateUi = useCallback((patch) => {
    setMediaHubState({ ui: patch });
  }, [setMediaHubState]);

  const clearSelection = useCallback(() => {
    updateUi({
      selectedItemId: null,
      launchFallbackMessage: '',
      selectedSeriesSeason: null,
      selectedSeriesEpisode: null,
    });
  }, [updateUi]);

  const showDetailAside = Boolean(selectedItem && isLgUp);
  const showDetailOverlay = Boolean(selectedItem && !isLgUp);

  useEffect(() => {
    if (!showDetailOverlay) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') clearSelection();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDetailOverlay, clearSelection]);

  const scanFolder = useCallback(async (folderPathOverride, options = {}) => {
    const folderPath = folderPathOverride || localState.folderPath;
    if (!folderPath || !window.api?.mediaHub?.scanFolder) return;
    const { force = false } = options;
    if (force) {
      autoScannedFolderKeysRef.current.delete(`local:${folderPath}`);
    }
    setMediaHubState({
      sources: {
        local: { loading: true, error: null, folderPath },
      },
    });
    try {
      const result = await window.api.mediaHub.scanFolder({
        folderPath,
        maxFiles: LOCAL_MEDIA_LIMIT,
        maxDepth: 3,
      });
      if (!result?.success) {
        setMediaHubState({
          sources: {
            local: { loading: false, error: result?.error || 'Failed to scan folder' },
          },
        });
        return;
      }
      setMediaHubState({
        sources: {
          local: {
            loading: false,
            error: null,
            folderPath: result.folderPath || folderPath,
            files: Array.isArray(result.files) ? result.files : [],
            scannedAt: result.scannedAt || new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      setMediaHubState({
        sources: {
          local: { loading: false, error: error?.message || 'Failed to scan folder' },
        },
      });
    }
  }, [localState.folderPath, setMediaHubState]);

  const pickFolder = useCallback(async () => {
    if (!window.api?.mediaHub?.pickFolder) return;
    const result = await window.api.mediaHub.pickFolder();
    if (!result?.success || !result.folderPath) return;
    await scanFolder(result.folderPath, { force: true });
  }, [scanFolder]);

  /** First-time default: OS Videos folder when library path has never been set (empty). */
  useEffect(() => {
    if (activeSpaceId !== 'mediahub' || activeTab !== 'local') return undefined;
    if (localState.folderPath) return undefined;
    let cancelled = false;
    const run = async () => {
      const api = window.api?.mediaHub?.getDefaultLibraryPath;
      if (typeof api !== 'function') return;
      const result = await api();
      if (cancelled || !result?.success || !result.path) return;
      setMediaHubState({
        sources: {
          local: { folderPath: result.path },
        },
      });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [activeSpaceId, activeTab, localState.folderPath, setMediaHubState]);

  useEffect(() => {
    if (activeSpaceId !== 'mediahub' || activeTab !== 'discover') return undefined;
    const cacheKey = `${contentMode}`;
    const state = useConsolidatedAppStore.getState();
    const liveCinemeta = state.mediaHub?.sources?.cinemeta || EMPTY_OBJECT;
    const catalogCache = state.mediaHub?.sources?.catalogCache || EMPTY_OBJECT;
    const cached = catalogCache[cacheKey];
    const cacheHasItems = Array.isArray(cached?.items) && cached.items.length > 0;
    const liveHasItems = Array.isArray(liveCinemeta?.items) && liveCinemeta.items.length > 0;

    if (cacheHasItems) {
      const cacheAlreadyApplied =
        liveCinemeta.fetchedAt === cached.fetchedAt &&
        liveCinemeta.loading === false &&
        !liveCinemeta.error;
      if (!cacheAlreadyApplied) {
        setMediaHubState({
          sources: {
            cinemeta: {
              items: cached.items,
              fetchedAt: cached.fetchedAt || Date.now(),
              loading: false,
              error: null,
            },
          },
        });
      }
    }

    if (discoverAbortRef.current) discoverAbortRef.current.abort();
    const controller = new AbortController();
    discoverAbortRef.current = controller;

    if (!liveHasItems && !cacheHasItems) {
      setMediaHubState({ sources: { cinemeta: { loading: true, error: null } } });
    }

    fetch(`${CINEMETA_URL}/catalog/${contentMode}/top.json`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        const items = Array.isArray(data?.metas) ? data.metas : [];
        const fetchedAt = Date.now();
        setMediaHubState({
          sources: {
            cinemeta: {
              items,
              fetchedAt,
              loading: false,
              error: null,
            },
            catalogCache: {
              [cacheKey]: { items, fetchedAt },
            },
          },
        });
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setMediaHubState({
          sources: {
            cinemeta: { loading: false, error: error?.message || 'Could not fetch catalog' },
          },
        });
      });
    return () => controller.abort();
  }, [activeSpaceId, activeTab, contentMode, setMediaHubState]);

  useEffect(() => {
    if (activeSpaceId !== 'mediahub' || activeTab !== 'local') return;
    if (!localState.folderPath || localFiles.length > 0 || localState.loading) return;
    const autoScanKey = `local:${localState.folderPath}`;
    if (autoScannedFolderKeysRef.current.has(autoScanKey)) return;
    autoScannedFolderKeysRef.current.add(autoScanKey);
    scanFolder(localState.folderPath);
  }, [activeSpaceId, activeTab, localFiles.length, localState.folderPath, localState.loading, scanFolder]);

  const fetchSeriesMeta = useCallback(
    async (item) => {
      if (!item?.id) return;
      const prev = seriesMetaById[item.id];
      if (prev?.videos?.length) return;
      if (prev?.loading) return;
      if (seriesMetaAbortRef.current) seriesMetaAbortRef.current.abort();
      const controller = new AbortController();
      seriesMetaAbortRef.current = controller;
      setMediaHubState({
        sources: {
          seriesMetaById: {
            [item.id]: { loading: true, error: null, videos: [], meta: null },
          },
        },
      });
      try {
        const response = await fetch(`${CINEMETA_URL}/meta/series/${encodeURIComponent(item.id)}.json`, {
          signal: controller.signal,
        });
        const data = await response.json();
        const videos = Array.isArray(data?.meta?.videos) ? data.meta.videos : [];
        setMediaHubState({
          sources: {
            seriesMetaById: {
              [item.id]: {
                loading: false,
                meta: data?.meta || null,
                videos,
                error: videos.length ? null : 'No episodes in catalog.',
              },
            },
          },
        });
      } catch (error) {
        if (error?.name === 'AbortError') return;
        setMediaHubState({
          sources: {
            seriesMetaById: {
              [item.id]: {
                loading: false,
                videos: [],
                error: error?.message || 'Could not load episodes.',
              },
            },
          },
        });
      }
    },
    [seriesMetaById, setMediaHubState]
  );

  const openDiscoverItem = useCallback(
    async (item) => {
      if (!item) return;
      updateUi({
        selectedItemId: item.id,
        launchFallbackMessage: '',
        selectedSeriesSeason: null,
        selectedSeriesEpisode: null,
      });
      if (contentMode === 'series') {
        await fetchSeriesMeta(item);
      }
    },
    [contentMode, fetchSeriesMeta, updateUi]
  );

  useEffect(() => {
    if (contentMode !== 'series' || !selectedDiscoverItem) return;
    const entry = seriesMetaById[selectedDiscoverItem.id];
    if (!entry?.videos?.length) return;
    if (selectedSeriesSeason != null && selectedSeriesEpisode != null) return;
    const first = pickFirstEpisode(entry.videos);
    if (first) {
      updateUi({
        selectedSeriesSeason: Number(first.season),
        selectedSeriesEpisode: Number(first.episode),
      });
    }
  }, [
    contentMode,
    selectedDiscoverItem?.id,
    seriesMetaById,
    selectedSeriesSeason,
    selectedSeriesEpisode,
    updateUi,
  ]);

  const handleSeriesSeasonChange = useCallback(
    (season) => {
      const eps = episodesForSeason(seriesVideos, season);
      const nextEp = eps[0] ? Number(eps[0].episode) : 1;
      updateUi({ selectedSeriesSeason: season, selectedSeriesEpisode: nextEp });
    },
    [seriesVideos, updateUi]
  );

  const handleSeriesEpisodeChange = useCallback(
    (episode) => {
      updateUi({ selectedSeriesEpisode: episode });
    },
    [updateUi]
  );

  const launchWithPreferredPlayer = useCallback(async (targetPath) => {
    if (!window.api?.launchApp || !targetPath) return { ok: false, error: 'Launch API unavailable' };
    if (preferredPlayerPath) {
      const argsPrefix = preferredPlayerArgs?.trim() ? `${preferredPlayerArgs.trim()} ` : '';
      const payloadPath = `"${preferredPlayerPath}" ${argsPrefix}"${targetPath}"`;
      return window.api.launchApp({ type: 'exe', path: payloadPath, asAdmin: false });
    }
    return window.api.launchApp({ type: 'file', path: targetPath, asAdmin: false });
  }, [preferredPlayerArgs, preferredPlayerPath]);

  const handlePlayLocal = useCallback(async (item) => {
    if (!item?.path) return;
    const result = await launchWithFeedback({
      launch: () => launchWithPreferredPlayer(item.path),
      beginLaunchFeedback,
      endLaunchFeedback,
      showLaunchError,
      label: `Opening ${item.name}`,
      launchType: 'media-local',
      path: item.path,
      source: 'mediahub',
    });
    if (result?.ok !== false) {
      const prev = Array.isArray(library.recentLocalIds) ? library.recentLocalIds : [];
      const next = [item.id, ...prev.filter((id) => id !== item.id)].slice(0, 12);
      setMediaHubState({ library: { recentLocalIds: next } });
      updateUi({ launchFallbackMessage: '' });
      return;
    }
    updateUi({ launchFallbackMessage: result?.error || 'Unable to launch local file.' });
  }, [beginLaunchFeedback, endLaunchFeedback, launchWithPreferredPlayer, library.recentLocalIds, setMediaHubState, showLaunchError, updateUi]);

  const openStremioDetail = useCallback(async () => {
    if (!stremioDetailUrl) {
      updateUi({
        launchFallbackMessage:
          contentMode === 'series'
            ? 'Choose a season and episode before opening in Stremio.'
            : 'Unable to open this title in Stremio.',
      });
      return;
    }
    const api = window.api;
    let result;
    if (api?.launchApp) {
      result = await api.launchApp({
        type: 'url',
        path: stremioDetailUrl,
        asAdmin: false,
        foregroundProcessName: 'stremio',
      });
    } else if (api?.openExternalWithResult) {
      result = await api.openExternalWithResult(stremioDetailUrl);
    } else {
      try {
        api?.openExternal?.(stremioDetailUrl);
        result = { ok: true };
      } catch (e) {
        result = { ok: false, error: e?.message || String(e) };
      }
    }
    if (result?.ok !== false) {
      updateUi({ launchFallbackMessage: '' });
    } else {
      updateUi({ launchFallbackMessage: result?.error || 'Could not open Stremio.' });
    }
  }, [contentMode, stremioDetailUrl, updateUi]);

  const choosePreferredPlayer = useCallback(async () => {
    const result = await window.api?.selectExeOrShortcutFile?.();
    if (!result?.success || !result.file?.path) return;
    updateUi({ preferredPlayerPath: result.file.path, preferredPlayerArgs: result.file.args || '' });
  }, [updateUi]);

  const shellClass = ['media-hub-demo-shell', showDetailAside ? 'media-hub-demo-shell--detail-open' : '']
    .filter(Boolean)
    .join(' ');

  const contentFilterMode = contentMode === 'series' ? 'Series' : 'Movie';

  return (
    <section className="media-hub-space">
      <div className={shellClass}>
        <MotionDiv
          layout={false}
          className="media-hub-demo-main"
          variants={hubOrchestratorVariants}
          initial={false}
          animate={hubEntranceState}
          onAnimationComplete={
            hubEntranceState === 'show' ? () => onEntranceComplete(entranceKey) : undefined
          }
        >
          <MotionHeader className="media-hub-demo-header" variants={mediaHubShellBandVariants}>
            <div className="media-hub-demo-topbar">
              <div className="media-hub-demo-pill-group">
                {[
                  { id: 'discover', label: 'Discover', Icon: Clapperboard },
                  { id: 'local', label: 'Local', Icon: HardDrive },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      updateUi({
                        activeTab: id,
                        selectedItemId: null,
                        launchFallbackMessage: '',
                        selectedSeriesSeason: null,
                        selectedSeriesEpisode: null,
                      })
                    }
                    className={`media-hub-demo-pill ${activeTab === id ? 'media-hub-demo-pill--active' : ''}`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
                {activeTab === 'discover' ? (
                  <>
                    <div className="media-hub-demo-pill__divider" />
                    {['Movie', 'Series'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() =>
                          updateUi({
                            contentMode: mode.toLowerCase(),
                            selectedItemId: null,
                            selectedSeriesSeason: null,
                            selectedSeriesEpisode: null,
                          })
                        }
                        className={`media-hub-demo-pill ${contentFilterMode === mode ? 'media-hub-demo-pill--active' : ''}`}
                      >
                        {mode === 'Movie' ? <Film size={12} /> : <Tv size={12} />}
                        {mode}
                      </button>
                    ))}
                  </>
                ) : null}
              </div>

              <label className="media-hub-demo-search-wrap">
                <Search className="media-hub-demo-search-icon" size={16} />
                <input
                  value={searchQuery}
                  onChange={(e) => updateUi({ searchQuery: e.target.value })}
                  placeholder={activeTab === 'discover' ? 'Search catalog...' : 'Search local files...'}
                  className="media-hub-demo-search-input"
                />
              </label>
            </div>

            {activeTab === 'local' ? (
              <div className="media-hub-demo-toolbar">
                <button type="button" onClick={pickFolder} className="media-hub-demo-action">
                  <FolderSearch size={14} />
                  Pick Folder
                </button>
                <button
                  type="button"
                  onClick={() => scanFolder(undefined, { force: true })}
                  disabled={!localState.folderPath || localState.loading}
                  className="media-hub-demo-action"
                >
                  <RefreshCcw size={14} />
                  Rescan
                </button>
                <button type="button" onClick={choosePreferredPlayer} className="media-hub-demo-action">
                  <ExternalLink size={14} />
                  Preferred Player
                </button>
                {preferredPlayerPath ? (
                  <button
                    type="button"
                    onClick={() => updateUi({ preferredPlayerPath: '', preferredPlayerArgs: '' })}
                    className="media-hub-demo-action media-hub-demo-action--ghost"
                  >
                    <X size={14} />
                    Clear Player
                  </button>
                ) : null}
              </div>
            ) : null}
          </MotionHeader>

          <MotionDiv
            ref={hubScrollRef}
            className="media-hub-demo-grid-scroll"
            variants={mediaHubGridContainerVariants}
          >
            {activeTab === 'discover' ? (
              <MotionDiv
                key={`${activeTab}:${contentMode}:${searchQuery ? 'search' : 'base'}`}
                variants={GRID_LIST_PARENT_VARIANTS}
                initial={false}
                animate={hubEntranceState}
                className={
                  filteredDiscovery.length > MEDIA_HUB_DISCOVER_VIRTUAL_THRESHOLD
                    ? 'flex w-full min-h-0 flex-1 flex-col'
                    : 'w-full'
                }
              >
                <MediaHubDiscoverGrid
                  items={filteredDiscovery}
                  scrollRef={hubScrollRef}
                  renderItem={(item, index) => (
                    <MotionButton
                      key={item.id}
                      type="button"
                      custom={index}
                      layout
                      onClick={() => openDiscoverItem(item)}
                      whileHover={{ y: -12, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ duration: 0.22, ease: CARD_EASE }}
                      variants={mediaHubGridItemVariants}
                      className={`media-hub-demo-card ${selectedItemId === item.id ? 'media-hub-demo-card--selected' : ''}`}
                    >
                      {getPosterUrl(item) ? (
                        <MotionDiv className="media-hub-demo-card__media">
                          <img src={getPosterUrl(item)} alt={item.name} className="media-hub-poster" loading="lazy" />
                          <div className="media-hub-demo-card__veil" aria-hidden />
                        </MotionDiv>
                      ) : (
                        <div className="media-hub-poster media-hub-demo-card__media flex items-center justify-center text-[hsl(var(--text-tertiary))]">
                          <Video size={28} />
                        </div>
                      )}
                      <div className="media-hub-demo-card__body">
                        <p className="media-hub-demo-card__title">
                          {item.name}
                        </p>
                        <p className="media-hub-demo-card__meta">
                          {item.year || 'Unknown year'}
                        </p>
                      </div>
                      <div className="media-hub-demo-card__rating-chip">
                        {item.imdbRating ? Number(item.imdbRating).toFixed(1) : 'NR'}
                      </div>
                      <div className="media-hub-demo-card__hover-strip">
                        <span className="media-hub-demo-card__hover-title">{item.name}</span>
                        <span className="media-hub-demo-card__hover-meta">
                          {item.year || 'Unknown year'} · {item.imdbRating ? `${Number(item.imdbRating).toFixed(1)} IMDb` : 'No rating'}
                        </span>
                      </div>
                    </MotionButton>
                  )}
                />
              </MotionDiv>
            ) : (
              <MotionDiv
                key={`local:${localState.folderPath || 'none'}:${searchQuery ? 'q' : 'all'}`}
                variants={GRID_LIST_PARENT_VARIANTS}
                initial={false}
                animate={hubEntranceState}
                className="media-hub-demo-grid"
              >
                {filteredLocal.map((item, index) => {
                  const thumb = thumbnailByPath[item.path] || '';
                  return (
                    <MotionButton
                      key={item.id}
                      type="button"
                      custom={index}
                      layout
                      onClick={() =>
                        updateUi({
                          selectedItemId: item.id,
                          launchFallbackMessage: '',
                        })
                      }
                      whileHover={{ y: -10, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ duration: 0.22, ease: CARD_EASE }}
                      variants={mediaHubGridItemVariants}
                      className={`media-hub-demo-card ${selectedItemId === item.id ? 'media-hub-demo-card--selected' : ''}`}
                    >
                      {thumb ? (
                        <MotionDiv className="media-hub-demo-card__media">
                          <img src={thumb} alt={item.name} className="media-hub-poster" loading="lazy" />
                          <div className="media-hub-demo-card__veil" aria-hidden />
                        </MotionDiv>
                      ) : (
                        <div className="media-hub-poster media-hub-demo-card__media flex items-center justify-center text-[hsl(var(--text-tertiary))]">
                          <Video size={28} />
                        </div>
                      )}
                      <div className="media-hub-demo-card__body">
                        <p className="media-hub-demo-card__title">{item.name}</p>
                        <p className="media-hub-demo-card__meta">
                          {item.extension || 'File'} · {formatBytes(item.size)}
                        </p>
                      </div>
                      <div className="media-hub-demo-card__rating-chip">
                        {item.modifiedAt ? new Date(item.modifiedAt).getFullYear() : '--'}
                      </div>
                    </MotionButton>
                  );
                })}
                {searchQuery.trim() && filteredLocal.length === 0 && localFiles.length > 0 ? (
                  <p className="media-hub-demo-status">
                    No files match your search.
                  </p>
                ) : null}
                {!localState.loading &&
                !localState.error &&
                localState.folderPath &&
                !searchQuery.trim() &&
                localFiles.length === 0 ? (
                  <p className="media-hub-demo-status">
                    No supported media files in this folder. Try Pick Folder or add videos (mp4, mkv, …), then Rescan.
                  </p>
                ) : null}
              </MotionDiv>
            )}
            {(activeTab === 'discover' && cinemetaState.loading) || (activeTab === 'local' && localState.loading) ? (
              <p className="media-hub-demo-status">Loading...</p>
            ) : null}
          </MotionDiv>

          {activeTab === 'discover' && cinemetaState.error ? (
            <p className="media-hub-demo-status media-hub-demo-status--error">{cinemetaState.error}</p>
          ) : null}
          {activeTab === 'local' && localState.error ? (
            <p className="media-hub-demo-status media-hub-demo-status--error">{localState.error}</p>
          ) : null}
          {launchFallbackMessage ? (
            <p className="media-hub-demo-status media-hub-demo-status--warning">{launchFallbackMessage}</p>
          ) : null}
          {activeTab === 'local' ? (
            <div className="media-hub-demo-folder-meta">
              <p className="m-0">
                Library folder:{' '}
                <span>{localState.folderPath || 'Not set — resolving default…'}</span>
              </p>
              <p className="m-0">
                On first launch, Local uses your system Videos folder. Use Pick Folder to point elsewhere.
              </p>
            </div>
          ) : null}
        </MotionDiv>

        <AnimatePresence mode="wait">
          {showDetailAside && selectedItem ? (
            <MotionDiv
              key={`detail-aside:${selectedItem.id}`}
              initial={mediaHubAsideMotion.initial}
              animate={mediaHubAsideMotion.animate}
              exit={mediaHubAsideMotion.exit}
              transition={mediaHubAsideMotion.transition}
              className="media-hub-detail-aside-wrap min-h-0"
            >
              <MediaHubItemDetail
                variant="aside"
                selectedItem={selectedItem}
                activeTab={activeTab}
                contentMode={contentMode}
                onClose={clearSelection}
                canOpenStremioDetail={canOpenStremioDetail}
                onOpenStremioDetail={openStremioDetail}
                onPlayLocal={handlePlayLocal}
                formatBytes={formatBytes}
                seriesMetaLoading={seriesMetaLoading}
                seriesMetaError={seriesMetaError}
                seriesVideos={seriesVideos}
                selectedSeason={selectedSeriesSeason}
                selectedEpisode={selectedSeriesEpisode}
                seasonOptions={seasonOptions}
                episodeOptions={episodeOptions}
                onSeasonChange={handleSeriesSeasonChange}
                onEpisodeChange={handleSeriesEpisodeChange}
              />
            </MotionDiv>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {showDetailOverlay && selectedItem ? (
          <MotionDiv
            className="media-hub-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MotionDiv
              role="presentation"
              className="media-hub-detail-overlay__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={clearSelection}
            />
            <div className="media-hub-detail-overlay__center pointer-events-none">
              <MotionDiv
                key={`detail-overlay:${selectedItem.id}`}
                initial={mediaHubOverlayPanelMotion.initial}
                animate={mediaHubOverlayPanelMotion.animate}
                exit={mediaHubOverlayPanelMotion.exit}
                transition={mediaHubOverlayPanelMotion.transition}
                className="pointer-events-auto max-h-full w-full overflow-hidden px-3 py-6 sm:px-5"
                onClick={(e) => e.stopPropagation()}
              >
                <MediaHubItemDetail
                  variant="overlay"
                  selectedItem={selectedItem}
                  activeTab={activeTab}
                  contentMode={contentMode}
                  onClose={clearSelection}
                  canOpenStremioDetail={canOpenStremioDetail}
                  onOpenStremioDetail={openStremioDetail}
                  onPlayLocal={handlePlayLocal}
                  formatBytes={formatBytes}
                  seriesMetaLoading={seriesMetaLoading}
                  seriesMetaError={seriesMetaError}
                  seriesVideos={seriesVideos}
                  selectedSeason={selectedSeriesSeason}
                  selectedEpisode={selectedSeriesEpisode}
                  seasonOptions={seasonOptions}
                  episodeOptions={episodeOptions}
                  onSeasonChange={handleSeriesSeasonChange}
                  onEpisodeChange={handleSeriesEpisodeChange}
                />
              </MotionDiv>
            </div>
          </MotionDiv>
        ) : null}
      </AnimatePresence>

    </section>
  );
}
