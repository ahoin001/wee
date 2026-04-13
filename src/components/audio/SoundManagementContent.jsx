import React from 'react';
import PropTypes from 'prop-types';
import SoundManagementCore from './SoundManagementCore';

/**
 * Sound Management Content - Uses the shared SoundManagementCore component
 * Configured for modal context with manual save
 */
const SoundManagementContent = React.memo(({ 
  isModal = false, 
  onClose, 
  onSettingsChange,
  showHeader = true 
}) => {
  return (
    <SoundManagementCore
      isModal={isModal}
      onClose={onClose}
      onSettingsChange={onSettingsChange}
      showHeader={showHeader}
      autoSave={false} // Manual save in modal context
      showSaveButton={true}
    />
  );
});

SoundManagementContent.propTypes = {
  isModal: PropTypes.bool,
  onClose: PropTypes.func,
  onSettingsChange: PropTypes.func,
  showHeader: PropTypes.bool
};

SoundManagementContent.displayName = 'SoundManagementContent';

export default SoundManagementContent;
