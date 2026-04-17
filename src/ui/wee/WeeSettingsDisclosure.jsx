import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import Text from '../Text';
import { useWeeMotion } from '../../design/weeMotion';

/**
 * Collapsible settings section aligned with wee modal surfaces (rail/well tokens) + panel fade/slide.
 */
function WeeSettingsDisclosure({ title, description, defaultOpen = true, children, className = '' }) {
  const { reducedMotion } = useWeeMotion();
  const transitionClass = useMemo(
    () =>
      reducedMotion
        ? {
            enter: 'transition ease-out duration-100',
            leave: 'transition ease-in duration-100',
          }
        : {
            enter: 'transition ease-out duration-200',
            leave: 'transition ease-in duration-150',
          },
    [reducedMotion]
  );

  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }) => (
        <div
          className={`mb-4 overflow-hidden rounded-[var(--wee-radius-shell)] border-[0.25rem] border-[hsl(var(--wee-border-outer))] bg-[hsl(var(--wee-surface-shell))] shadow-[var(--shadow-sm)] last:mb-0 ${className}`.trim()}
        >
          <Disclosure.Button
            type="button"
            className="flex w-full items-start gap-3 border-b-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-shell))] px-4 py-4 text-left transition-colors hover:bg-[hsl(var(--state-hover)/0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)/0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--wee-surface-shell))] md:px-5"
            aria-expanded={open}
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
                className={`transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </span>
          </Disclosure.Button>
          <Transition
            show={open}
            enter={transitionClass.enter}
            enterFrom="opacity-0 -translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave={transitionClass.leave}
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-1"
          >
            <Disclosure.Panel static className="bg-[hsl(var(--wee-surface-well))] px-4 pb-4 pt-3 md:px-5">
              {children}
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
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
