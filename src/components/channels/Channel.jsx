import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './Channel.css';
import { getStoragePublicObjectUrl } from '../../utils/supabase';
import { isVideoMediaType } from '../../utils/channelMediaType';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import { useChannelSpaceKey } from '../../contexts/ChannelSpaceContext';
import { PlayfulTapLayer } from '../navigation/PlayfulInteractionMotion';
import { useRendererMediaPowerState } from '../../hooks/useRendererMediaPowerState';
import useChannelEffectiveState from './hooks/useChannelEffectiveState';
import useChannelInteractions from './hooks/useChannelInteractions';
import ChannelMediaPreview from './ChannelMediaPreview';
import ChannelModalsHost from './ChannelModalsHost';

const Channel = React.memo(({ 
  id, 
  type, 
  path, 
  icon, 
  empty, 
  media, 
  onMediaChange, 
  onAppPathChange, 
  onChannelSave, 
  asAdmin, 
  hoverSound, 
  channelConfig, 
  onHover, 
  animationStyle, 
  idleAnimationClass, 
  wiiMode = false
}) => {
  const fileInputRef = useRef();
  const exeInputRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [iconLoadError, setIconLoadError] = useState(false);
  const [fallbackIcon, setFallbackIcon] = useState(null);
  const videoRef = useRef(null);
  const { showLaunchError, beginLaunchFeedback, endLaunchFeedback } = useLaunchFeedback();
  const channelSpaceKey = useChannelSpaceKey();
  const {
    updateChannelConfig,
    updateChannelMedia,
    channelSettings,
    ribbonAccent,
    effectiveConfig,
    effectiveIsEmpty,
    effectiveMedia,
    effectivePath,
    effectiveType,
    effectiveAsAdmin,
    effectiveHoverSound,
    launchLabel,
    effectiveAnimatedOnHover,
    effectiveKenBurnsEnabled,
    effectiveKenBurnsMode,
    useAdaptiveEmptyChannels,
    adaptiveEmptyStyle,
    mp4Preview,
  } = useChannelEffectiveState({
    id,
    channelConfig,
    empty,
    media,
    path,
    type,
    asAdmin,
    hoverSound,
    wiiMode,
  });

  const {
    openHint,
    showChannelModal,
    setShowChannelModal,
    channelModalMounted,
    setChannelModalMounted,
    showImageSearch,
    setShowImageSearch,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    handleRightClick,
    handleChannelModalSave,
  } = useChannelInteractions({
    id,
    onHover,
    effectiveConfig,
    effectivePath,
    effectiveType,
    effectiveAsAdmin,
    effectiveHoverSound,
    effectiveMedia,
    launchLabel,
    beginLaunchFeedback,
    endLaunchFeedback,
    showLaunchError,
    onChannelSave,
    updateChannelConfig,
  });

  const { shouldPauseDecorativeVideo } = useRendererMediaPowerState();

  useEffect(() => {
    setImageError(false);
    setFallbackIcon(null);
    setIconLoadError(false);
  }, [effectiveMedia?.url]);

  // Pause decorative MP4 when the window is unfocused, hidden, or low-power mode is on.
  useEffect(() => {
    if (!effectiveMedia || !isVideoMediaType(effectiveMedia.type)) return undefined;
    const el = videoRef.current;
    if (!el) return undefined;
    const debugEnabled =
      import.meta.env.DEV &&
      typeof window !== 'undefined' &&
      (window.__WEE_DEBUG_CHANNEL_PREVIEW === true ||
        window.localStorage?.getItem('wee.debug.channelPreview') === '1');

    if (shouldPauseDecorativeVideo) {
      el.pause();
      if (debugEnabled) {
        console.debug('[ChannelPreviewDebug] videoPaused', {
          channelId: id,
          reason: 'decorative-power-state',
          isHovered,
          animatedOnHover: effectiveAnimatedOnHover,
          mediaType: effectiveMedia?.type,
        });
      }
      return undefined;
    }

    if (effectiveAnimatedOnHover) {
      if (isHovered) {
        el.play?.().catch(() => {});
        if (debugEnabled) {
          console.debug('[ChannelPreviewDebug] videoPlayAttempt', {
            channelId: id,
            reason: 'hover-play',
            isHovered,
            animatedOnHover: effectiveAnimatedOnHover,
            mediaType: effectiveMedia?.type,
          });
        }
      } else {
        el.pause();
        if (debugEnabled) {
          console.debug('[ChannelPreviewDebug] videoPaused', {
            channelId: id,
            reason: 'hover-idle',
            isHovered,
            animatedOnHover: effectiveAnimatedOnHover,
            mediaType: effectiveMedia?.type,
          });
        }
      }
    } else {
      el.play?.().catch(() => {});
      if (debugEnabled) {
        console.debug('[ChannelPreviewDebug] videoPlayAttempt', {
          channelId: id,
          reason: 'always-play',
          isHovered,
          animatedOnHover: effectiveAnimatedOnHover,
          mediaType: effectiveMedia?.type,
        });
      }
    }
    return undefined;
  }, [
    id,
    shouldPauseDecorativeVideo,
    effectiveMedia,
    effectiveAnimatedOnHover,
    isHovered,
  ]);

  const [randomAnim, setRandomAnim] = useState(null);
  useEffect(() => {
    let timer;
    const anims = ['pulse', 'bounce', 'wiggle', 'glow', 'parallax', 'flip', 'swing', 'shake', 'pop', 'fade', 'slide', 'colorcycle', 'sparkle', 'heartbeat', 'orbit', 'wave', 'jelly', 'zoom', 'rotate', 'glowtrail'];
    if (animationStyle === 'random') {
      setRandomAnim(anims[Math.floor(Math.random() * anims.length)]);
    } else if (animationStyle === 'fullrandom') {
      const cycle = () => {
        setRandomAnim(anims[Math.floor(Math.random() * anims.length)]);
        timer = setTimeout(cycle, 2000 + Math.random() * 2000); // 2-4s
      };
      cycle();
      return () => clearTimeout(timer);
    }
  }, [animationStyle, id]);
  const animClass = (animationStyle === 'random' || animationStyle === 'fullrandom') ? randomAnim : animationStyle;

  const showRecentLaunchHint = Boolean(openHint);

  const handleImageSelect = (mediaItem) => {
    const mediaUrl = getStoragePublicObjectUrl('media-library', mediaItem.file_url);
    let mimeType = 'image/png'; // default
    if (mediaItem.file_type === 'gif') {
      mimeType = 'image/gif';
    } else if (mediaItem.file_type === 'video') {
      mimeType = 'video/mp4';
    } else if (mediaItem.mime_type) {
      mimeType = mediaItem.mime_type;
    }
    
    const mediaData = {
      url: mediaUrl,
      type: mimeType,
      name: mediaItem.title || mediaItem.file_url,
      isBuiltin: true,
    };

    updateChannelMedia(id, mediaData);

    if (onMediaChange) {
      onMediaChange(id, mediaData);
    }

    setShowImageSearch(false);
  };

  const handleUploadClick = () => {
    setShowImageSearch(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const channelContent = (
    <div
      className={
        effectiveIsEmpty && !effectiveMedia 
          ? `channel empty${useAdaptiveEmptyChannels && ribbonAccent?.ribbonColor ? ' adaptive' : ''}${wiiMode ? ' wii-mode-tile' : ''}${idleAnimationClass ? ' ' + idleAnimationClass : ''}` 
          : `channel${animClass && animClass !== 'none' ? ' channel-anim-' + animClass : ''}${wiiMode ? ' wii-mode-tile' : ''}${idleAnimationClass ? ' ' + idleAnimationClass : ''}${showRecentLaunchHint ? ' channel--recent-launch' : ''}`
      }
      data-channel-id={id}
      onClick={handleClick}
      onMouseEnter={e => { handleMouseEnter(e); setIsHovered(true); }}
      onMouseLeave={e => { handleMouseLeave(e); setIsHovered(false); }}
      tabIndex={0}
      role="button"
      onContextMenu={handleRightClick}
      title={showRecentLaunchHint ? 'Recently used — tap again to open or focus.' : undefined}
      style={adaptiveEmptyStyle}
    >
      <PlayfulTapLayer className="channel-tap-layer h-full w-full min-h-0 min-w-0">
        <ChannelMediaPreview
          effectiveMedia={effectiveMedia}
          effectiveAnimatedOnHover={effectiveAnimatedOnHover}
          effectiveKenBurnsEnabled={effectiveKenBurnsEnabled}
          effectiveKenBurnsMode={effectiveKenBurnsMode}
          channelSettings={channelSettings}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
          mp4Preview={mp4Preview}
          videoRef={videoRef}
          icon={icon}
          imageError={imageError}
          setImageError={setImageError}
                      iconLoadError={iconLoadError}
                      setIconLoadError={setIconLoadError}
          fallbackIcon={fallbackIcon}
          setFallbackIcon={setFallbackIcon}
        />
      </PlayfulTapLayer>
      {showRecentLaunchHint ? (
        <>
          <span className="channel-recent-hint-ring" aria-hidden />
          <span className="channel-recent-hint-pill">Recent</span>
        </>
      ) : null}
    </div>
  );

  return (
    <>
      {channelContent}
      <ChannelModalsHost
        id={id}
        fileInputRef={fileInputRef}
        exeInputRef={exeInputRef}
        onMediaChange={onMediaChange}
        onAppPathChange={onAppPathChange}
        showImageSearch={showImageSearch}
        setShowImageSearch={setShowImageSearch}
        handleImageSelect={handleImageSelect}
        handleUploadClick={handleUploadClick}
        channelModalMounted={channelModalMounted}
        showChannelModal={showChannelModal}
        setShowChannelModal={setShowChannelModal}
        setChannelModalMounted={setChannelModalMounted}
        handleChannelModalSave={handleChannelModalSave}
        channelSpaceKey={channelSpaceKey}
        effectiveMedia={effectiveMedia}
        effectivePath={effectivePath}
        effectiveType={effectiveType}
        effectiveHoverSound={effectiveHoverSound}
        effectiveAsAdmin={effectiveAsAdmin}
        effectiveConfig={effectiveConfig}
      />
    </>
  );
});

Channel.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
  path: PropTypes.string,
  icon: PropTypes.string,
  empty: PropTypes.bool,
  media: PropTypes.shape({
    url: PropTypes.string,
    type: PropTypes.string,
  }),
  onMediaChange: PropTypes.func,
  onAppPathChange: PropTypes.func,
  onChannelSave: PropTypes.func,
  asAdmin: PropTypes.bool,
  hoverSound: PropTypes.shape({
    url: PropTypes.string,
    volume: PropTypes.number,
  }),
  onHover: PropTypes.func,
  animationStyle: PropTypes.oneOf(['none', 'pulse', 'bounce', 'wiggle', 'glow', 'parallax', 'random']),
  idleAnimationClass: PropTypes.string,
  wiiMode: PropTypes.bool,
};

export default Channel;

