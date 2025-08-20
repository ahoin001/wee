import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import WSelect from '../../ui/WSelect';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const ChannelsSettingsTab = React.memo(() => {
  // Get channel settings from consolidated store
  const { channels, actions } = useConsolidatedAppStore();
  const settings = channels?.settings || {};
  
  // Memoize callback functions to prevent unnecessary re-renders
  const handleAnimatedOnHoverChange = useCallback((checked) => {
    actions.setChannelSettings({ animatedOnHover: checked });
  }, [actions]);

  const handleIdleAnimationEnabledChange = useCallback((checked) => {
    actions.setChannelSettings({ idleAnimationEnabled: checked });
  }, [actions]);

  const handleKenBurnsEnabledChange = useCallback((checked) => {
    actions.setChannelSettings({ kenBurnsEnabled: checked });
  }, [actions]);

  const handleChannelAutoFadeTimeoutChange = useCallback((value) => {
    actions.setChannelSettings({ channelAutoFadeTimeout: value });
  }, [actions]);

  const handleAdaptiveEmptyChannelsChange = useCallback((checked) => {
    actions.setChannelSettings({ adaptiveEmptyChannels: checked });
  }, [actions]);

  const handleChannelAnimationChange = useCallback((value) => {
    actions.setChannelSettings({ animation: value });
  }, [actions]);

  const handleIdleAnimationIntervalChange = useCallback((value) => {
    actions.setChannelSettings({ idleAnimationInterval: value });
  }, [actions]);

  const handleKenBurnsModeChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsMode: value });
  }, [actions]);

  const handleKenBurnsHoverScaleChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsHoverScale: value });
  }, [actions]);

  const handleKenBurnsAutoplayScaleChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsAutoplayScale: value });
  }, [actions]);

  const handleKenBurnsHoverDurationChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsHoverDuration: value });
  }, [actions]);

  const handleKenBurnsAutoplayDurationChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsAutoplayDuration: value });
  }, [actions]);

  const handleKenBurnsCrossfadeDurationChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsCrossfadeDuration: value });
  }, [actions]);

  const handleKenBurnsEasingChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsEasing: value });
  }, [actions]);

  const handleIdleAnimationTypeToggle = useCallback((type) => {
    const currentTypes = settings.idleAnimationTypes || ['pulse', 'bounce', 'glow'];
    const newTypes = currentTypes.includes(type) 
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    actions.setChannelSettings({ idleAnimationTypes: newTypes });
  }, [actions, settings.idleAnimationTypes]);

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
            checked={settings.adaptiveEmptyChannels ?? true}
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
            checked={settings.animatedOnHover ?? false}
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
            checked={settings.idleAnimationEnabled ?? false}
            onChange={handleIdleAnimationEnabledChange}
          />
        }
      >
        {settings.idleAnimationEnabled && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Animation Types:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['pulse', 'bounce', 'glow', 'heartbeat', 'shake', 'wiggle'].map(type => (
                  <WToggle
                    key={type}
                    checked={(settings.idleAnimationTypes || ['pulse', 'bounce', 'glow']).includes(type)}
                    onChange={() => handleIdleAnimationTypeToggle(type)}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    style={{ fontSize: 14 }}
                  />
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Animation Interval: {settings.idleAnimationInterval ?? 8} seconds</div>
              <Slider
                value={settings.idleAnimationInterval ?? 8}
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
            checked={settings.kenBurnsEnabled ?? false}
            onChange={handleKenBurnsEnabledChange}
          />
        }
      >
        {settings.kenBurnsEnabled && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Trigger Mode:</div>
              <WSelect
                value={settings.kenBurnsMode ?? 'hover'}
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
                  <label style={{ fontSize: 12, color: '#666' }}>Hover Scale: {settings.kenBurnsHoverScale ?? 1.1}</label>
                  <Slider
                    value={settings.kenBurnsHoverScale ?? 1.1}
                    min={1.0}
                    max={1.5}
                    step={0.05}
                    onChange={handleKenBurnsHoverScaleChange}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Autoplay Scale: {settings.kenBurnsAutoplayScale ?? 1.15}</label>
                  <Slider
                    value={settings.kenBurnsAutoplayScale ?? 1.15}
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
                  <label style={{ fontSize: 12, color: '#666' }}>Hover Duration: {settings.kenBurnsHoverDuration ?? 8000}ms</label>
                  <Slider
                    value={settings.kenBurnsHoverDuration ?? 8000}
                    min={2000}
                    max={15000}
                    step={500}
                    onChange={handleKenBurnsHoverDurationChange}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Autoplay Duration: {settings.kenBurnsAutoplayDuration ?? 12000}ms</label>
                  <Slider
                    value={settings.kenBurnsAutoplayDuration ?? 12000}
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
                  <label style={{ fontSize: 12, color: '#666' }}>Crossfade Duration: {settings.kenBurnsCrossfadeDuration ?? 1000}ms</label>
                  <Slider
                    value={settings.kenBurnsCrossfadeDuration ?? 1000}
                    min={500}
                    max={3000}
                    step={100}
                    onChange={handleKenBurnsCrossfadeDurationChange}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Easing:</label>
                  <WSelect
                    value={settings.kenBurnsEasing ?? 'ease-out'}
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
            checked={(settings.channelAutoFadeTimeout ?? 5) > 0}
            onChange={(checked) => {
              const value = checked ? 5 : 0;
              actions.setChannelSettings({ channelAutoFadeTimeout: value });
            }}
          />
        }
      >
        {(settings.channelAutoFadeTimeout ?? 5) > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Fade Timeout: {settings.channelAutoFadeTimeout ?? 5}s</div>
            <Slider
              value={settings.channelAutoFadeTimeout ?? 5}
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