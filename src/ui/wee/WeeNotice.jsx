/**
 * Quiet glass note — coach copy, one-time hints.
 * Rounded card (not a stretched capsule) with the same pill chrome as the space rail.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import WeeGlassPill from './WeeGlassPill';
import WeePillFloorShadow from './WeePillFloorShadow';

function WeeNotice({
  children,
  onDismiss,
  dismissLabel = 'Dismiss',
  icon: Icon = null,
  className = '',
}) {
  return (
    <div className={['relative flex flex-col items-center', className].filter(Boolean).join(' ')}>
      <WeeGlassPill className="pointer-events-auto flex max-w-[min(26rem,92vw)] items-start gap-3 rounded-[1.35rem] px-4 py-3">
        {Icon ? (
          <Icon
            size={16}
            strokeWidth={2.25}
            className="mt-0.5 shrink-0 text-[hsl(var(--primary))]"
            aria-hidden
          />
        ) : null}
        <p className="m-0 min-w-0 flex-1 text-[13px] font-semibold leading-snug text-[hsl(var(--text-primary))]">
          {children}
        </p>
        {typeof onDismiss === 'function' ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="mt-0.5 shrink-0 rounded-full p-1 text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--state-hover))] hover:text-[hsl(var(--text-primary))]"
          >
            <X size={14} strokeWidth={2.5} aria-hidden />
          </button>
        ) : null}
      </WeeGlassPill>
      <WeePillFloorShadow expanded={false} className="-bottom-3 w-16" />
    </div>
  );
}

WeeNotice.propTypes = {
  children: PropTypes.node,
  onDismiss: PropTypes.func,
  dismissLabel: PropTypes.string,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

export default WeeNotice;
