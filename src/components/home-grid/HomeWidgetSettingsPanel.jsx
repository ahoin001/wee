/**
 * Edit Home — per-kind widget settings for the selected tile.
 * Extend the switch when a new placeable kind needs arrange-tray controls.
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { WeeSegmentedControl, WeeToggle } from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  HOME_WEATHER_TEMP_UNITS,
  normalizeHomeWeatherTempUnit,
} from '../../utils/homeWeather';
import {
  DEFAULT_HOME_STEAM_WIDGET,
  HOME_STEAM_SCROLL_AXES,
  HOME_STEAM_TILE_SIZES,
  normalizeHomeSteamWidget,
} from '../../utils/homeSteamWidgetPrefs';

const STEAM_KIND_IDS = new Set(['steamRecent', 'steamMostPlayed', 'steamFriends']);

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

function SteamWidgetSettings({ kindId }) {
  const prefs = useConsolidatedAppStore((s) => normalizeHomeSteamWidget(s.ui?.homeSteamWidget));
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);
  const showPlaytimeToggle = kindId === 'steamRecent' || kindId === 'steamMostPlayed';

  const patchPrefs = useCallback(
    (partial) => {
      const prev = normalizeHomeSteamWidget(
        useConsolidatedAppStore.getState().ui?.homeSteamWidget
      );
      setUIState({
        homeSteamWidget: normalizeHomeSteamWidget({ ...prev, ...partial }),
      });
    },
    [setUIState]
  );

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
          Cover size
        </span>
        <WeeSegmentedControl
          size="sm"
          ariaLabel="Steam cover tile size"
          layoutId="homeArrangeSteamTileSize"
          value={prefs.tileSize}
          onChange={(tileSize) => patchPrefs({ tileSize })}
          options={Object.values(HOME_STEAM_TILE_SIZES).map((size) => ({
            value: size.id,
            label: size.label,
            title: `${size.label} · ${size.columns} columns`,
          }))}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
          Scroll
        </span>
        <WeeSegmentedControl
          size="sm"
          ariaLabel="Steam shelf scroll direction"
          layoutId="homeArrangeSteamScrollAxis"
          value={prefs.scrollAxis}
          onChange={(scrollAxis) => patchPrefs({ scrollAxis })}
          options={[
            {
              value: HOME_STEAM_SCROLL_AXES.auto,
              label: 'Auto',
              title: 'Tall widgets scroll vertically; wide widgets scroll horizontally',
            },
            {
              value: HOME_STEAM_SCROLL_AXES.vertical,
              label: 'Vertical',
              title: 'Always scroll vertically',
            },
            {
              value: HOME_STEAM_SCROLL_AXES.horizontal,
              label: 'Horizontal',
              title: 'Always scroll horizontally',
            },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {showPlaytimeToggle ? (
          <WeeToggle
            checked={prefs.showPlaytime}
            onChange={(showPlaytime) => patchPrefs({ showPlaytime })}
            label="Playtime"
            title="Show hours played from Steam library stats"
          />
        ) : null}
        {showPlaytimeToggle ? (
          <WeeToggle
            checked={prefs.showName}
            onChange={(showName) => patchPrefs({ showName })}
            label="Titles"
            title="Show game name under each cover"
          />
        ) : null}
      </div>

      <p className="m-0 max-w-[28rem] text-center text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
        Shared look for all Steam Home widgets. Playtime uses free Steam library stats.
        Resize the tile to 3×2 for a wide horizontal shelf.
      </p>

      <button
        type="button"
        className="text-[9px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))] underline-offset-2 hover:text-[hsl(var(--text-secondary))] hover:underline"
        onClick={() => patchPrefs({ ...DEFAULT_HOME_STEAM_WIDGET })}
      >
        Reset Steam look
      </button>
    </div>
  );
}

SteamWidgetSettings.propTypes = {
  kindId: PropTypes.string,
};

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

  if (STEAM_KIND_IDS.has(kindId)) {
    return (
      <div className="flex w-full flex-col gap-2 border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
        <span className="px-0.5 text-center text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-tertiary))]">
          Widget settings · Steam
        </span>
        <SteamWidgetSettings kindId={kindId} />
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
  return kindId === 'weather' || STEAM_KIND_IDS.has(kindId);
}

export default React.memo(HomeWidgetSettingsPanel);
