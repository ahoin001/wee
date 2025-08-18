import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import WSelect from '../../ui/WSelect';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const TimeSettingsTab = React.memo(() => {
  // Use consolidated store for time settings
  const { time } = useConsolidatedAppStore();
  const { setTimeState } = useConsolidatedAppStore(state => state.actions);
  
  // Debug logging
  console.log('[TimeSettingsTab] Current time state:', time);
  
  // Memoize callback functions to prevent unnecessary re-renders
  const handleTimeColorChange = useCallback((e) => {
    setTimeState({ timeColor: e.target.value });
  }, [setTimeState]);

  const handleTimeFontChange = useCallback((value) => {
    setTimeState({ timeFont: value });
  }, [setTimeState]);

  const handleTimeFormat24hrChange = useCallback(() => {
    console.log('[TimeSettingsTab] Setting timeFormat24hr to true');
    setTimeState({ timeFormat24hr: true });
  }, [setTimeState]);

  const handleTimeFormat12hrChange = useCallback(() => {
    console.log('[TimeSettingsTab] Setting timeFormat24hr to false');
    setTimeState({ timeFormat24hr: false });
  }, [setTimeState]);

  const handleEnableTimePillChange = useCallback((checked) => {
    setTimeState({ enableTimePill: checked });
  }, [setTimeState]);

  const handleTimePillBlurChange = useCallback((value) => {
    setTimeState({ timePillBlur: value });
  }, [setTimeState]);

  const handleTimePillOpacityChange = useCallback((value) => {
    setTimeState({ timePillOpacity: value });
  }, [setTimeState]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Text variant="h2" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
        Time Display Settings
      </Text>
      
      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
        Customize the appearance and behavior of the time and date display.
      </Text>

      {/* Time Display Color */}
      <Card
        title="Time Display Color"
        separator
        desc="Choose the color for the time and date display text."
        actions={
          <>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <input
                  type="color"
                  value={time?.timeColor ?? '#ffffff'}
                  onChange={handleTimeColorChange}
                  style={{
                    width: 50,
                    height: 40,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                />
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: 14 }}>
                  {(time?.timeColor ?? '#ffffff').toUpperCase()}
                </span>
              </div>
              {(time?.recentTimeColors ?? []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: 'hsl(var(--text-secondary))', marginRight: 2 }}>Previous:</span>
                  {(time?.recentTimeColors ?? []).map((color, idx) => (
                    <button
                      key={color}
                      onClick={() => setTimeState({ timeColor: color })}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: color === (time?.timeColor ?? '#ffffff') ? '2px solid hsl(var(--wii-blue))' : '1.5px solid hsl(var(--border-secondary))',
                        background: color,
                        cursor: 'pointer',
                        outline: 'none',
                        marginLeft: idx === 0 ? 0 : 2
                      }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Font Selection */}
            <div style={{ marginTop: 18 }}>
              <WSelect
                label="Time Font"
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'digital', label: 'DigitalDisplayRegular-ODEO' }
                ]}
                value={time?.timeFont ?? 'default'}
                onChange={handleTimeFontChange}
              />
            </div>
          </>
        }
      />

      {/* Time Format */}
      <Card
        title="Time Format"
        separator
        desc="Choose between 12-hour and 24-hour time format."
        actions={
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', gap: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="timeFormat"
                  value="24hr"
                  checked={time?.timeFormat24hr ?? true}
                  onChange={(e) => {
                    console.log('[TimeSettingsTab] 24hr radio clicked, checked:', e.target.checked);
                    if (e.target.checked) {
                      handleTimeFormat24hrChange();
                    }
                  }}
                />
                24-Hour (13:30)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="timeFormat"
                  value="12hr"
                  checked={!(time?.timeFormat24hr ?? true)}
                  onChange={(e) => {
                    console.log('[TimeSettingsTab] 12hr radio clicked, checked:', e.target.checked);
                    if (e.target.checked) {
                      handleTimeFormat12hrChange();
                    }
                  }}
                />
                12-Hour (1:30 PM)
              </label>
            </div>
          </div>
        }
      />

      {/* Time Pill Display */}
      <Card
        title="Time Pill Display"
        separator
        desc="Enable the Apple-style liquid glass pill container for the time display."
        headerActions={
          <WToggle
            checked={time?.enableTimePill ?? true}
            onChange={handleEnableTimePillChange}
          />
        }
        actions={
          time?.enableTimePill && (
            <>
              <div style={{ marginTop: 14 }}>
                <div style={{ marginBottom: 16 }}>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Backdrop Blur
                  </Text>
                  <Slider
                    value={time?.timePillBlur ?? 8}
                    min={0}
                    max={20}
                    step={1}
                    onChange={handleTimePillBlurChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {time?.timePillBlur ?? 8}px
                  </Text>
                </div>
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Background Opacity
                  </Text>
                  <Slider
                    value={time?.timePillOpacity ?? 0.05}
                    min={0}
                    max={0.3}
                    step={0.01}
                    onChange={handleTimePillOpacityChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {Math.round((time?.timePillOpacity ?? 0.05) * 100)}%
                  </Text>
                </div>
              </div>
            </>
          )
        }
      />
    </div>
  );
});

TimeSettingsTab.displayName = 'TimeSettingsTab';

export default TimeSettingsTab; 