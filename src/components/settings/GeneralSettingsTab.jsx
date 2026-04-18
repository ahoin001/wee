import React, { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import WeeModalFieldCard from '../../ui/wee/WeeModalFieldCard';
import SettingsToggleFieldCard from './SettingsToggleFieldCard';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import SettingsWeeSection from './SettingsWeeSection';

const GeneralSettingsTab = React.memo(() => {
  const ui = useConsolidatedAppStore(useShallow((state) => state.ui));
  const { setUIState } = useConsolidatedAppStore((state) => state.actions);

  useEffect(() => {
    const loadInitialState = async () => {
      try {
        if (window.api?.getAutoLaunch) {
          const isAutoLaunchEnabled = await window.api.getAutoLaunch();
          setUIState({ startOnBoot: isAutoLaunchEnabled });
        }
      } catch (error) {
        console.error('[GeneralSettingsTab] Failed to load initial state:', error);
      }
    };

    loadInitialState();
  }, [setUIState]);

  const handleImmersivePipChange = useCallback(
    (checked) => {
      setUIState({ immersivePip: checked });
    },
    [setUIState]
  );

  const handleStartInFullscreenChange = useCallback(
    async (checked) => {
      setUIState({ startInFullscreen: checked });
    },
    [setUIState]
  );

  const handleShowPresetsButtonChange = useCallback(
    (checked) => {
      setUIState({ showPresetsButton: checked });
    },
    [setUIState]
  );

  const handleShowDockChange = useCallback(
    (checked) => {
      setUIState({ showDock: checked });
    },
    [setUIState]
  );

  const handleStartOnBootChange = useCallback(
    async (checked) => {
      try {
        if (window.api?.setAutoLaunch) {
          await window.api.setAutoLaunch(checked);
        }
        setUIState({ startOnBoot: checked });
      } catch (error) {
        console.error('[GeneralSettingsTab] Failed to update auto-launch setting:', error);
      }
    },
    [setUIState]
  );

  const handleLowPowerModeChange = useCallback(
    (checked) => {
      setUIState({ lowPowerMode: checked });
    },
    [setUIState]
  );

  const handleFreshInstall = useCallback(async () => {
    if (
      window.confirm(
        'Are you sure you want to restore to a fresh install? This will backup your current data and give you a clean start. Your old data will be preserved in a backup folder.'
      )
    ) {
      try {
        if (window.api && window.api.getFreshInstallInfo) {
          const currentInfo = await window.api.getFreshInstallInfo();
          const backupLocation = currentInfo.backupLocation;
          const confirmMessage = backupLocation
            ? `Your current data will be backed up to:\n${backupLocation}\n\nProceed with fresh install?`
            : 'Proceed with fresh install?';

          if (window.confirm(confirmMessage)) {
            if (window.api && window.api.triggerFreshInstall) {
              await window.api.triggerFreshInstall();
              alert(
                'Fresh install completed! The app will restart with a clean state. Your old data has been backed up.'
              );
              window.location.reload();
            } else {
              alert('Fresh install feature not available. Please restart the app manually.');
            }
          }
        } else {
          alert('Fresh install feature not available. Please restart the app manually.');
        }
      } catch (error) {
        alert(`Error during fresh install: ${error.message}`);
      }
    }
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 pb-12">
      <SettingsTabPageHeader title="General" subtitle="App behavior & startup" />

      <SettingsWeeSection eyebrow="Display & behavior">
        <SettingsToggleFieldCard
          title="Immersive Picture in Picture mode"
          desc="When enabled, video overlays will use immersive PiP mode for a more cinematic experience."
          checked={ui.immersivePip ?? false}
          onChange={handleImmersivePipChange}
        />
        <SettingsToggleFieldCard
          title="Start in fullscreen"
          desc="When enabled, the app will start in fullscreen mode. When disabled, it will start in windowed mode."
          checked={ui.startInFullscreen ?? false}
          onChange={handleStartInFullscreenChange}
        />
        <SettingsToggleFieldCard
          title="Show presets button"
          desc="When enabled, shows a presets button near the time display that allows quick access to saved appearance presets. Right-click the button to customize its icon."
          checked={ui.showPresetsButton ?? true}
          onChange={handleShowPresetsButtonChange}
        />
        <SettingsToggleFieldCard
          title="Show dock"
          desc="When enabled, shows the dock at the bottom of the screen. When disabled, the dock will be hidden."
          checked={ui.showDock ?? true}
          onChange={handleShowDockChange}
        />
        <SettingsToggleFieldCard
          title="Low power mode"
          desc="Reduces background polling and animation cadence to keep CPU/GPU usage lower while the app is idle or running in the background."
          checked={ui.lowPowerMode ?? false}
          onChange={handleLowPowerModeChange}
        />
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Startup">
        <SettingsToggleFieldCard
          title="Launch app when my computer starts"
          desc="When enabled, the app will launch automatically when your computer starts."
          checked={ui.startOnBoot ?? false}
          onChange={handleStartOnBootChange}
        />
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Danger zone">
        <WeeModalFieldCard hoverAccent="discovery" className="p-0 overflow-hidden" paddingClassName="p-0">
          <div className="p-6 md:p-8">
            <Text variant="h3" className="m-0 text-[hsl(var(--text-primary))]">
              Restore fresh install
            </Text>
            <Text variant="desc" className="mt-1 block">
              If you are experiencing issues, you can restore to a fresh state. This backs up your current data and
              gives you a clean start.
            </Text>
            <div className="mt-6">
              <Button variant="danger-primary" onClick={handleFreshInstall} className="w-full sm:w-auto">
                Restore fresh install
              </Button>
              <Text variant="caption" className="mt-3 block rounded-[var(--wee-radius-rail-item)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] p-3">
                Warning: this resets settings, wallpapers, sounds, and channel configuration to defaults. Your previous
                data is preserved in a backup folder when possible.
              </Text>
            </div>
          </div>
        </WeeModalFieldCard>
      </SettingsWeeSection>
    </div>
  );
});

GeneralSettingsTab.displayName = 'GeneralSettingsTab';

export default GeneralSettingsTab;
