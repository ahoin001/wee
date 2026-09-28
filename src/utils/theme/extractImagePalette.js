/**
 * Shared image → ambient palette (wallpaper + album art).
 * Outputs hex for applyPrimaryAccentFromHex; rgb strings for Spotify UI compat.
 */

import { rgbToHslComponents } from './applyPrimaryAccentFromHex.js';
import { paletteFromPixels, paletteSampleSize, rgbComponentsToHex } from './imagePaletteCore.js';

export { rgbComponentsToHex };

const WORKER_TIMEOUT_MS = 6000;
/** null = untested, false = unavailable (fallback forever this session). */
let paletteWorker = null;
let paletteWorkerAvailable = null;
let paletteRequestSeq = 0;
const pendingPaletteRequests = new Map();

function settlePending(id, value) {
  const pending = pendingPaletteRequests.get(id);
  if (!pending) return;
  pendingPaletteRequests.delete(id);
  window.clearTimeout(pending.timer);
  pending.resolve(value);
}

function getPaletteWorker() {
  if (paletteWorkerAvailable === false) return null;
  if (paletteWorker) return paletteWorker;
  if (
    typeof Worker === 'undefined' ||
    typeof OffscreenCanvas === 'undefined' ||
    typeof createImageBitmap !== 'function'
  ) {
    paletteWorkerAvailable = false;
    return null;
  }
  try {
    paletteWorker = new Worker(new URL('./imagePalette.worker.js', import.meta.url), {
      type: 'module',
    });
    paletteWorker.onmessage = (event) => {
      const { id, ok, result } = event.data || {};
      settlePending(id, ok ? { ok: true, result } : { ok: false });
    };
    paletteWorker.onerror = () => {
      paletteWorkerAvailable = false;
      paletteWorker?.terminate();
      paletteWorker = null;
      [...pendingPaletteRequests.keys()].forEach((id) => settlePending(id, { ok: false }));
    };
    paletteWorkerAvailable = true;
    return paletteWorker;
  } catch {
    paletteWorkerAvailable = false;
    return null;
  }
}

/**
 * Off-thread path: downscale via createImageBitmap, transfer to the worker for pixel work.
 * Resolves `{ ok: false }` when the caller should use the main-thread canvas fallback.
 */
async function paletteViaWorker(img) {
  const worker = getPaletteWorker();
  if (!worker) return { ok: false };
  let bitmap;
  try {
    const { width, height } = paletteSampleSize(img.naturalWidth || img.width, img.naturalHeight || img.height);
    bitmap = await createImageBitmap(img, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: 'medium',
    });
  } catch {
    return { ok: false };
  }
  const id = ++paletteRequestSeq;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => settlePending(id, { ok: false }), WORKER_TIMEOUT_MS);
    pendingPaletteRequests.set(id, { resolve, timer });
    try {
      worker.postMessage({ id, bitmap }, [bitmap]);
    } catch {
      settlePending(id, { ok: false });
    }
  });
}

export function colorStringToHex(color) {
  if (!color || typeof color !== 'string') return null;
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return rgbComponentsToHex(Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3]));
  }
  return null;
}

/**
 * @param {string} imageUrl
 * @returns {Promise<{
 *   seedHex: string,
 *   seeds: string[],
 *   palette: {
 *     primary: string,
 *     secondary: string,
 *     accent: string,
 *     surfaceHint: string,
 *     primaryRgb: string,
 *     secondaryRgb: string,
 *     accentRgb: string,
 *     text: string,
 *     textSecondary: string,
 *   },
 *   gradient: string,
 *   blurredBackground: string,
 * } | null>}
 */
export function extractImagePalette(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return Promise.resolve(null);
  }

  const isHttpUrl = /^https?:\/\//i.test(imageUrl);

  /**
   * Local / custom-protocol wallpapers (Electron) often taint the canvas when
   * crossOrigin=anonymous is set. Remote http(s) needs it for CORS bitmaps.
   */
  const loadImage = (useCrossOrigin) =>
    new Promise((resolveLoad) => {
      const img = new Image();
      if (useCrossOrigin) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolveLoad(img);
      img.onerror = () => resolveLoad(null);
      img.src = imageUrl;
    });

  return (async () => {
    try {
      let img = await loadImage(isHttpUrl);
      if (!img && isHttpUrl) {
        img = await loadImage(false);
      }
      if (!img) return null;

      const viaWorker = await paletteViaWorker(img);
      if (viaWorker.ok) return viaWorker.result;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;

      const sample = paletteSampleSize(img.width, img.height);
      canvas.width = sample.width;
      canvas.height = sample.height;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        if (!isHttpUrl) return null;
        const retryImg = await loadImage(false);
        if (!retryImg) return null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(retryImg, 0, 0, canvas.width, canvas.height);
        try {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch {
          return null;
        }
      }

      return paletteFromPixels(imageData.data);
    } catch (error) {
      console.error('[extractImagePalette] Failed to extract colors:', error);
      return null;
    }
  })();
}

/**
 * Apply optional ambient secondary/accent CSS roles (HSL components).
 * @param {{ secondary?: string, accent?: string } | null} palette
 * @param {{ clear?: boolean }} [opts]
 */
export function applyAmbientRoleTokens(palette, opts = {}) {
  const root = document.documentElement;
  if (opts.clear || !palette) {
    root.style.removeProperty('--ambient-secondary');
    root.style.removeProperty('--ambient-accent');
    return;
  }

  const secondaryHex = colorStringToHex(palette.secondary);
  const accentHex = colorStringToHex(palette.accent);
  if (secondaryHex) {
    const rgb = secondaryHex.match(/^#([0-9a-f]{6})$/i);
    if (rgb) {
      const n = parseInt(rgb[1], 16);
      const hsl = rgbToHslComponents((n >> 16) & 255, (n >> 8) & 255, n & 255);
      root.style.setProperty('--ambient-secondary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
  }
  if (accentHex) {
    const rgb = accentHex.match(/^#([0-9a-f]{6})$/i);
    if (rgb) {
      const n = parseInt(rgb[1], 16);
      const hsl = rgbToHslComponents((n >> 16) & 255, (n >> 8) & 255, n & 255);
      root.style.setProperty('--ambient-accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
  }
}

export const DEFAULT_AMBIENT_COLOR = Object.freeze({
  wallpaperMatchEnabled: false,
  source: 'manual',
  seedHex: null,
  palette: null,
  cachedForUrl: null,
  seeds: [],
});
