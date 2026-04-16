import React from 'react';
import PropTypes from 'prop-types';
import Text from '../../../ui/Text';
import WButton from '../../../ui/WButton';
import WRadioGroup from '../../../ui/WRadioGroup';
import {
  ACCEPT_GALLERY_STILLS,
  ACCEPT_IMAGE_OR_MP4,
  SUPPORTED_GALLERY_HINT,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../../../utils/supportedUploadMedia';

/**
 * Channel image upload / preview (single image; gallery UI retained for future).
 */
function ChannelModalImageSection({
  showGalleryOption,
  galleryMode,
  setGalleryMode,
  imageGallery,
  media,
  setShowImageSearch,
  handleRemoveImage,
  handleFileSelect,
  handleGalleryFilesSelect,
  handleRemoveGalleryImage,
  fileInputRef,
  galleryFileInputRef,
  mediaUploadHint,
}) {
  return (
    <div className="image-section">
      {mediaUploadHint ? (
        <Text size="sm" className="mb-3 block" color="hsl(var(--state-warning))">
          {mediaUploadHint}
        </Text>
      ) : null}
      {showGalleryOption && (
        <div className="mb-4">
          <Text as="label" size="md" weight={600} className="block mb-2">
            Image Mode
          </Text>
          <WRadioGroup
            options={[
              { value: 'single', label: 'Single Image' },
              { value: 'gallery', label: 'Image Gallery (slideshow)' },
            ]}
            value={galleryMode ? 'gallery' : 'single'}
            onChange={(value) => setGalleryMode(value === 'gallery')}
          />
          <Text variant="help" className="mt-2">
            {galleryMode
              ? `Upload multiple images for Ken Burns slideshow effect. ${SUPPORTED_GALLERY_HINT} Make sure Ken Burns mode is set to "Always Active" for best results.`
              : `Use a single image or MP4 with Ken Burns animation. ${SUPPORTED_IMAGE_VIDEO_HINT}`}
          </Text>
        </div>
      )}

      {!galleryMode && (
        <>
          {media ? (
            <div className="image-preview">
              {media.loading ? (
                <div className="flex min-h-[120px] items-center justify-center rounded-lg bg-[hsl(var(--surface-tertiary))] text-sm text-[hsl(var(--text-secondary))]">
                  <span>Processing…</span>
                </div>
              ) : media.temporary ? (
                <div className="relative">
                  {media && typeof media.type === 'string' && (media.type.startsWith('image/') || media.type === 'image') ? (
                    <img src={media.url} alt="Channel preview" />
                  ) : media && typeof media.type === 'string' && (media.type.startsWith('video/') || media.type === 'video' || media.type === 'gif') ? (
                    <video src={media.url} autoPlay loop muted className="max-w-full max-h-[120px]" />
                  ) : null}
                  <div className="channel-temp-badge">⚠️ Temporary</div>
                </div>
              ) : (
                <>
                  {media && typeof media.type === 'string' && (media.type.startsWith('image/') || media.type === 'image') ? (
                    <img src={media.url} alt="Channel preview" />
                  ) : media && typeof media.type === 'string' && (media.type.startsWith('video/') || media.type === 'video' || media.type === 'gif') ? (
                    <video src={media.url} autoPlay loop muted className="max-w-full max-h-[120px]" />
                  ) : null}
                </>
              )}
              <button type="button" className="remove-image-button" onClick={handleRemoveImage}>
                Remove
              </button>
            </div>
          ) : (
            <div className="channel-stack-8">
              <WButton variant="primary" fullWidth rounded onClick={() => setShowImageSearch(true)} className="text-text-on-accent">
                Browse media library
              </WButton>
              <WButton variant="secondary" fullWidth rounded onClick={() => fileInputRef.current?.click()}>
                Upload image or MP4
              </WButton>
            </div>
          )}
        </>
      )}

      {galleryMode && (
        <div className="channel-stack-16">
          {imageGallery.length > 0 && (
            <div className="channel-gallery-grid">
              {imageGallery.map((image, index) => (
                <div key={image.id} className="relative">
                  <div className="w-full h-20 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                    {image.loading ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600 text-xs">
                        Saving...
                      </div>
                    ) : image.error ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs text-center p-1">
                        {image.error}
                      </div>
                    ) : image.type.startsWith('image/') ? (
                      <img src={image.url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                    ) : image.type.startsWith('video/') ? (
                      <video src={image.url} className="w-full h-full object-cover" muted />
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(image.id)}
                    className="absolute top-1 right-1 bg-red-600/90 text-white border-none rounded w-5 h-5 text-xs cursor-pointer flex items-center justify-center"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="file-button"
            id="channel-gallery-add-button"
            onClick={() => galleryFileInputRef.current?.click()}
          >
            {imageGallery.length === 0 ? 'Add Images for Gallery' : 'Add More Images'}
          </button>

          <Text variant="help">
            {imageGallery.length === 0
              ? `Select multiple images to create a Ken Burns slideshow. ${SUPPORTED_GALLERY_HINT} Images will cycle automatically with smooth transitions.`
              : `${imageGallery.length} image${imageGallery.length !== 1 ? 's' : ''} in gallery. Images will display in order with Ken Burns effects.`}
          </Text>
        </div>
      )}

      <input
        type="file"
        accept={ACCEPT_IMAGE_OR_MP4}
        ref={fileInputRef}
        onChange={(e) => handleFileSelect(e.target.files[0])}
        className="hidden"
      />
      <input
        type="file"
        accept={ACCEPT_GALLERY_STILLS}
        multiple
        ref={galleryFileInputRef}
        onChange={(e) => handleGalleryFilesSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}

ChannelModalImageSection.propTypes = {
  showGalleryOption: PropTypes.bool,
  galleryMode: PropTypes.bool,
  setGalleryMode: PropTypes.func,
  imageGallery: PropTypes.array,
  media: PropTypes.object,
  setShowImageSearch: PropTypes.func,
  handleRemoveImage: PropTypes.func,
  handleFileSelect: PropTypes.func,
  handleGalleryFilesSelect: PropTypes.func,
  handleRemoveGalleryImage: PropTypes.func,
  fileInputRef: PropTypes.object,
  galleryFileInputRef: PropTypes.object,
  mediaUploadHint: PropTypes.string,
};

ChannelModalImageSection.defaultProps = {
  showGalleryOption: false,
  imageGallery: [],
  mediaUploadHint: '',
};

export default React.memo(ChannelModalImageSection);
