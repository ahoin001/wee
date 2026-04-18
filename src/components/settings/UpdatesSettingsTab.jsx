import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import SettingsWeeSection from './SettingsWeeSection';
import { WeeModalFieldCard } from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import './settings-wee-panels.css';

const RELEASES_URL = 'https://github.com/ahoin001/wee/releases';

const UpdatesSettingsTab = () => {
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const getCurrentVersion = async () => {
      try {
        if (window.api?.getAppVersion) {
          const version = await window.api.getAppVersion();
          setCurrentVersion(version);
        } else {
          setCurrentVersion('Unknown');
        }
      } catch (err) {
        console.error('[UpdatesSettingsTab] Error getting current version:', err);
        setCurrentVersion('Unknown');
      }
    };

    getCurrentVersion();
  }, []);

  const checkForUpdates = useCallback(async () => {
    setCheckingForUpdates(true);
    setError('');

    try {
      if (window.api?.checkForUpdates) {
        const result = await window.api.checkForUpdates();

        if (result.success) {
          const isAvailable = result.status === 'available';
          setLatestVersion(isAvailable ? result.version || 'Unknown' : currentVersion || 'Unknown');
          setUpdateAvailable(isAvailable);
          setUpdateInfo(
            isAvailable
              ? {
                  releaseNotes: result.releaseNotes || '',
                  releaseDate: result.releaseDate || null,
                  status: result.status,
                }
              : null,
          );
          setLastChecked(new Date());
        } else {
          setError(result.error || 'Failed to check for updates');
        }
      } else {
        setError('Update checking not available in this version');
      }
    } catch (err) {
      console.error('[UpdatesSettingsTab] Error checking for updates:', err);
      setError('Failed to check for updates. Please try again.');
    } finally {
      setCheckingForUpdates(false);
    }
  }, [currentVersion]);

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
        window.open(RELEASES_URL, '_blank');
      }
    } catch (err) {
      console.error('[UpdatesSettingsTab] Error downloading update:', err);
      setError('Failed to download update. Please try again.');
    }
  }, []);

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
    } catch (err) {
      console.error('[UpdatesSettingsTab] Error installing update:', err);
      setError('Failed to install update. Please try again.');
    }
  }, []);

  const openGitHubReleases = useCallback(() => {
    window.open(RELEASES_URL, '_blank');
  }, []);

  return (
    <div className="settings-wee-tab-root pb-12">
      <SettingsTabPageHeader title="Updates" subtitle="Check for updates & version info" />

      <SettingsWeeSection eyebrow="Version">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <Text variant="h3" className="mb-4 playful-hero-text">
            This install
          </Text>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <span className="settings-wee-version-pill">{currentVersion}</span>
            <Text variant="body" className="!m-0 text-[hsl(var(--text-secondary))]">
              Installed version
            </Text>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" onClick={checkForUpdates} disabled={checkingForUpdates} className="min-w-[140px]">
                {checkingForUpdates ? 'Checking…' : 'Check for updates'}
              </Button>
              {lastChecked ? (
                <Text variant="body" className="text-[hsl(var(--text-secondary))]">
                  Last checked: {lastChecked.toLocaleString()}
                </Text>
              ) : null}
            </div>

            {error ? (
              <div className="settings-wee-msg settings-wee-msg--error !mb-0">
                <Text variant="body" className="!m-0">
                  {error}
                </Text>
              </div>
            ) : null}

            {latestVersion ? (
              <div className="settings-wee-panel">
                <div className="settings-wee-panel__head">
                  <p className="settings-wee-panel__title">Latest from updater</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Text variant="body" className="!m-0 font-semibold text-[hsl(var(--text-primary))]">
                    Reported version
                  </Text>
                  <span className="settings-wee-version-pill text-sm">{latestVersion}</span>
                </div>

                {updateAvailable ? (
                  <div className="settings-wee-panel__body mt-2">
                    <div className="flex items-center gap-2">
                      <span className="settings-wee-status-dot" aria-hidden />
                      <Text variant="body" className="!m-0 text-[hsl(var(--state-success))]">
                        Update available
                      </Text>
                    </div>
                    {updateInfo ? (
                      <div className="rounded-[1.25rem] border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-primary)/0.65)] p-3">
                        <Text variant="body" className="text-sm">
                          {updateInfo.releaseNotes || 'No release notes available'}
                        </Text>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-3">
                      <Button variant="primary" onClick={downloadUpdate} className="min-w-0 flex-1">
                        Download update
                      </Button>
                      <Button variant="secondary" onClick={installUpdate} className="min-w-0 flex-1">
                        Install update
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="settings-wee-status-dot" aria-hidden />
                    <Text variant="body" className="!m-0 text-[hsl(var(--state-success))]">
                      You&apos;re up to date
                    </Text>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </WeeModalFieldCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="More">
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-5 md:p-6">
          <Text variant="h3" className="mb-3 playful-hero-text">
            Manual download
          </Text>
          <Text variant="body" className="mb-4 text-[hsl(var(--text-secondary))]">
            If automatic updates are unavailable, grab the latest build from GitHub.
          </Text>
          <Button variant="secondary" onClick={openGitHubReleases} className="w-full">
            Open GitHub releases
          </Button>
          <Text variant="caption" className="mt-4 text-[hsl(var(--text-tertiary))]">
            Advanced update preferences live under the Advanced settings tab.
          </Text>
        </WeeModalFieldCard>
      </SettingsWeeSection>
    </div>
  );
};

export default UpdatesSettingsTab;
