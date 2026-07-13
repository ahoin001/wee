import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';
import Text from '../Text';
import WeeContentCollapse from './WeeContentCollapse';

/**
 * Collapsible settings section — same height morph as {@link WeeContentCollapse}.
 * Prefer {@link WeeSettingsCollapsibleSection} for icon accordion chrome;
 * use this for lighter titled disclosures.
 */
function WeeSettingsDisclosure({ title, description, defaultOpen = true, children, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const headingId = useId();
  const panelId = useId();

  return (
    <div
      className={`mb-4 overflow-hidden rounded-[var(--wee-radius-shell)] border-[0.25rem] border-[hsl(var(--wee-border-outer))] bg-[hsl(var(--wee-surface-shell))] shadow-[var(--shadow-sm)] last:mb-0 ${className}`.trim()}
    >
      <button
        type="button"
        id={headingId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 border-b-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-shell))] px-4 py-4 text-left transition-colors hover:bg-[hsl(var(--state-hover)/0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)/0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--wee-surface-shell))] md:px-5"
      >
        <span className="min-w-0 flex-1">
          <Text variant="h3" className="m-0 text-[hsl(var(--wee-text-header))]">
            {title}
          </Text>
          {description ? (
            <Text variant="small" className="mt-0.5 block text-[hsl(var(--text-secondary))]">
              {description}
            </Text>
          ) : null}
        </span>
        <span className="mt-0.5 flex shrink-0 text-[hsl(var(--wee-text-rail-muted))]">
          <ChevronDown
            size={22}
            strokeWidth={2.2}
            className={`transition-transform ease-[var(--wee-collapse-ease)] ${open ? 'rotate-180' : ''}`}
            style={{ transitionDuration: 'var(--wee-collapse-duration)' }}
            aria-hidden
          />
        </span>
      </button>
      <WeeContentCollapse open={open} id={panelId} role="region" aria-labelledby={headingId}>
        <div className="bg-[hsl(var(--wee-surface-well))] px-4 pb-4 pt-3 md:px-5">{children}</div>
      </WeeContentCollapse>
    </div>
  );
}

WeeSettingsDisclosure.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  defaultOpen: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

WeeSettingsDisclosure.defaultProps = {
  description: null,
  defaultOpen: true,
  className: '',
};

export default React.memo(WeeSettingsDisclosure);
