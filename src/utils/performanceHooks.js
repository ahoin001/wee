import { useEffect, useRef, useMemo, useCallback } from 'react';

export const usePerformanceMonitor = (componentName, dependencies = []) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    console.log(`[Performance] ${componentName} rendered ${renderCount.current} times, ${timeSinceLastRender}ms since last render`);
  }, dependencies);
  
  return { renderCount: renderCount.current };
};

export const useRenderTimer = (componentName) => {
  const startTime = useRef(Date.now());
  
  useEffect(() => {
    const renderTime = Date.now() - startTime.current;
    console.log(`[Performance] ${componentName} render took ${renderTime}ms`);
    startTime.current = Date.now();
  });
};

export const useRenderDebugger = (componentName, props) => {
  const prevProps = useRef({});
  
  useEffect(() => {
    const changedProps = {};
    Object.keys(props).forEach(key => {
      if (props[key] !== prevProps.current[key]) {
        changedProps[key] = {
          from: prevProps.current[key],
          to: props[key]
        };
      }
    });
    
    if (Object.keys(changedProps).length > 0) {
      console.log(`[Performance] ${componentName} re-rendered due to prop changes:`, changedProps);
    }
    
    prevProps.current = props;
  });
};

export const useExpensiveCalculation = (calculation, dependencies, options = {}) => {
  const { maxCacheSize = 100, cacheTimeout = 5 * 60 * 1000 } = options; // 5 minutes default
  const cache = useRef(new Map());
  const cacheTimestamps = useRef(new Map());
  
  return useMemo(() => {
    const cacheKey = JSON.stringify(dependencies);
    const now = Date.now();
    
    // Check if we have a valid cached result
    const cachedTimestamp = cacheTimestamps.current.get(cacheKey);
    if (cachedTimestamp && (now - cachedTimestamp) < cacheTimeout) {
      const cachedResult = cache.current.get(cacheKey);
      if (cachedResult !== undefined) {
        return cachedResult;
      }
    }
    
    // Calculate new result
    const result = calculation();
    
    // Cache the result
    cache.current.set(cacheKey, result);
    cacheTimestamps.current.set(cacheKey, now);
    
    // Clean up old cache entries if we exceed max size
    if (cache.current.size > maxCacheSize) {
      const entries = Array.from(cache.current.entries());
      const sortedEntries = entries.sort((a, b) => {
        const timestampA = cacheTimestamps.current.get(a[0]) || 0;
        const timestampB = cacheTimestamps.current.get(b[0]) || 0;
        return timestampA - timestampB;
      });
      
      // Remove oldest entries
      const toRemove = sortedEntries.slice(0, Math.floor(maxCacheSize / 2));
      toRemove.forEach(([key]) => {
        cache.current.delete(key);
        cacheTimestamps.current.delete(key);
      });
    }
    
    return result;
  }, dependencies);
};

// New hook specifically for app search performance
export const useAppSearchPerformance = (searchQuery, filteredApps, selectedAppType) => {
  const searchStartTime = useRef(0);
  const searchCount = useRef(0);
  
  useEffect(() => {
    searchCount.current += 1;
    const searchTime = Date.now() - searchStartTime.current;
    
    console.log(`[AppSearch] Search #${searchCount.current}:`, {
      query: searchQuery,
      type: selectedAppType,
      results: filteredApps.length,
      time: searchTime + 'ms'
    });
  }, [searchQuery, selectedAppType, filteredApps.length]);
  
  const startSearch = useCallback(() => {
    searchStartTime.current = Date.now();
  }, []);
  
  return { startSearch, searchCount: searchCount.current };
};

export default usePerformanceMonitor;
