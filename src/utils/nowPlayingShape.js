/**
 * Normalized now-playing projection — shared by Spotify + Windows system media (SMTC).
 * UI (tile, widget chrome, music-reactive levels) reads this shape only.
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
    updatedAt: Math.max(0, Number(partial.updatedAt) || 0),
  };
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
      updatedAt: Date.now(),
    });
  }
  const status = session.playbackStatus;
  const isPlaying = status === 'playing';
  const controls = session.controls || {};
  return normalizeNowPlaying({
    source: 'system',
    trackName: session.title || '',
    artistLine: session.artist || '',
    albumArtUrl: session.thumbnail || '',
    isPlaying,
    progressMs: session.timeline?.positionMs || 0,
    durationMs: session.timeline?.durationMs || 0,
    canPlay: Boolean(controls.canPlay),
    canPause: Boolean(controls.canPause),
    canSkipNext: Boolean(controls.canSkipNext),
    canSkipPrevious: Boolean(controls.canSkipPrevious),
    appName: session.sourceAppDisplayName || session.sourceAppUserModelId || 'System',
    updatedAt: Date.now(),
  });
}

function hasTrack(np) {
  return Boolean(np?.trackName || np?.albumArtUrl);
}

/**
 * Pick the active projection from preference + candidates.
 * @param {{
 *   preference?: string,
 *   systemEnabled?: boolean,
 *   spotifyConnected?: boolean,
 *   spotifyCandidate?: object,
 *   systemCandidate?: object,
 * }} opts
 */
export function resolveNowPlaying(opts = {}) {
  const preference = normalizeNowPlayingSourcePreference(opts.preference);
  const systemEnabled = opts.systemEnabled !== false;
  const spotifyConnected = Boolean(opts.spotifyConnected);
  const spotify = hasTrack(opts.spotifyCandidate) || opts.spotifyCandidate?.isPlaying
    ? normalizeNowPlaying(opts.spotifyCandidate)
    : null;
  const system =
    systemEnabled && (hasTrack(opts.systemCandidate) || opts.systemCandidate?.isPlaying)
      ? normalizeNowPlaying(opts.systemCandidate)
      : null;

  if (preference === 'spotify') {
    if (spotifyConnected && spotify) return spotify;
    return { ...EMPTY_NOW_PLAYING };
  }
  if (preference === 'system') {
    if (system) return system;
    return { ...EMPTY_NOW_PLAYING };
  }

  // auto: prefer currently playing, then most recently updated with a track
  const playing = [spotify, system].filter((c) => c && c.isPlaying && hasTrack(c));
  if (playing.length === 1) return playing[0];
  if (playing.length > 1) {
    return playing.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  }

  const withTrack = [spotify, system].filter((c) => c && hasTrack(c));
  if (withTrack.length) {
    return withTrack.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  }

  return { ...EMPTY_NOW_PLAYING };
}

/**
 * Pick the “best” SMTC session from a snapshot list.
 * Prefer playing with a title, else most recently meaningful paused track.
 * @param {Array<object>} sessions
 * @param {{ excludeSpotify?: boolean }} [opts] — when auto+Spotify connected, skip Spotify’s SMTC mirror
 */
export function pickPrimarySystemSession(sessions, opts = {}) {
  const list = Array.isArray(sessions) ? sessions : [];
  const filtered = opts.excludeSpotify
    ? list.filter((s) => {
        const id = `${s?.sourceAppUserModelId || ''} ${s?.sourceAppDisplayName || ''}`.toLowerCase();
        return !id.includes('spotify');
      })
    : list;

  const playing = filtered.filter(
    (s) => s?.playbackStatus === 'playing' && (s.title || s.thumbnail)
  );
  if (playing.length) return playing[0];

  const paused = filtered.filter(
    (s) =>
      (s?.playbackStatus === 'paused' || s?.playbackStatus === 'opened') &&
      (s.title || s.thumbnail)
  );
  return paused[0] || filtered[0] || null;
}
