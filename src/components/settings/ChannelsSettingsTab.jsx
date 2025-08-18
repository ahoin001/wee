import React, { useCallback, useState, useEffect } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import WSelect from '../../ui/WSelect';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const ChannelsSettingsTab = React.memo(({ settings, onSettingChange }) => {
  // Get channel settings from consolidated store
  const { channels } = useConsolidatedAppStore();
  
  // Local state for settings that aren't in the consolidated store yet
  const [localSettings, setLocalSettings] = useState({
    adaptiveEmptyChannels: true,
    channelAnimation: 'none',
    animatedOnHover: false,
    idleAnimationEnabled: false,
    idleAnimationTypes: ['pulse', 'bounce', 'glow'],
    idleAnimationInterval: 8,
    kenBurnsEnabled: false,
    kenBurnsMode: 'hover',
    kenBurnsHoverScale: 1.1,
    kenBurnsAutoplayScale: 1.15,
    kenBurnsSlideshowScale: 1.08,
    kenBurnsHoverDuration: 8000,
    kenBurnsAutoplayDuration: 12000,
    kenBurnsSlideshowDuration: 10000,
    kenBurnsCrossfadeDuration: 1000,
    kenBurnsForGifs: false,
    kenBurnsForVideos: false,
    kenBurnsEasing: 'ease-out',
    kenBurnsAnimationType: 'both',
    kenBurnsCrossfadeReturn: true,
    kenBurnsTransitionType: 'cross-dissolve',
    channelAutoFadeTimeout: 5
  });

  // Update local settings when props change
  useEffect(() => {
    if (settings) {
      setLocalSettings(prev => ({
        ...prev,
        ...settings
      }));
    }
  }, [settings]);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleAnimatedOnHoverChange = useCallback((checked) => {
    setLocalSettings(prev => ({ ...prev, animatedOnHover: checked }));
    onSettingChange('animatedOnHover', checked);
  }, [onSettingChange]);

  const handleIdleAnimationEnabledChange = useCallback((checked) => {
    setLocalSettings(prev => ({ ...prev, idleAnimationEnabled: checked }));
    onSettingChange('idleAnimationEnabled', checked);
  }, [onSettingChange]);

  const handleKenBurnsEnabledChange = useCallback((checked) => {
    setLocalSettings(prev => ({ ...prev, kenBurnsEnabled: checked }));
    onSettingChange('kenBurnsEnabled', checked);
  }, [onSettingChange]);

  const handleChannelAutoFadeTimeoutChange = useCallback((value) => {
    setLocalSettings(prev => ({ ...prev, channelAutoFadeTimeout: value }));
    onSettingChange('channelAutoFadeTimeout', value);
  }, [onSettingChange]);

  const handleAdaptiveEmptyChannelsChange = useCallback((checked) => {
    setLocalSettings(prev => ({ ...prev, adaptiveEmptyChannels: checked }));
    onSettingChange('adaptiveEmptyChannels', checked);
  }, [onSettingChange]);

  const handleChannelAnimationChange = useCallback((value) => {
    setLocalSettings(prev => ({ ...prev, channelAnimation: value }));
    onSettingChange('channelAnimation', value);
  }, [onSettingChange]);

  const handleIdleAnimationIntervalChange = useCallback((value) => {
    setLocalSettings(prev => ({ ...prev, idleAnimationInterval: value }));
    onSettingChange('idleAnimationInterval', value);
  }, [onSettingChange]);

  const handleKenBurnsModeChange = useCallback((value) => {
    setLocalSettings(prev => ({ ...prev, kenBurnsMode: value }));
    onSettingChange('kenBurnsMode', value);
  }, [onSettingChange]);

  const handleKenBurnsHoverScaleChange = useCallback((value) => {
    setLocalSettings(prev => ({ ...prev, kenBurnsHoverScale: value }));
    onSettingChange('kenBurnsHoverScale', value);
  }, [onSettingChange]);

  const handleKenBurnsAutoplayScaleChange = useCallback((value) => {
    setLocalSettings(prev => ({ ...prev, kenBurnsAutoplayScale: value }));
    onSettingChange('kenBurnsAutoplayScale', value);
  }, [onSettingChange]);

  const handleKenBurnsHoverDurationChange = useCallback((value) => {
    setLocalSettings(prev => ({ ...prev, kenBurnsHoverDuration: value }));
    onSettingChange('kenBurnsHoverDuration', value);
  }, [onSettingChange]);

  const handleKenBurnsAutoplayDurationChange = useCallback((value) => {
    setLocalSettings(prev => ({ ...prev, kenBurnsAutoplayDuration: value }));
    onSettingChange('kenBurnsAutoplayDuration', value);
  }, [onSettingChange]);

  const handleKenBurnsCrossfadeDurationChange = useCallback((value) => {
    setLocalSettings(prev => ({ ...prev, kenBurnsCrossfadeDuration: value }));
    onSettingChange('kenBurnsCrossfadeDuration', value);
  }, [onSettingChange]);

  const handleKenBurnsEasingChange = useCallback((value) => {
    setLocalSettings(prev => ({ ...prev, kenBurnsEasing: value }));
    onSettingChange('kenBurnsEasing', value);
  }, [onSettingChange]);

  const handleIdleAnimationTypeToggle = useCallback((type) => {
    setLocalSettings(prev => {
      const newTypes = prev.idleAnimationTypes.includes(type) 
        ? prev.idleAnimationTypes.filter(t => t !== type)
        : [...prev.idleAnimationTypes, type];
      return { ...prev, idleAnimationTypes: newTypes };
    });
    onSettingChange('idleAnimationTypes', localSettings.idleAnimationTypes);
  }, [onSettingChange, localSettings.idleAnimationTypes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Text variant="h2" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
        Channel Settings
      </Text>
      
      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
        Configure global channel behavior and animation settings.
      </Text>

      {/* Adaptive Empty Channel Backgrounds */}
      <Card
        title="Adaptive Empty Channel Backgrounds"
        separator
        desc="When enabled, empty channel slots will automatically adapt their background to match the current wallpaper, creating a more cohesive visual experience."
        headerActions={
          <WToggle
            checked={localSettings.adaptiveEmptyChannels}
            onChange={handleAdaptiveEmptyChannelsChange}
          />
        }
      />

      {/* Hover-Only Animations */}
      <Card
        title="Hover-Only Animations"
        separator
        desc="When enabled, animated channel art (GIFs/MP4s) will only play when you hover over a channel. When disabled, animations will play automatically."
        headerActions={
          <WToggle
            checked={localSettings.animatedOnHover}
            onChange={handleAnimatedOnHoverChange}
          />
        }
      />

      {/* Idle Channel Animations */}
      <Card
        title="Idle Channel Animations"
        separator
        desc="When enabled, channels will play subtle animations when not being interacted with, adding life to the interface."
        headerActions={
          <WToggle
            checked={localSettings.idleAnimationEnabled}
            onChange={handleIdleAnimationEnabledChange}
          />
        }
      >
        {localSettings.idleAnimationEnabled && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Animation Types:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['pulse', 'bounce', 'glow', 'heartbeat', 'shake', 'wiggle'].map(type => (
                  <WToggle
                    key={type}
                    checked={localSettings.idleAnimationTypes.includes(type)}
                    onChange={() => handleIdleAnimationTypeToggle(type)}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    style={{ fontSize: 14 }}
                  />
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Animation Interval: {localSettings.idleAnimationInterval} seconds</div>
              <Slider
                value={localSettings.idleAnimationInterval}
                min={2}
                max={20}
                step={1}
                onChange={handleIdleAnimationIntervalChange}
              />
            </div>
          </>
        )}
      </Card>

      {/* Ken Burns Effect */}
      <Card
        title="Ken Burns Effect"
        separator
        desc="Add cinematic zoom and pan effects to channel images, creating dynamic visual interest."
        headerActions={
          <WToggle
            checked={localSettings.kenBurnsEnabled}
            onChange={handleKenBurnsEnabledChange}
          />
        }
      >
        {localSettings.kenBurnsEnabled && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Trigger Mode:</div>
              <WSelect
                value={localSettings.kenBurnsMode}
                onChange={handleKenBurnsModeChange}
                options={[
                  { value: 'hover', label: 'On Hover' },
                  { value: 'autoplay', label: 'Autoplay' },
                  { value: 'slideshow', label: 'Slideshow' }
                ]}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Scale Settings:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Hover Scale: {localSettings.kenBurnsHoverScale}</label>
                  <Slider
                    value={localSettings.kenBurnsHoverScale}
                    min={1.0}
                    max={1.5}
                    step={0.05}
                    onChange={handleKenBurnsHoverScaleChange}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Autoplay Scale: {localSettings.kenBurnsAutoplayScale}</label>
                  <Slider
                    value={localSettings.kenBurnsAutoplayScale}
                    min={1.0}
                    max={1.5}
                    step={0.05}
                    onChange={handleKenBurnsAutoplayScaleChange}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Duration Settings:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Hover Duration: {localSettings.kenBurnsHoverDuration}ms</label>
                  <Slider
                    value={localSettings.kenBurnsHoverDuration}
                    min={2000}
                    max={15000}
                    step={500}
                    onChange={handleKenBurnsHoverDurationChange}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Autoplay Duration: {localSettings.kenBurnsAutoplayDuration}ms</label>
                  <Slider
                    value={localSettings.kenBurnsAutoplayDuration}
                    min={5000}
                    max={20000}
                    step={500}
                    onChange={handleKenBurnsAutoplayDurationChange}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Advanced Settings:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Crossfade Duration: {localSettings.kenBurnsCrossfadeDuration}ms</label>
                  <Slider
                    value={localSettings.kenBurnsCrossfadeDuration}
                    min={500}
                    max={3000}
                    step={100}
                    onChange={handleKenBurnsCrossfadeDurationChange}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Easing:</label>
                  <WSelect
                    value={localSettings.kenBurnsEasing}
                    onChange={handleKenBurnsEasingChange}
                    options={[
                      { value: 'ease-out', label: 'Ease Out' },
                      { value: 'ease-in', label: 'Ease In' },
                      { value: 'ease-in-out', label: 'Ease In-Out' },
                      { value: 'linear', label: 'Linear' }
                    ]}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Channel Auto-Fade */}
      <Card
        title="Channel Auto-Fade"
        separator
        desc="Automatically lower the opacity of channel items when they haven't been hovered over for a while, allowing the wallpaper to shine through. Hovering over any channel will restore full opacity."
        headerActions={
          <WToggle
            checked={localSettings.channelAutoFadeTimeout > 0}
            onChange={(checked) => {
              const value = checked ? 5 : 0;
              setLocalSettings(prev => ({ ...prev, channelAutoFadeTimeout: value }));
              onSettingChange('channelAutoFadeTimeout', value);
            }}
          />
        }
      >
        {localSettings.channelAutoFadeTimeout > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Fade Timeout: {localSettings.channelAutoFadeTimeout}s</div>
            <Slider
              value={localSettings.channelAutoFadeTimeout}
              min={1}
              max={30}
              step={1}
              onChange={handleChannelAutoFadeTimeoutChange}
            />
            <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
              <strong>Fade Timeout:</strong> The time in seconds before channels start to fade out when not hovered.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
});

ChannelsSettingsTab.displayName = 'ChannelsSettingsTab';

export default ChannelsSettingsTab; 