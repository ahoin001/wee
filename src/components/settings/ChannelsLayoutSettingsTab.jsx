import React, { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Activity, Aperture, EyeOff, Home, Info, LayoutGrid, Monitor } from 'lucide-react';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import {
  WeeHelpLinkButton,
  WeeModalFieldCard,
  WeeSegmentedControl,
  WeeSectionEyebrow,
  WeeSettingsCollapsibleSection,
} from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import SettingsToggleFieldCard from './SettingsToggleFieldCard';
import SettingsMultiToggleChips from './SettingsMultiToggleChips';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  CHANNEL_LAYOUT_LIMITS,
  isSlotHidden,
  resolveLayout,
  WII_LAYOUT_PRESET,
} from '../../utils/channelLayoutSystem';
import { getChannelDataSlice } from '../../utils/channelSpaces';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import { mergeMotionFeedback } from '../../utils/motionFeedbackDefaults';
import { GOOEY_HOVER_MODES } from '../../design/gooeyPhysics';

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

const CHANNEL_SPACE_OPTIONS = [
  {
    id: 'home',
    label: 'Home',
    subtitle: 'Main Wii board',
    Icon: Home,
  },
];

function ChannelSpacePicker({ value, onChange, idPrefix = 'channel-space' }) {
  return (
    <div className="grid grid-cols-1 gap-3" role="group" aria-label="Channel board to preview">
      {CHANNEL_SPACE_OPTIONS.map((opt) => {
        const selected = value === opt.id;
        const Icon = opt.Icon;
        return (
          <button
            key={opt.id}
            type="button"
            id={`${idPrefix}-${opt.id}`}
            aria-pressed={selected}
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-start gap-3 rounded-[2rem] border-4 p-5 text-left transition-all md:p-6 ${
              selected
                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--surface-wii-tint)/0.65)] shadow-[var(--shadow-sm)]'
                : 'border-[hsl(var(--wee-border-card))] bg-[hsl(var(--surface-primary))] hover:border-[hsl(var(--border-secondary))]'
            }`}
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                selected
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                  : 'bg-[hsl(var(--surface-tertiary))] text-[hsl(var(--text-tertiary))]'
              }`}
            >
              <Icon size={28} strokeWidth={2} aria-hidden />
            </div>
            <div>
              <p
                className={`m-0 font-black uppercase italic tracking-tight ${
                  selected ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--text-primary))]'
                }`}
              >
                {opt.label}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                {opt.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
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
  const activeSpaceId = useConsolidatedAppStore((state) => state.spaces.activeSpaceId);
  const actions = useConsolidatedAppStore(
    useShallow((state) => ({
      setChannelSettings: state.actions.setChannelSettings,
      setSpacesState: state.actions.setSpacesState,
      setUIState: state.actions.setUIState,
      setChannelLayoutForSpace: state.actions.setChannelLayoutForSpace,
      setChannelSlotHiddenForSpace: state.actions.setChannelSlotHiddenForSpace,
    }))
  );
  const motionFeedback = useConsolidatedAppStore((state) => state.ui.motionFeedback);
  const gooeyPrefs = useMemo(() => mergeMotionFeedback(motionFeedback).gooey, [motionFeedback]);
  const [punchHoleMode, setPunchHoleMode] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);

  const handleChannelHoverModeChange = useCallback(
    (mode) => {
      actions.setUIState((prev) => {
        const m = mergeMotionFeedback(prev.motionFeedback);
        return {
          motionFeedback: mergeMotionFeedback({
            ...m,
            gooey: {
              ...m.gooey,
              channelHoverMode: mode,
            },
          }),
        };
      });
    },
    [actions]
  );

  const settings = channels?.settings || {};
  /** Which channel grid slice to show for page/status (independent of shell when previewing). */
  const layoutSpaceKey = 'home';

  const handleSpacePreviewChange = useCallback(
    (spaceId) => {
      actions.setSpacesState({ lastChannelSpaceId: spaceId });
    },
    [actions]
  );

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

  const handleIdleAnimationEnabledChange = useCallback((checked) => {
    actions.setChannelSettings({ idleAnimationEnabled: checked });
  }, [actions]);

  const handleKenBurnsEnabledChange = useCallback((checked) => {
    actions.setChannelSettings({ kenBurnsEnabled: checked });
  }, [actions]);

  const handleChannelAutoFadeTimeoutChange = useCallback((value) => {
    actions.setChannelSettings({ autoFadeTimeout: value });
  }, [actions]);

  const handleAdaptiveEmptyChannelsChange = useCallback((checked) => {
    actions.setChannelSettings({ adaptiveEmptyChannels: checked });
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
    <div className="mx-auto flex max-w-4xl flex-col pb-12">
      <SettingsTabPageHeader
        title="Channel & layout"
        subtitle="Structure, status, and tile motion"
      />

      <div className="flex flex-col gap-6">
        <WeeSettingsCollapsibleSection
          icon={LayoutGrid}
          title="Layout & spaces"
          description="Grid size, wallpaper holes, which board you preview, and related settings links."
          defaultOpen
        >
          <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-tertiary))] p-8 text-[hsl(var(--text-primary))]">
            <div className="relative z-[1]">
              <span className="inline-flex rounded-full bg-[hsl(var(--primary))] px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[hsl(var(--text-on-accent))]">
                Live layout
              </span>
              <h2 className="m-0 mt-3 text-[clamp(1.75rem,4vw,2.25rem)] font-black uppercase italic leading-none tracking-tighter">
                {layout.columns} × {layout.rows} × {layout.totalPages}
              </h2>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--text-secondary))]">
                {totalChannels} slots · default {WII_LAYOUT_PRESET.columns}×{WII_LAYOUT_PRESET.rows}×
                {WII_LAYOUT_PRESET.totalPages}
              </p>
            </div>
            <LayoutGrid
              className="pointer-events-none absolute -bottom-6 -right-4 h-40 w-40 rotate-12 text-[hsl(var(--text-primary))] opacity-[0.07]"
              strokeWidth={1.25}
              aria-hidden
            />
          </div>

          <WeeModalFieldCard hoverAccent="none" paddingClassName="p-5 md:p-6">
            <WeeSectionEyebrow className="mb-3 block" trackingClassName="tracking-[0.14em]">
              Grid geometry
            </WeeSectionEyebrow>
            <Text variant="desc" className="!mb-4 !mt-0 text-[hsl(var(--text-secondary))]">
              Changing size migrates channel keys (extra slots are dropped; new slots start empty).
            </Text>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4">
              <Slider
                label="Columns"
                value={layout.columns}
                min={CHANNEL_LAYOUT_LIMITS.columns.min}
                max={CHANNEL_LAYOUT_LIMITS.columns.max}
                step={1}
                onChange={(v) => handleLayoutFieldChange('columns', v)}
                aria-label="Channel grid columns"
              />
              <Slider
                label="Rows"
                value={layout.rows}
                min={CHANNEL_LAYOUT_LIMITS.rows.min}
                max={CHANNEL_LAYOUT_LIMITS.rows.max}
                step={1}
                onChange={(v) => handleLayoutFieldChange('rows', v)}
                aria-label="Channel grid rows"
              />
              <Slider
                label="Pages"
                value={layout.totalPages}
                min={CHANNEL_LAYOUT_LIMITS.totalPages.min}
                max={CHANNEL_LAYOUT_LIMITS.totalPages.max}
                step={1}
                onChange={(v) => handleLayoutFieldChange('totalPages', v)}
                aria-label="Channel grid pages"
              />
            </div>
          </WeeModalFieldCard>

          <WeeModalFieldCard hoverAccent="none" paddingClassName="p-5 md:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <WeeSectionEyebrow className="mb-1 block" trackingClassName="tracking-[0.14em]">
                  Punch holes
                </WeeSectionEyebrow>
                <Text variant="desc" className="!m-0 text-[hsl(var(--text-secondary))]">
                  Hide slots so wallpaper shows through. Holes stay at absolute indices.
                </Text>
              </div>
              <button
                type="button"
                aria-pressed={punchHoleMode}
                onClick={() => setPunchHoleMode((v) => !v)}
                className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wide ${
                  punchHoleMode
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                    : 'bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))]'
                }`}
              >
                {punchHoleMode ? 'Editing holes' : 'Edit holes'}
              </button>
            </div>
            {layout.totalPages > 1 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {Array.from({ length: layout.totalPages }, (_, page) => (
                  <button
                    key={`layout-page-${page}`}
                    type="button"
                    onClick={() => setPreviewPage(page)}
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                      safePreviewPage === page
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                        : 'bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))]'
                    }`}
                  >
                    Page {page + 1}
                  </button>
                ))}
              </div>
            ) : null}
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
              }}
              role="group"
              aria-label="Channel slot punch-hole preview"
            >
              {pageSlotIndices.map((slotIndex) => {
                const hidden = isSlotHidden(slotMeta, slotIndex);
                return (
                  <button
                    key={`punch-${slotIndex}`}
                    type="button"
                    disabled={!punchHoleMode}
                    onClick={() => handleToggleSlotHidden(slotIndex)}
                    title={
                      punchHoleMode
                        ? hidden
                          ? 'Show slot'
                          : 'Hide slot (wallpaper hole)'
                        : `Slot ${slotIndex + 1}`
                    }
                    className={`relative flex aspect-[4/3] items-center justify-center rounded-xl border-2 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      hidden
                        ? 'border-dashed border-[hsl(var(--border-secondary))] bg-transparent text-[hsl(var(--text-tertiary))]'
                        : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] text-[hsl(var(--text-secondary))]'
                    } ${punchHoleMode ? 'cursor-pointer hover:border-[hsl(var(--primary))]' : 'cursor-default opacity-90'}`}
                  >
                    {hidden ? <EyeOff size={14} aria-hidden /> : slotIndex + 1}
                  </button>
                );
              })}
            </div>
          </WeeModalFieldCard>

          <div>
            <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
              Board to preview
            </WeeSectionEyebrow>
            <Text variant="desc" className="!mb-3 !mt-0 text-[hsl(var(--text-secondary))]">
              Tile defaults below apply everywhere. This only chooses which board&apos;s page status you see.
            </Text>
            {activeSpaceId === 'gamehub' || activeSpaceId === 'mediahub' ? (
              <Text variant="caption" className="!mb-4 block text-[hsl(var(--text-tertiary))]">
                You&apos;re in a Hub space — this mirrors Home board strip status.
              </Text>
            ) : null}
            <ChannelSpacePicker value={layoutSpaceKey} onChange={handleSpacePreviewChange} />
          </div>

          <WeeModalFieldCard hoverAccent="none" paddingClassName="p-5 md:p-6">
            <Text variant="caption" className="!mt-0 text-[hsl(var(--text-secondary))]">
              Current page (preview board)
            </Text>
            <Text variant="p" className="!mb-0 !mt-2 text-2xl font-black uppercase italic leading-none tracking-tight text-[hsl(var(--text-primary))]">
              Page {String(currentPage + 1).padStart(2, '0')}
            </Text>
            <Text variant="caption" className="!mt-2 text-[hsl(var(--text-tertiary))]">
              Of {layout.totalPages} total pages · Home
            </Text>
          </WeeModalFieldCard>

          <div className="flex flex-col gap-3 rounded-[2rem] border-2 border-[hsl(var(--primary)/0.22)] bg-[hsl(var(--surface-wii-tint)/0.45)] p-5 md:flex-row md:items-start md:gap-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--primary))]" aria-hidden />
            <div className="min-w-0">
              <Text variant="caption" className="!m-0 text-[hsl(var(--text-secondary))]">
                This tab: Wii board and global channel tile defaults. Styling for side nav and reorder motion lives in{' '}
                <WeeHelpLinkButton type="button" className="!mt-0 inline" onClick={() => openSettingsToTab(SETTINGS_TAB_ID.NAVIGATION)}>
                  Navigation
                </WeeHelpLinkButton>{' '}
                and{' '}
                <WeeHelpLinkButton type="button" className="!mt-0 inline" onClick={() => openSettingsToTab(SETTINGS_TAB_ID.MOTION)}>
                  Motion
                </WeeHelpLinkButton>
                . Global sounds:{' '}
                <WeeHelpLinkButton type="button" className="!mt-0 inline" onClick={() => openSettingsToTab(SETTINGS_TAB_ID.SOUNDS)}>
                  Sounds
                </WeeHelpLinkButton>
                ; per-channel overrides in Configure Channel.
              </Text>
            </div>
          </div>
        </WeeSettingsCollapsibleSection>

        <WeeSettingsCollapsibleSection
          icon={Monitor}
          title="Visibility & playback"
          description="Empty-slot look, animated art, and grid auto-fade."
          defaultOpen
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

          <SettingsToggleFieldCard
            hoverAccent="none"
            titleClassName={TOGGLE_TITLE}
            title="Channel auto-fade"
            desc="After this many seconds with no pointer movement on the channel grid, tile opacity eases down so the wallpaper can show through. Moving the pointer on the grid or interacting again restores full opacity (a parked cursor alone will not keep tiles bright)."
            checked={(settings.autoFadeTimeout ?? 5) > 0}
            onChange={(checked) => {
              const value = checked ? 5 : 0;
              actions.setChannelSettings({ autoFadeTimeout: value });
            }}
          >
            {(settings.autoFadeTimeout ?? 5) > 0 ? (
              <div className="w-full min-w-0">
                <Text variant="p" className="!mb-2 !mt-0 font-medium text-[hsl(var(--text-primary))]">
                  Delay before fade: {settings.autoFadeTimeout ?? 5}s
                </Text>
                <Slider
                  value={settings.autoFadeTimeout ?? 5}
                  min={1}
                  max={30}
                  step={1}
                  onChange={handleChannelAutoFadeTimeoutChange}
                />
              </div>
            ) : null}
          </SettingsToggleFieldCard>
        </WeeSettingsCollapsibleSection>

        <WeeSettingsCollapsibleSection
          icon={Activity}
          title="Idle states"
          description="Subtle motion on tiles when you are not interacting."
          defaultOpen={false}
        >
          <SettingsToggleFieldCard
            hoverAccent="none"
            titleClassName={TOGGLE_TITLE}
            title="Subtle idle motion"
            desc="Tiles breathe and move when the system is inactive."
            checked={settings.idleAnimationEnabled ?? false}
            onChange={handleIdleAnimationEnabledChange}
          >
            {settings.idleAnimationEnabled ? (
              <>
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
              </>
            ) : null}
          </SettingsToggleFieldCard>
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
          >
            {settings.kenBurnsEnabled ? (
              <>
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
              </>
            ) : null}
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
