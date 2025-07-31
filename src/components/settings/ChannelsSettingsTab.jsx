import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import Toggle from '../../ui/Toggle';

const ChannelsSettingsTab = React.memo(({ localSettings, updateLocalSetting }) => {
  // Memoize callback functions to prevent unnecessary re-renders
  const handleAnimatedOnHoverChange = useCallback((checked) => {
    updateLocalSetting('channels', 'animatedOnHover', checked);
  }, [updateLocalSetting]);

  const handleIdleAnimationsChange = useCallback((checked) => {
    updateLocalSetting('channels', 'idleAnimations', checked);
  }, [updateLocalSetting]);

  const handleKenBurnsChange = useCallback((checked) => {
    updateLocalSetting('channels', 'kenBurns', checked);
  }, [updateLocalSetting]);

  const handleChannelGridChange = useCallback((checked) => {
    updateLocalSetting('channels', 'channelGrid', checked);
  }, [updateLocalSetting]);

  const handleHoverEffectsChange = useCallback((checked) => {
    updateLocalSetting('channels', 'hoverEffects', checked);
  }, [updateLocalSetting]);

  return (
    <div>
      {/* Only play channel animations on hover */}
      <Card
        title="Only play channel animations on hover"
        separator
        desc="When enabled, animated channel art (GIFs/MP4s) will only play when you hover over a channel. When disabled, animations will play automatically."
        headerActions={
          <Toggle
            checked={localSettings.channels?.animatedOnHover ?? false}
            onChange={handleAnimatedOnHoverChange}
          />
        }
      />

      {/* Idle Channel Animations */}
      <Card
        title="Idle Channel Animations"
        separator
        desc="When enabled, channels will play subtle idle animations when not being interacted with."
        headerActions={
          <Toggle
            checked={localSettings.channels?.idleAnimations ?? true}
            onChange={handleIdleAnimationsChange}
          />
        }
      />

      {/* Ken Burns Effect */}
      <Card
        title="Ken Burns Effect"
        separator
        desc="When enabled, static channel images will have a subtle pan and zoom effect to add visual interest."
        headerActions={
          <Toggle
            checked={localSettings.channels?.kenBurns ?? true}
            onChange={handleKenBurnsChange}
          />
        }
      />

      {/* Channel Grid */}
      <Card
        title="Channel Grid"
        separator
        desc="When enabled, channels will be displayed in a grid layout instead of a single row."
        headerActions={
          <Toggle
            checked={localSettings.channels?.channelGrid ?? false}
            onChange={handleChannelGridChange}
          />
        }
      />

      {/* Channel Hover Effects */}
      <Card
        title="Channel Hover Effects"
        separator
        desc="When enabled, channels will have visual effects when you hover over them."
        headerActions={
          <Toggle
            checked={localSettings.channels?.hoverEffects ?? true}
            onChange={handleHoverEffectsChange}
          />
        }
      />
    </div>
  );
});

ChannelsSettingsTab.displayName = 'ChannelsSettingsTab';

export default ChannelsSettingsTab; 