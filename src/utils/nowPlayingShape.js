/**
 * Normalized Now Playing projection from Windows SMTC.
 *
 * Desktop players and browsers share this system-media contract so playback
 * controls stay player-agnostic.
 */

export const NOW_PLAYING_SOURCES = Object.freeze(['system']);

export const EMPTY_NOW_PLAYING = Object.freeze({
  source: null,
  trackName: '',
  artistLine: '',
  albumArtUrl: '',
  isPlaying: false,
  progressMs: 0,
  durationMs: 0,
  canPlay: false,
  canPause: false,
  canSkipNext: false,
  canSkipPrevious: false,
  appName: '',
  /** 'system-keys' | null — how shared Now Playing should route transport */
  controlsVia: null,
  sourceAppUserModelId: '',
  updatedAt: 0,
});

/**
 * @param {unknown} partial
 */
export function normalizeNowPlaying(partial) {
  if (!partial || typeof partial !== 'object') {
    return { ...EMPTY_NOW_PLAYING };
  }
  const source = partial.source === 'system' ? partial.source : null;
  const controlsVia = partial.controlsVia === 'system-keys' ? partial.controlsVia : null;
  return {
    source,
    trackName: typeof partial.trackName === 'string' ? partial.trackName : '',
    artistLine: typeof partial.artistLine === 'string' ? partial.artistLine : '',
    albumArtUrl: typeof partial.albumArtUrl === 'string' ? partial.albumArtUrl : '',
    isPlaying: Boolean(partial.isPlaying),
    progressMs: Math.max(0, Number(partial.progressMs) || 0),
    durationMs: Math.max(0, Number(partial.durationMs) || 0),
    canPlay: Boolean(partial.canPlay),
    canPause: Boolean(partial.canPause),
    canSkipNext: Boolean(partial.canSkipNext),
    canSkipPrevious: Boolean(partial.canSkipPrevious),
    appName: typeof partial.appName === 'string' ? partial.appName : '',
    controlsVia,
    sourceAppUserModelId:
      typeof partial.sourceAppUserModelId === 'string' ? partial.sourceAppUserModelId : '',
    updatedAt: Math.max(0, Number(partial.updatedAt) || 0),
  };
}

/**
 * Map a windows-media-sessions MediaSession (or IPC DTO) into nowPlaying.
 * @param {object | null | undefined} session
 */
export function nowPlayingFromSystemSession(session) {
  if (!session || typeof session !== 'object') {
    return normalizeNowPlaying({
      source: 'system',
      controlsVia: 'system-keys',
      updatedAt: Date.now(),
    });
  }
  const status = String(session.playbackStatus || '').toLowerCase();
  // Some players linger on "changing" while audible; treat as playing for display.
  const isPlaying = status === 'playing' || status === 'changing';
  const controls = session.controls || {};
  const title = typeof session.title === 'string' ? session.title.trim() : '';
  const artist = typeof session.artist === 'string' ? session.artist.trim() : '';
  const album = typeof session.albumTitle === 'string' ? session.albumTitle.trim() : '';
  const appName =
    session.sourceAppDisplayName ||
    session.sourceAppUserModelId ||
    'System';
  return normalizeNowPlaying({
    source: 'system',
    // Prefer real title; fall back so Free/desktop users still see *something*.
    trackName: title || artist || album || appName || 'Now Playing',
    artistLine: artist && title ? artist : artist || album || '',
    albumArtUrl: session.thumbnail || '',
    isPlaying,
    progressMs: session.timeline?.positionMs || 0,
    durationMs: session.timeline?.durationMs || 0,
    canPlay: Boolean(controls.canPlay) || !isPlaying,
    canPause: Boolean(controls.canPause) || isPlaying,
    canSkipNext: Boolean(controls.canSkipNext),
    canSkipPrevious: Boolean(controls.canSkipPrevious),
    appName,
    controlsVia: 'system-keys',
    sourceAppUserModelId: session.sourceAppUserModelId || '',
    updatedAt: Date.now(),
  });
}

function sessionHasMeta(session) {
  if (!session || typeof session !== 'object') return false;
  return Boolean(
    session.title ||
      session.artist ||
      session.albumTitle ||
      session.thumbnail ||
      session.sourceAppDisplayName ||
      session.sourceAppUserModelId
  );
}

/**
 * Resolve shared Now Playing from the active system-media session.
 * @param {{
 *   systemEnabled?: boolean,
 *   systemCandidate?: object,
 * }} opts
 */
export function resolveNowPlaying(opts = {}) {
  const systemEnabled = opts.systemEnabled !== false;
  if (!systemEnabled || !opts.systemCandidate) return { ...EMPTY_NOW_PLAYING };
  return normalizeNowPlaying(opts.systemCandidate);
}

/**
 * @param {object} session
 * @param {string} listenApp — '' | 'any' | substring of AUMID / display name
 */
export function sessionMatchesListenApp(session, listenApp) {
  const needle = String(listenApp || '').trim().toLowerCase();
  if (!needle || needle === 'any') return true;
  if (!session || typeof session !== 'object') return false;
  const blob = `${session.sourceAppUserModelId || ''} ${session.sourceAppDisplayName || ''}`.toLowerCase();
  return blob.includes(needle);
}

/**
 * Pick the “best” SMTC session from a snapshot list.
 * Prefer playing with metadata, else paused/opened with metadata, else first session.
 * @param {Array<object>} sessions
 * @param {{ listenApp?: string }} [opts]
 */
export function pickPrimarySystemSession(sessions, opts = {}) {
  const list = Array.isArray(sessions) ? sessions : [];
  const filtered = list.filter((s) => sessionMatchesListenApp(s, opts.listenApp));

  const statusOf = (s) => String(s?.playbackStatus || '').toLowerCase();

  const playing = filtered.filter(
    (s) =>
      (statusOf(s) === 'playing' || statusOf(s) === 'changing') && sessionHasMeta(s)
  );
  if (playing.length) return playing[0];

  const paused = filtered.filter(
    (s) =>
      (statusOf(s) === 'paused' || statusOf(s) === 'opened' || statusOf(s) === 'stopped') &&
      sessionHasMeta(s)
  );
  if (paused.length) return paused[0];

  // Last resort: any session for this filter (helps apps that omit metadata briefly).
  return filtered.find((s) => sessionHasMeta(s)) || filtered[0] || null;
}

/**
 * Stable label for app filter chips.
 * @param {object} session
 */
export function systemSessionAppLabel(session) {
  if (!session || typeof session !== 'object') return 'Unknown';
  return (
    session.sourceAppDisplayName ||
    (typeof session.sourceAppUserModelId === 'string'
      ? session.sourceAppUserModelId.split('!').pop() || session.sourceAppUserModelId
      : 'App')
  );
}

/**
 * @param {object} session
 */
export function systemSessionAppFilterValue(session) {
  if (!session || typeof session !== 'object') return '';
  const display = String(session.sourceAppDisplayName || '').trim();
  if (display) return display.toLowerCase();
  const aumid = String(session.sourceAppUserModelId || '').trim();
  return aumid.toLowerCase();
}
