import React from 'react';
import PropTypes from 'prop-types';
import { WeeHoverTip } from '../../ui/wee';
import { CSS_STATE_ERROR, CSS_STATE_SUCCESS } from '../../design/runtimeColorStrings.js';

/**
 * Inline help cue for resource-heavy settings — uses shared {@link WeeHoverTip}.
 */
function ResourceUsageIndicator({
  level = 'medium', // 'low', 'medium', 'high'
  tooltip = 'This feature may use significant system resources',
  children,
  className = '',
}) {
  const iconColor =
    level === 'low'
      ? CSS_STATE_SUCCESS
      : level === 'high'
        ? CSS_STATE_ERROR
        : 'hsl(var(--state-warning))';

  const tipText =
    level === 'low'
      ? 'This feature uses minimal system resources'
      : level === 'high'
        ? 'This feature uses significant system resources. Test thoroughly to ensure your PC can handle it.'
        : level === 'medium'
          ? 'This feature may use moderate system resources. Test to ensure your PC can handle it.'
          : tooltip;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
      {children}
      <WeeHoverTip content={tipText} side="top">
        <button
          type="button"
          className="inline-flex shrink-0 cursor-help items-center justify-center rounded-full p-0.5 text-[hsl(var(--text-tertiary))] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)/0.45)]"
          aria-label={tipText}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </button>
      </WeeHoverTip>
    </span>
  );
}

ResourceUsageIndicator.propTypes = {
  level: PropTypes.oneOf(['low', 'medium', 'high']),
  tooltip: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default ResourceUsageIndicator;
