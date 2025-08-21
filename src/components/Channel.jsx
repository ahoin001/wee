import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as ContextMenu from '@radix-ui/react-context-menu';
import ReactFreezeframe from 'react-freezeframe-vite';
import ImageSearchModal from './ImageSearchModal';
import ChannelModal from './ChannelModal';

import ResourceUsageIndicator from './ResourceUsageIndicator';
import KenBurnsImage from './KenBurnsImage';
import { useChannelState, useRibbonState } from '../utils/useConsolidatedAppHooks';
import useChannelOperations from '../utils/useChannelOperations';
import useSoundManager from '../utils/useSoundManager';
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
  isIdleAnimating 
}) => {
  const fileInputRef = useRef();
  const exeInputRef = useRef();
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mp4Preview, setMp4Preview] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [fallbackIcon, setFallbackIcon] = useState(null);
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // ✅ DATA LAYER: Use the new channel operations hook
  const {
    getChannelConfig,
    isChannelEmpty,
    updateChannelConfig,
    updateChannelMedia,
    updateChannelPath,
    updateChannelIcon,
    updateChannelType
  } = useChannelOperations();
  
  const storeChannelConfig = getChannelConfig(id);
  const storeIsEmpty = isChannelEmpty(id);
  
  // ✅ DATA LAYER: Get ribbon state from consolidated store
  const { ribbon } = useRibbonState();
  const ribbonSettings = ribbon || {};
  
  // ✅ DATA LAYER: Get channel settings from consolidated store
  const { channels } = useChannelState();
  const channelSettings = channels?.settings || {};
  
  // Floating widget store
  const { ui } = useConsolidatedAppStore();
  
  // Auto-fade is now handled at grid level in PaginatedChannels
  
  // Use sound manager for centralized sound handling
  const { playChannelHoverSound, playChannelClickSound, stopAllSounds } = useSoundManager();
  
  // Memoize effective values to prevent unnecessary recalculations
  const effectiveConfig = useMemo(() => storeChannelConfig || channelConfig, [storeChannelConfig, channelConfig]);
  const effectiveIsEmpty = useMemo(() => storeChannelConfig ? storeIsEmpty : empty, [storeChannelConfig, storeIsEmpty, empty]);
  const effectiveMedia = useMemo(() => storeChannelConfig?.media || media, [storeChannelConfig?.media, media]);
  const effectivePath = useMemo(() => storeChannelConfig?.path || path, [storeChannelConfig?.path, path]);
  const effectiveType = useMemo(() => storeChannelConfig?.type || type, [storeChannelConfig?.type, type]);
  const effectiveAsAdmin = useMemo(() => storeChannelConfig?.asAdmin || asAdmin, [storeChannelConfig?.asAdmin, asAdmin]);
  const effectiveHoverSound = useMemo(() => storeChannelConfig?.hoverSound || hoverSound, [storeChannelConfig?.hoverSound, hoverSound]);
  
  // Memoize animation settings from consolidated store
  const effectiveAnimatedOnHover = useMemo(() => 
    (effectiveConfig && effectiveConfig.animatedOnHover !== undefined)
      ? effectiveConfig.animatedOnHover
      : channelSettings.animatedOnHover ?? false, 
    [effectiveConfig?.animatedOnHover, channelSettings.animatedOnHover]
  );
  
  const effectiveKenBurnsEnabled = useMemo(() => 
    (effectiveConfig && effectiveConfig.kenBurnsEnabled !== undefined)
      ? effectiveConfig.kenBurnsEnabled
      : channelSettings.kenBurnsEnabled ?? false, 
    [effectiveConfig?.kenBurnsEnabled, channelSettings.kenBurnsEnabled]
  );
    
  const effectiveKenBurnsMode = useMemo(() => 
    (effectiveConfig && effectiveConfig.kenBurnsMode !== undefined)
      ? effectiveConfig.kenBurnsMode
      : channelSettings.kenBurnsMode ?? 'hover', 
    [effectiveConfig?.kenBurnsMode, channelSettings.kenBurnsMode]
  );

  const effectiveAdaptiveEmptyChannels = useMemo(() => 
    (effectiveConfig && effectiveConfig.adaptiveEmptyChannels !== undefined)
      ? effectiveConfig.adaptiveEmptyChannels
      : channelSettings.adaptiveEmptyChannels ?? true, 
    [effectiveConfig?.adaptiveEmptyChannels, channelSettings.adaptiveEmptyChannels]
  );

  // Handle image loading errors
  const handleImageError = useCallback((e) => {
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
      stopAllSounds();
    };
  }, [stopAllSounds]);

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
    stopAllSounds();
    
    // Determine if channel is empty based on channelConfig, not the empty prop
    // A channel is considered empty if it has no path (regardless of media)
    const isChannelEmpty = !effectiveConfig || !effectiveConfig.path;
    
    // Handle API channels (Spotify, etc.)
    if (effectiveConfig?.isApiChannel && effectiveConfig?.apiConfig?.selectedApi) {
      // Play channel click sound if enabled
      await playChannelClickSound();
      
      // Handle different API types
      const apiType = effectiveConfig.apiConfig.selectedApi;
      
      if (apiType === 'spotify') {
        // Show floating widget for Spotify integration
        if (window.api?.ui?.showSpotifyWidget) {
          window.api.ui.showSpotifyWidget();
        } else {
          // Fallback: use consolidated store directly
          const { actions } = useConsolidatedAppStore.getState();
          actions.setFloatingWidgetsState({
            spotify: { visible: true }
          });
        }
      } else {
        // Future API integrations can be added here
      }
      
      return;
    }
    
    if (isChannelEmpty) {
      handleConfigure();
    } else if (effectivePath) {
      // Play channel click sound if enabled
      await playChannelClickSound();
      
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
    // Call the parent hover handler
    if (onHover) {
      onHover();
    }
    
    // Always try to play hover sounds if the channel has any content
    // This includes channels with paths, API channels, or channels with media
    const hasContent = effectivePath || effectiveConfig?.isApiChannel || effectiveMedia;
    
    if (hasContent) {
      // Use centralized sound manager for hover sounds
      await playChannelHoverSound(effectiveHoverSound);
    }
  };

  const handleMouseLeave = () => {
    // Stop all sounds (including hover sounds)
    stopAllSounds();
  };

  const handleChannelSave = (channelId, channelData) => {
    updateChannelConfig(channelId, channelData);
    if (onChannelSave) {
      onChannelSave(channelId, channelData);
    }
  };

  const handleConfigure = () => {
    setShowChannelModal(true);
  };

  const handleChannelModalSave = (channelId, channelData) => {
    updateChannelConfig(channelId, channelData);
    if (onChannelSave) {
      onChannelSave(channelId, channelData);
    }
  };

  const handleClearChannel = () => {
    // Clear the channel configuration completely
    updateChannelConfig(id, {
      media: null,
      path: null,
      icon: null,
      type: null,
      empty: true
    });
    
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
    
    const mediaData = {
      url: mediaUrl,
      type: mimeType,
      name: mediaItem.title || mediaItem.file_url,
      isBuiltin: true
    };
    
    // Update channel media in consolidated store
    updateChannelMedia(id, mediaData);
    
    // Call legacy callback if provided
    if (onMediaChange) {
      onMediaChange(id, mediaData);
    }
    
    setShowImageSearch(false);
  };
  const handleUploadClick = () => {
    setShowImageSearch(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowChannelModal(true);
  };

  let mediaPreview = null;
  if (effectiveMedia && effectiveMedia.url && effectiveMedia.url.trim()) {
    // Check for GIFs first (before general image types)
    if (effectiveMedia.type === 'image/gif' || effectiveMedia.url.match(/\.gif$/i)) {
      // Check if Ken Burns is enabled for GIFs
      const kenBurnsForGifsEnabled = channelSettings?.kenBurnsForGifs ?? false;
      
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
          hoverDuration: channelSettings?.kenBurnsHoverDuration ?? 8000,
          hoverScale: channelSettings?.kenBurnsHoverScale ?? 1.1,
          autoplayDuration: channelSettings?.kenBurnsAutoplayDuration ?? 12000,
          autoplayScale: channelSettings?.kenBurnsAutoplayScale ?? 1.15,
          slideshowDuration: channelSettings?.kenBurnsSlideshowDuration ?? 10000,
          slideshowScale: channelSettings?.kenBurnsSlideshowScale ?? 1.2,
          crossfadeDuration: channelSettings?.kenBurnsCrossfadeDuration ?? 1000,
          
          // Animation easing
          easing: channelSettings?.kenBurnsEasing || 'ease-out',
          
          // Animation type and effects
          animationType: channelSettings?.kenBurnsAnimationType || 'both',
          enableCrossfadeReturn: channelSettings?.kenBurnsCrossfadeReturn !== false,
          transitionType: channelSettings?.kenBurnsTransitionType || 'cross-dissolve',
          
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
      const kenBurnsForVideosEnabled = channelSettings?.kenBurnsForVideos ?? false;
      
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
          hoverDuration: channelSettings?.kenBurnsHoverDuration ?? 8000,
          hoverScale: channelSettings?.kenBurnsHoverScale ?? 1.1,
          autoplayDuration: channelSettings?.kenBurnsAutoplayDuration ?? 12000,
          autoplayScale: channelSettings?.kenBurnsAutoplayScale ?? 1.15,
          slideshowDuration: channelSettings?.kenBurnsSlideshowDuration ?? 10000,
          slideshowScale: channelSettings?.kenBurnsSlideshowScale ?? 1.2,
          crossfadeDuration: channelSettings?.kenBurnsCrossfadeDuration ?? 1000,
          
          // Animation easing
          easing: channelSettings?.kenBurnsEasing || 'ease-out',
          
          // Animation type and effects
          animationType: channelSettings?.kenBurnsAnimationType || 'both',
          enableCrossfadeReturn: channelSettings?.kenBurnsCrossfadeReturn !== false,
          transitionType: channelSettings?.kenBurnsTransitionType || 'cross-dissolve',
          
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
          hoverDuration: channelSettings?.kenBurnsHoverDuration ?? 8000,
          hoverScale: channelSettings?.kenBurnsHoverScale ?? 1.1,
          autoplayDuration: channelSettings?.kenBurnsAutoplayDuration ?? 12000,
          autoplayScale: channelSettings?.kenBurnsAutoplayScale ?? 1.15,
          slideshowDuration: channelSettings?.kenBurnsSlideshowDuration ?? 10000,
          slideshowScale: channelSettings?.kenBurnsSlideshowScale ?? 1.2,
          crossfadeDuration: channelSettings?.kenBurnsCrossfadeDuration ?? 1000,
          
          // Animation easing
          easing: channelSettings?.kenBurnsEasing || 'ease-out',
          
          // Animation type and effects
          animationType: channelSettings?.kenBurnsAnimationType || 'both',
          enableCrossfadeReturn: channelSettings?.kenBurnsCrossfadeReturn !== false,
          transitionType: channelSettings?.kenBurnsTransitionType || 'cross-dissolve',
          
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
          ? `channel empty${effectiveAdaptiveEmptyChannels && ribbonSettings?.ribbonColor ? ' adaptive' : ''}${idleAnimationClass ? ' ' + idleAnimationClass : ''}` 
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
        ...(effectiveIsEmpty && !effectiveMedia && effectiveAdaptiveEmptyChannels && ribbonSettings?.ribbonColor && {
          '--adaptive-bg-color': ribbonSettings.ribbonColor,
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

      {showChannelModal && (
        <ChannelModal
          channelId={id}
          isOpen={showChannelModal}
          onClose={() => setShowChannelModal(false)}
          onSave={handleChannelModalSave}
          currentMedia={effectiveMedia}
          currentPath={effectivePath}
          currentType={effectiveType}
          currentHoverSound={effectiveHoverSound}
          currentAsAdmin={effectiveAsAdmin}
          currentAnimatedOnHover={effectiveConfig?.animatedOnHover}
          currentKenBurnsEnabled={effectiveConfig?.kenBurnsEnabled}
          currentKenBurnsMode={effectiveConfig?.kenBurnsMode}
        />
      )}

      {/* Spotify Music Channel Modal */}
      {/* Removed */}

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
  isIdleAnimating: PropTypes.bool,
};

export default Channel;
