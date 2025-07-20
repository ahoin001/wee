import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

function UpdateModal({ isOpen, onClose }) {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setUpdateStatus(null);
      setIsChecking(false);
      setIsDownloading(false);
      setDownloadProgress(0);
      setError(null);
      return;
    }

    const handleUpdateStatus = (data) => {
      console.log('[UpdateModal] Update status received:', data);
      setUpdateStatus(data);
      
      switch (data.status) {
        case 'checking':
          setIsChecking(true);
          setError(null);
          break;
        case 'available':
          setIsChecking(false);
          setError(null);
          break;
        case 'not-available':
          console.log('[UpdateModal] No updates available, stopping check');
          setIsChecking(false);
          setError(null);
          break;
        case 'downloading':
          setIsDownloading(true);
          setDownloadProgress(data.progress || 0);
          setError(null);
          break;
        case 'downloaded':
          setIsDownloading(false);
          setDownloadProgress(100);
          setError(null);
          break;
        case 'error':
          console.log('[UpdateModal] Update error received:', data.error);
          setIsChecking(false);
          setIsDownloading(false);
          setError(data.error || 'An unknown error occurred');
          break;
        default:
          console.log('[UpdateModal] Unknown status received:', data.status);
          // For any other status, ensure checking state is cleared
          if (data.status !== 'checking') {
            setIsChecking(false);
          }
          break;
      }
    };

    window.api.updater.onUpdateStatus(handleUpdateStatus);

    return () => {
      window.api.updater.offUpdateStatus(handleUpdateStatus);
    };
  }, [isOpen]);

  const handleCheckForUpdates = async () => {
    console.log('[UpdateModal] Starting update check...');
    setIsChecking(true);
    setError(null);
    setUpdateStatus(null);
    
    try {
      // First, let's test if the API is available
      if (!window.api || !window.api.updater) {
        throw new Error('Update API not available');
      }
      
      // Set a timeout to ensure we always get a result
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Update check timed out')), 8000);
      });
      
      // Try to check for updates with a timeout
      const result = await Promise.race([
        window.api.updater.checkForUpdates(),
        timeoutPromise
      ]);
      
      console.log('[UpdateModal] Update check result:', result);
      if (!result.success) {
        setError(result.error || 'Failed to check for updates');
        setIsChecking(false);
        return;
      }
      
      // Handle immediate responses (like development mode or no update config)
      if (result.status === 'no-update') {
        setUpdateStatus({
          status: 'not-available',
          message: result.message || 'No updates available'
        });
        setIsChecking(false);
        return;
      }
      
      // If we get here, the check was successful but we need to wait for status events
      // Set a shorter timeout to prevent endless spinning
      setTimeout(() => {
        console.log('[UpdateModal] No status events received, assuming no updates available');
        if (isChecking && !updateStatus) {
          setUpdateStatus({ status: 'not-available' });
          setIsChecking(false);
        }
      }, 3000); // 3 second timeout for better UX
      
    } catch (err) {
      console.error('[UpdateModal] Update check error:', err);
      if (err.message === 'Update check timed out') {
        setError('Update check timed out. Please try again later.');
      } else {
        setError(err.message || 'Failed to check for updates');
      }
      setIsChecking(false);
    }
  };

  const handleDownloadUpdate = async () => {
    setIsDownloading(true);
    setError(null);
    
    try {
      const result = await window.api.updater.downloadUpdate();
      if (!result.success) {
        setError(result.error || 'Failed to download update');
        setIsDownloading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to download update');
      setIsDownloading(false);
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await window.api.updater.installUpdate();
    } catch (err) {
      setError(err.message || 'Failed to install update');
    }
  };

  const renderStatusContent = () => {
    if (isChecking) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '16px', marginBottom: '10px', color: '#666' }}>
            Checking for updates...
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
            <div><strong>Current Version:</strong> 1.9.1</div>
            {updateStatus.releaseDate && (
              <div><strong>Release Date:</strong> {new Date(updateStatus.releaseDate).toLocaleDateString()}</div>
            )}
          </div>
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
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
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
          <div style={{ color: '#666', marginBottom: '15px' }}>
            {updateStatus.message || 'You\'re running the latest version of WiiDesktop Launcher.'}
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>
      );
    }

    if (updateStatus?.status === 'downloading') {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '16px', marginBottom: '15px', color: '#666' }}>
            Downloading Update...
          </div>
          <div style={{ width: '100%', backgroundColor: '#f3f3f3', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
            <div
              style={{
                width: `${downloadProgress}%`,
                height: '20px',
                backgroundColor: '#007bff',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
            {Math.round(downloadProgress)}%
          </div>
        </div>
      );
    }

    if (updateStatus?.status === 'downloaded') {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#28a745' }}>
            Update Downloaded!
          </div>
          <div style={{ marginBottom: '15px', color: '#666' }}>
            Version {updateStatus.version} has been downloaded and is ready to install.
          </div>
          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#dc3545' }}>
            ⚠️ The app will restart to install the update.
          </div>
          <button
            onClick={handleInstallUpdate}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Install & Restart
          </button>
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '16px', marginBottom: '15px', color: '#666' }}>
          Check for updates to get the latest features and improvements.
        </div>
        <button
          onClick={handleCheckForUpdates}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Check for Updates
        </button>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
          Current version: 1.9.1
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <BaseModal onClose={onClose} title="Check for Updates">
      <div style={{ minHeight: '200px' }}>
        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            <div style={{ marginBottom: '10px' }}>Error: {error}</div>
            <button
              onClick={() => {
                setError(null);
                handleCheckForUpdates();
              }}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Try Again
            </button>
          </div>
        )}
        {renderStatusContent()}
      </div>
      <style jsx>{`
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