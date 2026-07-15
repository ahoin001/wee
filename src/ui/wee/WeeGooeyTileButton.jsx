import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { createWeeTransition } from '../../design/weeMotion';
import { PLAYFUL_AMPLITUDE } from '../../design/playfulMotion';

const MotionButton = m.button;

/**
 * Labeled tile/card sibling of {@link WeeGooeyIconButton} — same press spring family
 * (space rail / side nav), card footprint with icon + label (+ optional description).
 *
 * Orientations:
 * - `stack`: icon above label, centered — widget action grids (Quick Access L/XL).
 * - `row`: icon beside label/description, left aligned — pickers and list-like trays.
 */
const WeeGooeyTileButton = forwardRef(function WeeGooeyTileButton(
  {
    icon,
    label,
    description,
    orientation = 'stack',
    dashed = false,
    reducedMotion = false,
    className = '',
    labelClassName = '',
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  const whileHover = reducedMotion
    ? undefined
    : { scale: PLAYFUL_AMPLITUDE.hoverScale, y: PLAYFUL_AMPLITUDE.hoverLiftY };
  const whileTap = reducedMotion ? undefined : { scale: PLAYFUL_AMPLITUDE.pressScale };

  const isRow = orientation === 'row';

  return (
    <MotionButton
      ref={ref}
      type={type}
      whileHover={whileHover || {}}
      whileTap={whileTap || {}}
      transition={createWeeTransition('press', { reducedMotion })}
      className={[
        'relative flex min-h-0 min-w-0 overflow-hidden rounded-2xl border-2 text-left',
        'transition-[box-shadow,border-color] duration-200',
        'hover:[box-shadow:var(--shadow-soft-hover),var(--shadow-hover-glow)]',
        'hover:border-[hsl(var(--border-accent)/0.42)]',
        dashed
          ? 'border-dashed border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-tertiary)/0.55)]'
          : 'border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-elevated)/0.9)] shadow-[var(--shadow-sm)]',
        isRow
          ? 'flex-row items-center gap-2.5 px-3 py-2.5'
          : 'flex-col items-center justify-center gap-1 px-1.5 py-1.5 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon ? (
        <span
          className={`flex shrink-0 items-center justify-center leading-none ${
            isRow ? 'text-lg' : 'text-xl'
          }`}
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      {label || description ? (
        <span className="min-w-0">
          {label ? (
            <span
              className={[
                'block truncate text-[length:var(--font-size-micro)] font-black uppercase tracking-wide',
                dashed ? 'text-[hsl(var(--text-secondary))]' : 'text-[hsl(var(--text-primary))]',
                labelClassName,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {label}
            </span>
          ) : null}
          {description && isRow ? (
            <span className="block truncate text-[length:var(--font-size-micro)] font-bold text-[hsl(var(--text-tertiary))]">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
      {children}
    </MotionButton>
  );
});

WeeGooeyTileButton.displayName = 'WeeGooeyTileButton';

WeeGooeyTileButton.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.node,
  description: PropTypes.node,
  orientation: PropTypes.oneOf(['stack', 'row']),
  dashed: PropTypes.bool,
  reducedMotion: PropTypes.bool,
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  children: PropTypes.node,
  type: PropTypes.string,
};

export default WeeGooeyTileButton;
