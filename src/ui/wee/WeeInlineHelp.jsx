import React from 'react';
import PropTypes from 'prop-types';

/**
 * Muted helper copy for modal fields (Wee uppercase rhythm, rail-muted).
 */
export function WeeHelpParagraph({ children, className = '' }) {
  return (
    <p
      className={`m-0 max-w-prose text-left text-[11px] font-bold uppercase leading-relaxed tracking-[0.1em] text-[hsl(var(--wee-text-rail-muted))] ${className}`.trim()}
    >
      {children}
    </p>
  );
}

WeeHelpParagraph.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

/**
 * Text-style action link for inline help (opens manual path, etc.).
 */
export function WeeHelpLinkButton({ children, className = '', disabled = false, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`mt-1 border-0 bg-transparent p-0 text-left text-[11px] font-black uppercase tracking-[0.14em] text-[hsl(var(--primary))] underline decoration-[hsl(var(--primary)/0.45)] underline-offset-[4px] transition-colors hover:text-[hsl(var(--primary-hover))] hover:decoration-[hsl(var(--primary-hover))] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--border-accent))] disabled:cursor-not-allowed disabled:opacity-55 ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

WeeHelpLinkButton.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};
