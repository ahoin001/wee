import React from 'react';
import PropTypes from 'prop-types';

/**
 * Configure Channel → Setup: path, launch target, and channel art (suggested games live on Discovery → Suggested).
 */
function ChannelModalSetupTab({ pathCardContent }) {
  return <div className="flex min-w-0 flex-col gap-12 md:gap-16">{pathCardContent}</div>;
}

ChannelModalSetupTab.propTypes = {
  pathCardContent: PropTypes.node.isRequired,
};

export default React.memo(ChannelModalSetupTab);
