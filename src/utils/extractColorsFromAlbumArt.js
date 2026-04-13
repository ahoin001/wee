import {
  ALBUM_ART_TEXT_ON_DARK,
  ALBUM_ART_TEXT_ON_DARK_SECONDARY,
  ALBUM_ART_TEXT_ON_LIGHT,
  ALBUM_ART_TEXT_ON_LIGHT_SECONDARY,
} from '../design/albumArtContrastColors.js';

/**
 * Sample album art and derive gradient + text-friendly palette for Spotify UI.
 * Used by FloatingSpotifyWidget (full result) and WiiRibbon (typically `result.colors` only).
 *
 * @param {string} imageUrl
 * @returns {Promise<{
 *   gradient: string,
 *   blurredBackground: string,
 *   colors: { primary: string, secondary: string, accent: string, text: string, textSecondary: string }
 * } | null>}
 */
export function extractColorsFromAlbumArt(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const colors = [];
        const step = 5;

        for (let i = 0; i < data.length; i += step * 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a > 128 && (r + g + b) > 100 && (r + g + b) < 700) {
            colors.push({ r, g, b });
          }
        }

        if (colors.length > 0) {
          const avgColor = colors.reduce(
            (acc, color) => {
              acc.r += color.r;
              acc.g += color.g;
              acc.b += color.b;
              return acc;
            },
            { r: 0, g: 0, b: 0 }
          );

          avgColor.r = Math.round(avgColor.r / colors.length);
          avgColor.g = Math.round(avgColor.g / colors.length);
          avgColor.b = Math.round(avgColor.b / colors.length);

          const boost = 1.3;
          avgColor.r = Math.min(255, Math.round(avgColor.r * boost));
          avgColor.g = Math.min(255, Math.round(avgColor.g * boost));
          avgColor.b = Math.min(255, Math.round(avgColor.b * boost));

          const primaryColor = `rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`;
          const secondaryColor = `rgb(${Math.max(0, avgColor.r - 40)}, ${Math.max(0, avgColor.g - 40)}, ${Math.max(0, avgColor.b - 40)})`;
          const accentColor = `rgb(${Math.min(255, avgColor.r + 50)}, ${Math.min(255, avgColor.g + 50)}, ${Math.min(255, avgColor.b + 50)})`;

          const brightness = (avgColor.r * 299 + avgColor.g * 587 + avgColor.b * 114) / 1000;

          let textColor;
          let textSecondaryColor;

          if (brightness > 128) {
            textColor = ALBUM_ART_TEXT_ON_LIGHT;
            textSecondaryColor = ALBUM_ART_TEXT_ON_LIGHT_SECONDARY;
          } else {
            textColor = ALBUM_ART_TEXT_ON_DARK;
            textSecondaryColor = ALBUM_ART_TEXT_ON_DARK_SECONDARY;
          }

          const gradient = `linear-gradient(135deg, 
              rgba(${avgColor.r}, ${avgColor.g}, ${avgColor.b}, 1) 0%, 
              rgba(${Math.max(0, avgColor.r - 60)}, ${Math.max(0, avgColor.g - 60)}, ${Math.max(0, avgColor.b - 60)}, 0.95) 30%,
              rgba(${Math.max(0, avgColor.r - 120)}, ${Math.max(0, avgColor.g - 120)}, ${Math.max(0, avgColor.b - 120)}, 0.9) 70%,
              rgba(${Math.max(0, avgColor.r - 180)}, ${Math.max(0, avgColor.g - 180)}, ${Math.max(0, avgColor.b - 180)}, 0.85) 100%)`;

          const blurredBackground = `linear-gradient(135deg, 
              rgba(${avgColor.r}, ${avgColor.g}, ${avgColor.b}, 0.8) 0%, 
              rgba(${Math.max(0, avgColor.r - 40)}, ${Math.max(0, avgColor.g - 40)}, ${Math.max(0, avgColor.b - 40)}, 0.6) 100%)`;

          resolve({
            gradient,
            blurredBackground,
            colors: {
              primary: primaryColor,
              secondary: secondaryColor,
              accent: accentColor,
              text: textColor,
              textSecondary: textSecondaryColor,
            },
          });
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error('[COLOR EXTRACTION] Failed to extract colors:', error);
        resolve(null);
      }
    };

    img.onerror = (error) => {
      console.error('[COLOR EXTRACTION] Failed to load image:', error);
      resolve(null);
    };

    img.src = imageUrl;
  });
}
