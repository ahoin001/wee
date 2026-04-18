import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { Anchor, AppWindow, Info, LayoutGrid, Layers, Wand2, Zap } from 'lucide-react';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { mergeMotionFeedback } from '../../utils/motionFeedbackDefaults';
import {
  WeeModalFieldCard,
  WeeSectionEyebrow,
  WeeSettingsCollapsibleSection,
} from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import './surfaceStyles.css';

function MotionToggleRow({ title, description, checked, onChange, disabled }) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-[hsl(var(--border-primary)/0.35)] py-3 last:border-b-0 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <div className="min-w-0">
        <Text
          variant="body"
          className="text-[0.8125rem] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]"
        >
          {title}
        </Text>
        {description ? (
          <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
            {description}
          </Text>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-end">
        <WToggle checked={checked} onChange={onChange} disabled={disabled} disableLabelClick />
      </div>
    </div>
  );
}

MotionToggleRow.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

MotionToggleRow.defaultProps = {
  description: null,
  disabled: false,
};

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

  const setChannel = useCallback(
    (key, checked) => {
      setUIState((prev) => {
        const m = mergeMotionFeedback(prev.motionFeedback);
        return {
          motionFeedback: mergeMotionFeedback({
            ...m,
            channels: { ...m.channels, [key]: checked },
          }),
        };
      });
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

      <WeeSettingsCollapsibleSection
        icon={LayoutGrid}
        title="Channels & grid"
        description="Launch tiles, drag preview, slots, and reorder feedback."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <MotionToggleRow
            title="Tap / press on channels"
            description="Spring squash when you click a channel tile to launch."
            checked={mf.channels.tap}
            onChange={(v) => setChannel('tap', v)}
            disabled={!master}
          />
          <MotionToggleRow
            title="Drag preview"
            description="Lifted, tilted floating preview while dragging a channel."
            checked={mf.channels.dragPreview}
            onChange={(v) => setChannel('dragPreview', v)}
            disabled={!master}
          />
          <MotionToggleRow
            title="Drop target highlight"
            description="Slot glows when you drag over a valid drop target."
            checked={mf.channels.dropTarget}
            onChange={(v) => setChannel('dropTarget', v)}
            disabled={!master}
          />
          <MotionToggleRow
            title="Reorder sparkles"
            description="Particle burst when you pick up a tile and when you drop it."
            checked={mf.channels.reorderParticles}
            onChange={(v) => setChannel('reorderParticles', v)}
            disabled={!master}
          />
          <MotionToggleRow
            title="Reorder slot motion"
            description="Tiles wobble and settle after a reorder; includes drop celebration on the moved tile."
            checked={mf.channels.reorderSlotMotion}
            onChange={(v) => setChannel('reorderSlotMotion', v)}
            disabled={!master}
          />
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
            disabled={!master}
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
            disabled={!master}
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
            disabled={!master}
          />
          <MotionToggleRow
            title="Staggered modal entrances"
            description="Sections fade/slide in with slight delay — top to bottom."
            checked={mf.modals.staggeredEntrance}
            onChange={(v) => setModal('staggeredEntrance', v)}
            disabled={!master}
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
            disabled={!master}
          />
          <MotionToggleRow
            title="Icon tilt micro-interactions"
            description="Icons subtly lean on hover and press."
            checked={mf.effects.iconTilt}
            onChange={(v) => setEffects('iconTilt', v)}
            disabled={!master}
          />
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>
    </div>
  );
});

MotionFeedbackSettingsTab.displayName = 'MotionFeedbackSettingsTab';

export default MotionFeedbackSettingsTab;
