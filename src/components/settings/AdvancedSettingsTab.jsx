import React from 'react';
import Text from '../../ui/Text';
import WeeModalFieldCard from '../../ui/wee/WeeModalFieldCard';
import SettingsTabPageHeader from './SettingsTabPageHeader';

const AdvancedSettingsTab = React.memo(() => {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-12">
      <SettingsTabPageHeader
        title="Advanced"
        subtitle="Performance tuning, debug options, and expert configurations"
      />

      <WeeModalFieldCard className="text-center">
        <div className="text-5xl" aria-hidden>
          ⚙️
        </div>
        <Text variant="h3" className="mt-4">
          Coming soon
        </Text>
        <Text variant="body" className="mt-2 text-[hsl(var(--text-secondary))]">
          This area will host expert-only toggles and diagnostics.
        </Text>
      </WeeModalFieldCard>
    </div>
  );
});

AdvancedSettingsTab.displayName = 'AdvancedSettingsTab';

export default AdvancedSettingsTab; 