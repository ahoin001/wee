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
        <div className="rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] overflow-hidden">
          <Disclosure.Button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-tertiary))] transition-colors"
          >
            <span>Suggested content & library picks</span>
            <span className="text-[hsl(var(--text-secondary))] tabular-nums" aria-hidden>
              {open ? '▼' : '▶'}
            </span>
          </Disclosure.Button>
          <Disclosure.Panel className="border-t border-[hsl(var(--border-primary))] px-4 py-4 space-y-4">
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
