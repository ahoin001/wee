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
  HOME_STEAM_SCROLL_AXES,
  HOME_STEAM_TILE_SIZES,
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

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
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

function formatChars(n) {
  const v = Number(n) || 0;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

function DebugRow({ label, value, ok }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-[hsl(var(--border-primary)/0.15)] py-0.5 last:border-b-0">
      <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.1em] text-[hsl(var(--text-tertiary))]">
        {label}
      </span>
      <span
        className={[
          'min-w-0 break-all text-right text-[9px] font-bold leading-snug',
          ok === true
            ? 'text-[hsl(var(--state-success))]'
            : ok === false
              ? 'text-[hsl(var(--state-warning))]'
              : 'text-[hsl(var(--text-secondary))]',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}

DebugRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  ok: PropTypes.bool,
};

/** Live SMTC / Now Playing diagnostics for Apple Music art troubleshooting. */
function NowPlayingSmtcDebugPanel() {
  const {
    preference,
    systemEnabled,
    systemMedia,
    nowPlaying,
  } = useConsolidatedAppStore(
    useShallow((s) => ({
      preference: s.ui?.nowPlayingSourcePreference || 'auto',
      systemEnabled: s.ui?.systemMediaEnabled !== false,
      systemMedia: s.systemMedia || null,
      nowPlaying: s.nowPlaying || null,
    }))
  );

  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const session = systemMedia?.session || null;
  const sessions = Array.isArray(systemMedia?.sessions) ? systemMedia.sessions : [];
  const artDebug = systemMedia?.artDebug || null;
  const compressNotes = Array.isArray(artDebug?.lastCompress) ? artDebug.lastCompress : [];
  const diagnostics = Array.isArray(artDebug?.diagnostics) ? artDebug.diagnostics : [];

  const primaryNote =
    compressNotes.find((n) => n?.id && session?.id && n.id === session.id) ||
    compressNotes.find((n) => n?.includeThumbnail) ||
    compressNotes[0] ||
    null;

  const hasThumb = Boolean(session?.thumbnail);
  const npHasArt = Boolean(nowPlaying?.albumArtUrl);
  const bridgeStatus = !systemEnabled
    ? 'disabled'
    : systemMedia?.starting
      ? 'starting'
      : systemMedia?.error
        ? 'error'
        : systemMedia?.available
          ? 'available'
          : 'unavailable';

  const dump = useMemo(
    () => ({
      preference,
      systemEnabled,
      bridgeStatus,
      error: systemMedia?.error || null,
      backendPath: artDebug?.backendPath || null,
      sessionCount: sessions.length,
      primary: session
        ? {
            app: session.sourceAppDisplayName || session.sourceAppUserModelId || '',
            aumid: session.sourceAppUserModelId || '',
            title: session.title || '',
            artist: session.artist || '',
            status: session.playbackStatus || '',
            hasThumbnail: hasThumb,
            thumbnailChars: session.thumbnail ? String(session.thumbnail).length : 0,
            thumbnailMime: String(session.thumbnail || '').match(/^data:([^;]+)/)?.[1] || '',
          }
        : null,
      nowPlaying: nowPlaying
        ? {
            source: nowPlaying.source || null,
            appName: nowPlaying.appName || '',
            trackName: nowPlaying.trackName || '',
            hasAlbumArt: npHasArt,
            albumArtChars: nowPlaying.albumArtUrl
              ? String(nowPlaying.albumArtUrl).length
              : 0,
            controlsVia: nowPlaying.controlsVia || null,
          }
        : null,
      lastCompress: compressNotes,
      diagnostics,
      updatedAt: artDebug?.updatedAt || null,
    }),
    [
      preference,
      systemEnabled,
      bridgeStatus,
      systemMedia?.error,
      artDebug,
      sessions.length,
      session,
      hasThumb,
      nowPlaying,
      npHasArt,
      compressNotes,
      diagnostics,
    ]
  );

  const copyDump = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(dump, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [dump]);

  return (
    <div className="w-full max-w-[28rem] rounded-xl border border-[hsl(var(--border-primary)/0.3)] bg-[hsl(var(--surface-secondary)/0.55)] px-2.5 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <button
          type="button"
          className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))]"
          onClick={() => setExpanded((v) => !v)}
        >
          SMTC debug {expanded ? '▾' : '▸'}
        </button>
        <button
          type="button"
          className="text-[8px] font-black uppercase tracking-[0.1em] text-[hsl(var(--text-tertiary))] underline-offset-2 hover:text-[hsl(var(--text-secondary))] hover:underline"
          onClick={copyDump}
        >
          {copied ? 'Copied' : 'Copy dump'}
        </button>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-0.5">
          <DebugRow
            label="Bridge"
            value={bridgeStatus}
            ok={bridgeStatus === 'available'}
          />
          <DebugRow label="Preference" value={preference} />
          <DebugRow
            label="Sessions"
            value={`${sessions.length} open`}
            ok={sessions.length > 0}
          />
          <DebugRow
            label="Primary app"
            value={
              session
                ? session.sourceAppDisplayName ||
                  session.sourceAppUserModelId ||
                  '—'
                : 'none'
            }
            ok={Boolean(session)}
          />
          <DebugRow
            label="Track"
            value={session?.title || nowPlaying?.trackName || '—'}
          />
          <DebugRow
            label="SMTC art"
            value={
              hasThumb
                ? `yes · ${formatChars(String(session.thumbnail).length)} chars`
                : primaryNote
                  ? `no · ${primaryNote.status}/${primaryNote.reason}`
                  : 'no'
            }
            ok={hasThumb}
          />
          <DebugRow
            label="Tile art"
            value={
              npHasArt
                ? `yes · ${formatChars(String(nowPlaying.albumArtUrl).length)} · ${nowPlaying.source || '?'}`
                : 'no'
            }
            ok={npHasArt}
          />
          {primaryNote ? (
            <DebugRow
              label="Compress"
              value={`${primaryNote.status} · ${primaryNote.reason || '—'} · in ${formatChars(primaryNote.rawChars)} → out ${formatChars(primaryNote.outChars)}${primaryNote.rawMime ? ` · ${primaryNote.rawMime}` : ''}`}
              ok={primaryNote.hasOut}
            />
          ) : null}
          {systemMedia?.error ? (
            <DebugRow label="Error" value={systemMedia.error} ok={false} />
          ) : null}
          {artDebug?.backendPath ? (
            <DebugRow
              label="Backend"
              value={String(artDebug.backendPath).split(/[/\\]/).slice(-2).join('/')}
            />
          ) : (
            <DebugRow label="Backend" value="missing?" ok={false} />
          )}
          {diagnostics.length > 0 ? (
            <div className="mt-1 rounded-lg bg-[hsl(var(--surface-primary)/0.35)] px-2 py-1">
              <p className="m-0 mb-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-[hsl(var(--text-tertiary))]">
                Bridge diagnostics
              </p>
              {diagnostics.slice(0, 4).map((d, i) => (
                <p
                  key={`${d.at}-${i}`}
                  className="m-0 text-[8px] font-semibold leading-snug text-[hsl(var(--state-warning))]"
                >
                  {d.message}
                </p>
              ))}
            </div>
          ) : (
            <p className="m-0 mt-1 text-[8px] font-bold text-[hsl(var(--text-tertiary))]">
              No bridge diagnostics yet. Play in Apple Music — if title shows but SMTC art
              is no, the app may not publish a thumbnail to Windows.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

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

      <NowPlayingSmtcDebugPanel />

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
            Freezes the live album palette with your current visual look. Find it under Presets.
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

  if (kindId === 'nowPlaying') {
    return (
      <div className="flex w-full flex-col gap-2 border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
        <span className="px-0.5 text-center text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-tertiary))]">
          Widget settings · Now Playing
        </span>
        <NowPlayingWidgetSettings />
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
  return kindId === 'weather' || kindId === 'nowPlaying' || STEAM_KIND_IDS.has(kindId);
}

export default React.memo(HomeWidgetSettingsPanel);
