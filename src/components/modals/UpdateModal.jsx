import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';
import { Download, RefreshCw, Rocket, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { WeeModalShell, WeeButton, WeeModalFieldCard } from '../../ui/wee';
import Text from '../../ui/Text';
import { useAppUpdater } from '../../hooks/useAppUpdater';
import { useWeeMotion, createWeeTransition } from '../../design/weeMotion';
import WeeUpdateProgress from './WeeUpdateProgress';

function statusLabel(status, installing) {
  if (installing) return 'Installing update…';
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
 * Unified Wee update modal — Download → gooey progress → Install (only when ready).
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
  const { reducedMotion } = useWeeMotion();

  const [appVersion, setAppVersion] = useState('');
  const [busyAction, setBusyAction] = useState(null); // 'download' | 'install' | null

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
    if (!isOpen) {
      setBusyAction(null);
      return;
    }
    const status = updateInfo?.status;
    if (!status || status === 'not-available' || status === 'idle' || status === 'error') {
      checkForUpdates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check on open
  }, [isOpen]);

  // Clear download busy once progress events take over or download finishes/errors.
  useEffect(() => {
    const status = updateInfo?.status;
    if (busyAction === 'download' && (status === 'downloading' || status === 'downloaded' || status === 'error')) {
      setBusyAction(null);
    }
  }, [updateInfo?.status, busyAction]);

  const status = updateInfo?.status || 'idle';
  const installing = busyAction === 'install';
  const downloading = status === 'downloading' || busyAction === 'download';
  const progress = typeof updateInfo?.progress === 'number' ? updateInfo.progress : downloading ? 0 : null;
  const notes = updateInfo?.releaseNotes || '';
  const canClose = !downloading && !installing;

  const handleClose = useCallback(() => {
    if (!canClose) return;
    onClose?.();
  }, [canClose, onClose]);

  const handleDownload = useCallback(async () => {
    setBusyAction('download');
    await downloadUpdate();
  }, [downloadUpdate]);

  const handleInstall = useCallback(async () => {
    setBusyAction('install');
    await installUpdate();
    // App typically quits; if install returns without quitting, clear busy.
    setBusyAction(null);
  }, [installUpdate]);

  const actionSpring = createWeeTransition('press', { reducedMotion });

  const footerContent = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <WeeButton
        type="button"
        variant="secondary"
        onClick={openGitHubReleases}
        disabled={downloading || installing}
      >
        GitHub releases
      </WeeButton>
      <div className="flex flex-wrap gap-2">
        {status === 'available' && !downloading ? (
          <WeeButton type="button" variant="secondary" onClick={dismissUpdateVersion}>
            Later
          </WeeButton>
        ) : null}
        {canClose && status !== 'available' ? (
          <WeeButton type="button" variant="secondary" onClick={handleClose}>
            Close
          </WeeButton>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          {status === 'available' && !downloading ? (
            <m.div
              key="download"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96, y: -4 }}
              transition={actionSpring}
            >
              <WeeButton
                type="button"
                variant="primary"
                onClick={handleDownload}
                disabled={busyAction === 'download'}
                className="inline-flex items-center gap-2"
              >
                {busyAction === 'download' ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                ) : (
                  <Download size={16} aria-hidden />
                )}
                {busyAction === 'download' ? 'Starting…' : 'Download update'}
              </WeeButton>
            </m.div>
          ) : null}

          {status === 'downloaded' && !installing ? (
            <m.div
              key="install"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={actionSpring}
            >
              <WeeButton
                type="button"
                variant="primary"
                onClick={handleInstall}
                className="inline-flex items-center gap-2"
              >
                <Rocket size={16} aria-hidden />
                Install & restart
              </WeeButton>
            </m.div>
          ) : null}

          {installing ? (
            <m.div
              key="installing"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={actionSpring}
            >
              <WeeButton type="button" variant="primary" disabled className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" aria-hidden />
                Restarting…
              </WeeButton>
            </m.div>
          ) : null}

          {(status === 'error' || status === 'not-available' || status === 'idle') && !downloading ? (
            <m.div
              key="check"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={actionSpring}
            >
              <WeeButton
                type="button"
                variant="primary"
                onClick={checkForUpdates}
                className="inline-flex items-center gap-2"
              >
                <RefreshCw size={16} aria-hidden />
                Check again
              </WeeButton>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <WeeModalShell
      isOpen={isOpen}
      onClose={status === 'available' && !downloading ? dismissUpdateVersion : handleClose}
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
            {status === 'downloaded' && !installing ? (
              <CheckCircle2 size={18} className="text-[hsl(var(--state-success))]" aria-hidden />
            ) : null}
            {status === 'not-available' ? (
              <CheckCircle2 size={18} className="text-[hsl(var(--state-success))]" aria-hidden />
            ) : null}
            {status === 'error' ? (
              <AlertCircle size={18} className="text-[hsl(var(--state-error))]" aria-hidden />
            ) : null}
            {(downloading || installing || status === 'checking') ? (
              <Loader2 size={18} className="animate-spin text-[hsl(var(--primary))]" aria-hidden />
            ) : null}
            <Text variant="h3" className="!m-0 playful-hero-text">
              {statusLabel(status, installing)}
            </Text>
          </div>

          {updateInfo?.version && status !== 'not-available' ? (
            <Text variant="body" className="!mt-0 text-[hsl(var(--text-secondary))]">
              Latest:{' '}
              <span className="font-semibold text-[hsl(var(--text-primary))]">{updateInfo.version}</span>
            </Text>
          ) : null}

          {status === 'checking' ? (
            <Text variant="body" className="text-[hsl(var(--text-secondary))]">
              Talking to GitHub Releases…
            </Text>
          ) : null}

          <AnimatePresence mode="wait" initial={false}>
            {downloading ? (
              <m.div
                key="progress"
                initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
                transition={createWeeTransition('tab', { reducedMotion })}
              >
                <WeeUpdateProgress
                  progress={progress ?? 0}
                  indeterminate={busyAction === 'download' && !(progress > 0)}
                  label="Downloading update"
                />
              </m.div>
            ) : null}

            {status === 'downloaded' && !installing ? (
              <m.div
                key="ready"
                initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={createWeeTransition('press', { reducedMotion })}
                className="mt-4 rounded-[var(--radius-pill)] border-4 border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.12)] px-5 py-4 shadow-[var(--wee-pill-shadow)]"
              >
                <Text variant="body" className="!m-0 font-semibold text-[hsl(var(--text-primary))]">
                  Download complete. Install restarts Wee onto {updateInfo?.version || 'the new version'}.
                </Text>
              </m.div>
            ) : null}

            {installing ? (
              <m.div
                key="installing-body"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <WeeUpdateProgress progress={100} label="Installing" indeterminate />
              </m.div>
            ) : null}
          </AnimatePresence>

          {status === 'error' ? (
            <div className="mt-2 rounded-[1.25rem] border border-[hsl(var(--state-error)/0.35)] bg-[hsl(var(--state-error)/0.08)] p-3">
              <Text variant="body" className="!m-0 text-[hsl(var(--state-error))]">
                {updateInfo?.error || 'Something went wrong while checking for updates.'}
              </Text>
            </div>
          ) : null}

          {notes && (status === 'available' || status === 'downloaded') && !downloading ? (
            <div className="mt-4 rounded-[1.25rem] border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-primary)/0.65)] p-4">
              <Text variant="caption" className="!mt-0 mb-2 uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
                Release notes
              </Text>
              <pre className="m-0 max-h-40 overflow-y-auto whitespace-pre-wrap font-[family-name:var(--font-ui)] text-sm leading-relaxed text-[hsl(var(--text-secondary))]">
                {notes}
              </pre>
            </div>
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
