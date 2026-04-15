import React, { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import './GameHubSpace.css';

const STEAM_ID_HELP_URL = 'https://steamcommunity.com/my/?xml=1';

const formatPlaytime = (minutes = 0) => {
  if (!minutes || minutes <= 0) return 'No tracked playtime yet';
  const hours = Math.round(minutes / 60);
  return `${hours.toLocaleString()}h played`;
};

const normalizeSteamGame = (game, enrichmentMap) => {
  const appId = String(game.appId || game.appid || '');
  const enrich = enrichmentMap?.[appId] || {};
  return {
    id: `steam-${appId || game.name}`,
    source: 'steam',
    appId,
    name: game.name || 'Unknown Steam Game',
    imageUrl: appId
      ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`
      : null,
    headerUrl: appId
      ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
      : null,
    launchPath: appId ? `steam://rungameid/${appId}` : null,
    playtimeForever: Number(enrich.playtimeForever || 0),
    playtimeRecent: Number(enrich.playtimeRecent || 0),
    lastPlayedAt: Number(enrich.lastPlayedAt || 0),
  };
};

const normalizeEpicGame = (game) => ({
  id: `epic-${game.appName || game.name}`,
  source: 'epic',
  appId: game.appName || game.name,
  name: game.name || 'Unknown Epic Game',
  imageUrl: game.image || null,
  headerUrl: game.image || null,
  launchPath: game.appName
    ? `com.epicgames.launcher://apps/${game.appName}?action=launch&silent=true`
    : null,
  playtimeForever: 0,
  playtimeRecent: 0,
  lastPlayedAt: 0,
});

function buildShelves({ steamGames, epicGames, enrichmentMap, favorites }) {
  const normalizedSteam = (steamGames || []).map((game) => normalizeSteamGame(game, enrichmentMap));
  const normalizedEpic = (epicGames || []).map(normalizeEpicGame);
  const installed = [...normalizedSteam, ...normalizedEpic];

  const mostPlayed = [...normalizedSteam]
    .sort((a, b) => b.playtimeForever - a.playtimeForever)
    .slice(0, 12);

  const recentlyPlayed = [...normalizedSteam]
    .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt || b.playtimeRecent - a.playtimeRecent)
    .slice(0, 12);

  const readyToLaunch = installed.filter((item) => Boolean(item.launchPath)).slice(0, 16);

  const favoriteSet = new Set(favorites || []);
  const premiumFavorites = installed
    .filter((item) => favoriteSet.has(item.id))
    .sort((a, b) => b.playtimeForever - a.playtimeForever || a.name.localeCompare(b.name))
    .slice(0, 8);

  const bySource = {
    steam: installed.filter((item) => item.source === 'steam').slice(0, 12),
    epic: installed.filter((item) => item.source === 'epic').slice(0, 12),
  };

  return {
    installed,
    mostPlayed,
    recentlyPlayed,
    readyToLaunch,
    premiumFavorites,
    bySource,
  };
}

function DataStatusBadge({ status, reason }) {
  if (status === 'loading') {
    return <span className="gamehub-status gamehub-status--loading">Syncing Steam enrichment...</span>;
  }
  if (status === 'ready') {
    return <span className="gamehub-status gamehub-status--ready">Steam enrichment ready</span>;
  }
  if (status === 'local-only') {
    return <span className="gamehub-status gamehub-status--local">Local library mode</span>;
  }
  if (status === 'error') {
    return (
      <span className="gamehub-status gamehub-status--error">
        Steam enrichment unavailable{reason ? `: ${reason}` : ''}
      </span>
    );
  }
  return null;
}

function SteamOnboarding({ onSaveSteamId, onSkip }) {
  const [steamIdInput, setSteamIdInput] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSave = () => {
    const normalized = steamIdInput.trim();
    if (!/^\d{17}$/.test(normalized)) {
      setValidationError('SteamID64 should be 17 digits.');
      return;
    }
    setValidationError('');
    onSaveSteamId(normalized);
  };

  return (
    <div className="gamehub-onboarding-card">
      <div className="gamehub-onboarding-card__header">
        <span className="gamehub-onboarding-card__badge">Power-Up</span>
        <h2>Connect your Steam profile</h2>
      </div>
      <p>
        Add your SteamID64 to unlock Recently Played and Most Played shelves from Steam Web API data.
      </p>
      <div className="gamehub-onboarding-card__input-row">
        <input
          type="text"
          value={steamIdInput}
          onChange={(event) => setSteamIdInput(event.target.value)}
          placeholder="Enter SteamID64 (17 digits)"
          className="gamehub-onboarding-card__input"
        />
        <button type="button" className="gamehub-btn gamehub-btn--primary" onClick={handleSave}>
          Save SteamID64
        </button>
      </div>
      {validationError ? <p className="gamehub-onboarding-card__error">{validationError}</p> : null}
      <div className="gamehub-onboarding-card__steps">
        <p><strong>Where to find SteamID64:</strong></p>
        <ol>
          <li>Open your Steam profile in browser.</li>
          <li>Append <code>?xml=1</code> to the URL and load it.</li>
          <li>Copy the value inside <code>&lt;steamID64&gt;</code>.</li>
        </ol>
      </div>
      <div className="gamehub-onboarding-card__actions">
        <a href={STEAM_ID_HELP_URL} target="_blank" rel="noreferrer" className="gamehub-btn gamehub-btn--ghost">
          Open SteamID guide
        </a>
        <button type="button" className="gamehub-btn gamehub-btn--secondary" onClick={onSkip}>
          Continue in local-only mode
        </button>
      </div>
    </div>
  );
}

function GameCard({ game, isFavorite, onToggleFavorite, onSelect, onLaunch }) {
  return (
    <article className="gamehub-card">
      <button type="button" className="gamehub-card__media" onClick={() => onSelect(game)}>
        {game.headerUrl ? (
          <img src={game.headerUrl} alt={game.name} loading="lazy" />
        ) : (
          <div className="gamehub-card__fallback">No artwork yet</div>
        )}
        <span className="gamehub-card__source">{game.source.toUpperCase()}</span>
        <div className="gamehub-card__shine" />
      </button>
      <div className="gamehub-card__meta">
        <h4>{game.name}</h4>
        <p>{formatPlaytime(game.playtimeForever)}</p>
      </div>
      <div className="gamehub-card__actions">
        <button type="button" className="gamehub-btn gamehub-btn--tiny" onClick={() => onLaunch(game)}>
          Launch
        </button>
        <button type="button" className="gamehub-btn gamehub-btn--tiny gamehub-btn--ghost" onClick={() => onToggleFavorite(game.id)}>
          {isFavorite ? '★ Favorite' : '☆ Favorite'}
        </button>
      </div>
    </article>
  );
}

function Shelf({ title, games, favorites, onToggleFavorite, onSelect, onLaunch }) {
  if (!games.length) return null;
  return (
    <section className="gamehub-shelf">
      <div className="gamehub-shelf__header">
        <h3>{title}</h3>
      </div>
      <div className="gamehub-shelf__track" role="list">
        {games.map((game) => (
          <div key={game.id} className="gamehub-shelf__item" role="listitem">
            <GameCard
              game={game}
              isFavorite={favorites.has(game.id)}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelect}
              onLaunch={onLaunch}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function GameHubSpace() {
  const { appLibrary, gameHub, setGameHubState, appLibraryManager } = useConsolidatedAppStore(
    useShallow((state) => ({
      appLibrary: state.appLibrary,
      gameHub: state.gameHub,
      setGameHubState: state.actions.setGameHubState,
      appLibraryManager: state.appLibraryManager,
    }))
  );
  const { showLaunchError, beginLaunchFeedback, endLaunchFeedback } = useLaunchFeedback();

  const [selectedGame, setSelectedGame] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const shouldPrompt = !gameHub.profile?.steamId && !gameHub.profile?.onboardingDismissed;
    setShowOnboarding(shouldPrompt);
  }, [gameHub.profile?.onboardingDismissed, gameHub.profile?.steamId]);

  useEffect(() => {
    const hydrate = async () => {
      setGameHubState({
        library: {
          syncStatus: 'loading',
          lastError: null,
          statusReason: '',
        },
      });

      try {
        await Promise.all([
          appLibraryManager?.fetchSteamGames?.(),
          appLibraryManager?.fetchEpicGames?.(),
        ]);

        const steamId = gameHub.profile?.steamId;
        const useSteamWebApi = gameHub.profile?.useSteamWebApi !== false;
        if (!useSteamWebApi) {
          setGameHubState({
            library: {
              enrichedGames: [],
              lastSyncedAt: Date.now(),
              syncStatus: 'local-only',
              statusReason: 'Steam enrichment disabled in Game Hub settings.',
              lastError: null,
            },
          });
          return;
        }

        if (!steamId) {
          setGameHubState({
            library: {
              enrichedGames: [],
              lastSyncedAt: Date.now(),
              syncStatus: 'local-only',
              statusReason: 'Add SteamID64 to enrich with recent/most played.',
              lastError: null,
            },
          });
          return;
        }

        if (!window.api?.steam?.getEnrichedGames) {
          setGameHubState({
            library: {
              enrichedGames: [],
              lastSyncedAt: Date.now(),
              syncStatus: 'local-only',
              statusReason: 'Steam enrichment API bridge unavailable.',
              lastError: null,
            },
          });
          return;
        }

        const enriched = await window.api.steam.getEnrichedGames({ steamId });
        const enrichedGames = Array.isArray(enriched?.games) ? enriched.games : [];
        const hasError = Boolean(enriched?.error);

        setGameHubState({
          library: {
            enrichedGames,
            lastSyncedAt: Date.now(),
            syncStatus: hasError ? 'error' : 'ready',
            statusReason: enriched?.statusReason || enriched?.error || '',
            lastError: hasError ? enriched.error : null,
          },
        });
      } catch (error) {
        setGameHubState({
          library: {
            syncStatus: 'error',
            statusReason: 'Network or API request failed.',
            lastError: error?.message || 'Failed to sync library',
          },
        });
      }
    };
    hydrate();
  }, [appLibraryManager, gameHub.profile?.steamId, gameHub.profile?.useSteamWebApi, setGameHubState]);

  const enrichmentMap = useMemo(() => {
    const map = {};
    (gameHub.library?.enrichedGames || []).forEach((item) => {
      if (item?.appId) {
        map[String(item.appId)] = item;
      }
    });
    return map;
  }, [gameHub.library?.enrichedGames]);

  const favoriteGameIds = gameHub.ui?.favoriteGameIds || [];
  const favoriteSet = useMemo(() => new Set(favoriteGameIds), [favoriteGameIds]);

  const shelves = useMemo(
    () => buildShelves({
      steamGames: appLibrary.steamGames,
      epicGames: appLibrary.epicGames,
      enrichmentMap,
      favorites: favoriteGameIds,
    }),
    [appLibrary.epicGames, appLibrary.steamGames, enrichmentMap, favoriteGameIds]
  );

  const heroGame =
    shelves.premiumFavorites[0] ||
    shelves.recentlyPlayed[0] ||
    shelves.mostPlayed[0] ||
    shelves.installed[0] ||
    null;
  const lastSyncedLabel = gameHub.library?.lastSyncedAt
    ? new Date(gameHub.library.lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  const handleLaunchGame = async (game) => {
    if (!game?.launchPath || !window.api?.launchApp) return;
    await launchWithFeedback({
      launch: () => window.api.launchApp({ type: 'url', path: game.launchPath, asAdmin: false }),
      beginLaunchFeedback,
      endLaunchFeedback,
      showLaunchError,
      label: `Launching ${game.name}`,
      launchType: game.source,
      path: game.launchPath,
      source: 'gamehub',
    });
  };

  const toggleFavorite = (gameId) => {
    const exists = favoriteSet.has(gameId);
    const next = exists
      ? favoriteGameIds.filter((id) => id !== gameId)
      : [...favoriteGameIds, gameId];
    setGameHubState({ ui: { favoriteGameIds: next } });
  };

  const saveSteamId = (steamId) => {
    setGameHubState({
      profile: {
        steamId,
        onboardingDismissed: false,
      },
    });
    setShowOnboarding(false);
  };

  return (
    <section className="gamehub-space">
      <header className="gamehub-space__header">
        <div>
          <p className="gamehub-space__eyebrow">Game Hub Space</p>
          <h2 className="gamehub-space__title">Celebrate your library</h2>
          <p className="gamehub-space__subtitle">
            A focused collection view tuned for local launches and optional Steam enrichment.
          </p>
        </div>
        <div className="gamehub-space__status-stack">
          <DataStatusBadge status={gameHub.library?.syncStatus} reason={gameHub.library?.statusReason} />
          {lastSyncedLabel ? <span className="gamehub-space__sync">Last sync {lastSyncedLabel}</span> : null}
        </div>
      </header>

      {showOnboarding ? (
        <SteamOnboarding
          onSaveSteamId={saveSteamId}
          onSkip={() => {
            setGameHubState({ profile: { onboardingDismissed: true } });
            setShowOnboarding(false);
          }}
        />
      ) : null}

      {heroGame ? (
        <section className="gamehub-hero">
          <div className="gamehub-hero__backdrop">
            {heroGame.headerUrl ? <img src={heroGame.headerUrl} alt={heroGame.name} /> : null}
          </div>
          <div className="gamehub-hero__content">
            <p className="gamehub-hero__badge">
              {favoriteSet.has(heroGame.id) ? 'Featured Favorite' : 'Continue Adventure'}
            </p>
            <h3>{heroGame.name}</h3>
            <p>{formatPlaytime(heroGame.playtimeForever)}</p>
            <div className="gamehub-hero__actions">
              <button type="button" className="gamehub-btn gamehub-btn--primary" onClick={() => handleLaunchGame(heroGame)}>
                Play now
              </button>
              <button type="button" className="gamehub-btn gamehub-btn--ghost" onClick={() => toggleFavorite(heroGame.id)}>
                {favoriteSet.has(heroGame.id) ? 'Unfavorite' : 'Favorite'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="gamehub-layout">
        <div className="gamehub-layout__main">
          <Shelf
            title="Recently Played"
            games={shelves.recentlyPlayed}
            favorites={favoriteSet}
            onToggleFavorite={toggleFavorite}
            onSelect={setSelectedGame}
            onLaunch={handleLaunchGame}
          />
          <Shelf
            title="Most Played"
            games={shelves.mostPlayed}
            favorites={favoriteSet}
            onToggleFavorite={toggleFavorite}
            onSelect={setSelectedGame}
            onLaunch={handleLaunchGame}
          />
          <Shelf
            title="Installed Collection"
            games={shelves.installed}
            favorites={favoriteSet}
            onToggleFavorite={toggleFavorite}
            onSelect={setSelectedGame}
            onLaunch={handleLaunchGame}
          />
          <Shelf
            title="Ready To Launch"
            games={shelves.readyToLaunch}
            favorites={favoriteSet}
            onToggleFavorite={toggleFavorite}
            onSelect={setSelectedGame}
            onLaunch={handleLaunchGame}
          />
        </div>

        <aside className="gamehub-layout__side">
          <section className="gamehub-panel">
            <h4>Favorites Showcase</h4>
            {shelves.premiumFavorites.length ? (
              <div className="gamehub-favorites">
                {shelves.premiumFavorites.map((game) => (
                  <button key={game.id} type="button" className="gamehub-favorite-tile" onClick={() => setSelectedGame(game)}>
                    <span>{game.name}</span>
                    <small>{formatPlaytime(game.playtimeForever)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="gamehub-muted">Favorite games to unlock your premium showcase.</p>
            )}
          </section>

          <section className="gamehub-panel">
            <h4>Collection Pulse</h4>
            <div className="gamehub-stats">
              <div>
                <strong>{shelves.installed.length}</strong>
                <span>Installed</span>
              </div>
              <div>
                <strong>{shelves.bySource.steam.length}</strong>
                <span>Steam</span>
              </div>
              <div>
                <strong>{shelves.bySource.epic.length}</strong>
                <span>Epic</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {selectedGame ? (
        <div className="gamehub-detail">
          <div className="gamehub-detail__inner">
            <h4>{selectedGame.name}</h4>
            <p>{selectedGame.source.toUpperCase()} • {formatPlaytime(selectedGame.playtimeForever)}</p>
            <div className="gamehub-detail__actions">
              <button type="button" className="gamehub-btn gamehub-btn--primary" onClick={() => handleLaunchGame(selectedGame)}>
                Launch
              </button>
              <button type="button" className="gamehub-btn gamehub-btn--ghost" onClick={() => toggleFavorite(selectedGame.id)}>
                {favoriteSet.has(selectedGame.id) ? 'Unfavorite' : 'Favorite'}
              </button>
              <button type="button" className="gamehub-btn gamehub-btn--secondary" onClick={() => setSelectedGame(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
