import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import Card from '../ui/Card';
import WToggle from '../ui/WToggle';
import WButton from '../ui/WButton';
import Slider from '../ui/Slider';
import Text from '../ui/Text';
import useApiIntegrationsStore from '../utils/useApiIntegrationsStore';
import useFloatingWidgetStore from '../utils/useFloatingWidgetStore';
import { spacing } from '../ui/tokens';

const WidgetSettingsModal = ({ isOpen, onClose }) => {
  const { spotify, updateSpotifySettings } = useApiIntegrationsStore();
  const { resetPosition } = useFloatingWidgetStore();
  
  const [localSettings, setLocalSettings] = useState(spotify.settings);

  // Update local settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(spotify.settings);
    }
  }, [isOpen, spotify.settings]);

  const handleSettingChange = (setting, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = () => {
    updateSpotifySettings(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(spotify.settings);
    onClose();
  };

  const handleResetPosition = () => {
    resetPosition();
  };

  const footerContent = (
    <div style={{ display: 'flex', gap: spacing.medium, justifyContent: 'flex-end' }}>
      <WButton variant="secondary" onClick={handleCancel}>
        Cancel
      </WButton>
      <WButton variant="primary" onClick={handleSave}>
        Save
      </WButton>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Widget Settings"
      footerContent={footerContent}
    >
      <div style={{ padding: spacing.medium }}>
        <Card>
          <div style={{ marginBottom: spacing.large }}>
            <Text variant="h3" style={{ marginBottom: spacing.medium }}>Appearance</Text>
            
            <div style={{ marginBottom: spacing.medium }}>
              <WToggle
                checked={localSettings.dynamicColors}
                onChange={(checked) => handleSettingChange('dynamicColors', checked)}
                label="Dynamic Colors"
              />
              <Text variant="caption" style={{ opacity: 0.7, marginLeft: spacing.medium, marginTop: spacing.xsmall }}>
                Extract colors from album art for adaptive theming
              </Text>
            </div>

            <div style={{ marginBottom: spacing.medium }}>
              <WToggle
                checked={localSettings.useBlurredBackground}
                onChange={(checked) => handleSettingChange('useBlurredBackground', checked)}
                label="Blurred Album Art Background"
              />
              <Text variant="caption" style={{ opacity: 0.7, marginLeft: spacing.medium, marginTop: spacing.xsmall }}>
                Use blurred album art instead of gradient background
              </Text>
            </div>

            {localSettings.useBlurredBackground && (
              <div style={{ marginBottom: spacing.medium, marginLeft: spacing.medium }}>
                <Text variant="body" style={{ marginBottom: spacing.small }}>Blur Amount</Text>
                <Slider
                  value={localSettings.blurAmount}
                  onChange={(value) => handleSettingChange('blurAmount', value)}
                  min={0}
                  max={100}
                  step={5}
                />
                <Text variant="caption" style={{ opacity: 0.7, marginTop: spacing.xsmall }}>
                  {localSettings.blurAmount}% blur
                </Text>
              </div>
            )}
          </div>

          <div style={{ marginBottom: spacing.large }}>
            <Text variant="h3" style={{ marginBottom: spacing.medium }}>Behavior</Text>
            
            <div style={{ marginBottom: spacing.medium }}>
              <WToggle
                checked={localSettings.autoShowWidget}
                onChange={(checked) => handleSettingChange('autoShowWidget', checked)}
                label="Auto-show Widget"
              />
              <Text variant="caption" style={{ opacity: 0.7, marginLeft: spacing.medium, marginTop: spacing.xsmall }}>
                Automatically show widget when playback starts
              </Text>
            </div>

            <div style={{ marginBottom: spacing.medium }}>
              <Text variant="body" style={{ marginBottom: spacing.small }}>Widget Position</Text>
              <WButton 
                variant="secondary" 
                onClick={handleResetPosition}
                size="sm"
              >
                Reset to Center
              </WButton>
              <Text variant="caption" style={{ opacity: 0.7, marginLeft: spacing.medium, marginTop: spacing.xsmall }}>
                Reset widget position to center of screen
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </BaseModal>
  );
};

export default WidgetSettingsModal; 