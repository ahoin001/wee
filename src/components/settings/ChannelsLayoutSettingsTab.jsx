import React, { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { m, useReducedMotion } from 'framer-motion';
import { Activity, Aperture, EyeOff, Info, LayoutGrid, Minus, Monitor, Plus, Sparkles } from 'lucide-react';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import {
  WeeButton,
  WeeDescriptionToggleRow,
  WeeGlassPill,
  WeeHelpLinkButton,
  WeeHelpParagraph,
  WeeModalFieldCard,
  WeeSegmentedControl,
  WeeSectionEyebrow,
  WeeSettingsCollapsibleSection,
} from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import SettingsToggleFieldCard from './SettingsToggleFieldCard';
import SettingsMultiToggleChips from './SettingsMultiToggleChips';
import SettingsLivePreviewFrame from './SettingsLivePreviewFrame';
import { HomeBoardSwitcher } from '../home-grid';
import { useHomeBoardArrange } from '../../hooks/useHomeBoardArrange';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  CHANNEL_LAYOUT_LIMITS,
  isSlotHidden,
  resolveLayout,
  WII_LAYOUT_PRESET,
} from '../../utils/channelLayoutSystem';
import { getChannelDataSlice } from '../../utils/channelSpaces';
import { wallpaperEntryUrlKey } from '../../utils/wallpaperShape';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import { mergeMotionFeedback } from '../../utils/motionFeedbackDefaults';
import { GOOEY_HOVER_MODES } from '../../design/gooeyPhysics';
import { createWeeTransition } from '../../design/weeMotion';

/** Board-style toggle titles: bold all-caps (matches Wii engine field cards). */
const TOGGLE_TITLE =
  '!text-[0.8125rem] !font-black !uppercase !tracking-[0.06em] !leading-snug !text-[hsl(var(--text-primary))]';

const IDLE_TYPE_ITEMS = [
  { value: 'pulse', label: 'Pulse' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'glow', label: 'Glow' },
  { value: 'heartbeat', label: 'Heartbeat' },
  { value: 'shake', label: 'Shake' },
  { value: 'wiggle', label: 'Wiggle' },
];

const KEN_BURNS_MODE_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'autoplay', label: 'Autoplay' },
  { value: 'slideshow', label: 'Slideshow' },
];

const KEN_BURNS_EASING_OPTIONS = [
  { value: 'ease-out', label: 'Ease out' },
  { value: 'ease-in', label: 'Ease in' },
  { value: 'ease-in-out', label: 'In-out' },
  { value: 'linear', label: 'Linear' },
];

function LayoutStepper({ label, value, min, max, onChange, ariaLabel }) {
  const reduceMotion = useReducedMotion();
  const press = createWeeTransition('press', { reducedMotion: reduceMotion });
  const atMin = value <= min;
  const atMax = value >= max;

  const bump = useCallback(
    (delta) => {
      const next = Math.max(min, Math.min(max, value + delta));
      if (next !== value) onChange(next);
    },
    [max, min, onChange, value]
  );

  return (
    <div className="flex flex-col gap-2">
      <WeeSectionEyebrow className="block" trackingClassName="tracking-[0.14em]">
        {label}
      </WeeSectionEyebrow>
      <div className="flex items-center justify-between gap-2 rounded-[1.75rem] border-2 border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-elevated)/0.65)] p-1.5 backdrop-blur-md">
        <m.button
          type="button"
          aria-label={`Decrease ${ariaLabel || label}`}
          disabled={atMin}
          onClick={() => bump(-1)}
          whileHover={reduceMotion || atMin ? undefined : { scale: 1.08 }}
          whileTap={reduceMotion || atMin ? undefined : { scale: 0.9 }}
          transition={press}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--surface-primary))] text-[hsl(var(--text-primary))] shadow-[var(--shadow-sm)] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Minus size={18} strokeWidth={3} aria-hidden />
        </m.button>
        <m.span
          key={value}
          initial={reduceMotion ? false : { scale: 0.86, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={press}
          className="min-w-[2.5rem] text-center text-2xl font-black italic tabular-nums tracking-tight text-[hsl(var(--text-primary))]"
          aria-live="polite"
        >
          {value}
        </m.span>
        <m.button
          type="button"
          aria-label={`Increase ${ariaLabel || label}`}
          disabled={atMax}
          onClick={() => bump(1)}
          whileHover={reduceMotion || atMax ? undefined : { scale: 1.08 }}
          whileTap={reduceMotion || atMax ? undefined : { scale: 0.9 }}
          transition={press}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-sm)] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus size={18} strokeWidth={3} aria-hidden />
        </m.button>
      </div>
    </div>
  );
}

function BoardLivePreview({
  layout,
  slotMeta,
  pageSlotIndices,
  punchHoleMode,
  onToggleSlot,
  safePreviewPage,
  totalPages,
  onPreviewPage,
  currentPage,
  wallpaperUrl,
}) {
  const reduceMotion = useReducedMotion();
  const press = createWeeTransition('press', { reducedMotion: reduceMotion });
  const hiddenCount = pageSlotIndices.filter((i) => isSlotHidden(slotMeta, i)).length;

  const canvasStyle = wallpaperUrl
    ? {
        backgroundImage: [
          'linear-gradient(hsl(var(--surface-tertiary) / 0.72), hsl(var(--surface-tertiary) / 0.72))',
          `url("${String(wallpaperUrl).replace(/\\/g, '/').replace(/"/g, '')}")`,
        ].join(', '),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  const headerAside = (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
      <span className="rounded-full bg-[hsl(var(--surface-secondary))] px-3 py-1">
        Home page {String(currentPage + 1).padStart(2, '0')}
      </span>
      {hiddenCount > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--surface-wii-tint))] px-3 py-1 text-[hsl(var(--primary))]">
          <EyeOff size={12} aria-hidden /> {hiddenCount} hole{hiddenCount === 1 ? '' : 's'}
        </span>
      ) : null}
    </div>
  );

  const beforeCanvas =
    totalPages > 1 ? (
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Preview page">
        {Array.from({ length: totalPages }, (_, page) => {
          const selected = safePreviewPage === page;
          return (
            <m.button
              key={`preview-page-${page}`}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onPreviewPage(page)}
              whileHover={reduceMotion ? undefined : { scale: 1.06 }}
              whileTap={reduceMotion ? undefined : { scale: 0.94 }}
              transition={press}
              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                selected
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                  : 'bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))]'
              }`}
            >
              Page {page + 1}
            </m.button>
          );
        })}
      </div>
    ) : null;

  return (
    <SettingsLivePreviewFrame
      eyebrow="Live board"
      caption={
        punchHoleMode
          ? 'Tap a tile to punch a wallpaper hole — holes stay put when you reorder.'
          : 'Preview updates as you change size. Turn on Punch holes to edit.'
      }
      headerAside={headerAside}
      beforeCanvas={beforeCanvas}
      sticky
      minHeightClassName="min-h-[11.5rem] md:min-h-[13rem]"
      canvasStyle={canvasStyle}
    >
      <div
        className="relative z-[1] mx-auto grid h-full w-full max-w-xl gap-2"
        style={{
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(2.4rem, 1fr))`,
        }}
        role="group"
        aria-label="Channel board preview"
      >
        {pageSlotIndices.map((slotIndex) => {
          const hidden = isSlotHidden(slotMeta, slotIndex);
          return (
            <m.button
              key={`preview-slot-${slotIndex}`}
              type="button"
              disabled={!punchHoleMode}
              onClick={() => onToggleSlot(slotIndex)}
              whileHover={
                reduceMotion || !punchHoleMode
                  ? undefined
                  : { scale: 1.05, y: -1 }
              }
              whileTap={reduceMotion || !punchHoleMode ? undefined : { scale: 0.92 }}
              transition={press}
              title={
                punchHoleMode
                  ? hidden
                    ? 'Show this slot'
                    : 'Hide this slot'
                  : `Slot ${slotIndex + 1}`
              }
              className={`relative flex min-h-[2.4rem] items-center justify-center rounded-xl border-2 text-[10px] font-bold uppercase tracking-wide ${
                hidden
                  ? 'border-dashed border-[hsl(var(--border-secondary))] bg-transparent text-[hsl(var(--text-tertiary))]'
                  : 'border-[hsl(var(--border-primary)/0.55)] bg-[hsl(var(--surface-primary))] text-[hsl(var(--text-secondary))] shadow-[var(--shadow-sm)]'
              } ${punchHoleMode ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {hidden ? <EyeOff size={14} aria-hidden /> : slotIndex + 1}
            </m.button>
          );
        })}
      </div>
    </SettingsLivePreviewFrame>
  );
}

const ChannelsLayoutSettingsTab = React.memo(() => {
  const channels = useConsolidatedAppStore((state) => state.channels);
  const ribbonColors = useConsolidatedAppStore(
    useShallow((state) => ({
      ribbonColor: state.ribbon?.ribbonColor,
      ribbonGlowColor: state.ribbon?.ribbonGlowColor,
    }))
  );
  const wallpaperPreviewUrl = useConsolidatedAppStore((state) =>
    wallpaperEntryUrlKey(state.wallpaper?.current)
  );
  const activeSpaceId = useConsolidatedAppStore((state) => state.spaces.activeSpaceId);
  const actions = useConsolidatedAppStore(
    useShallow((state) => ({
      setChannelSettings: state.actions.setChannelSettings,
      setUIState: state.actions.setUIState,
      setChannelLayoutForSpace: state.actions.setChannelLayoutForSpace,
      setChannelSlotHiddenForSpace: state.actions.setChannelSlotHiddenForSpace,
      setFloatingWidgetsState: state.actions.setFloatingWidgetsState,
    }))
  );
  const motionFeedback = useConsolidatedAppStore((state) => state.ui.motionFeedback);
  const gooeyPrefs = useMemo(() => mergeMotionFeedback(motionFeedback).gooey, [motionFeedback]);
  const reduceMotion = useReducedMotion();
  const press = useMemo(
    () => createWeeTransition('press', { reducedMotion: reduceMotion }),
    [reduceMotion]
  );
  const floatingWidgets = useConsolidatedAppStore((state) => state.floatingWidgets);
  const [punchHoleMode, setPunchHoleMode] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const { enterArrange: enterHomeBoardArrange } = useHomeBoardArrange();

  /** Close Settings, jump to Home, and open Live Board Studio. */
  const handleArrangeOnHome = useCallback(() => {
    enterHomeBoardArrange({ closeSettings: true });
  }, [enterHomeBoardArrange]);

  const handleToggleFloatingWidget = useCallback(
    (key, nextVisible) => {
      const current = floatingWidgets?.[key];
      if (!current) return;
      actions.setFloatingWidgetsState({
        [key]: {
          ...current,
          visible: typeof nextVisible === 'boolean' ? nextVisible : !current.visible,
        },
      });
    },
    [actions, floatingWidgets]
  );
  const handleChannelHoverModeChange = useCallback(
    (mode) => {
      actions.setUIState((prev) => {
        const mFeedback = mergeMotionFeedback(prev.motionFeedback);
        return {
          motionFeedback: mergeMotionFeedback({
            ...mFeedback,
            gooey: {
              ...mFeedback.gooey,
              channelHoverMode: mode,
            },
          }),
        };
      });
    },
    [actions]
  );

  const settings = channels?.settings || {};
  const layoutSpaceKey = 'home';

  const currentData = useMemo(
    () => getChannelDataSlice(channels, layoutSpaceKey),
    [channels, layoutSpaceKey]
  );
  const layout = useMemo(() => resolveLayout(currentData), [currentData]);
  const currentNavigation = currentData.navigation || {};
  const totalChannels = layout.totalChannels;
  const currentPage = currentNavigation.currentPage || 0;
  const slotMeta = currentData.slotMeta || {};
  const safePreviewPage = Math.max(0, Math.min(previewPage, layout.totalPages - 1));

  const handleLayoutFieldChange = useCallback(
    (field, value) => {
      actions.setChannelLayoutForSpace(layoutSpaceKey, { [field]: value });
    },
    [actions, layoutSpaceKey]
  );

  const handleToggleSlotHidden = useCallback(
    (channelIndex) => {
      const next = !isSlotHidden(slotMeta, channelIndex);
      actions.setChannelSlotHiddenForSpace(layoutSpaceKey, channelIndex, next);
    },
    [actions, layoutSpaceKey, slotMeta]
  );

  const pageSlotIndices = useMemo(() => {
    const start = safePreviewPage * layout.channelsPerPage;
    return Array.from({ length: layout.channelsPerPage }, (_, i) => start + i).filter(
      (i) => i < layout.totalChannels
    );
  }, [safePreviewPage, layout.channelsPerPage, layout.totalChannels]);

  const adaptivePreviewStyle = useMemo(() => {
    const accentColor =
      ribbonColors?.ribbonGlowColor || ribbonColors?.ribbonColor || 'hsl(var(--primary))';

    return {
      background: `color-mix(in srgb, hsl(var(--surface-secondary)) 76%, ${accentColor} 24%)`,
      borderColor: `color-mix(in srgb, hsl(var(--border-primary)) 58%, ${accentColor} 42%)`,
      boxShadow: `0 0 0 2px color-mix(in srgb, transparent 72%, ${accentColor} 28%) inset`,
    };
  }, [ribbonColors?.ribbonColor, ribbonColors?.ribbonGlowColor]);

  const handleAnimatedOnHoverChange = useCallback((checked) => {
    actions.setChannelSettings({ animatedOnHover: checked });
  }, [actions]);

  const handleKenBurnsEnabledChange = useCallback((checked) => {
    actions.setChannelSettings({ kenBurnsEnabled: checked });
  }, [actions]);

  const handleAdaptiveEmptyChannelsChange = useCallback((checked) => {
    actions.setChannelSettings({ adaptiveEmptyChannels: checked });
  }, [actions]);

  const handleFocusRecedeChange = useCallback((checked) => {
    actions.setChannelSettings({ focusRecedeEnabled: checked });
  }, [actions]);

  const handleKenBurnsForGifsChange = useCallback((checked) => {
    actions.setChannelSettings({ kenBurnsForGifs: checked });
  }, [actions]);

  const handleKenBurnsForVideosChange = useCallback((checked) => {
    actions.setChannelSettings({ kenBurnsForVideos: checked });
  }, [actions]);

  const handleIdleAnimationIntervalChange = useCallback((value) => {
    actions.setChannelSettings({ idleAnimationInterval: value });
  }, [actions]);

  const handleKenBurnsModeChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsMode: value });
  }, [actions]);

  const handleKenBurnsHoverScaleChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsHoverScale: value });
  }, [actions]);

  const handleKenBurnsAutoplayScaleChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsAutoplayScale: value });
  }, [actions]);

  const handleKenBurnsHoverDurationChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsHoverDuration: value });
  }, [actions]);

  const handleKenBurnsAutoplayDurationChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsAutoplayDuration: value });
  }, [actions]);

  const handleKenBurnsCrossfadeDurationChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsCrossfadeDuration: value });
  }, [actions]);

  const handleKenBurnsEasingChange = useCallback((value) => {
    actions.setChannelSettings({ kenBurnsEasing: value });
  }, [actions]);

  const handleIdleAnimationTypeToggle = useCallback(
    (type) => {
      const currentTypes = settings.idleAnimationTypes || ['pulse', 'bounce', 'glow'];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type];
      actions.setChannelSettings({ idleAnimationTypes: newTypes });
    },
    [actions, settings.idleAnimationTypes]
  );

  const idleSelected = settings.idleAnimationTypes || ['pulse', 'bounce', 'glow'];

  return (
    <div className="mx-auto flex max-w-4xl flex-col pb-12 [contain:layout]">
      <SettingsTabPageHeader
        title="Channel & layout"
        subtitle="Shape the Home board, place widgets, and tune how tiles look and move"
      />

      <div className="flex flex-col gap-5">
        <WeeSettingsCollapsibleSection
          icon={LayoutGrid}
          title="Board studio"
          description="Size the grid, peek at pages, and punch wallpaper holes."
          defaultOpen
        >
          <WeeGlassPill className="relative overflow-hidden rounded-[2.5rem] p-6 md:p-7">
            <div className="relative z-[1] flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[hsl(var(--primary))] px-3 py-1 text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.2em] text-[hsl(var(--text-on-accent))]">
                  Home board
                </span>
                <m.h2
                  key={`${layout.columns}-${layout.rows}-${layout.totalPages}`}
                  initial={reduceMotion ? false : { y: 8, opacity: 0.4 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={press}
                  className="m-0 mt-3 text-[clamp(1.85rem,4vw,2.4rem)] font-black uppercase italic leading-none tracking-tighter text-[hsl(var(--text-primary))]"
                >
                  {layout.columns} × {layout.rows} × {layout.totalPages}
                </m.h2>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--text-secondary))]">
                  {totalChannels} slots · classic default {WII_LAYOUT_PRESET.columns}×
                  {WII_LAYOUT_PRESET.rows}×{WII_LAYOUT_PRESET.totalPages}
                </p>
              </div>
              {activeSpaceId === 'gamehub' || activeSpaceId === 'mediahub' ? (
                <Text variant="caption" className="!m-0 max-w-[14rem] text-[hsl(var(--text-tertiary))]">
                  You’re in a Hub — edits still apply to the Home board.
                </Text>
              ) : null}
            </div>
            <LayoutGrid
              className="pointer-events-none absolute -bottom-8 -right-4 h-36 w-36 rotate-12 text-[hsl(var(--text-primary))] opacity-[0.06]"
              strokeWidth={1.25}
              aria-hidden
            />
          </WeeGlassPill>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <LayoutStepper
              label="Columns"
              value={layout.columns}
              min={CHANNEL_LAYOUT_LIMITS.columns.min}
              max={CHANNEL_LAYOUT_LIMITS.columns.max}
              onChange={(v) => handleLayoutFieldChange('columns', v)}
              ariaLabel="columns"
            />
            <LayoutStepper
              label="Rows"
              value={layout.rows}
              min={CHANNEL_LAYOUT_LIMITS.rows.min}
              max={CHANNEL_LAYOUT_LIMITS.rows.max}
              onChange={(v) => handleLayoutFieldChange('rows', v)}
              ariaLabel="rows"
            />
            <LayoutStepper
              label="Pages"
              value={layout.totalPages}
              min={CHANNEL_LAYOUT_LIMITS.totalPages.min}
              max={CHANNEL_LAYOUT_LIMITS.totalPages.max}
              onChange={(v) => handleLayoutFieldChange('totalPages', v)}
              ariaLabel="pages"
            />
            <LayoutStepper
              label="Peek %"
              value={layout.peekPercent}
              min={CHANNEL_LAYOUT_LIMITS.peekPercent.min}
              max={CHANNEL_LAYOUT_LIMITS.peekPercent.max}
              onChange={(v) => handleLayoutFieldChange('peekPercent', v)}
              ariaLabel="next-page peek percent"
            />
          </div>
          <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
            Shrinking the board keeps channels that still fit; extras are cleared. Growing adds empty slots.
            Peek % controls how much of the next page shows at the strip’s edge.
          </Text>

          <div className="flex flex-col gap-4 rounded-[2rem] border-2 border-[hsl(var(--primary)/0.28)] bg-[hsl(var(--surface-wii-tint)/0.5)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 max-w-xl">
                <WeeSectionEyebrow className="mb-1 block" trackingClassName="tracking-[0.14em]">
                  Edit Home
                </WeeSectionEyebrow>
                <Text variant="body" className="!m-0 !font-black !text-[hsl(var(--text-primary))]">
                  Arrange tiles and widgets on Home
                </Text>
                <Text variant="desc" className="!mt-2 !mb-0 text-[hsl(var(--text-secondary))]">
                  Closes settings and edits the board in place — reorder tiles, add widgets, and
                  punch wallpaper holes right where they live.
                </Text>
              </div>
              <WeeButton
                type="button"
                variant="primary"
                className="!rounded-full !px-5 !py-3 shrink-0"
                onClick={handleArrangeOnHome}
              >
                Edit Home
              </WeeButton>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border-primary)/0.25)] pt-4">
              <div>
                <WeeSectionEyebrow className="mb-1 block" trackingClassName="tracking-[0.14em]">
                  Punch holes (in settings)
                </WeeSectionEyebrow>
                <Text variant="desc" className="!m-0 text-[hsl(var(--text-secondary))]">
                  Edit holes in the preview below — or punch them live on Home while arranging.
                </Text>
              </div>
              <m.button
                type="button"
                aria-pressed={punchHoleMode}
                onClick={() => setPunchHoleMode((v) => !v)}
                whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                transition={press}
                className={`rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-wide ${
                  punchHoleMode
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-sm)]'
                    : 'border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-secondary))]'
                }`}
              >
                {punchHoleMode ? 'Done editing' : 'Edit holes'}
              </m.button>
            </div>
          </div>

          <BoardLivePreview
            layout={layout}
            slotMeta={slotMeta}
            pageSlotIndices={pageSlotIndices}
            punchHoleMode={punchHoleMode}
            onToggleSlot={handleToggleSlotHidden}
            safePreviewPage={safePreviewPage}
            totalPages={layout.totalPages}
            onPreviewPage={setPreviewPage}
            currentPage={currentPage}
            wallpaperUrl={wallpaperPreviewUrl || null}
          />

          <HomeBoardSwitcher />

          <div className="flex flex-col gap-3 rounded-[2rem] border-2 border-[hsl(var(--primary)/0.22)] bg-[hsl(var(--surface-wii-tint)/0.45)] p-5 md:flex-row md:items-start md:gap-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--primary))]" aria-hidden />
            <div className="min-w-0">
              <Text variant="caption" className="!m-0 text-[hsl(var(--text-secondary))]">
                Side nav &amp; reorder feel live under{' '}
                <WeeHelpLinkButton type="button" className="!mt-0 inline" onClick={() => openSettingsToTab(SETTINGS_TAB_ID.NAVIGATION)}>
                  Navigation
                </WeeHelpLinkButton>{' '}
                and{' '}
                <WeeHelpLinkButton type="button" className="!mt-0 inline" onClick={() => openSettingsToTab(SETTINGS_TAB_ID.MOTION)}>
                  Motion
                </WeeHelpLinkButton>
                . Sounds:{' '}
                <WeeHelpLinkButton type="button" className="!mt-0 inline" onClick={() => openSettingsToTab(SETTINGS_TAB_ID.SOUNDS)}>
                  Sounds
                </WeeHelpLinkButton>
                .
              </Text>
            </div>
          </div>
        </WeeSettingsCollapsibleSection>

        <WeeSettingsCollapsibleSection
          icon={Sparkles}
          title="Widgets"
          description="Floating overlays and Home-board widgets — what they are and how to use them."
          defaultOpen
        >
          <SettingsToggleFieldCard
            hoverAccent="none"
            titleClassName={TOGGLE_TITLE}
            title="Spotify widget"
            desc="Floating mini-player. Connect Spotify under API & Widgets for account access."
            checked={Boolean(floatingWidgets?.spotify?.visible)}
            onChange={(next) => handleToggleFloatingWidget('spotify', next)}
          />
          <SettingsToggleFieldCard
            hoverAccent="none"
            titleClassName={TOGGLE_TITLE}
            title="System Info widget"
            desc="Floating CPU, memory, and system meters. Drag to reposition."
            checked={Boolean(floatingWidgets?.systemInfo?.visible)}
            onChange={(next) => handleToggleFloatingWidget('systemInfo', next)}
          />
          <SettingsToggleFieldCard
            hoverAccent="none"
            titleClassName={TOGGLE_TITLE}
            title="Admin panel widget"
            desc="Floating Quick Access menu for Windows tools. You can also pin Quick Access onto the Home board."
            checked={Boolean(floatingWidgets?.adminPanel?.visible)}
            onChange={(next) => handleToggleFloatingWidget('adminPanel', next)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border-2 border-dashed border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.4)] p-4">
            <div className="min-w-0 max-w-md">
              <WeeSectionEyebrow className="mb-1 block" trackingClassName="tracking-[0.14em]">
                Widgets on the board
              </WeeSectionEyebrow>
              <WeeHelpParagraph className="!normal-case !tracking-[0.04em]">
                Board widgets live in grid slots — place, resize, and remove them in Edit Home.
              </WeeHelpParagraph>
            </div>
            <WeeButton
              type="button"
              variant="secondary"
              className="!rounded-full !px-4 !py-2.5 shrink-0"
              onClick={handleArrangeOnHome}
            >
              Edit Home
            </WeeButton>
          </div>

          <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
            Spotify login &amp; detailed widget options live under{' '}
            <WeeHelpLinkButton
              type="button"
              className="!mt-0 inline"
              onClick={() => openSettingsToTab(SETTINGS_TAB_ID.API_INTEGRATIONS)}
            >
              API &amp; Widgets
            </WeeHelpLinkButton>
            .
          </Text>
        </WeeSettingsCollapsibleSection>

        <WeeSettingsCollapsibleSection
          icon={Monitor}
          title="Visibility & playback"
          description="Empty-slot look, animated art, and hover physics."
          defaultOpen={false}
        >
          <div className="flex flex-col gap-3">
            <SettingsToggleFieldCard
              hoverAccent="none"
              titleClassName={TOGGLE_TITLE}
              title="Adaptive empty slots"
              desc="Empty channel slots blend into your wallpaper for a cohesive look."
              checked={settings.adaptiveEmptyChannels ?? true}
              onChange={handleAdaptiveEmptyChannelsChange}
            />
            <WeeModalFieldCard hoverAccent="none" tone="well" paddingClassName="p-4 md:p-5">
              <WeeSectionEyebrow className="mb-3 block" trackingClassName="tracking-[0.14em]">
                Live adaptive preview
              </WeeSectionEyebrow>
              <div
                className="flex h-16 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-[hsl(var(--border-primary)/0.5)] px-4 shadow-inner transition-colors duration-200"
                style={adaptivePreviewStyle}
                aria-hidden="true"
              >
                <span className="h-10 w-10 rounded-xl border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary)/0.55)] shadow-[var(--shadow-sm)]" />
                <span className="-ml-2 h-10 w-10 rotate-6 rounded-xl border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary)/0.55)] shadow-[var(--shadow-sm)]" />
              </div>
            </WeeModalFieldCard>
          </div>

          <SettingsToggleFieldCard
            hoverAccent="none"
            titleClassName={TOGGLE_TITLE}
            title="Hover-only animations"
            desc="Animated channel art (GIFs/MP4s) plays only while you hover when this is on."
            checked={settings.animatedOnHover ?? false}
            onChange={handleAnimatedOnHoverChange}
          />

          <SettingsToggleFieldCard
            hoverAccent="none"
            titleClassName={TOGGLE_TITLE}
            title="Focus & recede"
            desc="Hovering a tile lightly dims neighbors (filled tiles only). Softened to avoid flicker while scrubbing across the board."
            checked={settings.focusRecedeEnabled ?? true}
            onChange={handleFocusRecedeChange}
          />

          <WeeModalFieldCard hoverAccent="none" tone="well" paddingClassName="p-4 md:p-5">
            <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
              Tile hover physics
            </WeeSectionEyebrow>
            <Text variant="caption" className="!mb-3 block text-[hsl(var(--text-tertiary))]">
              Space-pill gooey hover on channel tiles. Bounce strength is under Motion → Gooey physics.
            </Text>
            <WeeSegmentedControl
              ariaLabel="Channel tile hover physics mode"
              value={gooeyPrefs.channelHoverMode ?? GOOEY_HOVER_MODES.both}
              onChange={handleChannelHoverModeChange}
              options={[
                { value: GOOEY_HOVER_MODES.squash, label: 'Squash' },
                { value: GOOEY_HOVER_MODES.glow, label: 'Glow' },
                { value: GOOEY_HOVER_MODES.both, label: 'Both' },
              ]}
            />
            <button
              type="button"
              className="mt-3 text-left text-[0.75rem] font-bold uppercase tracking-wide text-[hsl(var(--primary))] hover:underline"
              onClick={() => openSettingsToTab(SETTINGS_TAB_ID.MOTION)}
            >
              Open Motion settings
            </button>
          </WeeModalFieldCard>

        </WeeSettingsCollapsibleSection>

        <WeeSettingsCollapsibleSection
          icon={Activity}
          title="Idle motion (advanced)"
          description="Fine-grained micro-delight types. Mode, delays & intensity live in Motion."
          defaultOpen={false}
        >
          <WeeModalFieldCard hoverAccent="none" tone="well" paddingClassName="p-4 md:p-5">
            <Text variant="caption" className="!m-0 block text-[hsl(var(--text-tertiary))]">
              Auto-fade, attract mode, and intensity are controlled from one place now.
            </Text>
            <button
              type="button"
              className="mt-2 text-left text-[0.75rem] font-bold uppercase tracking-wide text-[hsl(var(--primary))] hover:underline"
              onClick={() => openSettingsToTab(SETTINGS_TAB_ID.MOTION)}
            >
              Open Motion → Idle experience
            </button>
          </WeeModalFieldCard>

          <div className="mt-3 space-y-4">
            <div className="w-full min-w-0">
              <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
                Animation types
              </WeeSectionEyebrow>
              <SettingsMultiToggleChips
                items={IDLE_TYPE_ITEMS}
                selectedValues={idleSelected}
                onToggle={handleIdleAnimationTypeToggle}
                ariaLabel="Idle animation types"
              />
            </div>
            <div className="w-full min-w-0 border-t border-[hsl(var(--border-primary)/0.25)] pt-4">
              <Text variant="p" className="!mb-2 !mt-0 font-medium text-[hsl(var(--text-primary))]">
                Animation interval: {settings.idleAnimationInterval ?? 8} seconds
              </Text>
              <Slider
                value={settings.idleAnimationInterval ?? 8}
                min={2}
                max={20}
                step={1}
                onChange={handleIdleAnimationIntervalChange}
              />
            </div>
          </div>
        </WeeSettingsCollapsibleSection>

        <WeeSettingsCollapsibleSection
          icon={Aperture}
          title="Ken Burns"
          description="Cinematic zoom and pan on channel images."
          defaultOpen={false}
        >
          <SettingsToggleFieldCard
            hoverAccent="none"
            titleClassName={TOGGLE_TITLE}
            title="Ken Burns effect"
            desc="Add cinematic zoom and pan to still channel images."
            checked={settings.kenBurnsEnabled ?? false}
            onChange={handleKenBurnsEnabledChange}
            revealKeepMounted={false}
          >
                <div className="w-full min-w-0 space-y-4">
                  <div>
                    <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
                      Trigger mode
                    </WeeSectionEyebrow>
                    <WeeSegmentedControl
                      ariaLabel="Ken Burns trigger mode"
                      value={settings.kenBurnsMode ?? 'hover'}
                      onChange={handleKenBurnsModeChange}
                      options={KEN_BURNS_MODE_OPTIONS}
                      size="sm"
                      className="w-full min-w-0 justify-start sm:inline-flex sm:w-auto"
                    />
                  </div>

                  <div className="space-y-3 border-t border-[hsl(var(--border-primary)/0.25)] pt-4">
                    <WeeDescriptionToggleRow
                      description="Apply Ken Burns to animated GIFs too (in addition to still images)."
                    >
                      <WToggle
                        checked={settings.kenBurnsForGifs ?? false}
                        onChange={handleKenBurnsForGifsChange}
                        label="Ken Burns for GIFs"
                      />
                    </WeeDescriptionToggleRow>
                    <WeeDescriptionToggleRow
                      description="Apply Ken Burns to MP4 channel videos too (in addition to still images)."
                    >
                      <WToggle
                        checked={settings.kenBurnsForVideos ?? false}
                        onChange={handleKenBurnsForVideosChange}
                        label="Ken Burns for videos"
                      />
                    </WeeDescriptionToggleRow>
                  </div>

                  <div>
                    <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
                      Scale
                    </WeeSectionEyebrow>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Text variant="caption" className="mb-1 block text-[hsl(var(--text-tertiary))]">
                          Hover scale: {settings.kenBurnsHoverScale ?? 1.1}
                        </Text>
                        <Slider
                          value={settings.kenBurnsHoverScale ?? 1.1}
                          min={1.0}
                          max={1.5}
                          step={0.05}
                          onChange={handleKenBurnsHoverScaleChange}
                        />
                      </div>
                      <div>
                        <Text variant="caption" className="mb-1 block text-[hsl(var(--text-tertiary))]">
                          Autoplay scale: {settings.kenBurnsAutoplayScale ?? 1.15}
                        </Text>
                        <Slider
                          value={settings.kenBurnsAutoplayScale ?? 1.15}
                          min={1.0}
                          max={1.5}
                          step={0.05}
                          onChange={handleKenBurnsAutoplayScaleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
                      Duration
                    </WeeSectionEyebrow>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Text variant="caption" className="mb-1 block text-[hsl(var(--text-tertiary))]">
                          Hover duration: {settings.kenBurnsHoverDuration ?? 8000}ms
                        </Text>
                        <Slider
                          value={settings.kenBurnsHoverDuration ?? 8000}
                          min={2000}
                          max={15000}
                          step={500}
                          onChange={handleKenBurnsHoverDurationChange}
                        />
                      </div>
                      <div>
                        <Text variant="caption" className="mb-1 block text-[hsl(var(--text-tertiary))]">
                          Autoplay duration: {settings.kenBurnsAutoplayDuration ?? 12000}ms
                        </Text>
                        <Slider
                          value={settings.kenBurnsAutoplayDuration ?? 12000}
                          min={5000}
                          max={20000}
                          step={500}
                          onChange={handleKenBurnsAutoplayDurationChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
                      Advanced
                    </WeeSectionEyebrow>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div>
                        <Text variant="caption" className="mb-1 block text-[hsl(var(--text-tertiary))]">
                          Crossfade duration: {settings.kenBurnsCrossfadeDuration ?? 1000}ms
                        </Text>
                        <Slider
                          value={settings.kenBurnsCrossfadeDuration ?? 1000}
                          min={500}
                          max={3000}
                          step={100}
                          onChange={handleKenBurnsCrossfadeDurationChange}
                        />
                      </div>
                      <div>
                        <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
                          Easing
                        </WeeSectionEyebrow>
                        <WeeSegmentedControl
                          ariaLabel="Ken Burns easing"
                          value={settings.kenBurnsEasing ?? 'ease-out'}
                          onChange={handleKenBurnsEasingChange}
                          options={KEN_BURNS_EASING_OPTIONS}
                          size="sm"
                          wrap
                          className="w-full min-w-0 justify-start"
                        />
                      </div>
                    </div>
                  </div>
                </div>
          </SettingsToggleFieldCard>
        </WeeSettingsCollapsibleSection>
      </div>

      <footer className="mt-10 rounded-[2rem] border-2 border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Info size={16} strokeWidth={2.25} className="shrink-0 text-[hsl(var(--wee-text-rail-muted))]" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--wee-text-rail-muted))]">
            Settings sync automatically
          </span>
        </div>
      </footer>
    </div>
  );
});

ChannelsLayoutSettingsTab.displayName = 'ChannelsLayoutSettingsTab';

export default ChannelsLayoutSettingsTab;
