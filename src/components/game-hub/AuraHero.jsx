import React, { useEffect, useMemo } from 'react';
import { m, useMotionValue, useTransform } from 'framer-motion';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import { formatDiskSize, formatLastPlayed, formatPlaytime } from './hubData';
import GameCardContextMenu from './GameCardContextMenu';
import WButton from '../../ui/WButton';

const MotionDiv = m.div;

function hoursShort(minutes) {
  const m = Number(minutes || 0);
  return m > 0 ? `${Math.round(m / 60).toLocaleString()}h` : '—';
}

function buildHeroStats(game) {
  if (!game) return [];
  const stats = [];

  stats.push({
    key: 'playtime',
    label: 'Total time',
    value: hoursShort(game.playtimeForever),
  });

  if (game.source === 'steam') {
    stats.push({
      key: 'recent',
      label: 'Last 2 weeks',
      value: hoursShort(game.playtimeRecent),
    });
    stats.push({
      key: 'last',
      label: 'Last played',
      value: formatLastPlayed(game.lastPlayedAt),
    });
  }

  const disk = formatDiskSize(game);
  if (game.installed && disk) {
    stats.push({ key: 'disk', label: 'Install size', value: disk });
  }

  stats.push({
    key: 'state',
    label: 'Status',
    value: game.installed ? 'Installed' : 'Not installed',
  });

  stats.push({
    key: 'src',
    label: 'Source',
    value: game.source === 'steam' ? 'Steam' : 'Epic',
  });

  return stats;
}

export default function AuraHero({
  floatingUi = false,
  compact = false,
  /** Scroll-linked 0–1 when Game Hub uses dock morph; null for legacy compact bar layout. */
  morphProgress = null,
  effectsEnabled: _effectsEnabled = true,
  selectedGameId = null,
  heroGame,
  /** Shown only when sync fails — no “Steam synced” marketing badge */
  heroNotice = null,
  hasSteamId,
  hasFavorites,
  railGames,
  onLaunchGame,
  onSelectGame,
  onHeroPreview,
  /** Owned by GameHubSpace so hero and backdrop stay in sync. */
  heroMediaBaseUrl = null,
  heroMediaOverlayUrl = null,
  heroMediaOverlayOpacity = 0,
  onHeroMediaOverlayTransitionEnd,
}) {
  const isMorph = morphProgress != null;

  const baseUrl = heroMediaBaseUrl;
  const overlayUrl = heroMediaOverlayUrl;
  const overlayOpacity = heroMediaOverlayOpacity;
  const onOverlayTransitionEnd = onHeroMediaOverlayTransitionEnd;

  const statItems = useMemo(() => buildHeroStats(heroGame), [heroGame]);
  const dockStatItems = useMemo(() => statItems.slice(0, 4), [statItems]);
  const showSteamApiKeyHint =
    typeof heroNotice === 'string' && heroNotice.toLowerCase().includes('steam web api key is not configured');

  const morphFallback = useMotionValue(0);
  const mp = morphProgress ?? morphFallback;

  const bannerOpacity = useTransform(mp, [0, 0.38], [1, 0], { clamp: true });
  const dockOpacity = useTransform(mp, [0.62, 1], [0, 1], { clamp: true });
  const railOpacity = useTransform(mp, [0.4, 0.72], [1, 0], { clamp: true });

  useEffect(() => {
    const preload = overlayUrl || baseUrl;
    if (!preload) return;
    const img = new Image();
    img.src = preload;
  }, [baseUrl, overlayUrl]);

  const titlePanelInner = (
    <>
      {heroNotice ? (
        <p className="aura-hub-hero__notice" role="status">
          {heroNotice}
        </p>
      ) : null}
      {showSteamApiKeyHint ? (
        <p className="aura-hub-hero__subline">
          Sign in on Steam, open your profile page, and copy the ID from the URL.
        </p>
      ) : null}
      <div className="aura-hub-hero__headline-wrap">
        <h2 className="aura-hub-hero__headline">{heroGame?.name || 'Your Game Hub is ready'}</h2>
        {!compact && !isMorph && heroGame?.name ? <span className="aura-hub-hero__headline-accent" aria-hidden /> : null}
      </div>
      {heroGame && statItems.length > 0 && !compact && !isMorph ? (
        <ul className="aura-hub-hero__stats" aria-label="Game stats">
          {statItems.map((s) => (
            <li key={s.key} className="aura-hub-hero__stat">
              <span className="aura-hub-hero__stat-label">{s.label}</span>
              <span className="aura-hub-hero__stat-value">{s.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!heroGame ? (
        <p className="aura-hub-hero__subline">Pick a game from your library to get started.</p>
      ) : compact && !isMorph ? (
        <p className="aura-hub-hero__subline aura-hub-hero__subline--compact">
          {formatPlaytime(heroGame.playtimeForever)}
          {heroGame.source === 'steam' ? ` · ${heroGame.installed ? 'Installed' : 'Not installed'}` : null}
        </p>
      ) : null}
      {!hasSteamId || showSteamApiKeyHint ? (
        <button
          type="button"
          className="aura-hub-btn aura-hub-btn--ghost aura-hub-hero__settings-btn"
          onClick={() => openSettingsToTab(SETTINGS_TAB_ID.GAMEHUB)}
        >
          Open Game Hub Settings
        </button>
      ) : null}
    </>
  );

  const dockPanel = heroGame ? (
    <div className="aura-hub-hero__dock-inner">
      <div className="aura-hub-hero__dock-head">
        <p className="aura-hub-hero__dock-eyebrow playful-system-label">Now previewing</p>
        <h3 className="aura-hub-hero__dock-title">{heroGame.name}</h3>
      </div>
      {dockStatItems.length > 0 ? (
        <ul className="aura-hub-hero__dock-stats" aria-label="Game stats">
          {dockStatItems.map((s) => (
            <li key={s.key} className="aura-hub-hero__dock-stat">
              <span className="aura-hub-hero__dock-stat-label">{s.label}</span>
              <span className="aura-hub-hero__dock-stat-value">{s.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {heroGame.launchPath ? (
        <WButton
          type="button"
          variant="primary"
          fullWidth
          className="aura-hub-hero__dock-launch"
          onClick={() => onLaunchGame(heroGame)}
        >
          Launch
        </WButton>
      ) : null}
    </div>
  ) : (
    <div className="aura-hub-hero__dock-inner">
      <p className="aura-hub-hero__dock-empty">Select a game to see details here while you browse.</p>
    </div>
  );

  return (
    <header
      className={`aura-hub-hero ${floatingUi ? 'aura-hub-hero--floating' : ''} ${compact && !isMorph ? 'aura-hub-hero--compact' : ''} ${isMorph ? 'aura-hub-hero--morph' : ''}`}
    >
      <div className="aura-hub-hero__media-stack" aria-hidden>
        {baseUrl ? (
          <div
            className="aura-hub-hero__media-layer aura-hub-hero__media-layer--base"
            style={{ backgroundImage: `url('${baseUrl}')` }}
          />
        ) : null}
        {overlayUrl ? (
          <div
            key={overlayUrl}
            className="aura-hub-hero__media-layer aura-hub-hero__media-layer--overlay"
            style={{
              backgroundImage: `url('${overlayUrl}')`,
              opacity: overlayOpacity,
            }}
            onTransitionEnd={onOverlayTransitionEnd}
          />
        ) : null}
      </div>

      <div className="aura-hub-hero__content">
        {isMorph ? (
          <>
            <MotionDiv className="aura-hub-hero__banner-layer" style={{ opacity: bannerOpacity }}>
              <div className="aura-hub-hero__meta-tilt">{titlePanelInner}</div>
            </MotionDiv>
            <MotionDiv className="aura-hub-hero__dock-layer" style={{ opacity: dockOpacity }}>
              {dockPanel}
            </MotionDiv>
          </>
        ) : (
          <div className="aura-hub-hero__meta-tilt">{titlePanelInner}</div>
        )}
      </div>

      {isMorph ? (
        <MotionDiv className="aura-hub-rail" style={{ opacity: railOpacity }}>
          {hasFavorites ? (
            railGames.map((game) => {
              const isSelected = selectedGameId != null && String(selectedGameId) === String(game.id);
              return (
                <GameCardContextMenu key={game.id} game={game}>
                  <article
                    className={`aura-hub-rail__tile ${isSelected ? 'aura-hub-rail__tile--selected' : ''}`}
                    onMouseEnter={() => {
                      onSelectGame(game.id);
                      onHeroPreview?.(game);
                    }}
                    onMouseLeave={() => onHeroPreview?.(null)}
                  >
                    <button
                      type="button"
                      className="aura-hub-rail__launch"
                      onClick={() => onLaunchGame(game)}
                      onFocus={() => {
                        onSelectGame(game.id);
                        onHeroPreview?.(game);
                      }}
                      title={game.name ? `Play ${game.name}` : 'Play'}
                      aria-label={game.name ? `Play ${game.name}` : 'Play game'}
                    >
                      {game.imageUrl ? (
                        <span className="aura-hub-rail__art" style={{ backgroundImage: `url('${game.imageUrl}')` }} />
                      ) : (
                        <span className="aura-hub-rail__art aura-hub-rail__art--empty">{game.name || 'Game'}</span>
                      )}
                    </button>
                  </article>
                </GameCardContextMenu>
              );
            })
          ) : (
            <div className="aura-hub-rail__empty">
              No favorites in Wee yet. Right-click a game and choose Add to favorites (up to four on this rail, by recent
              activity).
            </div>
          )}
        </MotionDiv>
      ) : (
        <div className="aura-hub-rail">
          {hasFavorites ? (
            railGames.map((game) => {
              const isSelected = selectedGameId != null && String(selectedGameId) === String(game.id);
              return (
                <GameCardContextMenu key={game.id} game={game}>
                  <article
                    className={`aura-hub-rail__tile ${isSelected ? 'aura-hub-rail__tile--selected' : ''}`}
                    onMouseEnter={() => {
                      onSelectGame(game.id);
                      onHeroPreview?.(game);
                    }}
                    onMouseLeave={() => onHeroPreview?.(null)}
                  >
                    <button
                      type="button"
                      className="aura-hub-rail__launch"
                      onClick={() => onLaunchGame(game)}
                      onFocus={() => {
                        onSelectGame(game.id);
                        onHeroPreview?.(game);
                      }}
                      title={game.name ? `Play ${game.name}` : 'Play'}
                      aria-label={game.name ? `Play ${game.name}` : 'Play game'}
                    >
                      {game.imageUrl ? (
                        <span className="aura-hub-rail__art" style={{ backgroundImage: `url('${game.imageUrl}')` }} />
                      ) : (
                        <span className="aura-hub-rail__art aura-hub-rail__art--empty">{game.name || 'Game'}</span>
                      )}
                    </button>
                  </article>
                </GameCardContextMenu>
              );
            })
          ) : (
            <div className="aura-hub-rail__empty">
              No favorites in Wee yet. Right-click a game and choose Add to favorites (up to four on this rail, by recent
              activity).
            </div>
          )}
        </div>
      )}
    </header>
  );
}
