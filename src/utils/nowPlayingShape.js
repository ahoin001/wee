/**
 * Normalized now-playing projection — shared by Spotify Web API + Windows SMTC.
 *
 * Display policy (free-first):
 * - Prefer Windows system media (desktop Spotify, Apple Music, browsers, …) for what you see.
 * - Use Spotify Web API mainly for Premium transport controls when the playing app is Spotify.
 */

export const NOW_PLAYING_SOURCES = Object.freeze(['spotify', 'system']);

export const NOW_PLAYING_SOURCE_PREFERENCES = Object.freeze(['auto', 'spotify', 'system']);

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
  /** 'spotify-api' | 'system-keys' | null — how the tile/widget should route transport */
  controlsVia: null,
  sourceAppUserModelId: '',
  updatedAt: 0,
});

/**
 * @param {unknown} value
 * @returns {'auto' | 'spotify' | 'system'}
 */
export function normalizeNowPlayingSourcePreference(value) {
  if (value === 'spotify' || value === 'system') return value;
  return 'auto';
}

/**
 * @param {unknown} partial
 */
export function normalizeNowPlaying(partial) {
  if (!partial || typeof partial !== 'object') {
    return { ...EMPTY_NOW_PLAYING };
  }
  const source =
    partial.source === 'spotify' || partial.source === 'system' ? partial.source : null;
  const controlsVia =
    partial.controlsVia === 'spotify-api' || partial.controlsVia === 'system-keys'
      ? partial.controlsVia
      : null;
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
 * @param {string} [appName]
 * @param {string} [aumid]
 */
export function isSpotifySystemApp(appName = '', aumid = '') {
  const blob = `${appName} ${aumid}`.toLowerCase();
  return blob.includes('spotify');
}

/**
 * @param {object} spotify — store.spotify slice
 */
export function nowPlayingFromSpotify(spotify) {
  const track = spotify?.currentTrack;
  if (!track) {
    return normalizeNowPlaying({
      source: 'spotify',
      isPlaying: false,
      appName: 'Spotify',
      controlsVia: 'spotify-api',
      updatedAt: Date.now(),
    });
  }
  const artists = Array.isArray(track.artists)
    ? track.artists.map((a) => a?.name).filter(Boolean).join(', ')
    : '';
  const art =
    (Array.isArray(track.album?.images) && track.album.images[0]?.url) ||
    track.albumArtUrl ||
    '';
  const isPlaying = Boolean(spotify.isPlaying);
  return normalizeNowPlaying({
    source: 'spotify',
    trackName: track.name || '',
    artistLine: artists,
    albumArtUrl: art,
    isPlaying,
    progressMs: spotify.progress || 0,
    durationMs: spotify.duration || 0,
    canPlay: true,
    canPause: true,
    canSkipNext: true,
    canSkipPrevious: true,
    appName: 'Spotify',
    controlsVia: 'spotify-api',
    updatedAt: Date.now(),
  });
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

function hasTrack(np) {
  return Boolean(np?.trackName || np?.albumArtUrl || np?.artistLine);
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
 * Merge Premium Spotify Web API transport onto an SMTC Spotify display row.
 * @param {ReturnType<typeof normalizeNowPlaying>} systemNp
 * @param {ReturnType<typeof normalizeNowPlaying> | null} spotifyApi
 * @param {boolean} spotifyPremium
 */
function enrichSystemWithPremiumSpotifyControls(systemNp, spotifyApi, spotifyPremium) {
  if (!spotifyPremium || !systemNp) return systemNp;
  if (!isSpotifySystemApp(systemNp.appName, systemNp.sourceAppUserModelId)) {
    return systemNp;
  }
  return normalizeNowPlaying({
    ...systemNp,
    // Keep SMTC as the display source; route controls through Web API when Premium.
    controlsVia: 'spotify-api',
    canPlay: true,
    canPause: true,
    canSkipNext: true,
    canSkipPrevious: true,
    albumArtUrl: systemNp.albumArtUrl || spotifyApi?.albumArtUrl || '',
    // Prefer live Web API progress when both refer to Spotify.
    progressMs: spotifyApi?.progressMs || systemNp.progressMs,
    durationMs: spotifyApi?.durationMs || systemNp.durationMs,
    isPlaying:
      spotifyApi && hasTrack(spotifyApi) ? Boolean(spotifyApi.isPlaying) : systemNp.isPlaying,
  });
}

/**
 * Pick the active projection — SMTC-first for free desktop players.
 * @param {{
 *   preference?: string,
 *   systemEnabled?: boolean,
 *   spotifyConnected?: boolean,
 *   spotifyPremium?: boolean,
 *   spotifyCandidate?: object,
 *   systemCandidate?: object,
 * }} opts
 */
export function resolveNowPlaying(opts = {}) {
  const preference = normalizeNowPlayingSourcePreference(opts.preference);
  const systemEnabled = opts.systemEnabled !== false;
  const spotifyConnected = Boolean(opts.spotifyConnected);
  const spotifyPremium = Boolean(opts.spotifyPremium);

  const spotifyApi =
    spotifyConnected && (hasTrack(opts.spotifyCandidate) || opts.spotifyCandidate?.isPlaying)
      ? normalizeNowPlaying(opts.spotifyCandidate)
      : null;

  let system =
    systemEnabled &&
    (hasTrack(opts.systemCandidate) || opts.systemCandidate?.isPlaying)
      ? normalizeNowPlaying(opts.systemCandidate)
      : null;

  if (system) {
    system = enrichSystemWithPremiumSpotifyControls(system, spotifyApi, spotifyPremium);
  }

  if (preference === 'system') {
    return system || { ...EMPTY_NOW_PLAYING };
  }

  if (preference === 'spotify') {
    // Premium Web API when it has a track; otherwise desktop Spotify via SMTC.
    if (spotifyPremium && spotifyApi && hasTrack(spotifyApi)) {
      return spotifyApi;
    }
    if (system && isSpotifySystemApp(system.appName, system.sourceAppUserModelId)) {
      return system;
    }
    if (spotifyApi && hasTrack(spotifyApi)) return spotifyApi;
    return { ...EMPTY_NOW_PLAYING };
  }

  // auto — desktop SMTC first (Apple Music, Spotify Desktop, browsers, …)
  if (system && (system.isPlaying || hasTrack(system))) {
    return system;
  }
  if (spotifyApi && hasTrack(spotifyApi)) {
    return spotifyApi;
  }

  return { ...EMPTY_NOW_PLAYING };
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
