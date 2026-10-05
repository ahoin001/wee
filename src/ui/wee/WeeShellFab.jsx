import React from 'react';
import PropTypes from 'prop-types';

const TONE_CLASSES = Object.freeze({
  neutral:
    'bg-[hsl(var(--color-pure-white)/0.1)] border-[hsl(var(--color-pure-white)/0.2)] hover:bg-[hsl(var(--color-pure-white)/0.2)]',
  success:
    'bg-[hsl(var(--state-success)/0.2)] border-[hsl(var(--state-success)/0.3)] hover:bg-[hsl(var(--state-success)/0.3)]',
  primary:
    'bg-[hsl(var(--primary)/0.2)] border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.3)]',
  danger:
    'bg-[hsl(var(--state-error)/0.2)] border-[hsl(var(--state-error)/0.3)] hover:bg-[hsl(var(--state-error)/0.3)]',
});

/**
 * Round glass shortcut used by the dockless shell corner stack.
 * Blur radius comes from `--wee-glass-blur-md`; `.wee-power-efficient` drops the backdrop.
 */
function WeeShellFab({ tone = 'neutral', title, onClick, onMouseEnter, onFocus, children }) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-full border p-3 shadow-lg backdrop-blur-[var(--wee-glass-blur-md)] transition-all duration-200 ${
        TONE_CLASSES[tone] || TONE_CLASSES.neutral
      }`}
      title={title}
      aria-label={title}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
    >
      {children}
    </button>
  );
}

WeeShellFab.propTypes = {
  tone: PropTypes.oneOf(['neutral', 'success', 'primary', 'danger']),
  title: PropTypes.string,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onFocus: PropTypes.func,
  children: PropTypes.node,
};

export default React.memo(WeeShellFab);
