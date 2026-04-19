import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, m } from 'framer-motion';
import {
  Calendar,
  Clapperboard,
  ExternalLink,
  Film,
  Folder,
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
import { groupLocalFilesByFolder } from './mediaHubLocalUtils';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import WToggle from '../../ui/WToggle';
import MediaHubStreamOpenModal from './MediaHubStreamOpenModal';
import './MediaHubSpace.css';

const MotionDiv = m.div;
const MotionButton = m.button;
const CINEMETA_URL = 'https://v3-cinemeta.strem.io';
const TORRENTIO_URL = 'https://torrentio.strem.fun';
const GENRES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Animation'];
const LOCAL_MEDIA_LIMIT = 350;
const CARD_EASE = [0.22, 1, 0.36, 1];
const EMPTY_OBJECT = Object.freeze({});
/** Matches hub-stremio prototype spring for detail surfaces */
const SPRING_DETAIL = { type: 'spring', stiffness: 350, damping: 28, mass: 1 };
const GRID_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.02,
    },
  },
};

const GRID_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, ease: CARD_EASE } },
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

function normalizeStreamLabel(stream) {
  const raw = String(stream?.title || stream?.name || 'Unnamed stream');
  return raw.split('\n')[0] || raw;
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

function discoverStreamCacheKey(item, contentMode, season, episode) {
  if (!item?.id) return null;
  if (contentMode === 'movie') return String(item.id);
  if (Number.isFinite(Number(season)) && Number.isFinite(Number(episode))) {
    return `${item.id}:${Number(season)}:${Number(episode)}`;
  }
  return null;
}

/**
 * Shared detail body: hero + badges + description + sources (hub-stremio hierarchy, tokenized).
 */
function MediaHubItemDetail({
  variant,
  selectedItem,
  activeTab,
  contentMode,
  onClose,
  streamsLoading,
  selectedStreams,
  onOpenStreamModal,
  onPlayLocal,
  normalizeStreamLabel: normLabel,
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

  const firstStream = selectedStreams?.[0] || null;
  const canWatchDiscover = isDiscover && !streamsLoading && firstStream;

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
                    className="media-hub-tray-select w-full min-w-0 rounded-xl border border-[hsl(var(--border-primary)/0.55)] bg-[hsl(var(--surface-primary)/0.5)] px-3 py-2 text-[12px] font-bold text-[hsl(var(--text-primary))]"
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
                    className="media-hub-tray-select w-full min-w-0 rounded-xl border border-[hsl(var(--border-primary)/0.55)] bg-[hsl(var(--surface-primary)/0.5)] px-3 py-2 text-[12px] font-bold text-[hsl(var(--text-primary))]"
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
          <>
            <div>
              <h3 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--text-tertiary))]">
                Available sources
              </h3>
              <div className="mt-3 space-y-2">
                {streamsLoading ? (
                  [1, 2, 3, 4].map((i) => <div key={`skeleton-${i}`} className="media-hub-stream-skeleton" />)
                ) : selectedStreams.length === 0 ? (
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
                    No stream sources loaded.
                  </p>
                ) : (
                  selectedStreams.slice(0, 12).map((stream, idx) => (
                    <MotionButton
                      key={`${selectedItem.id}-${idx}`}
                      type="button"
                      onClick={() => onOpenStreamModal(stream)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ duration: 0.16 }}
                      className="group flex w-full items-center justify-between rounded-2xl border border-[hsl(var(--border-primary)/0.5)] bg-[hsl(var(--surface-primary)/0.45)] p-3 text-left transition-colors hover:border-[hsl(var(--border-primary)/0.75)] hover:bg-[hsl(var(--surface-secondary)/0.5)]"
                    >
                      <span className="truncate text-[11px] font-black uppercase tracking-[0.06em] text-[hsl(var(--text-primary))] group-hover:text-[hsl(var(--text-primary))]">
                        {normLabel(stream)}
                      </span>
                      <span className="shrink-0 pl-2 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--text-tertiary))] group-hover:text-[hsl(var(--primary))]">
                        Play
                      </span>
                    </MotionButton>
                  ))
                )}
              </div>
            </div>
            <div className="mt-auto border-t border-[hsl(var(--border-primary)/0.35)] pt-4">
              <MotionButton
                type="button"
                disabled={!canWatchDiscover}
                whileHover={canWatchDiscover ? { scale: 1.01 } : undefined}
                whileTap={canWatchDiscover ? { scale: 0.99 } : undefined}
                onClick={() => firstStream && onOpenStreamModal(firstStream)}
                className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] border border-[hsl(var(--primary)/0.55)] bg-[hsl(var(--primary))] py-4 text-[10px] font-black uppercase tracking-[0.25em] text-[hsl(var(--text-on-accent))] shadow-[0_12px_28px_-12px_hsl(var(--primary)/0.55)] disabled:cursor-not-allowed disabled:border-[hsl(var(--border-primary)/0.6)] disabled:bg-[hsl(var(--surface-tertiary)/0.8)] disabled:text-[hsl(var(--text-tertiary))] disabled:shadow-none"
              >
                <Play size={18} fill="currentColor" />
                Watch now
              </MotionButton>
            </div>
          </>
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
    activeGenreRaw,
    searchQueryRaw,
    selectedItemIdRaw,
    preferredPlayerPathRaw,
    preferredPlayerArgsRaw,
    launchFallbackMessageRaw,
    frostedTrayEnabledRaw,
    cinemetaStateRaw,
    catalogCacheRaw,
    localStateRaw,
    streamsByIdRaw,
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
      activeGenreRaw: state.mediaHub?.ui?.activeGenre,
      searchQueryRaw: state.mediaHub?.ui?.searchQuery,
      selectedItemIdRaw: state.mediaHub?.ui?.selectedItemId,
      preferredPlayerPathRaw: state.mediaHub?.ui?.preferredPlayerPath,
      preferredPlayerArgsRaw: state.mediaHub?.ui?.preferredPlayerArgs,
      launchFallbackMessageRaw: state.mediaHub?.ui?.launchFallbackMessage,
      frostedTrayEnabledRaw: state.mediaHub?.ui?.frostedTrayEnabled,
      selectedSeriesSeasonRaw: state.mediaHub?.ui?.selectedSeriesSeason,
      selectedSeriesEpisodeRaw: state.mediaHub?.ui?.selectedSeriesEpisode,
      cinemetaStateRaw: state.mediaHub?.sources?.cinemeta,
      catalogCacheRaw: state.mediaHub?.sources?.catalogCache,
      localStateRaw: state.mediaHub?.sources?.local,
      streamsByIdRaw: state.mediaHub?.sources?.streamsById,
      seriesMetaByIdRaw: state.mediaHub?.sources?.seriesMetaById,
      libraryRaw: state.mediaHub?.library,
      setMediaHubState: state.actions.setMediaHubState,
      activeSpaceId: state.spaces.activeSpaceId,
    }))
  );
  const { beginLaunchFeedback, endLaunchFeedback, showLaunchError } = useLaunchFeedback();
  const discoverAbortRef = useRef(null);
  const streamAbortRef = useRef(null);
  const seriesMetaAbortRef = useRef(null);
  const autoScannedFolderKeysRef = useRef(new Set());
  const isLgUp = useMinWidth1024();
  const [streamModalTarget, setStreamModalTarget] = useState(null);
  const [streamModalOpen, setStreamModalOpen] = useState(false);

  const activeTab = activeTabRaw || 'discover';
  const contentMode = contentModeRaw || 'movie';
  const activeGenre = activeGenreRaw || 'All';
  const searchQuery = searchQueryRaw || '';
  const selectedItemId = selectedItemIdRaw || null;
  const preferredPlayerPath = preferredPlayerPathRaw || '';
  const preferredPlayerArgs = preferredPlayerArgsRaw || '';
  const launchFallbackMessage = launchFallbackMessageRaw || '';
  const frostedTrayEnabled = frostedTrayEnabledRaw !== false;
  const selectedSeriesSeason =
    selectedSeriesSeasonRaw != null && Number.isFinite(Number(selectedSeriesSeasonRaw))
      ? Number(selectedSeriesSeasonRaw)
      : null;
  const selectedSeriesEpisode =
    selectedSeriesEpisodeRaw != null && Number.isFinite(Number(selectedSeriesEpisodeRaw))
      ? Number(selectedSeriesEpisodeRaw)
      : null;
  const cinemetaState = cinemetaStateRaw || EMPTY_OBJECT;
  const catalogCache = catalogCacheRaw || EMPTY_OBJECT;
  const localState = localStateRaw || EMPTY_OBJECT;
  const streamsById = streamsByIdRaw || EMPTY_OBJECT;
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

  const streamCacheKey = useMemo(
    () =>
      selectedItem && activeTab === 'discover'
        ? discoverStreamCacheKey(selectedItem, contentMode, selectedSeriesSeason, selectedSeriesEpisode)
        : null,
    [activeTab, contentMode, selectedItem, selectedSeriesEpisode, selectedSeriesSeason]
  );

  const streamsCacheEntry = useMemo(() => {
    if (streamCacheKey == null) return undefined;
    return streamsById[streamCacheKey];
  }, [streamCacheKey, streamsById]);

  const selectedStreams = useMemo(() => {
    if (!selectedItem || activeTab !== 'discover' || streamCacheKey == null) return [];
    return Array.isArray(streamsCacheEntry) ? streamsCacheEntry : [];
  }, [activeTab, selectedItem, streamCacheKey, streamsCacheEntry]);

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

  const streamsLoading = Boolean(
    selectedItem &&
      activeTab === 'discover' &&
      (contentMode === 'movie'
        ? streamsById[selectedItem.id] === undefined
        : seriesMetaLoading ||
            (seriesMetaEntry &&
              !seriesMetaLoading &&
              seriesVideos.length > 0 &&
              (selectedSeriesSeason == null || selectedSeriesEpisode == null)) ||
            (Number.isFinite(selectedSeriesSeason) &&
              Number.isFinite(selectedSeriesEpisode) &&
              streamCacheKey != null &&
              streamsCacheEntry === undefined))
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

  const localFolderGroups = useMemo(() => {
    const root = localState.folderPath;
    if (!root || activeTab !== 'local') return [];
    return groupLocalFilesByFolder(root, filteredLocal);
  }, [activeTab, filteredLocal, localState.folderPath]);
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
    const cacheKey = `${contentMode}:${activeGenre}`;
    const cached = catalogCache?.[cacheKey];
    if (cached?.items?.length) {
      const alreadyAppliedCache =
        cinemetaState.items === cached.items &&
        cinemetaState.loading === false &&
        !cinemetaState.error;
      if (alreadyAppliedCache) return undefined;
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
      return undefined;
    }
    if (discoverAbortRef.current) discoverAbortRef.current.abort();
    const controller = new AbortController();
    discoverAbortRef.current = controller;
    if (!(cinemetaState.loading && !cinemetaState.error)) {
      setMediaHubState({ sources: { cinemeta: { loading: true, error: null } } });
    }
    const genrePart = activeGenre === 'All' ? '' : `genre=${encodeURIComponent(activeGenre)}`;
    fetch(`${CINEMETA_URL}/catalog/${contentMode}/top.json?${genrePart}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        const items = Array.isArray(data?.metas) ? data.metas : [];
        setMediaHubState({
          sources: {
            cinemeta: {
              items,
              fetchedAt: Date.now(),
              loading: false,
              error: null,
            },
            catalogCache: {
              [cacheKey]: { items, fetchedAt: Date.now() },
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
  }, [activeGenre, activeSpaceId, activeTab, catalogCache, cinemetaState.error, cinemetaState.items, cinemetaState.loading, contentMode, setMediaHubState]);

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
      const imdbOrMetaId = item.imdb_id || item.id;
      if (contentMode === 'movie') {
        if (streamsById[item.id] !== undefined) return;
        if (streamAbortRef.current) streamAbortRef.current.abort();
        const controller = new AbortController();
        streamAbortRef.current = controller;
        try {
          const response = await fetch(`${TORRENTIO_URL}/stream/movie/${imdbOrMetaId}.json`, {
            signal: controller.signal,
          });
          const data = await response.json();
          setMediaHubState({
            sources: {
              streamsById: {
                [item.id]: Array.isArray(data?.streams) ? data.streams : [],
              },
            },
          });
        } catch (error) {
          if (error?.name === 'AbortError') return;
          setMediaHubState({
            ui: { launchFallbackMessage: error?.message || 'Could not fetch stream sources.' },
            sources: {
              streamsById: {
                [item.id]: [],
              },
            },
          });
        }
        return;
      }
      await fetchSeriesMeta(item);
    },
    [contentMode, fetchSeriesMeta, setMediaHubState, streamsById, updateUi]
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

  useEffect(() => {
    if (activeSpaceId !== 'mediahub' || activeTab !== 'discover' || contentMode !== 'series') return undefined;
    if (!selectedDiscoverItem) return undefined;
    if (selectedSeriesSeason == null || selectedSeriesEpisode == null) return undefined;
    const key = discoverStreamCacheKey(selectedDiscoverItem, 'series', selectedSeriesSeason, selectedSeriesEpisode);
    if (!key) return undefined;
    if (streamsCacheEntry !== undefined) return undefined;
    const imdbOrMetaId = selectedDiscoverItem.imdb_id || selectedDiscoverItem.id;
    const streamPathId = `${imdbOrMetaId}:${selectedSeriesSeason}:${selectedSeriesEpisode}`;
    if (streamAbortRef.current) streamAbortRef.current.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${TORRENTIO_URL}/stream/series/${streamPathId}.json`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (cancelled) return;
        setMediaHubState({
          sources: {
            streamsById: {
              [key]: Array.isArray(data?.streams) ? data.streams : [],
            },
          },
        });
      } catch (error) {
        if (error?.name === 'AbortError') return;
        if (cancelled) return;
        setMediaHubState({
          ui: { launchFallbackMessage: error?.message || 'Could not fetch stream sources.' },
          sources: {
            streamsById: {
              [key]: [],
            },
          },
        });
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    activeSpaceId,
    activeTab,
    contentMode,
    selectedDiscoverItem?.id,
    selectedSeriesSeason,
    selectedSeriesEpisode,
    setMediaHubState,
    streamsCacheEntry,
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

  const openStreamModal = useCallback((stream) => {
    if (!stream) return;
    setStreamModalTarget(stream);
    setStreamModalOpen(true);
  }, []);

  const closeStreamModal = useCallback(() => {
    setStreamModalOpen(false);
  }, []);

  const onStreamModalExitComplete = useCallback(() => {
    setStreamModalTarget(null);
  }, []);

  const recordRecentStream = useCallback(
    (stream) => {
      const episodeKey =
        selectedItem?.id &&
        contentMode === 'series' &&
        selectedSeriesSeason != null &&
        selectedSeriesEpisode != null
          ? `${selectedItem.id}:${selectedSeriesSeason}:${selectedSeriesEpisode}`
          : null;
      const key = episodeKey || selectedItem?.id || normalizeStreamLabel(stream);
      const prev = Array.isArray(library.recentStreamIds) ? library.recentStreamIds : [];
      const next = [key, ...prev.filter((id) => id !== key)].slice(0, 20);
      setMediaHubState({ library: { recentStreamIds: next } });
      updateUi({ launchFallbackMessage: '' });
    },
    [
      contentMode,
      library.recentStreamIds,
      selectedItem?.id,
      selectedSeriesEpisode,
      selectedSeriesSeason,
      setMediaHubState,
      updateUi,
    ]
  );

  const choosePreferredPlayer = useCallback(async () => {
    const result = await window.api?.selectExeOrShortcutFile?.();
    if (!result?.success || !result.file?.path) return;
    updateUi({ preferredPlayerPath: result.file.path, preferredPlayerArgs: result.file.args || '' });
  }, [updateUi]);

  const mainPanelClass = [
    'media-hub-panel',
    'flex',
    'min-h-0',
    'flex-col',
    'p-4',
    'md:p-5',
    frostedTrayEnabled ? 'media-hub-panel--tray-frosted-on' : 'media-hub-panel--tray-frosted-off',
  ].join(' ');

  const shellClass = ['media-hub-shell', showDetailAside ? 'media-hub-shell--detail-open' : ''].filter(Boolean).join(' ');

  const spaceSectionClass = ['media-hub-space', !frostedTrayEnabled ? 'media-hub-space--tray-airy' : ''].filter(Boolean).join(' ');

  return (
    <section className={spaceSectionClass}>
      <div className={shellClass}>
        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={mainPanelClass}
        >
          <header className="media-hub-header mb-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="media-hub-brand-eyebrow m-0 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--text-secondary))]">
                  Media Hub
                </p>
                <h1 className="media-hub-brand-title m-0 text-3xl font-black uppercase italic tracking-tight text-[hsl(var(--text-primary))]">
                  Discover & Local
                </h1>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className="media-hub-tray-segment">
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
                      className={`media-hub-tray-tab rounded-full px-3 py-2 ${activeTab === id ? 'media-hub-tray-tab--active' : ''}`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="media-hub-tray-settings-row">
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[10px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">Preferred player</p>
                <p className="m-0 mt-0.5 truncate text-[11px] font-bold text-[hsl(var(--text-primary))]">{preferredPlayerPath || 'System default'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={choosePreferredPlayer}
                    className="inline-flex h-8 items-center gap-2 rounded-lg border border-[hsl(var(--border-primary)/0.75)] px-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-primary))]"
                  >
                    <ExternalLink size={12} />
                    Choose
                  </button>
                  {preferredPlayerPath ? (
                    <button
                      type="button"
                      onClick={() => updateUi({ preferredPlayerPath: '', preferredPlayerArgs: '' })}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-[hsl(var(--border-primary)/0.75)] px-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]"
                    >
                      <X size={12} />
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
              <WToggle
                checked={frostedTrayEnabled}
                onChange={(next) => updateUi({ frostedTrayEnabled: next })}
                label="Frosted tray"
                containerClassName="shrink-0 lg:flex-col lg:items-end"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-tertiary))]" size={16} />
                <input
                  value={searchQuery}
                  onChange={(e) => updateUi({ searchQuery: e.target.value })}
                  placeholder={activeTab === 'discover' ? 'Search catalog...' : 'Search local files...'}
                  className="media-hub-tray-input w-full min-w-0"
                />
              </label>
              {activeTab === 'discover' ? (
                <>
                  <div className="media-hub-tray-segment-bar">
                    <button
                      type="button"
                      onClick={() =>
                        updateUi({
                          contentMode: 'movie',
                          selectedItemId: null,
                          selectedSeriesSeason: null,
                          selectedSeriesEpisode: null,
                        })
                      }
                      className={`media-hub-tray-tab ${contentMode === 'movie' ? 'media-hub-tray-tab--active' : ''}`}
                    >
                      <Film size={13} />
                      Movies
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateUi({
                          contentMode: 'series',
                          selectedItemId: null,
                          selectedSeriesSeason: null,
                          selectedSeriesEpisode: null,
                        })
                      }
                      className={`media-hub-tray-tab ${contentMode === 'series' ? 'media-hub-tray-tab--active' : ''}`}
                    >
                      <Tv size={13} />
                      Series
                    </button>
                  </div>
                  <select
                    value={activeGenre}
                    onChange={(e) =>
                      updateUi({
                        activeGenre: e.target.value,
                        selectedItemId: null,
                        selectedSeriesSeason: null,
                        selectedSeriesEpisode: null,
                      })
                    }
                    className="media-hub-tray-select w-auto min-w-[8.5rem]"
                  >
                    {GENRES.map((genre) => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <button type="button" onClick={pickFolder} className="media-hub-tray-action-btn">
                    <FolderSearch size={14} />
                    Pick Folder
                  </button>
                  <button type="button" onClick={() => scanFolder(undefined, { force: true })} disabled={!localState.folderPath || localState.loading} className="media-hub-tray-action-btn">
                    <RefreshCcw size={14} />
                    Rescan
                  </button>
                </>
              )}
            </div>
          </header>

          <div className="media-hub-grid-scroll flex-1 pr-1">
            {activeTab === 'discover' ? (
              <MotionDiv
                key={`${activeTab}:${contentMode}:${activeGenre}:${searchQuery ? 'search' : 'base'}`}
                variants={GRID_VARIANTS}
                initial="hidden"
                animate="show"
                className="media-hub-grid"
              >
                {filteredDiscovery.map((item) => (
                  <MotionButton
                    key={item.id}
                    type="button"
                    onClick={() => openDiscoverItem(item)}
                    whileHover={{ y: -5, scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.22, ease: CARD_EASE }}
                    variants={GRID_ITEM_VARIANTS}
                    className={`media-hub-card media-hub-card--interactive p-2 text-left ${selectedItemId === item.id ? 'media-hub-card--selected' : ''}`}
                  >
                    {getPosterUrl(item) ? (
                      <MotionDiv className="relative overflow-hidden rounded-[0.95rem]">
                        <img src={getPosterUrl(item)} alt={item.name} className="media-hub-poster" loading="lazy" />
                        <div className="media-hub-card__veil absolute inset-0" aria-hidden />
                        <div className="media-hub-card__cta absolute bottom-2 left-2 right-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-on-accent))]">
                          <Play size={13} />
                          Open sources
                        </div>
                      </MotionDiv>
                    ) : (
                      <div className="media-hub-poster flex items-center justify-center text-[hsl(var(--text-tertiary))]">
                        <Video size={28} />
                      </div>
                    )}
                    <div className="px-1 pb-1 pt-2">
                      <p className="media-hub-card__title m-0 truncate text-[11px] font-black uppercase tracking-wide text-[hsl(var(--text-primary))]">
                        {item.name}
                      </p>
                      <p className="media-hub-card__meta m-0 mt-1 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                        {item.year || 'Unknown year'}
                      </p>
                    </div>
                  </MotionButton>
                ))}
              </MotionDiv>
            ) : (
              <MotionDiv
                key={`local:${localState.folderPath || 'none'}:${searchQuery ? 'q' : 'all'}`}
                variants={GRID_VARIANTS}
                initial="hidden"
                animate="show"
                className="media-hub-local-groups"
              >
                {localFolderGroups.map((group) => (
                  <section key={group.key} className="media-hub-local-section" aria-label={group.title}>
                    <div className="media-hub-local-section__head">
                      <div className="media-hub-local-section__head-main">
                        <Folder size={16} className="media-hub-local-section__folder-icon shrink-0" aria-hidden />
                        <div className="min-w-0">
                          <h2 className="media-hub-local-section__title">{group.title}</h2>
                          {group.subtitle ? (
                            <p className="media-hub-local-section__subtitle">{group.subtitle}</p>
                          ) : null}
                        </div>
                      </div>
                      <span className="media-hub-local-section__count">{group.files.length}</span>
                    </div>
                    <div className="media-hub-grid media-hub-grid--section">
                      {group.files.map((item) => (
                        <MotionButton
                          key={item.id}
                          type="button"
                          onClick={() => updateUi({ selectedItemId: item.id, launchFallbackMessage: '' })}
                          whileHover={{ y: -5, scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          transition={{ duration: 0.22, ease: CARD_EASE }}
                          variants={GRID_ITEM_VARIANTS}
                          className={`media-hub-card media-hub-card--interactive media-hub-card--local-video p-2 text-left ${selectedItemId === item.id ? 'media-hub-card--selected' : ''}`}
                        >
                          <div className="media-hub-local-video-placeholder relative overflow-hidden rounded-[0.95rem]">
                            <div className="media-hub-local-video-placeholder__gradient" aria-hidden />
                            <Video className="media-hub-local-video-placeholder__icon" size={32} aria-hidden />
                            {item.extension ? (
                              <span className="media-hub-local-video-placeholder__badge">{item.extension.replace(/^\./, '')}</span>
                            ) : null}
                            <div className="media-hub-card__veil absolute inset-0" aria-hidden />
                            <div className="media-hub-card__cta absolute bottom-2 left-2 right-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-on-accent))]">
                              <Play size={13} />
                              Play video
                            </div>
                          </div>
                          <div className="px-1 pb-1 pt-2">
                            <p className="media-hub-card__title m-0 truncate text-[11px] font-black uppercase tracking-wide text-[hsl(var(--text-primary))]">
                              {item.name}
                            </p>
                            <p className="media-hub-card__meta m-0 mt-1 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                              {Number.isFinite(item.size) && item.size > 0 ? formatBytes(item.size) : 'Video'}
                            </p>
                          </div>
                        </MotionButton>
                      ))}
                    </div>
                  </section>
                ))}
                {searchQuery.trim() && filteredLocal.length === 0 && localFiles.length > 0 ? (
                  <p className="m-0 mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                    No files match your search.
                  </p>
                ) : null}
                {!localState.loading &&
                !localState.error &&
                localState.folderPath &&
                !searchQuery.trim() &&
                localFiles.length === 0 ? (
                  <p className="m-0 mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                    No supported media files in this folder. Try Pick Folder or add videos (mp4, mkv, …), then Rescan.
                  </p>
                ) : null}
              </MotionDiv>
            )}
            {(activeTab === 'discover' && cinemetaState.loading) || (activeTab === 'local' && localState.loading) ? (
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">Loading...</p>
            ) : null}
          </div>

          {activeTab === 'discover' && cinemetaState.error ? (
            <p className="m-0 mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--state-error))]">{cinemetaState.error}</p>
          ) : null}
          {activeTab === 'local' && localState.error ? (
            <p className="m-0 mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--state-error))]">{localState.error}</p>
          ) : null}
          {launchFallbackMessage ? (
            <p className="m-0 mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--state-warning))]">{launchFallbackMessage}</p>
          ) : null}
          {activeTab === 'local' ? (
            <div className="mt-2 space-y-1">
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                Library folder:{' '}
                <span className="text-[hsl(var(--text-primary))]">{localState.folderPath || 'Not set — resolving default…'}</span>
              </p>
              <p className="m-0 text-[10px] font-normal normal-case tracking-normal text-[hsl(var(--text-tertiary))]">
                On first launch, Local uses your system Videos folder. Use Pick Folder to point elsewhere.
              </p>
            </div>
          ) : null}
        </MotionDiv>

        <AnimatePresence mode="wait">
          {showDetailAside && selectedItem ? (
            <MotionDiv
              key={`detail-aside:${selectedItem.id}`}
              initial={{ x: 60, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 30, opacity: 0, scale: 0.95 }}
              transition={SPRING_DETAIL}
              className="media-hub-detail-aside-wrap min-h-0"
            >
              <MediaHubItemDetail
                variant="aside"
                selectedItem={selectedItem}
                activeTab={activeTab}
                contentMode={contentMode}
                onClose={clearSelection}
                streamsLoading={streamsLoading}
                selectedStreams={selectedStreams}
                onOpenStreamModal={openStreamModal}
                onPlayLocal={handlePlayLocal}
                normalizeStreamLabel={normalizeStreamLabel}
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

      <AnimatePresence>
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
                initial={{ y: 48, opacity: 0, scale: 0.94 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 28, opacity: 0, scale: 0.96 }}
                transition={SPRING_DETAIL}
                className="pointer-events-auto max-h-full w-full overflow-hidden px-3 py-6 sm:px-5"
                onClick={(e) => e.stopPropagation()}
              >
                <MediaHubItemDetail
                  variant="overlay"
                  selectedItem={selectedItem}
                  activeTab={activeTab}
                  contentMode={contentMode}
                  onClose={clearSelection}
                  streamsLoading={streamsLoading}
                  selectedStreams={selectedStreams}
                  onOpenStreamModal={openStreamModal}
                  onPlayLocal={handlePlayLocal}
                  normalizeStreamLabel={normalizeStreamLabel}
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

      {streamModalTarget ? (
        <MediaHubStreamOpenModal
          isOpen={streamModalOpen}
          stream={streamModalTarget}
          onClose={closeStreamModal}
          onExitAnimationComplete={onStreamModalExitComplete}
          normalizeStreamLabel={normalizeStreamLabel}
          preferredPlayerPath={preferredPlayerPath}
          preferredPlayerArgs={preferredPlayerArgs}
          onSavePreferredPlayer={(path, args) =>
            updateUi({ preferredPlayerPath: path, preferredPlayerArgs: args || '' })
          }
          onOpenedSuccessfully={() => recordRecentStream(streamModalTarget)}
          mediaTitle={
            activeTab === 'discover' && selectedItem?.name
              ? contentMode === 'series' &&
                selectedSeriesSeason != null &&
                selectedSeriesEpisode != null
                ? `${selectedItem.name} · S${selectedSeriesSeason}E${String(selectedSeriesEpisode).padStart(2, '0')}`
                : selectedItem.name
              : ''
          }
        />
      ) : null}
    </section>
  );
}
