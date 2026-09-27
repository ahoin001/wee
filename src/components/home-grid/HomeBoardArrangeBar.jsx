import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, PenLine, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { createWeeTransition } from '../../design/weeMotion';
import {
  WeeGlassPill,
  WeeButton,
  WeeContentCollapse,
  WeeGooeyTileButton,
  WeeMorphStack,
  WeePillFloorShadow,
  WeeRevealWhen,
  WeeSegmentedControl,
} from '../../ui/wee';
import { isChannelSlotEmpty, isNonChannelSlot } from '../../utils/homeGridSlots';
import {
  normalizeHomeWidgetSurface,
  normalizeHomeWidgetTextColor,
  normalizeHomeWidgetTextSize,
} from '../../utils/homeWidgetSurface';
import { INPUT_COLOR_DEFAULT_HEX } from '../../design/runtimeColorStrings';
import { getHomeSlotKind, listPlaceableHomeSlotKindsGrouped, matchHomeSlotSizePreset } from './slotKindRegistry';
import HomeWidgetGlassControls from './HomeWidgetGlassControls';
import HomeWidgetSettingsPanel, {
  homeSlotKindHasWidgetSettings,
} from './HomeWidgetSettingsPanel';
import EditSceneTools from './EditSceneTools';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  systemSessionAppFilterValue,
  systemSessionAppLabel,
} from '../../utils/nowPlayingShape';
import { useShallow } from 'zustand/react/shallow';

const MotionDiv = m.div;

/**
 * Edit pill for the page you are on.
 * Resting row is Editing, one tool chip at a time, and Done.
 * Home and Second Home include Board. Hubs are scene tools only.
 */
function HomeBoardArrangeBar({
  arrangeMode,
  sceneOnly = false,
  spaceId = 'home',
  punchMode,
  onTogglePunch,
  onDone,
  selectedSlot = null,
  canAddWidget = false,
  onAddWidget,
  onRemoveWidget,
  onSetSizePreset,
  onSetSurface,
  onSetTextColor,
  onSetTextSize,
  onSetListenApp,
  onPatchWidget,
  blockedPresetIds = [],
  pickerOpen = false,
  onPickerOpenChange,
}) {
  const reducedMotion = useReducedMotion();
  const transition = createWeeTransition('pillOpen', { reducedMotion });

  const setPickerOpen = useCallback(
    (next) => {
      onPickerOpenChange?.(typeof next === 'function' ? next(pickerOpen) : next);
    },
    [onPickerOpenChange, pickerOpen]
  );
  const [looksOpen, setLooksOpen] = useState(false);
  const [sceneTool, setSceneTool] = useState(() => (sceneOnly ? 'wallpaper' : 'board'));
  const [trackedArrange, setTrackedArrange] = useState(arrangeMode);
  const [trackedSceneOnly, setTrackedSceneOnly] = useState(sceneOnly);
  if (arrangeMode !== trackedArrange || sceneOnly !== trackedSceneOnly) {
    setTrackedArrange(arrangeMode);
    setTrackedSceneOnly(sceneOnly);
    if (arrangeMode) {
      setSceneTool(sceneOnly ? 'wallpaper' : 'board');
      setLooksOpen(false);
    }
  }

  const systemSessions = useConsolidatedAppStore(
    useShallow((s) => (Array.isArray(s.systemMedia?.sessions) ? s.systemMedia.sessions : []))
  );

  useEffect(() => {
    useConsolidatedAppStore.getState().actions.ensureHomeWidgetSurfaceMigration?.();
  }, []);

  const placeableGroups = useMemo(() => listPlaceableHomeSlotKindsGrouped(), []);

  const selectedIsWidget = isNonChannelSlot(selectedSlot);
  const selectedIsNowPlaying = selectedIsWidget && selectedSlot?.kind === 'nowPlaying';
  const selectedIsEmptyChannel =
    selectedSlot != null && !selectedIsWidget && isChannelSlotEmpty(selectedSlot);
  const selectedKindMeta = selectedSlot
    ? getHomeSlotKind(selectedSlot.kind ?? 'channel')
    : null;
  const sizePresets = selectedKindMeta?.sizePresets ?? null;
  const activePreset = useMemo(
    () =>
      selectedKindMeta
        ? matchHomeSlotSizePreset(
            selectedSlot?.kind,
            selectedSlot?.colSpan,
            selectedSlot?.rowSpan
          )
        : null,
    [selectedKindMeta, selectedSlot?.kind, selectedSlot?.colSpan, selectedSlot?.rowSpan]
  );
  const activeSurface = selectedIsWidget
    ? normalizeHomeWidgetSurface(selectedSlot?.surface)
    : null;

  const hasWidgetSettings = homeSlotKindHasWidgetSettings(selectedSlot?.kind);
  const showGlassLooks = selectedIsWidget && activeSurface === 'glass';
  const showListenLooks = Boolean(selectedIsNowPlaying && typeof onSetListenApp === 'function');
  /* Now Playing text follows album-art palette — a manual color would be a dead control. */
  const showTextLooks = Boolean(
    selectedIsWidget && !selectedIsNowPlaying && typeof onSetTextColor === 'function'
  );
  const hasLooksPanel =
    showGlassLooks || hasWidgetSettings || showListenLooks || showTextLooks;
  const activeTextColor = showTextLooks
    ? normalizeHomeWidgetTextColor(selectedSlot?.textColor)
    : null;
  const activeTextSize = showTextLooks
    ? normalizeHomeWidgetTextSize(selectedSlot?.textSize)
    : null;

  useEffect(() => {
    if (!hasLooksPanel) setLooksOpen(false);
  }, [hasLooksPanel]);

  const listenAppValue = String(selectedSlot?.widget?.listenApp || 'any').trim() || 'any';

  const listenAppOptions = useMemo(() => {
    const seen = new Set();
    const opts = [{ value: 'any', label: 'Any', title: 'Show whichever desktop player is active' }];
    for (const session of systemSessions) {
      const value = systemSessionAppFilterValue(session);
      if (!value || seen.has(value)) continue;
      seen.add(value);
      const label = systemSessionAppLabel(session);
      opts.push({
        value,
        label: label.length > 14 ? `${label.slice(0, 12)}…` : label,
        title: `Only show media from ${label}`,
      });
    }
    // Keep a custom saved filter visible even if that app is not currently in SMTC.
    if (listenAppValue !== 'any' && !seen.has(listenAppValue)) {
      opts.push({
        value: listenAppValue,
        label: listenAppValue.length > 14 ? `${listenAppValue.slice(0, 12)}…` : listenAppValue,
        title: `Only show media from ${listenAppValue}`,
      });
    }
    return opts;
  }, [systemSessions, listenAppValue]);

  const boardToolOpen = sceneTool === 'board' && !sceneOnly;

  const selectSceneTool = useCallback(
    (id) => {
      setLooksOpen(false);
      setPickerOpen(false);
      if (sceneTool === 'board' && punchMode) onTogglePunch?.();
      setSceneTool((current) => (current === id ? null : id));
    },
    [onTogglePunch, punchMode, sceneTool, setPickerOpen]
  );

  const handleToggleQuickPicker = useCallback(() => {
    setPickerOpen((prev) => !prev);
    setLooksOpen(false);
  }, [setPickerOpen]);

  const handleToggleLooks = useCallback(() => {
    setLooksOpen((prev) => !prev);
    setPickerOpen(false);
  }, [setPickerOpen]);

  const handleTogglePunch = useCallback(() => {
    setPickerOpen(false);
    setLooksOpen(false);
    onTogglePunch?.();
  }, [onTogglePunch, setPickerOpen]);

  const handlePickKind = useCallback(
    (kindId) => {
      onAddWidget?.(kindId);
      setPickerOpen(false);
    },
    [onAddWidget, setPickerOpen]
  );

  const sceneHint =
    sceneTool === 'wallpaper'
      ? 'Tap a wallpaper. It lands on this page.'
      : sceneTool === 'look'
        ? 'Opacity, blur, and color, live.'
        : sceneTool === 'atmosphere'
          ? 'Particles on this page.'
          : sceneTool === 'ribbon'
            ? 'Scope and wallpaper match.'
            : null;

  const hint = sceneHint
    || (boardToolOpen && punchMode
      ? 'Tap a tile to open a hole. Tap it again to close it.'
      : boardToolOpen && looksOpen
        ? 'Looks for this tile'
        : boardToolOpen && pickerOpen
          ? 'Pick a widget'
          : boardToolOpen && selectedIsWidget
            ? selectedKindMeta?.label || 'Widget'
            : boardToolOpen && selectedIsEmptyChannel
              ? 'Empty slot — add a widget'
              : boardToolOpen && selectedKindMeta
                ? 'Drag to resize, or pick a size'
                : boardToolOpen
                  ? 'Tap a tile. Drag to reorder.'
                  : 'Pick a tool.');

  return (
    <AnimatePresence>
      {arrangeMode ? (
        <MotionDiv
          key="home-board-arrange-bar"
          className="pointer-events-none fixed inset-x-0 bottom-[max(6.75rem,calc(env(safe-area-inset-bottom)+5.75rem))] z-[var(--z-home-arrange-bar)] flex justify-center px-4"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          transition={transition}
        >
          <WeeGlassPill className="pointer-events-auto relative flex max-w-[min(96vw,44rem)] flex-col items-stretch rounded-[2rem] px-3 py-2.5 md:px-4 md:py-3">
            <WeePillFloorShadow
              expanded={sceneTool != null}
              reducedMotion={reducedMotion}
            />
            <WeeMorphStack
              open={sceneTool != null}
              gapOpen="gap-2.5"
              gapClosed="gap-1"
              className="relative z-[1]"
            >
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="pl-1 pr-1 text-[length:var(--font-size-caption)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
                Editing
              </span>

              {!sceneOnly ? (
                <WeeButton
                  variant={sceneTool === 'board' ? 'primary' : 'secondary'}
                  size="sm"
                  aria-pressed={sceneTool === 'board'}
                  onClick={() => selectSceneTool('board')}
                >
                  Board
                </WeeButton>
              ) : null}
              <WeeButton
                variant={sceneTool === 'wallpaper' ? 'primary' : 'secondary'}
                size="sm"
                aria-pressed={sceneTool === 'wallpaper'}
                onClick={() => selectSceneTool('wallpaper')}
              >
                Wallpaper
              </WeeButton>
              <WeeButton
                variant={sceneTool === 'look' ? 'primary' : 'secondary'}
                size="sm"
                aria-pressed={sceneTool === 'look'}
                onClick={() => selectSceneTool('look')}
              >
                Look
              </WeeButton>
              <WeeButton
                variant={sceneTool === 'atmosphere' ? 'primary' : 'secondary'}
                size="sm"
                aria-pressed={sceneTool === 'atmosphere'}
                onClick={() => selectSceneTool('atmosphere')}
              >
                Atmosphere
              </WeeButton>
              <WeeButton
                variant={sceneTool === 'ribbon' ? 'primary' : 'secondary'}
                size="sm"
                aria-pressed={sceneTool === 'ribbon'}
                onClick={() => selectSceneTool('ribbon')}
              >
                Ribbon
              </WeeButton>

              <WeeButton variant="primary" size="sm" onClick={onDone}>
                <span className="flex items-center gap-1.5">
                  <Check size={13} strokeWidth={3} aria-hidden />
                  Done
                </span>
              </WeeButton>
            </div>

            <WeeRevealWhen when={boardToolOpen} keepMounted={false}>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!punchMode && canAddWidget && typeof onAddWidget === 'function' ? (
                  <WeeButton
                    variant={pickerOpen ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={handleToggleQuickPicker}
                    aria-expanded={pickerOpen}
                    title="Add a widget"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus size={13} strokeWidth={2.5} aria-hidden />
                      Add
                    </span>
                  </WeeButton>
                ) : null}
                {!punchMode && hasLooksPanel ? (
                  <WeeButton
                    variant={looksOpen ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={handleToggleLooks}
                    aria-expanded={looksOpen}
                    title="Look and display"
                  >
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal size={13} strokeWidth={2.5} aria-hidden />
                      Looks
                    </span>
                  </WeeButton>
                ) : null}
                <WeeButton
                  variant={punchMode ? 'primary' : 'secondary'}
                  size="sm"
                  aria-pressed={punchMode}
                  onClick={handleTogglePunch}
                  title="Show or hide tiles to reveal wallpaper"
                >
                  <span className="flex items-center gap-1.5">
                    <PenLine size={13} strokeWidth={2.5} aria-hidden />
                    Holes
                  </span>
                </WeeButton>
              </div>
            </WeeRevealWhen>

            <WeeRevealWhen when={Boolean(boardToolOpen && selectedKindMeta && sizePresets && !punchMode && !pickerOpen)} keepMounted={false}>
              <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[hsl(var(--border-primary)/0.25)] pt-2">
                <WeeSegmentedControl
                  size="sm"
                  ariaLabel="Tile size"
                  layoutId="homeArrangeTileSize"
                  value={activePreset?.id ?? ''}
                  onChange={(presetId) => onSetSizePreset?.(presetId)}
                  options={Object.values(sizePresets || {}).map((preset) => {
                    const blocked = blockedPresetIds.includes(preset.id);
                    return {
                      value: preset.id,
                      label: preset.label,
                      disabled: blocked,
                      title: blocked
                        ? `${preset.label} needs free neighboring slots`
                        : `${preset.label} · ${preset.colSpan}×${preset.rowSpan}`,
                    };
                  })}
                />
                {selectedIsWidget ? (
                  <WeeSegmentedControl
                    size="sm"
                    ariaLabel="Widget surface"
                    layoutId="homeArrangeWidgetSurface"
                    value={activeSurface || 'clear'}
                    onChange={(surface) => onSetSurface?.(surface)}
                    options={[
                      { value: 'clear', label: 'Clear', title: 'Float on the wallpaper' },
                      { value: 'glass', label: 'Glass', title: 'Light frost over the wallpaper' },
                      { value: 'basic', label: 'Basic', title: 'Solid card' },
                    ]}
                  />
                ) : null}
                {selectedIsWidget ? (
                  <WeeButton variant="danger" size="sm" onClick={onRemoveWidget}>
                    <span className="flex items-center gap-1.5">
                      <Trash2 size={13} strokeWidth={2.5} aria-hidden />
                      Remove
                    </span>
                  </WeeButton>
                ) : null}
              </div>
            </WeeRevealWhen>

            <WeeContentCollapse open={boardToolOpen && pickerOpen} keepMounted={false}>
              <div className="flex max-h-[min(42vh,22rem)] flex-col gap-3 overflow-y-auto border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
                {placeableGroups.map((group) => (
                  <div key={group.id} className="flex flex-col gap-1.5">
                    <span className="px-1 text-[9px] font-black uppercase tracking-[0.16em] text-[hsl(var(--text-tertiary))]">
                      {group.label}
                    </span>
                    <div className="flex flex-wrap items-stretch justify-center gap-2">
                      {group.kinds.map((kind) => (
                        <WeeGooeyTileButton
                          key={kind.id}
                          orientation="row"
                          icon={kind.icon ?? '🧩'}
                          label={kind.label}
                          description={kind.description}
                          reducedMotion={reducedMotion}
                          onClick={() => handlePickKind(kind.id)}
                          className="min-w-[11rem] max-w-[15rem]"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </WeeContentCollapse>

            <WeeContentCollapse open={boardToolOpen && looksOpen && hasLooksPanel} keepMounted={false}>
              <div className="flex max-h-[min(34vh,16rem)] flex-col gap-2.5 overflow-y-auto border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
                {showTextLooks ? (
                  <div className="flex flex-col gap-2 px-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-tertiary))]">
                        Text color
                      </span>
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="color"
                          value={activeTextColor || INPUT_COLOR_DEFAULT_HEX}
                          onChange={(e) => onSetTextColor?.(e.target.value)}
                          className="h-7 w-9 cursor-pointer rounded-md border-2 border-[hsl(var(--border-primary)/0.45)] bg-transparent p-0.5"
                          title="Widget text color"
                          aria-label="Widget text color"
                        />
                        <span className="font-mono text-[10px] font-semibold text-[hsl(var(--text-secondary))]">
                          {activeTextColor ? activeTextColor.toUpperCase() : 'Auto'}
                        </span>
                      </label>
                      {activeTextColor ? (
                        <button
                          type="button"
                          className="text-[9px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))] underline-offset-2 hover:text-[hsl(var(--text-secondary))] hover:underline"
                          onClick={() => onSetTextColor?.(null)}
                          title="Follow the theme text colors"
                        >
                          Auto
                        </button>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-tertiary))]">
                        Text size
                      </span>
                      <WeeSegmentedControl
                        size="sm"
                        ariaLabel="Widget text size"
                        layoutId="homeArrangeTextSize"
                        value={activeTextSize || 'auto'}
                        onChange={(value) =>
                          onSetTextSize?.(value === 'auto' ? null : value)
                        }
                        options={[
                          { value: 'auto', label: 'Auto', title: 'Match tile density' },
                          { value: 'sm', label: 'S', title: 'Smaller text' },
                          { value: 'md', label: 'M', title: 'Medium text' },
                          { value: 'lg', label: 'L', title: 'Larger text' },
                        ]}
                      />
                    </div>
                  </div>
                ) : null}
                {showGlassLooks ? <HomeWidgetGlassControls nested /> : null}
                {showListenLooks ? (
                  <div className="flex flex-col gap-1.5 px-0.5">
                    <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-tertiary))]">
                      Listen to
                    </span>
                    <WeeSegmentedControl
                      size="sm"
                      ariaLabel="Now Playing app filter"
                      layoutId="homeArrangeListenApp"
                      value={listenAppValue}
                      onChange={(value) => onSetListenApp?.(value)}
                      options={listenAppOptions}
                    />
                  </div>
                ) : null}
                {hasWidgetSettings ? (
                  <HomeWidgetSettingsPanel
                    kindId={selectedSlot?.kind}
                    slot={selectedSlot}
                    onPatchWidget={onPatchWidget}
                    nested
                  />
                ) : null}
              </div>
            </WeeContentCollapse>

            <WeeContentCollapse open={sceneTool != null && sceneTool !== 'board'} keepMounted={false}>
              <div className="border-t border-[hsl(var(--border-primary)/0.25)]">
                <EditSceneTools spaceId={spaceId} tool={sceneTool} />
              </div>
            </WeeContentCollapse>

            <AnimatePresence mode="wait" initial={false}>
              <MotionDiv
                key={hint}
                initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
                transition={transition}
                className="px-1 text-center text-[length:var(--font-size-micro)] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]"
              >
                {hint}
              </MotionDiv>
            </AnimatePresence>
            </WeeMorphStack>
          </WeeGlassPill>
        </MotionDiv>
      ) : null}
    </AnimatePresence>
  );
}

HomeBoardArrangeBar.propTypes = {
  arrangeMode: PropTypes.bool.isRequired,
  sceneOnly: PropTypes.bool,
  spaceId: PropTypes.string,
  punchMode: PropTypes.bool.isRequired,
  onTogglePunch: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
  selectedSlot: PropTypes.object,
  selectedIndex: PropTypes.number,
  canAddWidget: PropTypes.bool,
  onAddWidget: PropTypes.func,
  onRemoveWidget: PropTypes.func,
  onSetSizePreset: PropTypes.func,
  onSetSurface: PropTypes.func,
  onSetTextColor: PropTypes.func,
  onSetTextSize: PropTypes.func,
  onSetListenApp: PropTypes.func,
  onPatchWidget: PropTypes.func,
  blockedPresetIds: PropTypes.arrayOf(PropTypes.string),
  pickerOpen: PropTypes.bool,
  onPickerOpenChange: PropTypes.func,
};

export default React.memo(HomeBoardArrangeBar);
