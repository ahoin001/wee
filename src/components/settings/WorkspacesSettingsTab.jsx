import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import SettingsToggleFieldCard from './SettingsToggleFieldCard';
import SettingsWeeSection from './SettingsWeeSection';
import Text from '../../ui/Text';
import { WeeModalFieldCard } from '../../ui/wee';
import './surfaceStyles.css';

/**
 * Shell settings — Media Hub rail opt-in.
 * Home setups / scene snapshots were removed: Home + Focus boards (with pages) are the live capacity.
 * Visual vibes live under Looks; Atmosphere Color Match lives in the Quick menu.
 */
const WorkspacesSettingsTab = React.memo(() => {
  const { mediaHubEnabled, setSpacesState } = useConsolidatedAppStore(
    useShallow((state) => ({
      mediaHubEnabled: state.spaces.mediaHubEnabled === true,
      setSpacesState: state.actions.setSpacesState,
    }))
  );

  return (
    <div className="surface-stack mx-auto flex max-w-4xl flex-col space-y-8 pb-12">
      <SettingsTabPageHeader
        title="Shell"
        subtitle="Space rail options — Home and Focus boards live on the rail"
      />

      <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-5">
        <Text variant="desc" className="!m-0 text-[hsl(var(--text-secondary))]">
          Use Home and Focus for separate channel grids (each with pages). Save visual vibes under{' '}
          <span className="font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]">
            Looks
          </span>
          . Color Match toggles live in the{' '}
          <span className="font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]">
            Quick menu
          </span>
          .
        </Text>
      </WeeModalFieldCard>

      <SettingsWeeSection eyebrow="Space rail">
        <SettingsToggleFieldCard
          title="Show Media Hub"
          desc="Add Media Hub to the left space rail between Focus and Game Hub. Turn off to keep the shell leaner."
          checked={mediaHubEnabled}
          onChange={(checked) => setSpacesState({ mediaHubEnabled: checked })}
        />
      </SettingsWeeSection>
    </div>
  );
});

WorkspacesSettingsTab.displayName = 'WorkspacesSettingsTab';

export default WorkspacesSettingsTab;
