import React, { useState, useEffect } from 'react';
import useUnifiedAppStore from '../utils/useUnifiedAppStore';
import Button from '../ui/Button';

const UnifiedAppPathSearch = ({ 
  value, 
  onChange, 
  onFocus, 
  onBlur, 
  disabled = false,
  placeholder = 'Search all apps...'
}) => {
  const {
    setSearchQuery,
    setSelectedAppType,
    unifiedApps,
    unifiedAppsLoading,
    unifiedAppsError,
    getFilteredApps,
    setSelectedApp,
    fetchUnifiedApps,
    rescanUnifiedApps
  } = useUnifiedAppStore();

  // Subscribe to the specific values that affect filtering
  const searchQuery = useUnifiedAppStore(state => state.searchQuery);
  const selectedAppType = useUnifiedAppStore(state => state.selectedAppType);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(value || '');
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-renders

  // Fetch apps on mount
  useEffect(() => {
    if (unifiedApps.length === 0) {
      fetchUnifiedApps();
    }
  }, [fetchUnifiedApps, unifiedApps.length]);

  // Sync local search with store
  useEffect(() => {
    setLocalSearchQuery(value || '');
  }, [value]);

  // Update store when local search changes
  useEffect(() => {
    setSearchQuery(localSearchQuery);
    setForceUpdate(prev => prev + 1); // Force re-render
  }, [localSearchQuery, setSearchQuery]);

  // Get filtered apps - this will recalculate when searchQuery or selectedAppType changes
  const filteredApps = getFilteredApps();
  
  // Debug logging removed - search is working correctly

  const handleAppSelect = (app) => {
    setSelectedApp(app);
    onChange?.(app.name);
    setDropdownOpen(false);
    setLocalSearchQuery(app.name);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalSearchQuery(newValue);
    onChange?.(newValue);
    setDropdownOpen(true);
  };

  const handleInputFocus = () => {
    setDropdownOpen(true);
    onFocus?.();
  };

  const handleInputBlur = () => {
    setTimeout(() => setDropdownOpen(false), 150);
    onBlur?.();
  };

  const handleRescan = () => {
    rescanUnifiedApps();
  };

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
              onClick={() => setSelectedAppType(value)}
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
          {filteredApps.map((app, idx) => (
            <div
              key={app.id}
              style={{ 
                padding: '12px 16px', 
                cursor: 'pointer', 
                borderBottom: idx < filteredApps.length - 1 ? '1px solid hsl(var(--border-primary))' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: idx === 0 ? '8px 8px 0 0' : idx === filteredApps.length - 1 ? '0 0 8px 8px' : '0',
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
                e.currentTarget.style.backgroundColor = 'hsl(var(--state-hover))';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
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