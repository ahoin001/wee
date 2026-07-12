import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

const RELEASES_URL = 'https://github.com/ahoin001/wee/releases';

function normalizeReleaseNotes(notes) {
  if (!notes) return '';
  if (typeof notes === 'string') return notes;
  if (Array.isArray(notes)) {
    return notes
      .map((entry) => (typeof entry === 'string' ? entry : entry?.note || ''))
      .filter(Boolean)
      .join('\n\n');
  }
  return String(notes);
}

function applyUpdaterStatus(data) {
  if (!data || typeof data !== 'object') return;
  const store = useConsolidatedAppStore.getState();
  const prev = store.app.updateInfo || {};
  const status = data.status;
  const version = data.version || prev.version || '';
  const nextInfo = {
    ...prev,
    status,
    version,
    releaseDate: data.releaseDate !== undefined ? data.releaseDate : prev.releaseDate ?? null,
    releaseNotes: normalizeReleaseNotes(
      data.releaseNotes !== undefined ? data.releaseNotes : prev.releaseNotes
    ),
    progress: typeof data.progress === 'number' ? data.progress : prev.progress,
    error: data.error || (status === 'error' ? data.message : undefined),
    message: data.message,
  };

  if (status === 'available' || status === 'downloaded' || status === 'downloading') {
    store.actions.setAppState({ updateAvailable: true, updateInfo: nextInfo });
    return;
  }
  if (status === 'not-available' || status === 'no-update') {
    store.actions.setAppState({
      updateAvailable: false,
      updateInfo: { ...nextInfo, status: 'not-available', progress: undefined, error: undefined },
    });
    return;
  }
  if (status === 'checking') {
    store.actions.setAppState({
      updateInfo: { ...nextInfo, status: 'checking', error: undefined },
    });
    return;
  }
  if (status === 'error') {
    store.actions.setAppState({ updateInfo: nextInfo });
  }
}

let updaterListenersAttached = false;

/** Attach electron-updater listeners once for the whole renderer. */
export function ensureAppUpdaterListeners() {
  if (updaterListenersAttached || typeof window === 'undefined') return;
  const api = window.api;
  if (!api?.updater?.onUpdateStatus) return;

  updaterListenersAttached = true;

  const onStatus = (data) => applyUpdaterStatus(data);
  const onAvailable = (data) =>
    applyUpdaterStatus({
      status: 'available',
      version: data?.version,
      releaseDate: data?.releaseDate,
      releaseNotes: data?.releaseNotes,
    });
  const onNotAvailable = () => applyUpdaterStatus({ status: 'not-available' });

  api.updater.onUpdateStatus(onStatus);
  api.onUpdateNotificationAvailable?.(onAvailable);
  api.onUpdateNotificationNotAvailable?.(onNotAvailable);
}

/**
 * Shared updater API + store selectors.
 * Call from App once for startup popup; modal/settings can call again safely.
 */
export function useAppUpdater({ enableStartupPopup = false } = {}) {
  useEffect(() => {
    ensureAppUpdaterListeners();
  }, []);

  const {
    updateAvailable,
    updateInfo,
    showUpdateModal,
    updateDismissedVersion,
    startupHydrationCommitted,
    appReady,
    setUIState,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      updateAvailable: state.app.updateAvailable,
      updateInfo: state.app.updateInfo,
      showUpdateModal: state.ui.showUpdateModal,
      updateDismissedVersion: state.ui.updateDismissedVersion || '',
      startupHydrationCommitted: state.app.startupHydrationCommitted,
      appReady: state.app.appReady,
      setUIState: state.actions.setUIState,
    }))
  );

  const autoOpenedForVersionRef = useRef(null);

  // Startup popup: once per available version, unless dismissed.
  useEffect(() => {
    if (!enableStartupPopup) return;
    if (!startupHydrationCommitted || !appReady) return;
    if (!updateAvailable || !updateInfo?.version) return;
    if (updateInfo.status !== 'available' && updateInfo.status !== 'downloaded') return;
    if (updateInfo.version === updateDismissedVersion) return;
    if (autoOpenedForVersionRef.current === updateInfo.version) return;
    if (showUpdateModal) {
      autoOpenedForVersionRef.current = updateInfo.version;
      return;
    }
    autoOpenedForVersionRef.current = updateInfo.version;
    setUIState({ showUpdateModal: true });
  }, [
    enableStartupPopup,
    startupHydrationCommitted,
    appReady,
    updateAvailable,
    updateInfo?.version,
    updateInfo?.status,
    updateDismissedVersion,
    showUpdateModal,
    setUIState,
  ]);

  const openUpdateModal = useCallback(() => {
    setUIState({ showUpdateModal: true, showSettingsActionMenu: false });
  }, [setUIState]);

  const closeUpdateModal = useCallback(() => {
    setUIState({ showUpdateModal: false });
  }, [setUIState]);

  const dismissUpdateVersion = useCallback(() => {
    const version = useConsolidatedAppStore.getState().app.updateInfo?.version || '';
    setUIState({
      showUpdateModal: false,
      ...(version ? { updateDismissedVersion: version } : {}),
    });
  }, [setUIState]);

  const checkForUpdates = useCallback(async () => {
    applyUpdaterStatus({ status: 'checking' });
    try {
      const result = await window.api?.updater?.checkForUpdates?.();
      if (!result) {
        applyUpdaterStatus({ status: 'error', error: 'Updater API unavailable' });
        return result;
      }
      if (!result.success) {
        applyUpdaterStatus({
          status: 'error',
          error: result.error || 'Failed to check for updates',
        });
        return result;
      }
      if (result.status === 'available') {
        applyUpdaterStatus({
          status: 'available',
          version: result.version,
          releaseDate: result.releaseDate,
          releaseNotes: result.releaseNotes,
        });
      } else if (result.status === 'no-update' || result.status === 'not-available') {
        applyUpdaterStatus({ status: 'not-available', message: result.message });
      } else if (result.status === 'error') {
        applyUpdaterStatus({ status: 'error', error: result.error || result.message });
      }
      return result;
    } catch (error) {
      applyUpdaterStatus({ status: 'error', error: error?.message || 'Failed to check for updates' });
      return { success: false, error: error?.message };
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    const prevProgress = useConsolidatedAppStore.getState().app.updateInfo?.progress || 0;
    applyUpdaterStatus({ status: 'downloading', progress: prevProgress });
    try {
      const result = await window.api?.updater?.downloadUpdate?.();
      if (!result?.success) {
        applyUpdaterStatus({ status: 'error', error: result?.error || 'Download failed' });
      }
      return result;
    } catch (error) {
      applyUpdaterStatus({ status: 'error', error: error?.message || 'Download failed' });
      return { success: false, error: error?.message };
    }
  }, []);

  const installUpdate = useCallback(async () => {
    try {
      return await window.api?.updater?.installUpdate?.();
    } catch (error) {
      applyUpdaterStatus({ status: 'error', error: error?.message || 'Install failed' });
      return { success: false, error: error?.message };
    }
  }, []);

  const openGitHubReleases = useCallback(() => {
    if (window.api?.openExternal) {
      window.api.openExternal(RELEASES_URL);
      return;
    }
    window.open(RELEASES_URL, '_blank', 'noopener,noreferrer');
  }, []);

  return {
    updateAvailable,
    updateInfo,
    showUpdateModal,
    updateDismissedVersion,
    openUpdateModal,
    closeUpdateModal,
    dismissUpdateVersion,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    openGitHubReleases,
    releasesUrl: RELEASES_URL,
  };
}

export default useAppUpdater;
