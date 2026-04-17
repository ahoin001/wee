import React from 'react';
import PropTypes from 'prop-types';
import { Disclosure } from '@headlessui/react';

/**
 * Collapsible wrapper for suggested games / library picks — keeps Setup focused on path + image first.
 */
function ChannelModalSuggestedCollapsible({ children, defaultOpen = false }) {
  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }) => (
        <div className="channel-suggested-disclosure overflow-hidden rounded-[var(--wee-radius-card)] border-2 border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] shadow-[var(--shadow-card)]">
          <Disclosure.Button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[11px] font-black uppercase italic tracking-widest text-[hsl(var(--wee-text-header))] transition-colors hover:bg-[hsl(var(--state-hover)/0.5)]"
          >
            <span>Suggested games & apps</span>
            <span className="text-[hsl(var(--text-secondary))] tabular-nums" aria-hidden>
              {open ? '▼' : '▶'}
            </span>
          </Disclosure.Button>
          <Disclosure.Panel className="space-y-4 border-t-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-well))] px-5 py-5">
            {children}
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}

ChannelModalSuggestedCollapsible.propTypes = {
  children: PropTypes.node.isRequired,
  defaultOpen: PropTypes.bool,
};

export default React.memo(ChannelModalSuggestedCollapsible);
