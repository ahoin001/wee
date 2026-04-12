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
    searchQuery, selectedAppType
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
    try {
      // Use the unified app manager from the consolidated store
      const store = useConsolidatedAppStore.getState();
      
      const result = await store.unifiedAppManager.fetchUnifiedApps();
      
      if (!result.success) {
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
    if (apps.length === 0 && !hasFetchedApps.current) {
      hasFetchedApps.current = true;
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
    const filtered = apps.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedAppType === 'all' || app.type === selectedAppType)
    );
    
    return filtered;
  }, [apps, searchQuery, selectedAppType]);

  // Performance monitoring
  // useAppSearchPerformance(searchQuery, filteredApps, selectedAppType);

  // Memoize event handlers
  const handleAppSelect = useCallback((app) => {
    // Always update the selected app to ensure path parsing works
    setSelectedApp(app);
    
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

  const filterPillClass = (value) =>
    selectedAppType === value
      ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--wii-blue))] text-[hsl(var(--text-inverse))]'
      : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] text-[hsl(var(--text-primary))]';

  return (
    <div className="relative mb-4">
      {/* Type Filter */}
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm font-medium text-[hsl(var(--text-secondary))]">
          Filter:
        </label>
        <div className="flex gap-1">
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
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ease-out ${filterPillClass(value)}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="text-input flex-1 rounded-lg border-[1.5px] border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] px-3.5 py-3 text-base text-[hsl(var(--text-primary))]"
          placeholder={placeholder}
          value={localSearchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
        />
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRescan}
          disabled={unifiedAppsLoading || disabled}
          className="shrink-0 whitespace-nowrap"
        >
          {unifiedAppsLoading ? 'Scanning...' : 'Rescan'}
        </Button>
        

      </div>

      {/* Loading State */}
      {unifiedAppsLoading && localSearchQuery && filteredApps.length === 0 && (
        <div className="absolute left-0 top-full mt-1 text-[15px] font-medium text-[hsl(var(--wii-blue))]">
          <span>Scanning for apps...</span>
        </div>
      )}

      {/* Error State */}
      {unifiedAppsError && (
        <div className="mt-2 text-[13px] text-[hsl(var(--state-error))]">
          {unifiedAppsError}
        </div>
      )}

      {/* Results Dropdown */}
      {dropdownOpen && filteredApps.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-[1000] max-h-[300px] overflow-y-auto rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] shadow-[var(--shadow-lg)]"
        >
          <div className="divide-y divide-[hsl(var(--border-primary))]">
          {filteredApps.slice(0, 50).map((app) => (
            <div
              key={app.id}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 text-base font-medium text-[hsl(var(--text-primary))] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px hover:bg-[hsl(var(--state-hover))] hover:shadow-[var(--shadow-sm)]"
              onMouseDown={() => handleAppSelect(app)}
            >
              {/* App Icon */}
              {app.icon ? (
                <img 
                  src={app.icon} 
                  alt={`${app.name} icon`}
                  className="h-8 w-8 rounded object-cover transition-transform duration-200 ease-out"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[hsl(var(--surface-secondary))] text-base">
                  {getAppTypeIcon(app.type)}
                </div>
              )}

              {/* App Info */}
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 font-semibold">
                  {app.name}
                </div>
                <div className="flex items-center gap-1 text-[13px] text-[hsl(var(--text-secondary))]">
                  <span>{getAppTypeLabel(app.type)}</span>
                  {app.path && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-xs opacity-80">
                        {app.path.length > 40 ? app.path.substring(0, 40) + '...' : app.path}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Type Badge */}
              <div className="shrink-0 rounded-xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-2 py-0.5 text-[11px] font-semibold text-[hsl(var(--text-secondary))]">
                {getAppTypeLabel(app.type)}
              </div>
            </div>
          ))}
          </div>
          
          {/* Show message if there are more results */}
          {filteredApps.length > 50 && (
            <div className="border-t border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-4 py-2 text-center text-xs text-[hsl(var(--text-secondary))]">
              Showing first 50 results. Refine your search to see more.
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {dropdownOpen && !unifiedAppsLoading && filteredApps.length === 0 && localSearchQuery && (
        <div className="mt-2 px-3 py-3 text-center text-sm text-[hsl(var(--text-tertiary))]">
          No apps found matching "{localSearchQuery}"
        </div>
      )}
    </div>
  );
};

export default UnifiedAppPathSearch;
