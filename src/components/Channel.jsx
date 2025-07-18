import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as ContextMenu from '@radix-ui/react-context-menu';
import ChannelModal from './ChannelModal';
import ImageSearchModal from './ImageSearchModal';
// import './Channel.css';

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

function Channel({ id, type, path, icon, empty, media, onMediaChange, onAppPathChange, onChannelSave, asAdmin, hoverSound, animatedOnHover: globalAnimatedOnHover, channelConfig }) {
  const fileInputRef = useRef();
  const exeInputRef = useRef();
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const hoverAudioRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mp4Preview, setMp4Preview] = useState(null);
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Generate static preview for MP4s on mount or when media changes
  useEffect(() => {
    if (media && media.type && media.type.startsWith('video/') && globalAnimatedOnHover && !mp4Preview) {
      // Create a static preview from the first frame
      const video = document.createElement('video');
      video.src = media.url;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.addEventListener('loadeddata', () => {
        const canvas = document.createElement('canvas');
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
      }, { once: true });
      // Seek to 0 to ensure first frame
      video.currentTime = 0;
    } else if (!media || !media.type.startsWith('video/')) {
      setMp4Preview(null);
    }
  }, [media, globalAnimatedOnHover]);

  const handleClick = async () => {
    if (hoverAudioRef.current) {
      // Fade out and stop hover sound on click
      let v = hoverAudioRef.current.volume;
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = setInterval(() => {
        v -= 0.07;
        if (v > 0) {
          hoverAudioRef.current.volume = Math.max(v, 0);
        } else {
          clearInterval(fadeIntervalRef.current);
          hoverAudioRef.current.pause();
          hoverAudioRef.current = null;
        }
      }, 40);
    }
    if (empty) {
      setShowChannelModal(true);
    } else if (path) {
      // Play channel click sound if enabled
      try {
        const soundLibrary = await soundsApi.getLibrary();
        const enabledClickSound = soundLibrary.channelClick?.find(s => s.enabled);
        if (enabledClickSound) {
          const audio = new Audio(enabledClickSound.url);
          audio.volume = enabledClickSound.volume ?? 0.5;
        audio.play().catch(error => {
          console.log('Channel click sound playback failed:', error);
        });
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
        api.launchApp({ type, path, asAdmin });
      }
    }
  };

  const handleMouseEnter = async () => {
    // Play per-channel hover sound if set, else global
    if (!empty && path) {
      if (hoverSound && hoverSound.url) {
        if (!hoverAudioRef.current) { // Only play if not already playing
          const audio = new Audio(hoverSound.url);
          audio.volume = 0;
          audio.loop = true;
          audio.play();
          hoverAudioRef.current = audio;
          // Fade in
          let v = 0;
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = setInterval(() => {
            v += 0.07;
            if (audio.volume < (hoverSound.volume || 0.7)) {
              audio.volume = Math.min(v, hoverSound.volume || 0.7);
            } else {
              clearInterval(fadeIntervalRef.current);
            }
          }, 40);
        }
      } else {
        try {
          const soundLibrary = await soundsApi.getLibrary();
          const enabledHoverSound = soundLibrary.channelHover?.find(s => s.enabled);
          if (enabledHoverSound && !hoverAudioRef.current) {
            const audio = new Audio(enabledHoverSound.url);
            audio.volume = enabledHoverSound.volume ?? 0.3;
        audio.play().catch(error => {
          console.log('Channel hover sound playback failed:', error);
        });
            hoverAudioRef.current = audio;
          }
        } catch (error) {
          console.log('Failed to load sound library:', error);
        }
      }
    }
  };

  const handleMouseLeave = () => {
    // Fade out and stop per-channel hover sound
    if (hoverAudioRef.current) {
      let v = hoverAudioRef.current.volume;
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = setInterval(() => {
        v -= 0.07;
        if (v > 0) {
          hoverAudioRef.current.volume = Math.max(v, 0);
        } else {
          clearInterval(fadeIntervalRef.current);
          hoverAudioRef.current.pause();
          hoverAudioRef.current = null;
        }
      }, 40);
    }
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
    setShowChannelModal(true);
  };

  let mediaPreview = null;
  // Determine which animatedOnHover setting to use
  const effectiveAnimatedOnHover = (channelConfig && channelConfig.animatedOnHover !== undefined)
    ? channelConfig.animatedOnHover
    : globalAnimatedOnHover;
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
      if (effectiveAnimatedOnHover && media.staticPreview && !isHovered) {
        // Show static preview for GIF if available
        mediaPreview = (
          <img
            src={media.staticPreview}
            alt="Channel preview"
            className="channel-media"
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            onMouseEnter={() => setIsHovered(true)}
            onFocus={() => setIsHovered(true)}
            tabIndex={0}
          />
        );
      } else {
        // Show animated GIF (always, or on hover)
        mediaPreview = (
          <img
            src={media.url}
            alt="Channel media"
            className="channel-media"
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            onMouseLeave={effectiveAnimatedOnHover ? () => setIsHovered(false) : undefined}
            onBlur={effectiveAnimatedOnHover ? () => setIsHovered(false) : undefined}
            onMouseEnter={effectiveAnimatedOnHover ? () => setIsHovered(true) : undefined}
            onFocus={effectiveAnimatedOnHover ? () => setIsHovered(true) : undefined}
            tabIndex={effectiveAnimatedOnHover ? 0 : undefined}
          />
        );
      }
    }
  }

  const channelContent = (
    <div
      className={empty && !media ? "channel empty" : "channel"}
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
      {showChannelModal && (
        <ChannelModal
          channelId={id}
          onClose={() => setShowChannelModal(false)}
          onSave={handleChannelSave}
          currentMedia={media}
          currentPath={path}
          currentType={type}
          currentAsAdmin={asAdmin}
          currentAnimatedOnHover={channelConfig?.animatedOnHover}
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
};

export default Channel;
