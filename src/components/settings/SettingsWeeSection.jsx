import React from 'react';
import PropTypes from 'prop-types';
import WeeSectionEyebrow from '../../ui/wee/WeeSectionEyebrow';

/**
 * Eyebrow + stacked children for wee settings tabs.
 */
function SettingsWeeSection({ eyebrow, children, className = '' }) {
  return (
    <section className={`space-y-4 ${className}`.trim()}>
      {eyebrow ? <WeeSectionEyebrow className="ml-0.5">{eyebrow}</WeeSectionEyebrow> : null}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

SettingsWeeSection.propTypes = {
  eyebrow: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

SettingsWeeSection.defaultProps = {
  eyebrow: null,
  className: '',
};

export default SettingsWeeSection;
