import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Music, Settings2, Radio, Gamepad2 } from 'lucide-react';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WButton from '../../ui/WButton';
import {
  WeeModalFieldCard,
  WeeSegmentedControl,
  WeeSettingsCollapsibleSection,
  WeeDockSettingsSubtabs,
} from '../../ui/wee';
import { AdminPanel } from '../admin';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { applyAdminPanelPowerActions, normalizeAdminPanelConfig } from '../../utils/adminPanelCommands';
import { normalizeNowPlayingExperience } from '../../utils/spotifyTakeover';
import { logError } from '../../utils/logger';
import ShortcutCaptureControl from './ShortcutCaptureControl';
import SteamIntegrationSettings from './SteamIntegrationSettings';
import './api-integrations-settings.css';
import SettingsTabPageHeader from './SettingsTabPageHeader';

const INTEGRATION_SUBTABS = [
  {
    id: 'music',
    label: 'Music',
    description: 'Spotify & Now Playing',
    icon: Music,
  },
  {
    id: 'steam',
    label: 'Steam',
    description: 'Library & friends',
    icon: Gamepad2,
  },
  {
    id: 'widgets',
    label: 'Widgets',
    description: 'Quick Access',
    icon: Settings2,
  },
];

const spotifyBtnClass = (active, isGreen = true) =>
  active
    ? '!bg-[hsl(var(--state-error))] !border-[hsl(var(--state-error))] hover:!bg-[hsl(var(--state-error-hover))] text-[hsl(var(--text-on-accent))] border-solid'
    : isGreen
      ? '!bg-[rgb(var(--spotify-green-rgb))] !border-[rgb(var(--spotify-green-rgb))] hover:!brightness-110 text-[hsl(var(--text-on-accent))] border-solid'
      : '!bg-[hsl(var(--link))] !border-[hsl(var(--link))] hover:!brightness-110 text-[hsl(var(--text-on-accent))] border-solid';

const ApiIntegrationsSettingsTab = () => {
  const {
    spotify,
    floatingWidgets,
    systemMedia,
    systemMediaEnabled,
  } =
    useConsolidatedAppStore(
      useShallow((state) => ({
        spotify: state.spotify,
        floatingWidgets: state.floatingWidgets,
        systemMedia: state.systemMedia,
        systemMediaEnabled: state.ui.systemMediaEnabled !== false,
      }))
    );
  const actions = useConsolidatedAppStore(useShallow((state) => state.actions));

  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const adminPanelConfig = useMemo(
    () => normalizeAdminPanelConfig(floatingWidgets.adminPanel?.config),
    [floatingWidgets.adminPanel?.config]
  );

  const handleSpotifyConnect = useCallback(async () => {
    try {
      await actions.spotifyManager.connect();
    } catch (error) {
      logError('ApiIntegrationsSettingsTab', 'Spotify connection error', error);
    }
  }, [actions]);

  const handleSpotifyDisconnect = useCallback(async () => {
    try {
      actions.spotifyManager.disconnect();
    } catch (error) {
      logError('ApiIntegrationsSettingsTab', 'Spotify disconnection error', error);
    }
  }, [actions]);

  const handleToggleAdminPanelWidget = useCallback(() => {
    const isVisible = floatingWidgets.adminPanel.visible;
    actions.setFloatingWidgetsState({
      adminPanel: { ...floatingWidgets.adminPanel, visible: !isVisible },
    });
  }, [actions, floatingWidgets.adminPanel]);


  const handleAdminPanelSave = useCallback(
    (powerActionsOrConfig) => {
      actions.setFloatingWidgetsState({
        adminPanel: applyAdminPanelPowerActions(
          floatingWidgets.adminPanel,
          powerActionsOrConfig
        ),
      });
    },
    [actions, floatingWidgets.adminPanel]
  );

  const handleSystemMediaToggle = useCallback(
    (checked) => {
      actions.setUIState({ systemMediaEnabled: Boolean(checked) });
    },
    [actions]
  );

  const systemMediaStatusLabel = useMemo(() => {
    if (!systemMediaEnabled) return 'Off';
    if (systemMedia?.error) return systemMedia.error;
    if (systemMedia?.starting) return 'Starting…';
    if (systemMedia?.available) {
      const sessions = Array.isArray(systemMedia.sessions) ? systemMedia.sessions : [];
      const session = systemMedia.session;
      const app =
        session?.sourceAppDisplayName ||
        session?.sourceAppUserModelId ||
        '';
      if (session && (session.title || session.artist || app)) {
        return app ? `Listening · ${app}` : 'Listening';
      }
      if (sessions.length > 0) {
        return `${sessions.length} desktop session${sessions.length === 1 ? '' : 's'}`;
      }
      return 'Ready — play in Spotify, Apple Music, or a browser';
    }
    return 'Unavailable';
  }, [systemMediaEnabled, systemMedia]);

  const systemMediaDetectedLine = useMemo(() => {
    const session = systemMedia?.session;
    if (!systemMediaEnabled || !session) return '';
    const app =
      session.sourceAppDisplayName || session.sourceAppUserModelId || 'Player';
    const title = session.title || session.artist || session.albumTitle || '';
    if (!title && !session.sourceAppDisplayName && !session.sourceAppUserModelId) return '';
    return title ? `${app} — ${title}${session.artist && session.title ? ` · ${session.artist}` : ''}` : app;
  }, [systemMediaEnabled, systemMedia]);

  const integrationsSubTabHint = useConsolidatedAppStore((s) => s.ui?.integrationsSubTab);
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const hint = useConsolidatedAppStore.getState().ui?.integrationsSubTab;
    return hint === 'steam' || hint === 'widgets' || hint === 'music' ? hint : 'music';
  });

  useEffect(() => {
    if (integrationsSubTabHint === 'steam' || integrationsSubTabHint === 'widgets' || integrationsSubTabHint === 'music') {
      setActiveSubTab(integrationsSubTabHint);
      actions.setUIState({ integrationsSubTab: undefined });
    }
  }, [integrationsSubTabHint, actions]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-6 pb-12">
      <SettingsTabPageHeader
        title="Music, Steam & Widgets"
        subtitle="Connect services — Music & Now Playing, Steam, floating widgets"
      />

      <WeeDockSettingsSubtabs
        tabs={INTEGRATION_SUBTABS}
        value={activeSubTab}
        onChange={setActiveSubTab}
        ariaLabel="Integration sections"
        layoutId="weeIntegrationsSubtabActive"
      />

      <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-5" className="mb-2">
        <Text variant="desc" className="!m-0 text-[hsl(var(--text-secondary))]">
          Home tile Color Match and Now Playing listen filters live in{' '}
          <span className="font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]">
            Edit Home
          </span>
          . Place Quick Access under{' '}
          <button
            type="button"
            className="border-0 bg-transparent p-0 font-black uppercase tracking-[0.12em] text-[hsl(var(--primary))] underline decoration-[hsl(var(--primary)/0.45)] underline-offset-4"
            onClick={() => {
              actions.setUIState({ settingsActiveTab: 'channels' });
            }}
          >
            Channels &amp; layout → Widgets
          </button>
          .
        </Text>
      </WeeModalFieldCard>

      {activeSubTab === 'steam' ? <SteamIntegrationSettings /> : null}

      {activeSubTab === 'music' ? (
        <>
      <WeeSettingsCollapsibleSection
        icon={Music}
        title="Spotify Integration"
        description="Connect Spotify for Color Match and Now Playing"
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6" className="mb-6 api-integ-glass-card">
          <div className="mb-6">
            <Text variant="caption" className="mb-1 text-xs font-semibold text-[hsl(var(--text-primary))]">
              Connection Status
            </Text>
            <div className="max-w-md space-y-2">
              <div
                className={`rounded-md px-3 py-2 text-sm text-[hsl(var(--text-on-accent))] ${
                  spotify.isConnected
                    ? 'bg-[hsl(var(--state-success))]'
                    : 'bg-[hsl(var(--state-error))]'
                }`}
              >
                {spotify.isConnected ? 'Connected' : 'Disconnected'}
              </div>
              {spotify.error && (
                <div className="rounded-md bg-[hsl(var(--state-error))] px-3 py-2 text-sm text-[hsl(var(--text-on-accent))]">
                  Error: {spotify.error}
                </div>
              )}
              <WButton
                onClick={spotify.isConnected ? handleSpotifyDisconnect : handleSpotifyConnect}
                size="sm"
                disabled={spotify.loading}
                variant="primary"
                fullWidth
                className={spotifyBtnClass(spotify.isConnected, true)}
              >
                {spotify.loading ? 'Connecting...' : (spotify.isConnected ? 'Disconnect' : 'Connect to Spotify')}
              </WButton>
              {!spotify.isConnected && !spotify.loading && (
                <Text variant="caption" className="text-xs text-[hsl(var(--text-tertiary))]">
                  Authorize with Spotify to enable Color Match and library-backed Now Playing.
                </Text>
              )}
            </div>
          </div>

          <Text variant="caption" className="mb-3 block text-[11px] text-[hsl(var(--text-tertiary))]">
            Place a Now Playing tile on Home via Edit Home. Color Match for that tile is configured
            there too.
          </Text>

          {/* Now Playing takeover experience */}
          <div className="mt-6">
            <Text variant="caption" className="mb-1 text-xs font-semibold text-[hsl(var(--text-primary))]">
              Now Playing experience
            </Text>
            <Text variant="caption" className="!mb-3 block text-[11px] text-[hsl(var(--text-tertiary))]">
              A momentary album-driven immersive overlay. Enter it from the command palette or the
              Now Playing home tile; Escape (or any interaction, in automatic mode) exits.
            </Text>
            <WeeSegmentedControl
              ariaLabel="Now Playing takeover experience"
              value={normalizeNowPlayingExperience(spotify.nowPlayingExperience)}
              onChange={(value) => actions.setSpotifyState({ nowPlayingExperience: value })}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'onDemand', label: 'On demand' },
                { value: 'autoIdle', label: 'Auto when idle' },
              ]}
            />
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Radio}
        title="System media & Now Playing"
        description="One player-agnostic view of desktop audio through Windows system media"
        defaultOpen={false}
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6" className="mb-6 api-integ-glass-card">
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg bg-[hsl(var(--surface-tertiary))] p-4">
            <div className="min-w-0">
              <Text variant="body" className="text-sm font-semibold text-[hsl(var(--text-primary))]">
                Listen to desktop music apps
              </Text>
              <Text variant="caption" className="text-xs text-[hsl(var(--text-tertiary))]">
                Shows what Spotify Desktop, Apple Music, browsers, and other apps are playing —
                no Premium required. Status: {systemMediaStatusLabel}
              </Text>
              {systemMediaDetectedLine ? (
                <Text variant="caption" className="mt-1.5 truncate text-xs text-[hsl(var(--text-secondary))]">
                  Detected:{' '}
                  <span className="font-semibold text-[hsl(var(--text-primary))]">
                    {systemMediaDetectedLine}
                  </span>
                </Text>
              ) : null}
            </div>
            <WToggle checked={systemMediaEnabled} onChange={handleSystemMediaToggle} />
          </div>

          <Text variant="caption" className="mt-3 text-xs text-[hsl(var(--text-tertiary))]">
            Now Playing follows the active Windows media session and sends standard media keys, so
            Spotify Desktop, Apple Music, browsers, and other compatible players use the same
            controls. Edit Home → Now Playing to filter by app and configure Color Match.
          </Text>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>
        </>
      ) : null}

      {activeSubTab === 'widgets' ? (
        <>
      {/* Admin Panel Widget */}
      <WeeSettingsCollapsibleSection
        icon={Settings2}
        title="Admin Panel Widget"
        description="Quick Access floating menu for Windows tools"
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6" className="mb-6 api-integ-glass-card">
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.55)] p-4">
            <div className="min-w-0">
              <Text variant="body" className="text-sm font-semibold text-[hsl(var(--text-primary))]">
                Show floating widget
              </Text>
              <Text variant="caption" className="text-xs text-[hsl(var(--text-tertiary))]">
                Pin a Quick Access menu on your desktop for system tools and power actions
              </Text>
            </div>
            <WToggle
              checked={Boolean(floatingWidgets.adminPanel.visible)}
              onChange={handleToggleAdminPanelWidget}
              disableLabelClick
            />
          </div>

          <div className="mb-5 rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.45)] p-4">
            <Text variant="body" className="mb-1 text-sm font-semibold text-[hsl(var(--text-primary))]">
              Toggle shortcut
            </Text>
            <Text variant="caption" className="mb-3 block text-xs text-[hsl(var(--text-tertiary))]">
              Same binding as Shortcuts → Widgets. Changes sync both ways.
            </Text>
            <ShortcutCaptureControl shortcutId="toggle-admin-panel-widget" showLabel={false} />
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.45)] p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Text variant="body" className="text-sm font-semibold text-[hsl(var(--text-primary))]">
                  Quick Access actions
                </Text>
                <Text variant="caption" className="text-xs text-[hsl(var(--text-tertiary))]">
                  {adminPanelConfig.powerActions.length} configured
                </Text>
              </div>
              <WButton onClick={() => setShowAdminPanel(true)} size="sm" variant="primary">
                Configure actions
              </WButton>
            </div>

            {adminPanelConfig.powerActions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {adminPanelConfig.powerActions.slice(0, 8).map((action) => (
                  <div
                    key={action.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary)/0.65)] px-2.5 py-1.5"
                  >
                    <span className="text-sm" aria-hidden>
                      {action.icon}
                    </span>
                    <Text variant="caption" className="text-[11px] font-semibold text-[hsl(var(--text-primary))]">
                      {action.name}
                    </Text>
                  </div>
                ))}
                {adminPanelConfig.powerActions.length > 8 ? (
                  <div className="inline-flex items-center rounded-full border border-[hsl(var(--border-primary)/0.35)] px-2.5 py-1.5">
                    <Text variant="caption" className="text-[11px] text-[hsl(var(--text-secondary))]">
                      +{adminPanelConfig.powerActions.length - 8} more
                    </Text>
                  </div>
                ) : null}
              </div>
            ) : (
              <Text variant="caption" className="text-sm text-[hsl(var(--text-tertiary))]">
                No actions yet — configure a short list of tools you use often.
              </Text>
            )}

            <Text variant="caption" className="mt-4 block text-[11px] text-[hsl(var(--text-tertiary))]">
              Power actions like Shut Down ask for confirmation before running.
            </Text>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>
        </>
      ) : null}

      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onSave={handleAdminPanelSave}
        config={adminPanelConfig}
      />
    </div>
  );
};

export default ApiIntegrationsSettingsTab;
