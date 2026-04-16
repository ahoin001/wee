import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { UnifiedAppPathCard } from '../../app-library';
import ChannelPathSmartSuggestions from '../ChannelPathSmartSuggestions';
import ChannelModalInlineMediaSuggestions from './ChannelModalInlineMediaSuggestions';

/**
 * App / URL picker + validation helpers for Configure Channel → Setup tab.
 */
function ChannelModalUnifiedPathBlock({
  channelId,
  isOpen,
  path,
  type,
  pathError,
  matchingApp,
  onUnifiedAppPathChange,
  onApplySmartSuggestion,
  onApplySuggestedMedia,
  onOpenMediaSearch,
}) {
  const value = useMemo(
    () => ({
      launchType: type === 'url' ? 'url' : 'application',
      appName: matchingApp ? matchingApp.name : '',
      path,
      selectedApp: matchingApp,
    }),
    [type, path, matchingApp]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <UnifiedAppPathCard
        key={`unified-app-path-${channelId}-${isOpen}`}
        value={value}
        onChange={onUnifiedAppPathChange}
        externalValidationError={pathError}
      />
      <ChannelModalInlineMediaSuggestions
        path={path}
        type={type}
        matchingApp={matchingApp}
        onApplyMedia={onApplySuggestedMedia}
        onOpenMediaSearch={onOpenMediaSearch}
      />
      <ChannelPathSmartSuggestions path={path} type={type} onApply={onApplySmartSuggestion} />
    </>
  );
}

ChannelModalUnifiedPathBlock.propTypes = {
  channelId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool,
  path: PropTypes.string,
  type: PropTypes.string,
  pathError: PropTypes.string,
  matchingApp: PropTypes.object,
  onUnifiedAppPathChange: PropTypes.func.isRequired,
  onApplySmartSuggestion: PropTypes.func.isRequired,
  onApplySuggestedMedia: PropTypes.func.isRequired,
  onOpenMediaSearch: PropTypes.func.isRequired,
};

ChannelModalUnifiedPathBlock.defaultProps = {
  isOpen: true,
  path: '',
  type: 'exe',
  pathError: '',
  matchingApp: null,
};

export default React.memo(ChannelModalUnifiedPathBlock);
