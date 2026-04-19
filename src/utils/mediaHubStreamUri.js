/**
 * Resolve an openable URI from a Stremio/Torrentio stream object.
 * Many torrent rows expose `infoHash` + `fileIdx` without `url`; Stremio resolves those internally.
 */

/** @param {Record<string, unknown> | null | undefined} stream */
export function getResolvableStreamUri(stream) {
  const direct = String(stream?.url || stream?.externalUrl || '').trim();
  if (direct) return direct;
  const hash = stream?.infoHash;
  if (hash != null && typeof hash === 'string') {
    const h = hash.trim().toLowerCase();
    if (/^[a-f0-9]{40}$/.test(h)) {
      return `magnet:?xt=urn:btih:${h}`;
    }
  }
  return '';
}
