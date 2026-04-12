import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import WButton from '../ui/WButton';
import Text from '../ui/Text';

/**
 * Floating, design-system-aligned notice when a channel or ribbon launch fails.
 */
export default function LaunchErrorToast({
  headline,
  hint,
  technicalError,
  reportText,
  referenceId,
  onDismiss,
}) {
  const [copyState, setCopyState] = useState('idle');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopyState('done');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('fail');
      setTimeout(() => setCopyState('idle'), 2500);
    }
  }, [reportText]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[100000] w-[min(100%,24rem)] -translate-x-1/2 px-3 sm:max-w-lg sm:px-0"
      role="alert"
      aria-live="assertive"
    >
      <div
        className="rounded-[var(--radius-lg)] border border-[hsl(var(--state-error)_/_0.45)] bg-[hsl(var(--surface-elevated)_/_0.97)] shadow-[var(--shadow-xl)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex gap-3 p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--state-error)_/_0.12)] text-lg font-bold text-[hsl(var(--state-error))]"
            aria-hidden
          >
            !
          </div>
          <div className="min-w-0 flex-1">
            <Text size="sm" weight={700} className="text-[hsl(var(--text-primary))] leading-snug">
              {headline}
            </Text>
            <Text size="xs" className="mt-1.5 text-[hsl(var(--text-secondary))] leading-relaxed">
              {hint}
            </Text>
            {referenceId ? (
              <Text
                size="xs"
                className="mt-2 font-mono text-[11px] text-[hsl(var(--text-tertiary))]"
              >
                Reference: {referenceId}
              </Text>
            ) : null}
            {technicalError ? (
              <details className="mt-2 rounded-[var(--radius-sm)] border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-2 py-1.5">
                <summary className="cursor-pointer select-none text-[11px] font-medium text-[hsl(var(--text-tertiary))]">
                  Technical detail
                </summary>
                <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-[hsl(var(--text-secondary))]">
                  {technicalError}
                </pre>
              </details>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <WButton type="button" variant="secondary" size="sm" onClick={handleCopy}>
                {copyState === 'done'
                  ? 'Copied'
                  : copyState === 'fail'
                    ? 'Copy failed'
                    : 'Copy report'}
              </WButton>
              <WButton type="button" variant="tertiary" size="sm" onClick={onDismiss}>
                Dismiss
              </WButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

LaunchErrorToast.propTypes = {
  headline: PropTypes.string.isRequired,
  hint: PropTypes.string.isRequired,
  technicalError: PropTypes.string,
  reportText: PropTypes.string.isRequired,
  referenceId: PropTypes.string,
  onDismiss: PropTypes.func.isRequired,
};
