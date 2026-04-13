import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import WSelect from '../../ui/WSelect';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { INPUT_COLOR_DEFAULT_HEX } from '../../design/runtimeColorStrings.js';
import '../settings-modal-forms.css';

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
    <div className="flex flex-col gap-6">
      <Text variant="h2" className="mb-2 text-[hsl(var(--text-primary))]">
        Time Display Settings
      </Text>
      
      <Text variant="body" className="mb-4 text-[hsl(var(--text-secondary))]">
        Customize the appearance and behavior of the time and date display.
      </Text>

      {/* Time Display Color */}
      <Card
        title="Time Display Color"
        separator
        desc="Choose the color for the time and date display text."
        actions={
          <>
            <div className="modal-section-mt">
              <div className="modal-color-row">
                <input
                  type="color"
                  value={time?.color ?? INPUT_COLOR_DEFAULT_HEX}
                  onChange={handleTimeColorChange}
                  className="modal-color-input"
                />
                <span className="modal-hex-muted">
                  {(time?.color ?? INPUT_COLOR_DEFAULT_HEX).toUpperCase()}
                </span>
              </div>
              {(time?.recentColors ?? []).length > 0 && (
                <div className="modal-prev-row">
                  <span className="modal-prev-label">Previous:</span>
                  {(time?.recentColors ?? []).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTimeState({ color: color })}
                      className={`modal-swatch ${color === (time?.color ?? INPUT_COLOR_DEFAULT_HEX) ? 'modal-swatch--active' : ''}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Font Selection */}
            <div className="modal-font-row">
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
              <div className="modal-section-mt">
                <div className="modal-mb-12">
                  <Text variant="body" className="mb-2 text-[hsl(var(--text-secondary))]">
                    Backdrop Blur
                  </Text>
                  <Slider
                    value={time?.pillBlur ?? 8}
                    min={0}
                    max={20}
                    step={1}
                    onChange={handleTimePillBlurChange}
                  />
                  <Text variant="caption" className="mt-1 text-[hsl(var(--text-tertiary))]">
                    {time?.pillBlur ?? 8}px
                  </Text>
                </div>
                <div>
                  <Text variant="body" className="mb-2 text-[hsl(var(--text-secondary))]">
                    Background Opacity
                  </Text>
                  <Slider
                    value={time?.pillOpacity ?? 0.05}
                    min={0}
                    max={0.3}
                    step={0.01}
                    onChange={handleTimePillOpacityChange}
                  />
                  <Text variant="caption" className="mt-1 text-[hsl(var(--text-tertiary))]">
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
