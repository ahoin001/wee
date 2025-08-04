import { searchMedia } from './supabase';

// Cache for media library items
let mediaLibraryCache = [];
let cacheTimestamp = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Memoization cache for media matches
let mediaMatchCache = new Map();
const MATCH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simple fuzzy matching function
const fuzzyMatch = (str1, str2) => {
  if (!str1 || !str2) return false;
  
  const normalize = (str) => str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  const normalized1 = normalize(str1);
  const normalized2 = normalize(str2);
  
  // Exact match
  if (normalized1 === normalized2) return 1.0;
  
  // Contains match
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.8;
  }
  
  // Word-based matching
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  
  const commonWords = words1.filter(word => 
    words2.some(word2 => word2.includes(word) || word.includes(word2))
  );
  
  if (commonWords.length > 0) {
    const matchRatio = commonWords.length / Math.max(words1.length, words2.length);
    return matchRatio > 0.5 ? matchRatio : 0;
  }
  
  return 0;
};

// Memoized function to get all matching media for a game
export const getAllMatchingMedia = (gameName) => {
  const cacheKey = gameName.toLowerCase().trim();
  const now = Date.now();
  
  // Check memoization cache
  const cached = mediaMatchCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < MATCH_CACHE_DURATION) {
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
  
  // Sort by score (highest first)
  const sortedMatches = matches.sort((a, b) => b.score - a.score);
  
  // Cache the result
  mediaMatchCache.set(cacheKey, {
    matches: sortedMatches,
    timestamp: now
  });
  
  return sortedMatches;
};

// Find best matching media item for a game name
export const findGameMedia = (gameName) => {
  const matches = getAllMatchingMedia(gameName);
  return matches.length > 0 ? matches[0] : null;
};

// Clear match cache when media library is updated
const clearMatchCache = () => {
  mediaMatchCache.clear();
  console.log('[MediaLibraryCache] Match cache cleared');
};

// Preload media library cache
export const preloadMediaLibrary = async () => {
  try {
    console.log('[MediaLibraryCache] Preloading media library...');
    
    // Check if cache is still valid
    if (cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      console.log('[MediaLibraryCache] Using existing cache:', mediaLibraryCache.length, 'items');
      return mediaLibraryCache;
    }
    
    // Fetch all media items
    const result = await searchMedia({
      fileType: null,
      searchTerm: null,
      sortBy: 'created_at',
      page: 1,
      limit: 1000 // Get a large batch
    });
    
    if (result.success) {
      mediaLibraryCache = result.data;
      cacheTimestamp = Date.now();
      console.log('[MediaLibraryCache] Cache updated:', mediaLibraryCache.length, 'items');
      
      // Clear match cache when media library updates
      clearMatchCache();
      
      return mediaLibraryCache;
    } else {
      console.error('[MediaLibraryCache] Failed to fetch media library:', result.error);
      return [];
    }
  } catch (error) {
    console.error('[MediaLibraryCache] Error preloading media library:', error);
    return [];
  }
};

// Get cached media library
export const getCachedMediaLibrary = () => {
  return mediaLibraryCache;
};

// Clear cache (for manual refresh)
export const clearMediaLibraryCache = () => {
  mediaLibraryCache = [];
  cacheTimestamp = null;
  clearMatchCache();
  console.log('[MediaLibraryCache] Cache cleared');
};

// Get cache status
export const getCacheStatus = () => {
  return {
    itemCount: mediaLibraryCache.length,
    lastUpdated: cacheTimestamp,
    isStale: cacheTimestamp ? (Date.now() - cacheTimestamp) > CACHE_DURATION : true,
    matchCacheSize: mediaMatchCache.size
  };
}; 