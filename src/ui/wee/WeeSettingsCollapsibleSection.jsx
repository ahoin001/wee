import React, { useCallback, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Text from '../Text';

/**
 * Chunky collapsible block for settings tab content (icon tile + title + chevron, spring panel).
 * Aligned with prototype `tabseries-channel.html`; uses design tokens only.
 */
function WeeSettingsCollapsibleSection({
  icon: Icon,
  title,
  description,
  defaultOpen = false,
  children,
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const panelId = useId();

  const toggle = useCallback(() => setOpen((o) => !o), []);

  /** Slightly bouncier panel — Wee “gooey” feel (tabBody-adjacent). */
  const spring = reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 24, mass: 0.78 };

  return (
    <div
      className={`overflow-hidden rounded-[2.5rem] border-2 transition-[border-color,box-shadow,background-color] duration-300 ${
        open
          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--surface-primary))] shadow-[var(--shadow-md)]'
          : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] hover:border-[hsl(var(--border-secondary))]'
      } ${className}`.trim()}
    >
      <button
        type="button"
        id={headingId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors md:p-6"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[var(--shadow-sm)] transition-colors ${
              open
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                : 'bg-[hsl(var(--surface-tertiary))] text-[hsl(var(--text-primary))]'
            }`}
          >
            {Icon ? <Icon size={24} strokeWidth={2.35} aria-hidden /> : null}
          </div>
          <span className="min-w-0">
            <Text
              as="span"
              variant="h3"
              className="!m-0 block font-black uppercase italic leading-tight tracking-tight text-[hsl(var(--text-primary))]"
            >
              {title}
            </Text>
            {description ? (
              <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
                {description}
              </Text>
            ) : null}
          </span>
        </div>
        <m.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 28 }}
          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            open ? 'bg-[hsl(var(--surface-wii-tint))] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--surface-tertiary))] text-[hsl(var(--text-tertiary))]'
          }`}
        >
          <ChevronDown size={20} strokeWidth={3} aria-hidden />
        </m.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <m.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="space-y-6 border-t border-[hsl(var(--border-primary)/0.35)] px-5 pb-8 pt-6 md:px-8 md:pb-10">
              {children}
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

WeeSettingsCollapsibleSection.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  defaultOpen: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

WeeSettingsCollapsibleSection.defaultProps = {
  icon: null,
  description: null,
  defaultOpen: false,
  className: '',
};

export default React.memo(WeeSettingsCollapsibleSection);
