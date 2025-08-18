# Advanced Data Layer Features

This document provides comprehensive documentation for the advanced data layer features implemented in the Wii Desktop Launcher application.

## Table of Contents

1. [Overview](#overview)
2. [Preset Management System](#preset-management-system)
3. [Data Validation System](#data-validation-system)
4. [Data Synchronization System](#data-synchronization-system)
5. [Data Analytics System](#data-analytics-system)
6. [Performance Monitoring](#performance-monitoring)
7. [Error Handling](#error-handling)
8. [Usage Examples](#usage-examples)
9. [API Reference](#api-reference)
10. [Best Practices](#best-practices)

## Overview

The advanced data layer provides a comprehensive solution for managing application state, data validation, synchronization, analytics, and performance monitoring. It builds upon the unified data layer to offer enterprise-grade features for scalability and maintainability.

### Key Features

- **Advanced Preset Management**: Complete preset lifecycle management with validation and conflict resolution
- **Data Validation**: Comprehensive validation system for all data types
- **Real-time Synchronization**: Conflict resolution and data synchronization across components
- **Analytics & Insights**: User behavior tracking and performance analytics
- **Performance Monitoring**: Component-level performance tracking and optimization
- **Error Handling**: Comprehensive error boundaries and error tracking

## Preset Management System

The preset management system provides complete control over preset operations including creation, application, updating, and deletion.

### Core Features

- **Preset Application**: Apply presets with full data validation
- **Preset Creation**: Create presets from current app state
- **Preset Updates**: Update existing presets with conflict resolution
- **Preset Import/Export**: Import and export preset collections
- **Preset Reordering**: Reorder presets for better organization

### Usage

```javascript
import { usePresetManager } from '../utils/dataAccess';

function MyComponent() {
  const {
    applyPreset,
    createPreset,
    savePreset,
    deletePreset,
    updatePreset,
    renamePreset,
    importPresets,
    exportPresets,
    presets
  } = usePresetManager();

  // Apply a preset
  const handleApplyPreset = async (preset) => {
    const result = await applyPreset(preset);
    if (result.success) {
      console.log('Preset applied successfully');
    } else {
      console.error('Failed to apply preset:', result.error);
    }
  };

  // Create and save a preset
  const handleSavePreset = async (name) => {
    const result = await savePreset(name, {
      includeChannels: true,
      includeSounds: true
    });
    
    if (result.success) {
      console.log('Preset saved:', result.preset);
    }
  };

  return (
    <div>
      {Object.entries(presets).map(([name, preset]) => (
        <button key={name} onClick={() => handleApplyPreset(preset)}>
          Apply {name}
        </button>
      ))}
    </div>
  );
}
```

### Preset Data Structure

```javascript
{
  name: "My Preset",
  timestamp: 1640995200000,
  version: "1.0.0",
  data: {
    // Time settings
    timeColor: "#ffffff",
    timeFormat24hr: true,
    enableTimePill: true,
    
    // Ribbon settings
    ribbonColor: "#33BEED",
    ribbonGlowColor: "#ffffff",
    ribbonGlowStrength: 50,
    
    // General settings
    showDock: true,
    classicMode: false,
    useCustomCursor: true,
    
    // Wallpaper settings
    wallpaperOpacity: 1,
    cycleWallpapers: false,
    
    // Channel data (if included)
    channelData: {
      channels: { /* channel configurations */ },
      settings: { /* channel settings */ }
    },
    
    // Sound library (if included)
    soundLibrary: { /* sound configurations */ }
  }
}
```

## Data Validation System

The data validation system ensures data integrity across the application by validating all data before it's stored or processed.

### Validation Features

- **Type Validation**: Ensures correct data types
- **Range Validation**: Validates numeric ranges
- **Format Validation**: Validates colors, URLs, file paths
- **Enum Validation**: Validates against allowed values
- **Nested Validation**: Validates complex nested objects

### Usage

```javascript
import { validateSettings, validatePresetData } from '../utils/dataAccess';

// Validate settings
const settings = {
  timeColor: "#ffffff",
  ribbonGlowStrength: 75,
  wallpaperOpacity: 0.8
};

const validation = validateSettings(settings);
if (validation.isValid) {
  console.log('Settings are valid');
} else {
  console.error('Validation errors:', validation.errors);
}

// Validate preset data
const presetValidation = validatePresetData(presetData);
if (presetValidation.isValid) {
  console.log('Preset data is valid');
} else {
  console.error('Preset validation errors:', presetValidation.errors);
}
```

### Custom Validation

```javascript
import dataValidator from '../utils/dataValidator';

// Create custom validation
const customValidator = new dataValidator.constructor();

// Add custom validation rules
customValidator.addCustomValidator('customField', (value) => {
  if (typeof value !== 'string' || value.length < 3) {
    return { isValid: false, message: 'Custom field must be a string with at least 3 characters' };
  }
  return { isValid: true };
});
```

## Data Synchronization System

The data synchronization system provides real-time data synchronization with conflict resolution and retry mechanisms.

### Features

- **Queue-based Synchronization**: Batches operations for efficiency
- **Conflict Resolution**: Automatic conflict detection and resolution
- **Retry Mechanism**: Automatic retry with exponential backoff
- **Callback Support**: Success/error callbacks for operations
- **Batch Operations**: Support for bulk data operations

### Usage

```javascript
import { queueSync, registerConflictResolver, getSyncStatus } from '../utils/dataAccess';

// Queue a sync operation
const syncId = queueSync({
  type: 'updateSetting',
  target: 'timeColor',
  data: '#ff0000'
});

// Register conflict resolver
registerConflictResolver('timeColor', (currentValue, newValue) => {
  // Custom conflict resolution logic
  return currentValue.timestamp > newValue.timestamp ? currentValue : newValue;
});

// Get sync status
const status = getSyncStatus();
console.log('Sync status:', status);
```

### Sync Operation Types

```javascript
// Update setting
{
  type: 'updateSetting',
  target: 'settingKey',
  data: newValue
}

// Update channel
{
  type: 'updateChannel',
  target: 'channelId',
  data: channelData
}

// Apply preset
{
  type: 'applyPreset',
  data: presetData
}

// Batch update
{
  type: 'batchUpdate',
  data: [
    { type: 'updateSetting', target: 'key1', data: 'value1' },
    { type: 'updateSetting', target: 'key2', data: 'value2' }
  ]
}
```

## Data Analytics System

The data analytics system tracks user behavior, performance metrics, and provides insights for optimization.

### Features

- **Event Tracking**: Track custom events and user actions
- **Performance Tracking**: Monitor component render times and data operations
- **Error Tracking**: Track and analyze errors
- **User Behavior Analysis**: Analyze user interaction patterns
- **Insights Generation**: Generate actionable insights from data

### Usage

```javascript
import {
  trackEvent,
  trackUserAction,
  trackPerformance,
  trackError,
  getAnalyticsSummary,
  getPerformanceInsights
} from '../utils/dataAccess';

// Track events
trackEvent('button_click', { buttonId: 'settings', timestamp: Date.now() });

// Track user actions
trackUserAction('preset_apply', { presetName: 'My Preset' });

// Track performance
trackPerformance('component_render_time', 15.5, { component: 'ChannelGrid' });

// Track errors
try {
  // Some operation
} catch (error) {
  trackError(error, { context: 'preset_application' });
}

// Get analytics insights
const summary = getAnalyticsSummary();
const performance = getPerformanceInsights();
const userBehavior = getUserBehaviorInsights();
```

### Analytics Data Structure

```javascript
{
  summary: {
    totalEvents: 150,
    totalUserActions: 45,
    totalPerformanceData: 23,
    totalErrors: 2,
    sessionId: "session_1640995200000_abc123",
    sessionDuration: 3600000
  },
  performance: {
    componentRenderTimes: {
      average: 12.5,
      maximum: 45.2,
      minimum: 3.1,
      count: 23
    },
    dataOperations: {
      average: 8.3,
      maximum: 25.1,
      minimum: 1.2,
      count: 15
    }
  },
  userBehavior: {
    mostCommonActions: [
      { action: 'preset_apply', count: 12 },
      { action: 'settings_change', count: 8 }
    ]
  }
}
```

## Performance Monitoring

The performance monitoring system provides detailed insights into component performance and optimization opportunities.

### Features

- **Component Performance**: Track render times and re-render frequency
- **Data Operation Performance**: Monitor data layer operation durations
- **Memory Usage**: Track memory consumption patterns
- **Performance Alerts**: Automatic alerts for performance issues

### Usage

```javascript
import { usePerformanceMonitor, performanceUtils } from '../utils/usePerformanceMonitor';

function MyComponent() {
  const { logReRender, getStats } = usePerformanceMonitor('MyComponent', {
    logRenderTime: true,
    logReRenders: true,
    threshold: 16 // 60fps threshold
  });

  // Measure expensive operations
  const expensiveOperation = () => {
    return performanceUtils.measure('expensive_operation', () => {
      // Expensive computation
      return result;
    });
  };

  // Debounce user input
  const debouncedHandler = performanceUtils.debounce((value) => {
    // Handle user input
  }, 250);

  return <div>Component content</div>;
}
```

## Error Handling

The error handling system provides comprehensive error catching, reporting, and recovery mechanisms.

### Features

- **Error Boundaries**: React error boundaries for component-level error handling
- **Error Tracking**: Automatic error tracking and reporting
- **Error Recovery**: Automatic recovery mechanisms
- **User-friendly Error Messages**: Clear error messages for users

### Usage

```javascript
import ErrorBoundary from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Usage Examples

### Complete Preset Management Example

```javascript
import React, { useState } from 'react';
import {
  usePresetManager,
  trackPresetOperation,
  validatePresetData
} from '../utils/dataAccess';

function PresetManager() {
  const [presetName, setPresetName] = useState('');
  const [includeChannels, setIncludeChannels] = useState(false);
  const [includeSounds, setIncludeSounds] = useState(false);

  const {
    applyPreset,
    savePreset,
    deletePreset,
    presets
  } = usePresetManager();

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    try {
      const result = await savePreset(presetName, {
        includeChannels,
        includeSounds
      });

      if (result.success) {
        trackPresetOperation('save', presetName, true);
        alert('Preset saved successfully!');
        setPresetName('');
      } else {
        trackPresetOperation('save', presetName, false, { error: result.error });
        alert('Failed to save preset: ' + result.error);
      }
    } catch (error) {
      trackPresetOperation('save', presetName, false, { error: error.message });
      alert('Error saving preset: ' + error.message);
    }
  };

  const handleApplyPreset = async (preset) => {
    try {
      // Validate preset before applying
      const validation = validatePresetData(preset);
      if (!validation.isValid) {
        alert('Invalid preset data: ' + validation.errors.map(e => e.message).join(', '));
        return;
      }

      const result = await applyPreset(preset);
      if (result.success) {
        trackPresetOperation('apply', preset.name, true);
        alert('Preset applied successfully!');
      } else {
        trackPresetOperation('apply', preset.name, false, { error: result.error });
        alert('Failed to apply preset: ' + result.error);
      }
    } catch (error) {
      trackPresetOperation('apply', preset.name, false, { error: error.message });
      alert('Error applying preset: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Preset Manager</h2>
      
      {/* Save Preset Form */}
      <div>
        <input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="Preset name"
        />
        <label>
          <input
            type="checkbox"
            checked={includeChannels}
            onChange={(e) => setIncludeChannels(e.target.checked)}
          />
          Include channels
        </label>
        <label>
          <input
            type="checkbox"
            checked={includeSounds}
            onChange={(e) => setIncludeSounds(e.target.checked)}
          />
          Include sounds
        </label>
        <button onClick={handleSavePreset}>Save Preset</button>
      </div>

      {/* Preset List */}
      <div>
        <h3>Saved Presets</h3>
        {Object.entries(presets).map(([name, preset]) => (
          <div key={name}>
            <span>{name}</span>
            <button onClick={() => handleApplyPreset(preset)}>Apply</button>
            <button onClick={() => deletePreset(name)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Performance Monitoring Example

```javascript
import React, { useEffect } from 'react';
import { usePerformanceMonitor, performanceUtils } from '../utils/usePerformanceMonitor';
import { trackPerformanceMeasurement } from '../utils/dataAccess';

function OptimizedComponent({ data, onUpdate }) {
  const { logReRender, getStats } = usePerformanceMonitor('OptimizedComponent', {
    logRenderTime: true,
    logReRenders: true,
    threshold: 16
  });

  // Optimize expensive calculations
  const processedData = performanceUtils.measure('data_processing', () => {
    return data.map(item => ({
      ...item,
      processed: item.value * 2
    }));
  });

  // Debounce update function
  const debouncedUpdate = performanceUtils.debounce((newData) => {
    onUpdate(newData);
  }, 300);

  useEffect(() => {
    logReRender('data changed');
  }, [data, logReRender]);

  useEffect(() => {
    // Track component performance on unmount
    return () => {
      const stats = getStats();
      trackPerformanceMeasurement('OptimizedComponent', stats.avgRenderTime, {
        totalRenders: stats.totalRenders
      });
    };
  }, [getStats]);

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id}>{item.processed}</div>
      ))}
    </div>
  );
}
```

## API Reference

### usePresetManager

```javascript
const {
  applyPreset,
  createPreset,
  savePreset,
  deletePreset,
  updatePreset,
  renamePreset,
  importPresets,
  reorderPresets,
  exportPresets,
  getPreset,
  getAllPresets,
  presets
} = usePresetManager();
```

### Data Validation

```javascript
// Validate settings
const validation = validateSettings(settings);

// Validate preset data
const validation = validatePresetData(presetData);

// Validate channel data
const validation = validateChannelData(channelData);

// Validate wallpaper settings
const validation = validateWallpaperSettings(wallpaperSettings);
```

### Data Synchronization

```javascript
// Queue sync operation
const syncId = queueSync(operation);

// Register conflict resolver
registerConflictResolver(key, resolver);

// Get sync status
const status = getSyncStatus();

// Initialize sync
initializeSync(options);

// Cleanup sync
cleanupSync();
```

### Analytics

```javascript
// Track events
trackEvent(eventName, data);

// Track user actions
trackUserAction(action, details);

// Track performance
trackPerformance(metricName, value, metadata);

// Track errors
trackError(error, context);

// Get insights
const summary = getAnalyticsSummary();
const performance = getPerformanceInsights();
const userBehavior = getUserBehaviorInsights();
const errors = getErrorInsights();
```

### Performance Monitoring

```javascript
// Use performance monitor
const { logReRender, getStats } = usePerformanceMonitor(componentName, options);

// Performance utilities
performanceUtils.measure(name, fn);
performanceUtils.measureAsync(name, fn);
performanceUtils.debounce(func, wait);
performanceUtils.throttle(func, limit);
```

## Best Practices

### 1. Preset Management

- Always validate preset data before applying
- Use descriptive preset names
- Include relevant data types (channels, sounds) when needed
- Track preset operations for analytics

### 2. Data Validation

- Validate data at the boundaries (input/output)
- Use specific validation for different data types
- Provide clear error messages
- Validate before storing or processing

### 3. Performance Monitoring

- Monitor performance in development
- Set appropriate thresholds for your application
- Use debouncing for user input
- Track performance metrics for optimization

### 4. Error Handling

- Wrap components with ErrorBoundary
- Track errors for debugging
- Provide user-friendly error messages
- Implement recovery mechanisms

### 5. Analytics

- Track meaningful user actions
- Monitor performance bottlenecks
- Analyze user behavior patterns
- Use insights for optimization

### 6. Data Synchronization

- Use appropriate sync intervals
- Implement conflict resolution strategies
- Handle sync failures gracefully
- Monitor sync performance

## Conclusion

The advanced data layer provides a comprehensive solution for managing complex application state with enterprise-grade features. By following the best practices and using the provided APIs, you can build scalable, maintainable, and performant applications.

For more information, refer to the individual module documentation and examples in the codebase.

