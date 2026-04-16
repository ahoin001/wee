import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { UnifiedAppPathCard } from '../../app-library';
import ChannelPathSmartSuggestions from '../ChannelPathSmartSuggestions';
import ChannelModalChannelArtPanel from './ChannelModalChannelArtPanel';

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
  onSelectFromLibrary,
  onUploadToLibraryAndChannel,
  libraryUploading,
  onRemoveMedia,
  media,
  mediaUploadHint,
  setMediaUploadHint,
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
  const hasLaunchTarget = Boolean(String(path || '').trim());

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
      {hasLaunchTarget ? (
        <div className="mt-4 channel-art-panel-wrap">
          <ChannelModalChannelArtPanel
            path={path}
            type={type}
            matchingApp={matchingApp}
            onApplySuggestedMedia={onApplySuggestedMedia}
            media={media}
            onSelectFromLibrary={onSelectFromLibrary}
            onUploadToLibraryAndChannel={onUploadToLibraryAndChannel}
            libraryUploading={libraryUploading}
            onRemoveMedia={onRemoveMedia}
            mediaUploadHint={mediaUploadHint}
            setMediaUploadHint={setMediaUploadHint}
          />
        </div>
      ) : (
        <div className="channel-setup-lock">
          Choose what this channel opens above—then you can pick art here.
        </div>
      )}
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
  onSelectFromLibrary: PropTypes.func.isRequired,
  onUploadToLibraryAndChannel: PropTypes.func.isRequired,
  libraryUploading: PropTypes.bool,
  onRemoveMedia: PropTypes.func.isRequired,
  media: PropTypes.object,
  mediaUploadHint: PropTypes.string,
  setMediaUploadHint: PropTypes.func,
};

ChannelModalUnifiedPathBlock.defaultProps = {
  isOpen: true,
  path: '',
  type: 'exe',
  pathError: '',
  matchingApp: null,
  libraryUploading: false,
  media: null,
  mediaUploadHint: '',
  setMediaUploadHint: undefined,
};

export default React.memo(ChannelModalUnifiedPathBlock);
