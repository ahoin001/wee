import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WButton from '../../ui/WButton';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const STEAM_ID_HELP_URL = 'https://steamcommunity.com/my/?xml=1';

const GameHubSettingsTab = React.memo(() => {
  const { profile, library } = useConsolidatedAppStore(
    useShallow((state) => ({
      profile: state.gameHub?.profile || {},
      library: state.gameHub?.library || {},
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
    <div className="space-y-5">
      <div className="mb-2">
        <Text variant="h2" className="text-[hsl(var(--text-primary))] mb-2">
          Game Hub
        </Text>
        <Text variant="body" className="text-[hsl(var(--text-secondary))]">
          Manage Steam enrichment profile settings and local-only behavior.
        </Text>
      </div>

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

      <Card
        title="Onboarding"
        separator
        desc="If onboarding was skipped, reset it to show the friendly Steam setup card in Game Hub again."
      >
        <div className="mt-4">
          <WButton size="sm" variant="secondary" onClick={handleResetOnboarding}>
            Reset onboarding prompt
          </WButton>
        </div>
      </Card>
    </div>
  );
});

GameHubSettingsTab.displayName = 'GameHubSettingsTab';

export default GameHubSettingsTab;
