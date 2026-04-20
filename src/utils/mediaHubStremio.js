/**
 * Stremio deep links (addon SDK): https://stremio.github.io/stremio-addon-sdk/deep-links.html
 * Detail: stremio:///detail/{type}/{id}/{videoId}
 */

/**
 * @param {{ imdb_id?: string, id?: string } | null | undefined} item
 * @returns {string}
 */
export function normalizeStremioMetaId(item) {
  if (!item) return '';
  let raw = String(item.imdb_id || item.id || '').trim();
  if (!raw) return '';
  if (raw.toLowerCase().startsWith('series:')) {
    raw = raw.slice('series:'.length);
  }
  return raw;
}

/**
 * @param {'movie' | 'series'} contentMode
 * @param {{ imdb_id?: string, id?: string } | null | undefined} item
 * @param {number | null | undefined} season
 * @param {number | null | undefined} episode
 * @returns {string | null}
 */
export function buildStremioDetailUrl(contentMode, item, season, episode) {
  const metaId = normalizeStremioMetaId(item);
  if (!metaId) return null;

  if (contentMode === 'movie') {
    return `stremio:///detail/movie/${metaId}/${metaId}`;
  }

  if (contentMode === 'series') {
    const s = Number(season);
    const e = Number(episode);
    if (!Number.isFinite(s) || !Number.isFinite(e)) return null;
    const videoId = `${metaId}:${s}:${e}`;
    return `stremio:///detail/series/${metaId}/${videoId}`;
  }

  return null;
}

/**
 * Stremio search UI (no query). Use with {@link copyMagnetForStremioSearchPaste} — the desktop app
 * often mishandles `stremio:///search?search=<encoded magnet>` while the same magnet pasted
 * manually works.
 */
export const STREMIO_SEARCH_URL = 'stremio:///search';

/**
 * Copy raw magnet text, then open {@link STREMIO_SEARCH_URL} so the user pastes (Ctrl+V) — matches
 * manual paste behavior Stremio handles correctly.
 *
 * @param {string} magnetUri
 */
export async function copyMagnetForStremioSearchPaste(magnetUri) {
  const m = String(magnetUri || '').trim();
  if (!/^magnet:/i.test(m)) {
    throw new Error('Not a magnet link');
  }
  await navigator.clipboard.writeText(m);
}

/**
 * SDK: `stremio:///search?search={query}` (URI-encoded). Kept for callers that need the deep link;
 * Stremio desktop may not apply the query reliably for long torrent magnets — prefer
 * {@link copyMagnetForStremioSearchPaste} + {@link STREMIO_SEARCH_URL}.
 */
export const STREMIO_MAGNET_SEARCH_URL_MAX = 2048;

/**
 * @param {string} magnetUri
 * @returns {string | null}
 */
export function buildStremioSearchUrlForMagnet(magnetUri) {
  if (!magnetUri || typeof magnetUri !== 'string') return null;
  const m = magnetUri.trim();
  if (!/^magnet:/i.test(m)) return null;
  const url = `stremio:///search?search=${encodeURIComponent(m)}`;
  if (url.length > STREMIO_MAGNET_SEARCH_URL_MAX) return null;
  return url;
}
