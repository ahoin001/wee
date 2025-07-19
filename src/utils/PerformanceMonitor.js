// Performance Monitoring Utility
// Tracks resource usage and performance metrics

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: [],
      memory: [],
      cpu: [],
      renderTime: [],
      audioContexts: 0,
      videoElements: 0,
      canvasElements: 0,
      intervals: 0,
      timeouts: 0
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.maxSamples = 60; // Keep last 60 samples (1 minute at 1fps)
  }

  // Start performance monitoring
  startMonitoring(intervalMs = 1000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
    
    console.log('🔍 Performance monitoring started');
  }

  // Stop performance monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('🔍 Performance monitoring stopped');
  }

  // Collect current performance metrics
  collectMetrics() {
    const now = performance.now();
    
    // Calculate FPS
    const deltaTime = now - this.lastFrameTime;
    const fps = deltaTime > 0 ? 1000 / deltaTime : 0;
    this.addMetric('fps', fps);
    this.lastFrameTime = now;

    // Memory usage (if available)
    if (performance.memory) {
      const memoryUsage = {
        used: performance.memory.usedJSHeapSize / 1024 / 1024, // MB
        total: performance.memory.totalJSHeapSize / 1024 / 1024, // MB
        limit: performance.memory.jsHeapSizeLimit / 1024 / 1024 // MB
      };
      this.addMetric('memory', memoryUsage.used);
    }

    // Count DOM elements
    this.metrics.videoElements = document.querySelectorAll('video').length;
    this.metrics.canvasElements = document.querySelectorAll('canvas').length;
    this.metrics.audioElements = document.querySelectorAll('audio').length;

    // Count intervals and timeouts (approximate)
    this.metrics.intervals = this.countIntervals();
    this.metrics.timeouts = this.countTimeouts();
  }

  // Add metric to history
  addMetric(type, value) {
    if (!this.metrics[type]) {
      this.metrics[type] = [];
    }
    
    this.metrics[type].push({
      value,
      timestamp: Date.now()
    });
    
    // Keep only recent samples
    if (this.metrics[type].length > this.maxSamples) {
      this.metrics[type].shift();
    }
  }

  // Get average metric value
  getAverageMetric(type, samples = 10) {
    const metric = this.metrics[type];
    if (!metric || metric.length === 0) return 0;
    
    const recentSamples = metric.slice(-samples);
    const sum = recentSamples.reduce((acc, sample) => acc + sample.value, 0);
    return sum / recentSamples.length;
  }

  // Get current performance status
  getPerformanceStatus() {
    const avgFps = this.getAverageMetric('fps', 10);
    const avgMemory = this.getAverageMetric('memory', 5);
    
    let status = 'good';
    let issues = [];
    
    // Check FPS
    if (avgFps < 30) {
      status = 'poor';
      issues.push(`Low FPS: ${avgFps.toFixed(1)}`);
    } else if (avgFps < 50) {
      status = 'fair';
      issues.push(`Moderate FPS: ${avgFps.toFixed(1)}`);
    }
    
    // Check memory usage
    if (avgMemory > 500) {
      status = 'poor';
      issues.push(`High memory usage: ${avgMemory.toFixed(1)}MB`);
    } else if (avgMemory > 200) {
      status = 'fair';
      issues.push(`Moderate memory usage: ${avgMemory.toFixed(1)}MB`);
    }
    
    // Check resource counts
    if (this.metrics.videoElements > 10) {
      issues.push(`Many video elements: ${this.metrics.videoElements}`);
    }
    
    if (this.metrics.audioElements > 5) {
      issues.push(`Many audio elements: ${this.metrics.audioElements}`);
    }
    
    if (this.metrics.intervals > 20) {
      issues.push(`Many intervals: ${this.metrics.intervals}`);
    }
    
    return {
      status,
      issues,
      metrics: {
        fps: avgFps,
        memory: avgMemory,
        videoElements: this.metrics.videoElements,
        audioElements: this.metrics.audioElements,
        intervals: this.metrics.intervals,
        timeouts: this.metrics.timeouts
      }
    };
  }

  // Count active intervals (approximate)
  countIntervals() {
    // This is a rough estimate - we can't directly count intervals
    // but we can check for common patterns
    let count = 0;
    
    // Check for common interval patterns in the app
    if (window.intervalManager) {
      count += window.intervalManager.getActiveTaskCount?.() || 0;
    }
    
    return count;
  }

  // Count active timeouts (approximate)
  countTimeouts() {
    // This is a rough estimate
    return 0; // We can't directly count timeouts
  }

  // Log performance report
  logPerformanceReport() {
    const status = this.getPerformanceStatus();
    const metrics = status.metrics;
    
    console.log('📊 Performance Report:');
    console.log(`Status: ${status.status.toUpperCase()}`);
    console.log(`FPS: ${metrics.fps.toFixed(1)}`);
    console.log(`Memory: ${metrics.memory.toFixed(1)}MB`);
    console.log(`Video Elements: ${metrics.videoElements}`);
    console.log(`Audio Elements: ${metrics.audioElements}`);
    console.log(`Intervals: ${metrics.intervals}`);
    console.log(`Timeouts: ${metrics.timeouts}`);
    
    if (status.issues.length > 0) {
      console.warn('⚠️ Performance Issues:', status.issues);
    }
  }

  // Get recommendations for performance improvement
  getRecommendations() {
    const status = this.getPerformanceStatus();
    const recommendations = [];
    
    if (status.metrics.fps < 50) {
      recommendations.push({
        type: 'fps',
        priority: 'high',
        message: 'Consider reducing video animations or wallpaper cycling frequency',
        action: 'Reduce resource-intensive features'
      });
    }
    
    if (status.metrics.memory > 200) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: 'Memory usage is high - consider closing unused modals or reducing image quality',
        action: 'Close unused features and reduce image quality'
      });
    }
    
    if (status.metrics.videoElements > 5) {
      recommendations.push({
        type: 'video',
        priority: 'medium',
        message: 'Many video elements detected - consider using static images instead',
        action: 'Use static images for channels instead of videos'
      });
    }
    
    if (status.metrics.audioElements > 3) {
      recommendations.push({
        type: 'audio',
        priority: 'low',
        message: 'Multiple audio elements - ensure proper cleanup',
        action: 'Check audio cleanup in components'
      });
    }
    
    return recommendations;
  }

  // Export performance data
  exportData() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      status: this.getPerformanceStatus(),
      recommendations: this.getRecommendations()
    };
  }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();
  
  // Log performance report every 30 seconds in development
  setInterval(() => {
    performanceMonitor.logPerformanceReport();
  }, 30000);
}

export default performanceMonitor; 