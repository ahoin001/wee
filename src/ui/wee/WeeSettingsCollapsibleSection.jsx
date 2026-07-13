import React, { useCallback, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Text from '../Text';
import { createWeeTransition } from '../../design/weeMotion';
import WeeGlassPill from './WeeGlassPill';
import WeeContentCollapse from './WeeContentCollapse';

/**
 * Settings collapsible — space-rail glass pill chrome + gooey header press.
 * Panel open/close composes {@link WeeContentCollapse} (CSS grid 0fr→1fr).
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

  const pressSpring = createWeeTransition('press', { reducedMotion: reduceMotion });

  return (
    <WeeGlassPill
      className={`wee-settings-collapsible relative isolate w-full overflow-hidden rounded-[2.75rem] ${
        open ? 'wee-settings-collapsible--open' : ''
      } ${className}`.trim()}
    >
      <m.button
        type="button"
        id={headingId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        whileHover={reduceMotion ? undefined : { scale: 1.008 }}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        transition={pressSpring}
        className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left md:px-6 md:py-5"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <m.span
            aria-hidden
            animate={
              reduceMotion
                ? undefined
                : open
                  ? { scale: 1.06, rotate: 0 }
                  : { scale: 1, rotate: 0 }
            }
            transition={pressSpring}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[var(--shadow-card)] ${
              open
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                : 'border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-primary))]'
            }`}
          >
            {Icon ? <Icon size={22} strokeWidth={2.35} /> : null}
          </m.span>
          <span className="min-w-0 pt-0.5">
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
          transition={pressSpring}
          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 backdrop-blur-md ${
            open
              ? 'border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--surface-wii-tint)/0.85)] text-[hsl(var(--primary))]'
              : 'border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-elevated)/0.7)] text-[hsl(var(--text-tertiary))]'
          }`}
        >
          <ChevronDown size={20} strokeWidth={3} aria-hidden />
        </m.span>
      </m.button>

      <WeeContentCollapse open={open} id={panelId} role="region" aria-labelledby={headingId}>
        <div
          className={`space-y-6 border-t border-[hsl(var(--border-primary)/0.28)] px-5 pb-7 pt-5 md:px-7 md:pb-8 ${
            open ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {children}
        </div>
      </WeeContentCollapse>
    </WeeGlassPill>
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
