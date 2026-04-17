import React, { useCallback } from 'react';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import WeeModalFieldCard from '../../ui/wee/WeeModalFieldCard';

const MonitorSettingsTab = React.memo(({ setShowMonitorModal }) => {
  const handleOpenMonitorSettings = useCallback(() => {
    setShowMonitorModal(true);
  }, [setShowMonitorModal]);

  return (
    <div className="mx-auto max-w-3xl">
      <WeeModalFieldCard>
        <Text variant="h3" className="m-0">
          Monitor settings
        </Text>
        <Text variant="body" className="mt-2 text-[hsl(var(--text-secondary))]">
          Configure which monitor the launcher appears on and manage multi-monitor preferences.
        </Text>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="secondary" onClick={handleOpenMonitorSettings} className="w-full sm:w-auto">
            Open monitor settings
          </Button>
          <div className="rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] p-3 text-[13px] text-[hsl(var(--text-secondary))]">
            <strong className="text-[hsl(var(--text-primary))]">Tip:</strong> Choose which display the launcher uses
            (primary, secondary, or remember last choice).
          </div>
        </div>
      </WeeModalFieldCard>
    </div>
  );
});

MonitorSettingsTab.displayName = 'MonitorSettingsTab';

export default MonitorSettingsTab;
