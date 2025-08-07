import { useEffect, useRef, useMemo } from 'react';

// Performance monitoring hook for development
export const usePerformanceMonitor = (componentName, dependencies = []) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} rendered #${renderCount.current} (${timeSinceLastRender}ms since last render)`);
      
      if (renderCount.current > 10) {
        console.warn(`[Performance] ${componentName} has rendered ${renderCount.current} times - consider optimizing`);
      }
    }
  });

  // Log when dependencies change
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && dependencies.length > 0) {
      console.log(`[Performance] ${componentName} dependencies changed:`, dependencies);
    }
  }, dependencies);

  return {
    renderCount: renderCount.current,
    timeSinceLastRender: Date.now() - lastRenderTime.current
  };
};

// Hook to measure component render time
export const useRenderTimer = (componentName) => {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render (target: <16ms)`);
    }
    
    startTime.current = performance.now();
  });
};

// Hook to detect unnecessary re-renders
export const useRenderDebugger = (componentName, props) => {
  const prevProps = useRef({});

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const changedProps = {};
      let hasChanges = false;

      Object.keys(props).forEach(key => {
        if (prevProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: prevProps.current[key],
            to: props[key]
          };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        console.log(`[Performance] ${componentName} re-rendered due to prop changes:`, changedProps);
      }
    }

    prevProps.current = { ...props };
  });
};

// Hook to optimize expensive calculations
export const useExpensiveCalculation = (calculation, dependencies, options = {}) => {
  const { maxCacheSize = 100, cacheTimeout = 5000 } = options;
  const cache = useRef(new Map());
  const lastCalculation = useRef(0);

  return useMemo(() => {
    const now = Date.now();
    const cacheKey = JSON.stringify(dependencies);
    
    // Check cache
    const cached = cache.current.get(cacheKey);
    if (cached && (now - cached.timestamp) < cacheTimeout) {
      return cached.value;
    }

    // Perform calculation
    const result = calculation();
    
    // Cache result
    cache.current.set(cacheKey, {
      value: result,
      timestamp: now
    });

    // Clean up old cache entries
    if (cache.current.size > maxCacheSize) {
      const entries = Array.from(cache.current.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cache.current = new Map(entries.slice(0, maxCacheSize));
    }

    return result;
  }, dependencies);
};

export default usePerformanceMonitor;
