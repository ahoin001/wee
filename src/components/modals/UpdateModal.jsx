import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Download, RefreshCw, Rocket, CheckCircle2, AlertCircle } from 'lucide-react';
import { WeeModalShell, WeeButton, WeeModalFieldCard } from '../../ui/wee';
import Text from '../../ui/Text';
import { useAppUpdater } from '../../hooks/useAppUpdater';

function statusLabel(status) {
  switch (status) {
    case 'checking':
      return 'Checking for updates…';
    case 'available':
      return 'Update available';
    case 'downloading':
      return 'Downloading update…';
    case 'downloaded':
      return 'Ready to install';
    case 'not-available':
      return 'You are up to date';
    case 'error':
      return 'Update check failed';
    default:
      return 'Updates';
  }
}

/**
 * Unified Wee update modal — driven by useAppUpdater store state.
 * Keep mounted while closing; pass isOpen to WeeModalShell for exit animation.
 */
function UpdateModal({ isOpen, onClose }) {
  const {
    updateInfo,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismissUpdateVersion,
    openGitHubReleases,
  } = useAppUpdater();

  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const version = await window.api?.getAppVersion?.();
        if (!cancelled) setAppVersion(version || 'Unknown');
      } catch {
        if (!cancelled) setAppVersion('Unknown');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // Fresh check when opened manually with no active download/install state.
    const status = updateInfo?.status;
    if (!status || status === 'not-available' || status === 'idle' || status === 'error') {
      checkForUpdates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check on open
  }, [isOpen]);

  const status = updateInfo?.status || 'idle';
  const progress = typeof updateInfo?.progress === 'number' ? Math.round(updateInfo.progress) : null;
  const notes = updateInfo?.releaseNotes || '';

  const handleClose = () => {
    onClose?.();
  };

  const footerContent = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <WeeButton type="button" variant="secondary" onClick={openGitHubReleases}>
        GitHub releases
      </WeeButton>
      <div className="flex flex-wrap gap-2">
        {status === 'available' ? (
          <WeeButton type="button" variant="secondary" onClick={dismissUpdateVersion}>
            Later
          </WeeButton>
        ) : (
          <WeeButton type="button" variant="secondary" onClick={handleClose}>
            Close
          </WeeButton>
        )}
        {status === 'available' ? (
          <WeeButton type="button" variant="primary" onClick={downloadUpdate}>
            <Download size={16} className="mr-2" aria-hidden />
            Download
          </WeeButton>
        ) : null}
        {status === 'downloaded' ? (
          <WeeButton type="button" variant="primary" onClick={installUpdate}>
            <Rocket size={16} className="mr-2" aria-hidden />
            Install & restart
          </WeeButton>
        ) : null}
        {status === 'error' || status === 'not-available' || status === 'idle' ? (
          <WeeButton type="button" variant="primary" onClick={checkForUpdates}>
            <RefreshCw size={16} className="mr-2" aria-hidden />
            Check again
          </WeeButton>
        ) : null}
      </div>
    </div>
  );

  return (
    <WeeModalShell
      isOpen={isOpen}
      onClose={status === 'available' ? dismissUpdateVersion : handleClose}
      headerTitle="Updates"
      showRail={false}
      maxWidth="min(560px, 94vw)"
      footerContent={footerContent}
    >
      <div className="flex flex-col gap-5">
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-5 md:p-6">
          <Text variant="caption" className="!mt-0 uppercase tracking-[0.14em] text-[hsl(var(--text-tertiary))]">
            Installed
          </Text>
          <p className="m-0 mt-2 text-2xl font-black uppercase italic tracking-tight text-[hsl(var(--text-primary))]">
            {appVersion || '…'}
          </p>
        </WeeModalFieldCard>

        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <div className="mb-3 flex items-center gap-2">
            {status === 'downloaded' || status === 'not-available' ? (
              <CheckCircle2 size={18} className="text-[hsl(var(--state-success))]" aria-hidden />
            ) : null}
            {status === 'error' ? (
              <AlertCircle size={18} className="text-[hsl(var(--state-error))]" aria-hidden />
            ) : null}
            <Text variant="h3" className="!m-0 playful-hero-text">
              {statusLabel(status)}
            </Text>
          </div>

          {updateInfo?.version && status !== 'not-available' ? (
            <Text variant="body" className="!mt-0 text-[hsl(var(--text-secondary))]">
              Latest: <span className="font-semibold text-[hsl(var(--text-primary))]">{updateInfo.version}</span>
            </Text>
          ) : null}

          {status === 'checking' ? (
            <Text variant="body" className="text-[hsl(var(--text-secondary))]">
              Talking to GitHub Releases…
            </Text>
          ) : null}

          {status === 'downloading' ? (
            <div className="mt-3">
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-tertiary))]"
                role="progressbar"
                aria-valuenow={progress ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary))] transition-[width] duration-200"
                  style={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }}
                />
              </div>
              <Text variant="caption" className="mt-2 text-[hsl(var(--text-tertiary))]">
                {progress != null ? `${progress}%` : 'Starting download…'}
              </Text>
            </div>
          ) : null}

          {status === 'error' ? (
            <div className="mt-2 rounded-[1.25rem] border border-[hsl(var(--state-error)/0.35)] bg-[hsl(var(--state-error)/0.08)] p-3">
              <Text variant="body" className="!m-0 text-[hsl(var(--state-error))]">
                {updateInfo?.error || 'Something went wrong while checking for updates.'}
              </Text>
            </div>
          ) : null}

          {notes && (status === 'available' || status === 'downloaded') ? (
            <div className="mt-4 rounded-[1.25rem] border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-primary)/0.65)] p-4">
              <Text variant="caption" className="!mt-0 mb-2 uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
                Release notes
              </Text>
              <pre className="m-0 whitespace-pre-wrap font-[family-name:var(--font-ui)] text-sm leading-relaxed text-[hsl(var(--text-secondary))]">
                {notes}
              </pre>
            </div>
          ) : null}

          {status === 'downloaded' ? (
            <Text variant="body" className="mt-3 text-[hsl(var(--text-secondary))]">
              Install restarts Wee onto the new version.
            </Text>
          ) : null}
        </WeeModalFieldCard>
      </div>
    </WeeModalShell>
  );
}

UpdateModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

UpdateModal.defaultProps = {
  isOpen: false,
};

export default UpdateModal;
