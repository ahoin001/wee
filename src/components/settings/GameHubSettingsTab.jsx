import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { Cloud, GraduationCap, ImageIcon, User } from 'lucide-react';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WButton from '../../ui/WButton';
import WInput from '../../ui/WInput';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  WeeModalFieldCard,
  WeeSectionEyebrow,
  WeeSettingsCollapsibleSection,
} from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import './surfaceStyles.css';

const STEAM_ID_HELP_URL = 'https://steamcommunity.com/my/?xml=1';

const WEE_FIELD_CARD =
  'rounded-2xl border border-[hsl(var(--border-primary)/0.42)] bg-[hsl(var(--surface-secondary)/0.55)] p-3 shadow-[inset_0_1px_0_0_hsl(var(--border-primary)/0.14)] md:p-4';

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

function StatusKV({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[hsl(var(--border-primary)/0.22)] py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <WeeSectionEyebrow className="!m-0 shrink-0 sm:pt-0.5" trackingClassName="tracking-[0.12em]">
        {label}
      </WeeSectionEyebrow>
      <span className="min-w-0 max-w-full rounded-xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary))] px-2.5 py-1.5 text-left text-[11px] font-bold leading-snug text-[hsl(var(--text-primary))] sm:max-w-[min(100%,28rem)] sm:text-right">
        {value}
      </span>
    </div>
  );
}

StatusKV.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
};

const GameHubSettingsTab = React.memo(() => {
  const { profile, library, ui } = useConsolidatedAppStore(
    useShallow((state) => ({
      profile: state.gameHub?.profile || {},
      library: state.gameHub?.library || {},
      ui: state.gameHub?.ui || {},
    }))
  );
  const { setGameHubState } = useConsolidatedAppStore(useShallow((state) => state.actions));

  const [steamIdInput, setSteamIdInput] = useState(profile.steamId || '');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setSteamIdInput(profile.steamId || '');
  }, [profile.steamId]);

  const syncLabel = useMemo(() => {
    if (!library?.lastSyncedAt) return 'No sync yet';
    return new Date(library.lastSyncedAt).toLocaleString();
  }, [library?.lastSyncedAt]);

  const handleSaveSteamId = useCallback(() => {
    const normalized = steamIdInput.trim();
    if (!normalized) {
      setSaveError('SteamID64 is required or use Clear to remove it.');
      return;
    }
    if (!/^\d{17}$/.test(normalized)) {
      setSaveError('SteamID64 must be exactly 17 digits.');
      return;
    }
    setSaveError('');
    setGameHubState({
      profile: {
        steamId: normalized,
        onboardingDismissed: false,
      },
    });
  }, [setGameHubState, steamIdInput]);

  const handleClearSteamId = useCallback(() => {
    setSaveError('');
    setSteamIdInput('');
    setGameHubState({
      profile: {
        steamId: '',
        onboardingDismissed: false,
      },
      library: {
        enrichedGames: [],
        lastEnrichedSteamId: '',
        syncStatus: 'local-only',
        statusReason: 'SteamID64 cleared. Running local-only mode.',
        lastError: null,
      },
    });
  }, [setGameHubState]);

  const handleUseSteamWebApiChange = useCallback(
    (checked) => {
      setGameHubState({
        profile: {
          useSteamWebApi: checked,
        },
        library: checked
          ? {}
          : {
              syncStatus: 'local-only',
              statusReason: 'Steam enrichment disabled in settings.',
              lastError: null,
            },
      });
    },
    [setGameHubState]
  );

  const handleResetOnboarding = useCallback(() => {
    setGameHubState({
      profile: {
        onboardingDismissed: false,
      },
    });
  }, [setGameHubState]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-6 pb-12">
      <SettingsTabPageHeader title="Game Hub" subtitle="SteamID64 and enrichment controls" />

      <WeeSettingsCollapsibleSection
        icon={User}
        title="Steam profile"
        description="SteamID64 is stored locally and used for main-process library enrichment."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <div className="space-y-4">
            <div>
              <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.12em]">
                SteamID64
              </WeeSectionEyebrow>
              <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                17-digit ID from your Steam community XML — saved in unified app settings.
              </Text>
              <Text variant="caption" className="!m-0 mt-1 text-[hsl(var(--text-tertiary))]">
                Quick tip: sign in on Steam, open your profile page, and copy the ID from the profile URL.
              </Text>
            </div>
            <WInput
              variant="wee"
              type="text"
              value={steamIdInput}
              onChange={(event) => setSteamIdInput(event.target.value)}
              placeholder="17-digit SteamID64"
              error={Boolean(saveError)}
              helperText={saveError || undefined}
              aria-invalid={Boolean(saveError)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <WButton size="sm" variant="primary" onClick={handleSaveSteamId}>
                Save SteamID64
              </WButton>
              <WButton size="sm" variant="secondary" onClick={handleClearSteamId}>
                Clear
              </WButton>
              <a
                href={STEAM_ID_HELP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-[hsl(var(--border-primary)/0.5)] bg-[hsl(var(--surface-elevated))] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[hsl(var(--primary))] underline decoration-[hsl(var(--primary)/0.4)] underline-offset-[3px] transition-colors hover:text-[hsl(var(--primary-hover))]"
              >
                Where to find SteamID64
              </a>
            </div>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Cloud}
        title="Enrichment"
        description="Local-only mode or Steam Web API when enabled and configured."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <div className="space-y-5">
            <HubToggleRow
              title="Use Steam Web API"
              description="When off, Game Hub stays local-only and skips remote enrichment."
            >
              <WToggle checked={profile.useSteamWebApi ?? true} onChange={handleUseSteamWebApiChange} disableLabelClick />
            </HubToggleRow>

            <div className={`${WEE_FIELD_CARD} space-y-0`}>
              <WeeSectionEyebrow className="mb-3 block" trackingClassName="tracking-[0.12em]">
                Sync telemetry
              </WeeSectionEyebrow>
              <StatusKV label="Status" value={library.syncStatus || 'unknown'} />
              <StatusKV label="Last sync" value={syncLabel} />
              {library.statusReason ? (
                <StatusKV label="Status detail" value={library.statusReason} />
              ) : null}
            </div>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

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
              Resets the dismissal flag so the hub can ask you to connect Steam again.
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
