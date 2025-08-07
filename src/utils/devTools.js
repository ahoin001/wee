// Development tools for better debugging and performance monitoring

// Performance monitoring
export const performanceMonitor = {
  marks: new Map(),
  measures: new Map(),

  start: (name) => {
    const startTime = performance.now();
    performanceMonitor.marks.set(name, startTime);
    console.log(`[PERF] Started: ${name}`);
  },

  end: (name) => {
    const startTime = performanceMonitor.marks.get(name);
    if (startTime) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      performanceMonitor.measures.set(name, duration);
      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
      performanceMonitor.marks.delete(name);
    }
  },

  measure: (name, fn) => {
    performanceMonitor.start(name);
    const result = fn();
    performanceMonitor.end(name);
    return result;
  },

  async measureAsync: async (name, fn) => {
    performanceMonitor.start(name);
    const result = await fn();
    performanceMonitor.end(name);
    return result;
  },

  getStats: () => {
    const stats = {};
    performanceMonitor.measures.forEach((duration, name) => {
      stats[name] = duration;
    });
    return stats;
  },

  clear: () => {
    performanceMonitor.marks.clear();
    performanceMonitor.measures.clear();
  },
};

// Component render tracking
export const renderTracker = {
  renders: new Map(),
  lastRender: new Map(),

  track: (componentName) => {
    const now = Date.now();
    const lastRender = renderTracker.lastRender.get(componentName) || 0;
    const timeSinceLastRender = now - lastRender;
    
    if (!renderTracker.renders.has(componentName)) {
      renderTracker.renders.set(componentName, []);
    }
    
    const renders = renderTracker.renders.get(componentName);
    renders.push({
      timestamp: now,
      timeSinceLastRender,
    });
    
    // Keep only last 50 renders
    if (renders.length > 50) {
      renders.shift();
    }
    
    renderTracker.lastRender.set(componentName, now);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RENDER] ${componentName} (${timeSinceLastRender}ms since last render)`);
    }
  },

  getStats: (componentName) => {
    const renders = renderTracker.renders.get(componentName) || [];
    if (renders.length === 0) return null;
    
    const avgTimeBetweenRenders = renders.reduce((sum, render) => 
      sum + render.timeSinceLastRender, 0) / renders.length;
    
    return {
      totalRenders: renders.length,
      avgTimeBetweenRenders,
      lastRender: renders[renders.length - 1],
    };
  },

  clear: () => {
    renderTracker.renders.clear();
    renderTracker.lastRender.clear();
  },
};

// State change tracking
export const stateTracker = {
  changes: new Map(),
  maxChanges: 100,

  track: (storeName, action, payload) => {
    if (!stateTracker.changes.has(storeName)) {
      stateTracker.changes.set(storeName, []);
    }
    
    const changes = stateTracker.changes.get(storeName);
    changes.push({
      timestamp: Date.now(),
      action,
      payload,
    });
    
    // Keep only last N changes
    if (changes.length > stateTracker.maxChanges) {
      changes.shift();
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STATE] ${storeName}.${action}:`, payload);
    }
  },

  getChanges: (storeName) => {
    return stateTracker.changes.get(storeName) || [];
  },

  clear: () => {
    stateTracker.changes.clear();
  },
};

// Memory usage monitoring
export const memoryMonitor = {
  snapshots: [],

  takeSnapshot: () => {
    if (performance.memory) {
      const snapshot = {
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
      
      memoryMonitor.snapshots.push(snapshot);
      
      // Keep only last 100 snapshots
      if (memoryMonitor.snapshots.length > 100) {
        memoryMonitor.snapshots.shift();
      }
      
      if (process.env.NODE_ENV === 'development') {
        const usedMB = (snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const totalMB = (snapshot.totalJSHeapSize / 1024 / 1024).toFixed(2);
        console.log(`[MEMORY] Used: ${usedMB}MB, Total: ${totalMB}MB`);
      }
      
      return snapshot;
    }
    return null;
  },

  getStats: () => {
    if (memoryMonitor.snapshots.length === 0) return null;
    
    const latest = memoryMonitor.snapshots[memoryMonitor.snapshots.length - 1];
    const oldest = memoryMonitor.snapshots[0];
    
    return {
      current: latest,
      oldest,
      snapshots: memoryMonitor.snapshots.length,
      growth: latest.usedJSHeapSize - oldest.usedJSHeapSize,
    };
  },

  clear: () => {
    memoryMonitor.snapshots = [];
  },
};

// Error boundary helper
export const errorBoundary = {
  errors: [],

  capture: (error, errorInfo) => {
    const errorData = {
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
    };
    
    errorBoundary.errors.push(errorData);
    
    // Keep only last 50 errors
    if (errorBoundary.errors.length > 50) {
      errorBoundary.errors.shift();
    }
    
    console.error('[ERROR]', errorData);
  },

  getErrors: () => {
    return errorBoundary.errors;
  },

  clear: () => {
    errorBoundary.errors = [];
  },
};

// Development utilities
export const devUtils = {
  // Log component props changes
  logProps: (componentName, prevProps, nextProps) => {
    if (process.env.NODE_ENV === 'development') {
      const changedProps = {};
      
      Object.keys(nextProps).forEach(key => {
        if (prevProps[key] !== nextProps[key]) {
          changedProps[key] = {
            from: prevProps[key],
            to: nextProps[key],
          };
        }
      });
      
      if (Object.keys(changedProps).length > 0) {
        console.log(`[PROPS] ${componentName}:`, changedProps);
      }
    }
  },

  // Log state changes
  logState: (storeName, prevState, nextState) => {
    if (process.env.NODE_ENV === 'development') {
      const changes = {};
      
      Object.keys(nextState).forEach(key => {
        if (prevState[key] !== nextState[key]) {
          changes[key] = {
            from: prevState[key],
            to: nextState[key],
          };
        }
      });
      
      if (Object.keys(changes).length > 0) {
        console.log(`[STATE] ${storeName}:`, changes);
      }
    }
  },

  // Performance warning
  warnSlowRender: (componentName, renderTime, threshold = 16) => {
    if (renderTime > threshold && process.env.NODE_ENV === 'development') {
      console.warn(`[PERF] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  },

  // Memory warning
  warnMemoryUsage: (threshold = 100 * 1024 * 1024) => {
    if (performance.memory && performance.memory.usedJSHeapSize > threshold) {
      console.warn(`[MEMORY] High memory usage: ${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
  },
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.clear();
    renderTracker.clear();
    stateTracker.clear();
    memoryMonitor.clear();
    errorBoundary.clear();
  });
}

// Export development tools
export const devTools = {
  performanceMonitor,
  renderTracker,
  stateTracker,
  memoryMonitor,
  errorBoundary,
  devUtils,
  
  // Get all stats
  getStats: () => ({
    performance: performanceMonitor.getStats(),
    memory: memoryMonitor.getStats(),
    errors: errorBoundary.getErrors(),
  }),
  
  // Clear all data
  clear: () => {
    performanceMonitor.clear();
    renderTracker.clear();
    stateTracker.clear();
    memoryMonitor.clear();
    errorBoundary.clear();
  },
};

export default devTools;
