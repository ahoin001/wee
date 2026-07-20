import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ReactFreezeframe from 'react-freezeframe-vite';
import KenBurnsImage from './KenBurnsImage';
import { isGifMediaType, isRasterImageMediaType, isVideoMediaType } from '../../utils/channelMediaType';
import {
  CHANNEL_ART_MOTION,
  CHANNEL_MEDIA_FIT,
  channelMediaFitStyle,
  channelMediaObjectPositionCss,
  getChannelGalleryUrls,
  resolveChannelArtMotion,
} from '../../utils/channelMediaFit';
import useAnimationActivity from '../../hooks/useAnimationActivity';

function buildKenBurnsProps(channelSettings, mode, alt, media, overrides = {}) {
  return {
    mode,
    width: '100%',
    height: '100%',
    // Match the tile's own radius (wii tiles are 14px) — a fixed value leaves a visible seam.
    borderRadius: 'inherit',
    objectFit: CHANNEL_MEDIA_FIT,
    objectPosition: channelMediaObjectPositionCss(media),
    alt,
    hoverDuration: channelSettings?.kenBurnsHoverDuration ?? 8000,
    hoverScale: channelSettings?.kenBurnsHoverScale ?? 1.1,
    autoplayDuration: channelSettings?.kenBurnsAutoplayDuration ?? 12000,
    autoplayScale: channelSettings?.kenBurnsAutoplayScale ?? 1.15,
    slideshowDuration: channelSettings?.kenBurnsSlideshowDuration ?? 10000,
    slideshowScale: channelSettings?.kenBurnsSlideshowScale ?? 1.08,
    crossfadeDuration: Math.max(1000, channelSettings?.kenBurnsCrossfadeDuration ?? 1400),
    easing: channelSettings?.kenBurnsEasing || 'ease-out',
    animationType: channelSettings?.kenBurnsAnimationType || 'both',
    enableCrossfadeReturn: channelSettings?.kenBurnsCrossfadeReturn !== false,
    transitionType: channelSettings?.kenBurnsTransitionType || 'cross-dissolve',
    enableIntersectionObserver: true,
    ...overrides,
  };
}

function ChannelMediaPreview({
  effectiveMedia,
  effectiveAnimatedOnHover,
  effectiveKenBurnsEnabled,
  effectiveKenBurnsMode,
  channelSettings,
  isHovered,
  setIsHovered,
  mp4Preview,
  videoRef,
  icon,
  imageError,
  setImageError,
  iconLoadError,
  setIconLoadError,
  fallbackIcon,
  setFallbackIcon,
}) {
  const { shouldAnimate } = useAnimationActivity({ activeFps: 8, lowPowerFps: 2 });
  const [gallerySlideUrl, setGallerySlideUrl] = useState(null);

  const handleImageError = useCallback((e) => {
    setImageError(true);
    if (icon && icon !== effectiveMedia?.url) {
      setFallbackIcon(icon);
    }
    e.target.style.display = 'none';
  }, [setImageError, icon, effectiveMedia?.url, setFallbackIcon]);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
    setFallbackIcon(null);
  }, [setImageError, setFallbackIcon]);

  const fitStyle = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      ...channelMediaFitStyle(effectiveMedia),
    }),
    [effectiveMedia]
  );

  const artMotion = resolveChannelArtMotion(effectiveMedia);
  const galleryUrls = useMemo(() => getChannelGalleryUrls(effectiveMedia), [effectiveMedia]);
  const channelOwnsPresentation =
    artMotion === CHANNEL_ART_MOTION.GALLERY_IDLE ||
    artMotion === CHANNEL_ART_MOTION.CINEMATIC ||
    galleryUrls.length > 1;

  const handleGalleryImageChange = useCallback((_index, url) => {
    if (typeof url === 'string' && url) setGallerySlideUrl(url);
  }, []);

  const mediaPreview = useMemo(() => {
    if (!(effectiveMedia && effectiveMedia.url && effectiveMedia.url.trim())) return null;

    // Multi-art / cinematic: channel presentation wins over global Ken Burns settings.
    if (channelOwnsPresentation && galleryUrls.length > 0) {
      const cinematic = artMotion === CHANNEL_ART_MOTION.CINEMATIC;
      if (isHovered && artMotion === CHANNEL_ART_MOTION.GALLERY_IDLE) {
        return (
          <KenBurnsImage
            {...buildKenBurnsProps(
              channelSettings,
              'hover',
              effectiveMedia.name || 'Channel Image',
              effectiveMedia,
              { animationEnabled: shouldAnimate }
            )}
            src={gallerySlideUrl || galleryUrls[0]}
          />
        );
      }
      return (
        <KenBurnsImage
          {...buildKenBurnsProps(
            channelSettings,
            'slideshow',
            effectiveMedia.name || 'Channel gallery',
            effectiveMedia,
            {
              animationEnabled: shouldAnimate,
              slideshowDuration: cinematic ? 9000 : (channelSettings?.kenBurnsSlideshowDuration ?? 10000),
              slideshowScale: cinematic
                ? Math.max(1.1, channelSettings?.kenBurnsSlideshowScale ?? 1.12)
                : Math.min(1.08, channelSettings?.kenBurnsSlideshowScale ?? 1.06),
              crossfadeDuration: Math.max(1400, channelSettings?.kenBurnsCrossfadeDuration ?? 1400),
            }
          )}
          images={galleryUrls}
          onImageChange={handleGalleryImageChange}
        />
      );
    }

    if (isGifMediaType(effectiveMedia.type) || effectiveMedia.url.match(/\.gif$/i)) {
      const kenBurnsForGifsEnabled = channelSettings?.kenBurnsForGifs ?? false;
      if (effectiveKenBurnsEnabled && kenBurnsForGifsEnabled) {
        return (
          <KenBurnsImage
            {...buildKenBurnsProps(
              channelSettings,
              effectiveKenBurnsMode,
              effectiveMedia.name || 'Channel GIF',
              effectiveMedia,
              { animationEnabled: shouldAnimate }
            )}
            src={effectiveMedia.url}
          />
        );
      }
      if (effectiveAnimatedOnHover) {
        return (
          <ReactFreezeframe
            key={effectiveMedia.url}
            src={effectiveMedia.url}
            alt="Channel media"
            className="channel-media"
            style={fitStyle}
            options={{ trigger: 'hover', overlay: false, responsive: true, warnings: false }}
          />
        );
      }
      return (
        <img
          src={effectiveMedia.url}
          alt="Channel media"
          className="channel-media"
          loading="lazy"
          decoding="async"
          style={fitStyle}
        />
      );
    }

    if (isVideoMediaType(effectiveMedia.type)) {
      const kenBurnsForVideosEnabled = channelSettings?.kenBurnsForVideos ?? false;
      if (effectiveKenBurnsEnabled && kenBurnsForVideosEnabled) {
        return (
          <KenBurnsImage
            {...buildKenBurnsProps(
              channelSettings,
              effectiveKenBurnsMode,
              effectiveMedia.name || 'Channel Video',
              effectiveMedia,
              { animationEnabled: shouldAnimate }
            )}
            src={effectiveMedia.url}
          />
        );
      }

      if (effectiveAnimatedOnHover) {
        if (!isHovered && mp4Preview) {
          return (
            <img
              src={mp4Preview}
              alt="Channel preview"
              className="channel-media"
              loading="lazy"
              decoding="async"
              style={fitStyle}
              onMouseEnter={() => setIsHovered(true)}
              onFocus={() => setIsHovered(true)}
              tabIndex={0}
            />
          );
        }
        return (
          <video
            ref={videoRef}
            src={effectiveMedia.url}
            className="channel-media"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            style={fitStyle}
            onMouseLeave={() => {
              setIsHovered(false);
              if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
              }
            }}
            onBlur={() => {
              setIsHovered(false);
              if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
              }
            }}
          />
        );
      }

      return (
        <video
          ref={videoRef}
          src={effectiveMedia.url}
          className="channel-media"
          autoPlay
          loop
          muted
          playsInline
          style={fitStyle}
        />
      );
    }

    if (isRasterImageMediaType(effectiveMedia.type)) {
      if (effectiveKenBurnsEnabled) {
        return (
          <KenBurnsImage
            {...buildKenBurnsProps(
              channelSettings,
              effectiveKenBurnsMode,
              effectiveMedia.name || 'Channel Image',
              effectiveMedia,
              { animationEnabled: shouldAnimate }
            )}
            src={effectiveMedia.url}
          />
        );
      }
      return (
        <img
          src={effectiveMedia.url}
          alt="Channel media"
          className="channel-media"
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{
            ...fitStyle,
            display: imageError ? 'none' : 'block',
          }}
        />
      );
    }
    return null;
  }, [
    effectiveMedia,
    channelSettings,
    effectiveKenBurnsEnabled,
    effectiveKenBurnsMode,
    effectiveAnimatedOnHover,
    isHovered,
    mp4Preview,
    imageError,
    fitStyle,
    handleImageError,
    handleImageLoad,
    setIsHovered,
    videoRef,
    channelOwnsPresentation,
    galleryUrls,
    artMotion,
    gallerySlideUrl,
    shouldAnimate,
    handleGalleryImageChange,
  ]);

  return (
    <>
      {!imageError && mediaPreview}

      {imageError && fallbackIcon && !iconLoadError && (
        <img
          src={fallbackIcon}
          alt="Channel fallback"
          className="channel-media"
          loading="lazy"
          decoding="async"
          style={fitStyle}
          onError={(e) => {
            setIconLoadError(true);
            e.target.style.display = 'none';
          }}
        />
      )}

      {!mediaPreview && !imageError && !iconLoadError && icon && icon.trim() && (
        <img
          src={icon}
          alt=""
          className="channel-media"
          loading="lazy"
          decoding="async"
          style={fitStyle}
          onError={(e) => {
            setIconLoadError(true);
            e.target.style.display = 'none';
          }}
        />
      )}
    </>
  );
}

ChannelMediaPreview.propTypes = {
  effectiveMedia: PropTypes.shape({
    url: PropTypes.string,
    type: PropTypes.string,
    name: PropTypes.string,
    focalX: PropTypes.number,
    focalY: PropTypes.number,
    gallery: PropTypes.array,
    artMotion: PropTypes.string,
  }),
  effectiveAnimatedOnHover: PropTypes.bool,
  effectiveKenBurnsEnabled: PropTypes.bool,
  effectiveKenBurnsMode: PropTypes.string,
  channelSettings: PropTypes.object,
  isHovered: PropTypes.bool,
  setIsHovered: PropTypes.func.isRequired,
  mp4Preview: PropTypes.string,
  videoRef: PropTypes.object.isRequired,
  icon: PropTypes.string,
  imageError: PropTypes.bool,
  setImageError: PropTypes.func.isRequired,
  iconLoadError: PropTypes.bool,
  setIconLoadError: PropTypes.func.isRequired,
  fallbackIcon: PropTypes.string,
  setFallbackIcon: PropTypes.func.isRequired,
};

function gallerySignature(media) {
  const g = media?.gallery;
  if (!Array.isArray(g) || g.length === 0) return '';
  return g.map((item) => item?.url || '').join('\u241f');
}

function arePropsEqual(prev, next) {
  return (
    prev.effectiveMedia?.url === next.effectiveMedia?.url &&
    prev.effectiveMedia?.type === next.effectiveMedia?.type &&
    prev.effectiveMedia?.focalX === next.effectiveMedia?.focalX &&
    prev.effectiveMedia?.focalY === next.effectiveMedia?.focalY &&
    prev.effectiveMedia?.artMotion === next.effectiveMedia?.artMotion &&
    gallerySignature(prev.effectiveMedia) === gallerySignature(next.effectiveMedia) &&
    prev.effectiveAnimatedOnHover === next.effectiveAnimatedOnHover &&
    prev.effectiveKenBurnsEnabled === next.effectiveKenBurnsEnabled &&
    prev.effectiveKenBurnsMode === next.effectiveKenBurnsMode &&
    prev.channelSettings === next.channelSettings &&
    prev.isHovered === next.isHovered &&
    prev.mp4Preview === next.mp4Preview &&
    prev.icon === next.icon &&
    prev.imageError === next.imageError &&
    prev.iconLoadError === next.iconLoadError &&
    prev.fallbackIcon === next.fallbackIcon
  );
}

export default React.memo(ChannelMediaPreview, arePropsEqual);
