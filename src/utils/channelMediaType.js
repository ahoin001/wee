/**
 * Channel tile media uses a mix of MIME strings (e.g. image/jpeg) and media_library
 * short types ('image' | 'gif' | 'video'). Centralize detection so renderers stay in sync.
 */

export function isGifMediaType(type) {
  return typeof type === 'string' && (type === 'image/gif' || type === 'gif');
}

export function isVideoMediaType(type) {
  return typeof type === 'string' && (type === 'video' || type.startsWith('video/'));
}

/** Static images (not GIF — GIF is handled separately in Channel). */
export function isRasterImageMediaType(type) {
  return (
    typeof type === 'string' &&
    (type === 'image' || (type.startsWith('image/') && type !== 'image/gif'))
  );
}

/**
 * Map media_library.file_type to a MIME type for new channel media objects.
 * Prefer row.mime_type when present.
 */
export function resolveMimeTypeFromMediaLibraryRow(row) {
  if (!row) return 'image/png';
  const m = row.mime_type;
  if (typeof m === 'string' && m.includes('/')) return m;
  switch (row.file_type) {
    case 'gif':
      return 'image/gif';
    case 'video':
      return 'video/mp4';
    case 'image':
      return 'image/png';
    default:
      return 'image/png';
  }
}
