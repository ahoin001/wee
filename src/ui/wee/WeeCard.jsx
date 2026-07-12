import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Text from '../Text';

/**
 * Rounded wee surface for grouped controls — canonical replacement for legacy `Card`.
 * @param {'panel'|'well'} tone — panel: elevated card; well: inset field.
 */
function WeeCard({
  children,
  className = '',
  paddingClassName = 'p-8 md:p-10',
  tone = 'panel',
  title,
  description,
  /** Prefer `description` — alias for legacy Card `desc`. */
  desc,
  headerActions,
  separator = false,
}) {
  const bodyDescription = description ?? desc;
  const toneClass =
    tone === 'well'
      ? 'rounded-[var(--wee-radius-card)] border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] shadow-[var(--wee-shadow-field)] transition-colors hover:border-[hsl(var(--wee-border-field-hover))]'
      : 'rounded-[var(--wee-radius-card)] border border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] shadow-[var(--shadow-sm)] transition-colors hover:border-[hsl(var(--wee-border-card-hover)/0.42)]';

  return (
    <div className={clsx(toneClass, paddingClassName, className)}>
      {(title || headerActions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          {title ? (
            typeof title === 'string' ? (
              <Text
                variant="h3"
                className="!m-0 font-black uppercase italic tracking-tight text-[hsl(var(--wee-text-header))]"
              >
                {title}
              </Text>
            ) : (
              <div className="min-w-0 flex-1">{title}</div>
            )
          ) : (
            <span />
          )}
          {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
        </div>
      )}
      {separator ? <div className="mb-3 h-px bg-[hsl(var(--border-primary)/0.45)]" aria-hidden /> : null}
      {bodyDescription ? (
        <Text variant="desc" className="!mb-4 !mt-0 text-[hsl(var(--text-secondary))]">
          {bodyDescription}
        </Text>
      ) : null}
      {children}
    </div>
  );
}

WeeCard.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  paddingClassName: PropTypes.string,
  tone: PropTypes.oneOf(['panel', 'well']),
  title: PropTypes.node,
  description: PropTypes.string,
  desc: PropTypes.string,
  headerActions: PropTypes.node,
  separator: PropTypes.bool,
};

WeeCard.defaultProps = {
  children: null,
  className: '',
  paddingClassName: 'p-8 md:p-10',
  tone: 'panel',
  title: undefined,
  description: undefined,
  desc: undefined,
  headerActions: undefined,
  separator: false,
};

export default WeeCard;
