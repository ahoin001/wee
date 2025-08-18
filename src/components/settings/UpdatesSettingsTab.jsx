import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const UpdatesSettingsTab = () => {
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [error, setError] = useState('');

  // Get current version on component mount
  useEffect(() => {
    const getCurrentVersion = async () => {
      try {
        if (window.api?.getAppVersion) {
          const version = await window.api.getAppVersion();
          setCurrentVersion(version);
        } else {
          // Fallback to package.json version
          setCurrentVersion(process.env.npm_package_version || 'Unknown');
        }
      } catch (error) {
        console.error('[UpdatesSettingsTab] Error getting current version:', error);
        setCurrentVersion('Unknown');
      }
    };

    getCurrentVersion();
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    setCheckingForUpdates(true);
    setError('');
    
    try {
      if (window.api?.checkForUpdates) {
        const result = await window.api.checkForUpdates();
        
        if (result.success) {
          setLatestVersion(result.latestVersion || 'Unknown');
          setUpdateAvailable(result.updateAvailable || false);
          setUpdateInfo(result.updateInfo || null);
          setLastChecked(new Date());
        } else {
          setError(result.error || 'Failed to check for updates');
        }
      } else {
        // Fallback: simulate update check
        setError('Update checking not available in this version');
      }
    } catch (error) {
      console.error('[UpdatesSettingsTab] Error checking for updates:', error);
      setError('Failed to check for updates. Please try again.');
    } finally {
      setCheckingForUpdates(false);
    }
  }, []);

  // Download update
  const downloadUpdate = useCallback(async () => {
    try {
      if (window.api?.downloadUpdate) {
        const result = await window.api.downloadUpdate();
        if (result.success) {
          console.log('[UpdatesSettingsTab] Update download started');
        } else {
          setError(result.error || 'Failed to download update');
        }
      } else {
        // Fallback: open GitHub releases page
        window.open('https://github.com/your-repo/WiiDesktopLauncher/releases', '_blank');
      }
    } catch (error) {
      console.error('[UpdatesSettingsTab] Error downloading update:', error);
      setError('Failed to download update. Please try again.');
    }
  }, []);

  // Install update
  const installUpdate = useCallback(async () => {
    try {
      if (window.api?.installUpdate) {
        const result = await window.api.installUpdate();
        if (result.success) {
          console.log('[UpdatesSettingsTab] Update installation started');
        } else {
          setError(result.error || 'Failed to install update');
        }
      } else {
        setError('Automatic installation not available. Please download and install manually.');
      }
    } catch (error) {
      console.error('[UpdatesSettingsTab] Error installing update:', error);
      setError('Failed to install update. Please try again.');
    }
  }, []);

  // Open GitHub releases
  const openGitHubReleases = useCallback(() => {
    window.open('https://github.com/your-repo/WiiDesktopLauncher/releases', '_blank');
  }, []);

  return (
    <div className="space-y-6">
      {/* Version & Update Status */}
      <Card>
        <div className="p-6">
          <Text variant="h3" className="mb-6">Version & Updates</Text>
          
          {/* Current Version Section */}
          <div className="mb-6">
            <Text variant="h4" className="mb-3">Current Version</Text>
            <div className="flex items-center gap-4">
              <div className="bg-[hsl(var(--surface-tertiary))] px-4 py-2 rounded-lg">
                <Text variant="body" className="font-mono text-lg">
                  {currentVersion}
                </Text>
              </div>
              <Text variant="body" className="text-[hsl(var(--text-secondary))]">
                Installed version
              </Text>
            </div>
          </div>

          {/* Update Check Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                onClick={checkForUpdates}
                disabled={checkingForUpdates}
                className="min-w-[140px]"
              >
                {checkingForUpdates ? 'Checking...' : 'Check for Updates'}
              </Button>
              
              {lastChecked && (
                <Text variant="body" className="text-[hsl(var(--text-secondary))]">
                  Last checked: {lastChecked.toLocaleString()}
                </Text>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 dark:bg-red-900/20 dark:border-red-800">
                <Text variant="body" className="text-red-600 dark:text-red-400">
                  {error}
                </Text>
              </div>
            )}

            {latestVersion && (
              <div className="bg-[hsl(var(--surface-tertiary))] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Text variant="body" className="font-semibold">
                    Latest Version Available
                  </Text>
                  <div className="bg-[hsl(var(--surface-secondary))] px-3 py-1 rounded">
                    <Text variant="body" className="font-mono">
                      {latestVersion}
                    </Text>
                  </div>
                </div>
                
                {updateAvailable ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Text variant="body" className="text-green-600 dark:text-green-400">
                        Update available!
                      </Text>
                    </div>
                    
                    {updateInfo && (
                      <div className="bg-[hsl(var(--surface-secondary))] rounded p-3">
                        <Text variant="body" className="text-sm">
                          {updateInfo.releaseNotes || 'No release notes available'}
                        </Text>
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        onClick={downloadUpdate}
                        className="flex-1"
                      >
                        Download Update
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={installUpdate}
                        className="flex-1"
                      >
                        Install Update
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <Text variant="body" className="text-green-600 dark:text-green-400">
                      You're running the latest version!
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Manual Download & Settings */}
      <Card>
        <div className="p-6">
          <Text variant="h3" className="mb-6">Additional Options</Text>
          
          {/* Manual Download Section */}
          <div className="mb-6">
            <Text variant="h4" className="mb-3">Manual Download</Text>
            <Text variant="body" className="mb-4 text-[hsl(var(--text-secondary))]">
              If automatic updates aren't working, you can manually download the latest version from GitHub.
            </Text>
            
            <Button
              variant="secondary"
              onClick={openGitHubReleases}
              className="w-full"
            >
              Open GitHub Releases
            </Button>
          </div>

          {/* Update Settings Section */}
          <div>
            <Text variant="h4" className="mb-3">Update Settings</Text>
            <Text variant="body" className="text-[hsl(var(--text-secondary))]">
              Automatic update checking and installation settings can be configured in the Advanced tab.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UpdatesSettingsTab;
