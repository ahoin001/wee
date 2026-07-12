import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';

const MotionDiv = m.div;

/**
 * Canonical glass pill chrome from WeeGooeySpacePill — border-4, --wee-pill-* tokens, blur.
 * Prefer this over copying pill class strings in feature CSS.
 */
const WeeGlassPill = forwardRef(function WeeGlassPill(
  { as = 'div', motion = false, className = '', children, style, ...rest },
  ref
) {
  const classes = [
    'border-4 border-[hsl(var(--wee-pill-border))]',
    'bg-[hsl(var(--wee-pill-glass))] shadow-[var(--wee-pill-shadow)]',
    'backdrop-blur-xl',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (motion) {
    return (
      <MotionDiv ref={ref} className={classes} style={style} {...rest}>
        {children}
      </MotionDiv>
    );
  }

  const Tag = as === 'button' ? 'button' : 'div';
  return (
    <Tag ref={ref} className={classes} style={style} {...rest}>
      {children}
    </Tag>
  );
});

WeeGlassPill.displayName = 'WeeGlassPill';

WeeGlassPill.propTypes = {
  as: PropTypes.oneOf(['div', 'button']),
  motion: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

export default WeeGlassPill;
