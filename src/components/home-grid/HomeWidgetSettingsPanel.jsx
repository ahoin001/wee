/**
 * Edit Home — per-kind widget settings for the selected tile.
 * Extend the switch when a new placeable kind needs arrange-tray controls.
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { WeeSegmentedControl } from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  HOME_WEATHER_TEMP_UNITS,
  normalizeHomeWeatherTempUnit,
} from '../../utils/homeWeather';

function WeatherWidgetSettings() {
  const tempUnit = useConsolidatedAppStore((s) =>
    normalizeHomeWeatherTempUnit(s.ui?.homeWeatherTempUnit)
  );
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);

  const handleUnitChange = useCallback(
    (next) => {
      setUIState({ homeWeatherTempUnit: normalizeHomeWeatherTempUnit(next) });
    },
    [setUIState]
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
        Temperature
      </span>
      <WeeSegmentedControl
        size="sm"
        ariaLabel="Temperature unit"
        layoutId="homeArrangeWeatherTempUnit"
        value={tempUnit}
        onChange={handleUnitChange}
        options={[
          {
            value: HOME_WEATHER_TEMP_UNITS.F,
            label: '°F',
            title: 'Fahrenheit (default)',
          },
          {
            value: HOME_WEATHER_TEMP_UNITS.C,
            label: '°C',
            title: 'Celsius',
          },
        ]}
      />
    </div>
  );
}

function HomeWidgetSettingsPanel({ kindId }) {
  if (kindId === 'weather') {
    return (
      <div className="flex w-full flex-col gap-2 border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
        <span className="px-0.5 text-center text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-tertiary))]">
          Widget settings · Weather
        </span>
        <WeatherWidgetSettings />
      </div>
    );
  }

  return null;
}

HomeWidgetSettingsPanel.propTypes = {
  kindId: PropTypes.string,
};

/** Whether Edit Home should expand the widget-settings tray for this kind. */
export function homeSlotKindHasWidgetSettings(kindId) {
  return kindId === 'weather';
}

export default React.memo(HomeWidgetSettingsPanel);
