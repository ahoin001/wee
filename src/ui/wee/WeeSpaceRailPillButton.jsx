import React from 'react';
import PropTypes from 'prop-types';
import { PlayfulPressSurface } from '../../components/navigation/PlayfulInteractionMotion';

const sizeClass = {
  sm: 'min-h-[40px] px-4 py-2 text-[11px]',
  md: 'min-h-[44px] px-5 py-2.5 text-[11px]',
  lg: 'min-h-[48px] px-6 py-3 text-[12px]',
};

/**
 * Space-rail–style compact pill — same glass + border tokens as {@link ../../components/spaces/WeeGooeySpacePill.jsx}.
 * For settings panels and anywhere the ribbon “primary tab” look should match the rail.
 */
function WeeSpaceRailPillButton({
  type = 'button',
  size = 'md',
  className = '',
  children,
  disabled = false,
  active = false,
  ...rest
}) {
  return (
    <PlayfulPressSurface
      as="button"
      type={type}
      variant="ribbon"
      enableHover={false}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center font-black uppercase tracking-widest',
        'rounded-[var(--radius-pill)] border-4 border-[hsl(var(--wee-pill-border))]',
        'bg-[hsl(var(--wee-pill-glass))] shadow-[var(--wee-pill-shadow)]',
        'backdrop-blur-xl transition-[border-color,box-shadow] duration-200',
        active ? 'text-[hsl(var(--text-accent))]' : 'text-[hsl(var(--text-primary))]',
        active
          ? 'border-[hsl(var(--primary)/0.76)] bg-[hsl(var(--primary)/0.2)] shadow-[0_0_0_2px_hsl(var(--primary)/0.32),var(--wee-pill-shadow)]'
          : '',
        active
          ? 'hover:border-[hsl(var(--primary)/0.82)] hover:shadow-[0_0_0_2px_hsl(var(--primary)/0.36),var(--wee-pill-shadow)]'
          : 'hover:border-[hsl(var(--border-accent)/0.42)] hover:shadow-[var(--shadow-soft-hover)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeClass[size] || sizeClass.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </PlayfulPressSurface>
  );
}

WeeSpaceRailPillButton.propTypes = {
  type: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  active: PropTypes.bool,
};

export default WeeSpaceRailPillButton;
