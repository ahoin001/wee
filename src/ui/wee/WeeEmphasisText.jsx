import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

/** Black italic uppercase display text — matches Wee section headers, sized for lists and inline labels. */
const sizeClasses = {
  sm: 'text-sm sm:text-base',
  md: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
};

export default function WeeEmphasisText({
  as: Component = 'span',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  return (
    <Component
      className={clsx(
        'font-black uppercase italic tracking-tight text-[hsl(var(--wee-text-header))] leading-snug',
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

WeeEmphasisText.propTypes = {
  as: PropTypes.elementType,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node,
};
