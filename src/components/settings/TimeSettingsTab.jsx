import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import Toggle from '../../ui/Toggle';

const TimeSettingsTab = React.memo(({ localSettings, updateLocalSetting }) => {
  // Memoize callback functions to prevent unnecessary re-renders
  const handleTimeColorChange = useCallback((e) => {
    updateLocalSetting('time', 'timeColor', e.target.value);
  }, [updateLocalSetting]);

  const handleTimeFontChange = useCallback((e) => {
    updateLocalSetting('time', 'timeFont', e.target.value);
  }, [updateLocalSetting]);

  const handleTimeFormat24hrChange = useCallback(() => {
    updateLocalSetting('time', 'timeFormat24hr', true);
  }, [updateLocalSetting]);

  const handleTimeFormat12hrChange = useCallback(() => {
    updateLocalSetting('time', 'timeFormat24hr', false);
  }, [updateLocalSetting]);

  const handleEnableTimePillChange = useCallback((checked) => {
    updateLocalSetting('time', 'enableTimePill', checked);
  }, [updateLocalSetting]);

  const handleTimePillBlurChange = useCallback((e) => {
    updateLocalSetting('time', 'timePillBlur', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleTimePillOpacityChange = useCallback((e) => {
    updateLocalSetting('time', 'timePillOpacity', Number(e.target.value));
  }, [updateLocalSetting]);

  return (
    <div>
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
                  value={localSettings.time?.timeColor ?? '#ffffff'}
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
                  {(localSettings.time?.timeColor ?? '#ffffff').toUpperCase()}
                </span>
              </div>
              {(localSettings.time?.recentTimeColors ?? []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: 'hsl(var(--text-secondary))', marginRight: 2 }}>Previous:</span>
                  {(localSettings.time?.recentTimeColors ?? []).map((color, idx) => (
                    <button
                      key={color}
                      onClick={() => updateLocalSetting('time', 'timeColor', color)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: color === (localSettings.time?.timeColor ?? '#ffffff') ? '2px solid hsl(var(--wii-blue))' : '1.5px solid hsl(var(--border-secondary))',
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
              <label style={{ fontWeight: 500, marginRight: 10 }}>Time Font</label>
              <select
                value={localSettings.time?.timeFont ?? 'default'}
                onChange={handleTimeFontChange}
                style={{ padding: 4, borderRadius: 6 }}
              >
                <option value="default">Default</option>
                <option value="digital">DigitalDisplayRegular-ODEO</option>
              </select>
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
                  checked={localSettings.time?.timeFormat24hr ?? true}
                  onChange={handleTimeFormat24hrChange}
                />
                24-Hour (13:30)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="timeFormat"
                  value="12hr"
                  checked={!(localSettings.time?.timeFormat24hr ?? true)}
                  onChange={handleTimeFormat12hrChange}
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
          <Toggle
            checked={localSettings.time?.enableTimePill ?? true}
            onChange={handleEnableTimePillChange}
          />
        }
        actions={
          localSettings.time?.enableTimePill && (
            <>
              <div style={{ marginTop: 14 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Backdrop Blur: {localSettings.time?.timePillBlur ?? 8}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={localSettings.time?.timePillBlur ?? 8}
                    onChange={handleTimePillBlurChange}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Background Opacity: {Math.round((localSettings.time?.timePillOpacity ?? 0.05) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.3"
                    step="0.01"
                    value={localSettings.time?.timePillOpacity ?? 0.05}
                    onChange={handleTimePillOpacityChange}
                    style={{ width: '100%' }}
                  />
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