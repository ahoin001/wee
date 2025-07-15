import React from 'react';
import PropTypes from 'prop-types';

function NotificationsButton({ icon: CustomIcon, onClick }) {
  const defaultIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#666" strokeWidth="2" fill="none"/>
      <polyline points="22,6 12,13 2,6" stroke="#666" strokeWidth="2" fill="none"/>
    </svg>
  );

  return (
    <button className="circular-button notifications-button" onClick={onClick}>
      {CustomIcon || defaultIcon}
    </button>
  );
}

NotificationsButton.propTypes = {
  icon: PropTypes.element,
  onClick: PropTypes.func,
};

export default NotificationsButton; 