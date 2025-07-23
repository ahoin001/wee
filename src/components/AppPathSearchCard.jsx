import React from 'react';
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
}) {
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
              style={{ padding: 10, cursor: 'pointer', borderBottom: idx < results.length - 1 ? '1px solid #eee' : 'none' }}
              onMouseDown={() => onSelect(item)}
            >
              {item.name || item.path || item.appName}
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
};

export default AppPathSearchCard; 