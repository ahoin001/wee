import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUnifiedAppsState } from '../../utils/useConsolidatedAppHooks';
import Button from '../../ui/WButton';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import './unified-app-path-search.css';
// import { useAppSearchPerformance } from '../../utils/performanceHooks';

const UnifiedAppPathSearch = ({
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  placeholder = 'Search all apps...',
  inputId,
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

  useEffect(() => {
    setLocalSearchQuery(value || '');
  }, [value]);

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

  return (
    <div className="uaps">
      {/* Type Filter */}
      <div className="uaps__filter-row">
        <span className="uaps__filter-label" id="uaps-filter-label">
          Show
        </span>
        <div
          className="uaps__filter-pills"
          role="group"
          aria-labelledby="uaps-filter-label"
        >
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
              className={`uaps__filter-pill ${selectedAppType === value ? 'uaps__filter-pill--active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="uaps__search-row">
        <input
          id={inputId}
          type="text"
          className="uaps__input"
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
          className="uaps__rescan"
        >
          {unifiedAppsLoading ? 'Scanning…' : 'Refresh'}
        </Button>
      </div>

      {/* Loading State */}
      {unifiedAppsLoading && localSearchQuery && filteredApps.length === 0 && (
        <div className="uaps__loading">
          <span>Looking for apps…</span>
        </div>
      )}

      {/* Error State */}
      {unifiedAppsError && (
        <div className="uaps__error">
          {unifiedAppsError}
        </div>
      )}

      {/* Results Dropdown */}
      {dropdownOpen && filteredApps.length > 0 && (
        <div className="uaps__dropdown">
          <div className="uaps__results">
          {filteredApps.slice(0, 50).map((app, index) => (
            <div
              key={`${app.id || app.path || app.name}-${index}`}
              className="uaps__result-row"
              onMouseDown={() => handleAppSelect(app)}
            >
              {app.icon ? (
                <img 
                  src={app.icon} 
                  alt={`${app.name} icon`}
                  className="uaps__app-icon"
                  onError={(e) => {
                    e.currentTarget.classList.add('uaps__app-icon--hidden');
                  }}
                />
              ) : (
                <div className="uaps__app-icon-fallback">
                  {getAppTypeIcon(app.type)}
                </div>
              )}

              <div className="uaps__meta">
                <div className="uaps__title">
                  {app.name}
                </div>
                <div className="uaps__subtitle">
                  <span className="uaps__subtitle-type">{getAppTypeLabel(app.type)}</span>
                  {app.path ? (
                    <>
                      <span className="uaps__dot" aria-hidden>
                        ·
                      </span>
                      <span className="uaps__path" title={app.path}>
                        {app.path}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          </div>
          
          {filteredApps.length > 50 && (
            <div className="uaps__more-footer">
              Showing the first 50 matches—keep typing to narrow the list.
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {dropdownOpen && !unifiedAppsLoading && filteredApps.length === 0 && localSearchQuery && (
        <div className="uaps__empty">
          No apps match “{localSearchQuery}”. Try another filter or refresh the list.
        </div>
      )}
    </div>
  );
};

export default UnifiedAppPathSearch;

