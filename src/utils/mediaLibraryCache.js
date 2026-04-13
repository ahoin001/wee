import { searchMediaPaginated } from './supabase';
import { logError, logWarn } from './logger';

let mediaLibraryCache = [];
let cacheTimestamp = null;
let preloadPromise = null;

const FULL_CACHE_DURATION_MS = 30 * 60 * 1000;
const PAGE_CACHE_DURATION_MS = 5 * 60 * 1000;
const MATCH_CACHE_DURATION_MS = 5 * 60 * 1000;
const PRELOAD_BATCH_SIZE = 200;
const REQUEST_TIMEOUT_MS = 15000;

const mediaPageCache = new Map();
const inFlightMediaPageRequests = new Map();

const mediaMatchCache = new Map();

const normalizeSearchValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const getPageCacheKey = ({
  page = 1,
  limit = 20,
  fileType = 'all',
  searchTerm = '',
  sortBy = 'created_at',
}) =>
  [
    Number(page) || 1,
    Number(limit) || 20,
    String(fileType || 'all'),
    normalizeSearchValue(searchTerm),
    String(sortBy || 'created_at'),
  ].join('|');

const isFresh = (ts, ttlMs) => Number.isFinite(ts) && Date.now() - ts < ttlMs;

const withTimeout = (promise, timeoutMs, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error(message));
      }, timeoutMs);
    }),
  ]);

const clearMatchCache = () => {
  mediaMatchCache.clear();
};

const fuzzyMatch = (str1, str2) => {
  if (!str1 || !str2) return 0;

  const normalize = (str) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const normalized1 = normalize(str1);
  const normalized2 = normalize(str2);

  if (!normalized1 || !normalized2) return 0;
  if (normalized1 === normalized2) return 1;
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.8;

  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  const commonWords = words1.filter((word) =>
    words2.some((word2) => word2.includes(word) || word.includes(word2))
  );

  if (commonWords.length === 0) return 0;
  const ratio = commonWords.length / Math.max(words1.length, words2.length);
  return ratio > 0.5 ? ratio : 0;
};

const sortLocalMedia = (list, sortBy = 'created_at') => {
  const sorted = [...list];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'title_asc':
        return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
      case 'title_desc':
        return (b.title || '').localeCompare(a.title || '', undefined, { sensitivity: 'base' });
      case 'downloads':
        return (b.downloads || 0) - (a.downloads || 0);
      case 'created_at':
      default:
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  });
  return sorted;
};

export const getMediaLibraryPage = async (
  {
    page = 1,
    limit = 20,
    fileType = 'all',
    searchTerm = '',
    sortBy = 'created_at',
  } = {},
  { forceFresh = false, ttlMs = PAGE_CACHE_DURATION_MS } = {}
) => {
  const params = { page, limit, fileType, searchTerm, sortBy };
  const cacheKey = getPageCacheKey(params);

  if (!forceFresh) {
    const cached = mediaPageCache.get(cacheKey);
    if (cached && isFresh(cached.ts, ttlMs)) {
      return cached.value;
    }
  }

  if (inFlightMediaPageRequests.has(cacheKey)) {
    return inFlightMediaPageRequests.get(cacheKey);
  }

  const request = (async () => {
    const result = await withTimeout(
      searchMediaPaginated(params),
      REQUEST_TIMEOUT_MS,
      'Media page request timed out'
    );
    if (result.success) {
      mediaPageCache.set(cacheKey, { ts: Date.now(), value: result });
    }
    return result;
  })().finally(() => {
    inFlightMediaPageRequests.delete(cacheKey);
  });

  inFlightMediaPageRequests.set(cacheKey, request);
  return request;
};

export const preloadMediaLibrary = async (forceRefresh = false) => {
  if (
    !forceRefresh &&
    cacheTimestamp &&
    mediaLibraryCache.length > 0 &&
    isFresh(cacheTimestamp, FULL_CACHE_DURATION_MS)
  ) {
    return mediaLibraryCache;
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    try {
      const firstPage = await withTimeout(
        searchMediaPaginated({
          page: 1,
          limit: PRELOAD_BATCH_SIZE,
          fileType: 'all',
          sortBy: 'created_at',
        }),
        REQUEST_TIMEOUT_MS,
        'Media preload first page timed out'
      );

      if (!firstPage.success) {
        throw new Error(firstPage.error || 'Failed to load media library');
      }

      const combined = [...(firstPage.data || [])];
      const totalPages = Math.max(1, Number(firstPage.totalPages) || 1);

      for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
        const pageResult = await withTimeout(
          searchMediaPaginated({
            page: nextPage,
            limit: PRELOAD_BATCH_SIZE,
            fileType: 'all',
            sortBy: 'created_at',
          }),
          REQUEST_TIMEOUT_MS,
          `Media preload page ${nextPage} timed out`
        );
        if (!pageResult.success) {
          throw new Error(pageResult.error || `Failed to load media page ${nextPage}`);
        }
        if (Array.isArray(pageResult.data) && pageResult.data.length > 0) {
          combined.push(...pageResult.data);
        }
      }

      mediaLibraryCache = combined;
      cacheTimestamp = Date.now();
      clearMatchCache();
      return mediaLibraryCache;
    } catch (error) {
      logError('MediaLibraryCache', 'Failed to preload media library', error);
      return [];
    } finally {
      preloadPromise = null;
    }
  })();

  return preloadPromise;
};

export const filterMediaLibraryCache = ({
  fileType = 'all',
  searchTerm = '',
  sortBy = 'created_at',
} = {}) => {
  let list = Array.isArray(mediaLibraryCache) ? [...mediaLibraryCache] : [];

  if (fileType && fileType !== 'all') {
    list = list.filter((item) => item.file_type === fileType);
  }

  const query = normalizeSearchValue(searchTerm);
  if (query) {
    list = list.filter((item) => {
      const title = normalizeSearchValue(item.title);
      const description = normalizeSearchValue(item.description);
      const tags = Array.isArray(item.tags) ? normalizeSearchValue(item.tags.join(' ')) : '';
      return title.includes(query) || description.includes(query) || tags.includes(query);
    });
  }

  return sortLocalMedia(list, sortBy);
};

export const getAllMatchingMedia = (gameName) => {
  const cacheKey = normalizeSearchValue(gameName);
  if (!cacheKey) return [];

  const cached = mediaMatchCache.get(cacheKey);
  if (cached && isFresh(cached.timestamp, MATCH_CACHE_DURATION_MS)) {
    return cached.matches;
  }

  if (!mediaLibraryCache.length) return [];

  const matches = [];
  for (const item of mediaLibraryCache) {
    const score = fuzzyMatch(gameName, item.title);
    if (score > 0.3) {
      matches.push({ ...item, score });
    }
  }

  const sortedMatches = matches.sort((a, b) => b.score - a.score);
  mediaMatchCache.set(cacheKey, { matches: sortedMatches, timestamp: Date.now() });
  return sortedMatches;
};

export const findGameMedia = (gameName) => {
  const matches = getAllMatchingMedia(gameName);
  return matches.length > 0 ? matches[0] : null;
};

export const getCachedMediaLibrary = () => mediaLibraryCache;

export const clearMediaLibraryCache = () => {
  mediaLibraryCache = [];
  cacheTimestamp = null;
  preloadPromise = null;
  clearMatchCache();
  mediaPageCache.clear();
  inFlightMediaPageRequests.clear();
};

export const getCacheStatus = () => {
  const stale = !(cacheTimestamp && isFresh(cacheTimestamp, FULL_CACHE_DURATION_MS));
  return {
    itemCount: mediaLibraryCache.length,
    lastUpdated: cacheTimestamp,
    isStale: stale,
    matchCacheSize: mediaMatchCache.size,
    pagedCacheSize: mediaPageCache.size,
    inFlightRequests: inFlightMediaPageRequests.size,
  };
};

export const pruneMediaPageCache = ({ maxEntries = 40 } = {}) => {
  if (mediaPageCache.size <= maxEntries) return;

  const entries = [...mediaPageCache.entries()].sort((a, b) => (a[1].ts || 0) - (b[1].ts || 0));
  const deleteCount = mediaPageCache.size - maxEntries;
  for (let i = 0; i < deleteCount; i += 1) {
    mediaPageCache.delete(entries[i][0]);
  }
  logWarn('MediaLibraryCache', 'Pruned media page cache entries', { maxEntries, deleteCount });
};
