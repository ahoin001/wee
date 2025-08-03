import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';

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
      console.log('[UpdateModal] Starting update check...');
      console.log('[UpdateModal] Current app version:', appVersion);
      setUpdateStatus({ status: 'checking' });
      
      const result = await window.api.updater.checkForUpdates();
      console.log('[UpdateModal] Update check result:', result);
      
      if (!result.success) {
        console.error('[UpdateModal] Update check failed:', result.error);
        setUpdateStatus({ 
          status: 'error', 
          error: result.error || 'Failed to check for updates' 
        });
        return;
      }
      
      if (result.status === 'available') {
        console.log('[UpdateModal] Update available:', result.version);
        setUpdateStatus({ 
          status: 'available',
          version: result.version,
          releaseDate: result.releaseDate,
          releaseNotes: result.releaseNotes
        });
        return;
      }
      
      if (result.status === 'no-update') {
        console.log('[UpdateModal] No updates available');
        setUpdateStatus({ 
          status: 'not-available',
          message: result.message || 'No updates available'
        });
        return;
      }
      
      // If no specific status returned, assume no updates available
      console.log('[UpdateModal] No specific status returned, assuming no updates');
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
        <div className="text-center p-5">
          <div className="text-lg font-bold mb-2.5 text-blue-600">
            🔍 Checking for Updates...
          </div>
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
      );
    }

    if (updateStatus?.status === 'available') {
      return (
        <div className="p-5">
          <div className="text-lg font-bold mb-2.5 text-green-600">
            🎉 Update Available!
          </div>
          <div className="mb-4 text-gray-600">
            <div><strong>New Version:</strong> {updateStatus.version}</div>
            <div><strong>Current Version:</strong> {appVersion}</div>
            {updateStatus.releaseDate && (
              <div><strong>Release Date:</strong> {new Date(updateStatus.releaseDate).toLocaleDateString()}</div>
            )}
          </div>
          
          {/* Release Notes Section */}
          {updateStatus.releaseNotes && (
            <div className="mb-4">
              <div className="font-bold mb-2 text-gray-800">📋 What's New:</div>
              <div className="text-sm text-gray-600 max-h-[200px] overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200 leading-relaxed">
                {updateStatus.releaseNotes}
              </div>
              
              {/* View Full Changelog Button */}
              <button
                onClick={() => {
                  loadChangelogData();
                  setShowFullChangelog(true);
                }}
                className="bg-gray-50 text-blue-600 border border-blue-600 px-4 py-2 rounded-md cursor-pointer text-sm mt-2 hover:bg-blue-600 hover:text-white transition-colors duration-200"
              >
                📜 View Full Changelog
              </button>
            </div>
          )}
          
          <div className="flex gap-2.5 justify-center flex-wrap">
            <button
              onClick={handleDownloadUpdate}
              disabled={isDownloading}
              className={`bg-blue-600 text-white border-none px-6 py-3 rounded-md text-sm font-medium transition-opacity duration-200 ${
                isDownloading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100'
              }`}
            >
              {isDownloading ? '⏳ Downloading...' : '⬇️ Download Update'}
            </button>
            <a
              href="https://github.com/ahoin001/wee/releases/latest"
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
              className="bg-gray-500 text-white border-none px-6 py-3 rounded-md cursor-pointer text-sm"
            >
              Later
            </button>
          </div>
        </div>
      );
    }

    if (updateStatus?.status === 'not-available') {
      return (
        <div className="text-center p-5">
          <div className="text-lg font-bold mb-2.5 text-green-600">
            ✓ Up to Date
          </div>
          <div className="text-gray-600 mb-5">
            You're running the latest version ({appVersion})
          </div>
          <button
            onClick={handleCheckForUpdates}
            className="bg-blue-600 text-white border-none px-6 py-3 rounded-md cursor-pointer text-sm"
          >
            🔄 Check Again
          </button>
        </div>
      );
    }

    if (updateStatus?.status === 'downloading') {
      return (
        <div className="text-center p-5">
          <div className="text-lg font-bold mb-2.5 text-blue-600">
            ⏳ Downloading Update...
          </div>
          <div className="mb-4">
            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                style={{ width: `${updateStatus.progress || 0}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {Math.round(updateStatus.progress || 0)}% Complete
            </div>
          </div>
        </div>
      );
    }

    if (updateStatus?.status === 'downloaded') {
      return (
        <div className="text-center p-5">
          <div className="text-lg font-bold mb-2.5 text-green-600">
            ✅ Update Downloaded!
          </div>
          <div className="text-gray-600 mb-5">
            Version {updateStatus.version} is ready to install
          </div>
          <div className="flex gap-2.5 justify-center">
            <button
              onClick={handleInstallUpdate}
              className="bg-green-600 text-white border-none px-6 py-3 rounded-md cursor-pointer text-sm font-medium"
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
              href="https://github.com/ahoin001/wee/releases/latest"
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
          className="bg-blue-600 text-white border-none px-6 py-3 rounded-md cursor-pointer text-sm"
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
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-2.5">
          <div className="text-lg font-bold text-gray-800">
            📜 Full Changelog
          </div>
          <button
            onClick={() => setShowFullChangelog(false)}
            className="bg-gray-500 text-white border-none px-4 py-2 rounded-md cursor-pointer text-sm"
          >
            ✕ Close
          </button>
        </div>
        
        <div className="mb-5 text-gray-600">
          <div><strong>Current Version:</strong> {changelogData.currentVersion}</div>
          {changelogData.latestVersion && (
            <div><strong>Latest Version:</strong> {changelogData.latestVersion}</div>
          )}
        </div>
        
        {changelogData.releases.map((release, index) => (
          <div key={index} className={`mb-5 p-4 rounded-lg ${
            release.type === 'latest' 
              ? 'bg-gray-50 border-2 border-blue-600' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex justify-between items-center mb-2.5">
              <div className={`text-base font-bold ${
                release.type === 'latest' ? 'text-blue-600' : 'text-gray-800'
              }`}>
                Version {release.version}
                {release.type === 'latest' && <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">LATEST</span>}
              </div>
              {release.date && (
                <div className="text-sm text-gray-600">
                  {new Date(release.date).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {release.notes}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <WBaseModal onClose={onClose} title="Check for Updates">
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
    </WBaseModal>
  );
}

UpdateModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export default UpdateModal; 