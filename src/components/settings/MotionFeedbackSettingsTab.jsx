import React, { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Anchor, AppWindow, Info, Layers, Rocket, Wand2, Zap } from 'lucide-react';
import Text from '../../ui/Text';
import Slider from '../../ui/Slider';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { mergeMotionFeedback } from '../../utils/motionFeedbackDefaults';
import { GOOEY_HOVER_MODES } from '../../design/gooeyPhysics';
import {
  WeeModalFieldCard,
  WeeRevealWhen,
  WeeSectionEyebrow,
  WeeSegmentedControl,
  WeeSettingsCollapsibleSection,
} from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import MotionToggleRow from './MotionToggleRow';
import './surfaceStyles.css';

const MotionFeedbackSettingsTab = React.memo(() => {
  const { setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      setUIState: state.actions.setUIState,
    }))
  );
  const raw = useConsolidatedAppStore((s) => s.ui.motionFeedback);
  const mf = useMemo(() => mergeMotionFeedback(raw), [raw]);

  const master = mf.master;

  const setMaster = useCallback(
    (checked) => {
      setUIState((prev) => ({
        motionFeedback: mergeMotionFeedback({
          ...mergeMotionFeedback(prev.motionFeedback),
          master: checked,
        }),
      }));
    },
    [setUIState]
  );

  const setLaunchFeedback = useCallback(
    (value) => {
      setUIState((prev) => ({
        motionFeedback: mergeMotionFeedback({
          ...mergeMotionFeedback(prev.motionFeedback),
          launch: value,
        }),
      }));
    },
    [setUIState]
  );

  const setDock = useCallback(
    (checked) => {
      setUIState((prev) => {
        const m = mergeMotionFeedback(prev.motionFeedback);
        return {
          motionFeedback: mergeMotionFeedback({
            ...m,
            dock: { ...m.dock, press: checked },
          }),
        };
      });
    },
    [setUIState]
  );

  const setRibbon = useCallback(
    (checked) => {
      setUIState((prev) => {
        const m = mergeMotionFeedback(prev.motionFeedback);
        return {
          motionFeedback: mergeMotionFeedback({
            ...m,
            ribbon: { ...m.ribbon, tap: checked },
          }),
        };
      });
    },
    [setUIState]
  );

  const setModal = useCallback(
    (key, checked) => {
      setUIState((prev) => {
        const m = mergeMotionFeedback(prev.motionFeedback);
        return {
          motionFeedback: mergeMotionFeedback({
            ...m,
            modals: { ...m.modals, [key]: checked },
          }),
        };
      });
    },
    [setUIState]
  );

  const setEffects = useCallback(
    (key, checked) => {
      setUIState((prev) => {
        const m = mergeMotionFeedback(prev.motionFeedback);
        return {
          motionFeedback: mergeMotionFeedback({
            ...m,
            effects: { ...m.effects, [key]: checked },
          }),
        };
      });
    },
    [setUIState]
  );

  const setGooey = useCallback(
    (patch) => {
      setUIState((prev) => {
        const m = mergeMotionFeedback(prev.motionFeedback);
        return {
          motionFeedback: mergeMotionFeedback({
            ...m,
            gooey: {
              ...m.gooey,
              ...patch,
              surfaces: {
                ...m.gooey.surfaces,
                ...(patch.surfaces || {}),
              },
            },
          }),
        };
      });
    },
    [setUIState]
  );

  return (
    <div className="motion-feedback-settings mx-auto flex max-w-4xl flex-col space-y-6 pb-12">
      <SettingsTabPageHeader
        title="Motion"
        subtitle="Press, drag & reorder feedback"
      />

      <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--surface-tertiary))] text-[hsl(var(--primary))]">
            <Info size={20} strokeWidth={2.4} aria-hidden />
          </div>
          <div className="min-w-0">
            <WeeSectionEyebrow className="mb-1 block" trackingClassName="tracking-[0.12em]">
              Accessibility
            </WeeSectionEyebrow>
            <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
              If the OS is set to <span className="font-semibold text-[hsl(var(--text-secondary))]">reduce motion</span>
              , Wee skips these animations regardless of the toggles below.
            </Text>
          </div>
        </div>
      </WeeModalFieldCard>

      <WeeSettingsCollapsibleSection
        icon={Zap}
        title="Global"
        description="Master switch for playful UI motion."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <MotionToggleRow
            title="Enable playful UI motion"
            description="When off, all interactive motion below is disabled. Does not change your OS setting."
            checked={master}
            onChange={setMaster}
          />
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeRevealWhen when={master}>
        <div className="flex flex-col gap-6">
      <WeeSettingsCollapsibleSection
        icon={Rocket}
        title="Launch feedback"
        description="Shell choreography while an app opens — never delays the launch itself."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <WeeSegmentedControl
            ariaLabel="Launch feedback choreography"
            value={mf.launch}
            onChange={setLaunchFeedback}
            options={[
              { value: 'off', label: 'Off' },
              { value: 'subtle', label: 'Subtle' },
              { value: 'cinematic', label: 'Cinematic' },
            ]}
          />
          <Text variant="caption" className="!mt-3 block text-[hsl(var(--text-tertiary))]">
            Subtle brightens the launched tile. Cinematic also recedes the rest of the board and
            softens the dock. Reduced motion keeps only the status pill.
          </Text>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Anchor}
        title="Wii dock"
        description="Classic dock bar — A/B buttons and SD card accessory."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <MotionToggleRow
            title="Dock press & hover motion"
            description="Spring scale and tilt on press; subtle hover lift on dock buttons and SD card."
            checked={mf.dock.press}
            onChange={setDock}
          />
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Layers}
        title="Ribbon bar"
        description="Time, presets, settings, and other top pill buttons."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <MotionToggleRow
            title="Ribbon button tap"
            description="Spring feedback when pressing ribbon pills (hover scale stays in Dock / Ribbon settings)."
            checked={mf.ribbon.tap}
            onChange={setRibbon}
          />
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={AppWindow}
        title="Modal choreography"
        description="Open/close feel, staged entrances, and transition weight."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <MotionToggleRow
            title="Spring open/close transitions"
            description="Spring-driven modal panel transitions instead of rigid timing curves."
            checked={mf.modals.springTransitions}
            onChange={(v) => setModal('springTransitions', v)}
          />
          <MotionToggleRow
            title="Staggered modal entrances"
            description="Sections fade/slide in with slight delay — top to bottom."
            checked={mf.modals.staggeredEntrance}
            onChange={(v) => setModal('staggeredEntrance', v)}
          />
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Wand2}
        title="Playful effects"
        description="Liquid highlights and icon micro-interactions."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <MotionToggleRow
            title="Gooey / liquid highlights"
            description="Soft liquid selection and highlight effects on active controls."
            checked={mf.effects.gooeyHighlights}
            onChange={(v) => setEffects('gooeyHighlights', v)}
          />
          <MotionToggleRow
            title="Icon tilt micro-interactions"
            description="Icons subtly lean on hover and press."
            checked={mf.effects.iconTilt}
            onChange={(v) => setEffects('iconTilt', v)}
          />
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeRevealWhen when={mf.effects.gooeyHighlights} keepMounted={false}>
      <WeeSettingsCollapsibleSection
        icon={Anchor}
        title="Gooey physics"
        description="Space-pill expand/shrink springs for modals, ribbon, and Media Hub — bounce amount per surface. Channel bounce lives under Channel & layout → Channel style."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6 space-y-5">
          <div>
            <Text variant="p" className="!mb-2 !mt-0 font-medium text-[hsl(var(--text-primary))]">
              Global bounce: {Math.round((mf.gooey?.intensity ?? 1) * 100)}%
            </Text>
            <Text variant="caption" className="!mb-2 block text-[hsl(var(--text-tertiary))]">
              100% matches the space rail pill. Lower values settle faster with less overshoot.
            </Text>
            <Slider
              value={Math.round((mf.gooey?.intensity ?? 1) * 100)}
              min={0}
              max={100}
              step={5}
              hideValue
              aria-label="Global gooey bounce intensity"
              onChange={(v) => setGooey({ intensity: v / 100 })}
            />
          </div>
          <div>
            <Text variant="p" className="!mb-2 !mt-0 font-medium text-[hsl(var(--text-primary))]">
              Modals: {Math.round((mf.gooey?.surfaces?.modals ?? 1) * 100)}%
            </Text>
            <Slider
              value={Math.round((mf.gooey?.surfaces?.modals ?? 1) * 100)}
              min={0}
              max={100}
              step={5}
              hideValue
              aria-label="Modal gooey intensity"
              onChange={(v) => setGooey({ surfaces: { modals: v / 100 } })}
            />
          </div>
          <div>
            <Text variant="p" className="!mb-2 !mt-0 font-medium text-[hsl(var(--text-primary))]">
              Ribbon buttons: {Math.round((mf.gooey?.surfaces?.ribbon ?? 1) * 100)}%
            </Text>
            <Slider
              value={Math.round((mf.gooey?.surfaces?.ribbon ?? 1) * 100)}
              min={0}
              max={100}
              step={5}
              hideValue
              aria-label="Ribbon gooey intensity"
              onChange={(v) => setGooey({ surfaces: { ribbon: v / 100 } })}
            />
          </div>
          <div>
            <Text variant="p" className="!mb-2 !mt-0 font-medium text-[hsl(var(--text-primary))]">
              Media Hub: {Math.round((mf.gooey?.surfaces?.mediaHub ?? 1) * 100)}%
            </Text>
            <Slider
              value={Math.round((mf.gooey?.surfaces?.mediaHub ?? 1) * 100)}
              min={0}
              max={100}
              step={5}
              hideValue
              aria-label="Media Hub gooey intensity"
              onChange={(v) => setGooey({ surfaces: { mediaHub: v / 100 } })}
            />
          </div>
          <div>
            <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.12em]">
              Ribbon hover style
            </WeeSectionEyebrow>
            <WeeSegmentedControl
              ariaLabel="Ribbon floating button hover style"
              value={mf.gooey?.ribbonHoverMode ?? GOOEY_HOVER_MODES.both}
              onChange={(value) => setGooey({ ribbonHoverMode: value })}
              options={[
                { value: GOOEY_HOVER_MODES.squash, label: 'Squash' },
                { value: GOOEY_HOVER_MODES.glow, label: 'Glow' },
                { value: GOOEY_HOVER_MODES.both, label: 'Both' },
              ]}
            />
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>
      </WeeRevealWhen>
        </div>
      </WeeRevealWhen>
    </div>
  );
});

MotionFeedbackSettingsTab.displayName = 'MotionFeedbackSettingsTab';

export default MotionFeedbackSettingsTab;
