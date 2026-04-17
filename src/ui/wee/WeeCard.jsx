import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

/**
 * Rounded wee surface for grouped controls inside modal body.
 * @param {'panel'|'well'} tone — panel: white card on well; well: #F8FAFC inset field (reference wee UI).
 */
function WeeCard({ children, className = '', paddingClassName = 'p-8 md:p-10', tone = 'panel' }) {
  const toneClass =
    tone === 'well'
      ? 'rounded-[var(--wee-radius-card)] border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] shadow-[var(--wee-shadow-field)] transition-colors hover:border-[hsl(var(--wee-border-field-hover))]'
      : 'rounded-[var(--wee-radius-card)] border border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] shadow-[var(--shadow-sm)] transition-colors hover:border-[hsl(var(--wee-border-card-hover)/0.42)]';

  return (
    <div className={clsx(toneClass, paddingClassName, className)}>
      {children}
    </div>
  );
}

WeeCard.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  paddingClassName: PropTypes.string,
  tone: PropTypes.oneOf(['panel', 'well']),
};

WeeCard.defaultProps = {
  children: null,
  className: '',
  paddingClassName: 'p-8 md:p-10',
  tone: 'panel',
};

export default WeeCard;
