import React from 'react';
import Text from '../../ui/Text';
import WeeModalFieldCard from '../../ui/wee/WeeModalFieldCard';

const AdvancedSettingsTab = React.memo(() => {
  return (
    <div className="mx-auto max-w-3xl">
      <WeeModalFieldCard className="text-center">
        <div className="text-5xl" aria-hidden>
          ⚙️
        </div>
        <Text variant="h3" className="mt-4">
          Advanced settings
        </Text>
        <Text variant="body" className="mt-2 text-[hsl(var(--text-secondary))]">
          Coming soon: performance tuning, debug options, and expert configurations.
        </Text>
      </WeeModalFieldCard>
    </div>
  );
});

AdvancedSettingsTab.displayName = 'AdvancedSettingsTab';

export default AdvancedSettingsTab; 