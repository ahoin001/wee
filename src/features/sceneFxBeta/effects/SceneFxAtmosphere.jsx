/**
 * BETA Scene FX — vignette + soft light shafts.
 * Removable: delete this file + CSS block + unmount from SceneFxBetaRoot.
 */
import React from 'react';
import PropTypes from 'prop-types';

function SceneFxAtmosphere({ vignette = 0.38, shafts = 0.28 }) {
  const vignetteAlpha = (Math.min(1, Math.max(0, vignette)) * 0.55).toFixed(3);
  const shaftsOpacity = (Math.min(1, Math.max(0, shafts)) * 0.55).toFixed(3);

  return (
    <div
      className="scene-fx-atmosphere"
      aria-hidden
      style={{
        '--scene-fx-vignette-alpha': vignetteAlpha,
        '--scene-fx-shafts-opacity': shaftsOpacity,
      }}
    >
      <div className="scene-fx-atmosphere__vignette" />
      {Number(shafts) > 0.02 ? <div className="scene-fx-atmosphere__shafts" /> : null}
    </div>
  );
}

SceneFxAtmosphere.propTypes = {
  vignette: PropTypes.number,
  shafts: PropTypes.number,
};

export default React.memo(SceneFxAtmosphere);
