/**
 * Windows SMTC (system media) main-process service.
 * Uses windows-media-sessions (stdio .NET bridge) — no native addons.
 * Soft-fails on non-Windows or missing package.
 *
 * Lifecycle rules:
 * - `stop()` never awaits `startPromise` (avoids start↔stop deadlock).
 * - `start()` may await an in-flight `stopPromise` only *before* creating work.
 * - A monotonic `runId` invalidates in-flight work when stop wins.
 * - IPC `start` returns as soon as the bridge is subscribed — first snapshot is
 *   pumped in the background (never block the renderer on .NET cold start).
 * - Session DTOs sent over IPC strip/limit thumbnails so huge album art cannot
 *   stall Electron structured-clone.
 */

const fs = require('fs');
const path = require('path');

const TIMELINE_COALESCE_MS = 400;
/** Cold .NET spawn / AV scan can take a while; this only gates the background pump. */
const FIRST_SNAPSHOT_TIMEOUT_MS = 20000;
/** Extra attempt after timeout with a fresh SessionManager. */
const FIRST_SNAPSHOT_RETRIES = 1;
/** After JPEG compress, keep a hard ceiling so IPC never freezes. */
const MAX_THUMBNAIL_CHARS = 220000;
/** Longest edge for SMTC album art sent to the renderer. */
const THUMB_MAX_EDGE = 320;
/** JPEG quality for SMTC thumbnails (Apple Music raw data URLs are often 250–400KB). */
const THUMB_JPEG_QUALITY = 78;

function createSystemMediaService({ getMainWindow, execFile, platform, resourcesPath }) {
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
  /** @type {((err: Error) => void) | null} */
  let onManagerError = null;
  /** @type {((err: Error) => void) | null} */
  let onManagerDiagnostic = null;
  /** Recent bridge diagnostics (thumbnail read failures, etc.). */
  let lastDiagnostics = [];
  /** Per-session art compress outcomes from the last sanitize pass. */
  let lastArtCompress = [];
  /**
   * Bumped on every stop (and each new start attempt). In-flight start work
   * compares against its captured id and bails instead of resurrecting a
   * torn-down bridge — without awaiting stop (no deadlock).
   */
  let runId = 0;

  function isWindows() {
    return (platform || process.platform) === 'win32';
  }

  /**
   * Packaged Electron cannot spawn .exe from inside asar. Prefer extraResources
   * / asar.unpacked copies, then the normal node_modules path (dev).
   */
  function resolveBackendExe() {
    const res =
      resourcesPath ||
      process.resourcesPath ||
      (typeof process.env.PORTABLE_EXECUTABLE_DIR === 'string'
        ? process.env.PORTABLE_EXECUTABLE_DIR
        : '');
    const candidates = [];
    if (res) {
      candidates.push(path.join(res, 'windows-media-sessions-backend.exe'));
      candidates.push(
        path.join(
          res,
          'app.asar.unpacked',
          'node_modules',
          'windows-media-sessions',
          'bin',
          'win-x64',
          'windows-media-sessions-backend.exe'
        )
      );
    }
    try {
      const pkgRoot = path.dirname(require.resolve('windows-media-sessions/package.json'));
      candidates.push(
        path.join(pkgRoot, 'bin', 'win-x64', 'windows-media-sessions-backend.exe')
      );
    } catch {
      /* package missing */
    }
    if (process.env.WINDOWS_MEDIA_SESSIONS_BACKEND) {
      candidates.unshift(path.resolve(process.env.WINDOWS_MEDIA_SESSIONS_BACKEND));
    }
    for (const candidate of candidates) {
      try {
        if (candidate && fs.existsSync(candidate)) return candidate;
      } catch {
        /* ignore */
      }
    }
    return undefined;
  }

  function loadPackage() {
    if (mediaSessionsPkg) return mediaSessionsPkg;
    if (!isWindows()) {
      available = false;
      lastError = 'System media is only available on Windows.';
      return null;
    }
    try {
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

  function pushDiagnostic(message) {
    const text = String(message || '').trim();
    if (!text) return;
    const entry = { at: new Date().toISOString(), message: text.slice(0, 280) };
    lastDiagnostics = [entry, ...lastDiagnostics].slice(0, 8);
    console.warn('[SystemMedia] diagnostic:', text);
  }

  function buildArtDebug() {
    return {
      backendPath: resolveBackendExe() || null,
      diagnostics: lastDiagnostics.slice(),
      lastCompress: lastArtCompress.slice(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Sniff image MIME from base64 magic bytes (Apple Music often ships PNG as bare b64).
   * @param {string} b64
   * @returns {string}
   */
  function sniffImageMimeFromBase64(b64) {
    try {
      const buf = Buffer.from(String(b64).slice(0, 64), 'base64');
      if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
        return 'image/jpeg';
      }
      if (
        buf.length >= 8 &&
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47
      ) {
        return 'image/png';
      }
      if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
        return 'image/gif';
      }
      if (
        buf.length >= 12 &&
        buf[0] === 0x52 &&
        buf[1] === 0x49 &&
        buf[2] === 0x46 &&
        buf[3] === 0x46 &&
        buf[8] === 0x57 &&
        buf[9] === 0x45 &&
        buf[10] === 0x42 &&
        buf[11] === 0x50
      ) {
        return 'image/webp';
      }
      if (buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d) {
        return 'image/bmp';
      }
    } catch {
      /* ignore */
    }
    // Prefer PNG over JPEG for unknown Apple Music payloads.
    return 'image/png';
  }

  function getOrCreateManager() {
    if (sessionManager) return sessionManager;
    const pkg = loadPackage();
    if (!pkg?.createSessionManager) return null;
    const backendPath = resolveBackendExe();
    sessionManager = backendPath
      ? pkg.createSessionManager({ backendPath })
      : pkg.createSessionManager();
    onManagerError = (err) => {
      lastError = err?.message || String(err);
      pushDiagnostic(`error: ${lastError}`);
      // Keep available if the package loaded; surface the error to the renderer.
      broadcast(lastSessions);
    };
    onManagerDiagnostic = (err) => {
      pushDiagnostic(err?.message || String(err));
      broadcast(lastSessions);
    };
    try {
      sessionManager.on('error', onManagerError);
    } catch {
      /* ignore */
    }
    try {
      sessionManager.on('diagnostic', onManagerDiagnostic);
    } catch {
      /* older package versions lack diagnostic */
    }
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
      if (onManagerError) {
        try {
          sessionManager.off?.('error', onManagerError);
        } catch {
          /* ignore */
        }
        onManagerError = null;
      }
      if (onManagerDiagnostic) {
        try {
          sessionManager.off?.('diagnostic', onManagerDiagnostic);
        } catch {
          /* ignore */
        }
        onManagerDiagnostic = null;
      }
      try {
        await sessionManager.stop();
      } catch {
        /* ignore */
      }
      // BackendProcess.stopping stays true forever after stop — never reuse.
      sessionManager = null;
    }
  }

  /**
   * Downscale + JPEG-encode SMTC album art (Apple Music often ships huge PNGs).
   * Progressive shrink until under the IPC ceiling; never silently drop art that
   * can still be shown at a smaller size.
   * @param {string} dataUrl
   * @returns {{ out: string, status: string, reason: string, rawMime: string, rawChars: number, outChars: number }}
   */
  function compressThumbnailDataUrl(dataUrl) {
    const empty = (status, reason, extra = {}) => ({
      out: '',
      status,
      reason,
      rawMime: extra.rawMime || '',
      rawChars: extra.rawChars || 0,
      outChars: 0,
    });

    if (!dataUrl || typeof dataUrl !== 'string') {
      return empty('absent', 'no-thumbnail');
    }
    let raw = dataUrl.trim();
    if (!raw) return empty('absent', 'empty-thumbnail');

    let rawMime = '';
    // Some bridges emit bare base64 — sniff magic bytes (do not assume JPEG).
    if (!raw.startsWith('data:')) {
      const compact = raw.replace(/\s/g, '');
      if (compact.length > 32 && /^[A-Za-z0-9+/=]+$/.test(compact.slice(0, 80))) {
        rawMime = sniffImageMimeFromBase64(compact);
        raw = `data:${rawMime};base64,${compact}`;
      } else {
        return empty('dropped', 'not-data-url-or-base64', { rawChars: raw.length });
      }
    } else {
      const mimeMatch = raw.match(/^data:(image\/[a-z0-9.+-]+);base64,/i);
      rawMime = mimeMatch ? mimeMatch[1].toLowerCase() : 'unknown';
    }

    const rawChars = raw.length;

    // Already a compact JPEG/WebP — pass through.
    if (
      rawChars <= MAX_THUMBNAIL_CHARS &&
      /^data:image\/(jpeg|jpg|webp)/i.test(raw)
    ) {
      return {
        out: raw,
        status: 'passthrough',
        reason: 'already-compact',
        rawMime,
        rawChars,
        outChars: rawChars,
      };
    }

    // Compact non-JPEG under ceiling — keep original (PNG etc.) for fidelity.
    if (rawChars <= MAX_THUMBNAIL_CHARS && /^data:image\//i.test(raw)) {
      return {
        out: raw,
        status: 'passthrough',
        reason: 'under-ceiling',
        rawMime,
        rawChars,
        outChars: rawChars,
      };
    }

    try {
      // Lazy require — keeps this service testable under plain Node.
      // eslint-disable-next-line global-require
      const { nativeImage } = require('electron');
      if (!nativeImage?.createFromDataURL) {
        if (rawChars <= MAX_THUMBNAIL_CHARS) {
          return {
            out: raw,
            status: 'passthrough',
            reason: 'no-nativeImage',
            rawMime,
            rawChars,
            outChars: rawChars,
          };
        }
        return empty('dropped', 'no-nativeImage-over-ceiling', { rawMime, rawChars });
      }

      const b64 = raw.replace(/^data:image\/[^;]+;base64,/i, '');
      let image = null;

      // Prefer buffer decode first — more reliable when MIME was guessed wrong.
      try {
        image = nativeImage.createFromBuffer(Buffer.from(b64, 'base64'));
      } catch {
        image = null;
      }
      if (!image || image.isEmpty()) {
        try {
          image = nativeImage.createFromDataURL(raw);
        } catch {
          image = null;
        }
      }
      if (!image || image.isEmpty()) {
        if (rawChars <= MAX_THUMBNAIL_CHARS) {
          return {
            out: raw,
            status: 'passthrough',
            reason: 'decode-failed-raw-kept',
            rawMime,
            rawChars,
            outChars: rawChars,
          };
        }
        return empty('dropped', 'decode-failed', { rawMime, rawChars });
      }

      const { width, height } = image.getSize();
      if (!width || !height) {
        if (rawChars <= MAX_THUMBNAIL_CHARS) {
          return {
            out: raw,
            status: 'passthrough',
            reason: 'zero-size-raw-kept',
            rawMime,
            rawChars,
            outChars: rawChars,
          };
        }
        return empty('dropped', 'zero-size', { rawMime, rawChars });
      }

      const edges = [THUMB_MAX_EDGE, 240, 160, 96, 64];
      const qualities = [THUMB_JPEG_QUALITY, 62, 48, 36];
      for (const edge of edges) {
        let working = image;
        if (width > edge || height > edge) {
          const scale = Math.min(edge / width, edge / height);
          working = image.resize({
            width: Math.max(1, Math.round(width * scale)),
            height: Math.max(1, Math.round(height * scale)),
            quality: 'better',
          });
        }
        for (const quality of qualities) {
          const jpeg = working.toJPEG(quality);
          if (!jpeg || !jpeg.length) continue;
          const out = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
          if (out.length <= MAX_THUMBNAIL_CHARS) {
            return {
              out,
              status: 'compressed',
              reason: `jpeg-${edge}px-q${quality}`,
              rawMime,
              rawChars,
              outChars: out.length,
            };
          }
        }
      }

      // Last resort: keep raw only if it fits IPC ceiling.
      if (rawChars <= MAX_THUMBNAIL_CHARS) {
        return {
          out: raw,
          status: 'passthrough',
          reason: 'compress-too-large-raw-kept',
          rawMime,
          rawChars,
          outChars: rawChars,
        };
      }
      return empty('dropped', 'over-ceiling-after-compress', { rawMime, rawChars });
    } catch (err) {
      console.warn('[SystemMedia] thumbnail compress failed', err?.message || err);
      pushDiagnostic(`compress failed: ${err?.message || err}`);
      if (rawChars <= MAX_THUMBNAIL_CHARS) {
        return {
          out: raw,
          status: 'passthrough',
          reason: 'compress-exception-raw-kept',
          rawMime,
          rawChars,
          outChars: rawChars,
        };
      }
      return empty('dropped', `compress-exception:${err?.message || err}`, {
        rawMime,
        rawChars,
      });
    }
  }

  /**
   * Limit IPC payload size. Compress art for playing sessions (and a small art
   * fallback set) so Apple Music / Spotify Desktop covers reach the tile.
   */
  function sanitizeSessionForIpc(session, includeThumbnail) {
    if (!session || typeof session !== 'object') return null;
    const rawThumb =
      includeThumbnail && typeof session.thumbnail === 'string' ? session.thumbnail : '';
    const compressResult = rawThumb
      ? compressThumbnailDataUrl(rawThumb)
      : {
          out: '',
          status: includeThumbnail ? 'absent' : 'skipped',
          reason: includeThumbnail ? 'empty-thumbnail' : 'not-selected-for-art',
          rawMime: '',
          rawChars: 0,
          outChars: 0,
        };
    const thumbnail = compressResult.out || '';
    return {
      dto: {
        id: session.id,
        sourceAppUserModelId: session.sourceAppUserModelId || '',
        sourceAppDisplayName: session.sourceAppDisplayName || '',
        title: session.title || '',
        artist: session.artist || '',
        albumTitle: session.albumTitle || '',
        playbackStatus: session.playbackStatus,
        timeline: session.timeline
          ? {
              positionMs: session.timeline.positionMs,
              durationMs: session.timeline.durationMs,
            }
          : undefined,
        controls: session.controls
          ? {
              canPlay: Boolean(session.controls.canPlay),
              canPause: Boolean(session.controls.canPause),
              canSkipNext: Boolean(session.controls.canSkipNext),
              canSkipPrevious: Boolean(session.controls.canSkipPrevious),
            }
          : undefined,
        thumbnail,
      },
      artNote: {
        id: session.id || '',
        app:
          session.sourceAppDisplayName ||
          session.sourceAppUserModelId ||
          'Unknown',
        title: session.title || '',
        playbackStatus: session.playbackStatus || '',
        includeThumbnail: Boolean(includeThumbnail),
        hasOut: Boolean(thumbnail),
        status: compressResult.status,
        reason: compressResult.reason,
        rawMime: compressResult.rawMime,
        rawChars: compressResult.rawChars,
        outChars: compressResult.outChars,
      },
    };
  }

  function sanitizeSessionsForIpc(sessions) {
    const list = Array.isArray(sessions) ? sessions : [];
    const statusOf = (s) => String(s?.playbackStatus || '').toLowerCase();
    const playing = list.filter(
      (s) => statusOf(s) === 'playing' || statusOf(s) === 'changing'
    );
    // Prefer playing; else any session that already has art; else first few.
    // Include up to 3 art targets — Apple Music art often arrives one tick late.
    const withArt = list.filter((s) => typeof s?.thumbnail === 'string' && s.thumbnail);
    const thumbTargets = [];
    const seen = new Set();
    const pushTarget = (s) => {
      if (!s?.id || seen.has(s.id)) return;
      seen.add(s.id);
      thumbTargets.push(s);
    };
    playing.forEach(pushTarget);
    withArt.forEach(pushTarget);
    list.slice(0, 2).forEach(pushTarget);
    const thumbIds = new Set(thumbTargets.slice(0, 3).map((s) => s?.id).filter(Boolean));

    const artNotes = [];
    const sanitized = list
      .map((s) => {
        const packed = sanitizeSessionForIpc(s, thumbIds.has(s?.id));
        if (!packed) return null;
        artNotes.push(packed.artNote);
        return packed.dto;
      })
      .filter(Boolean);

    lastArtCompress = artNotes;
    return sanitized;
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
          // Include a short digest so art arriving after metadata still pushes.
          typeof s.thumbnail === 'string' && s.thumbnail
            ? `art:${s.thumbnail.length}:${s.thumbnail.slice(-24)}`
            : '',
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
      artDebug: buildArtDebug(),
    });
  }

  function onSessions(sessions) {
    lastSessions = sanitizeSessionsForIpc(sessions);
    lastError = null;
    available = true;
    const fp = sessionFingerprint(lastSessions);
    const now = Date.now();
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
      loadPackage();
    }
    return {
      available,
      error: lastError,
      started,
      sessions: lastSessions,
      platform: platform || process.platform,
      backendPath: resolveBackendExe() || null,
      artDebug: buildArtDebug(),
    };
  }

  function isCurrentRun(myRun) {
    return myRun === runId;
  }

  /**
   * Background: wait for first snapshot (with one recreate retry).
   * Does not gate the IPC start response.
   * @param {number} myRun
   */
  async function pumpFirstSnapshot(myRun) {
    let lastErr = null;

    for (let attempt = 0; attempt <= FIRST_SNAPSHOT_RETRIES; attempt++) {
      if (!isCurrentRun(myRun)) return;
      if (attempt > 0) {
        await disposeManager();
        if (!isCurrentRun(myRun)) return;
      }

      const manager = getOrCreateManager();
      if (!manager) {
        lastErr = new Error(lastError || 'windows-media-sessions unavailable');
        break;
      }

      if (typeof unsubscribe !== 'function') {
        unsubscribe = manager.onSessionsChanged(onSessions);
      }

      try {
        await manager.waitForReady(FIRST_SNAPSHOT_TIMEOUT_MS);
        if (!isCurrentRun(myRun)) return;
        const sessions = await manager.getAllSessions();
        if (!isCurrentRun(myRun)) return;
        started = true;
        available = true;
        lastError = null;
        onSessions(sessions);
        return;
      } catch (err) {
        if (!isCurrentRun(myRun)) return;
        lastErr = err;
      }
    }

    if (!isCurrentRun(myRun)) return;
    started = false;
    lastError = lastErr?.message || 'Timed out waiting for first backend snapshot';
    available = Boolean(mediaSessionsPkg);
    await disposeManager();
    lastSessions = [];
    lastFingerprint = '';
    lastPushAt = 0;
    broadcast([]);
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
   * Returns quickly once the manager is created and the change listener is attached.
   * First snapshot is fetched in the background so the renderer never sits on "Starting…".
   */
  async function start() {
    await awaitSettled(stopPromise);

    if (started && sessionManager) return getStatus();

    await awaitSettled(startPromise);
    await awaitSettled(stopPromise);

    if (started && sessionManager) return getStatus();

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

      const backendPath = resolveBackendExe();
      if (!backendPath) {
        started = false;
        available = Boolean(mediaSessionsPkg);
        lastError =
          'SMTC backend executable not found. Reinstall the app or set WINDOWS_MEDIA_SESSIONS_BACKEND.';
        broadcast([]);
        return getStatus();
      }

      try {
        const manager = getOrCreateManager();
        if (!manager) {
          started = false;
          broadcast([]);
          return getStatus();
        }

        if (typeof unsubscribe !== 'function') {
          unsubscribe = manager.onSessionsChanged(onSessions);
        }

        // Mark subscribed immediately — UI leaves "Starting…" as soon as IPC returns.
        started = true;
        available = true;
        lastError = null;
        broadcast(lastSessions);

        void pumpFirstSnapshot(myRun);

        return getStatus();
      } catch (err) {
        if (!isCurrentRun(myRun)) {
          return getStatus();
        }
        started = false;
        lastError = err?.message || String(err);
        available = Boolean(mediaSessionsPkg);
        await disposeManager();
        lastSessions = [];
        lastFingerprint = '';
        lastPushAt = 0;
        broadcast([]);
        return getStatus();
      }
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
      lastError = null;
      lastArtCompress = [];
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
    resolveBackendExe,
  };
}

module.exports = {
  createSystemMediaService,
};
