/**
 * Home-grid Steam Games tile — Recent / Most Played / Favorites via `slot.widget.mode`.
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import SteamGamesGlanceSlot from './SteamGamesGlanceSlot';

const STEAM_GAMES_MODES = new Set(['recent', 'mostPlayed', 'favorites']);

/**
 * @param {unknown} raw
 * @returns {'recent' | 'mostPlayed' | 'favorites'}
 */
export function normalizeSteamGamesMode(raw) {
  const mode = typeof raw === 'string' ? raw.trim() : '';
  if (STEAM_GAMES_MODES.has(mode)) return mode;
  return 'mostPlayed';
}

function SteamGamesSlot(props) {
  const variant = useMemo(
    () => normalizeSteamGamesMode(props.slot?.widget?.mode),
    [props.slot?.widget?.mode]
  );
  return <SteamGamesGlanceSlot variant={variant} {...props} />;
}

SteamGamesSlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(SteamGamesSlot);
