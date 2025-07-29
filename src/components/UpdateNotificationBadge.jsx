import React from 'react';
import PropTypes from 'prop-types';
import './UpdateNotificationBadge.css';

function UpdateNotificationBadge({ 
  isVisible, 
  onDismiss, 
  onInstall, 
  updateInfo 
}) {
  if (!isVisible) return null;

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleInstall = () => {
    if (onInstall) {
      onInstall();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="update-notification-badge">
      <div className="update-notification-content">
        <div className="update-notification-header">
          <div className="update-notification-icon">
            <span role="img" aria-label="update">🔄</span>
          </div>
          <div className="update-notification-title">
            Update Available
          </div>
          <button 
            className="update-notification-close"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
        
        <div className="update-notification-body">
          <div className="update-notification-version">
            Version {updateInfo?.version || 'Unknown'}
          </div>
          {updateInfo?.releaseDate && (
            <div className="update-notification-date">
              Released {formatDate(updateInfo.releaseDate)}
            </div>
          )}
          {updateInfo?.releaseNotes && (
            <div className="update-notification-notes">
              {updateInfo.releaseNotes.length > 100 
                ? `${updateInfo.releaseNotes.substring(0, 100)}...`
                : updateInfo.releaseNotes
              }
            </div>
          )}
        </div>
        
        <div className="update-notification-actions">
          <button 
            className="update-notification-install"
            onClick={handleInstall}
          >
            Install Update
          </button>
          <button 
            className="update-notification-later"
            onClick={handleDismiss}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

UpdateNotificationBadge.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onInstall: PropTypes.func.isRequired,
  updateInfo: PropTypes.shape({
    version: PropTypes.string,
    releaseDate: PropTypes.string,
    releaseNotes: PropTypes.string
  })
};

export default UpdateNotificationBadge; 