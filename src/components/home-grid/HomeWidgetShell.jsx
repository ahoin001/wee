import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { WeeGlassPill } from '../../ui/wee';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';

/**
 * Shared home-widget outer shell — Glass (WeeGlassPill) or Clear (wallpaper shows through).
 * All placeable widgets should wrap content here so Edit Home surface toggle applies uniformly.
 */
const HomeWidgetShell = forwardRef(function HomeWidgetShell(
  {
    surface = 'glass',
    selected = false,
    className = '',
    children,
    onClick,
    role = 'group',
    'aria-label': ariaLabel,
    ...rest
  },
  ref
) {
  const mode = normalizeHomeWidgetSurface(surface);
  const selectedRing = selected
    ? 'ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-[hsl(var(--surface-primary)/0)]'
    : '';

  if (mode === 'clear') {
    return (
      <div
        ref={ref}
        role={role}
        aria-label={ariaLabel}
        onClick={onClick}
        className={[
          'relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.35rem]',
          'border border-[hsl(var(--border-primary)/0.18)] bg-transparent',
          selectedRing,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <WeeGlassPill
      ref={ref}
      as="div"
      role={role}
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        'relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.35rem]',
        selectedRing,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </WeeGlassPill>
  );
});

HomeWidgetShell.displayName = 'HomeWidgetShell';

HomeWidgetShell.propTypes = {
  surface: PropTypes.oneOf(['glass', 'clear']),
  selected: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  role: PropTypes.string,
  'aria-label': PropTypes.string,
};

export default HomeWidgetShell;
