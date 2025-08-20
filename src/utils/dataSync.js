import { performanceUtils } from './usePerformanceMonitor.jsx';
import dataValidator from './dataValidator';

// Data synchronization system
export class DataSyncManager {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.syncInterval = null;
    this.lastSyncTime = Date.now();
    this.syncCallbacks = new Map();
    this.conflictResolvers = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Initialize the sync manager
  initialize(options = {}) {
    const {
      syncInterval = 5000, // 5 seconds
      maxRetries = 3,
      retryDelay = 1000
    } = options;

    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;

    // Start periodic sync
    this.startPeriodicSync(syncInterval);

  }

  // Start periodic synchronization
  startPeriodicSync(interval) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.performSync();
    }, interval);
  }

  // Stop periodic synchronization
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Add a sync operation to the queue
  queueSync(operation) {
    return performanceUtils.measure('queueSync', () => {
      const syncId = this.generateSyncId();
      
      const syncOperation = {
        id: syncId,
        operation,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'queued'
      };

      this.syncQueue.push(syncOperation);
      
      // Trigger immediate sync if not already syncing
      if (!this.isSyncing) {
        this.performSync();
      }

      return syncId;
    });
  }

  // Perform synchronization
  async performSync() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      const operations = [...this.syncQueue];
      this.syncQueue = [];

      for (const syncOp of operations) {
        await this.processSyncOperation(syncOp);
      }

      this.lastSyncTime = Date.now();

    } catch (error) {
      console.error('[DataSync] Sync error:', error);
      
      // Re-queue failed operations
      this.syncQueue.unshift(...operations.filter(op => op.status === 'failed'));
      
    } finally {
      this.isSyncing = false;
    }
  }

  // Process individual sync operation
  async processSyncOperation(syncOp) {
    try {
      syncOp.status = 'processing';
      
      // Validate operation data
      const validation = this.validateSyncOperation(syncOp.operation);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Execute the operation
      const result = await this.executeSyncOperation(syncOp.operation);
      
      syncOp.status = 'completed';
      syncOp.result = result;

      // Call success callback
      this.callSyncCallback(syncOp.id, 'success', result);

    } catch (error) {
      console.error('[DataSync] Operation failed:', syncOp.id, error);
      
      syncOp.status = 'failed';
      syncOp.error = error.message;
      syncOp.retryCount++;

      // Retry if under max retries
      if (syncOp.retryCount < this.maxRetries) {
        setTimeout(() => {
          this.syncQueue.push(syncOp);
        }, this.retryDelay * syncOp.retryCount);
      } else {
        // Call error callback
        this.callSyncCallback(syncOp.id, 'error', error);
      }
    }
  }

  // Execute sync operation
  async executeSyncOperation(operation) {
    return performanceUtils.measureAsync('executeSyncOperation', async () => {
      const { type, data, target } = operation;

      switch (type) {
        case 'updateSetting':
          return await this.updateSetting(target, data);
        
        case 'updateChannel':
          return await this.updateChannel(target, data);
        
        case 'updateWallpaper':
          return await this.updateWallpaper(target, data);
        
        case 'updateSound':
          return await this.updateSound(target, data);
        
        case 'updatePreset':
          return await this.updatePreset(target, data);
        
        case 'deletePreset':
          return await this.deletePreset(target);
        
        case 'applyPreset':
          return await this.applyPreset(data);
        
        case 'batchUpdate':
          return await this.batchUpdate(data);
        
        default:
          throw new Error(`Unknown sync operation type: ${type}`);
      }
    });
  }

  // Update setting with conflict resolution
  async updateSetting(key, value) {
    try {
      // Get current value from storage
      const currentValue = await this.getSetting(key);
      
      // Check for conflicts
      if (this.hasConflict(currentValue, value)) {
        const resolvedValue = await this.resolveConflict(key, currentValue, value);
        return await this.persistSetting(key, resolvedValue);
      }
      
      return await this.persistSetting(key, value);
    } catch (error) {
      throw new Error(`Failed to update setting ${key}: ${error.message}`);
    }
  }

  // Update channel with conflict resolution
  async updateChannel(channelId, channelData) {
    try {
      // Get current channel data
      const currentData = await this.getChannel(channelId);
      
      // Check for conflicts
      if (this.hasConflict(currentData, channelData)) {
        const resolvedData = await this.resolveConflict(`channel-${channelId}`, currentData, channelData);
        return await this.persistChannel(channelId, resolvedData);
      }
      
      return await this.persistChannel(channelId, channelData);
    } catch (error) {
      throw new Error(`Failed to update channel ${channelId}: ${error.message}`);
    }
  }

  // Update wallpaper with conflict resolution
  async updateWallpaper(key, value) {
    try {
      const currentValue = await this.getWallpaper(key);
      
      if (this.hasConflict(currentValue, value)) {
        const resolvedValue = await this.resolveConflict(`wallpaper-${key}`, currentValue, value);
        return await this.persistWallpaper(key, resolvedValue);
      }
      
      return await this.persistWallpaper(key, value);
    } catch (error) {
      throw new Error(`Failed to update wallpaper ${key}: ${error.message}`);
    }
  }

  // Update sound with conflict resolution
  async updateSound(key, value) {
    try {
      const currentValue = await this.getSound(key);
      
      if (this.hasConflict(currentValue, value)) {
        const resolvedValue = await this.resolveConflict(`sound-${key}`, currentValue, value);
        return await this.persistSound(key, resolvedValue);
      }
      
      return await this.persistSound(key, value);
    } catch (error) {
      throw new Error(`Failed to update sound ${key}: ${error.message}`);
    }
  }

  // Update preset with conflict resolution
  async updatePreset(name, presetData) {
    try {
      const currentPreset = await this.getPreset(name);
      
      if (this.hasConflict(currentPreset, presetData)) {
        const resolvedPreset = await this.resolveConflict(`preset-${name}`, currentPreset, presetData);
        return await this.persistPreset(name, resolvedPreset);
      }
      
      return await this.persistPreset(name, presetData);
    } catch (error) {
      throw new Error(`Failed to update preset ${name}: ${error.message}`);
    }
  }

  // Delete preset
  async deletePreset(name) {
    try {
      return await this.removePreset(name);
    } catch (error) {
      throw new Error(`Failed to delete preset ${name}: ${error.message}`);
    }
  }

  // Apply preset
  async applyPreset(presetData) {
    try {
      // Validate preset data
      const validation = dataValidator.validatePresetData(presetData);
      if (!validation.isValid) {
        throw new Error(`Invalid preset data: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Apply preset data
      const results = [];
      
      if (presetData.data) {
        for (const [key, value] of Object.entries(presetData.data)) {
          try {
            const result = await this.updateSetting(key, value);
            results.push({ key, success: true, result });
          } catch (error) {
            results.push({ key, success: false, error: error.message });
          }
        }
      }

      return { success: true, results };
    } catch (error) {
      throw new Error(`Failed to apply preset: ${error.message}`);
    }
  }

  // Batch update multiple items
  async batchUpdate(updates) {
    try {
      const results = [];
      
      for (const update of updates) {
        try {
          const result = await this.executeSyncOperation(update);
          results.push({ ...update, success: true, result });
        } catch (error) {
          results.push({ ...update, success: false, error: error.message });
        }
      }

      return { success: true, results };
    } catch (error) {
      throw new Error(`Failed to perform batch update: ${error.message}`);
    }
  }

  // Check for conflicts between current and new values
  hasConflict(currentValue, newValue) {
    // Simple conflict detection - can be enhanced
    if (currentValue === undefined || newValue === undefined) {
      return false;
    }

    // Check if values are different
    if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
      // Check if current value is newer (has timestamp)
      if (currentValue.timestamp && newValue.timestamp) {
        return currentValue.timestamp > newValue.timestamp;
      }
    }

    return false;
  }

  // Resolve conflicts
  async resolveConflict(key, currentValue, newValue) {
    // Check for custom conflict resolver
    const resolver = this.conflictResolvers.get(key);
    if (resolver) {
      return await resolver(currentValue, newValue);
    }

    // Default conflict resolution: use newer value
    if (currentValue.timestamp && newValue.timestamp) {
      return currentValue.timestamp > newValue.timestamp ? currentValue : newValue;
    }

    // If no timestamps, use new value
    return newValue;
  }

  // Register conflict resolver
  registerConflictResolver(key, resolver) {
    this.conflictResolvers.set(key, resolver);
  }

  // Register sync callback
  registerSyncCallback(syncId, callback) {
    this.syncCallbacks.set(syncId, callback);
  }

  // Call sync callback
  callSyncCallback(syncId, status, data) {
    const callback = this.syncCallbacks.get(syncId);
    if (callback) {
      try {
        callback(status, data);
      } catch (error) {
        console.error('[DataSync] Callback error:', error);
      }
      this.syncCallbacks.delete(syncId);
    }
  }

  // Validate sync operation
  validateSyncOperation(operation) {
    if (!operation || typeof operation !== 'object') {
      return { isValid: false, errors: [{ message: 'Operation must be an object' }] };
    }

    const { type, data, target } = operation;

    if (!type || typeof type !== 'string') {
      return { isValid: false, errors: [{ message: 'Operation type is required' }] };
    }

    if (!['updateSetting', 'updateChannel', 'updateWallpaper', 'updateSound', 'updatePreset', 'deletePreset', 'applyPreset', 'batchUpdate'].includes(type)) {
      return { isValid: false, errors: [{ message: `Invalid operation type: ${type}` }] };
    }

    if (type === 'deletePreset' && (!target || typeof target !== 'string')) {
      return { isValid: false, errors: [{ message: 'Target is required for delete operations' }] };
    }

    if (type === 'applyPreset' && (!data || typeof data !== 'object')) {
      return { isValid: false, errors: [{ message: 'Preset data is required for apply operations' }] };
    }

    if (type === 'batchUpdate' && (!Array.isArray(data) || data.length === 0)) {
      return { isValid: false, errors: [{ message: 'Batch updates must be a non-empty array' }] };
    }

    return { isValid: true, errors: [] };
  }

  // Generate unique sync ID
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods (to be implemented based on your storage system)
  async getSetting(key) {
    // Implement based on your storage system
    return window.api?.settings?.get?.(key);
  }

  async persistSetting(key, value) {
    // Implement based on your storage system
    return window.api?.settings?.set?.(key, value);
  }

  async getChannel(channelId) {
    // Implement based on your storage system
    return window.api?.channels?.get?.(channelId);
  }

  async persistChannel(channelId, data) {
    // Implement based on your storage system
    return window.api?.channels?.set?.(channelId, data);
  }

  async getWallpaper(key) {
    // Implement based on your storage system
    return window.api?.wallpapers?.get?.(key);
  }

  async persistWallpaper(key, value) {
    // Implement based on your storage system
    return window.api?.wallpapers?.set?.(key, value);
  }

  async getSound(key) {
    // Implement based on your storage system
    return window.api?.sounds?.get?.(key);
  }

  async persistSound(key, value) {
    // Implement based on your storage system
    return window.api?.sounds?.set?.(key, value);
  }

  async getPreset(name) {
    // Implement based on your storage system
    return window.api?.presets?.get?.(name);
  }

  async persistPreset(name, data) {
    // Implement based on your storage system
    return window.api?.presets?.set?.(name, data);
  }

  async removePreset(name) {
    // Implement based on your storage system
    return window.api?.presets?.delete?.(name);
  }

  // Get sync status
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      pendingCallbacks: this.syncCallbacks.size
    };
  }

  // Cleanup
  cleanup() {
    this.stopPeriodicSync();
    this.syncQueue = [];
    this.syncCallbacks.clear();
    this.conflictResolvers.clear();
    this.retryAttempts.clear();
  }
}

// Create singleton instance
const dataSyncManager = new DataSyncManager();

// Export utility functions
export const queueSync = (operation) => dataSyncManager.queueSync(operation);
export const registerConflictResolver = (key, resolver) => dataSyncManager.registerConflictResolver(key, resolver);
export const getSyncStatus = () => dataSyncManager.getStatus();
export const initializeSync = (options) => dataSyncManager.initialize(options);
export const cleanupSync = () => dataSyncManager.cleanup();

// Export the sync manager instance
export default dataSyncManager;
