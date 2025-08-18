// Advanced Data Management System
// Provides comprehensive CRUD operations, validation, and synchronization

import useConsolidatedAppStore from './useConsolidatedAppStore';

// ============================================================================
// PRESET APPLICATION SYSTEM
// ============================================================================

/**
 * Comprehensive preset management system with CRUD operations
 */
export const presetManager = {
  /**
   * Create a new preset with validation
   */
  create: async (preset) => {
    try {
      // Validate preset data
      const validation = validatePreset(preset);
      if (!validation.isValid) {
        throw new Error(`Preset validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate unique ID
      const id = generatePresetId();
      const timestamp = Date.now();
      
      const newPreset = {
        id,
        ...preset,
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1
      };

      // Add to store
      const store = useConsolidatedAppStore.getState();
      const updatedPresets = [...store.presets.list, newPreset];
      
      store.actions.setPresets({
        ...store.presets,
        list: updatedPresets
      });

      // Queue for synchronization
      await syncManager.queueOperation('create', 'preset', newPreset);

      return { success: true, preset: newPreset };
    } catch (error) {
      console.error('[PresetManager] Create failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Read a preset by ID with caching
   */
  read: async (id) => {
    try {
      // Check cache first
      const cached = await cacheManager.get(`preset:${id}`);
      if (cached) {
        return { success: true, preset: cached };
      }

      // Get from store
      const store = useConsolidatedAppStore.getState();
      const preset = store.presets.list.find(p => p.id === id);
      
      if (!preset) {
        throw new Error(`Preset not found: ${id}`);
      }

      // Cache the result
      await cacheManager.set(`preset:${id}`, preset, 300000); // 5 minutes

      return { success: true, preset };
    } catch (error) {
      console.error('[PresetManager] Read failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update a preset with conflict resolution
   */
  update: async (id, updates) => {
    try {
      // Validate updates
      const validation = validatePresetUpdates(updates);
      if (!validation.isValid) {
        throw new Error(`Update validation failed: ${validation.errors.join(', ')}`);
      }

      const store = useConsolidatedAppStore.getState();
      const presetIndex = store.presets.list.findIndex(p => p.id === id);
      
      if (presetIndex === -1) {
        throw new Error(`Preset not found: ${id}`);
      }

      const currentPreset = store.presets.list[presetIndex];
      
      // Check for conflicts
      const conflicts = await checkForConflicts(currentPreset, updates);
      if (conflicts.length > 0) {
        const resolved = await syncManager.resolve(conflicts);
        if (!resolved) {
          throw new Error('Conflicts could not be resolved');
        }
      }

      // Apply updates
      const updatedPreset = {
        ...currentPreset,
        ...updates,
        updatedAt: Date.now(),
        version: currentPreset.version + 1
      };

      // Update store
      const updatedPresets = [...store.presets.list];
      updatedPresets[presetIndex] = updatedPreset;
      
      store.actions.setPresets({
        ...store.presets,
        list: updatedPresets
      });

      // Invalidate cache
      await cacheManager.invalidate(`preset:${id}`);

      // Queue for synchronization
      await syncManager.queueOperation('update', 'preset', updatedPreset);

      return { success: true, preset: updatedPreset };
    } catch (error) {
      console.error('[PresetManager] Update failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a preset with cleanup
   */
  delete: async (id) => {
    try {
      const store = useConsolidatedAppStore.getState();
      const presetIndex = store.presets.list.findIndex(p => p.id === id);
      
      if (presetIndex === -1) {
        throw new Error(`Preset not found: ${id}`);
      }

      const deletedPreset = store.presets.list[presetIndex];

      // Remove from store
      const updatedPresets = store.presets.list.filter(p => p.id !== id);
      
      store.actions.setPresets({
        ...store.presets,
        list: updatedPresets
      });

      // Cleanup cache
      await cacheManager.invalidate(`preset:${id}`);

      // Queue for synchronization
      await syncManager.queueOperation('delete', 'preset', { id });

      return { success: true, preset: deletedPreset };
    } catch (error) {
      console.error('[PresetManager] Delete failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Apply a preset to current state
   */
  apply: async (preset) => {
    try {
      // Validate preset before applying
      const validation = validatePreset(preset);
      if (!validation.isValid) {
        throw new Error(`Preset validation failed: ${validation.errors.join(', ')}`);
      }

      const store = useConsolidatedAppStore.getState();
      
      // Create backup of current state
      const backup = {
        timestamp: Date.now(),
        state: {
          app: store.app,
          ui: store.ui,
          ribbon: store.ribbon,
          wallpaper: store.wallpaper,
          time: store.time,
          channels: store.channels,
          dock: store.dock,
          particles: store.particles,
          audio: store.audio
        }
      };

      // Apply preset data
      if (preset.data) {
        Object.keys(preset.data).forEach(category => {
          if (preset.data[category] && store.actions[`set${category.charAt(0).toUpperCase() + category.slice(1)}State`]) {
            store.actions[`set${category.charAt(0).toUpperCase() + category.slice(1)}State`](preset.data[category]);
          }
        });
      }

      // Track analytics
      await analyticsManager.track('preset_applied', {
        presetId: preset.id,
        presetName: preset.name,
        timestamp: Date.now()
      });

      return { success: true, backup };
    } catch (error) {
      console.error('[PresetManager] Apply failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export preset to file
   */
  export: async (preset) => {
    try {
      const exportData = {
        version: '1.0.0',
        preset: {
          ...preset,
          exportedAt: Date.now()
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${preset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('[PresetManager] Export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Import preset from file
   */
  import: async (file) => {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data
      if (!importData.preset || !importData.version) {
        throw new Error('Invalid preset file format');
      }

      const preset = importData.preset;
      
      // Validate preset data
      const validation = validatePreset(preset);
      if (!validation.isValid) {
        throw new Error(`Preset validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for conflicts with existing presets
      const store = useConsolidatedAppStore.getState();
      const existingPreset = store.presets.list.find(p => p.name === preset.name);
      
      if (existingPreset) {
        // Generate unique name
        preset.name = `${preset.name}_imported_${Date.now()}`;
      }

      // Create the preset
      const result = await presetManager.create(preset);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return { success: true, preset: result.preset };
    } catch (error) {
      console.error('[PresetManager] Import failed:', error);
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// DATA VALIDATION
// ============================================================================

/**
 * Validate preset data
 */
const validatePreset = (preset) => {
  const errors = [];

  // Required fields
  if (!preset.name || typeof preset.name !== 'string') {
    errors.push('Preset name is required and must be a string');
  }

  if (preset.name && preset.name.length > 100) {
    errors.push('Preset name must be less than 100 characters');
  }

  if (!preset.data || typeof preset.data !== 'object') {
    errors.push('Preset data is required and must be an object');
  }

  // Validate data structure
  if (preset.data) {
    const validCategories = ['app', 'ui', 'ribbon', 'wallpaper', 'time', 'channels', 'dock', 'particles', 'audio'];
    
    Object.keys(preset.data).forEach(category => {
      if (!validCategories.includes(category)) {
        errors.push(`Invalid category: ${category}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate preset updates
 */
const validatePresetUpdates = (updates) => {
  const errors = [];

  if (updates.name && typeof updates.name !== 'string') {
    errors.push('Preset name must be a string');
  }

  if (updates.name && updates.name.length > 100) {
    errors.push('Preset name must be less than 100 characters');
  }

  if (updates.data && typeof updates.data !== 'object') {
    errors.push('Preset data must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============================================================================
// DATA SYNCHRONIZATION
// ============================================================================

/**
 * Queue-based synchronization manager
 */
export const syncManager = {
  queue: [],
  isProcessing: false,

  /**
   * Queue an operation for synchronization
   */
  queueOperation: async (operation, type, data) => {
    const syncItem = {
      id: generateSyncId(),
      operation,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    syncManager.queue.push(syncItem);
    
    // Process queue if not already processing
    if (!syncManager.isProcessing) {
      await syncManager.processQueue();
    }
  },

  /**
   * Process the synchronization queue
   */
  processQueue: async () => {
    if (syncManager.isProcessing || syncManager.queue.length === 0) {
      return;
    }

    syncManager.isProcessing = true;

    try {
      while (syncManager.queue.length > 0) {
        const item = syncManager.queue.shift();
        
        try {
          await syncManager.syncItem(item);
        } catch (error) {
          console.error('[SyncManager] Sync failed for item:', item, error);
          
          // Retry logic
          if (item.retries < 3) {
            item.retries++;
            item.timestamp = Date.now();
            syncManager.queue.push(item);
          } else {
            console.error('[SyncManager] Max retries exceeded for item:', item);
          }
        }
      }
    } finally {
      syncManager.isProcessing = false;
    }
  },

  /**
   * Sync a single item
   */
  syncItem: async (item) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Here you would implement actual sync logic
    // For now, we'll just log the operation
    console.log('[SyncManager] Syncing:', item);
  },

  /**
   * Resolve conflicts between local and remote data
   */
  resolve: async (conflicts) => {
    try {
      // Simple conflict resolution: use the most recent version
      const resolved = conflicts.map(conflict => {
        const local = conflict.local;
        const remote = conflict.remote;
        
        return local.updatedAt > remote.updatedAt ? local : remote;
      });

      return resolved;
    } catch (error) {
      console.error('[SyncManager] Conflict resolution failed:', error);
      return null;
    }
  }
};

// ============================================================================
// DATA ANALYTICS
// ============================================================================

/**
 * Analytics manager for tracking user behavior
 */
export const analyticsManager = {
  events: [],

  /**
   * Track an event
   */
  track: async (eventName, data = {}) => {
    const event = {
      id: generateEventId(),
      name: eventName,
      data,
      timestamp: Date.now(),
      sessionId: getSessionId()
    };

    analyticsManager.events.push(event);

    // Send to analytics service (if configured)
    if (window.api?.analytics?.track) {
      try {
        await window.api.analytics.track(event);
      } catch (error) {
        console.warn('[Analytics] Failed to send event:', error);
      }
    }

    return event;
  },

  /**
   * Get analytics summary
   */
  getSummary: () => {
    const events = analyticsManager.events;
    const summary = {};

    events.forEach(event => {
      if (!summary[event.name]) {
        summary[event.name] = 0;
      }
      summary[event.name]++;
    });

    return summary;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique preset ID
 */
const generatePresetId = () => {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate unique sync ID
 */
const generateSyncId = () => {
  return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate unique event ID
 */
const generateEventId = () => {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get session ID
 */
const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

/**
 * Check for conflicts between current and updated data
 */
const checkForConflicts = async (current, updates) => {
  const conflicts = [];

  // Simple conflict detection: check if data was modified since last sync
  if (current.lastSyncedAt && updates.updatedAt < current.lastSyncedAt) {
    conflicts.push({
      type: 'version_conflict',
      local: current,
      remote: updates
    });
  }

  return conflicts;
};

// ============================================================================
// CACHE MANAGER (Basic implementation)
// ============================================================================

/**
 * Basic cache manager
 */
export const cacheManager = {
  cache: new Map(),

  get: async (key) => {
    const item = cacheManager.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      cacheManager.cache.delete(key);
      return null;
    }

    return item.value;
  },

  set: async (key, value, ttl = 300000) => {
    cacheManager.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  },

  invalidate: async (pattern) => {
    const keys = Array.from(cacheManager.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cacheManager.cache.delete(key);
      }
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  presetManager,
  syncManager,
  analyticsManager,
  cacheManager,
  validatePreset,
  validatePresetUpdates
};


