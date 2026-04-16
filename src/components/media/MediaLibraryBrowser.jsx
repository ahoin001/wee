import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Card from '../../ui/Card';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import { downloadMedia, getStoragePublicObjectUrl } from '../../utils/supabase';
import {
  MEDIA_LIBRARY_FILETYPE_OPTIONS,
  MEDIA_LIBRARY_SORT_OPTIONS,
  MEDIA_LIBRARY_PAGE_SIZE_OPTIONS,
  MEDIA_LIBRARY_DEFAULT_PAGE_SIZE,
} from '../../hooks/useMediaLibraryBrowser';
import '../settings/surfaceStyles.css';
import '../modals/ImageSearchModal.css';

/**
 * Browse tab UI for the media library — shared by ImageSearchModal and ChannelModal inline panel.
 */
function MediaLibraryBrowser({
  filter,
  setFilter,
  searchInput,
  setSearchInput,
  sortBy,
  setSortBy,
  pageSize,
  setPageSize,
  viewMode,
  setViewMode,
  loading,
  refreshing,
  error,
  setError,
  page,
  setPage,
  totalPages,
  totalCount,
  items,
  handleRefresh,
  onSelect,
  showDownload = true,
  compact = false,
  /** Channel modal: home-style tiles, minimal chrome, calmer toolbar */
  channelPicker = false,
}) {
  const [itemLoading, setItemLoading] = useState({});
  const [downloadSuccess, setDownloadSuccess] = useState({});

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
  }, [setError]);

  const handleMediaSelect = useCallback(
    (mediaItem) => {
      onSelect?.(mediaItem);
    },
    [onSelect]
  );

  const isInitialLoad = loading && items.length === 0;
  const hasResults = items.length > 0;
  const shouldShowSkeletons = loading;
  const scrollClass = compact
    ? `channel-art-panel__library-scroll image-search-modal__scroll image-search-modal__scroll--grid${
        channelPicker ? ' image-search-modal__scroll--channel-tiles' : ''
      }`
    : `image-search-modal__scroll scrollbar-soft scroll-region-inset ${
        viewMode === 'list' ? 'image-search-modal__scroll--list' : 'image-search-modal__scroll--grid'
      }`;

  const toolbarInner = channelPicker ? (
    <>
      <div className="image-search-modal__toolbar-channel-search">
        <input
          type="text"
          placeholder="Search titles…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="surface-input w-full"
          aria-label="Search media library"
        />
      </div>
      <div className="image-search-modal__toolbar-channel-controls">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="surface-select" aria-label="File type">
          {MEDIA_LIBRARY_FILETYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="surface-select" aria-label="Sort order">
          {MEDIA_LIBRARY_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={loading || refreshing}>
          {refreshing ? '…' : 'Refresh'}
        </Button>
        <span className="image-search-modal__meta image-search-modal__meta--channel">
          {totalCount} · {page}/{totalPages}
        </span>
      </div>
    </>
  ) : (
    <>
      <div className="min-w-[160px] flex-1">
        <input
          type="text"
          placeholder="Search title, description, tags…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="surface-input w-full"
        />
      </div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="surface-select">
        {MEDIA_LIBRARY_FILETYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="surface-select">
        {MEDIA_LIBRARY_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {!compact && (
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value) || MEDIA_LIBRARY_DEFAULT_PAGE_SIZE);
            setPage(1);
          }}
          className="surface-select"
        >
          {MEDIA_LIBRARY_PAGE_SIZE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value} / page
            </option>
          ))}
        </select>
      )}
      {!compact && (
        <Button variant="secondary" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          {viewMode === 'grid' ? 'List view' : 'Grid view'}
        </Button>
      )}
      <Button variant="secondary" onClick={handleRefresh} disabled={loading || refreshing}>
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </Button>
      <span className="image-search-modal__meta">
        {totalCount} item{totalCount !== 1 ? 's' : ''} · page {page}/{totalPages}
      </span>
    </>
  );

  return (
    <div className={compact ? 'channel-art-panel__library' : ''}>
      {error ? (
        <div className="mb-3 rounded-[var(--radius-md)] border border-[hsl(var(--state-error))] bg-[hsl(var(--state-error-light))] p-3 text-[hsl(var(--state-error))] text-sm">
          {error}
        </div>
      ) : null}

      <Card
        className={`mb-3 image-search-modal__toolbar-card ${compact ? '!mt-0' : 'mb-4'} ${
          channelPicker ? 'image-search-modal__toolbar-card--channel' : ''
        }`}
      >
        <div
          className={`image-search-modal__toolbar ${compact && !channelPicker ? '!mb-2' : ''} ${
            channelPicker ? 'image-search-modal__toolbar--channel' : ''
          }`}
        >
          {toolbarInner}
        </div>
      </Card>

      {isInitialLoad ? (
        <div className="rounded-[var(--radius-md)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] p-8 text-center">
          <Text>Loading media library…</Text>
        </div>
      ) : (
        <div className={scrollClass}>
          {shouldShowSkeletons
            ? Array.from({ length: Math.min(pageSize, compact ? 8 : 20) }, (_, index) => (
                <SkeletonMediaItem
                  key={`skeleton-${index}`}
                  index={index}
                  viewMode={compact ? 'grid' : viewMode}
                  channelPicker={channelPicker}
                />
              ))
            : items.map((item, index) => (
                <MediaItem
                  key={item.id}
                  item={item}
                  index={index}
                  onSelect={handleMediaSelect}
                  onDownload={showDownload ? handleDownload : null}
                  itemLoading={itemLoading}
                  downloadSuccess={downloadSuccess}
                  viewMode={compact ? 'grid' : viewMode}
                  channelPicker={channelPicker}
                />
              ))}
        </div>
      )}

      {!loading && !hasResults && (
        <div className="mt-3 rounded-[var(--radius-md)] border border-dashed border-[hsl(var(--border-primary))] p-6 text-center">
          <Text>No media matches. Try another search or upload.</Text>
        </div>
      )}

      <div className={`image-search-modal__pagination mt-3 ${channelPicker ? 'image-search-modal__pagination--channel' : ''}`}>
        <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1}>
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
    </div>
  );
}

function MediaItem({
  item,
  index,
  onSelect,
  onDownload,
  itemLoading,
  downloadSuccess,
  viewMode,
  channelPicker = false,
}) {
  const isVideo = item.file_type === 'video';
  const isGif = item.file_type === 'gif';
  const thumbUrl = getStoragePublicObjectUrl('media-library', item.file_url);
  const kindLabel = isVideo ? 'Video' : isGif ? 'GIF' : 'Image';

  if (channelPicker && viewMode === 'grid') {
    return (
      <div
        className="image-search-modal__card channel-media-picker-tile-wrap"
        style={{ '--stagger': Math.min(index, 60) }}
      >
        <button
          type="button"
          className="channel-media-picker-tile"
          onClick={() => onSelect(item)}
        >
          <div className="channel-media-picker-tile__media">
            {isVideo ? (
              <video
                src={thumbUrl}
                className="channel-media-picker-tile__img"
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img src={thumbUrl} alt="" className="channel-media-picker-tile__img" loading="lazy" />
            )}
            <span className="channel-media-picker-tile__badge">{kindLabel}</span>
          </div>
          <span className="channel-media-picker-tile__title" title={item.title || ''}>
            {item.title || 'Untitled'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="image-search-modal__card" style={{ '--stagger': Math.min(index, 60) }}>
      <Card
        className={`!mt-0 cursor-pointer p-3 transition-shadow hover:shadow-[var(--shadow-md)] ${
          viewMode === 'list' ? '!flex flex-row items-center gap-4' : ''
        }`}
        onClick={() => onSelect(item)}
      >
        <div className={`relative mb-2 shrink-0 ${viewMode === 'list' ? 'w-36' : ''}`}>
          {isVideo ? (
            <video
              src={thumbUrl}
              className={`w-full rounded object-cover ${viewMode === 'grid' ? 'h-[120px]' : 'h-[88px]'}`}
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={thumbUrl}
              alt={item.title}
              className={`w-full rounded object-cover ${viewMode === 'grid' ? 'h-[120px]' : 'h-[88px]'}`}
              loading="lazy"
            />
          )}

          <div className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {isVideo ? 'video' : isGif ? 'gif' : 'image'}
          </div>
        </div>

        <div className={`mb-2 min-w-0 ${viewMode === 'list' ? 'flex-1' : ''}`}>
          <Text variant="p" className="mb-0.5 line-clamp-2 text-[14px] font-semibold">
            {item.title}
          </Text>
          {item.description ? (
            <Text variant="small" className="line-clamp-2 text-[11px] text-[hsl(var(--text-secondary))]">
              {item.description}
            </Text>
          ) : null}

          {item.tags && item.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-0.5">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-[2px] bg-[hsl(var(--primary))] px-1 py-[1px] text-[9px] text-text-on-accent"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 ? (
                <span className="text-[9px] text-secondary">+{item.tags.length - 3}</span>
              ) : null}
            </div>
          )}
        </div>

        {onDownload ? (
          <div className="surface-row-between mt-auto">
            <Text variant="small" className="text-[10px] text-secondary">
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
        ) : null}
      </Card>
    </div>
  );
}

function SkeletonMediaItem({ index, viewMode, channelPicker = false }) {
  if (channelPicker && viewMode === 'grid') {
    return (
      <div className="image-search-modal__card channel-media-picker-tile-wrap" style={{ '--stagger': Math.min(index, 24) }}>
        <div className="channel-media-picker-tile channel-media-picker-tile--skeleton" aria-hidden>
          <div className="channel-media-picker-tile__media">
            <div className="image-search-modal__skeleton channel-media-picker-tile__skeleton-media" />
          </div>
          <div className="image-search-modal__skeleton channel-media-picker-tile__skeleton-title" />
        </div>
      </div>
    );
  }

  return (
    <div className="image-search-modal__card" style={{ '--stagger': Math.min(index, 24) }}>
      <Card className={`!mt-0 p-3 ${viewMode === 'list' ? '!flex flex-row items-center gap-4' : ''}`}>
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
}

MediaItem.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDownload: PropTypes.func,
  itemLoading: PropTypes.object.isRequired,
  downloadSuccess: PropTypes.object.isRequired,
  viewMode: PropTypes.string.isRequired,
  channelPicker: PropTypes.bool,
};

SkeletonMediaItem.propTypes = {
  index: PropTypes.number.isRequired,
  viewMode: PropTypes.string.isRequired,
  channelPicker: PropTypes.bool,
};

MediaLibraryBrowser.propTypes = {
  filter: PropTypes.string.isRequired,
  setFilter: PropTypes.func.isRequired,
  searchInput: PropTypes.string.isRequired,
  setSearchInput: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  setSortBy: PropTypes.func.isRequired,
  pageSize: PropTypes.number.isRequired,
  setPageSize: PropTypes.func.isRequired,
  viewMode: PropTypes.string.isRequired,
  setViewMode: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  refreshing: PropTypes.bool.isRequired,
  error: PropTypes.string,
  setError: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  setPage: PropTypes.func.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  items: PropTypes.array.isRequired,
  handleRefresh: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  showDownload: PropTypes.bool,
  compact: PropTypes.bool,
  channelPicker: PropTypes.bool,
};

export default MediaLibraryBrowser;
