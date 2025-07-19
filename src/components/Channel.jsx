import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as ContextMenu from '@radix-ui/react-context-menu';
import ReactFreezeframe from 'react-freezeframe-vite';
import ImageSearchModal from './ImageSearchModal';
import audioManager from '../utils/AudioManager';
import ResourceUsageIndicator from './ResourceUsageIndicator';
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

function Channel({ id, type, path, icon, empty, media, onMediaChange, onAppPathChange, onChannelSave, asAdmin, hoverSound, animatedOnHover: globalAnimatedOnHover, channelConfig, onHover, onOpenModal }) {
  const fileInputRef = useRef();
  const exeInputRef = useRef();
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mp4Preview, setMp4Preview] = useState(null);
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Determine which animatedOnHover setting to use
  const effectiveAnimatedOnHover = (channelConfig && channelConfig.animatedOnHover !== undefined)
    ? channelConfig.animatedOnHover
    : globalAnimatedOnHover;

  // Generate static preview for MP4s on mount or when media changes
  useEffect(() => {
    let video = null;
    let canvas = null;
    let handleLoadedData = null;
    
    if (media && media.type && media.type.startsWith('video/') && effectiveAnimatedOnHover && !mp4Preview) {
      // Create a static preview from the first frame
      video = document.createElement('video');
      video.src = media.url;
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
    } else if (!media || !media.type.startsWith('video/')) {
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
  }, [media, effectiveAnimatedOnHover, mp4Preview]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      audioManager.stopAllSounds();
    };
  }, []);



  const handleClick = async () => {
    // Stop hover sound immediately
    audioManager.stopAllSounds();
    
    if (empty) {
      setShowChannelModal(true);
    } else if (path) {
      // Play channel click sound if enabled
      try {
        const soundLibrary = await soundsApi.getLibrary();
        const enabledClickSound = soundLibrary.channelClick?.find(s => s.enabled);
        if (enabledClickSound) {
          await audioManager.playSound(enabledClickSound.url, enabledClickSound.volume ?? 0.5);
        }
      } catch (error) {
        console.log('Failed to load sound library:', error);
      }
      // Launch app or URL
      if (type === 'url' && path.startsWith('http')) {
        const immersivePip = (() => { try { return JSON.parse(localStorage.getItem('immersivePip')) || false; } catch { return false; } })();
        if (immersivePip && api.openPipWindow) {
          api.openPipWindow(path);
        } else if (api.openExternal) {
          api.openExternal(path);
        } else {
          window.open(path, '_blank'); // fallback for browser only
        }
      } else {
        console.log('Launching app:', { type, path, asAdmin });
        api.launchApp({ type, path, asAdmin });
      }
    }
  };

  const handleMouseEnter = async () => {
    // Call the parent hover handler for auto-fade
    if (onHover) {
      onHover();
    }
    
    // Play per-channel hover sound if set, else global
    if (!empty && path) {
      console.log('Channel: Hover sound data:', hoverSound);
      if (hoverSound && hoverSound.url) {
        // Play custom hover sound once
        await audioManager.playSound(hoverSound.url, hoverSound.volume || 0.7);
      } else {
        try {
          const soundLibrary = await soundsApi.getLibrary();
          const enabledHoverSound = soundLibrary.channelHover?.find(s => s.enabled);
          if (enabledHoverSound) {
            await audioManager.playSound(enabledHoverSound.url, enabledHoverSound.volume ?? 0.3);
          }
        } catch (error) {
          console.log('Failed to load sound library:', error);
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

  const handleImageSelect = (img) => {
    if (onMediaChange) {
      onMediaChange(id, {
        url: img.url,
        type: img.format === 'image' ? 'image/png' : img.format === 'gif' ? 'image/gif' : img.format === 'mp4' ? 'video/mp4' : '',
        name: img.name,
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
    if (onOpenModal) {
      onOpenModal();
    }
  };

  let mediaPreview = null;
  if (media) {
    if (media.type.startsWith('image/')) {
      mediaPreview = <img src={media.url} alt="Channel media" className="channel-media" />;
    } else if (media.type.startsWith('video/')) {
      if (effectiveAnimatedOnHover) {
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
              src={media.url}
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
        mediaPreview = <video src={media.url} className="channel-media" autoPlay loop muted playsInline style={{ objectFit: 'cover', width: '100%', height: '100%' }} />;
      }
    } else if (media.type === 'image/gif' || (media.url && media.url.match(/\.gif$/i))) {
      if (effectiveAnimatedOnHover) {
        // Use ReactFreezeframe for GIFs when hover animation is enabled
        mediaPreview = (
          <ReactFreezeframe
            key={media.url} // Force re-render when URL changes
            src={media.url}
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
            src={media.url}
            alt="Channel media"
            className="channel-media"
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        );
      }
    }
  }

  const channelContent = (
    <div
      className={empty && !media ? "channel empty" : "channel"}
      data-channel-id={id}
      onClick={handleClick}
      onMouseEnter={e => { handleMouseEnter(e); setIsHovered(true); }}
      onMouseLeave={e => { handleMouseLeave(e); setIsHovered(false); }}
      tabIndex={0}
      role="button"
      onContextMenu={handleRightClick}
    >
      {mediaPreview || <img src={icon} alt="" className="channel-media" />}
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
}

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
  onOpenModal: PropTypes.func,
};

export default Channel;
