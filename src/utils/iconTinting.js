function clampSampleSize(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 128;
  return Math.max(32, Math.min(512, Math.round(n)));
}

export function parseColorToRgb(color) {
  if (!color || typeof color !== 'string') return [0, 153, 255];

  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return [Number(r), Number(g), Number(b)];
  }

  const hex = color.replace('#', '').trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return [0, 153, 255];
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

export function tintImageWithOverwrite(imageElement, rgbColor) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(imageElement?.src || '');
      return;
    }

    const width = imageElement.naturalWidth || imageElement.width || 0;
    const height = imageElement.naturalHeight || imageElement.height || 0;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(imageElement, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        data[i] = rgbColor[0];
        data[i + 1] = rgbColor[1];
        data[i + 2] = rgbColor[2];
      }
    }

    ctx.putImageData(imageData, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  });
}

export function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

export async function tintImageUrlWithOverwrite(url, color) {
  const img = await loadImageElement(url);
  const rgbColor = Array.isArray(color) ? color : parseColorToRgb(color);
  return tintImageWithOverwrite(img, rgbColor);
}

export function analyzeIconTransparency(imageElement, { sampleSize = 128 } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { hasTransparency: true, opaqueRatio: 0 };

  const target = clampSampleSize(sampleSize);
  const sourceWidth = imageElement.naturalWidth || imageElement.width || target;
  const sourceHeight = imageElement.naturalHeight || imageElement.height || target;
  const scale = Math.min(target / sourceWidth, target / sourceHeight, 1);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(imageElement, 0, 0, width, height);

  const data = ctx.getImageData(0, 0, width, height).data;
  let transparentPixels = 0;
  let opaquePixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) transparentPixels += 1;
    else opaquePixels += 1;
  }

  const total = transparentPixels + opaquePixels;
  const opaqueRatio = total > 0 ? opaquePixels / total : 1;
  return {
    hasTransparency: transparentPixels > 0,
    opaqueRatio,
  };
}
