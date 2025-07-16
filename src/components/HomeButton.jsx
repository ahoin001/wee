import React from 'react';
import PropTypes from 'prop-types';

function HomeButton({ icon: CustomIcon, onClick }) {
  const defaultIcon = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 9V22H22V9L12 2Z" stroke="#666" strokeWidth="2" fill="none"/>
      <path d="M9 22V12H15V22" stroke="#666" strokeWidth="2" fill="none"/>
    </svg>
  );

  return (
    <button className="circular-button home-button" onClick={onClick}>
      {CustomIcon || defaultIcon}
    </button>
  );
}

HomeButton.propTypes = {
  icon: PropTypes.element,
  onClick: PropTypes.func,
};

export default HomeButton; 