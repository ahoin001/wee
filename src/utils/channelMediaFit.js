/**
 * Channel tile media fit — SSOT for how art fills Wii-wide slots.
 *
 * Runtime cost is CSS only (`object-fit: cover` + `object-position`).
 * No canvas re-encode / duplicate assets. Focal is 0…1 relative to the image.
 *
 * Tile aspect SSOT remains {@link WII_TILE_ASPECT} in channelLayoutSystem.js.
 */

import { WII_TILE_ASPECT } from './channelLayoutSystem';

/** Only supported fill mode for live channel tiles (and matching previews). */
export const CHANNEL_MEDIA_FIT = 'cover';

export const DEFAULT_CHANNEL_MEDIA_FOCAL = Object.freeze({
  focalX: 0.5,
  focalY: 0.5,
});

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
 * Ensure fit fields exist without dropping other media keys.
 * @param {object|null|undefined} media
 */
export function normalizeChannelMedia(media) {
  if (!media || typeof media !== 'object') return media ?? null;
  const { focalX, focalY } = resolveChannelMediaFocal(media);
  if (
    media.fit === CHANNEL_MEDIA_FIT &&
    media.focalX === focalX &&
    media.focalY === focalY
  ) {
    return media;
  }
  return {
    ...media,
    fit: CHANNEL_MEDIA_FIT,
    focalX,
    focalY,
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
  if (sameUrl) {
    return normalizeChannelMedia({
      ...next,
      focalX: previous.focalX,
      focalY: previous.focalY,
    });
  }
  return normalizeChannelMedia({
    ...next,
    focalX: DEFAULT_CHANNEL_MEDIA_FOCAL.focalX,
    focalY: DEFAULT_CHANNEL_MEDIA_FOCAL.focalY,
  });
}

/** Inline aspect-ratio for tile-matched previews (matches live `.channel.wii-mode-tile`). */
export function channelTileAspectRatioCss() {
  return `${WII_TILE_ASPECT} / 1`;
}

export { WII_TILE_ASPECT };
