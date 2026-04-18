import React, { useCallback } from 'react';
import Button from '../../ui/WButton';
import WeeModalFieldCard from '../../ui/wee/WeeModalFieldCard';
import SettingsTabPageHeader from './SettingsTabPageHeader';

const MonitorSettingsTab = React.memo(({ setShowMonitorModal }) => {
  const handleOpenMonitorSettings = useCallback(() => {
    setShowMonitorModal(true);
  }, [setShowMonitorModal]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-12">
      <SettingsTabPageHeader title="Monitor" subtitle="Multi-monitor settings" />

      <WeeModalFieldCard>
        <div className="flex flex-col gap-3">
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
