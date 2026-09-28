import React from 'react';
import PropTypes from 'prop-types';
import { useWeeMotion } from '../../design/weeMotion';
import WeeGooeyIconButton from './WeeGooeyIconButton';
import { WEE_LIQUID_ROOT_ATTR } from './WeeLayoutActiveDisc';

/**
 * Circular space-rail choice: icon disc + hub micro caption.
 */
function WeeGooeyChoice({
  icon,
  label,
  active = false,
  layoutId,
  reducedMotion = false,
  onClick,
  title,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`.trim()}>
      <WeeGooeyIconButton
        variant="outline"
        size="md"
        active={active}
        layoutId={layoutId}
        reducedMotion={reducedMotion}
        aria-label={label}
        aria-pressed={active}
        title={title || label}
        onClick={onClick}
      >
        <span className="relative z-10 flex text-[hsl(var(--text-primary))]">{icon}</span>
      </WeeGooeyIconButton>
      <span className="max-w-[4.5rem] truncate text-center text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
        {label}
      </span>
    </div>
  );
}

WeeGooeyChoice.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  layoutId: PropTypes.string,
  reducedMotion: PropTypes.bool,
  onClick: PropTypes.func,
  title: PropTypes.string,
  className: PropTypes.string,
};

/**
 * Horizontal disc of {@link WeeGooeyChoice} with one traveling liquid indicator.
 */
function WeeGooeyChoiceGroup({
  value,
  onChange,
  options,
  layoutId = 'weeGooeyChoice',
  ariaLabel,
  className = '',
}) {
  const { reducedMotion } = useWeeMotion();
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      {...{ [WEE_LIQUID_ROOT_ATTR]: '' }}
      className={`flex flex-wrap items-start justify-center gap-3 ${className}`.trim()}
    >
      {options.map((opt) => (
        <WeeGooeyChoice
          key={String(opt.value)}
          icon={opt.icon}
          label={opt.label}
          title={opt.title}
          active={opt.value === value}
          layoutId={layoutId}
          reducedMotion={reducedMotion}
          onClick={() => onChange?.(opt.value)}
        />
      ))}
    </div>
  );
}

WeeGooeyChoiceGroup.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      title: PropTypes.string,
    })
  ).isRequired,
  layoutId: PropTypes.string,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
};

export { WeeGooeyChoiceGroup };
export default WeeGooeyChoice;
