import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

function UpdateModal({ isOpen, onClose }) {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [showFullChangelog, setShowFullChangelog] = useState(false);
  const [changelogData, setChangelogData] = useState(null);

  // Load app version
  const loadAppVersion = async () => {
    try {
      const version = await window.api.getAppVersion();
      setAppVersion(version);
    } catch (error) {
      console.error('Failed to load app version:', error);
      setAppVersion('Unknown');
    }
  };

  // Handle update status changes
  const handleUpdateStatus = (data) => {
    setUpdateStatus(data);
    
    if (data.status === 'downloading') {
      setIsDownloading(true);
    } else if (data.status === 'downloaded' || data.status === 'error') {
      setIsDownloading(false);
    }
  };

  // Load changelog data
  const loadChangelogData = async () => {
    try {
      // For now, we'll use a simple changelog structure
      // In a real implementation, this could fetch from a remote API or local file
      const changelog = {
        currentVersion: appVersion,
        latestVersion: updateStatus?.version,
        releases: [
          {
            version: updateStatus?.version,
            date: updateStatus?.releaseDate,
            notes: updateStatus?.releaseNotes,
            type: 'latest'
          },
          {
            version: '1.9.1',
            date: '2024-01-XX',
            notes: `### Added
- Auto-update system with background checking
- Update notification badges
- Enhanced update modal with changelog support
- Sound settings in presets
- Channel data in presets
- Improved preset system with visual indicators

### Changed
- Moved "Check for Updates" from General Settings to main settings menu
- Enhanced update modal UI with better error handling
- Improved sound volume synchronization
- Better memory management and performance optimizations

### Fixed
- Sound volume changes not taking effect immediately
- Sound stopping after saving volume changes
- Volume reverting on window focus
- Preset system not properly saving/restoring channel data
- Update modal opening automatically on app start
- Endless loading spinner in update check

### Security
- Enhanced event listener cleanup to prevent memory leaks`,
            type: 'previous'
          },
          {
            version: '1.9.0',
            date: '2024-01-XX',
            notes: `### Added
- Classic Wii Dock mode
- Keyboard shortcuts system
- Admin panel with custom commands
- Wallpaper cycling with multiple transition types
- Channel autoplay settings
- Music icon in settings menu

### Changed
- Improved wallpaper fade transitions
- Enhanced UI with blue hover states
- Better performance optimizations

### Fixed
- Settings menu closing issues
- App scanning on every startup
- Various UI and performance bugs`,
            type: 'previous'
          }
        ]
      };
      setChangelogData(changelog);
    } catch (error) {
      console.error('Failed to load changelog:', error);
    }
  };

  // Check for updates
  const handleCheckForUpdates = async () => {
    try {
      setUpdateStatus({ status: 'checking' });
      
      const result = await window.api.updater.checkForUpdates();
      
      if (!result.success) {
        setUpdateStatus({ 
          status: 'error', 
          error: result.error || 'Failed to check for updates' 
        });
        return;
      }
      
      if (result.status === 'no-update') {
        setUpdateStatus({ 
          status: 'not-available',
          message: result.message || 'No updates available'
        });
        return;
      }
      
      // If no specific status returned, assume no updates available
      setUpdateStatus({ status: 'not-available' });
      
    } catch (error) {
      console.error('[UpdateModal] Error checking for updates:', error);
      setUpdateStatus({ 
        status: 'error', 
        error: error.message || 'Failed to check for updates' 
      });
    }
  };

  // Download update
  const handleDownloadUpdate = async () => {
    try {
      setIsDownloading(true);
      const result = await window.api.updater.downloadUpdate();
      
      if (!result.success) {
        console.error('[UpdateModal] Download failed:', result.error);
        setUpdateStatus({ 
          status: 'error', 
          error: result.error || 'Failed to download update' 
        });
      }
    } catch (error) {
      console.error('[UpdateModal] Error downloading update:', error);
      setUpdateStatus({ 
        status: 'error', 
        error: error.message || 'Failed to download update' 
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Install update
  const handleInstallUpdate = async () => {
    try {
      await window.api.updater.installUpdate();
    } catch (error) {
      console.error('[UpdateModal] Error installing update:', error);
      setUpdateStatus({ 
        status: 'error', 
        error: error.message || 'Failed to install update' 
      });
    }
  };

  // Load app version and set up update status listener
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setUpdateStatus(null);
      setIsDownloading(false);
      setShowFullChangelog(false);
      setChangelogData(null);
      return;
    }

    // Load app version when modal opens
    loadAppVersion();

    // Set up update status listener
    window.api.updater.onUpdateStatus(handleUpdateStatus);

    return () => {
      window.api.updater.offUpdateStatus(handleUpdateStatus);
    };
  }, [isOpen]);

  // Render status content
  const renderStatusContent = () => {
    if (updateStatus?.status === 'checking') {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#007bff' }}>
            🔍 Checking for Updates...
          </div>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        </div>
      );
    }

    if (updateStatus?.status === 'available') {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#28a745' }}>
            🎉 Update Available!
          </div>
          <div style={{ marginBottom: '15px', color: '#666' }}>
            <div><strong>New Version:</strong> {updateStatus.version}</div>
            <div><strong>Current Version:</strong> {appVersion}</div>
            {updateStatus.releaseDate && (
              <div><strong>Release Date:</strong> {new Date(updateStatus.releaseDate).toLocaleDateString()}</div>
            )}
          </div>
          
          {/* Release Notes Section */}
          {updateStatus.releaseNotes && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>📋 What's New:</div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                maxHeight: '200px', 
                overflowY: 'auto', 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                lineHeight: '1.5'
              }}>
                {updateStatus.releaseNotes}
              </div>
              
              {/* View Full Changelog Button */}
              <button
                onClick={() => {
                  loadChangelogData();
                  setShowFullChangelog(true);
                }}
                style={{
                  backgroundColor: '#f8f9fa',
                  color: '#007bff',
                  border: '1px solid #007bff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  marginTop: '8px',
                  transition: 'background 0.2s, color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#007bff';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.color = '#007bff';
                }}
              >
                📜 View Full Changelog
              </button>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadUpdate}
              disabled={isDownloading}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                opacity: isDownloading ? 0.6 : 1,
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {isDownloading ? '⏳ Downloading...' : '⬇️ Download Update'}
            </button>
            <a
              href="https://github.com/ahoin001/WiiDesktopLauncher/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                backgroundColor: '#f7fafd',
                color: '#007bff',
                border: '1px solid #b0c4d8',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s, color 0.2s',
                marginLeft: 0
              }}
            >
              📦 Download from Release Page
            </a>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Later
            </button>
          </div>
        </div>
      );
    }

    if (updateStatus?.status === 'not-available') {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#28a745' }}>
            ✓ Up to Date
          </div>
          <div style={{ color: '#666', marginBottom: '20px' }}>
            You're running the latest version ({appVersion})
          </div>
          <button
            onClick={handleCheckForUpdates}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Check Again
          </button>
        </div>
      );
    }

    if (updateStatus?.status === 'downloading') {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#007bff' }}>
            ⏳ Downloading Update...
          </div>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${updateStatus.progress || 0}%`, 
                  height: '100%', 
                  backgroundColor: '#007bff',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
              {Math.round(updateStatus.progress || 0)}% Complete
            </div>
          </div>
        </div>
      );
    }

    if (updateStatus?.status === 'downloaded') {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#28a745' }}>
            ✅ Update Downloaded!
          </div>
          <div style={{ color: '#666', marginBottom: '20px' }}>
            Version {updateStatus.version} is ready to install
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={handleInstallUpdate}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🔄 Install & Restart
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Later
            </button>
          </div>
        </div>
      );
    }

    if (updateStatus?.status === 'error') {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#dc3545' }}>
            ❌ Update Error
          </div>
          <div style={{ color: '#666', marginBottom: '20px' }}>
            {updateStatus.error || 'An error occurred while checking for updates'}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={handleCheckForUpdates}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Try Again
            </button>
            <a
              href="https://github.com/ahoin001/WiiDesktopLauncher/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                backgroundColor: '#f7fafd',
                color: '#007bff',
                border: '1px solid #b0c4d8',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📦 Manual Download
            </a>
          </div>
        </div>
      );
    }

    // Default state - show check for updates
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
          🔄 Check for Updates
        </div>
        <div style={{ color: '#666', marginBottom: '20px' }}>
          Current version: {appVersion}
        </div>
        <button
          onClick={handleCheckForUpdates}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔍 Check for Updates
        </button>
      </div>
    );
  };

  // Render full changelog
  const renderFullChangelog = () => {
    if (!changelogData) return null;

    return (
      <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          borderBottom: '1px solid #e9ecef',
          paddingBottom: '10px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            📜 Full Changelog
          </div>
          <button
            onClick={() => setShowFullChangelog(false)}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ✕ Close
          </button>
        </div>
        
        <div style={{ marginBottom: '20px', color: '#666' }}>
          <div><strong>Current Version:</strong> {changelogData.currentVersion}</div>
          {changelogData.latestVersion && (
            <div><strong>Latest Version:</strong> {changelogData.latestVersion}</div>
          )}
        </div>
        
        {changelogData.releases.map((release, index) => (
          <div key={index} style={{ 
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: release.type === 'latest' ? '#f8f9fa' : '#fff',
            borderRadius: '8px',
            border: release.type === 'latest' ? '2px solid #007bff' : '1px solid #e9ecef'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: release.type === 'latest' ? '#007bff' : '#333'
              }}>
                Version {release.version}
                {release.type === 'latest' && <span style={{ marginLeft: '8px', fontSize: '12px', backgroundColor: '#007bff', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>LATEST</span>}
              </div>
              {release.date && (
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {new Date(release.date).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div style={{ 
              fontSize: '14px', 
              color: '#666', 
              lineHeight: '1.6',
              whiteSpace: 'pre-line'
            }}>
              {release.notes}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <BaseModal onClose={onClose} title="Check for Updates">
      <div style={{ minHeight: '200px' }}>
        {renderStatusContent()}
        {showFullChangelog && renderFullChangelog()}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </BaseModal>
  );
}

UpdateModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export default UpdateModal; 