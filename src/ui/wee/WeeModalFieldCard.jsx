import React from 'react';
import PropTypes from 'prop-types';
import WeeCard from './WeeCard';

/**
 * Field grouping surface — extends WeeCard with optional hover accent (prototype cards).
 */
function WeeModalFieldCard({
  children,
  hoverAccent = 'none',
  className = '',
  paddingClassName,
  tone = 'panel',
}) {
  const hover =
    hoverAccent === 'primary'
      ? 'hover:border-[hsl(var(--primary)/0.35)]'
      : hoverAccent === 'discovery'
        ? 'hover:border-[hsl(var(--wee-accent-discovery)/0.45)]'
        : '';

  return (
    <WeeCard tone={tone} paddingClassName={paddingClassName} className={`${hover} ${className}`.trim()}>
      {children}
    </WeeCard>
  );
}

WeeModalFieldCard.propTypes = {
  children: PropTypes.node.isRequired,
  hoverAccent: PropTypes.oneOf(['none', 'primary', 'discovery']),
  className: PropTypes.string,
  paddingClassName: PropTypes.string,
  tone: PropTypes.oneOf(['panel', 'well']),
};

WeeModalFieldCard.defaultProps = {
  hoverAccent: 'none',
  className: '',
  paddingClassName: 'p-8 md:p-10',
  tone: 'panel',
};

export default WeeModalFieldCard;
