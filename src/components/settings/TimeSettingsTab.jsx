import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import WToggle from '../../ui/WToggle';
import WSelect from '../../ui/WSelect';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { INPUT_COLOR_DEFAULT_HEX } from '../../design/runtimeColorStrings.js';
import SettingsWeeSection from './SettingsWeeSection';
import { WeeModalFieldCard } from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import './settings-wee-panels.css';
import './settings-modal-forms.css';

const TimeSettingsTab = React.memo(() => {
  const time = useConsolidatedAppStore(useShallow((state) => state.time));
  const { setTimeState } = useConsolidatedAppStore((state) => state.actions);

  const handleTimeColorChange = useCallback(
    (e) => {
      setTimeState({ color: e.target.value });
    },
    [setTimeState],
  );

  const handleTimeFontChange = useCallback(
    (value) => {
      setTimeState({ font: value });
    },
    [setTimeState],
  );

  const handleEnableTimePillChange = useCallback(
    (checked) => {
      setTimeState({ enablePill: checked });
    },
    [setTimeState],
  );

  const handleTimePillBlurChange = useCallback(
    (value) => {
      setTimeState({ pillBlur: value });
    },
    [setTimeState],
  );

  const handleTimePillOpacityChange = useCallback(
    (value) => {
      setTimeState({ pillOpacity: value });
    },
    [setTimeState],
  );

  return (
    <div className="settings-wee-tab-root pb-12">
      <SettingsTabPageHeader title="Time" subtitle="Clock & pill display" />

      <SettingsWeeSection eyebrow="Color & font">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <Text variant="h3" className="mb-1 playful-hero-text">
            Time display color
          </Text>
          <Text variant="desc" className="mb-4">
            Choose the color for the time and date display text.
          </Text>
          <div className="modal-section-mt">
            <div className="modal-color-row">
              <input
                type="color"
                value={time?.color ?? INPUT_COLOR_DEFAULT_HEX}
                onChange={handleTimeColorChange}
                className="modal-color-input"
              />
              <span className="modal-hex-muted">{(time?.color ?? INPUT_COLOR_DEFAULT_HEX).toUpperCase()}</span>
            </div>
            {(time?.recentColors ?? []).length > 0 && (
              <div className="modal-prev-row">
                <span className="modal-prev-label">Previous:</span>
                {(time?.recentColors ?? []).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setTimeState({ color })}
                    className={`modal-swatch ${color === (time?.color ?? INPUT_COLOR_DEFAULT_HEX) ? 'modal-swatch--active' : ''}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="modal-font-row mt-4">
            <WSelect
              label="Time font"
              options={[
                { value: 'default', label: 'Default' },
                { value: 'digital', label: 'DigitalDisplayRegular-ODEO' },
              ]}
              value={time?.font ?? 'default'}
              onChange={handleTimeFontChange}
            />
          </div>
        </WeeModalFieldCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Time pill">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Text variant="h3" className="mb-1 playful-hero-text">
                Time pill display
              </Text>
              <Text variant="desc" className="!m-0">
                Apple-style liquid glass container around the clock (optional).
              </Text>
            </div>
            <WToggle
              checked={time?.enablePill ?? true}
              onChange={handleEnableTimePillChange}
              disableLabelClick
              title="Toggle the frosted pill behind the time"
            />
          </div>
          {time?.enablePill ? (
            <div className="settings-wee-panel__body border-t border-[hsl(var(--border-primary)/0.22)] pt-4">
              <div className="modal-mb-12">
                <Text variant="body" className="mb-2 text-[hsl(var(--text-secondary))]">
                  Backdrop blur
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
                  Background opacity
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
          ) : null}
        </WeeModalFieldCard>
      </SettingsWeeSection>
    </div>
  );
});

TimeSettingsTab.displayName = 'TimeSettingsTab';

export default TimeSettingsTab;
