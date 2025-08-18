# Architecture & Data Management Rules

## 🏗️ Core Architecture Principles

### 1. Single Source of Truth
- **ALWAYS** use `useConsolidatedAppStore` as the primary data store
- **NEVER** create new Zustand stores without explicit approval
- **NEVER** use `useState` for data that should be shared across components
- **NEVER** use `window.settings` directly - use the store hooks instead

### 2. Data Flow Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    ErrorBoundary                            │
├─────────────────────────────────────────────────────────────┤
│                      App.jsx                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   useAppState   │  │  useChannelState│  │  useUIState  │ │
│  │   useWallpaper  │  │  useRibbonState │  │  useTimeState│ │
│  │   usePresetState│  │  useMonitorState│  │  useAuthState│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              useConsolidatedAppStore                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   App State     │  │  Channel State  │  │   UI State   │ │
│  │   Wallpaper     │  │  Ribbon State   │  │  Time State  │ │
│  │   Preset State  │  │  Monitor State  │  │  Auth State  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  Electron Backend                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ unified-data.json│  │   Legacy APIs   │  │   IPC        │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3. Component Architecture Rules
- **ALWAYS** use `React.memo` for components that receive props
- **ALWAYS** use `useCallback` for event handlers passed as props
- **ALWAYS** use `useMemo` for expensive calculations
- **NEVER** use inline styles - use Tailwind CSS classes
- **ALWAYS** use UI components from `src/ui/` folder
- **NEVER** create new modal components without using `BaseModal.jsx`

## 📊 Data Management Rules

### 4. State Management
```javascript
// ✅ CORRECT - Use consolidated store hooks
import { useAppState, useUIState } from '../utils/useConsolidatedAppHooks';

const MyComponent = () => {
  const { settings, updateSetting } = useAppState();
  const { isDarkMode, toggleDarkMode } = useUIState();
  
  const handleToggle = useCallback(() => {
    toggleDarkMode();
  }, [toggleDarkMode]);
  
  return <div className="bg-gray-800 text-white">...</div>;
};

// ❌ WRONG - Don't use useState for shared data
const MyComponent = () => {
  const [settings, setSettings] = useState({}); // WRONG!
  const [isDarkMode, setIsDarkMode] = useState(false); // WRONG!
};
```

### 5. Data Persistence
- **ALWAYS** use the store's built-in persistence
- **NEVER** manually save to `localStorage` or files
- **ALWAYS** use the store's update methods, not direct assignment
- **NEVER** bypass the store for data changes

### 6. Performance Rules
- **ALWAYS** use `React.memo` with custom comparison functions for complex components
- **ALWAYS** use `useCallback` for functions passed to child components
- **ALWAYS** use `useMemo` for expensive computations
- **NEVER** create objects/arrays in render without `useMemo`
- **ALWAYS** use virtual scrolling for lists with 50+ items

## 🎨 UI/UX Rules

### 7. Design System
- **ALWAYS** use `Text` component for text elements
- **ALWAYS** use `Button` component for buttons
- **ALWAYS** use `Card` component for content containers
- **ALWAYS** use `WToggle` for toggle controls
- **ALWAYS** use `WInput` for input fields
- **NEVER** use inline styles - use Tailwind classes
- **ALWAYS** use gray text for labels and percentages

### 8. Modal Rules
- **ALWAYS** use `BaseModal.jsx` for new modals
- **ALWAYS** wrap modal sections in `Card.jsx`
- **ALWAYS** implement fade in/out animations
- **NEVER** create modals without proper error boundaries

### 9. Component Organization
```javascript
// ✅ CORRECT - Proper component structure
import React, { useCallback, useMemo } from 'react';
import { useAppState } from '../utils/useConsolidatedAppHooks';
import { Text, Button, Card } from '../ui';

const MyComponent = React.memo(({ prop1, prop2 }) => {
  const { data, updateData } = useAppState();
  
  const expensiveValue = useMemo(() => {
    return heavyCalculation(prop1, prop2);
  }, [prop1, prop2]);
  
  const handleClick = useCallback(() => {
    updateData(newValue);
  }, [updateData]);
  
  return (
    <Card className="p-4">
      <Text variant="heading">Title</Text>
      <Button onClick={handleClick}>Action</Button>
    </Card>
  );
});

MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number.isRequired
};

export default MyComponent;
```

## 🔧 Development Rules

### 10. File Organization
- **ALWAYS** put new components in `src/components/`
- **ALWAYS** put new utilities in `src/utils/`
- **ALWAYS** put new UI components in `src/ui/`
- **ALWAYS** use `.jsx` extension for React components
- **ALWAYS** use `.js` extension for utilities

### 11. Import Rules
```javascript
// ✅ CORRECT - Organized imports
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

// Store hooks
import { useAppState, useUIState } from '../utils/useConsolidatedAppHooks';

// UI components
import { Text, Button, Card } from '../ui';

// Utilities
import { someUtil } from '../utils/someUtil';

// Styles
import './Component.css';
```

### 12. Error Handling
- **ALWAYS** wrap new features in error boundaries
- **ALWAYS** use the `EnhancedErrorBoundary` for critical components
- **ALWAYS** log errors using `errorLogger`
- **NEVER** let errors bubble up without handling

### 13. Performance Monitoring
- **ALWAYS** use `usePerformanceMonitor` for new components
- **ALWAYS** monitor render times for complex components
- **ALWAYS** use `memoryManager` for memory-intensive operations
- **ALWAYS** use `advancedCacheManager` for expensive operations

## 🚀 Feature Development Rules

### 14. New Feature Checklist
Before implementing any new feature:

- [ ] Does it follow the single source of truth principle?
- [ ] Does it use the consolidated store?
- [ ] Does it use proper UI components?
- [ ] Does it use Tailwind CSS?
- [ ] Does it have proper error handling?
- [ ] Does it have performance monitoring?
- [ ] Does it follow the component architecture?
- [ ] Does it have proper TypeScript-like prop validation?

### 15. Data Validation
- **ALWAYS** validate data before storing in the store
- **ALWAYS** use `validatePreset` for preset data
- **ALWAYS** use `securityUtils.sanitizeInput` for user input
- **NEVER** trust external data without validation

### 16. Testing Rules
- **ALWAYS** test new features in the browser console
- **ALWAYS** verify data persistence
- [ ] Test component re-renders
- [ ] Test data flow
- [ ] Test error scenarios
- [ ] Test performance impact

## 📝 Code Quality Rules

### 17. Naming Conventions
- **ALWAYS** use camelCase for variables and functions
- **ALWAYS** use PascalCase for components
- **ALWAYS** use descriptive names
- **NEVER** use abbreviations unless widely understood

### 18. Documentation
- **ALWAYS** document complex functions
- **ALWAYS** document component props
- **ALWAYS** update this file when adding new rules
- **ALWAYS** document breaking changes

### 19. Refactoring Rules
- **NEVER** refactor without testing
- **ALWAYS** maintain backward compatibility
- **ALWAYS** update all related components
- **ALWAYS** verify data persistence after refactoring

## 🚨 Critical Don'ts

### 20. Architecture Violations
- ❌ **NEVER** create new Zustand stores
- ❌ **NEVER** use `useState` for shared data
- ❌ **NEVER** use `window.settings` directly
- ❌ **NEVER** use inline styles
- ❌ **NEVER** bypass the store for data changes
- ❌ **NEVER** create modals without `BaseModal.jsx`
- ❌ **NEVER** use undefined UI components
- ❌ **NEVER** ignore performance implications

### 21. Performance Violations
- ❌ **NEVER** create objects in render without `useMemo`
- ❌ **NEVER** pass new functions to children without `useCallback`
- ❌ **NEVER** render large lists without virtualization
- ❌ **NEVER** ignore memory leaks
- ❌ **NEVER** skip error boundaries

## 📋 Quick Reference

### Store Usage
```javascript
// Import hooks
import { useAppState, useUIState, useChannelState } from '../utils/useConsolidatedAppHooks';

// Use in components
const { data, updateData } = useAppState();
const { isDarkMode, toggleDarkMode } = useUIState();
```

### Component Template
```javascript
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAppState } from '../utils/useConsolidatedAppHooks';
import { Text, Button, Card } from '../ui';

const ComponentName = React.memo(({ prop1, prop2 }) => {
  const { data, updateData } = useAppState();
  
  const memoizedValue = useMemo(() => computeValue(prop1, prop2), [prop1, prop2]);
  const handleAction = useCallback(() => updateData(newValue), [updateData]);
  
  return (
    <Card className="p-4">
      <Text variant="heading">{memoizedValue}</Text>
      <Button onClick={handleAction}>Action</Button>
    </Card>
  );
});

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number.isRequired
};

export default ComponentName;
```

### Performance Checklist
- [ ] Component wrapped in `React.memo`
- [ ] Event handlers use `useCallback`
- [ ] Expensive calculations use `useMemo`
- [ ] No objects/arrays created in render
- [ ] Proper dependency arrays
- [ ] Error boundary implemented
- [ ] Performance monitoring added

---

**Remember**: These rules ensure our app maintains its enterprise-grade architecture, performance, and maintainability. Follow them religiously!




