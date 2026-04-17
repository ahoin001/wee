import React, { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Activity, Aperture, Info, LayoutGrid, Monitor } from 'lucide-react';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import { WeeModalFieldCard, WeeSegmentedControl, WeeSectionEyebrow, WeeSettingsSection } from '../../ui/wee';
import SettingsToggleFieldCard from './SettingsToggleFieldCard';
import SettingsMultiToggleChips from './SettingsMultiToggleChips';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { WII_LAYOUT_PRESET } from '../../utils/channelLayoutSystem';
import { getChannelDataSlice } from '../../utils/channelSpaces';

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

const ChannelsLayoutSettingsTab = React.memo(() => {
  const channels = useConsolidatedAppStore((state) => state.channels);
  const ribbon = useConsolidatedAppStore((state) => state.ribbon);
  const activeSpaceId = useConsolidatedAppStore((state) => state.spaces.activeSpaceId);
  const lastChannelSpaceId = useConsolidatedAppStore((state) => state.spaces.lastChannelSpaceId);

  const actions = useConsolidatedAppStore(
    useShallow((state) => ({
      setChannelSettings: state.actions.setChannelSettings,
    }))
  );
  const settings = channels?.settings || {};
  const ribbonSettings = ribbon || {};

  const layoutSpaceKey = useMemo(() => {
    if (activeSpaceId === 'gamehub') {
      return lastChannelSpaceId === 'workspaces' ? 'workspaces' : 'home';
    }
    return activeSpaceId === 'workspaces' ? 'workspaces' : 'home';
  }, [activeSpaceId, lastChannelSpaceId]);

  const currentData = useMemo(
    () => getChannelDataSlice(channels, layoutSpaceKey),
    [channels, layoutSpaceKey]
  );
  const currentNavigation = currentData.navigation || {};
  const totalChannels =
    currentData.totalChannels ||
    WII_LAYOUT_PRESET.columns * WII_LAYOUT_PRESET.rows * WII_LAYOUT_PRESET.totalPages;
  const currentPage = currentNavigation.currentPage || 0;

  const adaptivePreviewStyle = useMemo(() => {
    const accentColor =
      ribbonSettings?.ribbonGlowColor || ribbonSettings?.ribbonColor || 'hsl(var(--primary))';

    return {
      background: `color-mix(in srgb, hsl(var(--surface-secondary)) 76%, ${accentColor} 24%)`,
      borderColor: `color-mix(in srgb, hsl(var(--border-primary)) 58%, ${accentColor} 42%)`,
      boxShadow: `0 0 0 2px color-mix(in srgb, transparent 72%, ${accentColor} 28%) inset`,
    };
  }, [ribbonSettings?.ribbonColor, ribbonSettings?.ribbonGlowColor]);

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
    <div className="mx-auto flex max-w-3xl flex-col">
      <header className="mb-10">
        <span className="mb-3 inline-flex rounded-full bg-[hsl(var(--primary))] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--text-on-accent))]">
          Wii engine v2
        </span>
        <h1 className="m-0 text-[clamp(1.45rem,4vw,2rem)] font-black uppercase italic leading-none tracking-tight text-[hsl(var(--text-primary))]">
          Channel & layout
        </h1>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--text-secondary))]">
          Structure, status, and tile motion
        </p>
      </header>

      <WeeSettingsSection
        icon={LayoutGrid}
        label="Layout & spaces"
        description="Fixed Wii grid, which space you are editing, and where related settings live."
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-5">
          <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
            Wii layout
          </WeeSectionEyebrow>
          <Text variant="desc" className="!mb-0 text-[hsl(var(--text-secondary))]">
            4 columns × 3 rows × 3 pages ({totalChannels} channels total). The strip keeps the classic Wii flow and a
            consistent performance profile across Home and Workspaces.
          </Text>
        </WeeModalFieldCard>

        <div>
          <WeeSectionEyebrow className="mb-3 block" trackingClassName="tracking-[0.14em]">
            Current space status
          </WeeSectionEyebrow>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4">
              <Text variant="caption" className="!mt-0 text-[hsl(var(--text-secondary))]">
                Editing space
              </Text>
              <Text variant="p" className="!mb-0 !mt-1 font-black uppercase tracking-wide text-[hsl(var(--text-primary))]">
                {layoutSpaceKey === 'workspaces' ? 'Workspaces' : 'Home'}
              </Text>
            </WeeModalFieldCard>
            <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4">
              <Text variant="caption" className="!mt-0 text-[hsl(var(--text-secondary))]">
                Current page
              </Text>
              <Text variant="p" className="!mb-0 !mt-1 font-black uppercase tracking-wide text-[hsl(var(--text-primary))]">
                {currentPage + 1} / {WII_LAYOUT_PRESET.totalPages}
              </Text>
            </WeeModalFieldCard>
          </div>
        </div>

        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-5">
          <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
            Settings boundaries
          </WeeSectionEyebrow>
          <Text variant="caption" className="!mt-0 text-[hsl(var(--text-secondary))]">
            • This tab: Wii board and global channel tile defaults
            <br />
            • Navigation: side-arrow icons, glass, and Spotify styling
            <br />
            • Motion: press, drag, and reorder feedback
            <br />• Sounds: global audio; per-channel overrides in Configure Channel
          </Text>
        </WeeModalFieldCard>
      </WeeSettingsSection>

      <WeeSettingsSection
        icon={Monitor}
        label="Visibility & playback"
        description="Empty-slot look, animated art, and grid auto-fade."
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
            <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
              Live adaptive preview
            </WeeSectionEyebrow>
            <div
              className="h-12 w-full rounded-[var(--radius-md)] border transition-colors duration-200"
              style={adaptivePreviewStyle}
              aria-hidden="true"
            />
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
          title="Channel auto-fade"
          desc="After the pointer leaves the channel grid, tile opacity eases down so the wallpaper can show through. Hover restores full opacity."
          checked={(settings.autoFadeTimeout ?? 5) > 0}
          onChange={(checked) => {
            const value = checked ? 5 : 0;
            actions.setChannelSettings({ autoFadeTimeout: value });
          }}
        >
          {(settings.autoFadeTimeout ?? 5) > 0 ? (
            <div className="mt-4 w-full min-w-0 border-t border-[hsl(var(--border-primary)/0.35)] pt-4">
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
      </WeeSettingsSection>

      <WeeSettingsSection
        icon={Activity}
        label="Idle states"
        description="Subtle motion on tiles when you are not interacting."
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
              <div className="mt-4 w-full min-w-0 border-t border-[hsl(var(--border-primary)/0.35)] pt-4">
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
              <div className="mt-4 w-full min-w-0">
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
      </WeeSettingsSection>

      <WeeSettingsSection
        icon={Aperture}
        label="Ken Burns"
        description="Cinematic zoom and pan on channel images."
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
              <div className="mt-4 w-full min-w-0 space-y-4 border-t border-[hsl(var(--border-primary)/0.35)] pt-4">
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
      </WeeSettingsSection>

      <footer className="mt-10 flex flex-wrap items-center gap-3 border-t border-[hsl(var(--border-primary)/0.35)] pt-6">
        <Info size={16} strokeWidth={2.25} className="shrink-0 text-[hsl(var(--wee-text-rail-muted))]" aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--wee-text-rail-muted))]">
          Settings sync automatically
        </span>
      </footer>
    </div>
  );
});

ChannelsLayoutSettingsTab.displayName = 'ChannelsLayoutSettingsTab';

export default ChannelsLayoutSettingsTab;
