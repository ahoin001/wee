/**
 * Home-grid Epic Library shelf — installed titles via epic:getInstalledGames.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Gamepad2 } from 'lucide-react';
import HomeWidgetShell from './HomeWidgetShell';
import { SteamCoverTile, SteamGamesShelf } from './SteamGamesShelf';
import SteamWidgetHeading from './SteamWidgetHeading';
import { normalizeHomeWidgetSurface, resolveSteamHeading } from '../../utils/homeWidgetSurface';
import { resolveHomeWidgetLayout } from '../../utils/homeWidgetLayout';
import { matchHomeSlotSizePreset } from './slotKindRegistry';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import {
  getHomeSteamTileSizeConfig,
  normalizeHomeSteamWidget,
} from '../../utils/homeSteamWidgetPrefs';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useActivityInterval } from '../../hooks/useActivityInterval';

const EMPTY_GAMES = Object.freeze([]);
const EPIC_TTL_MS = 5 * 60 * 1000;

function normalizeEpicRow(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const appName = String(raw.appName || '').trim();
  const name = String(raw.name || appName || '').trim();
  if (!appName && !name) return null;
  const image =
    typeof raw.image === 'string' && raw.image.trim() ? raw.image.trim() : null;
  return {
    appName: appName || name,
    name: name || appName,
    imageUrl: image,
    launchPath: appName
      ? `com.epicgames.launcher://apps/${appName}?action=launch&silent=true`
      : null,
  };
}

function EpicLibrarySlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const homeSteamWidgetRaw = useConsolidatedAppStore((s) => s.ui?.homeSteamWidget);
  const steamPrefs = useMemo(
    () => normalizeHomeSteamWidget(homeSteamWidgetRaw),
    [homeSteamWidgetRaw]
  );
  const { beginLaunchFeedback, endLaunchFeedback, showLaunchError } = useLaunchFeedback();
  const [games, setGames] = useState(EMPTY_GAMES);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetchedAtRef = useRef(0);

  const sizePreset = useMemo(
    () =>
      matchHomeSlotSizePreset('epicLibrary', slot?.colSpan ?? 2, slot?.rowSpan ?? 2) || {
        id: 'M',
        colSpan: 2,
        rowSpan: 2,
        capacity: 12,
      },
    [slot?.colSpan, slot?.rowSpan]
  );
  const tileCfg = getHomeSteamTileSizeConfig(steamPrefs.tileSize);
  const capacity = Math.max(Number(sizePreset.capacity) || 12, tileCfg.capacity);
  const interactionsLocked = arrangeMode || punchMode;
  const surface = normalizeHomeWidgetSurface(slot?.surface);
  const colSpan = slot?.colSpan ?? sizePreset.colSpan ?? 2;
  const rowSpan = slot?.rowSpan ?? sizePreset.rowSpan ?? 2;
  const layout = useMemo(
    () => resolveHomeWidgetLayout(colSpan, rowSpan, { textSize: slot?.textSize }),
    [colSpan, rowSpan, slot?.textSize]
  );
  const coverDensity = layout.density === 'roomy' ? 'cozy' : 'compact';
  const headingTitle = resolveSteamHeading('Epic', slot?.widget?.heading);

  const visible = useMemo(() => games.slice(0, capacity), [games, capacity]);

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (!window.api?.epic?.getInstalledGames) {
      setError('Epic Games scan unavailable');
      return;
    }
    const age = Date.now() - Number(fetchedAtRef.current || 0);
    if (!force && fetchedAtRef.current && age < EPIC_TTL_MS) return;

    setLoading(true);
    try {
      const result = await window.api.epic.getInstalledGames();
      const list = Array.isArray(result?.games)
        ? result.games
        : Array.isArray(result)
          ? result
          : [];
      const normalized = list.map(normalizeEpicRow).filter(Boolean);
      normalized.sort((a, b) =>
        String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' })
      );
      setGames(normalized.length ? normalized : EMPTY_GAMES);
      fetchedAtRef.current = Date.now();
      setError(result?.error && normalized.length === 0 ? result.error : null);
    } catch (err) {
      setError(err?.message || 'Could not read Epic library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh({ force: false });
  }, [refresh]);

  useActivityInterval(
    () => {
      void refresh({ force: true });
    },
    EPIC_TTL_MS,
    { enabled: true, fireOnResume: true, lowPowerMultiplier: 2 }
  );

  const handleLaunch = useCallback(
    async (game) => {
      if (interactionsLocked || !game?.launchPath || !window.api?.launchApp) return;
      await launchWithFeedback({
        launch: () =>
          window.api.launchApp({
            type: 'url',
            path: game.launchPath,
            asAdmin: false,
          }),
        beginLaunchFeedback,
        endLaunchFeedback,
        showLaunchError,
        label: `Launching ${game.name || 'Epic game'}`,
        launchType: 'epic',
        path: game.launchPath,
        source: 'epicLibrary',
      });
    },
    [interactionsLocked, beginLaunchFeedback, endLaunchFeedback, showLaunchError]
  );

  const handleActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
        return;
      }
      if (interactionsLocked) return;
      if (visible.length === 0) void refresh({ force: true });
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      visible.length,
      refresh,
      onArrangeSelect,
      channelId,
    ]
  );

  const emptyHint = error
    ? error
    : loading
      ? 'Scanning Epic library…'
      : 'Install games in Epic Games Launcher';

  return (
    <HomeWidgetShell
      surface={surface}
      textColor={slot?.textColor}
      selected={selected}
      className={layout.shellPadClass}
      onClick={handleActivate}
      aria-label="Epic Library"
    >
      {visible.length === 0 ? (
        <button
          type="button"
          className={`flex h-full w-full flex-col items-center justify-center text-center transition-transform hover:scale-[1.02] active:scale-95 ${layout.gapClass}`}
          onClick={(event) => {
            event.stopPropagation();
            if (arrangeMode && !punchMode) {
              onArrangeSelect?.(channelId);
              return;
            }
            void refresh({ force: true });
          }}
          disabled={interactionsLocked && !arrangeMode}
        >
          <Gamepad2
            size={layout.iconPx + 4}
            strokeWidth={2.25}
            className="text-[hsl(var(--primary))]"
            aria-hidden
          />
          <span className="max-w-[14rem] text-[10px] font-black uppercase tracking-[0.12em] text-[var(--hw-text-secondary)]">
            {emptyHint}
          </span>
        </button>
      ) : (
        <div className={`flex min-h-0 flex-1 flex-col ${layout.gapClass}`}>
          {layout.showHeader && headingTitle ? (
            <SteamWidgetHeading
              title={headingTitle}
              icon={Gamepad2}
              compact={rowSpan <= 1}
              textSize={slot?.textSize}
            />
          ) : null}
          <SteamGamesShelf
            prefs={steamPrefs}
            colSpan={colSpan}
            rowSpan={rowSpan}
            coverDensity={coverDensity}
          >
            {visible.map((game) => (
              <SteamCoverTile
                key={game.appName}
                appId={game.appName}
                name={game.name}
                imageUrl={game.imageUrl}
                showPlaytime={false}
                showName={steamPrefs.showName}
                density={coverDensity}
                onActivate={() => handleLaunch(game)}
              />
            ))}
          </SteamGamesShelf>
        </div>
      )}
    </HomeWidgetShell>
  );
}

EpicLibrarySlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(EpicLibrarySlot);
