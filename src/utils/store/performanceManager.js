import { isRendererActive } from './manager-utils';
import { IS_DEV } from '../env.js';

export const createPerformanceManager = (getStore) => {
  const manager = {
    fpsInterval: null,
    memoryInterval: null,
    startMonitoring() {
      if (!IS_DEV) {
        return;
      }
      const store = getStore();
      store.actions.setPerformanceState({ isMonitoring: true, loading: false });
      manager.startFpsMonitoring();
      manager.startMemoryMonitoring();
    },
    stopMonitoring() {
      const store = getStore();
      store.actions.setPerformanceState({ isMonitoring: false });
      if (manager.fpsInterval) {
        clearInterval(manager.fpsInterval);
      }
      if (manager.memoryInterval) {
        clearInterval(manager.memoryInterval);
      }
    },
    startFpsMonitoring() {
      let frameCount = 0;
      let lastTime = performance.now();
      manager.fpsInterval = setInterval(() => {
        if (!isRendererActive()) {
          frameCount = 0;
          lastTime = performance.now();
          return;
        }

        const currentTime = performance.now();
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        const store = getStore();
        const { metrics, thresholds } = store.performance;
        const newFps = [...metrics.fps, fps].slice(-60);
        const alerts = [...store.performance.alerts];
        if (fps < thresholds.minFps) {
          alerts.push({
            type: 'fps',
            message: `Low FPS detected: ${fps}`,
            timestamp: Date.now(),
            severity: 'warning',
          });
        }
        store.actions.setPerformanceState({
          metrics: { ...metrics, fps: newFps },
          alerts: alerts.slice(-10),
        });
        frameCount = 0;
        lastTime = currentTime;
      }, 1000);

      const countFrame = () => {
        frameCount++;
        requestAnimationFrame(countFrame);
      };
      requestAnimationFrame(countFrame);
    },
    startMemoryMonitoring() {
      manager.memoryInterval = setInterval(() => {
        if (!isRendererActive()) {
          return;
        }

        if (!performance.memory) {
          return;
        }
        const memoryUsage = performance.memory.usedJSHeapSize;
        const store = getStore();
        const { metrics, thresholds } = store.performance;
        const newMemoryUsage = [...metrics.memoryUsage, memoryUsage].slice(-60);
        const alerts = [...store.performance.alerts];
        if (memoryUsage > thresholds.maxMemoryUsage) {
          alerts.push({
            type: 'memory',
            message: `High memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`,
            timestamp: Date.now(),
            severity: 'warning',
          });
        }
        store.actions.setPerformanceState({
          metrics: { ...metrics, memoryUsage: newMemoryUsage },
          alerts: alerts.slice(-10),
        });
      }, 5000);
    },
    recordRenderTime(componentName, renderTime) {
      const store = getStore();
      const { metrics, thresholds } = store.performance;
      const renderTimes = { ...metrics.renderTimes, [componentName]: renderTime };
      const alerts = [...store.performance.alerts];
      if (renderTime > thresholds.maxRenderTime) {
        alerts.push({
          type: 'render',
          message: `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`,
          timestamp: Date.now(),
          severity: 'warning',
        });
      }
      store.actions.setPerformanceState({
        metrics: { ...metrics, renderTimes },
        alerts: alerts.slice(-10),
      });
    },
    recordReRender(componentName) {
      const store = getStore();
      const { metrics } = store.performance;
      const reRenderCounts = {
        ...metrics.reRenderCounts,
        [componentName]: (metrics.reRenderCounts[componentName] || 0) + 1,
      };
      store.actions.setPerformanceState({ metrics: { ...metrics, reRenderCounts } });
    },
    clearAlerts() {
      const store = getStore();
      store.actions.setPerformanceState({ alerts: [] });
    },
    getPerformanceReport() {
      const store = getStore();
      const { metrics, alerts } = store.performance;
      const avgFps = metrics.fps.length > 0
        ? metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length
        : 0;
      const avgMemory = metrics.memoryUsage.length > 0
        ? metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length
        : 0;
      return {
        averageFps: Math.round(avgFps),
        averageMemory: Math.round(avgMemory / 1024 / 1024),
        totalAlerts: alerts.length,
        slowestComponent: Object.entries(metrics.renderTimes).sort(([, a], [, b]) => b - a)[0]?.[0] || 'None',
        mostReRendered: Object.entries(metrics.reRenderCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'None',
      };
    },
  };

  return manager;
};
