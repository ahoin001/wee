/**
 * Edit Home — per-kind widget settings for the selected tile.
 * Extend the switch when a new placeable kind needs arrange-tray controls.
 */
import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import {
  WeeButton,
  WeeModalShell,
  WeeSegmentedControl,
  WeeToggle,
} from '../../ui/wee';
import WInput from '../../ui/WInput';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  HOME_WEATHER_TEMP_UNITS,
  normalizeHomeWeatherTempUnit,
} from '../../utils/homeWeather';
import {
  DEFAULT_HOME_STEAM_WIDGET,
  HOME_STEAM_GUTTERS,
  normalizeHomeSteamWidget,
} from '../../utils/homeSteamWidgetPrefs';
import {
  defaultFrozenSpotifyLookName,
  saveFrozenSpotifyLookPreset,
} from '../../utils/presets/saveFrozenSpotifyLookPreset';

const STEAM_KIND_IDS = new Set(['steamRecent', 'steamMostPlayed', 'steamFriends']);

function WeatherWidgetSettings() {
  const tempUnitRaw = useConsolidatedAppStore((s) => s.ui?.homeWeatherTempUnit);
  const tempUnit = normalizeHomeWeatherTempUnit(tempUnitRaw);
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
  const homeSteamWidgetRaw = useConsolidatedAppStore((s) => s.ui?.homeSteamWidget);
  const prefs = useMemo(
    () => normalizeHomeSteamWidget(homeSteamWidgetRaw),
    [homeSteamWidgetRaw]
  );
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
    <div className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))] sm:text-right">
          Gutters
        </span>
        <WeeSegmentedControl
          size="sm"
          ariaLabel="Steam cover grid gutter"
          layoutId="homeArrangeSteamGutter"
          value={prefs.gutter}
          onChange={(gutter) => patchPrefs({ gutter })}
          options={Object.values(HOME_STEAM_GUTTERS).map((gutter) => ({
            value: gutter.id,
            label: gutter.label,
            title: `${gutter.label} spacing between covers`,
          }))}
        />
      </div>

      {showPlaytimeToggle ? (
        <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start sm:pl-[4.5rem]">
          <WeeToggle
            checked={prefs.showPlaytime}
            onChange={(showPlaytime) => patchPrefs({ showPlaytime })}
            label="Playtime"
            title="Show hours played from Steam library stats"
          />
          <WeeToggle
            checked={prefs.showName}
            onChange={(showName) => patchPrefs({ showName })}
            label="Titles"
            title="Show game name under each cover"
          />
          <button
            type="button"
            className="text-[9px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))] underline-offset-2 hover:text-[hsl(var(--text-secondary))] hover:underline"
            onClick={() => patchPrefs({ ...DEFAULT_HOME_STEAM_WIDGET })}
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="flex justify-center sm:justify-start sm:pl-[4.5rem]">
          <button
            type="button"
            className="text-[9px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))] underline-offset-2 hover:text-[hsl(var(--text-secondary))] hover:underline"
            onClick={() => patchPrefs({ ...DEFAULT_HOME_STEAM_WIDGET })}
          >
            Reset Steam look
          </button>
        </div>
      )}
    </div>
  );
}

SteamWidgetSettings.propTypes = {
  kindId: PropTypes.string,
};

function NowPlayingWidgetSettings() {
  const {
    spotifyMatchEnabled,
    liveGradientWallpaper,
    dynamicColors,
    extractedColors,
    immersiveMode,
    spotifyWidget,
  } = useConsolidatedAppStore(
    useShallow((s) => ({
      spotifyMatchEnabled: Boolean(s.ui?.spotifyMatchEnabled),
      liveGradientWallpaper: Boolean(s.spotify?.immersiveMode?.liveGradientWallpaper),
      dynamicColors: Boolean(s.floatingWidgets?.spotify?.settings?.dynamicColors),
      extractedColors: s.spotify?.extractedColors || null,
      immersiveMode: s.spotify?.immersiveMode || null,
      spotifyWidget: s.floatingWidgets?.spotify || null,
    }))
  );
  const actions = useConsolidatedAppStore((s) => s.actions);

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const showLivePalette = Boolean(
    (spotifyMatchEnabled || liveGradientWallpaper || dynamicColors) &&
      extractedColors?.primary
  );

  const flashStatus = useCallback((type, text, ms = 2800) => {
    setStatus({ type, text });
    window.setTimeout(() => setStatus({ type: '', text: '' }), ms);
  }, []);

  const handleRibbon = useCallback(
    (checked) => {
      const enabled = Boolean(checked);
      actions.setUIState({ spotifyMatchEnabled: enabled });
      if (enabled) {
        actions.setRibbonState({ dynamicRibbonColorEnabled: true });
      }
    },
    [actions]
  );

  const handleWallpaper = useCallback(
    (checked) => {
      const enabled = Boolean(checked);
      const prev = immersiveMode || {};
      actions.setSpotifyState({
        immersiveMode: {
          ...prev,
          liveGradientWallpaper: enabled,
          overlayMode: enabled ? true : Boolean(prev.overlayMode),
        },
      });
    },
    [actions, immersiveMode]
  );

  const handleDynamicColors = useCallback(
    (checked) => {
      const widget = spotifyWidget || { settings: {} };
      actions.setFloatingWidgetsState({
        spotify: {
          ...widget,
          settings: { ...widget.settings, dynamicColors: Boolean(checked) },
        },
      });
    },
    [actions, spotifyWidget]
  );

  const openSaveModal = useCallback(() => {
    if (!extractedColors?.primary) {
      flashStatus(
        'warning',
        'No album colors yet. Play something with Color Match on.'
      );
      return;
    }
    setPresetName(defaultFrozenSpotifyLookName());
    setNameModalOpen(true);
  }, [extractedColors, flashStatus]);

  const confirmSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await saveFrozenSpotifyLookPreset({ name: presetName });
      if (!result.ok) {
        flashStatus('warning', result.error);
        return;
      }
      setNameModalOpen(false);
      flashStatus('success', `Saved “${result.preset.name}” with frozen colors.`);
    } finally {
      setSaving(false);
    }
  }, [flashStatus, presetName, saving]);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <p className="m-0 max-w-[28rem] text-center text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
        Sample album art for ribbon, wallpaper wash, and media tiles. Works with Spotify,
        Apple Music, and other desktop players.
      </p>

      <div className="flex w-full max-w-[28rem] flex-col gap-2">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2">
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-black text-[hsl(var(--text-primary))]">
              Match ribbon &amp; chrome
            </p>
            <p className="m-0 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
              Tint dock ribbon from the playing track
            </p>
          </div>
          <WeeToggle
            checked={spotifyMatchEnabled}
            onChange={handleRibbon}
            title="Match ribbon & chrome to album art"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2">
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-black text-[hsl(var(--text-primary))]">
              Wallpaper color wash
            </p>
            <p className="m-0 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
              Soft album gradient over your wallpaper
            </p>
          </div>
          <WeeToggle
            checked={liveGradientWallpaper}
            onChange={handleWallpaper}
            title="Wallpaper color wash from album art"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2">
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-black text-[hsl(var(--text-primary))]">
              Media widget colors
            </p>
            <p className="m-0 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
              Floating player &amp; this tile use album accents
            </p>
          </div>
          <WeeToggle
            checked={dynamicColors}
            onChange={handleDynamicColors}
            title="Dynamic colors on media widgets"
          />
        </div>
      </div>

      {showLivePalette ? (
        <div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2">
          <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
            Live
          </span>
          {['primary', 'secondary', 'accent'].map((key) =>
            extractedColors?.[key] ? (
              <span
                key={key}
                className="h-5 w-5 rounded-full border border-[hsl(var(--border-primary)/0.35)] shadow-[var(--shadow-sm)]"
                style={{ background: extractedColors[key] }}
                title={key}
              />
            ) : null
          )}
        </div>
      ) : null}

      <WeeButton
        variant="secondary"
        size="sm"
        onClick={openSaveModal}
        disabled={!extractedColors?.primary}
        title={
          extractedColors?.primary
            ? 'Freeze the current matched colors into a visual preset'
            : 'Play a track with Color Match on to unlock'
        }
      >
        Save matched colors as preset
      </WeeButton>

      {status.text ? (
        <p
          className={[
            'm-0 max-w-[28rem] text-center text-[9px] font-bold',
            status.type === 'success'
              ? 'text-[hsl(var(--state-success))]'
              : 'text-[hsl(var(--state-warning))]',
          ].join(' ')}
        >
          {status.text}
        </p>
      ) : null}


      <WeeModalShell
        isOpen={nameModalOpen}
        onClose={() => setNameModalOpen(false)}
        headerTitle="Save matched colors"
        showRail={false}
        maxWidth="min(480px, 94vw)"
        footerContent={() => (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <WeeButton variant="secondary" onClick={() => setNameModalOpen(false)}>
              Cancel
            </WeeButton>
            <WeeButton
              variant="primary"
              onClick={confirmSave}
              disabled={!presetName.trim() || saving}
            >
              {saving ? 'Saving…' : 'Save preset'}
            </WeeButton>
          </div>
        )}
      >
        <div className="space-y-3">
          <p className="m-0 text-sm font-medium text-[hsl(var(--text-secondary))]">
            Freezes the live album palette with your current visual look. Find it under Looks.
          </p>
          {showLivePalette ? (
            <div className="flex items-center gap-2">
              {['primary', 'secondary', 'accent'].map((key) =>
                extractedColors?.[key] ? (
                  <span
                    key={key}
                    className="h-7 w-7 rounded-full border border-[hsl(var(--border-primary)/0.35)] shadow-[var(--shadow-sm)]"
                    style={{ background: extractedColors[key] }}
                  />
                ) : null
              )}
            </div>
          ) : null}
          <WInput
            variant="wee"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmSave();
            }}
          />
        </div>
      </WeeModalShell>
    </div>
  );
}

function HomeWidgetSettingsPanel({ kindId, nested = false }) {
  let title = null;
  let body = null;

  if (kindId === 'weather') {
    title = 'Weather';
    body = <WeatherWidgetSettings />;
  } else if (STEAM_KIND_IDS.has(kindId)) {
    title = 'Steam';
    body = <SteamWidgetSettings kindId={kindId} />;
  } else if (kindId === 'nowPlaying') {
    title = 'Now Playing';
    body = <NowPlayingWidgetSettings />;
  }

  if (!body) return null;

  return (
    <div
      className={
        nested
          ? 'flex w-full flex-col gap-1.5 px-0.5'
          : 'flex w-full flex-col gap-2 border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5'
      }
    >
      <span
        className={`px-0.5 text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-tertiary))] ${
          nested ? 'text-left' : 'text-center'
        }`}
      >
        {nested ? title : `Widget settings · ${title}`}
      </span>
      {body}
    </div>
  );
}

HomeWidgetSettingsPanel.propTypes = {
  kindId: PropTypes.string,
  nested: PropTypes.bool,
};

/** Whether Edit Home should expand the widget-settings tray for this kind. */
export function homeSlotKindHasWidgetSettings(kindId) {
  return kindId === 'weather' || kindId === 'nowPlaying' || STEAM_KIND_IDS.has(kindId);
}

export default React.memo(HomeWidgetSettingsPanel);
