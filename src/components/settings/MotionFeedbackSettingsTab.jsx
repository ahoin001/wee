import React, { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { mergeMotionFeedback } from '../../utils/motionFeedbackDefaults';

const Row = React.memo(({ label, description, checked, onChange, disabled }) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4 py-3 border-b border-[hsl(var(--border-primary))] last:border-0 border-opacity-60">
    <div className="min-w-0 flex-1">
      <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
        {label}
      </Text>
      <Text variant="small" className="text-[hsl(var(--text-secondary))] mt-0.5 block">
        {description}
      </Text>
    </div>
    <div className="flex-shrink-0 pt-0.5">
      <WToggle checked={checked} onChange={onChange} disabled={disabled} disableLabelClick />
    </div>
  </div>
));

Row.displayName = 'MotionFeedbackRow';

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

  return (
    <div className="motion-feedback-settings max-w-3xl">
      <div className="mb-6">
        <Text variant="h2" className="text-[hsl(var(--text-primary))] mb-2">
          Motion & feedback
        </Text>
        <Text variant="body" className="text-[hsl(var(--text-secondary))]">
          Control playful spring animations (press, drag, reorder feedback) in one place. Channel idle animations and
          sounds are configured elsewhere.
        </Text>
      </div>

      <div className="rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] p-4 mb-4">
        <Text variant="h3" className="text-[hsl(var(--text-primary))] mb-2">
          Accessibility
        </Text>
        <Text variant="small" className="text-[hsl(var(--text-secondary))] block">
          If your OS is set to <strong>reduce motion</strong>, Wee will also skip these animations regardless of the
          toggles below.
        </Text>
      </div>

      <Card variant="default" className="mb-4 !p-0 overflow-hidden border border-[hsl(var(--border-primary))]">
        <div className="bg-[hsl(var(--surface-secondary))] px-4 py-3 border-b border-[hsl(var(--border-primary))]">
          <Text variant="h3" className="text-[hsl(var(--text-primary))]">
            Global
          </Text>
          <Text variant="small" className="text-[hsl(var(--text-secondary))] mt-0.5 block">
            Master switch for playful UI motion.
          </Text>
        </div>
        <div className="px-4">
          <Row
            label="Enable playful UI motion"
            description="When off, all interactive motion below is disabled. Does not change your OS setting."
            checked={master}
            onChange={setMaster}
          />
        </div>
      </Card>

      <Card variant="default" className="mb-4 !p-0 overflow-hidden border border-[hsl(var(--border-primary))]">
        <div className="bg-[hsl(var(--surface-secondary))] px-4 py-3 border-b border-[hsl(var(--border-primary))]">
          <Text variant="h3" className="text-[hsl(var(--text-primary))]">
            Channels & grid
          </Text>
          <Text variant="small" className="text-[hsl(var(--text-secondary))] mt-0.5 block">
            Launch tiles, drag-and-drop reorder, and slot feedback.
          </Text>
        </div>
        <div className="px-4">
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
        </div>
      </Card>

      <Card variant="default" className="mb-4 !p-0 overflow-hidden border border-[hsl(var(--border-primary))]">
        <div className="bg-[hsl(var(--surface-secondary))] px-4 py-3 border-b border-[hsl(var(--border-primary))]">
          <Text variant="h3" className="text-[hsl(var(--text-primary))]">
            Wii dock
          </Text>
          <Text variant="small" className="text-[hsl(var(--text-secondary))] mt-0.5 block">
            Classic dock bar: A/B buttons and SD card accessory.
          </Text>
        </div>
        <div className="px-4">
          <Row
            label="Dock press & hover motion"
            description="Spring scale and tilt on press; subtle hover lift on dock buttons and SD card."
            checked={mf.dock.press}
            onChange={setDock}
            disabled={!master}
          />
        </div>
      </Card>

      <Card variant="default" className="mb-4 !p-0 overflow-hidden border border-[hsl(var(--border-primary))]">
        <div className="bg-[hsl(var(--surface-secondary))] px-4 py-3 border-b border-[hsl(var(--border-primary))]">
          <Text variant="h3" className="text-[hsl(var(--text-primary))]">
            Ribbon bar
          </Text>
          <Text variant="small" className="text-[hsl(var(--text-secondary))] mt-0.5 block">
            Top bar: time, presets, settings, and other pill buttons.
          </Text>
        </div>
        <div className="px-4">
          <Row
            label="Ribbon button tap"
            description="Spring feedback when pressing ribbon pills (hover scale stays in Dock / Ribbon settings)."
            checked={mf.ribbon.tap}
            onChange={setRibbon}
            disabled={!master}
          />
        </div>
      </Card>
    </div>
  );
});

MotionFeedbackSettingsTab.displayName = 'MotionFeedbackSettingsTab';

export default MotionFeedbackSettingsTab;
