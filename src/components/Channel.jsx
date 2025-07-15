import React, { useRef } from 'react';
import PropTypes from 'prop-types';
// import './Channel.css';

function Channel({ id, title, type, path, icon, empty, media, onMediaChange }) {
  const fileInputRef = useRef();

  if (empty) {
    return <div className="channel empty" tabIndex={-1}></div>;
  }

  const handleClick = () => {
    window.api.launchApp({ type, path });
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onMediaChange) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onMediaChange) {
      onMediaChange(id, file);
    }
    e.target.value = '';
  };

  let mediaPreview = null;
  if (media) {
    if (media.type.startsWith('image/')) {
      mediaPreview = <img src={media.url} alt={title} className="channel-media" />;
    } else if (media.type.startsWith('video/')) {
      mediaPreview = <video src={media.url} className="channel-media" autoPlay loop muted />;
    }
  }

  return (
    <div
      className="channel"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      tabIndex={0}
      role="button"
    >
      <input
        type="file"
        accept="image/*,video/mp4"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      {mediaPreview || <img src={icon} alt={title} className="channel-media" />}
    </div>
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
};

export default Channel;
