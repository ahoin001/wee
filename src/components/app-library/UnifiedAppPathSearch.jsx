import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUnifiedAppsState } from '../../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { WeeButton, WeeGooeyField, WeeSegmentedControl } from '../../ui/wee';

const UnifiedAppPathSearch = ({
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  placeholder = 'Search all apps...',
  inputId,
}) => {
  const { unifiedApps, setUnifiedAppsState } = useUnifiedAppsState();
  const {
    apps, loading: unifiedAppsLoading, error: unifiedAppsError, storeError: unifiedStoreError,
    searchQuery, selectedAppType
  } = unifiedApps;

  const setSearchQuery = useCallback((query) => {
    setUnifiedAppsState({ searchQuery: query });
  }, [setUnifiedAppsState]);

  const setSelectedAppType = useCallback((type) => {
    setUnifiedAppsState({ selectedAppType: type });
  }, [setUnifiedAppsState]);

  const setSelectedApp = useCallback((app) => {
    setUnifiedAppsState({ selectedApp: app });
  }, [setUnifiedAppsState]);

  const fetchUnifiedApps = useCallback(async (forceRefresh = false) => {
    try {
      const store = useConsolidatedAppStore.getState();

      const result = await store.unifiedAppManager.fetchUnifiedApps(forceRefresh);

      if (!result.success) {
        console.error('[UnifiedAppPathSearch] Failed to fetch unified apps:', result.error);
      }
    } catch (error) {
      console.error('[UnifiedAppPathSearch] Error fetching unified apps:', error);
    }
  }, []);

  const rescanUnifiedApps = useCallback(async () => {
    return fetchUnifiedApps(true);
  }, [fetchUnifiedApps]);

  const hasFetchedApps = useRef(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(value || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(localSearchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(localSearchQuery);
    }, 150);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  useEffect(() => {
    if (apps.length === 0 && !hasFetchedApps.current) {
      hasFetchedApps.current = true;
      fetchUnifiedApps();
    }
  }, [apps.length]);

  useEffect(() => {
    setLocalSearchQuery(value || '');
  }, [value]);

  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setSearchQuery]);

  const filteredApps = useMemo(() => {
    const filtered = apps.filter(app =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedAppType === 'all' || app.type === selectedAppType)
    );

    return filtered;
  }, [apps, searchQuery, selectedAppType]);

  const handleAppSelect = useCallback((app) => {
    setSelectedApp(app);

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

  const looksLikeStoreQuery = useMemo(() => {
    const q = String(localSearchQuery || '').toLowerCase();
    return /\b(apple|music|store|xbox|spotify|netflix|disney)\b/.test(q) || q.includes('apple music');
  }, [localSearchQuery]);

  const showStoreFilterHint =
    selectedAppType === 'exe' &&
    looksLikeStoreQuery &&
    !unifiedAppsLoading &&
    Boolean(localSearchQuery) &&
    filteredApps.length === 0;

  const filterId = inputId ? `${inputId}-filter` : 'uaps-filter-label';

  return (
    <div className="relative mb-1 w-full text-left font-[family-name:var(--font-ui)]">
      <div className="mb-3 flex flex-col gap-2">
        <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]" id={filterId}>
          Show
        </span>
        <WeeSegmentedControl
          ariaLabel="Filter apps by source"
          layoutId={filterId}
          wrap
          size="sm"
          value={selectedAppType}
          onChange={handleTypeFilterChange}
          options={[
            { value: 'all', label: 'All' },
            { value: 'exe', label: 'Apps' },
            { value: 'steam', label: 'Steam' },
            { value: 'epic', label: 'Epic' },
            { value: 'microsoft', label: 'Store' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="relative min-w-0 flex-1">
          <WeeGooeyField
            id={inputId}
            type="text"
            placeholder={placeholder}
            value={localSearchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={disabled}
            autoComplete="off"
          />
        </div>

        <WeeButton
          type="button"
          variant="secondary"
          onClick={handleRescan}
          disabled={unifiedAppsLoading || disabled}
          className="shrink-0 self-center whitespace-nowrap px-5 !py-3"
        >
          {unifiedAppsLoading ? 'Scanning…' : 'Refresh'}
        </WeeButton>
      </div>

      {unifiedAppsLoading && localSearchQuery && filteredApps.length === 0 ? (
        <div className="absolute left-0 top-full z-[5] mt-1.5 text-[0.8125rem] font-medium text-[hsl(var(--text-secondary))]">
          Looking for apps…
        </div>
      ) : null}

      {unifiedAppsError ? (
        <div className="mt-2 text-[0.8125rem] leading-snug text-[hsl(var(--state-error))]">
          {unifiedAppsError}
        </div>
      ) : null}

      {unifiedStoreError ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.8125rem] leading-snug text-[hsl(var(--state-warning))]">
          <span>Microsoft Store apps could not be listed. Desktop apps still appear — try Refresh.</span>
          <WeeButton
            type="button"
            variant="secondary"
            onClick={handleRescan}
            disabled={unifiedAppsLoading || disabled}
            className="!px-3 !py-1.5 text-[0.7rem]"
          >
            Refresh
          </WeeButton>
        </div>
      ) : null}

      {showStoreFilterHint ? (
        <div className="mt-2 text-[0.8125rem] leading-snug text-[hsl(var(--text-secondary))]">
          Looking for a Store app? Switch the filter to{' '}
          <button
            type="button"
            className="font-bold text-[hsl(var(--primary))] underline-offset-2 hover:underline"
            onClick={() => handleTypeFilterChange('all')}
          >
            All
          </button>{' '}
          or{' '}
          <button
            type="button"
            className="font-bold text-[hsl(var(--primary))] underline-offset-2 hover:underline"
            onClick={() => handleTypeFilterChange('microsoft')}
          >
            Store
          </button>
          .
        </div>
      ) : null}

      {dropdownOpen && filteredApps.length > 0 ? (
        <div
          className="absolute left-0 right-0 top-full z-[1000] mt-1.5 max-h-[min(320px,50vh)] overflow-x-hidden overflow-y-auto rounded-2xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] shadow-[var(--shadow-soft)] [scrollbar-gutter:stable]"
        >
          <div className="flex flex-col">
            {filteredApps.slice(0, 50).map((app, index) => (
              <div
                key={`${app.id || app.path || app.name}-${index}`}
                className="flex cursor-pointer items-center gap-2.5 border-t border-[hsl(var(--border-primary))] px-3.5 py-2.5 text-[0.9375rem] font-medium text-[hsl(var(--text-primary))] transition-colors first:border-t-0 hover:bg-[hsl(var(--state-hover))] active:bg-[hsl(var(--state-active))]"
                onMouseDown={() => handleAppSelect(app)}
              >
                {app.icon ? (
                  <img
                    src={app.icon}
                    alt={`${app.name} icon`}
                    className="h-8 w-8 shrink-0 rounded-[var(--radius-sm)] object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[hsl(var(--surface-secondary))] text-base">
                    {getAppTypeIcon(app.type)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 font-semibold leading-tight">
                    {app.name}
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 text-[0.75rem] text-[hsl(var(--text-secondary))]">
                    <span className="shrink-0">{getAppTypeLabel(app.type)}</span>
                    {app.path ? (
                      <>
                        <span className="shrink-0 text-[hsl(var(--text-tertiary))]" aria-hidden>
                          ·
                        </span>
                        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-[family-name:var(--font-ui)] text-[0.72rem] text-[hsl(var(--text-tertiary))]" title={app.path}>
                          {app.path}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredApps.length > 50 ? (
            <div className="border-t border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-3.5 py-2 text-center text-[0.72rem] leading-snug text-[hsl(var(--text-tertiary))]">
              Showing the first 50 matches—keep typing to narrow the list.
            </div>
          ) : null}
        </div>
      ) : null}

      {dropdownOpen && !unifiedAppsLoading && filteredApps.length === 0 && localSearchQuery ? (
        <div className="mt-1.5 rounded-2xl border border-dashed border-[hsl(var(--border-secondary))] bg-[hsl(var(--surface-secondary))] px-3.5 py-3 text-center text-[0.875rem] leading-snug text-[hsl(var(--text-secondary))]">
          No apps match “{localSearchQuery}”. Try another filter or refresh the list.
        </div>
      ) : null}
    </div>
  );
};

export default UnifiedAppPathSearch;
