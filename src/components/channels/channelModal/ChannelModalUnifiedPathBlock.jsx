import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { UnifiedAppPathCard } from '../../app-library';
import ChannelPathSmartSuggestions from '../ChannelPathSmartSuggestions';
import ChannelModalChannelArtPanel from './ChannelModalChannelArtPanel';
import {
  WeeModalFieldCard,
  WeeSectionEyebrow,
} from '../../../ui/wee';
import { validateChannelPath } from '../../../utils/channelPathValidation';

/**
 * App / URL picker + validation helpers for Configure Channel → Setup tab.
 * Stays mounted while `isOpen` is false so modal exit presence is not blanked.
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
  imageGallery,
  artMotion,
  onArtMotionChange,
  galleryFileInputRef,
  onGalleryFilesSelect,
  onRemoveGalleryImage,
  onReorderGallery,
  onAddLibraryStillToGallery,
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

  /** Reveal art only after a picked app / valid launch path, or a valid website URL (not while typing an incomplete URL). */
  const canShowChannelArt = useMemo(() => {
    const trimmed = String(path || '').trim();
    if (!trimmed) return false;
    if (type === 'url') {
      return validateChannelPath(trimmed, 'url').valid;
    }
    if (matchingApp) return true;
    return validateChannelPath(trimmed, type).valid;
  }, [path, type, matchingApp]);

  return (
    <div
      className={`flex min-w-0 flex-col gap-12 md:gap-16${
        isOpen ? '' : ' pointer-events-none'
      }`}
      aria-hidden={!isOpen}
      {...(!isOpen ? { inert: '' } : {})}
    >
      <section className="space-y-4">
        <WeeModalFieldCard hoverAccent="primary">
          <UnifiedAppPathCard
            key={`unified-app-path-${channelId}`}
            value={value}
            onChange={onUnifiedAppPathChange}
            externalValidationError={pathError}
          />
          <ChannelPathSmartSuggestions path={path} type={type} onApply={onApplySmartSuggestion} />
        </WeeModalFieldCard>
      </section>

      {canShowChannelArt ? (
        <section className="space-y-4">
          <WeeSectionEyebrow>Channel art</WeeSectionEyebrow>
          <WeeModalFieldCard hoverAccent="discovery">
            <div className="channel-art-panel-wrap">
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
                imageGallery={imageGallery}
                artMotion={artMotion}
                onArtMotionChange={onArtMotionChange}
                galleryFileInputRef={galleryFileInputRef}
                onGalleryFilesSelect={onGalleryFilesSelect}
                onRemoveGalleryImage={onRemoveGalleryImage}
                onReorderGallery={onReorderGallery}
                onAddLibraryStillToGallery={onAddLibraryStillToGallery}
              />
            </div>
          </WeeModalFieldCard>
        </section>
      ) : null}
    </div>
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
  setMediaUploadHint: PropTypes.func.isRequired,
  imageGallery: PropTypes.array,
  artMotion: PropTypes.string,
  onArtMotionChange: PropTypes.func,
  galleryFileInputRef: PropTypes.object,
  onGalleryFilesSelect: PropTypes.func,
  onRemoveGalleryImage: PropTypes.func,
  onReorderGallery: PropTypes.func,
  onAddLibraryStillToGallery: PropTypes.func,
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
  imageGallery: undefined,
  artMotion: undefined,
  onArtMotionChange: undefined,
  galleryFileInputRef: undefined,
  onGalleryFilesSelect: undefined,
  onRemoveGalleryImage: undefined,
  onReorderGallery: undefined,
  onAddLibraryStillToGallery: undefined,
};

export default React.memo(ChannelModalUnifiedPathBlock);
