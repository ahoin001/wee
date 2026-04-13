import React from 'react';
import PropTypes from 'prop-types';
import Card from '../../../ui/Card';
import ChannelModalSuggestedCollapsible from './ChannelModalSuggestedCollapsible';

/**
 * Configure Channel → Setup: app/URL first, image second, suggested content last (collapsible).
 */
function ChannelModalSetupTab({ pathCardContent, imageSection, suggestedGames }) {
  return (
    <div className="space-y-6">
      <Card title="App path or URL" separator desc="Set the path to an app or a URL to launch when this channel is clicked.">
        {pathCardContent}
      </Card>

      <Card title="Channel Image" separator desc="Choose or upload an image, GIF, or MP4 for this channel.">
        {imageSection}
      </Card>

      <ChannelModalSuggestedCollapsible>{suggestedGames}</ChannelModalSuggestedCollapsible>
    </div>
  );
}

ChannelModalSetupTab.propTypes = {
  pathCardContent: PropTypes.node.isRequired,
  imageSection: PropTypes.node.isRequired,
  suggestedGames: PropTypes.node.isRequired,
};

export default React.memo(ChannelModalSetupTab);
