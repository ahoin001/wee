import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WButton from '../../ui/WButton';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import SettingsWeeSection from './SettingsWeeSection';

const STEAM_ID_HELP_URL = 'https://steamcommunity.com/my/?xml=1';

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

  const handleUseSteamWebApiChange = useCallback((checked) => {
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
  }, [setGameHubState]);

  const handleResetOnboarding = useCallback(() => {
    setGameHubState({
      profile: {
        onboardingDismissed: false,
      },
    });
  }, [setGameHubState]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Text variant="h2" className="mb-2 text-[hsl(var(--text-primary))]">
          Game Hub
        </Text>
        <Text variant="body" className="text-[hsl(var(--text-secondary))]">
          Manage Steam enrichment and Game Hub-only visual behavior.
        </Text>
      </div>

      <SettingsWeeSection eyebrow="Steam profile">
      <Card
        title="Steam Profile"
        separator
        desc="Your SteamID64 is stored in unified app settings and used by main-process enrichment requests."
        className="mb-4"
      >
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-[hsl(var(--text-primary))]">SteamID64</label>
          <input
            type="text"
            value={steamIdInput}
            onChange={(event) => setSteamIdInput(event.target.value)}
            placeholder="17-digit SteamID64"
            className="w-full rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-3 py-2 text-sm text-[hsl(var(--text-primary))] outline-none focus:border-[hsl(var(--wii-blue))] focus:ring-2 focus:ring-[hsl(var(--wii-blue)/0.25)]"
          />
          {saveError ? <p className="text-sm text-[hsl(var(--state-error))]">{saveError}</p> : null}
          <div className="flex flex-wrap gap-2">
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
              className="inline-flex items-center rounded-full border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--text-primary))]"
            >
              Where to find SteamID64
            </a>
          </div>
        </div>
      </Card>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Enrichment">
      <Card
        title="Enrichment Controls"
        separator
        desc="Keep Game Hub local-only or use Steam Web API when available."
        headerActions={
          <WToggle
            checked={profile.useSteamWebApi ?? true}
            onChange={handleUseSteamWebApiChange}
          />
        }
        className="mb-4"
      >
        <div className="mt-4 space-y-2 text-sm text-[hsl(var(--text-secondary))]">
          <p>Sync status: <strong className="text-[hsl(var(--text-primary))]">{library.syncStatus || 'unknown'}</strong></p>
          <p>Last sync: <strong className="text-[hsl(var(--text-primary))]">{syncLabel}</strong></p>
          {library.statusReason ? (
            <p>Status reason: <strong className="text-[hsl(var(--text-primary))]">{library.statusReason}</strong></p>
          ) : null}
        </div>
      </Card>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Hub visuals">
      <Card
        title="Hub Visuals"
        separator
        desc="These settings only affect the Game Hub space."
        className="mb-4"
      >
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--text-primary))]">Show Hub Backdrop</p>
              <p className="text-xs text-[hsl(var(--text-secondary))]">
                Adds the Game Hub local artwork backdrop over your existing app wallpaper.
              </p>
            </div>
            <WToggle
              checked={ui.showHubBackdrop ?? false}
              onChange={(checked) => setGameHubState({ ui: { showHubBackdrop: checked } })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--text-primary))]">Enhanced Effects & Animations</p>
              <p className="text-xs text-[hsl(var(--text-secondary))]">
                Enables hover lift, stack transitions, and launch burst effects. Turn off for lower resource use.
              </p>
            </div>
            <WToggle
              checked={ui.effectsEnabled ?? true}
              onChange={(checked) => setGameHubState({ ui: { effectsEnabled: checked } })}
            />
          </div>
        </div>
      </Card>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Onboarding">
      <Card
        title="Onboarding"
        separator
        desc="Use this if you want the Game Hub Steam connection prompt available again."
      >
        <div className="mt-4">
          <WButton size="sm" variant="secondary" onClick={handleResetOnboarding}>
            Reset onboarding prompt
          </WButton>
        </div>
      </Card>
      </SettingsWeeSection>
    </div>
  );
});

GameHubSettingsTab.displayName = 'GameHubSettingsTab';

export default GameHubSettingsTab;
