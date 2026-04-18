import React from 'react';
import PropTypes from 'prop-types';

/**
 * Top-of-panel title + subheading — matches Dock / Channels & layout settings chrome.
 */
function SettingsTabPageHeader({ title, subtitle, className }) {
  return (
    <header className={[className || 'mb-8'].filter(Boolean).join(' ')}>
      <h1 className="m-0 text-[clamp(1.45rem,4vw,2rem)] font-black uppercase italic leading-none tracking-tight text-[hsl(var(--text-primary))]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--text-secondary))]">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

SettingsTabPageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  className: PropTypes.string,
};

SettingsTabPageHeader.defaultProps = {
  subtitle: null,
  className: null,
};

export default SettingsTabPageHeader;
