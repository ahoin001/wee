/**
 * Floating shelf title for Steam Home widgets — not a grid kicker.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { normalizeHomeWidgetTextSize } from '../../utils/homeWidgetSurface';

function resolveTitleClass(compact, textSize) {
  const size = normalizeHomeWidgetTextSize(textSize);
  if (size === 'sm') {
    return compact ? 'text-[10px]' : 'text-[11px] sm:text-xs';
  }
  if (size === 'md') {
    return compact ? 'text-[12px]' : 'text-[13px] sm:text-sm';
  }
  if (size === 'lg') {
    return compact ? 'text-[13px]' : 'text-sm sm:text-base';
  }
  return compact ? 'text-[11px]' : 'text-[13px] sm:text-sm';
}

function resolveEyebrowClass(textSize) {
  const size = normalizeHomeWidgetTextSize(textSize);
  if (size === 'sm') return 'text-[7px]';
  if (size === 'lg') return 'text-[9px]';
  return 'text-[8px]';
}

function SteamWidgetHeading({
  eyebrow = 'Steam',
  title,
  icon: Icon = null,
  compact = false,
  textSize = null,
}) {
  return (
    <div className="flex shrink-0 items-end justify-between gap-2 px-0.5">
      <div className="min-w-0">
        <p
          className={`m-0 font-black uppercase tracking-[0.22em] text-[var(--hw-text-accent)] ${resolveEyebrowClass(textSize)}`}
        >
          {eyebrow}
        </p>
        <h3
          className={[
            'm-0 truncate font-black uppercase italic leading-none tracking-tight text-[var(--hw-text-primary)] home-widget-float-type',
            resolveTitleClass(compact, textSize),
          ].join(' ')}
        >
          {title}
        </h3>
      </div>
      {Icon ? (
        <Icon
          size={compact ? 14 : 16}
          strokeWidth={2.5}
          className="mb-0.5 shrink-0 text-[var(--hw-text-tertiary)]"
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
  textSize: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default React.memo(SteamWidgetHeading);
