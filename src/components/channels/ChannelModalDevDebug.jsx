import React from 'react';
import Text from '../../ui/Text';

/**
 * Development-only: launch path + type context for debugging the channel editor.
 */
export default function ChannelModalDevDebug({ path, type, pathError }) {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="rounded-lg border border-dashed border-[hsl(var(--border-secondary))] bg-[hsl(var(--surface-secondary))]/50 p-3 mt-2">
      <Text size="xs" weight={600} className="text-[hsl(var(--text-secondary))] mb-1 uppercase tracking-wide">
        Dev — path debug
      </Text>
      <div className="font-mono text-[11px] text-[hsl(var(--text-primary))] space-y-0.5 break-all">
        <div>
          <span className="text-[hsl(var(--text-tertiary))]">type </span>
          {type || '—'}
        </div>
        <div>
          <span className="text-[hsl(var(--text-tertiary))]">path </span>
          {path?.trim() ? path : '(empty)'}
        </div>
        {pathError ? (
          <div className="text-[hsl(var(--state-error))]">
            <span className="text-[hsl(var(--text-tertiary))]">validation </span>
            {pathError}
          </div>
        ) : null}
      </div>
    </div>
  );
}

