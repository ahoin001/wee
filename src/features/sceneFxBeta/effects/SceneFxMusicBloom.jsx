/**
 * BETA Scene FX — subtle primary wash while Now Playing is active.
 * Removable: delete this file + unmount from SceneFxBetaRoot.
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';

function SceneFxMusicBloom({ intensity = 0.32 }) {
  const { isPlaying, hasTrack } = useConsolidatedAppStore(
    useShallow((state) => ({
      isPlaying: Boolean(state.nowPlaying?.isPlaying),
      hasTrack: Boolean(state.nowPlaying?.trackName),
    }))
  );

  const active = isPlaying && hasTrack;
  const bloomAlpha = useMemo(
    () => (Math.min(1, Math.max(0, Number(intensity) || 0)) * 0.28).toFixed(3),
    [intensity]
  );

  return (
    <div
      className={`scene-fx-music-bloom${active ? ' scene-fx-music-bloom--active scene-fx-music-bloom--pulse' : ''}`}
      aria-hidden
      style={{ '--scene-fx-bloom-alpha': bloomAlpha }}
    />
  );
}

SceneFxMusicBloom.propTypes = {
  intensity: PropTypes.number,
};

export default React.memo(SceneFxMusicBloom);
