// Cache Manager Utility
// Provides centralized management for all persistent caches in the app

// Cache configuration
const CACHE_CONFIG = {
  // Steam games cache (from steamGames.js)
  STEAM_GAMES_LIST: {
    key: 'steamGamesCache',
    timestampKey: 'steamGamesCacheTimestamp',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    description: 'Steam games list from API'
  },
  
  // App library caches (from useAppLibraryStore.js)
  INSTALLED_APPS: {
    key: 'installedAppsCache',
    timestampKey: 'installedAppsCacheTimestamp',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    description: 'Installed applications'
  },
  
  STEAM_GAMES_INSTALLED: {
    key: 'steamGamesCache',
    timestampKey: 'steamGamesCacheTimestamp',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    description: 'Installed Steam games'
  },
  
  EPIC_GAMES: {
    key: 'epicGamesCache',
    timestampKey: 'epicGamesCacheTimestamp',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    description: 'Installed Epic games'
  },
  
  UWP_APPS: {
    key: 'uwpAppsCache',
    timestampKey: 'uwpAppsCacheTimestamp',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    description: 'Installed UWP apps'
  }
};

class CacheManager {
  constructor() {
    this.config = CACHE_CONFIG;
  }

  // Get cached data with age validation
  getCachedData(cacheName) {
    const config = this.config[cacheName];
    if (!config) {
      console.warn(`[CacheManager] Unknown cache name: ${cacheName}`);
      return null;
    }

    try {
      const data = localStorage.getItem(config.key);
      const timestamp = localStorage.getItem(config.timestampKey);
      
      if (data && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < config.duration) {
          const parsedData = JSON.parse(data);
          console.log(`[CacheManager] Using cached ${cacheName}:`, parsedData.length || 'data');
          return parsedData;
        } else {
          console.log(`[CacheManager] Cache expired for ${cacheName} (age: ${Math.round(age / 1000 / 60)} minutes)`);
        }
      }
    } catch (error) {
      console.warn(`[CacheManager] Failed to read cache ${cacheName}:`, error);
    }
    
    return null;
  }

  // Set cached data with timestamp
  setCachedData(cacheName, data) {
    const config = this.config[cacheName];
    if (!config) {
      console.warn(`[CacheManager] Unknown cache name: ${cacheName}`);
      return false;
    }

    try {
      localStorage.setItem(config.key, JSON.stringify(data));
      localStorage.setItem(config.timestampKey, Date.now().toString());
      console.log(`[CacheManager] Updated cache ${cacheName}:`, data.length || 'data');
      return true;
    } catch (error) {
      console.warn(`[CacheManager] Failed to write cache ${cacheName}:`, error);
      return false;
    }
  }

  // Clear specific cache
  clearCache(cacheName) {
    const config = this.config[cacheName];
    if (!config) {
      console.warn(`[CacheManager] Unknown cache name: ${cacheName}`);
      return false;
    }

    try {
      localStorage.removeItem(config.key);
      localStorage.removeItem(config.timestampKey);
      console.log(`[CacheManager] Cleared cache: ${cacheName}`);
      return true;
    } catch (error) {
      console.warn(`[CacheManager] Failed to clear cache ${cacheName}:`, error);
      return false;
    }
  }

  // Clear all caches
  clearAllCaches() {
    const cacheNames = Object.keys(this.config);
    let clearedCount = 0;
    
    cacheNames.forEach(cacheName => {
      if (this.clearCache(cacheName)) {
        clearedCount++;
      }
    });
    
    console.log(`[CacheManager] Cleared ${clearedCount} caches`);
    return clearedCount;
  }

  // Get cache statistics
  getCacheStats() {
    const stats = {};
    
    Object.keys(this.config).forEach(cacheName => {
      const config = this.config[cacheName];
      try {
        const data = localStorage.getItem(config.key);
        const timestamp = localStorage.getItem(config.timestampKey);
        
        if (data && timestamp) {
          const age = Date.now() - parseInt(timestamp, 10);
          const parsedData = JSON.parse(data);
          stats[cacheName] = {
            exists: true,
            age: Math.round(age / 1000 / 60), // minutes
            size: parsedData.length || 'unknown',
            expired: age >= config.duration,
            description: config.description
          };
        } else {
          stats[cacheName] = {
            exists: false,
            description: config.description
          };
        }
      } catch (error) {
        stats[cacheName] = {
          exists: false,
          error: error.message,
          description: config.description
        };
      }
    });
    
    return stats;
  }

  // Log cache statistics
  logCacheStats() {
    const stats = this.getCacheStats();
    console.log('[CacheManager] Cache Statistics:');
    
    Object.entries(stats).forEach(([cacheName, stat]) => {
      if (stat.exists) {
        const status = stat.expired ? 'EXPIRED' : 'VALID';
        console.log(`  ${cacheName}: ${status} (${stat.age}min old, ${stat.size} items)`);
      } else {
        console.log(`  ${cacheName}: NOT CACHED`);
      }
    });
  }

  // Check if cache is valid (exists and not expired)
  isCacheValid(cacheName) {
    const config = this.config[cacheName];
    if (!config) return false;

    try {
      const data = localStorage.getItem(config.key);
      const timestamp = localStorage.getItem(config.timestampKey);
      
      if (data && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        return age < config.duration;
      }
    } catch (error) {
      console.warn(`[CacheManager] Error checking cache validity for ${cacheName}:`, error);
    }
    
    return false;
  }

  // Get cache age in minutes
  getCacheAge(cacheName) {
    const config = this.config[cacheName];
    if (!config) return null;

    try {
      const timestamp = localStorage.getItem(config.timestampKey);
      if (timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        return Math.round(age / 1000 / 60); // minutes
      }
    } catch (error) {
      console.warn(`[CacheManager] Error getting cache age for ${cacheName}:`, error);
    }
    
    return null;
  }
}

// Export singleton instance
const cacheManager = new CacheManager();
export default cacheManager;

// Export individual functions for convenience
export const {
  getCachedData,
  setCachedData,
  clearCache,
  clearAllCaches,
  getCacheStats,
  logCacheStats,
  isCacheValid,
  getCacheAge
} = cacheManager; 