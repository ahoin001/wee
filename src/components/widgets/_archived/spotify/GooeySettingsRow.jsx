import React from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';

/**
 * Hub-widget SettingsRow shell: rounded card with hover nudge — wrap WToggle / Slider / controls.
 */
function GooeySettingsRow({ children, reducedMotion }) {
  const hover = reducedMotion ? {} : { whileHover: { scale: 1.01, x: 5 } };
  return (
    <m.div
      {...hover}
      className="mb-3 w-full rounded-3xl border-2 p-5"
      style={{
        backgroundColor: 'var(--spotify-gooey-surface)',
        borderColor: 'var(--spotify-gooey-border)',
      }}
    >
      {children}
    </m.div>
  );
}

GooeySettingsRow.propTypes = {
  children: PropTypes.node,
  reducedMotion: PropTypes.bool,
};

GooeySettingsRow.defaultProps = {
  children: null,
  reducedMotion: false,
};

export default GooeySettingsRow;
