import PropTypes from 'prop-types';
import './PageNavigation.css';

const PageNavigation = ({
  position: _position = 'bottom',
  showPageIndicator: _showPageIndicator = true
}) => {
  // Wii-only navigation uses side arrows + strip paging, so dot pagination is intentionally hidden.
  return null;
};

PageNavigation.propTypes = {
  position: PropTypes.oneOf(['top', 'bottom']),
  showPageIndicator: PropTypes.bool
};

export default PageNavigation; 
