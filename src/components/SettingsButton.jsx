import React from 'react';
import PropTypes from 'prop-types';
import useUIStore from '../utils/useUIStore';

function SettingsButton({ onClick, updateAvailable = false }) {
  return (
    <div 
      className="settings-button"
      onClick={onClick}
      style={{
        position: 'relative',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <span style={{ fontSize: '20px' }}>⚙️</span>
      
      {/* Update Badge */}
      {updateAvailable && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          background: '#dc3545',
          color: 'white',
          borderRadius: '50%',
          width: '12px',
          height: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          fontWeight: 'bold',
          animation: 'pulse 2s infinite',
          border: '2px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          !
        </div>
      )}
    </div>
  );
}

SettingsButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  updateAvailable: PropTypes.bool
};

export default SettingsButton; 