import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import ReactFreezeframe from 'react-freezeframe-vite';
import KenBurnsImage from './KenBurnsImage';
import { isGifMediaType, isRasterImageMediaType, isVideoMediaType } from '../../utils/channelMediaType';

function buildKenBurnsProps(channelSettings, effectiveKenBurnsMode, alt) {
  return {
    mode: effectiveKenBurnsMode,
    width: '100%',
    height: '100%',
    borderRadius: '12px',
    objectFit: 'cover',
    alt,
    hoverDuration: channelSettings?.kenBurnsHoverDuration ?? 8000,
    hoverScale: channelSettings?.kenBurnsHoverScale ?? 1.1,
    autoplayDuration: channelSettings?.kenBurnsAutoplayDuration ?? 12000,
    autoplayScale: channelSettings?.kenBurnsAutoplayScale ?? 1.15,
    slideshowDuration: channelSettings?.kenBurnsSlideshowDuration ?? 10000,
    slideshowScale: channelSettings?.kenBurnsSlideshowScale ?? 1.2,
    crossfadeDuration: channelSettings?.kenBurnsCrossfadeDuration ?? 1000,
    easing: channelSettings?.kenBurnsEasing || 'ease-out',
    animationType: channelSettings?.kenBurnsAnimationType || 'both',
    enableCrossfadeReturn: channelSettings?.kenBurnsCrossfadeReturn !== false,
    transitionType: channelSettings?.kenBurnsTransitionType || 'cross-dissolve',
    enableIntersectionObserver: true,
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

  const mediaPreview = useMemo(() => {
    if (!(effectiveMedia && effectiveMedia.url && effectiveMedia.url.trim())) return null;

    if (isGifMediaType(effectiveMedia.type) || effectiveMedia.url.match(/\.gif$/i)) {
      const kenBurnsForGifsEnabled = channelSettings?.kenBurnsForGifs ?? false;
      if (effectiveKenBurnsEnabled && kenBurnsForGifsEnabled) {
        return (
          <KenBurnsImage
            {...buildKenBurnsProps(channelSettings, effectiveKenBurnsMode, effectiveMedia.name || 'Channel GIF')}
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
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
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
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      );
    }

    if (isVideoMediaType(effectiveMedia.type)) {
      const kenBurnsForVideosEnabled = channelSettings?.kenBurnsForVideos ?? false;
      if (effectiveKenBurnsEnabled && kenBurnsForVideosEnabled) {
        return (
          <KenBurnsImage
            {...buildKenBurnsProps(channelSettings, effectiveKenBurnsMode, effectiveMedia.name || 'Channel Video')}
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
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
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
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
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
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      );
    }

    if (isRasterImageMediaType(effectiveMedia.type)) {
      if (effectiveKenBurnsEnabled) {
        return (
          <KenBurnsImage
            {...buildKenBurnsProps(channelSettings, effectiveKenBurnsMode, effectiveMedia.name || 'Channel Image')}
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
          style={{ display: imageError ? 'none' : 'block' }}
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

function arePropsEqual(prev, next) {
  return (
    prev.effectiveMedia?.url === next.effectiveMedia?.url &&
    prev.effectiveMedia?.type === next.effectiveMedia?.type &&
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
