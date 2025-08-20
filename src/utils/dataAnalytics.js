import { performanceUtils } from './usePerformanceMonitor.jsx';

// Data analytics system
export class DataAnalytics {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.endpoint = options.endpoint || '/api/analytics';
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 30000;
    this.events = [];
    this.flushTimer = null;
    this.metrics = new Map();
    this.performanceData = [];
    this.userActions = [];
    this.errorLogs = [];
    this.maxEvents = 1000;
    this.maxPerformanceData = 100;
    this.analyticsEnabled = process.env.NODE_ENV === 'development' || false;
  }

  // Initialize analytics
  initialize(options = {}) {
    const {
      enabled = this.analyticsEnabled,
      maxEvents = 1000,
      maxPerformanceData = 100,
      trackPerformance = true,
      trackUserActions = true,
      trackErrors = true
    } = options;

    this.analyticsEnabled = enabled;
    this.maxEvents = maxEvents;
    this.maxPerformanceData = maxPerformanceData;
    this.trackPerformance = trackPerformance;
    this.trackUserActions = trackUserActions;
    this.trackErrors = trackErrors;

    if (this.analyticsEnabled) {
      console.log('[Analytics] Initialized with options:', options);
    }
  }

  // Track an event
  trackEvent(eventName, properties = {}) {
    if (!this.enabled) return;

    const event = {
      name: eventName,
      properties,
      timestamp: Date.now()
    };

    this.events.push(event);

    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  // Track user action
  trackUserAction(action, details = {}) {
    if (!this.analyticsEnabled || !this.trackUserActions) return;

    const userAction = {
      action,
      details,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    this.userActions.push(userAction);
    this.trimUserActions();

    this.trackEvent('user_action', { action, details });
  }

  // Track performance metric
  trackPerformance(metricName, value, metadata = {}) {
    if (!this.analyticsEnabled || !this.trackPerformance) return;

    const performanceMetric = {
      name: metricName,
      value,
      metadata,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    this.performanceData.push(performanceMetric);
    this.trimPerformanceData();

    // Update metrics map
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    this.metrics.get(metricName).push(performanceMetric);

    this.trackEvent('performance_metric', { metricName, value, metadata });
  }

  // Track error
  trackError(error, context = {}) {
    if (!this.analyticsEnabled || !this.trackErrors) return;

    const errorLog = {
      error: error.message || error,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    this.errorLogs.push(errorLog);
    this.trimErrorLogs();

    this.trackEvent('error', { error: error.message, context });
  }

  // Track preset operations
  trackPresetOperation(operation, presetName, success = true, details = {}) {
    this.trackEvent('preset_operation', {
      operation,
      presetName,
      success,
      details
    });

    this.trackUserAction('preset_operation', {
      operation,
      presetName,
      success
    });
  }

  // Track settings changes
  trackSettingsChange(settingKey, oldValue, newValue, category = 'general') {
    this.trackEvent('settings_change', {
      settingKey,
      oldValue,
      newValue,
      category
    });

    this.trackUserAction('settings_change', {
      settingKey,
      category
    });
  }

  // Track channel interactions
  trackChannelInteraction(channelId, interactionType, details = {}) {
    this.trackEvent('channel_interaction', {
      channelId,
      interactionType,
      details
    });

    this.trackUserAction('channel_interaction', {
      channelId,
      interactionType
    });
  }

  // Track wallpaper operations
  trackWallpaperOperation(operation, details = {}) {
    this.trackEvent('wallpaper_operation', {
      operation,
      details
    });

    this.trackUserAction('wallpaper_operation', {
      operation
    });
  }

  // Track modal interactions
  trackModalInteraction(modalName, action, details = {}) {
    this.trackEvent('modal_interaction', {
      modalName,
      action,
      details
    });

    this.trackUserAction('modal_interaction', {
      modalName,
      action
    });
  }

  // Track performance measurement
  trackPerformanceMeasurement(componentName, renderTime, metadata = {}) {
    this.trackPerformance('component_render_time', renderTime, {
      componentName,
      ...metadata
    });
  }

  // Track data layer operations
  trackDataOperation(operation, dataType, success = true, duration = null, details = {}) {
    this.trackEvent('data_operation', {
      operation,
      dataType,
      success,
      duration,
      details
    });

    if (duration !== null) {
      this.trackPerformance('data_operation_duration', duration, {
        operation,
        dataType,
        success
      });
    }
  }

  // Get analytics summary
  getAnalyticsSummary() {
    return {
      totalEvents: this.events.length,
      totalUserActions: this.userActions.length,
      totalPerformanceData: this.performanceData.length,
      totalErrors: this.errorLogs.length,
      sessionId: this.getSessionId(),
      sessionStartTime: this.getSessionStartTime(),
      sessionDuration: Date.now() - this.getSessionStartTime()
    };
  }

  // Get performance insights
  getPerformanceInsights() {
    const insights = {};

    // Component render times
    const renderTimes = this.performanceData.filter(d => d.name === 'component_render_time');
    if (renderTimes.length > 0) {
      const avgRenderTime = renderTimes.reduce((sum, d) => sum + d.value, 0) / renderTimes.length;
      const maxRenderTime = Math.max(...renderTimes.map(d => d.value));
      const minRenderTime = Math.min(...renderTimes.map(d => d.value));

      insights.componentRenderTimes = {
        average: avgRenderTime,
        maximum: maxRenderTime,
        minimum: minRenderTime,
        count: renderTimes.length
      };
    }

    // Data operation durations
    const dataOperations = this.performanceData.filter(d => d.name === 'data_operation_duration');
    if (dataOperations.length > 0) {
      const avgDuration = dataOperations.reduce((sum, d) => sum + d.value, 0) / dataOperations.length;
      const maxDuration = Math.max(...dataOperations.map(d => d.value));
      const minDuration = Math.min(...dataOperations.map(d => d.value));

      insights.dataOperations = {
        average: avgDuration,
        maximum: maxDuration,
        minimum: minDuration,
        count: dataOperations.length
      };
    }

    return insights;
  }

  // Get user behavior insights
  getUserBehaviorInsights() {
    const insights = {};

    // Most common user actions
    const actionCounts = {};
    this.userActions.forEach(action => {
      actionCounts[action.action] = (actionCounts[action.action] || 0) + 1;
    });

    insights.mostCommonActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    // Preset usage patterns
    const presetOperations = this.events.filter(e => e.name === 'preset_operation');
    const presetCounts = {};
    presetOperations.forEach(event => {
      const operation = event.data.operation;
      presetCounts[operation] = (presetCounts[operation] || 0) + 1;
    });

    insights.presetUsage = Object.entries(presetCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([operation, count]) => ({ operation, count }));

    // Settings change patterns
    const settingsChanges = this.events.filter(e => e.name === 'settings_change');
    const settingCounts = {};
    settingsChanges.forEach(event => {
      const category = event.data.category;
      settingCounts[category] = (settingCounts[category] || 0) + 1;
    });

    insights.settingsChanges = Object.entries(settingCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }));

    return insights;
  }

  // Get error insights
  getErrorInsights() {
    const insights = {};

    // Error frequency
    const errorCounts = {};
    this.errorLogs.forEach(error => {
      const errorType = error.error.split(':')[0];
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });

    insights.errorFrequency = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([errorType, count]) => ({ errorType, count }));

    // Error timeline
    const recentErrors = this.errorLogs
      .filter(error => Date.now() - error.timestamp < 24 * 60 * 60 * 1000) // Last 24 hours
      .sort((a, b) => b.timestamp - a.timestamp);

    insights.recentErrors = recentErrors.slice(0, 10);

    return insights;
  }

  // Export analytics data
  exportAnalyticsData() {
    return {
      summary: this.getAnalyticsSummary(),
      performance: this.getPerformanceInsights(),
      userBehavior: this.getUserBehaviorInsights(),
      errors: this.getErrorInsights(),
      rawData: {
        events: this.events,
        userActions: this.userActions,
        performanceData: this.performanceData,
        errorLogs: this.errorLogs
      }
    };
  }

  // Clear analytics data
  clearAnalyticsData() {
    this.events = [];
    this.userActions = [];
    this.performanceData = [];
    this.errorLogs = [];
    this.metrics.clear();
  }

  // Utility methods
  trimEvents() {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  trimUserActions() {
    if (this.userActions.length > this.maxEvents) {
      this.userActions = this.userActions.slice(-this.maxEvents);
    }
  }

  trimPerformanceData() {
    if (this.performanceData.length > this.maxPerformanceData) {
      this.performanceData = this.performanceData.slice(-this.maxPerformanceData);
    }
  }

  trimErrorLogs() {
    if (this.errorLogs.length > this.maxEvents) {
      this.errorLogs = this.errorLogs.slice(-this.maxEvents);
    }
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  getSessionStartTime() {
    if (!this.sessionStartTime) {
      this.sessionStartTime = Date.now();
    }
    return this.sessionStartTime;
  }
}

// Create singleton instance
const dataAnalytics = new DataAnalytics();

// Export utility functions
export const trackEvent = (eventName, data) => dataAnalytics.trackEvent(eventName, data);
export const trackUserAction = (action, details) => dataAnalytics.trackUserAction(action, details);
export const trackPerformance = (metricName, value, metadata) => dataAnalytics.trackPerformance(metricName, value, metadata);
export const trackError = (error, context) => dataAnalytics.trackError(error, context);
export const trackPresetOperation = (operation, presetName, success, details) => dataAnalytics.trackPresetOperation(operation, presetName, success, details);
export const trackSettingsChange = (settingKey, oldValue, newValue, category) => dataAnalytics.trackSettingsChange(settingKey, oldValue, newValue, category);
export const trackChannelInteraction = (channelId, interactionType, details) => dataAnalytics.trackChannelInteraction(channelId, interactionType, details);
export const trackWallpaperOperation = (operation, details) => dataAnalytics.trackWallpaperOperation(operation, details);
export const trackModalInteraction = (modalName, action, details) => dataAnalytics.trackModalInteraction(modalName, action, details);
export const trackPerformanceMeasurement = (componentName, renderTime, metadata) => dataAnalytics.trackPerformanceMeasurement(componentName, renderTime, metadata);
export const trackDataOperation = (operation, dataType, success, duration, details) => dataAnalytics.trackDataOperation(operation, dataType, success, duration, details);
export const getAnalyticsSummary = () => dataAnalytics.getAnalyticsSummary();
export const getPerformanceInsights = () => dataAnalytics.getPerformanceInsights();
export const getUserBehaviorInsights = () => dataAnalytics.getUserBehaviorInsights();
export const getErrorInsights = () => dataAnalytics.getErrorInsights();
export const exportAnalyticsData = () => dataAnalytics.exportAnalyticsData();
export const clearAnalyticsData = () => dataAnalytics.clearAnalyticsData();
export const initializeAnalytics = (options) => dataAnalytics.initialize(options);

// Export the analytics instance
export default dataAnalytics;
