import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { GraduationCap, ImageIcon } from 'lucide-react';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WButton from '../../ui/WButton';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import {
  WeeHelpLinkButton,
  WeeModalFieldCard,
  WeeSettingsCollapsibleSection,
} from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import './surfaceStyles.css';

/** Label + optional caption | control — matches dock / ribbon settings rhythm */
function HubToggleRow({ title, description, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
      <div className="min-w-0">
        {typeof title === 'string' ? (
          <Text
            variant="body"
            className="text-[0.8125rem] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]"
          >
            {title}
          </Text>
        ) : (
          title
        )}
        {description ? (
          <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
            {description}
          </Text>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-end">{children}</div>
    </div>
  );
}

HubToggleRow.propTypes = {
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  children: PropTypes.node.isRequired,
};

const GameHubSettingsTab = React.memo(() => {
  const { ui } = useConsolidatedAppStore(
    useShallow((state) => ({
      ui: state.gameHub?.ui || {},
    }))
  );
  const setGameHubState = useConsolidatedAppStore((state) => state.actions.setGameHubState);

  const handleResetOnboarding = useCallback(() => {
    setGameHubState({
      profile: {
        onboardingDismissed: false,
      },
    });
  }, [setGameHubState]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-6 pb-12">
      <SettingsTabPageHeader
        title="Game Hub"
        subtitle="Hub visuals, onboarding, and library experience"
      />

      <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-5">
        <Text variant="desc" className="!m-0 text-[hsl(var(--text-secondary))]">
          Steam account setup (SteamID64), Web API enrichment, and sync status live under{' '}
          <WeeHelpLinkButton
            type="button"
            className="!mt-0 inline"
            onClick={() => openSettingsToTab(SETTINGS_TAB_ID.API_INTEGRATIONS)}
          >
            API &amp; Widgets
          </WeeHelpLinkButton>
          .
        </Text>
      </WeeModalFieldCard>

      <WeeSettingsCollapsibleSection
        icon={ImageIcon}
        title="Hub visuals"
        description="Backdrop and motion — only apply inside the Game Hub space."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <div className="space-y-5">
            <HubToggleRow
              title="Show hub backdrop"
              description="Layers Game Hub artwork over your existing app wallpaper."
            >
              <WToggle
                checked={ui.showHubBackdrop ?? false}
                onChange={(checked) => setGameHubState({ ui: { showHubBackdrop: checked } })}
                disableLabelClick
              />
            </HubToggleRow>
            <div className="border-t border-[hsl(var(--border-primary)/0.35)] pt-5">
              <HubToggleRow
                title="Enhanced effects & animations"
                description="Hover lift, stack transitions, and launch bursts. Turn off to save resources."
              >
                <WToggle
                  checked={ui.effectsEnabled ?? true}
                  onChange={(checked) => setGameHubState({ ui: { effectsEnabled: checked } })}
                  disableLabelClick
                />
              </HubToggleRow>
            </div>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={GraduationCap}
        title="Onboarding"
        description="Bring back the Steam connection prompt if you dismissed it."
        defaultOpen={false}
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <div className="space-y-3">
            <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
              Resets the dismissal flag so the hub can ask you to connect Steam again. Set your
              SteamID64 under API &amp; Widgets.
            </Text>
            <WButton size="sm" variant="secondary" onClick={handleResetOnboarding}>
              Reset onboarding prompt
            </WButton>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>
    </div>
  );
});

GameHubSettingsTab.displayName = 'GameHubSettingsTab';

export default GameHubSettingsTab;
