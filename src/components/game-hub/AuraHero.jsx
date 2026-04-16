import React, { useEffect, useMemo } from 'react';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import {
  formatDiskSize,
  formatLastPlayed,
  formatPlaytime,
} from './hubData';
import { useHeroMediaCrossfade } from './useHeroMediaCrossfade';
import GameCardContextMenu from './GameCardContextMenu';

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
  effectsEnabled = true,
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
}) {
  const heroArtUrl = heroGame?.headerUrl || heroGame?.imageUrl || null;
  const transitionsOn = effectsEnabled;

  const { baseUrl, overlayUrl, overlayOpacity, onOverlayTransitionEnd } = useHeroMediaCrossfade(
    heroArtUrl,
    transitionsOn
  );

  const statItems = useMemo(() => buildHeroStats(heroGame), [heroGame]);

  useEffect(() => {
    if (!heroArtUrl) return;
    const img = new Image();
    img.src = heroArtUrl;
  }, [heroArtUrl]);

  return (
    <header
      className={`aura-hub-hero ${floatingUi ? 'aura-hub-hero--floating' : ''} ${compact ? 'aura-hub-hero--compact' : ''}`}
    >
      <div className="aura-hub-hero__media-stack" aria-hidden>
        {baseUrl ? (
          <div className="aura-hub-hero__media-layer aura-hub-hero__media-layer--base" style={{ backgroundImage: `url('${baseUrl}')` }} />
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
        <div className="aura-hub-hero__meta-tilt">
          <div className="aura-hub-hero__title-panel">
            {heroNotice ? (
              <p className="aura-hub-hero__notice" role="status">
                {heroNotice}
              </p>
            ) : null}
            <div className="aura-hub-hero__headline-wrap">
              <h2 className="aura-hub-hero__headline">{heroGame?.name || 'Your Game Hub is ready'}</h2>
              {!compact && heroGame?.name ? <span className="aura-hub-hero__headline-accent" aria-hidden /> : null}
            </div>
            {heroGame && statItems.length > 0 && !compact ? (
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
            ) : compact ? (
              <p className="aura-hub-hero__subline aura-hub-hero__subline--compact">
                {formatPlaytime(heroGame.playtimeForever)}
                {heroGame.source === 'steam' ? ` · ${heroGame.installed ? 'Installed' : 'Not installed'}` : null}
              </p>
            ) : null}
            {!hasSteamId ? (
              <button
                type="button"
                className="aura-hub-btn aura-hub-btn--ghost aura-hub-hero__settings-btn"
                onClick={() => openSettingsToTab(SETTINGS_TAB_ID.GAMEHUB)}
              >
                Connect Steam in Settings
              </button>
            ) : null}
          </div>
        </div>
      </div>
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
    </header>
  );
}
