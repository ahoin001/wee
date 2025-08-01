import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function AppPathSearchCard({
  value,
  onChange,
  onFocus,
  onBlur,
  results,
  loading,
  error,
  onSelect,
  onRescan,
  rescanLabel = 'Rescan',
  disabled,
  placeholder = 'Enter or search for an app...',
  dropdownOpen,
  setDropdownOpen,
  uwpMode = false,
}) {
  const [uwpApps, setUwpApps] = useState([]);
  const [uwpSearch, setUwpSearch] = useState('');
  const [uwpLoading, setUwpLoading] = useState(false);
  useEffect(() => {
    if (uwpMode && window.api?.uwp?.listApps) {
      setUwpLoading(true);
      window.api.uwp.listApps().then(apps => {
        setUwpApps(apps || []);
        setUwpLoading(false);
      });
    }
  }, [uwpMode]);
  const filteredUwpApps = uwpApps.filter(app =>
    app.name.toLowerCase().includes(uwpSearch.toLowerCase())
  );
  if (uwpMode) {
    return (
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          type="text"
          className="text-input"
          placeholder="Search Microsoft Store apps..."
          value={uwpSearch}
          onChange={e => setUwpSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1.5px solid #ccc', marginBottom: 0 }}
          disabled={disabled}
        />
        {uwpLoading && <div style={{ color: '#888', marginTop: 4 }}>Loading...</div>}
        {!uwpLoading && filteredUwpApps.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 8,
            boxShadow: '0 2px 8px #0002',
            zIndex: 1000,
            maxHeight: 220,
            overflowY: 'auto',
          }}>
            {filteredUwpApps.map((app, idx) => (
              <div
                key={app.appId}
                style={{ 
                  padding: '12px 16px', 
                  cursor: 'pointer', 
                  borderBottom: idx < filteredUwpApps.length - 1 ? '1px solid #eee' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: idx === 0 ? '8px 8px 0 0' : idx === filteredUwpApps.length - 1 ? '0 0 8px 8px' : '0',
                  position: 'relative',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#333'
                }}
                onMouseDown={() => onSelect({ name: app.name, appId: app.appId, type: 'uwp' })}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f0f8ff';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 153, 255, 0.15)';
                  e.currentTarget.style.color = '#0066cc';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.color = '#333';
                }}
              >
                {app.name}
              </div>
            ))}
          </div>
        )}
        {!uwpLoading && filteredUwpApps.length === 0 && uwpSearch && (
          <div style={{ color: '#888', marginTop: 4 }}>No apps found.</div>
        )}
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          className="text-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{ width: '100%', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1.5px solid #ccc', marginBottom: 0 }}
          disabled={disabled}
        />
        <button
          type="button"
          style={{ marginLeft: 12, padding: '4px 12px', borderRadius: 6, border: '1.5px solid #0099ff', background: '#f7fafd', color: '#0099ff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          title="Rescan if you recently installed a new app and it's not showing up."
          disabled={loading || disabled}
          onClick={onRescan}
        >
          {loading ? 'Rescanning...' : rescanLabel}
        </button>
        <button
          type="button"
          style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6, border: '1.5px solid #dc3545', background: '#f7fafd', color: '#dc3545', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontSize: '12px' }}
          title="Force clear cache and rescan all apps"
          disabled={loading || disabled}
          onClick={() => {
            // Clear cache and force fresh scan
            localStorage.removeItem('app_cache_installedApps');
            localStorage.removeItem('app_cache_timestamp_installedApps');
            onRescan();
          }}
        >
          {loading ? '...' : 'Force'}
        </button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 4 }}>{error}</div>}
      {dropdownOpen && results && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 8,
          boxShadow: '0 2px 8px #0002',
          zIndex: 1000,
        }}>
          {results.map((item, idx) => (
            <div
              key={item.id || item.name || idx}
              style={{ 
                padding: '12px 16px', 
                cursor: 'pointer', 
                borderBottom: idx < results.length - 1 ? '1px solid #eee' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: idx === 0 ? '8px 8px 0 0' : idx === results.length - 1 ? '0 0 8px 8px' : '0',
                position: 'relative',
                fontSize: '16px',
                fontWeight: '500',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseDown={() => onSelect(item)}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f0f8ff';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 153, 255, 0.15)';
                e.currentTarget.style.color = '#0066cc';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.color = '#333';
              }}
            >
              {item.icon && (
                <img 
                  src={item.icon} 
                  alt={`${item.name} icon`}
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '4px',
                    objectFit: 'contain',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                  {item.name || item.path || item.appName}
                </div>
                {item.path && item.name && (
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#666', 
                    opacity: '0.8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.path}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

AppPathSearchCard.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  results: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onRescan: PropTypes.func.isRequired,
  rescanLabel: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  dropdownOpen: PropTypes.bool,
  setDropdownOpen: PropTypes.func,
  uwpMode: PropTypes.bool,
};

export default AppPathSearchCard; 