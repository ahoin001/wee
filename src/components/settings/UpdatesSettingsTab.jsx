import React, { useEffect, useState, useCallback } from 'react';
import Text from '../../ui/Text';
import SettingsWeeSection from './SettingsWeeSection';
import { WeeModalFieldCard, WeeButton } from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import { useAppUpdater } from '../../hooks/useAppUpdater';
import './settings-wee-panels.css';

const UpdatesSettingsTab = () => {
  const {
    updateAvailable,
    updateInfo,
    openUpdateModal,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    openGitHubReleases,
  } = useAppUpdater();

  const [currentVersion, setCurrentVersion] = useState('');
  const [lastChecked, setLastChecked] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const version = await window.api?.getAppVersion?.();
        if (!cancelled) setCurrentVersion(version || 'Unknown');
      } catch {
        if (!cancelled) setCurrentVersion('Unknown');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCheck = useCallback(async () => {
    setChecking(true);
    try {
      await checkForUpdates();
      setLastChecked(new Date());
    } finally {
      setChecking(false);
    }
  }, [checkForUpdates]);

  const status = updateInfo?.status;
  const latestVersion = updateInfo?.version || '';

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
              <WeeButton type="button" variant="primary" onClick={handleCheck} disabled={checking}>
                {checking || status === 'checking' ? 'Checking…' : 'Check for updates'}
              </WeeButton>
              <WeeButton type="button" variant="secondary" onClick={openUpdateModal}>
                Open update dialog
              </WeeButton>
              {lastChecked ? (
                <Text variant="body" className="text-[hsl(var(--text-secondary))]">
                  Last checked: {lastChecked.toLocaleString()}
                </Text>
              ) : null}
            </div>

            {status === 'error' ? (
              <div className="settings-wee-msg settings-wee-msg--error !mb-0">
                <Text variant="body" className="!m-0">
                  {updateInfo?.error || 'Failed to check for updates'}
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
                    {updateInfo?.releaseNotes ? (
                      <div className="rounded-[1.25rem] border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-primary)/0.65)] p-3">
                        <Text variant="body" className="text-sm whitespace-pre-wrap">
                          {updateInfo.releaseNotes}
                        </Text>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-3">
                      {status === 'available' ? (
                        <WeeButton type="button" variant="primary" onClick={downloadUpdate} className="min-w-0 flex-1">
                          Download update
                        </WeeButton>
                      ) : null}
                      {status === 'downloaded' ? (
                        <WeeButton type="button" variant="primary" onClick={installUpdate} className="min-w-0 flex-1">
                          Install & restart
                        </WeeButton>
                      ) : null}
                      {status === 'downloading' ? (
                        <Text variant="body" className="text-[hsl(var(--text-secondary))]">
                          Downloading… {Math.round(updateInfo?.progress || 0)}%
                        </Text>
                      ) : null}
                    </div>
                  </div>
                ) : status === 'not-available' ? (
                  <Text variant="body" className="mt-2 text-[hsl(var(--text-secondary))]">
                    You are on the latest release.
                  </Text>
                ) : null}
              </div>
            ) : null}
          </div>
        </WeeModalFieldCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Manual">
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-5 md:p-6">
          <Text variant="body" className="!mt-0 text-[hsl(var(--text-secondary))]">
            Prefer a full installer? Open the GitHub Releases page for this project.
          </Text>
          <div className="mt-4">
            <WeeButton type="button" variant="secondary" onClick={openGitHubReleases}>
              Open GitHub releases
            </WeeButton>
          </div>
        </WeeModalFieldCard>
      </SettingsWeeSection>
    </div>
  );
};

export default UpdatesSettingsTab;
