import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUnifiedAppsState } from '../utils/useConsolidatedAppHooks';
import Button from '../ui/WButton';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
// import { useAppSearchPerformance } from '../utils/performanceHooks';

const UnifiedAppPathSearch = ({ 
  value, 
  onChange, 
  onFocus, 
  onBlur, 
  disabled = false,
  placeholder = 'Search all apps...'
}) => {
  // Use unified apps state from consolidated store
  const { unifiedApps, setUnifiedAppsState } = useUnifiedAppsState();
  const {
    apps, loading: unifiedAppsLoading, error: unifiedAppsError,
    searchQuery, selectedAppType, selectedApp
  } = unifiedApps;
  
  // Memoize manager functions to prevent infinite loops
  const setSearchQuery = useCallback((query) => {
    setUnifiedAppsState({ searchQuery: query });
  }, [setUnifiedAppsState]);
  
  const setSelectedAppType = useCallback((type) => {
    setUnifiedAppsState({ selectedAppType: type });
  }, [setUnifiedAppsState]);
  
  const setSelectedApp = useCallback((app) => {
    setUnifiedAppsState({ selectedApp: app });
  }, [setUnifiedAppsState]);
  
  const fetchUnifiedApps = useCallback(async () => {
    console.log('[UnifiedAppPathSearch] Fetching unified apps...');
    try {
      // Use the unified app manager from the consolidated store
      const store = useConsolidatedAppStore.getState();
      console.log('[UnifiedAppPathSearch] Store state before fetch:', {
        hasUnifiedAppManager: !!store.unifiedAppManager,
        currentAppsCount: store.unifiedApps?.apps?.length || 0
      });
      
      const result = await store.unifiedAppManager.fetchUnifiedApps();
      console.log('[UnifiedAppPathSearch] Fetch result:', {
        success: result.success,
        appsCount: result.apps?.length || 0,
        error: result.error
      });
      
      if (result.success) {
        console.log('[UnifiedAppPathSearch] Unified apps fetched successfully:', result.apps.length);
      } else {
        console.error('[UnifiedAppPathSearch] Failed to fetch unified apps:', result.error);
      }
    } catch (error) {
      console.error('[UnifiedAppPathSearch] Error fetching unified apps:', error);
    }
  }, []);
  
  const rescanUnifiedApps = useCallback(async () => {
    return fetchUnifiedApps();
  }, [fetchUnifiedApps]);
  
  // Use ref to track if apps have been fetched
  const hasFetchedApps = useRef(false);
  const isUpdatingFromStore = useRef(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(value || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(localSearchQuery);

  // Debounce search query updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(localSearchQuery);
    }, 150); // 150ms debounce

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Fetch apps on mount
  useEffect(() => {
    console.log('[UnifiedAppPathSearch] useEffect triggered:', {
      appsLength: apps.length,
      hasFetchedApps: hasFetchedApps.current,
      shouldFetch: apps.length === 0 && !hasFetchedApps.current
    });
    
    if (apps.length === 0 && !hasFetchedApps.current) {
      hasFetchedApps.current = true;
      console.log('[UnifiedAppPathSearch] Triggering fetch...');
      fetchUnifiedApps();
    }
  }, [apps.length]); // Remove fetchUnifiedApps from dependencies to prevent infinite loops

  // Sync local search with store - only on mount
  useEffect(() => {
    setLocalSearchQuery(value || '');
  }, []);

  // Update store when debounced search changes
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setSearchQuery]);

  // Memoize filtered apps to prevent unnecessary recalculations
  const filteredApps = useMemo(() => {
    console.log('[UnifiedAppPathSearch] Filtering apps:', {
      totalApps: apps.length,
      searchQuery,
      selectedAppType,
      appsByType: {
        exe: apps.filter(app => app.type === 'exe').length,
        steam: apps.filter(app => app.type === 'steam').length,
        epic: apps.filter(app => app.type === 'epic').length,
        microsoft: apps.filter(app => app.type === 'microsoft').length,
        other: apps.filter(app => !['exe', 'steam', 'epic', 'microsoft'].includes(app.type)).length
      }
    });
    
    const filtered = apps.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedAppType === 'all' || app.type === selectedAppType)
    );
    
    console.log('[UnifiedAppPathSearch] Filtered results:', {
      filteredCount: filtered.length,
      searchQuery,
      selectedAppType
    });
    
    return filtered;
  }, [apps, searchQuery, selectedAppType]);

  // Performance monitoring
  // useAppSearchPerformance(searchQuery, filteredApps, selectedAppType);

  // Memoize event handlers
  const handleAppSelect = useCallback((app) => {
    console.log('[UnifiedAppPathSearch] App selected:', app);
    
    // Always update the selected app to ensure path parsing works
    setSelectedApp(app);
    
    // Generate the proper path for the selected app
    const generatedPath = app?.path || '';
    console.log('[UnifiedAppPathSearch] Generated path:', generatedPath);
    
    // Don't call onChange here - let the parent component handle the configuration
    // The UnifiedAppPathCard will handle the path updates based on the store's selectedApp
    
    setDropdownOpen(false);
    if (app.name !== localSearchQuery) {
      setLocalSearchQuery(app.name);
    }
  }, [setSelectedApp, localSearchQuery]);

  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    if (newValue !== localSearchQuery) {
      setLocalSearchQuery(newValue);
      onChange?.(newValue);
      setDropdownOpen(true);
    }
  }, [onChange, localSearchQuery]);

  const handleInputFocus = useCallback(() => {
    setDropdownOpen(true);
    onFocus?.();
  }, [onFocus]);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => setDropdownOpen(false), 150);
    onBlur?.();
  }, [onBlur]);

  const handleRescan = useCallback(() => {
    console.log('[UnifiedAppPathSearch] Manual rescan triggered');
    // Reset the fetch flag to force a fresh scan
    hasFetchedApps.current = false;
    rescanUnifiedApps();
  }, [rescanUnifiedApps]);

  const handleTypeFilterChange = useCallback((type) => {
    setSelectedAppType(type);
  }, [setSelectedAppType]);



  const getAppTypeIcon = (type) => {
    switch (type) {
      case 'steam':
        return '🎮';
      case 'epic':
        return '🎮';
      case 'microsoft':
        return '🏪';
      case 'exe':
      default:
        return '💻';
    }
  };

  const getAppTypeLabel = (type) => {
    switch (type) {
      case 'steam':
        return 'Steam';
      case 'epic':
        return 'Epic';
      case 'microsoft':
        return 'Store';
      case 'exe':
      default:
        return 'App';
    }
  };

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      {/* Type Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <label style={{ fontSize: '14px', fontWeight: '500', color: 'hsl(var(--text-secondary))' }}>
          Filter:
        </label>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { value: 'all', label: 'All' },
            { value: 'exe', label: 'Apps' },
            { value: 'steam', label: 'Steam' },
            { value: 'epic', label: 'Epic' },
            { value: 'microsoft', label: 'Store' }
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeFilterChange(value)}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                border: `1px solid ${selectedAppType === value ? 'hsl(var(--wii-blue))' : 'hsl(var(--border-primary))'}`,
                background: selectedAppType === value ? 'hsl(var(--wii-blue))' : 'hsl(var(--surface-primary))',
                color: selectedAppType === value ? 'hsl(var(--text-inverse))' : 'hsl(var(--text-primary))',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          className="text-input"
          placeholder={placeholder}
          value={localSearchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          style={{ 
            flex: 1,
            padding: '12px 14px', 
            fontSize: '16px', 
            borderRadius: '8px', 
            border: '1.5px solid hsl(var(--border-primary))',
            background: 'hsl(var(--surface-primary))',
            color: 'hsl(var(--text-primary))'
          }}
        />
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRescan}
          disabled={unifiedAppsLoading || disabled}
          style={{ whiteSpace: 'nowrap' }}
        >
          {unifiedAppsLoading ? 'Scanning...' : 'Rescan'}
        </Button>
        

      </div>

      {/* Loading State */}
      {unifiedAppsLoading && localSearchQuery && filteredApps.length === 0 && (
        <div style={{ 
          position: 'absolute', 
          left: 0, 
          top: '100%', 
          color: 'hsl(var(--wii-blue))', 
          fontWeight: '500', 
          fontSize: '15px', 
          marginTop: 4 
        }}>
          <span>Scanning for apps...</span>
        </div>
      )}

      {/* Error State */}
      {unifiedAppsError && (
        <div style={{ color: 'hsl(var(--state-error))', fontSize: '13px', marginTop: 8 }}>
          {unifiedAppsError}
        </div>
      )}

      {/* Results Dropdown */}
      {dropdownOpen && filteredApps.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'hsl(var(--surface-primary))',
          border: '1px solid hsl(var(--border-primary))',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {/* Virtual scrolling for large lists - show only first 50 items initially */}
          {filteredApps.slice(0, 50).map((app, idx) => (
            <div
              key={app.id}
              style={{ 
                padding: '12px 16px', 
                cursor: 'pointer', 
                borderBottom: idx < Math.min(filteredApps.length, 50) - 1 ? '1px solid hsl(var(--border-primary))' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: idx === 0 ? '8px 8px 0 0' : idx === Math.min(filteredApps.length, 50) - 1 ? '0 0 8px 8px' : '0',
                position: 'relative',
                fontSize: '16px',
                fontWeight: '500',
                color: 'hsl(var(--text-primary))',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseDown={() => handleAppSelect(app)}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'hsl(var(--state-hover))';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* App Icon */}
              {app.icon ? (
                <img 
                  src={app.icon} 
                  alt={`${app.name} icon`}
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '4px',
                    objectFit: 'cover',
                    transition: 'transform 0.2s ease'
                  }}
                  onError={e => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  background: 'hsl(var(--surface-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  {getAppTypeIcon(app.type)}
                </div>
              )}

              {/* App Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                  {app.name}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: 'hsl(var(--text-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>{getAppTypeLabel(app.type)}</span>
                  {app.path && (
                    <>
                      <span>•</span>
                      <span style={{ 
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        opacity: '0.8'
                      }}>
                        {app.path.length > 40 ? app.path.substring(0, 40) + '...' : app.path}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Type Badge */}
              <div style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                background: 'hsl(var(--surface-secondary))',
                color: 'hsl(var(--text-secondary))',
                border: '1px solid hsl(var(--border-primary))'
              }}>
                {getAppTypeLabel(app.type)}
              </div>
            </div>
          ))}
          
          {/* Show message if there are more results */}
          {filteredApps.length > 50 && (
            <div style={{
              padding: '8px 16px',
              fontSize: '12px',
              color: 'hsl(var(--text-secondary))',
              textAlign: 'center',
              borderTop: '1px solid hsl(var(--border-primary))',
              background: 'hsl(var(--surface-secondary))'
            }}>
              Showing first 50 results. Refine your search to see more.
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {dropdownOpen && !unifiedAppsLoading && filteredApps.length === 0 && localSearchQuery && (
        <div style={{ 
          color: 'hsl(var(--text-tertiary))', 
          marginTop: 8,
          fontSize: '14px',
          textAlign: 'center',
          padding: '12px'
        }}>
          No apps found matching "{localSearchQuery}"
        </div>
      )}
    </div>
  );
};

export default UnifiedAppPathSearch; 