import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import * as ContextMenu from '@radix-ui/react-context-menu';
// import './Channel.css';

function Channel({ id, title, type, path, icon, empty, media, onMediaChange, onAppPathChange }) {
  const fileInputRef = useRef();
  const exeInputRef = useRef();

  const handleClick = () => {
    if (path) {
      window.api.launchApp({ type: 'exe', path });
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
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {channelContent}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="context-menu-content" sideOffset={5} align="center">
          <ContextMenu.Item 
            className="context-menu-item"
            onClick={() => fileInputRef.current?.click()}
          >
            {media ? 'Change Image' : 'Add Image'}
          </ContextMenu.Item>
          <ContextMenu.Item 
            className="context-menu-item"
            onClick={() => exeInputRef.current?.click()}
          >
            {path ? 'Change App Path' : 'Set App Path'}
          </ContextMenu.Item>
          <ContextMenu.Item className="context-menu-item">
            Add Channel
          </ContextMenu.Item>
          <ContextMenu.Item className="context-menu-item">
            Configure
          </ContextMenu.Item>
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
};

export default Channel;
