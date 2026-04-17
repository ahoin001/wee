import React from 'react';
import PropTypes from 'prop-types';

/**
 * Discovery → Suggested: games & apps to wire to this channel (moved from Setup tab).
 */
function ChannelModalSuggestedTab({ suggestedGames }) {
  return <div className="flex min-w-0 flex-col gap-6">{suggestedGames}</div>;
}

ChannelModalSuggestedTab.propTypes = {
  suggestedGames: PropTypes.node.isRequired,
};

export default React.memo(ChannelModalSuggestedTab);
