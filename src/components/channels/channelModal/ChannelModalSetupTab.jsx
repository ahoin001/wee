import React from 'react';
import PropTypes from 'prop-types';
import Card from '../../../ui/Card';
import ChannelModalSuggestedCollapsible from './ChannelModalSuggestedCollapsible';

/**
 * Configure Channel → Setup: guided target-first flow with optional suggestions.
 */
function ChannelModalSetupTab({ pathCardContent, suggestedGames }) {
  return (
    <div className="space-y-6">
      <Card
        title="What should this channel open?"
        separator
        desc="Choose an app or a website, then pick channel art below."
      >
        {pathCardContent}
      </Card>

      <ChannelModalSuggestedCollapsible defaultOpen={false}>{suggestedGames}</ChannelModalSuggestedCollapsible>
    </div>
  );
}

ChannelModalSetupTab.propTypes = {
  pathCardContent: PropTypes.node.isRequired,
  suggestedGames: PropTypes.node.isRequired,
};

export default React.memo(ChannelModalSetupTab);
