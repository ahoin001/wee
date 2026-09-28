/**
 * Palette worker: receives a pre-downscaled ImageBitmap (transferred), reads pixels on an
 * OffscreenCanvas, and returns the palette — keeping getImageData + bucketing off the UI thread.
 */
import { paletteFromPixels } from './imagePaletteCore.js';

self.onmessage = (event) => {
  const { id, bitmap } = event.data || {};
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('no-2d-context');
    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    self.postMessage({ id, ok: true, result: paletteFromPixels(data) });
  } catch (error) {
    // Tainted / unsupported bitmap: caller falls back to the main-thread path.
    self.postMessage({ id, ok: false, error: String(error?.message || error) });
  } finally {
    bitmap?.close?.();
  }
};
