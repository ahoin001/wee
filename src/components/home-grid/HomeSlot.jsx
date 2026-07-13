import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Channel from '../channels/Channel';
import { SLOT_KIND_CHANNEL, SLOT_KIND_WIDGET } from '../../utils/homeGridSlots';

/**
 * @param {import('../../utils/homeGridSlots').HomeChannelPayload | null | undefined} channel
 * @returns {Record<string, unknown>}
 */
function legacyChannelConfigFromSlot(channel) {
  if (!channel) return { empty: true };

  const { kenBurns, launchType, ...rest } = channel;
  return {
    ...rest,
    type: launchType ?? null,
    ...(kenBurns && typeof kenBurns === 'object' ? kenBurns : {}),
  };
}

/**
 * Thin home-grid slot switcher. Channel kind delegates to the existing Channel tile;
 * widget kind renders a tokenized placeholder until widgets land.
 */
function HomeSlot({ slot, channelId, ...rest }) {
  const kind = slot?.kind ?? SLOT_KIND_CHANNEL;

  const channelProps = useMemo(() => {
    const channel = slot?.channel;
    const isEmpty = !channel || (!channel.media && !channel.path);
    return {
      id: channelId,
      type: channel?.launchType || 'empty',
      path: channel?.path || null,
      icon: channel?.icon || null,
      empty: isEmpty,
      media: channel?.media || null,
      asAdmin: channel?.asAdmin,
      hoverSound: channel?.hoverSound,
      channelConfig: legacyChannelConfigFromSlot(channel),
    };
  }, [slot?.channel, channelId]);

  if (kind === SLOT_KIND_WIDGET) {
    return (
      <div
        className="flex h-full w-full min-h-0 min-w-0 items-center justify-center rounded-[1.25rem] border-2 border-dashed border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-tertiary)/0.55)] text-xs text-[hsl(var(--text-secondary))]"
        aria-label="Widget (coming soon)"
        role="img"
      />
    );
  }

  return <Channel {...channelProps} {...rest} />;
}

HomeSlot.propTypes = {
  slot: PropTypes.shape({
    kind: PropTypes.string,
    hidden: PropTypes.bool,
    colSpan: PropTypes.number,
    rowSpan: PropTypes.number,
    channel: PropTypes.object,
  }),
  channelId: PropTypes.string.isRequired,
};

export default React.memo(HomeSlot);
