import { useEffect, useRef, useCallback } from 'react';

// Performance monitoring utility for React components
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const mountTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    const timeSinceMount = currentTime - mountTime.current;

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}:`, {
        renderCount: renderCount.current,
        timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`,
        timeSinceMount: `${timeSinceMount.toFixed(2)}ms`,
        averageRenderTime: `${(timeSinceMount / renderCount.current).toFixed(2)}ms`
      });
    }

    lastRenderTime.current = currentTime;
  });

  return {
    renderCount: renderCount.current,
    timeSinceMount: performance.now() - mountTime.current
  };
};

// Hook to measure function execution time
export const useFunctionTimer = (func, funcName) => {
  return useCallback((...args) => {
    const startTime = performance.now();
    const result = func(...args);
    const endTime = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Function Timer] ${funcName}: ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  }, [func, funcName]);
};

// Hook to detect unnecessary re-renders
export const useRenderTracker = (componentName, props) => {
  const prevProps = useRef(props);
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      const changedProps = [];
      
      // Compare current props with previous props
      Object.keys(props).forEach(key => {
        if (props[key] !== prevProps.current[key]) {
          changedProps.push(key);
        }
      });
      
      if (changedProps.length > 0) {
        console.log(`[Render Tracker] ${componentName} re-rendered due to:`, changedProps);
      } else {
        console.warn(`[Render Tracker] ${componentName} re-rendered without prop changes!`);
      }
    }
    
    prevProps.current = props;
  });
};

// Utility to create optimized event handlers
export const createOptimizedHandler = (handler, dependencies, handlerName) => {
  return useCallback((...args) => {
    const startTime = performance.now();
    const result = handler(...args);
    const endTime = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Handler] ${handlerName}: ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  }, dependencies);
};

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function for expensive operations
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for frequent events
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoize expensive calculations
  memoize: (fn) => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }
};

// React.memo with custom comparison function
export const createOptimizedComponent = (Component, comparisonFn, componentName) => {
  const OptimizedComponent = React.memo(Component, comparisonFn);
  
  // Add display name for debugging
  OptimizedComponent.displayName = `Optimized(${componentName})`;
  
  return OptimizedComponent;
};

// Hook to track memory usage
export const useMemoryTracker = (componentName) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && performance.memory) {
      const memoryInfo = performance.memory;
      console.log(`[Memory] ${componentName}:`, {
        usedJSHeapSize: `${(memoryInfo.usedJSHeapSize / 1048576).toFixed(2)}MB`,
        totalJSHeapSize: `${(memoryInfo.totalJSHeapSize / 1048576).toFixed(2)}MB`,
        jsHeapSizeLimit: `${(memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2)}MB`
      });
    }
  });
};

// Performance optimization checklist
export const performanceChecklist = {
  // Check if component should be memoized
  shouldMemoize: (component, propsCount, renderFrequency) => {
    return propsCount > 3 || renderFrequency === 'high';
  },

  // Check if function should be memoized
  shouldMemoizeFunction: (functionComplexity, callFrequency) => {
    return functionComplexity === 'high' || callFrequency === 'high';
  },

  // Check if calculation should be memoized
  shouldMemoizeCalculation: (calculationComplexity, dataSize) => {
    return calculationComplexity === 'high' || dataSize > 100;
  }
};

export default {
  usePerformanceMonitor,
  useFunctionTimer,
  useRenderTracker,
  createOptimizedHandler,
  performanceUtils,
  createOptimizedComponent,
  useMemoryTracker,
  performanceChecklist
};


