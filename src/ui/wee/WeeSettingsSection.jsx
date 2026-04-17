import React from 'react';
import PropTypes from 'prop-types';
import Text from '../Text';
import WeeSectionEyebrow from './WeeSectionEyebrow';

/**
 * Flat settings block: small icon + uppercase eyebrow + optional caption (no collapsible chrome).
 */
function WeeSettingsSection({ icon: Icon, label, description, children, className = '' }) {
  return (
    <section className={`mb-10 last:mb-0 ${className}`.trim()}>
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <Icon
              size={16}
              strokeWidth={2.25}
              className="shrink-0 text-[hsl(var(--wee-text-rail-muted))]"
              aria-hidden
            />
          ) : null}
          <WeeSectionEyebrow trackingClassName="tracking-[0.18em]">{label}</WeeSectionEyebrow>
        </div>
        {description ? (
          <Text variant="caption" className="!mt-0 max-w-prose text-[hsl(var(--text-secondary))]">
            {description}
          </Text>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

WeeSettingsSection.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

WeeSettingsSection.defaultProps = {
  icon: null,
  description: null,
  className: '',
};

export default React.memo(WeeSettingsSection);
