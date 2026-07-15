import { useEffect, useState } from 'react';
import { isVideoMediaType } from '../../../utils/channelMediaType';

/**
 * Per-URL poster memo — space switches remount tiles, and re-decoding a video
 * element just to grab its first frame is expensive. Bounded LRU of data URLs.
 */
const MP4_POSTER_CACHE_MAX = 32;
const mp4PosterCache = new Map();

export function clearMp4PosterCache() {
  mp4PosterCache.clear();
}

/** @returns {number} current memo size (test/diagnostics) */
export function getMp4PosterCacheSize() {
  return mp4PosterCache.size;
}

function readCachedPoster(url) {
  const cached = mp4PosterCache.get(url);
  if (cached === undefined) return undefined;
  // LRU touch — re-insert so the oldest entry is evicted first.
  mp4PosterCache.delete(url);
  mp4PosterCache.set(url, cached);
  return cached;
}

function writeCachedPoster(url, dataUrl) {
  mp4PosterCache.set(url, dataUrl);
  while (mp4PosterCache.size > MP4_POSTER_CACHE_MAX) {
    mp4PosterCache.delete(mp4PosterCache.keys().next().value);
  }
}

export function useChannelMediaPreview({
  effectiveMedia,
  effectiveAnimatedOnHover,
}) {
  const [mp4Preview, setMp4Preview] = useState(null);

  useEffect(() => {
    let video = null;
    let canvas = null;
    let handleLoadedData = null;

    if (effectiveMedia && isVideoMediaType(effectiveMedia.type) && effectiveAnimatedOnHover && !mp4Preview) {
      const mediaUrl = effectiveMedia.url;
      const cached = readCachedPoster(mediaUrl);
      if (cached !== undefined) {
        setMp4Preview(cached);
        return undefined;
      }

      video = document.createElement('video');
      video.src = mediaUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';

      handleLoadedData = () => {
        canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL('image/png');
          writeCachedPoster(mediaUrl, dataUrl);
          setMp4Preview(dataUrl);
        } catch {
          setMp4Preview(null);
        }
      };

      video.addEventListener('loadeddata', handleLoadedData, { once: true });
      video.currentTime = 0;
    } else if (!effectiveMedia || !isVideoMediaType(effectiveMedia.type)) {
      setMp4Preview(null);
    }

    return () => {
      if (video && handleLoadedData) {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.src = '';
        video.load();
        video = null;
      }
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
    };
  }, [effectiveAnimatedOnHover, effectiveMedia, mp4Preview]);

  return {
    mp4Preview,
    setMp4Preview,
  };
}

export default useChannelMediaPreview;
