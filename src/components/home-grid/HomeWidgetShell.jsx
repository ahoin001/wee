import React, { forwardRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { WeeGlassPill } from '../../ui/wee';
import {
  DEFAULT_HOME_WIDGET_SURFACE,
  normalizeHomeWidgetSurface,
} from '../../utils/homeWidgetSurface';
import {
  homeWidgetGlassCssVars,
  normalizeHomeWidgetGlass,
} from '../../utils/homeWidgetGlass';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

/**
 * Shared home-widget outer shell.
 * - clear: floating default — no plate; wallpaper shows through
 * - glass: light frost/tint (global `ui.homeWidgetGlass`)
 * - basic: solid WeeGlassPill card chrome
 */
const HomeWidgetShell = forwardRef(function HomeWidgetShell(
  {
    surface = DEFAULT_HOME_WIDGET_SURFACE,
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
  const { glassRaw, lowPowerMode } = useConsolidatedAppStore(
    useShallow((state) => ({
      glassRaw: state.ui?.homeWidgetGlass,
      lowPowerMode: Boolean(state.ui?.lowPowerMode),
    }))
  );

  useEffect(() => {
    useConsolidatedAppStore.getState().actions.ensureHomeWidgetSurfaceMigration?.();
  }, []);

  const glassVars = useMemo(
    () => homeWidgetGlassCssVars(normalizeHomeWidgetGlass(glassRaw), { lowPower: lowPowerMode }),
    [glassRaw, lowPowerMode]
  );

  const selectedRing = selected
    ? 'ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-[hsl(var(--surface-primary)/0)]'
    : '';

  const content = (
    <div className="home-widget-shell__content relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col">
      {children}
    </div>
  );

  if (mode === 'clear') {
    return (
      <div
        ref={ref}
        role={role}
        aria-label={ariaLabel}
        onClick={onClick}
        data-home-widget-surface="clear"
        className={[
          'home-widget-shell',
          'home-widget-shell--clear',
          'relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.35rem]',
          'border-0 bg-transparent shadow-none',
          selectedRing,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {content}
      </div>
    );
  }

  if (mode === 'glass') {
    return (
      <div
        ref={ref}
        role={role}
        aria-label={ariaLabel}
        onClick={onClick}
        style={glassVars}
        data-home-widget-surface="glass"
        className={[
          'home-widget-shell',
          'home-widget-shell--glass',
          'home-widget-liquid-glass',
          'relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.35rem]',
          selectedRing,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        <span className="home-widget-liquid-glass__shine pointer-events-none absolute inset-0" aria-hidden />
        <span className="home-widget-liquid-glass__edge pointer-events-none absolute inset-0" aria-hidden />
        {content}
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
      data-home-widget-surface="basic"
      className={[
        'home-widget-shell',
        'home-widget-shell--basic',
        'relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.35rem]',
        selectedRing,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {content}
    </WeeGlassPill>
  );
});

HomeWidgetShell.displayName = 'HomeWidgetShell';

HomeWidgetShell.propTypes = {
  surface: PropTypes.oneOf(['basic', 'glass', 'clear']),
  selected: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  role: PropTypes.string,
  'aria-label': PropTypes.string,
};

export default HomeWidgetShell;
