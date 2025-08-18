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
  
  // Memoize callback functions to prevent unnecessary re-renders
  const handleTimeColorChange = useCallback((e) => {
    setTimeState({ color: e.target.value });
  }, [setTimeState]);

  const handleTimeFontChange = useCallback((value) => {
    setTimeState({ font: value });
  }, [setTimeState]);

  const handleEnableTimePillChange = useCallback((checked) => {
    setTimeState({ enablePill: checked });
  }, [setTimeState]);

  const handleTimePillBlurChange = useCallback((value) => {
    setTimeState({ pillBlur: value });
  }, [setTimeState]);

  const handleTimePillOpacityChange = useCallback((value) => {
    setTimeState({ pillOpacity: value });
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
                  value={time?.color ?? '#ffffff'}
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
                  {(time?.color ?? '#ffffff').toUpperCase()}
                </span>
              </div>
              {(time?.recentColors ?? []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: 'hsl(var(--text-secondary))', marginRight: 2 }}>Previous:</span>
                  {(time?.recentColors ?? []).map((color, idx) => (
                    <button
                      key={color}
                      onClick={() => setTimeState({ color: color })}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: color === (time?.color ?? '#ffffff') ? '2px solid hsl(var(--wii-blue))' : '1.5px solid hsl(var(--border-secondary))',
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
                value={time?.font ?? 'default'}
                onChange={handleTimeFontChange}
              />
            </div>
          </>
        }
      />

      {/* Time Pill Display */}
      <Card
        title="Time Pill Display"
        separator
        desc="Enable the Apple-style liquid glass pill container for the time display."
        headerActions={
          <WToggle
            checked={time?.enablePill ?? true}
            onChange={handleEnableTimePillChange}
          />
        }
        actions={
          time?.enablePill && (
            <>
              <div style={{ marginTop: 14 }}>
                <div style={{ marginBottom: 16 }}>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Backdrop Blur
                  </Text>
                  <Slider
                    value={time?.pillBlur ?? 8}
                    min={0}
                    max={20}
                    step={1}
                    onChange={handleTimePillBlurChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {time?.pillBlur ?? 8}px
                  </Text>
                </div>
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Background Opacity
                  </Text>
                  <Slider
                    value={time?.pillOpacity ?? 0.05}
                    min={0}
                    max={0.3}
                    step={0.01}
                    onChange={handleTimePillOpacityChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {Math.round((time?.pillOpacity ?? 0.05) * 100)}%
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