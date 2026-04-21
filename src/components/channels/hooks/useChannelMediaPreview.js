import { useEffect, useState } from 'react';
import { isVideoMediaType } from '../../../utils/channelMediaType';

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
      video = document.createElement('video');
      video.src = effectiveMedia.url;
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
