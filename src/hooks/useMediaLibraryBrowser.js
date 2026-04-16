import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getMediaLibraryPage,
  clearMediaLibraryCache,
  pruneMediaPageCache,
} from '../utils/mediaLibraryCache';

export const MEDIA_LIBRARY_FILETYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Images', value: 'image' },
  { label: 'GIFs', value: 'gif' },
  { label: 'Videos', value: 'video' },
];

export const MEDIA_LIBRARY_SORT_OPTIONS = [
  { label: 'Recently Added', value: 'created_at' },
  { label: 'Alphabetical (A-Z)', value: 'title_asc' },
  { label: 'Alphabetical (Z-A)', value: 'title_desc' },
  { label: 'Most Downloaded', value: 'downloads' },
];

export const MEDIA_LIBRARY_PAGE_SIZE_OPTIONS = [20, 40, 80];
export const MEDIA_LIBRARY_DEFAULT_PAGE_SIZE = 20;
export const MEDIA_LIBRARY_SEARCH_DEBOUNCE_MS = 280;

/**
 * Shared browse state for media library (modal + inline channel art panel).
 * @param {object} opts
 * @param {boolean} opts.enabled — when false, skips fetch effects (e.g. modal closed).
 * @param {string} [opts.initialSearchTerm] — seed search when it changes (e.g. app name).
 */
export function useMediaLibraryBrowser({
  enabled = true,
  initialSearchTerm = '',
  defaultPageSize = MEDIA_LIBRARY_DEFAULT_PAGE_SIZE,
} = {}) {
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [viewMode, setViewMode] = useState('grid');

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [items, setItems] = useState([]);

  const requestIdRef = useRef(0);
  const prevInitialRef = useRef(initialSearchTerm);

  useEffect(() => {
    if (initialSearchTerm !== prevInitialRef.current) {
      prevInitialRef.current = initialSearchTerm;
      if (typeof initialSearchTerm === 'string' && initialSearchTerm.trim()) {
        setSearchInput(initialSearchTerm.trim());
      }
    }
  }, [initialSearchTerm]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, MEDIA_LIBRARY_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
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
    if (!enabled) return;
    fetchPage({ targetPage: page });
  }, [enabled, page, filter, searchTerm, sortBy, fetchPage]);

  useEffect(() => {
    if (!enabled || page >= totalPages) return;

    getMediaLibraryPage({
      page: page + 1,
      limit: pageSize,
      fileType: filter,
      searchTerm,
      sortBy,
    }).catch(() => {});
  }, [enabled, filter, page, pageSize, searchTerm, sortBy, totalPages]);

  useEffect(() => {
    if (!enabled) return;
    setPage(1);
  }, [enabled, filter, searchTerm, sortBy, pageSize]);

  const handleRefresh = useCallback(async () => {
    await fetchPage({ targetPage: 1, forceFresh: true, asRefresh: true });
  }, [fetchPage]);

  return {
    filter,
    setFilter,
    searchInput,
    setSearchInput,
    searchTerm,
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
    fetchPage,
    handleRefresh,
  };
}
