import React, { forwardRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { WeeGlassPill } from '../../ui/wee';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import {
  homeWidgetGlassCssVars,
  normalizeHomeWidgetGlass,
} from '../../utils/homeWidgetGlass';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

/**
 * Shared home-widget outer shell.
 * - basic: WeeGlassPill chrome
 * - glass: liquid see-through (global `ui.homeWidgetGlass` — all glass tiles stay in harmony)
 * - clear: no fill
 */
const HomeWidgetShell = forwardRef(function HomeWidgetShell(
  {
    surface = 'basic',
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

  if (mode === 'glass') {
    return (
      <div
        ref={ref}
        role={role}
        aria-label={ariaLabel}
        onClick={onClick}
        style={glassVars}
        className={[
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
        <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
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
  surface: PropTypes.oneOf(['basic', 'glass', 'clear']),
  selected: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  role: PropTypes.string,
  'aria-label': PropTypes.string,
};

export default HomeWidgetShell;
