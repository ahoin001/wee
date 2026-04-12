import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import WButton from '../ui/WButton';
import Text from '../ui/Text';
import { getSmartPathSuggestions } from '../utils/channelPathValidation';

/**
 * Clickable fixes when the path and launch type look mismatched or incomplete.
 */
export default function ChannelPathSmartSuggestions({ path, type, onApply }) {
  const suggestions = useMemo(() => getSmartPathSuggestions(path, type), [path, type]);

  if (!suggestions.length) {
    return null;
  }

  return (
    <div className="mt-3 rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))]/40 p-3">
      <Text size="xs" weight={600} className="text-[hsl(var(--text-secondary))] mb-2 block">
        Smart suggestions
      </Text>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <WButton
            key={s.id}
            type="button"
            variant="secondary"
            size="sm"
            className="max-w-full text-left whitespace-normal h-auto min-h-8 py-1.5"
            onClick={() => onApply(s)}
          >
            {s.label}
          </WButton>
        ))}
      </div>
    </div>
  );
}

ChannelPathSmartSuggestions.propTypes = {
  path: PropTypes.string,
  type: PropTypes.string,
  onApply: PropTypes.func.isRequired,
};
