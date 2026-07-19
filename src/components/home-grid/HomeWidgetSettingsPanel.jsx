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
  WeeMorphStack,
  WeeRevealWhen,
  WeeSegmentedControl,
  WeeSlider,
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
  DEFAULT_HOME_CLOCK_WIDGET,
  HOME_CLOCK_ALIGN,
  HOME_CLOCK_DATE_STACK,
  normalizeHomeClockWidget,
} from '../../utils/homeClockWidgetPrefs';
import {
  normalizeHomeNowPlayingWidget,
  NOW_PLAYING_ART_LAYOUTS,
} from '../../utils/homeNowPlayingWidgetPrefs';
import {
  defaultFrozenSpotifyLookName,
  saveFrozenSpotifyLookPreset,
} from '../../utils/presets/saveFrozenSpotifyLookPreset';
import { liveColorMatchUiPatch } from '../../utils/appearance/liveColorMatchMode';
import { INPUT_COLOR_DEFAULT_HEX } from '../../design/runtimeColorStrings';
import { useTimeColor } from '../../utils/useConsolidatedAppHooks';

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
    extractedColors,
    immersiveMode,
    nowPlayingLooksRaw,
  } = useConsolidatedAppStore(
    useShallow((s) => ({
      spotifyMatchEnabled: Boolean(s.ui?.spotifyMatchEnabled),
      liveGradientWallpaper: Boolean(s.spotify?.immersiveMode?.liveGradientWallpaper),
      extractedColors: s.spotify?.extractedColors || null,
      immersiveMode: s.spotify?.immersiveMode || null,
      nowPlayingLooksRaw: s.ui?.homeNowPlayingWidget,
    }))
  );
  const actions = useConsolidatedAppStore((s) => s.actions);
  const npLooks = useMemo(
    () => normalizeHomeNowPlayingWidget(nowPlayingLooksRaw),
    [nowPlayingLooksRaw]
  );

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const showLivePalette = Boolean(extractedColors?.primary);

  const flashStatus = useCallback((type, text, ms = 2800) => {
    setStatus({ type, text });
    window.setTimeout(() => setStatus({ type: '', text: '' }), ms);
  }, []);

  const patchLooks = useCallback(
    (partial) => {
      const prev = normalizeHomeNowPlayingWidget(
        useConsolidatedAppStore.getState().ui?.homeNowPlayingWidget
      );
      actions.setUIState({
        homeNowPlayingWidget: normalizeHomeNowPlayingWidget({
          ...prev,
          ...partial,
        }),
      });
    },
    [actions]
  );

  const handleRibbon = useCallback(
    (checked) => {
      const enabled = Boolean(checked);
      actions.setUIState(
        enabled ? liveColorMatchUiPatch('spotify') : { spotifyMatchEnabled: false }
      );
      if (enabled) {
        actions.setRibbonState({ dynamicRibbonColorEnabled: true });
      } else if (immersiveMode?.liveGradientWallpaper) {
        // Album wash rides on Now Playing match — turning match off turns the wash off too.
        actions.setSpotifyState({
          immersiveMode: { ...immersiveMode, liveGradientWallpaper: false },
        });
      }
    },
    [actions, immersiveMode]
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

  const openSaveModal = useCallback(() => {
    if (!extractedColors?.primary) {
      flashStatus('warning', 'No album colors yet. Play something with cover art.');
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
        Album art always color-matches this tile. Tune layout and backdrop, or tint ribbon and
        wallpaper separately.
      </p>

      <div className="flex w-full max-w-[28rem] flex-col gap-2">
        <div className="rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2.5">
          <p className="m-0 mb-2 text-[11px] font-black text-[hsl(var(--text-primary))]">
            Cover layout
          </p>
          <WeeSegmentedControl
            size="sm"
            ariaLabel="Now Playing cover layout"
            layoutId="homeNowPlayingArtLayout"
            value={npLooks.artLayout}
            onChange={(next) => patchLooks({ artLayout: next })}
            options={Object.values(NOW_PLAYING_ART_LAYOUTS).map((opt) => ({
              value: opt.id,
              label: opt.label,
              title:
                opt.id === 'hero'
                  ? 'Large square cover above the playback panel'
                  : 'Square cover inside the panel beside the controls',
            }))}
          />
          <p className="m-0 mt-1.5 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
            Hero floats the cover; Inline docks it next to transport
          </p>
        </div>

        <div className="rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="m-0 text-[11px] font-black text-[hsl(var(--text-primary))]">
              Backdrop blur
            </p>
            <span className="text-[9px] font-bold tabular-nums text-[hsl(var(--text-tertiary))]">
              {Math.round(npLooks.backdropBlur)}px
            </span>
          </div>
          <WeeSlider
            aria-label="Backdrop blur"
            min={0}
            max={40}
            step={1}
            value={npLooks.backdropBlur}
            onChange={(value) => patchLooks({ backdropBlur: value })}
          />
        </div>

        <div className="rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="m-0 text-[11px] font-black text-[hsl(var(--text-primary))]">
              Backdrop darken
            </p>
            <span className="text-[9px] font-bold tabular-nums text-[hsl(var(--text-tertiary))]">
              {Math.round(npLooks.backdropDarken * 100)}%
            </span>
          </div>
          <WeeSlider
            aria-label="Backdrop darken"
            min={0}
            max={85}
            step={1}
            value={Math.round(npLooks.backdropDarken * 100)}
            onChange={(value) => patchLooks({ backdropDarken: value / 100 })}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2">
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-black text-[hsl(var(--text-primary))]">
              Visualizer
            </p>
            <p className="m-0 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
              Reactive bars under the cover while playing
            </p>
          </div>
          <WeeToggle
            checked={npLooks.showVisualizer}
            onChange={(checked) => patchLooks({ showVisualizer: Boolean(checked) })}
            title="Show music visualizer bars"
          />
        </div>

        <WeeMorphStack open={spotifyMatchEnabled} gapOpen="gap-2">
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

          <WeeRevealWhen when={spotifyMatchEnabled}>
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
          </WeeRevealWhen>
        </WeeMorphStack>
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
            : 'Play a track with cover art to unlock'
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

function ClockWidgetSettings() {
  const clockPrefsRaw = useConsolidatedAppStore((s) => s.ui?.homeClockWidget);
  const looks = useMemo(() => normalizeHomeClockWidget(clockPrefsRaw), [clockPrefsRaw]);
  const timeColor = useTimeColor();
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);
  const pickerColor = looks.color || timeColor || INPUT_COLOR_DEFAULT_HEX;

  const patchLooks = useCallback(
    (partial) => {
      const prev = normalizeHomeClockWidget(
        useConsolidatedAppStore.getState().ui?.homeClockWidget
      );
      setUIState({
        homeClockWidget: normalizeHomeClockWidget({ ...prev, ...partial }),
      });
    },
    [setUIState]
  );

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))] sm:text-right">
          Align
        </span>
        <WeeSegmentedControl
          size="sm"
          ariaLabel="Clock text alignment"
          layoutId="homeArrangeClockAlign"
          value={looks.align}
          onChange={(align) => patchLooks({ align })}
          options={[
            { value: HOME_CLOCK_ALIGN.left, label: 'Left', title: 'Align time and date left' },
            { value: HOME_CLOCK_ALIGN.center, label: 'Middle', title: 'Center time and date' },
            { value: HOME_CLOCK_ALIGN.right, label: 'Right', title: 'Align time and date right' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))] sm:text-right">
          Date
        </span>
        <WeeSegmentedControl
          size="sm"
          ariaLabel="Clock date stack position"
          layoutId="homeArrangeClockDateStack"
          value={looks.dateStack}
          onChange={(dateStack) => patchLooks({ dateStack })}
          options={[
            { value: HOME_CLOCK_DATE_STACK.above, label: 'Above', title: 'Date above time' },
            { value: HOME_CLOCK_DATE_STACK.below, label: 'Below', title: 'Date below time' },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:pl-[4.5rem]">
        <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
          Color
        </span>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="color"
            value={pickerColor}
            onChange={(e) => patchLooks({ color: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded-md border-2 border-[hsl(var(--border-primary)/0.45)] bg-transparent p-0.5"
            title="Clock text color"
            aria-label="Clock text color"
          />
          <span className="font-mono text-[11px] font-semibold text-[hsl(var(--text-secondary))]">
            {pickerColor.toUpperCase()}
          </span>
        </label>
        <button
          type="button"
          className="text-[9px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))] underline-offset-2 hover:text-[hsl(var(--text-secondary))] hover:underline"
          onClick={() => patchLooks({ ...DEFAULT_HOME_CLOCK_WIDGET })}
        >
          Reset look
        </button>
      </div>
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
  } else if (kindId === 'clock') {
    title = 'Clock';
    body = <ClockWidgetSettings />;
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
  return (
    kindId === 'weather' ||
    kindId === 'nowPlaying' ||
    kindId === 'clock' ||
    STEAM_KIND_IDS.has(kindId)
  );
}

export default React.memo(HomeWidgetSettingsPanel);
