import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Info, MousePointer2, Pin, Keyboard } from 'lucide-react';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { WeeModalFieldCard, WeeSettingsCollapsibleSection } from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import './surfaceStyles.css';

function PillToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-[hsl(var(--border-primary)/0.35)] py-3 last:border-b-0">
      <div className="min-w-0">
        <Text
          variant="body"
          className="text-[0.8125rem] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]"
        >
          {title}
        </Text>
        <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
          {description}
        </Text>
      </div>
      <div className="flex shrink-0 items-center justify-end">
        <WToggle checked={checked} onChange={onChange} disableLabelClick />
      </div>
    </div>
  );
}

const NavigationPillSettingsTab = React.memo(() => {
  const { autoHideRail, railPinned, setSpacesState } = useConsolidatedAppStore(
    useShallow((state) => ({
      autoHideRail: state.spaces.autoHideRail,
      railPinned: state.spaces.railPinned,
      setSpacesState: state.actions.setSpacesState,
    }))
  );

  const setAutoHideRail = useCallback(
    (checked) => {
      setSpacesState({
        autoHideRail: checked,
        railVisible: checked ? false : true,
      });
    },
    [setSpacesState]
  );

  const setRailPinned = useCallback(
    (checked) => {
      setSpacesState({
        railPinned: checked,
        railVisible: true,
      });
    },
    [setSpacesState]
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-6 pb-12">
      <SettingsTabPageHeader
        title="Navigation Pill"
        subtitle="Space rail visibility, edge reveal, and pinning behavior"
      />

      <WeeSettingsCollapsibleSection
        icon={MousePointer2}
        title="Visibility behavior"
        description="Choose whether the space rail hides to the edge or stays visible."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <PillToggleRow
            title="Auto-hide rail"
            description="Hide when idle and reveal from the left edge hotspot."
            checked={autoHideRail ?? true}
            onChange={setAutoHideRail}
          />
          <PillToggleRow
            title="Pin rail"
            description="Keep the rail visible at all times in compact mode."
            checked={railPinned ?? false}
            onChange={setRailPinned}
          />
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Keyboard}
        title="Shortcuts"
        description="Keyboard access to pinning and reveal workflows."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <div className="flex items-start gap-3 rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.55)] p-4">
            <Pin size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" aria-hidden />
            <div className="min-w-0">
              <Text variant="body" className="!mb-1 text-[0.8rem] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]">
                Toggle pin shortcut
              </Text>
              <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                Default shortcut is <span className="font-semibold text-[hsl(var(--text-secondary))]">Ctrl + Shift + R</span>. You can rebind it in the Shortcuts tab.
              </Text>
            </div>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-5">
        <div className="flex gap-3">
          <Info size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-[hsl(var(--wee-text-rail-muted))]" aria-hidden />
          <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
            Auto-hide + unpinned gives the lowest visual noise. Pinning is useful for frequent drag reorder sessions.
          </Text>
        </div>
      </WeeModalFieldCard>
    </div>
  );
});

NavigationPillSettingsTab.displayName = 'NavigationPillSettingsTab';

export default NavigationPillSettingsTab;
