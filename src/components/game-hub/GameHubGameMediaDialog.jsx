import React from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { WeeModalShell, WeeButton } from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import GameHubGameArtPanel from './GameHubGameArtPanel';

/**
 * Change cover art for a Game Hub game — Wee shell + same art flow as Configure Channel → Setup → Channel art.
 * Persists via `setGameHubCustomArt` (passed through provider as onApplyArt).
 */
function GameHubGameMediaDialog({ open, onOpenChange, game, onApplyArt }) {
  const customEntry = useConsolidatedAppStore(
    useShallow((state) => {
      const id = game?.id;
      if (!id) return undefined;
      return state.gameHub?.ui?.customArtByGameId?.[id];
    })
  );

  const hasCustomArt = Boolean(customEntry?.url);
  const isSteam = game?.source === 'steam';

  return (
    <WeeModalShell
      isOpen={open}
      onClose={() => onOpenChange(false)}
      headerTitle={game?.name ? `Art — ${game.name}` : 'Game art'}
      showRail={false}
      maxWidth="min(960px, 96vw)"
      panelClassName="min-h-0"
      footerContent={({ handleClose }) => (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {hasCustomArt ? (
            <WeeButton
              type="button"
              variant="secondary"
              onClick={() => {
                if (game?.id) onApplyArt(game.id, null);
              }}
            >
              {isSteam ? 'Reset to default Steam artwork' : 'Reset to default artwork'}
            </WeeButton>
          ) : null}
          <WeeButton type="button" variant="primary" onClick={handleClose}>
            Done
          </WeeButton>
        </div>
      )}
    >
      {game?.id ? (
        <GameHubGameArtPanel
          game={game}
          enabled={open}
          customEntry={customEntry}
          onApplyArt={onApplyArt}
        />
      ) : null}
    </WeeModalShell>
  );
}

GameHubGameMediaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  game: PropTypes.object,
  onApplyArt: PropTypes.func.isRequired,
};

export default React.memo(GameHubGameMediaDialog);
