/**
 * Floating shelf title for Steam Home widgets — not a grid kicker.
 */
import React from 'react';
import PropTypes from 'prop-types';

function SteamWidgetHeading({
  eyebrow = 'Steam',
  title,
  icon: Icon = null,
  compact = false,
}) {
  return (
    <div className="flex shrink-0 items-end justify-between gap-2 px-0.5">
      <div className="min-w-0">
        <p className="m-0 text-[8px] font-black uppercase tracking-[0.22em] text-[hsl(var(--primary))]">
          {eyebrow}
        </p>
        <h3
          className={[
            'm-0 truncate font-black uppercase italic leading-none tracking-tight text-[hsl(var(--text-primary))] home-widget-float-type',
            compact ? 'text-[11px]' : 'text-[13px] sm:text-sm',
          ].join(' ')}
        >
          {title}
        </h3>
      </div>
      {Icon ? (
        <Icon
          size={compact ? 14 : 16}
          strokeWidth={2.5}
          className="mb-0.5 shrink-0 text-[hsl(var(--text-tertiary))]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

SteamWidgetHeading.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  compact: PropTypes.bool,
};

export default React.memo(SteamWidgetHeading);
