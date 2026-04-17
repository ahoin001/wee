import React, { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { mergeMotionFeedback } from '../../utils/motionFeedbackDefaults';
import WeeModalFieldCard from '../../ui/wee/WeeModalFieldCard';
import SettingsWeeSection from './SettingsWeeSection';

const Row = React.memo(({ label, description, checked, onChange, disabled }) => {
  const toggle = useCallback(() => {
    if (!disabled) onChange(!checked);
  }, [checked, disabled, onChange]);

  const onKeyDown = useCallback(
    (e) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(!checked);
      }
    },
    [checked, disabled, onChange]
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={toggle}
      onKeyDown={onKeyDown}
      className={`flex flex-col gap-1 border-b border-[hsl(var(--border-primary))] border-opacity-60 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-[hsl(var(--state-hover)/0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
          {label}
        </Text>
        <Text variant="small" className="mt-0.5 block text-[hsl(var(--text-secondary))]">
          {description}
        </Text>
      </div>
      <div
        className="flex-shrink-0 pt-0.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <WToggle checked={checked} onChange={onChange} disabled={disabled} disableLabelClick />
      </div>
    </div>
  );
});

Row.displayName = 'MotionFeedbackRow';

function MotionSectionCard({ title, subtitle, children }) {
  return (
    <WeeModalFieldCard className="p-0 overflow-hidden" paddingClassName="p-0">
      <div className="border-b border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-4 py-3 md:px-6">
        <Text variant="h3" className="text-[hsl(var(--text-primary))]">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" className="mt-0.5 block text-[hsl(var(--text-secondary))]">
            {subtitle}
          </Text>
        ) : null}
      </div>
      <div className="px-4 pb-2 md:px-6">{children}</div>
    </WeeModalFieldCard>
  );
}

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
    <div className="motion-feedback-settings max-w-3xl space-y-8">
      <div>
        <Text variant="h2" className="mb-2 text-[hsl(var(--text-primary))]">
          Motion & feedback
        </Text>
        <Text variant="body" className="text-[hsl(var(--text-secondary))]">
          Control playful spring animations (press, drag, reorder feedback). Channel media behavior defaults are in
          Channels & layout settings, and audio behavior is in Sounds settings.
        </Text>
      </div>

      <WeeModalFieldCard>
        <Text variant="h3" className="text-[hsl(var(--text-primary))]">
          Accessibility
        </Text>
        <Text variant="small" className="mt-2 block text-[hsl(var(--text-secondary))]">
          If your OS is set to <strong>reduce motion</strong>, Wee will also skip these animations regardless of the
          toggles below.
        </Text>
      </WeeModalFieldCard>

      <SettingsWeeSection eyebrow="Global">
        <MotionSectionCard title="Global" subtitle="Master switch for playful UI motion.">
          <Row
            label="Enable playful UI motion"
            description="When off, all interactive motion below is disabled. Does not change your OS setting."
            checked={master}
            onChange={setMaster}
          />
        </MotionSectionCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Channels & grid">
        <MotionSectionCard
          title="Channels & grid"
          subtitle="Launch tiles, drag-and-drop reorder, and slot feedback."
        >
          <Row
            label="Tap / press on channels"
            description="Spring squash when you click a channel tile to launch."
            checked={mf.channels.tap}
            onChange={(v) => setChannel('tap', v)}
            disabled={!master}
          />
          <Row
            label="Drag preview"
            description="Lifted, tilted floating preview while dragging a channel."
            checked={mf.channels.dragPreview}
            onChange={(v) => setChannel('dragPreview', v)}
            disabled={!master}
          />
          <Row
            label="Drop target highlight"
            description="Slot glows when you drag a channel over a valid drop target."
            checked={mf.channels.dropTarget}
            onChange={(v) => setChannel('dropTarget', v)}
            disabled={!master}
          />
          <Row
            label="Reorder sparkles"
            description="Particle burst when you pick up a tile and when you drop it."
            checked={mf.channels.reorderParticles}
            onChange={(v) => setChannel('reorderParticles', v)}
            disabled={!master}
          />
          <Row
            label="Reorder slot motion"
            description="Tiles wobble and settle after a reorder; includes the drop celebration on the moved tile."
            checked={mf.channels.reorderSlotMotion}
            onChange={(v) => setChannel('reorderSlotMotion', v)}
            disabled={!master}
          />
        </MotionSectionCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Wii dock">
        <MotionSectionCard title="Wii dock" subtitle="Classic dock bar: A/B buttons and SD card accessory.">
          <Row
            label="Dock press & hover motion"
            description="Spring scale and tilt on press; subtle hover lift on dock buttons and SD card."
            checked={mf.dock.press}
            onChange={setDock}
            disabled={!master}
          />
        </MotionSectionCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Ribbon bar">
        <MotionSectionCard title="Ribbon bar" subtitle="Top bar: time, presets, settings, and other pill buttons.">
          <Row
            label="Ribbon button tap"
            description="Spring feedback when pressing ribbon pills (hover scale stays in Dock / Ribbon settings)."
            checked={mf.ribbon.tap}
            onChange={setRibbon}
            disabled={!master}
          />
        </MotionSectionCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Modal choreography">
        <MotionSectionCard title="Modal choreography" subtitle="Open/close feel, staged entrances, and transition weight.">
          <Row
            label="Spring open/close transitions"
            description="Uses spring-driven modal panel transitions instead of rigid timing curves."
            checked={mf.modals.springTransitions}
            onChange={(v) => setModal('springTransitions', v)}
            disabled={!master}
          />
          <Row
            label="Staggered modal entrances"
            description="Modal sections fade/slide in with slight delay to guide focus top-to-bottom."
            checked={mf.modals.staggeredEntrance}
            onChange={(v) => setModal('staggeredEntrance', v)}
            disabled={!master}
          />
        </MotionSectionCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Playful effects">
        <MotionSectionCard title="Playful effects" subtitle="Liquid highlights and icon character details.">
          <Row
            label="Gooey / liquid highlights"
            description="Enable soft liquid selection/highlight effects on active controls."
            checked={mf.effects.gooeyHighlights}
            onChange={(v) => setEffects('gooeyHighlights', v)}
            disabled={!master}
          />
          <Row
            label="Icon tilt micro-interactions"
            description="Icons subtly lean on hover and press for tactile feedback."
            checked={mf.effects.iconTilt}
            onChange={(v) => setEffects('iconTilt', v)}
            disabled={!master}
          />
        </MotionSectionCard>
      </SettingsWeeSection>
    </div>
  );
});

MotionFeedbackSettingsTab.displayName = 'MotionFeedbackSettingsTab';

export default MotionFeedbackSettingsTab;
