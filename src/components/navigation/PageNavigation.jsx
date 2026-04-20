import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import useChannelOperations from '../../utils/useChannelOperations';
import './PageNavigation.css';

const PageNavigation = ({
  position: _position = 'bottom',
  showPageIndicator: _showPageIndicator = true
}) => {
  const channelSpaceKey = useMemo(() => 'home', []);

  useChannelOperations(channelSpaceKey);
  // Wii-only navigation uses side arrows + strip paging, so dot pagination is intentionally hidden.
  return null;
};

PageNavigation.propTypes = {
  position: PropTypes.oneOf(['top', 'bottom']),
  showPageIndicator: PropTypes.bool
};

export default PageNavigation; 
