// Memory Optimization Utility
// Helps detect and prevent memory leaks in the application

class MemoryOptimizer {
  constructor() {
    this.cleanupTasks = new Map();
    this.intervalRefs = new Set();
    this.timeoutRefs = new Set();
    this.audioRefs = new Set();
    this.videoRefs = new Set();
    this.canvasRefs = new Set();
    this.eventListeners = new Map();
    this.urlObjects = new Set();
  }

  // Track and cleanup intervals
  trackInterval(intervalId, componentName = 'unknown') {
    this.intervalRefs.add(intervalId);
    if (!this.cleanupTasks.has(componentName)) {
      this.cleanupTasks.set(componentName, []);
    }
    this.cleanupTasks.get(componentName).push(() => {
      clearInterval(intervalId);
      this.intervalRefs.delete(intervalId);
    });
    return intervalId;
  }

  // Track and cleanup timeouts
  trackTimeout(timeoutId, componentName = 'unknown') {
    this.timeoutRefs.add(timeoutId);
    if (!this.cleanupTasks.has(componentName)) {
      this.cleanupTasks.set(componentName, []);
    }
    this.cleanupTasks.get(componentName).push(() => {
      clearTimeout(timeoutId);
      this.timeoutRefs.delete(timeoutId);
    });
    return timeoutId;
  }

  // Track and cleanup audio elements
  trackAudio(audio, componentName = 'unknown') {
    this.audioRefs.add(audio);
    if (!this.cleanupTasks.has(componentName)) {
      this.cleanupTasks.set(componentName, []);
    }
    this.cleanupTasks.get(componentName).push(() => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
        this.audioRefs.delete(audio);
      }
    });
    return audio;
  }

  // Track and cleanup video elements
  trackVideo(video, componentName = 'unknown') {
    this.videoRefs.add(video);
    if (!this.cleanupTasks.has(componentName)) {
      this.cleanupTasks.set(componentName, []);
    }
    this.cleanupTasks.get(componentName).push(() => {
      if (video) {
        video.pause();
        video.src = '';
        video.load();
        this.videoRefs.delete(video);
      }
    });
    return video;
  }

  // Track and cleanup canvas elements
  trackCanvas(canvas, componentName = 'unknown') {
    this.canvasRefs.add(canvas);
    if (!this.cleanupTasks.has(componentName)) {
      this.cleanupTasks.set(componentName, []);
    }
    this.cleanupTasks.get(componentName).push(() => {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        this.canvasRefs.delete(canvas);
      }
    });
    return canvas;
  }

  // Track and cleanup event listeners
  trackEventListener(element, event, handler, componentName = 'unknown') {
    const key = `${componentName}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push({ element, event, handler });
    
    if (!this.cleanupTasks.has(componentName)) {
      this.cleanupTasks.set(componentName, []);
    }
    this.cleanupTasks.get(componentName).push(() => {
      element.removeEventListener(event, handler);
    });
  }

  // Track and cleanup URL objects
  trackUrlObject(url, componentName = 'unknown') {
    this.urlObjects.add(url);
    if (!this.cleanupTasks.has(componentName)) {
      this.cleanupTasks.set(componentName, []);
    }
    this.cleanupTasks.get(componentName).push(() => {
      if (url && typeof url === 'string' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
        this.urlObjects.delete(url);
      }
    });
    return url;
  }

  // Cleanup all resources for a specific component
  cleanupComponent(componentName) {
    const tasks = this.cleanupTasks.get(componentName);
    if (tasks) {
      tasks.forEach(task => task());
      this.cleanupTasks.delete(componentName);
    }
  }

  // Cleanup all resources
  cleanupAll() {
    // Clear all intervals
    this.intervalRefs.forEach(intervalId => clearInterval(intervalId));
    this.intervalRefs.clear();

    // Clear all timeouts
    this.timeoutRefs.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeoutRefs.clear();

    // Cleanup all audio elements
    this.audioRefs.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
      }
    });
    this.audioRefs.clear();

    // Cleanup all video elements
    this.videoRefs.forEach(video => {
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
    });
    this.videoRefs.clear();

    // Cleanup all canvas elements
    this.canvasRefs.forEach(canvas => {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    });
    this.canvasRefs.clear();

    // Cleanup all event listeners
    this.eventListeners.forEach(listeners => {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();

    // Cleanup all URL objects
    this.urlObjects.forEach(url => {
      if (url && typeof url === 'string' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.urlObjects.clear();

    // Run all cleanup tasks
    this.cleanupTasks.forEach(tasks => {
      tasks.forEach(task => task());
    });
    this.cleanupTasks.clear();
  }

  // Get memory usage statistics
  getStats() {
    return {
      intervals: this.intervalRefs.size,
      timeouts: this.timeoutRefs.size,
      audioElements: this.audioRefs.size,
      videoElements: this.videoRefs.size,
      canvasElements: this.canvasRefs.size,
      eventListeners: Array.from(this.eventListeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
      urlObjects: this.urlObjects.size,
      cleanupTasks: this.cleanupTasks.size,
      totalTracked: this.intervalRefs.size + this.timeoutRefs.size + this.audioRefs.size + 
                   this.videoRefs.size + this.canvasRefs.size + this.urlObjects.size
    };
  }

  // Log memory usage for debugging
  logStats() {
    const stats = this.getStats();
    // Remove all console.log and console.warn statements
  }
}

// Create a singleton instance
const memoryOptimizer = new MemoryOptimizer();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryOptimizer.cleanupAll();
  });
}

export default memoryOptimizer; 