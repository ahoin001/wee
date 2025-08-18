// Error Handling and Logging System
// Provides comprehensive error boundaries, logging, and monitoring

import React from 'react';

// ============================================================================
// ERROR BOUNDARY SYSTEM
// ============================================================================

/**
 * Enhanced error boundary with detailed error reporting
 */
export class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      recoveryAttempts: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = generateErrorId();
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error details
    errorLogger.logError({
      id: errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Send to monitoring service
    if (window.api?.monitoring?.reportError) {
      window.api.monitoring.reportError({
        id: errorId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: Date.now()
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      recoveryAttempts: prevState.recoveryAttempts + 1
    }));
  };

  handleReset = () => {
    // Reset the entire application state
    if (window.api?.app?.reset) {
      window.api.app.reset();
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      recoveryAttempts: 0
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          recoveryAttempts={this.state.recoveryAttempts}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error fallback component with recovery options
 */
const ErrorFallback = ({ error, errorInfo, errorId, recoveryAttempts, onRetry, onReset }) => {
  const maxRetries = 3;

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '1px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#fff5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ color: '#d63031', marginBottom: '16px' }}>
        🚨 Something went wrong
      </h2>
      
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#2d3436', marginBottom: '8px' }}>
          <strong>Error ID:</strong> {errorId}
        </p>
        <p style={{ color: '#2d3436', marginBottom: '8px' }}>
          <strong>Error:</strong> {error?.message || 'Unknown error'}
        </p>
        {recoveryAttempts > 0 && (
          <p style={{ color: '#e17055', marginBottom: '8px' }}>
            <strong>Recovery attempts:</strong> {recoveryAttempts}/{maxRetries}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={onRetry}
          disabled={recoveryAttempts >= maxRetries}
          style={{
            padding: '8px 16px',
            marginRight: '8px',
            backgroundColor: recoveryAttempts >= maxRetries ? '#b2bec3' : '#00b894',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: recoveryAttempts >= maxRetries ? 'not-allowed' : 'pointer'
          }}
        >
          {recoveryAttempts >= maxRetries ? 'Max retries reached' : 'Try Again'}
        </button>
        
        <button
          onClick={onReset}
          style={{
            padding: '8px 16px',
            backgroundColor: '#e17055',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset Application
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '16px' }}>
          <summary style={{ cursor: 'pointer', color: '#2d3436' }}>
            Error Details (Development)
          </summary>
          <pre style={{
            backgroundColor: '#f8f9fa',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
            marginTop: '8px'
          }}>
            {error?.stack}
            {'\n\n'}
            {errorInfo?.componentStack}
          </pre>
        </details>
      )}
    </div>
  );
};

// ============================================================================
// LOGGING SYSTEM
// ============================================================================

/**
 * Production-grade logging system
 */
export const errorLogger = {
  // Log levels
  levels: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  },

  // Log storage
  logs: [],
  maxLogs: 1000,

  // Log configuration
  config: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    enableConsole: true,
    enableStorage: true,
    enableRemote: false,
    maxLogs: 1000
  },

  /**
   * Log an error with detailed information
   */
  logError: (errorData) => {
    const logEntry = {
      id: errorData.id || generateErrorId(),
      level: errorLogger.levels.ERROR,
      message: errorData.error,
      stack: errorData.stack,
      componentStack: errorData.componentStack,
      timestamp: errorData.timestamp || Date.now(),
      userAgent: errorData.userAgent || navigator.userAgent,
      url: errorData.url || window.location.href,
      sessionId: getSessionId(),
      additionalData: errorData.additionalData || {}
    };

    errorLogger.addLog(logEntry);
    errorLogger.sendToRemote(logEntry);
  },

  /**
   * Log a warning
   */
  logWarning: (message, data = {}) => {
    const logEntry = {
      id: generateLogId(),
      level: errorLogger.levels.WARN,
      message,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: getSessionId(),
      additionalData: data
    };

    errorLogger.addLog(logEntry);
  },

  /**
   * Log an info message
   */
  logInfo: (message, data = {}) => {
    const logEntry = {
      id: generateLogId(),
      level: errorLogger.levels.INFO,
      message,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: getSessionId(),
      additionalData: data
    };

    errorLogger.addLog(logEntry);
  },

  /**
   * Log a debug message
   */
  logDebug: (message, data = {}) => {
    if (errorLogger.config.level === errorLogger.levels.DEBUG) {
      const logEntry = {
        id: generateLogId(),
        level: errorLogger.levels.DEBUG,
        message,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: getSessionId(),
        additionalData: data
      };

      errorLogger.addLog(logEntry);
    }
  },

  /**
   * Add log entry to storage
   */
  addLog: (logEntry) => {
    // Add to memory
    errorLogger.logs.push(logEntry);

    // Keep only recent logs
    if (errorLogger.logs.length > errorLogger.config.maxLogs) {
      errorLogger.logs.shift();
    }

    // Console output
    if (errorLogger.config.enableConsole) {
      const consoleMethod = logEntry.level === 'error' ? 'error' : 
                           logEntry.level === 'warn' ? 'warn' : 
                           logEntry.level === 'info' ? 'info' : 'log';
      
      console[consoleMethod](`[${logEntry.level.toUpperCase()}] ${logEntry.message}`, logEntry);
    }

    // Local storage
    if (errorLogger.config.enableStorage) {
      try {
        const storedLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
        storedLogs.push(logEntry);
        
        // Keep only recent logs in storage
        if (storedLogs.length > errorLogger.config.maxLogs) {
          storedLogs.splice(0, storedLogs.length - errorLogger.config.maxLogs);
        }
        
        localStorage.setItem('app_logs', JSON.stringify(storedLogs));
      } catch (error) {
        console.error('Failed to store log:', error);
      }
    }
  },

  /**
   * Send log to remote service
   */
  sendToRemote: async (logEntry) => {
    if (!errorLogger.config.enableRemote) return;

    try {
      if (window.api?.logging?.send) {
        await window.api.logging.send(logEntry);
      }
    } catch (error) {
      console.error('Failed to send log to remote service:', error);
    }
  },

  /**
   * Get all logs
   */
  getLogs: (level = null, limit = null) => {
    let logs = [...errorLogger.logs];

    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs;
  },

  /**
   * Clear all logs
   */
  clearLogs: () => {
    errorLogger.logs = [];
    localStorage.removeItem('app_logs');
  },

  /**
   * Export logs
   */
  exportLogs: () => {
    const logs = errorLogger.getLogs();
    const exportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      logs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app_logs_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// ============================================================================
// MONITORING SYSTEM
// ============================================================================

/**
 * Application monitoring system
 */
export const appMonitor = {
  // Performance metrics
  metrics: {
    pageLoads: [],
    userInteractions: [],
    errors: [],
    performance: []
  },

  // Monitoring configuration
  config: {
    enabled: true,
    sampleRate: 0.1, // 10% of events
    maxMetrics: 1000
  },

  /**
   * Initialize monitoring
   */
  init: () => {
    if (appMonitor.config.enabled) {
      appMonitor.startMonitoring();
    }
  },

  /**
   * Start monitoring various aspects
   */
  startMonitoring: () => {
    // Monitor page loads
    appMonitor.monitorPageLoads();
    
    // Monitor user interactions
    appMonitor.monitorUserInteractions();
    
    // Monitor performance
    appMonitor.monitorPerformance();
    
    // Monitor errors
    appMonitor.monitorErrors();
  },

  /**
   * Monitor page load performance
   */
  monitorPageLoads: () => {
    window.addEventListener('load', () => {
      if (Math.random() < appMonitor.config.sampleRate) {
        const loadTime = performance.now();
        const navigation = performance.getEntriesByType('navigation')[0];
        
        appMonitor.recordMetric('pageLoads', {
          loadTime,
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime,
          url: window.location.href,
          timestamp: Date.now()
        });
      }
    });
  },

  /**
   * Monitor user interactions
   */
  monitorUserInteractions: () => {
    const events = ['click', 'input', 'scroll', 'keydown'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        if (Math.random() < appMonitor.config.sampleRate) {
          appMonitor.recordMetric('userInteractions', {
            type: eventType,
            target: event.target.tagName,
            targetId: event.target.id,
            targetClass: event.target.className,
            timestamp: Date.now()
          });
        }
      }, { passive: true });
    });
  },

  /**
   * Monitor performance metrics
   */
  monitorPerformance: () => {
    setInterval(() => {
      if (performance.memory) {
        appMonitor.recordMetric('performance', {
          memoryUsage: performance.memory.usedJSHeapSize,
          memoryLimit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now()
        });
      }
    }, 30000); // Every 30 seconds
  },

  /**
   * Monitor errors
   */
  monitorErrors: () => {
    window.addEventListener('error', (event) => {
      appMonitor.recordMetric('errors', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
        timestamp: Date.now()
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      appMonitor.recordMetric('errors', {
        type: 'unhandledrejection',
        reason: event.reason,
        timestamp: Date.now()
      });
    });
  },

  /**
   * Record a metric
   */
  recordMetric: (type, data) => {
    if (!appMonitor.metrics[type]) {
      appMonitor.metrics[type] = [];
    }

    appMonitor.metrics[type].push(data);

    // Keep only recent metrics
    if (appMonitor.metrics[type].length > appMonitor.config.maxMetrics) {
      appMonitor.metrics[type].shift();
    }

    // Send to remote service
    appMonitor.sendToRemote(type, data);
  },

  /**
   * Send metric to remote service
   */
  sendToRemote: async (type, data) => {
    try {
      if (window.api?.monitoring?.recordMetric) {
        await window.api.monitoring.recordMetric(type, data);
      }
    } catch (error) {
      console.error('Failed to send metric to remote service:', error);
    }
  },

  /**
   * Get monitoring statistics
   */
  getStats: () => {
    const stats = {};

    Object.keys(appMonitor.metrics).forEach(type => {
      const metrics = appMonitor.metrics[type];
      stats[type] = {
        count: metrics.length,
        recent: metrics.slice(-10) // Last 10 metrics
      };
    });

    return stats;
  }
};

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Security utilities for data protection
 */
export const securityUtils = {
  /**
   * Sanitize user input
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  /**
   * Validate data structure
   */
  validateData: (data, schema) => {
    // Simple validation - in production, use a proper validation library
    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Data must be an object'] };
    }

    const errors = [];

    Object.keys(schema).forEach(key => {
      const value = data[key];
      const rule = schema[key];

      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
      }

      if (value !== undefined && value !== null) {
        if (rule.type && typeof value !== rule.type) {
          errors.push(`${key} must be of type ${rule.type}`);
        }

        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${key} must be at least ${rule.minLength} characters`);
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${key} must be at most ${rule.maxLength} characters`);
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${key} does not match required pattern`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Encrypt sensitive data (basic implementation)
   */
  encrypt: (data) => {
    // In production, use proper encryption
    return btoa(JSON.stringify(data));
  },

  /**
   * Decrypt sensitive data (basic implementation)
   */
  decrypt: (encryptedData) => {
    // In production, use proper decryption
    try {
      return JSON.parse(atob(encryptedData));
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique error ID
 */
const generateErrorId = () => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate unique log ID
 */
const generateLogId = () => {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  EnhancedErrorBoundary,
  errorLogger,
  appMonitor,
  securityUtils
};




