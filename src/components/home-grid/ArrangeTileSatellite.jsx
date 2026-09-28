import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useWeeMotion } from '../../design/weeMotion';
import { INPUT_COLOR_DEFAULT_HEX } from '../../design/runtimeColorStrings';
import {
  WeeButton,
  WeeContentCollapse,
  WeeGlassPill,
  WeePillFloorShadow,
  WeeSegmentedControl,
} from '../../ui/wee';
import { isNonChannelSlot } from '../../utils/homeGridSlots';
import {
  normalizeHomeWidgetSurface,
  normalizeHomeWidgetTextColor,
  normalizeHomeWidgetTextSize,
} from '../../utils/homeWidgetSurface';
import { placeAnchoredPill, useBoardSlotRect } from '../../utils/boardSlotRect';
import { showHomeBoardAck } from '../../utils/showHomeBoardAck';
import { getHomeSlotKind, matchHomeSlotSizePreset } from './slotKindRegistry';
import HomeWidgetGlassControls from './HomeWidgetGlassControls';
import HomeWidgetSettingsPanel, {
  homeSlotKindHasWidgetSettings,
} from './HomeWidgetSettingsPanel';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  systemSessionAppFilterValue,
  systemSessionAppLabel,
} from '../../utils/nowPlayingShape';
import { useShallow } from 'zustand/react/shallow';

const MotionDiv = m.div;

/**
 * Size, surface, looks, and remove — grown from the selected tile.
 */
const ArrangeTileSatellite = forwardRef(function ArrangeTileSatellite(
  {
    slotIndex,
    selectedSlot,
    onSetSizePreset,
    onSetSurface,
    onSetTextColor,
    onSetTextSize,
    onSetListenApp,
    onPatchWidget,
    onRemoveWidget,
    blockedPresetIds = [],
  },
  ref
) {
  const reducedMotion = useReducedMotion();
  const { pillOpen, pillClose } = useWeeMotion();
  const rect = useBoardSlotRect(slotIndex, slotIndex != null, selectedSlot?.kind || '');
  const panelRef = useRef(null);
  const [looksOpen, setLooksOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);

  const selectedIsWidget = isNonChannelSlot(selectedSlot);
  const selectedIsNowPlaying = selectedIsWidget && selectedSlot?.kind === 'nowPlaying';
  const selectedKindMeta = selectedSlot
    ? getHomeSlotKind(selectedSlot.kind ?? 'channel')
    : null;
  const sizePresets = selectedKindMeta?.sizePresets ?? null;
  const activePreset = selectedKindMeta
    ? matchHomeSlotSizePreset(selectedSlot?.kind, selectedSlot?.colSpan, selectedSlot?.rowSpan)
    : null;
  const activeSurface = selectedIsWidget
    ? normalizeHomeWidgetSurface(selectedSlot?.surface)
    : null;
  const hasWidgetSettings = homeSlotKindHasWidgetSettings(selectedSlot?.kind);
  const showGlassLooks = selectedIsWidget && activeSurface === 'glass';
  const showListenLooks = Boolean(selectedIsNowPlaying && typeof onSetListenApp === 'function');
  const showTextLooks = Boolean(
    selectedIsWidget && !selectedIsNowPlaying && typeof onSetTextColor === 'function'
  );
  const hasLooksPanel = showGlassLooks || hasWidgetSettings || showListenLooks || showTextLooks;
  const activeTextColor = showTextLooks
    ? normalizeHomeWidgetTextColor(selectedSlot?.textColor)
    : null;
  const activeTextSize = showTextLooks
    ? normalizeHomeWidgetTextSize(selectedSlot?.textSize)
    : null;

  const systemSessions = useConsolidatedAppStore(
    useShallow((s) => (Array.isArray(s.systemMedia?.sessions) ? s.systemMedia.sessions : []))
  );
  const listenAppValue = String(selectedSlot?.widget?.listenApp || 'any').trim() || 'any';
  const listenAppOptions = React.useMemo(() => {
    const seen = new Set();
    const opts = [{ value: 'any', label: 'Any', title: 'Show whichever desktop player is active' }];
    for (const session of systemSessions) {
      const value = systemSessionAppFilterValue(session);
      if (!value || seen.has(value)) continue;
      seen.add(value);
      opts.push({
        value,
        label: systemSessionAppLabel(session),
        title: `Only show media from ${systemSessionAppLabel(session)}`,
      });
    }
    if (listenAppValue !== 'any' && !seen.has(listenAppValue)) {
      opts.push({ value: listenAppValue, label: listenAppValue, title: listenAppValue });
    }
    return opts.map((opt) => ({
      ...opt,
      label: opt.label.length > 14 ? `${opt.label.slice(0, 12)}…` : opt.label,
    }));
  }, [listenAppValue, systemSessions]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!rect || !panel) {
      setAnchor(null);
      return;
    }
    const height = looksOpen ? Math.max(panel.offsetHeight, 220) : panel.offsetHeight;
    const next = placeAnchoredPill(rect, panel.offsetWidth, height);
    setAnchor(next);
  }, [rect, looksOpen, selectedSlot?.kind, activeSurface, hasLooksPanel]);

  const origin = rect ? { x: rect.x, y: rect.y } : null;
  const placeAbove = anchor?.placeAbove !== false;

  return (
    <MotionDiv
      ref={ref}
      className="pointer-events-none fixed z-[var(--z-home-arrange-bar)]"
      style={
        anchor && rect
          ? {
              left: anchor.left,
              top: placeAbove ? undefined : rect.bottom + 12,
              bottom: placeAbove ? window.innerHeight - rect.top + 12 : undefined,
              transformOrigin: placeAbove ? 'center bottom' : 'center top',
            }
          : { left: -9999, top: 0 }
      }
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0.85, scale: 0.28, y: placeAbove ? 18 : -18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0.85, scale: 0.28, y: placeAbove ? 18 : -18, transition: pillClose }
      }
      transition={reducedMotion ? { duration: 0.12 } : pillOpen}
    >
      <div ref={panelRef} className="pointer-events-auto relative w-max max-w-[min(92vw,36rem)]">
        <WeeGlassPill className="relative flex flex-col items-stretch rounded-[1.75rem] px-3 py-2.5">
          <WeePillFloorShadow expanded={looksOpen} reducedMotion={reducedMotion} />
          <div className="relative z-[1] flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {sizePresets ? (
                <WeeSegmentedControl
                  size="sm"
                  ariaLabel="Tile size"
                  layoutId={`homeArrangeTileSize-${slotIndex}`}
                  value={activePreset?.id ?? ''}
                  onChange={(presetId) => onSetSizePreset?.(presetId)}
                  onDisabledOption={() => showHomeBoardAck('Needs room', origin, { sound: true })}
                  options={Object.values(sizePresets).map((preset) => {
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
              ) : null}
              {selectedIsWidget ? (
                <WeeSegmentedControl
                  size="sm"
                  ariaLabel="Widget surface"
                  layoutId={`homeArrangeWidgetSurface-${slotIndex}`}
                  value={activeSurface || 'clear'}
                  onChange={(surface) => onSetSurface?.(surface)}
                  options={[
                    { value: 'clear', label: 'Clear', title: 'Float on the wallpaper' },
                    { value: 'glass', label: 'Glass', title: 'Light frost over the wallpaper' },
                    { value: 'basic', label: 'Basic', title: 'Solid card' },
                  ]}
                />
              ) : null}
              {hasLooksPanel ? (
                <WeeButton
                  variant={looksOpen ? 'primary' : 'secondary'}
                  size="sm"
                  aria-pressed={looksOpen}
                  onClick={() => setLooksOpen((open) => !open)}
                >
                  Looks
                </WeeButton>
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

            <WeeContentCollapse open={looksOpen && hasLooksPanel} keepMounted={false}>
              <div className="flex max-h-[min(42vh,20rem)] flex-col gap-2.5 overflow-y-auto border-t border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
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
                        layoutId={`homeArrangeTextSize-${slotIndex}`}
                        value={activeTextSize || 'auto'}
                        onChange={(value) => onSetTextSize?.(value === 'auto' ? null : value)}
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
                      layoutId={`homeArrangeListenApp-${slotIndex}`}
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
          </div>
        </WeeGlassPill>
      </div>
    </MotionDiv>
  );
});

ArrangeTileSatellite.displayName = 'ArrangeTileSatellite';

ArrangeTileSatellite.propTypes = {
  slotIndex: PropTypes.number,
  selectedSlot: PropTypes.object,
  onSetSizePreset: PropTypes.func,
  onSetSurface: PropTypes.func,
  onSetTextColor: PropTypes.func,
  onSetTextSize: PropTypes.func,
  onSetListenApp: PropTypes.func,
  onPatchWidget: PropTypes.func,
  onRemoveWidget: PropTypes.func,
  blockedPresetIds: PropTypes.arrayOf(PropTypes.string),
};

export default ArrangeTileSatellite;
