import React, { forwardRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { WeeGlassPill, WeeLayoutActiveDisc } from '../../ui/wee';
import {
  DEFAULT_HOME_WIDGET_SURFACE,
  normalizeHomeWidgetSurface,
  normalizeHomeWidgetTextColor,
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
 * - brandTone `steam` + basic: Steam navy/cyan token remap (see design-system.css)
 */
const HomeWidgetShell = forwardRef(function HomeWidgetShell(
  {
    surface = DEFAULT_HOME_WIDGET_SURFACE,
    brandTone = null,
    textColor = null,
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
  const steamBasic = brandTone === 'steam' && mode === 'basic';
  const customTextColor = normalizeHomeWidgetTextColor(textColor);
  const osReducedMotion = useReducedMotion();
  const selectionDisc = selected ? (
    <WeeLayoutActiveDisc
      layoutId="homeArrangeSelection"
      className="!rounded-[1.35rem] !bg-[hsl(var(--primary)/0.16)] !shadow-[var(--shadow-selection-glow)]"
      reducedMotion={Boolean(osReducedMotion)}
    />
  ) : null;
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

  const textVars = useMemo(
    () => (customTextColor ? { '--hw-text': customTextColor } : undefined),
    [customTextColor]
  );
  const textAttr = customTextColor ? 'custom' : undefined;

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
        style={textVars}
        data-home-widget-surface="clear"
        data-widget-text={textAttr}
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
        {selectionDisc}
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
        style={textVars ? { ...glassVars, ...textVars } : glassVars}
        data-home-widget-surface="glass"
        data-widget-text={textAttr}
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
        {selectionDisc}
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
      style={textVars}
      data-home-widget-surface="basic"
      data-widget-text={textAttr}
      data-home-widget-brand={steamBasic ? 'steam' : undefined}
      className={[
        'home-widget-shell',
        'home-widget-shell--basic',
        steamBasic ? 'home-widget-shell--steam' : '',
        'relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.35rem]',
        selectedRing,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {selectionDisc}
      {content}
    </WeeGlassPill>
  );
});

HomeWidgetShell.displayName = 'HomeWidgetShell';

HomeWidgetShell.propTypes = {
  surface: PropTypes.oneOf(['basic', 'glass', 'clear']),
  brandTone: PropTypes.oneOf(['steam']),
  /** Optional per-tile text color (#rrggbb) — flows to `--hw-text-*` for children. */
  textColor: PropTypes.string,
  selected: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  role: PropTypes.string,
  'aria-label': PropTypes.string,
};

export default HomeWidgetShell;
