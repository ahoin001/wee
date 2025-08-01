import React, { useRef, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import * as ContextMenu from '@radix-ui/react-context-menu';
import ReactFreezeframe from 'react-freezeframe-vite';
import ImageSearchModal from './ImageSearchModal';
import audioManager from '../utils/AudioManager';
import ResourceUsageIndicator from './ResourceUsageIndicator';
import KenBurnsImage from './KenBurnsImage';
import useChannelStore from '../utils/useChannelStore';
import './Channel.css';

// Guard for window.api to prevent errors in browser
const api = window.api || {
  launchApp: () => {},
  openExternal: (url) => window.open(url, '_blank'), // fallback for browser
  openPipWindow: (url) => {},
};

const soundsApi = window.api?.sounds || {
  get: async () => ({}),
  getLibrary: async () => ({}),
};

const Channel = React.memo(({ id, type, path, icon, empty, media, onMediaChange, onAppPathChange, onChannelSave, asAdmin, hoverSound, animatedOnHover: globalAnimatedOnHover, channelConfig, onHover, animationStyle, adaptiveEmptyChannels, kenBurnsEnabled: globalKenBurnsEnabled, kenBurnsMode: globalKenBurnsMode, idleAnimationClass, isIdleAnimating }) => {
  const fileInputRef = useRef();
  const exeInputRef = useRef();
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mp4Preview, setMp4Preview] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [fallbackIcon, setFallbackIcon] = useState(null);
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Get channel data from Zustand store
  const { getChannelConfig, isChannelEmpty, setChannel, openChannelModal } = useChannelStore();
  const storeChannelConfig = getChannelConfig(id);
  const storeIsEmpty = isChannelEmpty(id);
  
  // Use store data if available, fallback to props for backward compatibility
  const effectiveConfig = storeChannelConfig || channelConfig;
  const effectiveIsEmpty = storeChannelConfig ? storeIsEmpty : empty;
  const effectiveMedia = storeChannelConfig?.media || media;
  const effectivePath = storeChannelConfig?.path || path;
  const effectiveType = storeChannelConfig?.type || type;
  const effectiveAsAdmin = storeChannelConfig?.asAdmin || asAdmin;
  const effectiveHoverSound = storeChannelConfig?.hoverSound || hoverSound;
  
  // Determine which animatedOnHover setting to use
  // Note: animatedOnHover = true means "only play on hover", false means "autoplay"
  const effectiveAnimatedOnHover = (effectiveConfig && effectiveConfig.animatedOnHover !== undefined)
    ? effectiveConfig.animatedOnHover
    : globalAnimatedOnHover;
  
  // Determine Ken Burns settings (channel-specific overrides global)
  const effectiveKenBurnsEnabled = (effectiveConfig && effectiveConfig.kenBurnsEnabled !== undefined)
    ? effectiveConfig.kenBurnsEnabled
    : globalKenBurnsEnabled;
    
  const effectiveKenBurnsMode = (effectiveConfig && effectiveConfig.kenBurnsMode !== undefined)
    ? effectiveConfig.kenBurnsMode
    : globalKenBurnsMode;
  
  // console.log('Channel', id, 'effectiveAnimatedOnHover:', effectiveAnimatedOnHover, 'globalAnimatedOnHover:', globalAnimatedOnHover, 'channelConfig:', channelConfig);

  // Handle image loading errors
  const handleImageError = useCallback((e) => {
    console.warn('Channel image failed to load:', effectiveMedia?.url, 'for channel:', id);
    setImageError(true);
    
    // Try to use fallback icon if available
    if (icon && icon !== effectiveMedia?.url) {
      setFallbackIcon(icon);
    }
    
    // Prevent default broken image display
    e.target.style.display = 'none';
  }, [effectiveMedia?.url, icon, id]);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
    setFallbackIcon(null);
  }, []);

  // Reset error state when media changes
  useEffect(() => {
    setImageError(false);
    setFallbackIcon(null);
  }, [effectiveMedia?.url]);

  // Generate static preview for MP4s on mount or when media changes
  useEffect(() => {
    let video = null;
    let canvas = null;
    let handleLoadedData = null;
    
    if (effectiveMedia && effectiveMedia.type && effectiveMedia.type.startsWith('video/') && effectiveAnimatedOnHover && !mp4Preview) {
      // Create a static preview from the first frame
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
        } catch (e) {
          setMp4Preview(null);
        }
      };
      
      video.addEventListener('loadeddata', handleLoadedData, { once: true });
      // Seek to 0 to ensure first frame
      video.currentTime = 0;
    } else if (!effectiveMedia || typeof effectiveMedia.type !== 'string' || !effectiveMedia.type.startsWith('video/')) {
      setMp4Preview(null);
    }

    // Cleanup function
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
  }, [effectiveMedia, effectiveAnimatedOnHover, mp4Preview]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      audioManager.stopAllSounds();
    };
  }, []);

  // Animation logic
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


  const handleClick = async () => {
    // Stop hover sound immediately
    audioManager.stopAllSounds();
    
    // Determine if channel is empty based on channelConfig, not the empty prop
    const isChannelEmpty = !effectiveConfig || (!effectiveConfig.media && !effectiveConfig.path);
    
    console.log('[Channel] Clicked channel:', id, {
      empty,
      isChannelEmpty,
      path,
      type,
      media: media?.url,
      channelConfig: effectiveConfig
    });
    
    if (isChannelEmpty) {
      setShowChannelModal(true);
    } else if (effectivePath) {
      // Play channel click sound if enabled
      try {
        const soundLibrary = await soundsApi.getLibrary();
        const enabledClickSound = soundLibrary.channelClick?.find(s => s.enabled);
        if (enabledClickSound) {
          await audioManager.playSound(enabledClickSound.url, enabledClickSound.volume ?? 0.5);
        }
      } catch (error) {
        console.warn('Failed to load sound library:', error);
      }
      // Launch app or URL
      if (effectiveType === 'url' && effectivePath.startsWith('http')) {
        const immersivePip = (() => { try { return JSON.parse(localStorage.getItem('immersivePip')) || false; } catch { return false; } })();
        if (immersivePip && api.openPipWindow) {
          api.openPipWindow(effectivePath);
        } else if (api.openExternal) {
          api.openExternal(effectivePath);
        } else {
          window.open(effectivePath, '_blank'); // fallback for browser only
        }
      } else {

        api.launchApp({ type: effectiveType, path: effectivePath, asAdmin: effectiveAsAdmin });
      }
    }
  };

  const handleMouseEnter = async () => {
    // Call the parent hover handler for auto-fade
    if (onHover) {
      onHover();
    }
    
    // Determine if channel is empty based on channelConfig
    const isChannelEmpty = !effectiveConfig || (!effectiveConfig.media && !effectiveConfig.path);
    
    // Play per-channel hover sound if set, else global
    if (!isChannelEmpty && effectivePath) {
      // console.log('Channel: Hover sound data:', hoverSound);
      if (effectiveHoverSound && effectiveHoverSound.url) {
        // Play custom hover sound once
        await audioManager.playSound(effectiveHoverSound.url, effectiveHoverSound.volume || 0.7);
      } else {
        try {
          const soundLibrary = await soundsApi.getLibrary();
          const enabledHoverSound = soundLibrary.channelHover?.find(s => s.enabled);
          if (enabledHoverSound) {
            await audioManager.playSound(enabledHoverSound.url, enabledHoverSound.volume ?? 0.3);
          }
        } catch (error) {
          console.warn('Failed to load sound library:', error);
        }
      }
    }
  };

  const handleMouseLeave = () => {
    // Stop all sounds (including hover sounds)
    audioManager.stopAllSounds();
  };

  const handleChannelSave = (channelId, channelData) => {
    if (onChannelSave) {
      onChannelSave(channelId, channelData);
    }
  };

  const handleConfigure = () => {
    setShowChannelModal(true);
  };

  const handleClearChannel = () => {
    // Clear the channel configuration completely
    if (onChannelSave) {
      onChannelSave(id, null); // Pass null to indicate complete reset
    }
    // Also clear media and path maps
    if (onMediaChange) {
      onMediaChange(id, null);
    }
    if (onAppPathChange) {
      onAppPathChange(id, '');
    }
  };

  const handleImageSelect = (mediaItem) => {
    if (onMediaChange) {
      console.log('[handleImageSelect]', mediaItem);
      // Convert Supabase media item to the format expected by Channel component
      const mediaUrl = `https://bmlcydwltfexgbsyunkf.supabase.co/storage/v1/object/public/media-library/${mediaItem.file_url}`;
      
      // Determine MIME type based on file_type
      let mimeType = 'image/png'; // default
      if (mediaItem.file_type === 'gif') {
        mimeType = 'image/gif';
      } else if (mediaItem.file_type === 'video') {
        mimeType = 'video/mp4';
      } else if (mediaItem.mime_type) {
        mimeType = mediaItem.mime_type;
      }
      
      onMediaChange(id, {
        url: mediaUrl,
        type: mimeType,
        name: mediaItem.title || mediaItem.file_url,
        isBuiltin: true
      });
    }
    setShowImageSearch(false);
  };
  const handleUploadClick = () => {
    setShowImageSearch(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    openChannelModal(id);
  };

  let mediaPreview = null;
  if (effectiveMedia && effectiveMedia.url && effectiveMedia.url.trim()) {
    // Check for GIFs first (before general image types)
    if (effectiveMedia.type === 'image/gif' || effectiveMedia.url.match(/\.gif$/i)) {
      // Check if Ken Burns is enabled for GIFs
      const kenBurnsForGifsEnabled = window.settings?.kenBurnsForGifs ?? false;
      
      if (effectiveKenBurnsEnabled && kenBurnsForGifsEnabled) {
        // Use Ken Burns effect for GIFs
        const kenBurnsProps = {
          mode: effectiveKenBurnsMode,
          width: "100%",
          height: "100%",
          borderRadius: "12px",
          objectFit: "cover",
          alt: effectiveMedia.name || 'Channel GIF',
          
          // Use advanced settings from global configuration
          hoverDuration: window.settings?.kenBurnsHoverDuration ?? 8000,
          hoverScale: window.settings?.kenBurnsHoverScale ?? 1.1,
          autoplayDuration: window.settings?.kenBurnsAutoplayDuration ?? 12000,
          autoplayScale: window.settings?.kenBurnsAutoplayScale ?? 1.15,
          slideshowDuration: window.settings?.kenBurnsSlideshowDuration ?? 10000,
          slideshowScale: window.settings?.kenBurnsSlideshowScale ?? 1.2,
          crossfadeDuration: window.settings?.kenBurnsCrossfadeDuration ?? 1000,
          
          // Animation easing
          easing: window.settings?.kenBurnsEasing || 'ease-out',
          
          // Animation type and effects
          animationType: window.settings?.kenBurnsAnimationType || 'both',
          enableCrossfadeReturn: window.settings?.kenBurnsCrossfadeReturn !== false,
          transitionType: window.settings?.kenBurnsTransitionType || 'cross-dissolve',
          
          // Performance settings
          enableIntersectionObserver: true
        };

        mediaPreview = (
          <KenBurnsImage
            {...kenBurnsProps}
            src={effectiveMedia.url}
          />
        );
      } else if (effectiveAnimatedOnHover) {
        // Use ReactFreezeframe for GIFs when hover animation is enabled
        mediaPreview = (
          <ReactFreezeframe
            key={effectiveMedia.url} // Force re-render when URL changes
            src={effectiveMedia.url}
            alt="Channel media"
            className="channel-media"
            style={{ 
              objectFit: 'cover', 
              width: '100%', 
              height: '100%' 
            }}
            options={{
              trigger: 'hover',
              overlay: false,
              responsive: true,
              warnings: false
            }}
          />
        );
      } else {
        // Show normal GIF (always animated) when hover animation is disabled
        mediaPreview = (
          <img
            src={effectiveMedia.url}
            alt="Channel media"
            className="channel-media"
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        );
      }
    } else if (effectiveMedia.type.startsWith('video/')) {
      // Check if Ken Burns is enabled for videos
      const kenBurnsForVideosEnabled = window.settings?.kenBurnsForVideos ?? false;
      
      if (effectiveKenBurnsEnabled && kenBurnsForVideosEnabled) {
        // Use Ken Burns effect for videos
        const kenBurnsProps = {
          mode: effectiveKenBurnsMode,
          width: "100%",
          height: "100%",
          borderRadius: "12px",
          objectFit: "cover",
          alt: effectiveMedia.name || 'Channel Video',
          
          // Use advanced settings from global configuration
          hoverDuration: window.settings?.kenBurnsHoverDuration ?? 8000,
          hoverScale: window.settings?.kenBurnsHoverScale ?? 1.1,
          autoplayDuration: window.settings?.kenBurnsAutoplayDuration ?? 12000,
          autoplayScale: window.settings?.kenBurnsAutoplayScale ?? 1.15,
          slideshowDuration: window.settings?.kenBurnsSlideshowDuration ?? 10000,
          slideshowScale: window.settings?.kenBurnsSlideshowScale ?? 1.2,
          crossfadeDuration: window.settings?.kenBurnsCrossfadeDuration ?? 1000,
          
          // Animation easing
          easing: window.settings?.kenBurnsEasing || 'ease-out',
          
          // Animation type and effects
          animationType: window.settings?.kenBurnsAnimationType || 'both',
          enableCrossfadeReturn: window.settings?.kenBurnsCrossfadeReturn !== false,
          transitionType: window.settings?.kenBurnsTransitionType || 'cross-dissolve',
          
          // Performance settings
          enableIntersectionObserver: true
        };

        mediaPreview = (
          <KenBurnsImage
            {...kenBurnsProps}
            src={effectiveMedia.url}
          />
        );
      } else if (effectiveAnimatedOnHover) {
        if (!isHovered && mp4Preview) {
          // Show static preview image
          mediaPreview = (
            <img
              src={mp4Preview}
              alt="Channel preview"
              className="channel-media"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              onMouseEnter={() => setIsHovered(true)}
              onFocus={() => setIsHovered(true)}
              tabIndex={0}
            />
          );
        } else {
          // Show video on hover
          mediaPreview = (
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
      } else {
        mediaPreview = <video src={effectiveMedia.url} className="channel-media" autoPlay loop muted playsInline style={{ objectFit: 'cover', width: '100%', height: '100%' }} />;
      }
    } else if (effectiveMedia.type.startsWith('image/')) {
      // Handle other image types (PNG, JPG, etc.)
      if (effectiveKenBurnsEnabled) {
        // Use Ken Burns effect for static images
        const kenBurnsProps = {
          mode: effectiveKenBurnsMode,
          width: "100%",
          height: "100%",
          borderRadius: "12px",
          objectFit: "cover",
          alt: effectiveMedia.name || 'Channel Image',
          
          // Use advanced settings from global configuration
          hoverDuration: window.settings?.kenBurnsHoverDuration ?? 8000,
          hoverScale: window.settings?.kenBurnsHoverScale ?? 1.1,
          autoplayDuration: window.settings?.kenBurnsAutoplayDuration ?? 12000,
          autoplayScale: window.settings?.kenBurnsAutoplayScale ?? 1.15,
          slideshowDuration: window.settings?.kenBurnsSlideshowDuration ?? 10000,
          slideshowScale: window.settings?.kenBurnsSlideshowScale ?? 1.2,
          crossfadeDuration: window.settings?.kenBurnsCrossfadeDuration ?? 1000,
          
          // Animation easing
          easing: window.settings?.kenBurnsEasing || 'ease-out',
          
          // Animation type and effects
          animationType: window.settings?.kenBurnsAnimationType || 'both',
          enableCrossfadeReturn: window.settings?.kenBurnsCrossfadeReturn !== false,
          transitionType: window.settings?.kenBurnsTransitionType || 'cross-dissolve',
          
          // Performance settings
          enableIntersectionObserver: true
        };

        // FEATURE NOT READY: Gallery mode disabled, only single images
        // Single image Ken Burns (gallery feature not ready)
        mediaPreview = (
          <KenBurnsImage
            {...kenBurnsProps}
            src={effectiveMedia.url}
          />
        );
      } else {
        // Regular static image without Ken Burns
        mediaPreview = (
          <img 
            src={effectiveMedia.url} 
            alt="Channel media" 
            className="channel-media" 
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{ display: imageError ? 'none' : 'block' }}
          />
        );
      }
    }
  }

  const channelContent = (
    <div
      className={
        effectiveIsEmpty && !effectiveMedia 
          ? `channel empty${adaptiveEmptyChannels && window.settings?.ribbonColor ? ' adaptive' : ''}${idleAnimationClass ? ' ' + idleAnimationClass : ''}` 
          : `channel${animClass && animClass !== 'none' ? ' channel-anim-' + animClass : ''}${idleAnimationClass ? ' ' + idleAnimationClass : ''}`
      }
      data-channel-id={id}
      onClick={handleClick}
      onMouseEnter={e => { handleMouseEnter(e); setIsHovered(true); }}
      onMouseLeave={e => { handleMouseLeave(e); setIsHovered(false); }}
      tabIndex={0}
      role="button"
      onContextMenu={handleRightClick}
      style={{
        ...(effectiveIsEmpty && !effectiveMedia && adaptiveEmptyChannels && window.settings?.ribbonColor && {
          '--adaptive-bg-color': window.settings.ribbonColor,
        })
      }}
    >
      {/* Show media preview if available and no error */}
      {!imageError && mediaPreview}
      
      {/* Show fallback icon if main media failed */}
      {imageError && fallbackIcon && (
        <img 
          src={fallbackIcon} 
          alt="Channel fallback" 
          className="channel-media" 
          onError={(e) => {
            console.warn('Fallback icon also failed to load:', fallbackIcon);
            e.target.style.display = 'none';
          }}
        />
      )}
      
      {/* Show original icon if no media or as final fallback */}
      {!mediaPreview && !imageError && icon && icon.trim() && (
        <img 
          src={icon} 
          alt="" 
          className="channel-media"
          onError={(e) => {
            console.warn('Channel icon failed to load:', icon);
            e.target.style.display = 'none';
          }}
        />
      )}
    </div>
  );

  return (
    <>
          {channelContent}
        <input
          type="file"
          accept="image/*,video/mp4"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file && onMediaChange) {
              onMediaChange(id, file);
            }
            e.target.value = '';
          }}
        />
        <input
          type="file"
          accept=".exe"
          style={{ display: 'none' }}
          ref={exeInputRef}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file && onAppPathChange) {
              onAppPathChange(id, file.path);
            }
            e.target.value = '';
          }}
        />
      {showImageSearch && (
        <ImageSearchModal
          onClose={() => setShowImageSearch(false)}
          onSelect={handleImageSelect}
          onUploadClick={handleUploadClick}
        />
      )}

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
  animatedOnHover: PropTypes.bool,
  onHover: PropTypes.func,
  animationStyle: PropTypes.oneOf(['none', 'pulse', 'bounce', 'wiggle', 'glow', 'parallax', 'random']),
  adaptiveEmptyChannels: PropTypes.bool,
  kenBurnsEnabled: PropTypes.bool,
  kenBurnsMode: PropTypes.oneOf(['hover', 'autoplay']),
  idleAnimationClass: PropTypes.string,
  isIdleAnimating: PropTypes.bool,
};

export default Channel;
