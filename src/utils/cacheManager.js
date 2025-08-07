import { create } from 'zustand';

// Cache manager for performance optimization
const useCacheManager = create((set, get) => ({
  // App library cache
  appLibrary: {
    steam: {
      data: null,
      lastFetched: null,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    },
    epic: {
      data: null,
      lastFetched: null,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    },
    uwp: {
      data: null,
      lastFetched: null,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    },
    exe: {
      data: null,
      lastFetched: null,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    },
  },

  // Media cache
  media: {
    images: new Map(),
    audio: new Map(),
    videos: new Map(),
    maxSize: 100 * 1024 * 1024, // 100MB
    currentSize: 0,
  },

  // Search cache
  search: {
    queries: new Map(),
    maxQueries: 100,
  },

  // Performance cache
  performance: {
    renderTimes: new Map(),
    componentRenders: new Map(),
  },

  // Actions
  setAppLibraryData: (type, data) => {
    set(state => ({
      appLibrary: {
        ...state.appLibrary,
        [type]: {
          data,
          lastFetched: Date.now(),
          ttl: state.appLibrary[type].ttl,
        },
      },
    }));
  },

  getAppLibraryData: (type) => {
    const state = get();
    const cache = state.appLibrary[type];
    
    if (!cache.data || !cache.lastFetched) {
      return null;
    }

    const isExpired = Date.now() - cache.lastFetched > cache.ttl;
    if (isExpired) {
      return null;
    }

    return cache.data;
  },

  clearAppLibraryCache: (type = null) => {
    if (type) {
      set(state => ({
        appLibrary: {
          ...state.appLibrary,
          [type]: {
            data: null,
            lastFetched: null,
            ttl: state.appLibrary[type].ttl,
          },
        },
      }));
    } else {
      set(state => ({
        appLibrary: {
          steam: { ...state.appLibrary.steam, data: null, lastFetched: null },
          epic: { ...state.appLibrary.epic, data: null, lastFetched: null },
          uwp: { ...state.appLibrary.uwp, data: null, lastFetched: null },
          exe: { ...state.appLibrary.exe, data: null, lastFetched: null },
        },
      }));
    }
  },

  // Media cache actions
  cacheMedia: (key, data, type = 'images') => {
    const state = get();
    const mediaCache = state.media[type];
    const size = data.length || data.size || 1024; // Estimate size

    // Check if adding this would exceed max size
    if (state.media.currentSize + size > state.media.maxSize) {
      // Remove oldest entries until we have space
      const entries = Array.from(mediaCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      while (state.media.currentSize + size > state.media.maxSize && entries.length > 0) {
        const [oldKey, oldData] = entries.shift();
        mediaCache.delete(oldKey);
        state.media.currentSize -= oldData.size;
      }
    }

    mediaCache.set(key, {
      data,
      size,
      timestamp: Date.now(),
    });

    set(state => ({
      media: {
        ...state.media,
        [type]: mediaCache,
        currentSize: state.media.currentSize + size,
      },
    }));
  },

  getCachedMedia: (key, type = 'images') => {
    const state = get();
    const mediaCache = state.media[type];
    return mediaCache.get(key)?.data || null;
  },

  clearMediaCache: (type = null) => {
    if (type) {
      set(state => ({
        media: {
          ...state.media,
          [type]: new Map(),
          currentSize: 0,
        },
      }));
    } else {
      set(state => ({
        media: {
          images: new Map(),
          audio: new Map(),
          videos: new Map(),
          maxSize: state.media.maxSize,
          currentSize: 0,
        },
      }));
    }
  },

  // Search cache actions
  cacheSearchQuery: (query, results) => {
    const state = get();
    const searchCache = state.search.queries;

    // Remove oldest if at max capacity
    if (searchCache.size >= state.search.maxQueries) {
      const firstKey = searchCache.keys().next().value;
      searchCache.delete(firstKey);
    }

    searchCache.set(query, {
      results,
      timestamp: Date.now(),
    });

    set(state => ({
      search: {
        ...state.search,
        queries: searchCache,
      },
    }));
  },

  getCachedSearch: (query) => {
    const state = get();
    const searchCache = state.search.queries;
    const cached = searchCache.get(query);
    
    if (!cached) return null;

    // Cache expires after 5 minutes
    if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
      searchCache.delete(query);
      return null;
    }

    return cached.results;
  },

  // Performance tracking
  trackRenderTime: (componentName, renderTime) => {
    const state = get();
    const performanceCache = state.performance.renderTimes;
    
    if (!performanceCache.has(componentName)) {
      performanceCache.set(componentName, []);
    }
    
    const times = performanceCache.get(componentName);
    times.push(renderTime);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }

    set(state => ({
      performance: {
        ...state.performance,
        renderTimes: performanceCache,
      },
    }));
  },

  trackComponentRender: (componentName) => {
    const state = get();
    const renderCache = state.performance.componentRenders;
    const currentCount = renderCache.get(componentName) || 0;
    
    renderCache.set(componentName, currentCount + 1);

    set(state => ({
      performance: {
        ...state.performance,
        componentRenders: renderCache,
      },
    }));
  },

  getPerformanceStats: () => {
    const state = get();
    const stats = {};
    
    // Calculate average render times
    state.performance.renderTimes.forEach((times, component) => {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      stats[component] = {
        averageRenderTime: avg,
        renderCount: times.length,
        totalRenders: state.performance.componentRenders.get(component) || 0,
      };
    });

    return stats;
  },

  // Cache cleanup
  cleanup: () => {
    const state = get();
    const now = Date.now();

    // Clean up expired app library cache
    Object.keys(state.appLibrary).forEach(type => {
      const cache = state.appLibrary[type];
      if (cache.data && cache.lastFetched && now - cache.lastFetched > cache.ttl) {
        state.appLibrary[type] = {
          ...cache,
          data: null,
          lastFetched: null,
        };
      }
    });

    // Clean up expired search cache
    const searchCache = state.search.queries;
    searchCache.forEach((value, key) => {
      if (now - value.timestamp > 5 * 60 * 1000) {
        searchCache.delete(key);
      }
    });

    set(state => ({
      appLibrary: state.appLibrary,
      search: {
        ...state.search,
        queries: searchCache,
      },
    }));
  },
}));

export default useCacheManager;
