import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import WInput from '../../ui/WInput';
import { WeeButton } from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import AuraHubModalFrame from './AuraHubModalFrame';

const EMPTY_HIDDEN_IDS = Object.freeze([]);

function steamAppIdFromGameId(gameId) {
  const id = String(gameId || '');
  return id.startsWith('steam-') ? id.slice('steam-'.length) : id;
}

/**
 * Manage Steam titles hidden from Game Hub (search + unhide).
 * Combines resolved hub catalog rows with persisted ids for stale/fallback entries.
 */
export default function GameHubHiddenGamesDialog({ open, onOpenChange, hiddenGames = [] }) {
  const { hiddenGameIds, unhideGameHubGame, unhideAllGameHubGames } = useConsolidatedAppStore(
    useShallow((state) => ({
      hiddenGameIds: Array.isArray(state.gameHub?.ui?.hiddenGameIds)
        ? state.gameHub.ui.hiddenGameIds
        : EMPTY_HIDDEN_IDS,
      unhideGameHubGame: state.actions.unhideGameHubGame,
      unhideAllGameHubGames: state.actions.unhideAllGameHubGames,
    }))
  );

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const rows = useMemo(() => {
    const byId = new Map(
      (Array.isArray(hiddenGames) ? hiddenGames : []).filter((g) => g?.id).map((g) => [String(g.id), g])
    );
    const ids = Array.isArray(hiddenGameIds) ? hiddenGameIds.map(String).filter(Boolean) : [];
    return ids.map((id) => {
      const game = byId.get(id);
      if (game) {
        return {
          id,
          name: game.name || `Steam app ${steamAppIdFromGameId(id)}`,
          appId: game.appId || steamAppIdFromGameId(id),
          imageUrl: game.imageUrl || null,
          resolved: true,
        };
      }
      const appId = steamAppIdFromGameId(id);
      return {
        id,
        name: `Steam app ${appId}`,
        appId,
        imageUrl: appId
          ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`
          : null,
        resolved: false,
      };
    });
  }, [hiddenGameIds, hiddenGames]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        String(row.name || '').toLowerCase().includes(q) ||
        String(row.appId || '').toLowerCase().includes(q) ||
        String(row.id || '').toLowerCase().includes(q)
    );
  }, [query, rows]);

  const handleUnhideAll = useCallback(() => {
    unhideAllGameHubGames();
  }, [unhideAllGameHubGames]);

  return (
    <AuraHubModalFrame
      open={open}
      onOpenChange={onOpenChange}
      ariaLabelledBy="hub-hidden-games-title"
      panelClassName="aura-hub-modal--hidden-games"
    >
      <div className="aura-hub-modal__header">
        <h2 id="hub-hidden-games-title" className="aura-hub-modal__title">
          Hidden games
        </h2>
        <button type="button" className="aura-hub-modal__close" onClick={close} aria-label="Close">
          ×
        </button>
      </div>
      <p className="aura-hub-modal__hint">
        Hidden Steam titles stay out of the hub until you unhide them. Favorites, art, and collections are kept.
      </p>

      {rows.length > 0 ? (
        <div className="aura-hub-hidden-games__search">
          <WInput
            variant="wee"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hidden games…"
            aria-label="Search hidden games"
          />
        </div>
      ) : null}

      <ul className="aura-hub-modal__list aura-hub-hidden-games__list">
        {rows.length === 0 ? (
          <li className="aura-hub-modal__empty">
            Right-click a Steam game and choose Hide from Game Hub.
          </li>
        ) : filteredRows.length === 0 ? (
          <li className="aura-hub-modal__empty">No hidden games match your search.</li>
        ) : (
          filteredRows.map((row) => (
            <li key={row.id} className="aura-hub-hidden-games__row">
              <div className="aura-hub-hidden-games__thumb" aria-hidden>
                {row.imageUrl ? (
                  <img src={row.imageUrl} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span className="aura-hub-hidden-games__thumb-fallback" />
                )}
              </div>
              <div className="aura-hub-hidden-games__meta">
                <span className="aura-hub-hidden-games__name">{row.name}</span>
                <span className="aura-hub-hidden-games__appid">Steam app {row.appId}</span>
              </div>
              <WeeButton
                type="button"
                variant="secondary"
                onClick={() => unhideGameHubGame(row.id)}
              >
                Unhide
              </WeeButton>
            </li>
          ))
        )}
      </ul>

      <div className="aura-hub-modal__footer">
        {rows.length > 0 ? (
          <WeeButton type="button" variant="secondary" onClick={handleUnhideAll}>
            Unhide all
          </WeeButton>
        ) : null}
        <WeeButton type="button" variant="primary" onClick={close}>
          Done
        </WeeButton>
      </div>
    </AuraHubModalFrame>
  );
}

GameHubHiddenGamesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  hiddenGames: PropTypes.arrayOf(PropTypes.object),
};
