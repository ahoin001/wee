/**
 * Supported user-upload media types (channel tiles, media library, preset cover art).
 * Keep in sync with Channel / Ken Burns expectations — no WebP/BMP/etc. unless explicitly added.
 */

/** HTML `accept` for single channel image or MP4 tile. */
export const ACCEPT_IMAGE_OR_MP4 =
  'image/png,image/jpeg,image/gif,video/mp4,.png,.jpeg,.jpg,.gif,.mp4';

/** Gallery / slideshow: still images + GIF only (no MP4 in multi-image flow). */
export const ACCEPT_GALLERY_STILLS =
  'image/png,image/jpeg,image/gif,.png,.jpeg,.jpg,.gif,.PNG,.JPEG,.JPG,.GIF';

export const SUPPORTED_IMAGE_VIDEO_HINT =
  'PNG, JPEG, JPG, GIF, or MP4 only.';

export const SUPPORTED_GALLERY_HINT =
  'PNG, JPEG, JPG, or GIF only.';

const MIME_IMAGE_OR_VIDEO = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/gif',
  'video/mp4',
]);

const MIME_GALLERY = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/gif']);

const EXT_IMAGE = /\.(png|jpe?g|gif)$/i;
const EXT_MP4 = /\.mp4$/i;

function mimeOk(file, allowedSet) {
  const t = (file.type || '').toLowerCase().trim();
  if (!t) return null;
  return allowedSet.has(t);
}

/**
 * Channel single media or media-library upload: PNG, JPEG, JPG, GIF, MP4.
 */
export function isSupportedImageOrVideoUpload(file) {
  if (!file || typeof file.name !== 'string') return false;
  const byMime = mimeOk(file, MIME_IMAGE_OR_VIDEO);
  if (byMime === true) return true;
  if (EXT_MP4.test(file.name)) return true;
  if (EXT_IMAGE.test(file.name)) return true;
  return false;
}

/**
 * Multi-image gallery: PNG, JPEG, JPG, GIF (no video).
 */
export function isSupportedGalleryStillUpload(file) {
  if (!file || typeof file.name !== 'string') return false;
  const byMime = mimeOk(file, MIME_GALLERY);
  if (byMime === true) return true;
  if (EXT_IMAGE.test(file.name)) return true;
  return false;
}

/**
 * Preset custom cover / community thumbnail: raster + GIF, no MP4.
 */
export function isSupportedPresetCoverImageUpload(file) {
  return isSupportedGalleryStillUpload(file);
}
