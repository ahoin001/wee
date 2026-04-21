import React from 'react';
import PropTypes from 'prop-types';
import { ImageSearchModal } from '../modals';
import ChannelModal from './ChannelModal';
import { ACCEPT_IMAGE_OR_MP4 } from '../../utils/supportedUploadMedia';

export default function ChannelModalsHost({
  id,
  fileInputRef,
  exeInputRef,
  onMediaChange,
  onAppPathChange,
  showImageSearch,
  setShowImageSearch,
  handleImageSelect,
  handleUploadClick,
  channelModalMounted,
  showChannelModal,
  setShowChannelModal,
  setChannelModalMounted,
  handleChannelModalSave,
  channelSpaceKey,
  effectiveMedia,
  effectivePath,
  effectiveType,
  effectiveHoverSound,
  effectiveAsAdmin,
  effectiveConfig,
}) {
  return (
    <>
      <input
        type="file"
        accept={ACCEPT_IMAGE_OR_MP4}
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file && onMediaChange) onMediaChange(id, file);
          e.target.value = '';
        }}
      />
      <input
        type="file"
        accept=".exe"
        style={{ display: 'none' }}
        ref={exeInputRef}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file && onAppPathChange) onAppPathChange(id, file.path);
          e.target.value = '';
        }}
      />
      {showImageSearch ? (
        <ImageSearchModal
          onClose={() => setShowImageSearch(false)}
          onSelect={handleImageSelect}
          onUploadClick={handleUploadClick}
        />
      ) : null}
      {channelModalMounted ? (
        <ChannelModal
          channelId={id}
          channelSpaceKey={channelSpaceKey}
          isOpen={showChannelModal}
          onClose={() => setShowChannelModal(false)}
          onExitAnimationComplete={() => setChannelModalMounted(false)}
          onSave={handleChannelModalSave}
          currentMedia={effectiveMedia}
          currentPath={effectivePath}
          currentType={effectiveType}
          currentHoverSound={effectiveHoverSound}
          currentAsAdmin={effectiveAsAdmin}
          currentAnimatedOnHover={effectiveConfig?.animatedOnHover}
          currentKenBurnsEnabled={effectiveConfig?.kenBurnsEnabled}
          currentKenBurnsMode={effectiveConfig?.kenBurnsMode}
        />
      ) : null}
    </>
  );
}

ChannelModalsHost.propTypes = {
  id: PropTypes.string.isRequired,
  fileInputRef: PropTypes.object.isRequired,
  exeInputRef: PropTypes.object.isRequired,
  onMediaChange: PropTypes.func,
  onAppPathChange: PropTypes.func,
  showImageSearch: PropTypes.bool.isRequired,
  setShowImageSearch: PropTypes.func.isRequired,
  handleImageSelect: PropTypes.func.isRequired,
  handleUploadClick: PropTypes.func.isRequired,
  channelModalMounted: PropTypes.bool.isRequired,
  showChannelModal: PropTypes.bool.isRequired,
  setShowChannelModal: PropTypes.func.isRequired,
  setChannelModalMounted: PropTypes.func.isRequired,
  handleChannelModalSave: PropTypes.func.isRequired,
  channelSpaceKey: PropTypes.string,
  effectiveMedia: PropTypes.object,
  effectivePath: PropTypes.string,
  effectiveType: PropTypes.string,
  effectiveHoverSound: PropTypes.object,
  effectiveAsAdmin: PropTypes.bool,
  effectiveConfig: PropTypes.object,
};
