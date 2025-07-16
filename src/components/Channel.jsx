import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as ContextMenu from '@radix-ui/react-context-menu';
import ChannelModal from './ChannelModal';
// import './Channel.css';

function Channel({ id, title, type, path, icon, empty, media, onMediaChange, onAppPathChange, onChannelSave }) {
  const fileInputRef = useRef();
  const exeInputRef = useRef();
  const [showChannelModal, setShowChannelModal] = useState(false);

  const handleClick = () => {
    if (empty) {
      // Only open configuration modal for empty channels
      setShowChannelModal(true);
    } else if (path) {
      // Play channel click sound if enabled
      const soundSettings = JSON.parse(localStorage.getItem('wiiDesktopSoundSettings') || '{}');
      if (soundSettings.channelClick?.enabled && soundSettings.channelClick?.file?.url) {
        const audio = new Audio(soundSettings.channelClick.file.url);
        audio.volume = soundSettings.channelClick.volume || 0.5;
        audio.play().catch(error => {
          console.log('Channel click sound playback failed:', error);
        });
      }
      
      window.api.launchApp({ type, path });
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
                  onClick={() => fileInputRef.current?.click()}
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
                  onClick={() => fileInputRef.current?.click()}
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

      {showChannelModal && (
        <ChannelModal
          channelId={id}
          onClose={() => setShowChannelModal(false)}
          onSave={handleChannelSave}
          currentMedia={media}
          currentPath={path}
          currentType={type}
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
};

export default Channel;
