import React from 'react';
import PropTypes from 'prop-types';
// import './Channel.css';

function Channel({ id, title, type, path, icon, empty }) {
  if (empty) {
    return <div className="channel empty" tabIndex={-1}></div>;
  }
  const handleClick = () => {
    window.api.launchApp({ type, path });
  };
  return (
    <div className="channel" onClick={handleClick} tabIndex={0} role="button">
      <img src={icon} alt={title} className="channel-icon" />
      <div className="channel-title">{title}</div>
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
};

export default Channel;
