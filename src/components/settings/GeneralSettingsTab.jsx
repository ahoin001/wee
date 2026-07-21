import React, { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useUIState } from '../../utils/useConsolidatedAppHooks';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import WeeModalFieldCard from '../../ui/wee/WeeModalFieldCard';
import { WeeHelpLinkButton } from '../../ui/wee';
import SettingsToggleFieldCard from './SettingsToggleFieldCard';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import SettingsWeeSection from './SettingsWeeSection';

const GeneralSettingsTab = React.memo(() => {
  const ui = useConsolidatedAppStore(useShallow((state) => state.ui));
  const { setUIState } = useConsolidatedAppStore((state) => state.actions);
  const { confirmAction, openConfirmationModal } = useUIState();

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

  /** Notice dialog (single OK) — Wee replacement for native alert(). */
  const notifyDialog = useCallback(
    (title, message, confirmVariant = 'primary') => {
      openConfirmationModal({
        title,
        message,
        confirmText: 'OK',
        confirmVariant,
        hideCancel: true,
      });
    },
    [openConfirmationModal]
  );

  const runFreshInstall = useCallback(async () => {
    if (!window.api?.triggerFreshInstall) {
      notifyDialog(
        'Fresh install unavailable',
        'Fresh install feature not available. Please restart the app manually.'
      );
      return;
    }
    try {
      await window.api.triggerFreshInstall();
      openConfirmationModal({
        title: 'Fresh install complete',
        message:
          'The app will restart with a clean state. Your old data has been backed up.',
        confirmText: 'Restart now',
        hideCancel: true,
        onConfirm: () => window.location.reload(),
      });
    } catch (error) {
      notifyDialog('Fresh install failed', `Error during fresh install: ${error.message}`);
    }
  }, [notifyDialog, openConfirmationModal]);

  const handleFreshInstall = useCallback(() => {
    confirmAction(
      'Restore fresh install?',
      'This backs up your current data and gives you a clean start. Your old data will be preserved in a backup folder.',
      async () => {
        try {
          if (!window.api?.getFreshInstallInfo) {
            notifyDialog(
              'Fresh install unavailable',
              'Fresh install feature not available. Please restart the app manually.'
            );
            return;
          }
          const currentInfo = await window.api.getFreshInstallInfo();
          const backupLocation = currentInfo?.backupLocation;
          confirmAction(
            'Proceed with fresh install?',
            backupLocation
              ? `Your current data will be backed up to:<br /><strong>${backupLocation}</strong>`
              : 'Your current data will be backed up before the reset.',
            runFreshInstall,
            null,
            'Reset app',
            'danger-primary'
          );
        } catch (error) {
          notifyDialog('Fresh install failed', `Error during fresh install: ${error.message}`);
        }
      },
      null,
      'Continue',
      'danger-primary'
    );
  }, [confirmAction, notifyDialog, runFreshInstall]);

  const openPerformance = useCallback(() => {
    openSettingsToTab(SETTINGS_TAB_ID.PERFORMANCE);
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
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Performance">
        <WeeModalFieldCard hoverAccent="discovery" paddingClassName="p-6 md:p-8">
          <Text variant="h3" className="m-0 text-[hsl(var(--text-primary))]">
            Performance options
          </Text>
          <Text variant="desc" className="mt-1 block">
            Low power mode, pause-on-game-launch, atmosphere cost, and data caches live on the
            Performance tab.
          </Text>
          <WeeHelpLinkButton className="!mt-3" onClick={openPerformance}>
            Open Performance settings
          </WeeHelpLinkButton>
        </WeeModalFieldCard>
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-6 md:p-8">
          <Text variant="h3" className="m-0 text-[hsl(var(--text-primary))]">
            Data & caches
          </Text>
          <Text variant="desc" className="mt-1 block">
            Cache refresh and clear tools moved to Performance so load efficiency stays next to
            smoothness controls.
          </Text>
          <WeeHelpLinkButton className="!mt-3" onClick={openPerformance}>
            Open caches on Performance
          </WeeHelpLinkButton>
        </WeeModalFieldCard>
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
