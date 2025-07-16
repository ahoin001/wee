import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as ContextMenu from '@radix-ui/react-context-menu';
import ChannelModal from './ChannelModal';
import ImageSearchModal from './ImageSearchModal';
// import './Channel.css';

function Channel({ id, title, type, path, icon, empty, media, onMediaChange, onAppPathChange, onChannelSave, asAdmin, hoverSound, soundSettings }) {
  const fileInputRef = useRef();
  const exeInputRef = useRef();
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const hoverAudioRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  const handleClick = () => {
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
      if (soundSettings?.channelClick?.enabled && soundSettings?.channelClick?.file?.url) {
        const audio = new Audio(soundSettings.channelClick.file.url);
        audio.volume = soundSettings.channelClick.volume || 0.5;
        audio.play().catch(error => {
          console.log('Channel click sound playback failed:', error);
        });
      }
      window.api.launchApp({ type, path, asAdmin });
    }
  };

  const handleMouseEnter = () => {
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
        if (soundSettings?.channelHover?.enabled && soundSettings?.channelHover?.file?.url) {
          if (!hoverAudioRef.current) { // Only play if not already playing
            const audio = new Audio(soundSettings.channelHover.file.url);
            audio.volume = soundSettings.channelHover.volume || 0.3;
            audio.play().catch(error => {
              console.log('Channel hover sound playback failed:', error);
            });
            hoverAudioRef.current = audio;
          }
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

  let mediaPreview = null;
  if (media) {
    if (media.type.startsWith('image/')) {
      mediaPreview = <img src={media.url} alt={title || "Channel media"} className="channel-media" />;
    } else if (media.type.startsWith('video/')) {
      mediaPreview = <video src={media.url} className="channel-media" autoPlay loop muted />;
    }
  }

  const channelContent = (
    <div
      className={empty && !media ? "channel empty" : "channel"}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      role="button"
    >
      {mediaPreview || <img src={icon} alt={title} className="channel-media" />}
    </div>
  );

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          {channelContent}
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content className="context-menu-content" sideOffset={5} align="center">
            {empty ? (
              // Context menu for empty channels
              <>
                <ContextMenu.Item 
                  className="context-menu-item"
                  onClick={() => setShowImageSearch(true)}
                >
                  Add Image
                </ContextMenu.Item>
                <ContextMenu.Item 
                  className="context-menu-item"
                  onClick={() => exeInputRef.current?.click()}
                >
                  Set App Path
                </ContextMenu.Item>
                <ContextMenu.Item 
                  className="context-menu-item"
                  onClick={handleConfigure}
                >
                  Configure Channel
                </ContextMenu.Item>
              </>
            ) : (
              // Context menu for configured channels
              <>
                <ContextMenu.Item 
                  className="context-menu-item"
                  onClick={() => setShowImageSearch(true)}
                >
                  Change Image
                </ContextMenu.Item>
                <ContextMenu.Item 
                  className="context-menu-item"
                  onClick={() => exeInputRef.current?.click()}
                >
                  Change App Path
                </ContextMenu.Item>
                <ContextMenu.Item 
                  className="context-menu-item"
                  onClick={handleConfigure}
                >
                  Configure
                </ContextMenu.Item>
                <ContextMenu.Separator className="context-menu-separator" />
                <ContextMenu.Item 
                  className="context-menu-item"
                  onClick={handleClearChannel}
                >
                  Clear Channel
                </ContextMenu.Item>
              </>
            )}
          </ContextMenu.Content>
        </ContextMenu.Portal>
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
      </ContextMenu.Root>
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
  soundSettings: PropTypes.object,
};

export default Channel;
