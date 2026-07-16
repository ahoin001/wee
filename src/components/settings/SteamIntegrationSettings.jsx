import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { Cloud, User } from 'lucide-react';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WButton from '../../ui/WButton';
import WInput from '../../ui/WInput';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { openExternalUrl } from '../../utils/settingsNavigation';
import { validateSteamId64Input } from '../../utils/steamId64';
import { refreshSteamEnrichmentNow } from '../../utils/gameHub/gameHubEnrichmentRefresh';
import {
  WeeModalFieldCard,
  WeeSectionEyebrow,
  WeeSettingsCollapsibleSection,
} from '../../ui/wee';

const STEAM_ID_HELP_URL = 'https://steamcommunity.com/my/?xml=1';
const STEAM_API_KEY_HELP_URL = 'https://steamcommunity.com/dev/apikey';

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

/**
 * @param {{
 *   ok?: boolean,
 *   reason?: string,
 *   unavailableCause?: string,
 *   statusCode?: string | null,
 *   statusReason?: string | null,
 *   lastError?: string | null,
 * }} refresh
 * @param {string} steamId
 * @returns {string}
 */
function formatSteamSyncFailure(refresh, steamId) {
  if (refresh?.reason === 'unavailable') {
    if (refresh.unavailableCause === 'api-disabled') {
      return `Saved SteamID64 ${steamId}, but Steam Web API enrichment is turned off. Enable “Use Steam Web API” below to sync your library.`;
    }
    if (refresh.unavailableCause === 'api-bridge-missing') {
      return `Saved SteamID64 ${steamId}, but Steam enrichment isn’t available in this session (desktop API bridge missing). Restart Wee as the desktop app.`;
    }
    return `Saved SteamID64 ${steamId}, but library sync isn’t available yet.`;
  }

  const detail =
    refresh?.statusReason ||
    refresh?.lastError ||
    'Library sync failed. Check Enrichment status below.';

  if (refresh?.statusCode === 'missing-api-key' || /api key is not configured/i.test(detail)) {
    return `Saved SteamID64 ${steamId}, but the Steam Web API key isn’t configured. Add STEAM_WEB_API_KEY to your local .env (get a key at steamcommunity.com/dev/apikey), then restart Wee.`;
  }
  if (refresh?.statusCode === 'invalid-api-key') {
    return `Saved SteamID64 ${steamId}, but the Steam Web API key appears invalid. Check STEAM_WEB_API_KEY in your .env and restart Wee.`;
  }
  if (refresh?.statusCode === 'private-profile' || refresh?.statusCode === 'private-or-empty') {
    return `Saved SteamID64 ${steamId}, but Steam returned no library data. Make sure the profile’s game details are public.`;
  }
  if (refresh?.statusCode === 'rate-limited') {
    return `Saved SteamID64 ${steamId}, but Steam rate-limited the request. Try again shortly.`;
  }
  if (refresh?.reason === 'network') {
    return `Saved SteamID64 ${steamId}, but the network request failed${refresh.lastError ? `: ${refresh.lastError}` : '.'}`;
  }

  return `Saved SteamID64 ${steamId}, but library sync failed: ${detail}`;
}

/**
 * Steam profile + enrichment controls for API & Widgets.
 * Store SSOT remains gameHub.profile / gameHub.library.
 */
const SteamIntegrationSettings = React.memo(() => {
  const { profile, library } = useConsolidatedAppStore(
    useShallow((state) => ({
      profile: state.gameHub?.profile || {},
      library: state.gameHub?.library || {},
    }))
  );
  const setGameHubState = useConsolidatedAppStore((state) => state.actions.setGameHubState);

  const [steamIdInput, setSteamIdInput] = useState(profile.steamId || '');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const successTimerRef = useRef(null);

  useEffect(() => {
    setSteamIdInput(profile.steamId || '');
  }, [profile.steamId]);

  useEffect(
    () => () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    },
    []
  );

  const syncLabel = useMemo(() => {
    if (!library?.lastSyncedAt) return 'No sync yet';
    return new Date(library.lastSyncedAt).toLocaleString();
  }, [library?.lastSyncedAt]);

  const flashSuccess = useCallback((message) => {
    setSaveError('');
    setSaveSuccess(message);
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    successTimerRef.current = window.setTimeout(() => {
      setSaveSuccess('');
      successTimerRef.current = null;
    }, 4000);
  }, []);

  const handleSaveSteamId = useCallback(async () => {
    const result = validateSteamId64Input(steamIdInput);
    if (!result.ok) {
      setSaveSuccess('');
      setSaveError(result.error);
      return;
    }

    const { steamId } = result;
    setSteamIdInput(steamId);
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      setGameHubState({
        profile: {
          steamId,
          onboardingDismissed: false,
        },
        library: {
          syncStatus: 'pending',
          statusReason: 'SteamID64 saved. Syncing library…',
          lastError: null,
        },
      });

      const stored = useConsolidatedAppStore.getState().gameHub?.profile?.steamId;
      if (stored !== steamId) {
        setSaveError('Couldn’t save SteamID64 to app settings. Try again.');
        return;
      }

      const refresh = await refreshSteamEnrichmentNow();
      if (refresh?.ok) {
        flashSuccess(`Saved SteamID64 ${steamId}. Library sync complete.`);
      } else {
        setSaveSuccess('');
        setSaveError(formatSteamSyncFailure(refresh, steamId));
      }
    } finally {
      setIsSaving(false);
    }
  }, [setGameHubState, steamIdInput, flashSuccess]);

  const handleClearSteamId = useCallback(() => {
    setSaveError('');
    setSaveSuccess('');
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
    flashSuccess('SteamID64 cleared.');
  }, [setGameHubState, flashSuccess]);

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

  const handleOpenSteamIdHelp = useCallback(() => {
    openExternalUrl(STEAM_ID_HELP_URL);
  }, []);

  const handleOpenApiKeyHelp = useCallback(() => {
    openExternalUrl(STEAM_API_KEY_HELP_URL);
  }, []);

  const helperIsError = Boolean(saveError);

  return (
    <>
      <WeeSettingsCollapsibleSection
        icon={User}
        title="Steam profile"
        description="SteamID64 is stored locally and used for Game Hub library enrichment."
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
                Tip: sign in on Steam, open your profile, then use “Where to find SteamID64” for the
                XML page — or paste a /profiles/&lt;17-digit&gt; URL. Custom /id/ names are not resolved.
              </Text>
              {profile.steamId ? (
                <Text variant="caption" className="!m-0 mt-2 font-bold text-[hsl(var(--text-secondary))]">
                  Currently saved: {profile.steamId}
                </Text>
              ) : (
                <Text variant="caption" className="!m-0 mt-2 text-[hsl(var(--text-tertiary))]">
                  No SteamID64 saved yet.
                </Text>
              )}
            </div>
            <WInput
              variant="wee"
              type="text"
              value={steamIdInput}
              onChange={(event) => {
                setSteamIdInput(event.target.value);
                if (saveError) setSaveError('');
                if (saveSuccess) setSaveSuccess('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleSaveSteamId();
                }
              }}
              placeholder="17-digit SteamID64"
              error={helperIsError}
              helperText={helperIsError ? saveError : undefined}
              aria-invalid={helperIsError}
            />
            {saveSuccess ? (
              <p
                className="!m-0 text-sm font-bold text-[hsl(var(--state-success))]"
                role="status"
                aria-live="polite"
              >
                {saveSuccess}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <WButton
                size="sm"
                variant="primary"
                onClick={() => void handleSaveSteamId()}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save SteamID64'}
              </WButton>
              <WButton size="sm" variant="secondary" onClick={handleClearSteamId} disabled={isSaving}>
                Clear
              </WButton>
              <WButton size="sm" variant="tertiary" onClick={handleOpenSteamIdHelp}>
                Where to find SteamID64
              </WButton>
            </div>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Cloud}
        title="Enrichment"
        description="Local-only mode or Steam Web API when enabled and the .env key is set."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <div className="space-y-5">
            <HubToggleRow
              title="Use Steam Web API"
              description="When off, Game Hub stays local-only and skips remote enrichment."
            >
              <WToggle
                checked={profile.useSteamWebApi ?? true}
                onChange={handleUseSteamWebApiChange}
                disableLabelClick
              />
            </HubToggleRow>

            <div className={`${WEE_FIELD_CARD} space-y-2`}>
              <WeeSectionEyebrow className="mb-1 block" trackingClassName="tracking-[0.12em]">
                API key
              </WeeSectionEyebrow>
              <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                The Web API key stays in your local <code className="font-bold">.env</code> as{' '}
                <code className="font-bold">STEAM_WEB_API_KEY</code> (never stored in app settings).
                Restart Wee after changing it.
              </Text>
              <WButton size="sm" variant="tertiary" onClick={handleOpenApiKeyHelp}>
                Get a Steam Web API key
              </WButton>
            </div>

            <div className={`${WEE_FIELD_CARD} space-y-0`}>
              <WeeSectionEyebrow className="mb-3 block" trackingClassName="tracking-[0.12em]">
                Sync telemetry
              </WeeSectionEyebrow>
              <StatusKV label="Status" value={library.syncStatus || 'unknown'} />
              <StatusKV label="Last sync" value={syncLabel} />
              {library.statusReason ? (
                <StatusKV label="Status detail" value={library.statusReason} />
              ) : null}
              {library.lastError ? <StatusKV label="Last error" value={library.lastError} /> : null}
            </div>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>
    </>
  );
});

SteamIntegrationSettings.displayName = 'SteamIntegrationSettings';

export default SteamIntegrationSettings;
