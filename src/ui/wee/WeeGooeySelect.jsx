import React, { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import { Listbox } from '@headlessui/react';
import { AnimatePresence, LayoutGroup, m } from 'framer-motion';
import { getWeePopoverEntrance, useWeeMotion } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import WeeGlassPill from './WeeGlassPill';
import WeePillFloorShadow from './WeePillFloorShadow';
import WeeLayoutActiveDisc, { WEE_LIQUID_ROOT_ATTR } from './WeeLayoutActiveDisc';

const MotionDiv = m.div;

const GooeySelectTrigger = forwardRef(function GooeySelectTrigger(props, ref) {
  return <WeeGlassPill ref={ref} as="button" motion {...props} />;
});

const LABEL_CLASS =
  'mb-2 block text-[0.68rem] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-tertiary))]';

/**
 * Select on the space-rail clock: glass trigger, pillOpen list, liquid active disc.
 */
function WeeGooeySelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  error = false,
  className = '',
  label,
  helperText,
  required = false,
  ...props
}) {
  const layoutId = useId();
  const { pillOpen, reducedMotion } = useWeeMotion();
  const { osReduced, prefs } = useMotionFeedback();
  const reduced = Boolean(reducedMotion || osReduced || prefs?.master === false);
  const entrance = getWeePopoverEntrance('bottom', reduced, pillOpen, { drift: false });
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="w-full">
      {label ? (
        <label className={LABEL_CLASS}>
          {label}
          {required ? <span className="ml-1 text-[hsl(var(--state-error))]">*</span> : null}
        </label>
      ) : null}

      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <div className={`relative ${disabled ? 'opacity-50' : ''}`}>
            <WeePillFloorShadow expanded={open} reducedMotion={reduced} />
            <Listbox.Button
              as={GooeySelectTrigger}
              initial={false}
                animate={reduced ? { scale: 1 } : { scale: open ? 1.02 : 1 }}
                transition={open ? pillOpen : undefined}
                className={`relative z-10 flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-[var(--control-radius-lg)] px-[var(--control-padding-x-playful)] py-[var(--control-padding-y-playful)] pr-12 text-left text-[length:var(--control-font-size)] font-black ${
                  error ? 'border-[hsl(var(--state-error))]' : ''
                } ${open ? 'shadow-[var(--shadow-hover-glow)]' : ''} ${className}`.trim()}
                disabled={disabled}
                {...props}
              >
                <span
                  className={`block min-w-0 truncate ${
                    selectedOption ? 'text-[hsl(var(--text-primary))]' : 'text-[hsl(var(--text-tertiary))]'
                  }`}
                >
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span
                  className={`pointer-events-none absolute inset-y-0 right-2 flex items-center text-[hsl(var(--text-secondary))] transition-transform ${
                    open ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
            </Listbox.Button>

            <AnimatePresence>
              {open ? (
                <Listbox.Options
                  static
                  as={MotionDiv}
                  initial={entrance.initial}
                  animate={entrance.animate}
                  exit={entrance.exit}
                  transition={entrance.transition}
                  className="absolute z-20 mt-2 w-full origin-top focus:outline-none"
                >
                  <WeeGlassPill className="max-h-60 overflow-auto rounded-[var(--wee-radius-card)] py-1.5">
                    <LayoutGroup id={layoutId}>
                      <div
                        {...{ [WEE_LIQUID_ROOT_ATTR]: '' }}
                        className="relative flex flex-col gap-0.5 px-1.5"
                      >
                        {options.map((option) => (
                          <Listbox.Option
                            key={String(option.value)}
                            value={option.value}
                            className="relative cursor-pointer select-none rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-[0.06em] text-[hsl(var(--text-primary))] data-[headlessui-state~=active]:text-[hsl(var(--wee-text-header))]"
                          >
                            {({ selected }) => (
                              <>
                                {selected ? (
                                  <WeeLayoutActiveDisc
                                    layoutId={`${layoutId}-opt`}
                                    reducedMotion={reduced}
                                    className="rounded-xl bg-[hsl(var(--primary)/0.28)] shadow-[var(--shadow-hover-glow)]"
                                  />
                                ) : null}
                                <span className="relative z-10 block truncate">{option.label}</span>
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </div>
                    </LayoutGroup>
                  </WeeGlassPill>
                </Listbox.Options>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </Listbox>

      {helperText ? (
        <p className={`mt-2 text-sm ${error ? 'text-[hsl(var(--state-error))]' : 'text-[hsl(var(--text-tertiary))]'}`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

WeeGooeySelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  className: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};

export default WeeGooeySelect;
