/**
 * Windows SMTC (system media) main-process service.
 * Uses windows-media-sessions (stdio .NET bridge) — no native addons.
 * Soft-fails on non-Windows or missing package.
 *
 * Lifecycle rule (prevents toggle deadlock):
 * - `stop()` never awaits `startPromise` (that caused start↔stop circular waits).
 * - `start()` may await an in-flight `stopPromise` only *before* creating its own work.
 * - A monotonic `runId` invalidates in-flight starts when stop wins; start bails at checkpoints.
 * - After stop, a new `start()` waits for the dying start to finish, then opens a fresh bridge
 *   (never joins a cancelled startPromise as if it were a successful subscribe).
 *
 * First-snapshot wait uses a long timeout + one recreate retry — the bundled
 * .NET backend (~40MB) can take >5s on cold start / AV scan, and the package's
 * BackendProcess leaves `stopping=true` after stop so the same manager cannot
 * respawn (must createSessionManager again).
 */

const TIMELINE_COALESCE_MS = 400;
/** Default package wait is 5s; cold .NET spawn often needs longer. */
const FIRST_SNAPSHOT_TIMEOUT_MS = 20000;
/** Extra attempt after timeout with a fresh SessionManager. */
const FIRST_SNAPSHOT_RETRIES = 1;

function createSystemMediaService({ getMainWindow, execFile, platform }) {
  let unsubscribe = null;
  let started = false;
  /** Package loaded and usable on this machine (independent of subscription). */
  let available = false;
  let lastError = null;
  let lastSessions = [];
  let lastPushAt = 0;
  let lastFingerprint = '';
  /** @type {typeof import('windows-media-sessions') | null} */
  let mediaSessionsPkg = null;
  /** @type {import('windows-media-sessions').SessionManager | null} */
  let sessionManager = null;
  /** @type {Promise<void> | null} */
  let stopPromise = null;
  /** @type {Promise<object> | null} */
  let startPromise = null;
  /**
   * Bumped on every stop (and each new start attempt). In-flight start work
   * compares against its captured id and bails instead of resurrecting a
   * torn-down bridge — without awaiting stop (no deadlock).
   */
  let runId = 0;

  function isWindows() {
    return (platform || process.platform) === 'win32';
  }

  function loadPackage() {
    if (mediaSessionsPkg) return mediaSessionsPkg;
    if (!isWindows()) {
      available = false;
      lastError = 'System media is only available on Windows.';
      return null;
    }
    try {
      // Lazy require so non-Windows / missing package never crash main boot.
      mediaSessionsPkg = require('windows-media-sessions');
      available = true;
      lastError = null;
      return mediaSessionsPkg;
    } catch (err) {
      available = false;
      lastError = err?.message || 'windows-media-sessions unavailable';
      mediaSessionsPkg = null;
      return null;
    }
  }

  function getOrCreateManager() {
    if (sessionManager) return sessionManager;
    const pkg = loadPackage();
    if (!pkg?.createSessionManager) return null;
    sessionManager = pkg.createSessionManager();
    return sessionManager;
  }

  async function disposeManager() {
    if (typeof unsubscribe === 'function') {
      try {
        unsubscribe();
      } catch {
        /* ignore */
      }
      unsubscribe = null;
    }
    if (sessionManager) {
      try {
        await sessionManager.stop();
      } catch {
        /* ignore */
      }
      sessionManager = null;
    }
  }

  function sessionFingerprint(sessions) {
    return (sessions || [])
      .map((s) =>
        [
          s.id,
          s.playbackStatus,
          s.title,
          s.artist,
          s.timeline?.positionMs ?? '',
          s.timeline?.durationMs ?? '',
          s.thumbnail ? 'art' : '',
        ].join('|')
      )
      .join(';;');
  }

  function broadcast(sessions) {
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (!win || win.isDestroyed()) return;
    win.webContents.send('system-media:update', {
      available,
      error: lastError,
      started,
      sessions: sessions || [],
    });
  }

  function onSessions(sessions) {
    lastSessions = Array.isArray(sessions) ? sessions : [];
    // A live snapshot means the bridge is healthy — clear sticky start timeouts.
    lastError = null;
    available = true;
    const fp = sessionFingerprint(lastSessions);
    const now = Date.now();
    // Coalesce rapid timeline ticks so renderer store isn't hammered.
    if (fp === lastFingerprint) return;
    const onlyTimeline =
      lastFingerprint &&
      fp.replace(/\d+\|/g, '|') === lastFingerprint.replace(/\d+\|/g, '|');
    if (onlyTimeline && now - lastPushAt < TIMELINE_COALESCE_MS) return;
    lastFingerprint = fp;
    lastPushAt = now;
    broadcast(lastSessions);
  }

  function getStatus() {
    if (!started && isWindows() && !mediaSessionsPkg && !lastError) {
      // Probe without starting the subscription — tells settings UI if the bridge loads.
      loadPackage();
    }
    return {
      available,
      error: lastError,
      started,
      sessions: lastSessions,
      platform: platform || process.platform,
    };
  }

  function isCurrentRun(myRun) {
    return myRun === runId;
  }

  /**
   * Wait for the first backend snapshot, recreating the manager on timeout.
   * @param {number} myRun
   */
  async function awaitFirstSessions(myRun) {
    let lastErr = null;

    for (let attempt = 0; attempt <= FIRST_SNAPSHOT_RETRIES; attempt++) {
      if (!isCurrentRun(myRun)) {
        const cancelErr = new Error('System media start cancelled');
        cancelErr.code = 'cancelled';
        throw cancelErr;
      }
      if (attempt > 0) {
        await disposeManager();
        if (!isCurrentRun(myRun)) {
          const cancelErr = new Error('System media start cancelled');
          cancelErr.code = 'cancelled';
          throw cancelErr;
        }
      }

      const manager = getOrCreateManager();
      if (!manager) {
        throw new Error(lastError || 'windows-media-sessions unavailable');
      }

      if (typeof unsubscribe !== 'function') {
        unsubscribe = manager.onSessionsChanged(onSessions);
      }

      try {
        await manager.waitForReady(FIRST_SNAPSHOT_TIMEOUT_MS);
        if (!isCurrentRun(myRun)) {
          const cancelErr = new Error('System media start cancelled');
          cancelErr.code = 'cancelled';
          throw cancelErr;
        }
        const sessions = await manager.getAllSessions();
        if (!isCurrentRun(myRun)) {
          const cancelErr = new Error('System media start cancelled');
          cancelErr.code = 'cancelled';
          throw cancelErr;
        }
        return Array.isArray(sessions) ? sessions : [];
      } catch (err) {
        if (err?.code === 'cancelled' || !isCurrentRun(myRun)) {
          const cancelErr = new Error('System media start cancelled');
          cancelErr.code = 'cancelled';
          throw cancelErr;
        }
        lastErr = err;
      }
    }

    throw lastErr || new Error('Timed out waiting for first backend snapshot');
  }

  async function awaitSettled(promise) {
    if (!promise) return;
    try {
      await promise;
    } catch {
      /* ignore */
    }
  }

  /**
   * Start SMTC subscription.
   */
  async function start() {
    // Finish teardown before opening a new bridge (safe: stop does not await us).
    await awaitSettled(stopPromise);

    if (started && sessionManager) return getStatus();

    // Let a cancelled/dying start finish — do not treat it as a successful join.
    await awaitSettled(startPromise);
    await awaitSettled(stopPromise);

    if (started && sessionManager) return getStatus();

    // Another caller may have started between awaits.
    if (startPromise) {
      return startPromise;
    }

    const myRun = ++runId;

    const pending = (async () => {
      if (!isCurrentRun(myRun)) {
        return getStatus();
      }

      const pkg = loadPackage();
      if (!pkg) {
        started = false;
        broadcast([]);
        return getStatus();
      }

      try {
        const sessions = await awaitFirstSessions(myRun);
        if (!isCurrentRun(myRun)) {
          await disposeManager();
          return getStatus();
        }
        started = true;
        lastError = null;
        available = true;
        onSessions(sessions);
      } catch (err) {
        const cancelled = err?.code === 'cancelled' || !isCurrentRun(myRun);
        started = false;
        if (cancelled) {
          await disposeManager();
          return getStatus();
        }
        lastError = err?.message || String(err);
        // Package may still be loadable even if the first snapshot failed.
        available = Boolean(mediaSessionsPkg);
        await disposeManager();
        lastSessions = [];
        lastFingerprint = '';
        lastPushAt = 0;
        broadcast([]);
      }

      return getStatus();
    })();

    startPromise = pending;

    try {
      return await pending;
    } finally {
      if (startPromise === pending) {
        startPromise = null;
      }
    }
  }

  /**
   * Stop SMTC subscription.
   * Invalidates in-flight starts immediately (runId++) and disposes the manager.
   * Does **not** await startPromise — that was the toggle deadlock.
   */
  async function stop() {
    runId += 1;
    started = false;

    if (stopPromise) return stopPromise;

    stopPromise = (async () => {
      await disposeManager();
      lastSessions = [];
      lastFingerprint = '';
      lastPushAt = 0;
      // Keep `available` if the package loaded — settings can still say the PC supports SMTC.
      lastError = null;
      broadcast([]);
    })();

    try {
      await stopPromise;
    } finally {
      stopPromise = null;
    }
  }

  /**
   * Media-key transport (SMTC package is read-only). Targets Windows current session.
   * @param {'playPause' | 'next' | 'previous'} action
   */
  function sendMediaKey(action) {
    if (!isWindows()) {
      return Promise.resolve({ success: false, error: 'Not Windows' });
    }
    const vk =
      action === 'next' ? 0xb0 : action === 'previous' ? 0xb1 : 0xb3; // NEXT / PREV / PLAY_PAUSE
    const script = `
$code = @"
using System;
using System.Runtime.InteropServices;
public class K {
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}
"@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
[K]::keybd_event(${vk}, 0, 0, [UIntPtr]::Zero)
[K]::keybd_event(${vk}, 0, 2, [UIntPtr]::Zero)
`;
    const run = execFile || require('child_process').execFile;
    return new Promise((resolve) => {
      run(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', script],
        { windowsHide: true, timeout: 4000 },
        (err) => {
          if (err) {
            resolve({ success: false, error: err.message });
            return;
          }
          resolve({ success: true });
        }
      );
    });
  }

  return {
    start,
    stop,
    getStatus,
    sendMediaKey,
    isWindows,
  };
}

module.exports = {
  createSystemMediaService,
};
