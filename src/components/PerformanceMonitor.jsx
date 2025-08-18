import React, { useState, useEffect, useCallback } from 'react';
import { usePerformanceState } from '../utils/useConsolidatedAppHooks';
import Card from '../ui/Card';
import Text from '../ui/Text';
import Button from '../ui/WButton';
import WToggle from '../ui/WToggle';

const PerformanceMonitor = ({ isVisible, onClose }) => {
  const { performance, performanceManager } = usePerformanceState();
  const {
    isMonitoring,
    metrics,
    alerts,
    thresholds
  } = performance;

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh performance data
  useEffect(() => {
    if (isVisible && autoRefresh && isMonitoring) {
      const interval = setInterval(() => {
        // Force re-render to show updated metrics
        performanceManager.getPerformanceReport();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible, autoRefresh, isMonitoring, performanceManager]);

  const handleToggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      performanceManager.stopMonitoring();
    } else {
      performanceManager.startMonitoring();
    }
  }, [isMonitoring, performanceManager]);

  const handleClearAlerts = useCallback(() => {
    performanceManager.clearAlerts();
  }, [performanceManager]);

  const getPerformanceReport = useCallback(() => {
    return performanceManager.getPerformanceReport();
  }, [performanceManager]);

  const report = getPerformanceReport();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <Text variant="h2" className="text-white">
            Performance Monitor
          </Text>
          <Button onClick={onClose} variant="secondary" size="sm">
            Close
          </Button>
        </div>

        {/* Controls */}
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <WToggle
                checked={isMonitoring}
                onChange={handleToggleMonitoring}
                label="Performance Monitoring"
              />
              <WToggle
                checked={autoRefresh}
                onChange={setAutoRefresh}
                label="Auto Refresh"
              />
            </div>
            <Button onClick={handleClearAlerts} variant="secondary" size="sm">
              Clear Alerts
            </Button>
          </div>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <Text variant="caption" className="text-gray-400">
              Average FPS
            </Text>
            <Text variant="h3" className="text-white">
              {report.averageFps}
            </Text>
            <Text variant="caption" className="text-gray-400">
              Target: {thresholds.minFps}+
            </Text>
          </Card>

          <Card className="p-4">
            <Text variant="caption" className="text-gray-400">
              Memory Usage
            </Text>
            <Text variant="h3" className="text-white">
              {report.averageMemory}MB
            </Text>
            <Text variant="caption" className="text-gray-400">
              Limit: {Math.round(thresholds.maxMemoryUsage / 1024 / 1024)}MB
            </Text>
          </Card>

          <Card className="p-4">
            <Text variant="caption" className="text-gray-400">
              Active Alerts
            </Text>
            <Text variant="h3" className="text-white">
              {report.totalAlerts}
            </Text>
            <Text variant="caption" className="text-gray-400">
              Performance Issues
            </Text>
          </Card>

          <Card className="p-4">
            <Text variant="caption" className="text-gray-400">
              Slowest Component
            </Text>
            <Text variant="h3" className="text-white truncate">
              {report.slowestComponent}
            </Text>
            <Text variant="caption" className="text-gray-400">
              Render Time
            </Text>
          </Card>
        </div>

        {/* Real-time Metrics */}
        {isMonitoring && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* FPS Chart */}
            <Card className="p-4">
              <Text variant="h4" className="text-white mb-4">
                FPS Over Time
              </Text>
              <div className="h-32 bg-gray-800 rounded flex items-end space-x-1 p-2">
                {metrics.fps.slice(-30).map((fps, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{
                      height: `${Math.min((fps / 60) * 100, 100)}%`,
                      backgroundColor: fps < thresholds.minFps ? '#ef4444' : '#3b82f6'
                    }}
                  />
                ))}
              </div>
              <Text variant="caption" className="text-gray-400 mt-2">
                Last 30 samples
              </Text>
            </Card>

            {/* Memory Chart */}
            <Card className="p-4">
              <Text variant="h4" className="text-white mb-4">
                Memory Usage
              </Text>
              <div className="h-32 bg-gray-800 rounded flex items-end space-x-1 p-2">
                {metrics.memoryUsage.slice(-30).map((memory, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-green-500 rounded-t"
                    style={{
                      height: `${Math.min((memory / thresholds.maxMemoryUsage) * 100, 100)}%`,
                      backgroundColor: memory > thresholds.maxMemoryUsage * 0.8 ? '#ef4444' : '#10b981'
                    }}
                  />
                ))}
              </div>
              <Text variant="caption" className="text-gray-400 mt-2">
                Last 30 samples
              </Text>
            </Card>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="p-4">
            <Text variant="h4" className="text-white mb-4">
              Performance Alerts
            </Text>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded ${
                    alert.severity === 'warning' ? 'bg-yellow-900 text-yellow-100' : 'bg-red-900 text-red-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Text variant="body" className="font-medium">
                        {alert.message}
                      </Text>
                      <Text variant="caption" className="opacity-75">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </Text>
                    </div>
                    <Text variant="caption" className="uppercase">
                      {alert.type}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Component Performance */}
        {Object.keys(metrics.renderTimes).length > 0 && (
          <Card className="p-4 mt-6">
            <Text variant="h4" className="text-white mb-4">
              Component Render Times
            </Text>
            <div className="space-y-2">
              {Object.entries(metrics.renderTimes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([component, time]) => (
                  <div key={component} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                    <Text variant="body" className="text-white">
                      {component}
                    </Text>
                    <Text
                      variant="body"
                      className={time > thresholds.maxRenderTime ? 'text-red-400' : 'text-green-400'}
                    >
                      {time.toFixed(2)}ms
                    </Text>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;




