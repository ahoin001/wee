import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Activity, Aperture, LayoutGrid, Minus, Plus, Sparkles } from 'lucide-react';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import {
  WeeButton,
  WeeDescriptionToggleRow,
  WeeDockSettingsSubtabs,
  WeeHelpLinkButton,
  WeeHelpParagraph,
  WeeModalFieldCard,
  WeeSegmentedControl,
  WeeSectionEyebrow,
} from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import SettingsToggleFieldCard from './SettingsToggleFieldCard';
import ChannelBoardLivePreview from './ChannelBoardLivePreview';
import { useHomeBoardArrange } from '../../hooks/useHomeBoardArrange';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  CHANNEL_LAYOUT_LIMITS,
  isSlotHidden,
  resolveLayout,
  resolveLayoutForPage,
  WII_LAYOUT_PRESET,
  WII_STRIP_PEEK_PERCENT,
} from '../../utils/channelLayoutSystem';
import {
  getChannelDataSlice,
  resolveActiveChannelSpaceKey,
} from '../../utils/channelSpaces';
import { wallpaperEntryUrlKey } from '../../utils/wallpaperShape';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import { mergeMotionFeedback } from '../../utils/motionFeedbackDefaults';
import { GOOEY_HOVER_MODES } from '../../design/gooeyPhysics';
import { createWeeTransition, useWeeMotion } from '../../design/weeMotion';

/** Board-style toggle titles: bold all-caps (matches Wii engine field cards). */
const TOGGLE_TITLE =
  '!text-[0.8125rem] !font-black !uppercase !tracking-[0.06em] !leading-snug !text-[hsl(var(--text-primary))]';

const LAYOUT_SUB_TABS = [
  {
    id: 'board',
    label: 'Board',
    description: 'Grid & punch holes',
    icon: LayoutGrid,
  },
  {
    id: 'widgets',
    label: 'Widgets',
    description: 'Floating & Home',
    icon: Sparkles,
  },
  {
    id: 'channel-style',
    label: 'Channel style',
    description: 'Look & hover',
    icon: Activity,
  },
  {
    id: 'ken-burns',
    label: 'Ken Burns',
    description: 'Zoom & pan',
    icon: Aperture,
  },
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

const ChannelsLayoutSettingsTab = React.memo(() => {
  const channels = useConsolidatedAppStore((state) => state.channels);
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
  const adminPanelVisible = useConsolidatedAppStore(
    (state) => Boolean(state.floatingWidgets?.adminPanel?.visible)
  );
  const setSpacesState = useConsolidatedAppStore((state) => state.actions.setSpacesState);
  const [punchHoleMode, setPunchHoleMode] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const [boardPickerKey, setBoardPickerKey] = useState(null);
  const [pageOnlyLayout, setPageOnlyLayout] = useState(false);
  const [layoutStatus, setLayoutStatus] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('board');
  const { enterArrange: enterHomeBoardArrange } = useHomeBoardArrange();
  const { tabTransition } = useWeeMotion();

  const activeChannelSpaceKey = resolveActiveChannelSpaceKey(activeSpaceId);
  const layoutSpaceKey = boardPickerKey || activeChannelSpaceKey;
  const isFocusBoard = layoutSpaceKey === 'workspaces';
  const boardLabel = isFocusBoard ? 'Focus' : 'Home';

  useEffect(() => {
    const data = getChannelDataSlice(
      useConsolidatedAppStore.getState().channels,
      layoutSpaceKey
    );
    setPreviewPage(data?.navigation?.currentPage || 0);
    setLayoutStatus('');
  }, [layoutSpaceKey]);

  const handleArrangeOnHome = useCallback(() => {
    enterHomeBoardArrange({ closeSettings: true });
  }, [enterHomeBoardArrange]);

  const handlePunchOnHome = useCallback(() => {
    enterHomeBoardArrange({ closeSettings: true, punchMode: true });
  }, [enterHomeBoardArrange]);

  const handleOpenFocusBoard = useCallback(() => {
    setSpacesState({ activeSpaceId: 'workspaces' });
    actions.setUIState({ showSettingsModal: false });
  }, [actions, setSpacesState]);

  const handleToggleAdminPanel = useCallback(
    (nextVisible) => {
      const current = useConsolidatedAppStore.getState().floatingWidgets?.adminPanel;
      if (!current) return;
      actions.setFloatingWidgetsState({
        adminPanel: {
          ...current,
          visible: typeof nextVisible === 'boolean' ? nextVisible : !current.visible,
        },
      });
    },
    [actions]
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

  const currentData = useMemo(
    () => getChannelDataSlice(channels, layoutSpaceKey),
    [channels, layoutSpaceKey]
  );
  const stripLayout = useMemo(() => resolveLayout(currentData), [currentData]);
  const currentNavigation = currentData.navigation || {};
  const currentPage = currentNavigation.currentPage || 0;
  const slotMeta = currentData.slotMeta || {};
  const safePreviewPage = Math.max(0, Math.min(previewPage, stripLayout.totalPages - 1));
  const pageLayout = useMemo(
    () => resolveLayoutForPage(currentData, safePreviewPage),
    [currentData, safePreviewPage]
  );
  const layout = pageOnlyLayout ? pageLayout : stripLayout;
  const totalChannels = stripLayout.totalChannels;

  const handleLayoutFieldChange = useCallback(
    (field, value) => {
      const pageOnlyFields = field === 'columns' || field === 'rows';
      if (pageOnlyLayout && pageOnlyFields) {
        actions.setChannelLayoutForSpace(
          layoutSpaceKey,
          { [field]: value },
          { pageOnly: true, pageIndex: safePreviewPage }
        );
        setLayoutStatus(`Page ${safePreviewPage + 1} size updated. Live strip uses the board maximum.`);
        return;
      }
      const hadOverrides = Object.keys(currentData?.layoutByPage || {}).length > 0;
      actions.setChannelLayoutForSpace(layoutSpaceKey, { [field]: value });
      if (hadOverrides && (field === 'columns' || field === 'rows' || field === 'totalPages')) {
        setLayoutStatus('Page overrides cleared — board size applies to all pages.');
      } else {
        setLayoutStatus('');
      }
    },
    [actions, currentData?.layoutByPage, layoutSpaceKey, pageOnlyLayout, safePreviewPage]
  );

  const handleResetToClassic = useCallback(() => {
    actions.setChannelLayoutForSpace(layoutSpaceKey, {
      columns: WII_LAYOUT_PRESET.columns,
      rows: WII_LAYOUT_PRESET.rows,
      totalPages: WII_LAYOUT_PRESET.totalPages,
      peekPercent: WII_STRIP_PEEK_PERCENT,
    });
    setPageOnlyLayout(false);
    setLayoutStatus(
      `Reset ${boardLabel} to classic ${WII_LAYOUT_PRESET.columns}×${WII_LAYOUT_PRESET.rows}×${WII_LAYOUT_PRESET.totalPages}.`
    );
  }, [actions, boardLabel, layoutSpaceKey]);

  const handleClearPageOverride = useCallback(() => {
    actions.setChannelLayoutForSpace(
      layoutSpaceKey,
      { columns: stripLayout.columns, rows: stripLayout.rows },
      { pageOnly: true, pageIndex: safePreviewPage }
    );
    setLayoutStatus(`Cleared page ${safePreviewPage + 1} size — using board grid.`);
  }, [actions, layoutSpaceKey, safePreviewPage, stripLayout.columns, stripLayout.rows]);

  const handleToggleSlotHidden = useCallback(
    (channelIndex) => {
      const next = !isSlotHidden(slotMeta, channelIndex);
      actions.setChannelSlotHiddenForSpace(layoutSpaceKey, channelIndex, next);
    },
    [actions, layoutSpaceKey, slotMeta]
  );

  const pageSlotIndices = useMemo(() => {
    const start = safePreviewPage * stripLayout.channelsPerPage;
    if (
      pageOnlyLayout &&
      (pageLayout.columns !== stripLayout.columns || pageLayout.rows !== stripLayout.rows)
    ) {
      const indices = [];
      for (let r = 0; r < pageLayout.rows; r += 1) {
        for (let c = 0; c < pageLayout.columns; c += 1) {
          const idxInPage = r * stripLayout.columns + c;
          if (idxInPage >= stripLayout.channelsPerPage) continue;
          const abs = start + idxInPage;
          if (abs < stripLayout.totalChannels) indices.push(abs);
        }
      }
      return indices;
    }
    return Array.from({ length: stripLayout.channelsPerPage }, (_, i) => start + i).filter(
      (i) => i < stripLayout.totalChannels
    );
  }, [
    safePreviewPage,
    pageOnlyLayout,
    pageLayout.columns,
    pageLayout.rows,
    stripLayout.columns,
    stripLayout.channelsPerPage,
    stripLayout.totalChannels,
  ]);

  const handleAnimatedOnHoverChange = useCallback((checked) => {
    actions.setChannelSettings({ animatedOnHover: checked });
  }, [actions]);

  const handleKenBurnsEnabledChange = useCallback((checked) => {
    actions.setChannelSettings({ kenBurnsEnabled: checked });
  }, [actions]);

  const handleKenBurnsForGifsChange = useCallback((checked) => {
    actions.setChannelSettings({ kenBurnsForGifs: checked });
  }, [actions]);

  const handleKenBurnsForVideosChange = useCallback((checked) => {
    actions.setChannelSettings({ kenBurnsForVideos: checked });
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

  const renderBoardPanel = () => (
    <div className="flex flex-col gap-4">
      {/* Toolbox — all size / page / punch controls above the canvas */}
      <div className="rounded-[2rem] border-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.55)] p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <WeeSectionEyebrow className="mb-1 block" trackingClassName="tracking-[0.14em]">
              Board studio
            </WeeSectionEyebrow>
            <h2 className="m-0 text-xl font-black tracking-tight text-[hsl(var(--text-primary))] md:text-2xl">
              {boardLabel} · {layout.columns}×{layout.rows}×{stripLayout.totalPages}
            </h2>
            <Text variant="desc" className="!mt-1 !mb-0 text-[hsl(var(--text-secondary))]">
              {totalChannels} slots
              {pageLayout.hasPageOverride ? ' · this page has a custom size' : ''}
            </Text>
          </div>
          <div className="w-full max-w-[14rem] sm:w-auto">
            <WeeSegmentedControl
              ariaLabel="Channel board to edit"
              value={layoutSpaceKey}
              onChange={(key) => setBoardPickerKey(key)}
              options={[
                { value: 'home', label: 'Home' },
                { value: 'workspaces', label: 'Focus' },
              ]}
              size="sm"
            />
          </div>
        </div>

        {activeSpaceId === 'gamehub' || activeSpaceId === 'mediahub' ? (
          <Text variant="caption" className="!mt-2 !mb-0 text-[hsl(var(--text-tertiary))]">
            You&apos;re in a Hub — pick Home or Focus above to choose which grid to edit.
          </Text>
        ) : null}

        {stripLayout.totalPages > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Preview page">
            {Array.from({ length: stripLayout.totalPages }, (_, page) => {
              const selected = safePreviewPage === page;
              return (
                <button
                  key={`toolbox-page-${page}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setPreviewPage(page)}
                  className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
                    selected
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                      : 'bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--border-secondary))]'
                  }`}
                >
                  Page {page + 1}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            value={stripLayout.totalPages}
            min={CHANNEL_LAYOUT_LIMITS.totalPages.min}
            max={CHANNEL_LAYOUT_LIMITS.totalPages.max}
            onChange={(v) => handleLayoutFieldChange('totalPages', v)}
            ariaLabel="pages"
          />
          <LayoutStepper
            label="Peek %"
            value={stripLayout.peekPercent}
            min={CHANNEL_LAYOUT_LIMITS.peekPercent.min}
            max={CHANNEL_LAYOUT_LIMITS.peekPercent.max}
            onChange={(v) => handleLayoutFieldChange('peekPercent', v)}
            ariaLabel="next-page peek percent"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[hsl(var(--border-primary)/0.25)] pt-4">
          <div className="mr-auto flex flex-wrap items-center gap-3">
            <WToggle
              checked={pageOnlyLayout}
              onChange={setPageOnlyLayout}
              label="This page only"
            />
            <WeeButton type="button" variant="secondary" className="!px-3 !py-2" onClick={handleResetToClassic}>
              Reset classic
            </WeeButton>
            {pageLayout.hasPageOverride ? (
              <WeeButton type="button" variant="secondary" className="!px-3 !py-2" onClick={handleClearPageOverride}>
                Clear page size
              </WeeButton>
            ) : null}
          </div>
          <WeeButton
            type="button"
            variant={punchHoleMode ? 'primary' : 'secondary'}
            className="shrink-0"
            aria-pressed={punchHoleMode}
            onClick={() => setPunchHoleMode((v) => !v)}
          >
            {punchHoleMode ? 'Done punching' : 'Punch holes'}
          </WeeButton>
          {!isFocusBoard ? (
            <WeeButton type="button" variant="secondary" className="shrink-0" onClick={handlePunchOnHome}>
              Punch on Home
            </WeeButton>
          ) : null}
          <WeeButton
            type="button"
            variant="primary"
            className="shrink-0"
            onClick={isFocusBoard ? handleOpenFocusBoard : handleArrangeOnHome}
          >
            {isFocusBoard ? 'Open Focus' : 'Edit Home'}
          </WeeButton>
        </div>

        {layoutStatus ? (
          <Text variant="caption" className="!mt-3 !mb-0 text-[hsl(var(--text-secondary))]" role="status">
            {layoutStatus}
          </Text>
        ) : pageOnlyLayout ? (
          <Text variant="caption" className="!mt-3 !mb-0 text-[hsl(var(--text-tertiary))]">
            Columns/rows apply to page {safePreviewPage + 1} only. Pages &amp; peek stay board-wide.
          </Text>
        ) : null}
      </div>

      <ChannelBoardLivePreview
        layout={{
          columns: layout.columns,
          rows: layout.rows,
        }}
        slotMeta={slotMeta}
        slots={currentData.slots}
        configuredChannels={currentData.configuredChannels}
        pageSlotIndices={pageSlotIndices}
        punchHoleMode={punchHoleMode}
        onToggleSlot={handleToggleSlotHidden}
        safePreviewPage={safePreviewPage}
        currentPage={currentPage}
        wallpaperUrl={wallpaperPreviewUrl || null}
      />
    </div>
  );

  const renderWidgetsPanel = () => (
    <div className="flex flex-col gap-4">
      <SettingsToggleFieldCard
        hoverAccent="none"
        titleClassName={TOGGLE_TITLE}
        title="Admin panel widget"
        desc="Floating Quick Access menu for Windows tools. You can also pin Quick Access on Home."
        checked={adminPanelVisible}
        onChange={handleToggleAdminPanel}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border-2 border-dashed border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.4)] p-4">
        <div className="min-w-0 max-w-md">
          <WeeSectionEyebrow className="mb-1 block" trackingClassName="tracking-[0.14em]">
            Widgets on the board
          </WeeSectionEyebrow>
          <WeeHelpParagraph className="!normal-case !tracking-[0.04em]">
            Board widgets float on wallpaper by default (Clear). Use Glass for a light frost,
            or Basic for a solid card — place and restyle them in Edit Home.
          </WeeHelpParagraph>
        </div>
        <WeeButton
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={handleArrangeOnHome}
        >
          Edit Home
        </WeeButton>
      </div>

      <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
        Spotify connects under{' '}
        <WeeHelpLinkButton
          type="button"
          className="!mt-0 inline"
          onClick={() => openSettingsToTab(SETTINGS_TAB_ID.API_INTEGRATIONS, { integrationsSubTab: 'music' })}
        >
          Music, Steam &amp; Widgets
        </WeeHelpLinkButton>
        . Use a Now Playing channel on Home instead of a floating player.
      </Text>
    </div>
  );

  const renderChannelStylePanel = () => (
    <div className="flex flex-col gap-4">
      <SettingsToggleFieldCard
        hoverAccent="none"
        titleClassName={TOGGLE_TITLE}
        title="Hover-only animations"
        desc="Animated channel art (GIFs/MP4s) plays only while you hover when this is on."
        checked={settings.animatedOnHover ?? false}
        onChange={handleAnimatedOnHoverChange}
      />

      <WeeModalFieldCard hoverAccent="none" tone="well" paddingClassName="p-4 md:p-5">
        <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
          Channel hover physics
        </WeeSectionEyebrow>
        <Text variant="caption" className="!mb-3 block text-[hsl(var(--text-tertiary))]">
          Space-pill gooey hover on channels. Bounce strength is under Motion → Gooey physics.
        </Text>
        <WeeSegmentedControl
          ariaLabel="Channel hover physics mode"
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
    </div>
  );

  const renderKenBurnsPanel = () => (
    <div className="flex flex-col gap-4">
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
    </div>
  );

  const renderPanel = () => {
    switch (activeSubTab) {
      case 'board':
        return renderBoardPanel();
      case 'widgets':
        return renderWidgetsPanel();
      case 'channel-style':
      case 'tile-style': // legacy local subtab id
        return renderChannelStylePanel();
      case 'ken-burns':
        return renderKenBurnsPanel();
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col pb-12 [contain:layout]">
      <SettingsTabPageHeader
        title="Channel & layout"
        subtitle="Size the Home or Focus grid, place widgets, and tune how channels look"
        className="mb-6"
      />

      <WeeDockSettingsSubtabs
        tabs={LAYOUT_SUB_TABS}
        value={activeSubTab}
        onChange={setActiveSubTab}
        ariaLabel="Channel and layout sections"
        layoutId="weeChannelsLayoutSubtabActive"
      />

      <div className="mt-6 min-h-[min(50vh,420px)]">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={activeSubTab}
            role="tabpanel"
            aria-labelledby={`dock-subtab-${activeSubTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={tabTransition}
          >
            {renderPanel()}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

ChannelsLayoutSettingsTab.displayName = 'ChannelsLayoutSettingsTab';

export default ChannelsLayoutSettingsTab;
