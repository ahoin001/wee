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
  title,
  description,
  desc,
  headerActions,
  separator = false,
}) {
  const hover =
    hoverAccent === 'primary'
      ? 'hover:border-[hsl(var(--primary)/0.35)]'
      : hoverAccent === 'discovery'
        ? 'hover:border-[hsl(var(--wee-accent-discovery)/0.45)]'
        : '';

  return (
    <WeeCard
      tone={tone}
      title={title}
      description={description}
      desc={desc}
      headerActions={headerActions}
      separator={separator}
      paddingClassName={paddingClassName}
      className={`${hover} ${className}`.trim()}
    >
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
  title: PropTypes.node,
  description: PropTypes.string,
  desc: PropTypes.string,
  headerActions: PropTypes.node,
  separator: PropTypes.bool,
};

WeeModalFieldCard.defaultProps = {
  hoverAccent: 'none',
  className: '',
  paddingClassName: 'p-8 md:p-10',
  tone: 'panel',
  title: undefined,
  description: undefined,
  desc: undefined,
  headerActions: undefined,
  separator: false,
};

export default WeeModalFieldCard;
