/**
 * Channel tile media fit — SSOT for how art fills Wii-wide slots.
 *
 * Runtime cost is CSS only (`object-fit: cover` + `object-position`).
 * No canvas re-encode / duplicate assets. Focal is 0…1 relative to the image.
 *
 * Tile aspect SSOT remains {@link WII_TILE_ASPECT} in channelLayoutSystem.js.
 *
 * Multi-art: `media.gallery` (raster stills, max 8) + `media.artMotion`
 * (`cover` | `galleryIdle` | `cinematic`). Primary `url` mirrors `gallery[0]`
 * when a gallery is present so legacy projections stay compatible.
 */

import { WII_TILE_ASPECT } from './channelLayoutSystem';
import { isGifMediaType, isRasterImageMediaType, isVideoMediaType } from './channelMediaType';

/** Only supported fill mode for live channel tiles (and matching previews). */
export const CHANNEL_MEDIA_FIT = 'cover';

export const DEFAULT_CHANNEL_MEDIA_FOCAL = Object.freeze({
  focalX: 0.5,
  focalY: 0.5,
});

/** Per-channel art presentation (wins over global Ken Burns for that tile when set). */
export const CHANNEL_ART_MOTION = Object.freeze({
  COVER: 'cover',
  GALLERY_IDLE: 'galleryIdle',
  CINEMATIC: 'cinematic',
});

export const CHANNEL_ART_MOTION_VALUES = Object.freeze([
  CHANNEL_ART_MOTION.COVER,
  CHANNEL_ART_MOTION.GALLERY_IDLE,
  CHANNEL_ART_MOTION.CINEMATIC,
]);

/** Max stills in a channel gallery (v1: no concurrent videos). */
export const CHANNEL_GALLERY_MAX_STILLS = 8;

export function isChannelGalleryStillType(type) {
  return isRasterImageMediaType(type) || isGifMediaType(type);
}

/**
 * @param {unknown} value
 * @returns {'cover'|'galleryIdle'|'cinematic'}
 */
export function normalizeChannelArtMotion(value, galleryLength = 0) {
  if (CHANNEL_ART_MOTION_VALUES.includes(value)) {
    if (value === CHANNEL_ART_MOTION.GALLERY_IDLE && galleryLength < 2) {
      return CHANNEL_ART_MOTION.COVER;
    }
    return value;
  }
  return galleryLength > 1 ? CHANNEL_ART_MOTION.GALLERY_IDLE : CHANNEL_ART_MOTION.COVER;
}

/**
 * @param {object|null|undefined} item
 * @returns {object|null}
 */
export function normalizeChannelGalleryItem(item) {
  if (!item || typeof item !== 'object') return null;
  const url = typeof item.url === 'string' ? item.url.trim() : '';
  if (!url) return null;
  const type = typeof item.type === 'string' && item.type ? item.type : 'image/png';
  if (isVideoMediaType(type) || !isChannelGalleryStillType(type)) return null;
  const { focalX, focalY } = resolveChannelMediaFocal(item);
  const out = {
    url,
    type,
    name: typeof item.name === 'string' ? item.name : undefined,
    fit: CHANNEL_MEDIA_FIT,
    focalX,
    focalY,
  };
  if (typeof item.id === 'string' && item.id) out.id = item.id;
  return out;
}

/**
 * @param {unknown} gallery
 * @returns {object[]}
 */
export function normalizeChannelGallery(gallery) {
  if (!Array.isArray(gallery)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of gallery) {
    if (out.length >= CHANNEL_GALLERY_MAX_STILLS) break;
    const item = normalizeChannelGalleryItem(raw);
    if (!item || seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }
  return out;
}

/**
 * @param {object|null|undefined} media
 * @returns {string[]}
 */
export function getChannelGalleryUrls(media) {
  const gallery = normalizeChannelGallery(media?.gallery);
  if (gallery.length > 0) return gallery.map((g) => g.url);
  const url = typeof media?.url === 'string' ? media.url.trim() : '';
  return url && isChannelGalleryStillType(media?.type || 'image/png') ? [url] : [];
}

/**
 * @param {object|null|undefined} media
 * @returns {'cover'|'galleryIdle'|'cinematic'}
 */
export function resolveChannelArtMotion(media) {
  const gallery = normalizeChannelGallery(media?.gallery);
  return normalizeChannelArtMotion(media?.artMotion, gallery.length);
}
/**
 * Framing presets for the art panel. Values are image-relative focal points
 * consumed as `object-position: X% Y%`.
 */
export const CHANNEL_MEDIA_FOCAL_PRESETS = Object.freeze([
  { id: 'center', label: 'Center', focalX: 0.5, focalY: 0.5 },
  { id: 'top', label: 'Top', focalX: 0.5, focalY: 0.22 },
  { id: 'bottom', label: 'Bottom', focalX: 0.5, focalY: 0.78 },
  { id: 'left', label: 'Left', focalX: 0.22, focalY: 0.5 },
  { id: 'right', label: 'Right', focalX: 0.78, focalY: 0.5 },
]);

export function clampChannelMediaFocal(value, fallback = 0.5) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

export function resolveChannelMediaFocal(media) {
  return {
    focalX: clampChannelMediaFocal(media?.focalX, DEFAULT_CHANNEL_MEDIA_FOCAL.focalX),
    focalY: clampChannelMediaFocal(media?.focalY, DEFAULT_CHANNEL_MEDIA_FOCAL.focalY),
  };
}

/** CSS `object-position` for cover cropping. */
export function channelMediaObjectPositionCss(media) {
  const { focalX, focalY } = resolveChannelMediaFocal(media);
  return `${(focalX * 100).toFixed(2)}% ${(focalY * 100).toFixed(2)}%`;
}

/** Inline style bag for `<img>` / `<video>` / Ken Burns media layers. */
export function channelMediaFitStyle(media) {
  return {
    objectFit: CHANNEL_MEDIA_FIT,
    objectPosition: channelMediaObjectPositionCss(media),
  };
}

export function matchChannelMediaFocalPresetId(media) {
  const { focalX, focalY } = resolveChannelMediaFocal(media);
  const hit = CHANNEL_MEDIA_FOCAL_PRESETS.find(
    (p) => Math.abs(p.focalX - focalX) < 0.04 && Math.abs(p.focalY - focalY) < 0.04
  );
  return hit?.id ?? 'center';
}

/**
 * Ensure fit / gallery / artMotion fields stay coherent.
 * Primary `url` always mirrors `gallery[0]` when a gallery is present.
 * Videos stay single-cover (gallery cleared) for v1.
 * @param {object|null|undefined} media
 */
export function normalizeChannelMedia(media) {
  if (!media || typeof media !== 'object') return media ?? null;
  const { focalX, focalY } = resolveChannelMediaFocal(media);

  if (isVideoMediaType(media.type)) {
    return {
      ...media,
      fit: CHANNEL_MEDIA_FIT,
      focalX,
      focalY,
      artMotion: CHANNEL_ART_MOTION.COVER,
      gallery: undefined,
    };
  }

  let gallery = normalizeChannelGallery(media.gallery);
  const primaryUrl = typeof media.url === 'string' ? media.url.trim() : '';
  if (gallery.length === 0 && primaryUrl && isChannelGalleryStillType(media.type || 'image/png')) {
    // Compat: single still with no gallery array → leave gallery absent.
  } else if (gallery.length > 0) {
    // Keep primary framing on gallery[0] when urls match.
    if (gallery[0].url === primaryUrl) {
      gallery = [
        {
          ...gallery[0],
          focalX,
          focalY,
          name: typeof media.name === 'string' ? media.name : gallery[0].name,
          type: media.type || gallery[0].type,
        },
        ...gallery.slice(1),
      ];
    }
  }

  const artMotion = normalizeChannelArtMotion(media.artMotion, gallery.length);

  if (gallery.length > 0) {
    const primary = gallery[0];
    return {
      ...media,
      url: primary.url,
      type: primary.type,
      name: primary.name ?? media.name,
      fit: CHANNEL_MEDIA_FIT,
      focalX: primary.focalX,
      focalY: primary.focalY,
      gallery,
      artMotion,
    };
  }

  return {
    ...media,
    fit: CHANNEL_MEDIA_FIT,
    focalX,
    focalY,
    artMotion: CHANNEL_ART_MOTION.COVER,
    gallery: undefined,
  };
}

/**
 * Apply a named framing preset onto an existing media object.
 * @param {object} media
 * @param {string} presetId
 */
export function applyChannelMediaFocalPreset(media, presetId) {
  if (!media || typeof media !== 'object') return media;
  const preset =
    CHANNEL_MEDIA_FOCAL_PRESETS.find((p) => p.id === presetId) ||
    CHANNEL_MEDIA_FOCAL_PRESETS[0];
  return normalizeChannelMedia({
    ...media,
    focalX: preset.focalX,
    focalY: preset.focalY,
  });
}

/**
 * New art URL → keep identity fields but reset framing to center
 * (avoids carrying a previous crop onto unrelated artwork).
 * @param {object|null|undefined} previous
 * @param {object} next
 */
export function replaceChannelMediaArt(previous, next) {
  if (!next || typeof next !== 'object') return normalizeChannelMedia(next);
  const prevUrl = previous && typeof previous === 'object' ? previous.url : null;
  const sameUrl = Boolean(prevUrl) && prevUrl === next.url;
  const prevGallery = Array.isArray(previous?.gallery) ? previous.gallery : undefined;
  const prevMotion = previous?.artMotion;

  if (sameUrl) {
    return normalizeChannelMedia({
      ...next,
      focalX: previous.focalX,
      focalY: previous.focalY,
      gallery: next.gallery !== undefined ? next.gallery : prevGallery,
      artMotion: next.artMotion !== undefined ? next.artMotion : prevMotion,
    });
  }

  // New primary art replaces cover; drop multi-gallery unless caller supplied one.
  return normalizeChannelMedia({
    ...next,
    focalX: DEFAULT_CHANNEL_MEDIA_FOCAL.focalX,
    focalY: DEFAULT_CHANNEL_MEDIA_FOCAL.focalY,
    gallery: next.gallery !== undefined ? next.gallery : undefined,
    artMotion: next.artMotion !== undefined ? next.artMotion : CHANNEL_ART_MOTION.COVER,
  });
}

/**
 * Build media from an ordered gallery of stills (primary = first).
 * @param {object[]} galleryItems
 * @param {'cover'|'galleryIdle'|'cinematic'} [artMotion]
 */
export function mediaFromChannelGallery(galleryItems, artMotion) {
  const gallery = normalizeChannelGallery(galleryItems);
  if (gallery.length === 0) return null;
  return normalizeChannelMedia({
    url: gallery[0].url,
    type: gallery[0].type,
    name: gallery[0].name,
    focalX: gallery[0].focalX,
    focalY: gallery[0].focalY,
    gallery,
    artMotion: artMotion ?? (gallery.length > 1
      ? CHANNEL_ART_MOTION.GALLERY_IDLE
      : CHANNEL_ART_MOTION.COVER),
  });
}

/** Inline aspect-ratio for tile-matched previews (matches live `.channel.wii-mode-tile`). */
export function channelTileAspectRatioCss() {
  return `${WII_TILE_ASPECT} / 1`;
}

export { WII_TILE_ASPECT };
