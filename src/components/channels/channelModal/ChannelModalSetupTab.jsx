import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Card from '../../../ui/Card';
import ChannelModalSuggestedCollapsible from './ChannelModalSuggestedCollapsible';

/**
 * Configure Channel → Setup: app/URL first, image second, suggested content last (collapsible).
 */
function ChannelModalSetupTab({ pathCardContent, imageSection, suggestedGames }) {
  const [manualMediaOpen, setManualMediaOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card title="App path or URL" separator desc="Set the path to an app or a URL to launch when this channel is clicked.">
        {pathCardContent}
      </Card>

      <Card
        title="Manual media (advanced)"
        separator
        desc="Suggestions above are the default flow. Open this section to upload or browse manually."
      >
        <button
          type="button"
          className="channel-modal-manual-toggle"
          aria-expanded={manualMediaOpen}
          onClick={() => setManualMediaOpen((v) => !v)}
        >
          {manualMediaOpen ? 'Hide manual media controls' : 'Open manual media controls'}
        </button>
        {manualMediaOpen ? <div className="mt-3">{imageSection}</div> : null}
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
