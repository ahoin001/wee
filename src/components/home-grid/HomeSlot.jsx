import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Channel from '../channels/Channel';
import {
  SLOT_KIND_ADMIN_QUICK_ACCESS,
  SLOT_KIND_CHANNEL,
  SLOT_KIND_WIDGET,
} from '../../utils/homeGridSlots';
import { getHomeSlotKind } from './slotKindRegistry';
import AdminQuickAccessSlot from './AdminQuickAccessSlot';

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
 * Thin home-grid slot switcher. Kind render ids come from `slotKindRegistry`.
 */
function HomeSlot({ slot, channelId, arrangeMode = false, punchMode = false, selected = false, onArrangeSelect, ...rest }) {
  const kindId = slot?.kind ?? SLOT_KIND_CHANNEL;
  const kindMeta = getHomeSlotKind(kindId);
  const renderId =
    kindMeta?.render ||
    (kindId === SLOT_KIND_ADMIN_QUICK_ACCESS || kindId === SLOT_KIND_WIDGET
      ? 'AdminQuickAccessSlot'
      : 'ChannelSlot');

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

  if (renderId === 'AdminQuickAccessSlot') {
    return (
      <AdminQuickAccessSlot
        slot={slot}
        channelId={channelId}
        arrangeMode={arrangeMode}
        punchMode={punchMode}
        selected={selected}
        onArrangeSelect={onArrangeSelect}
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
    widget: PropTypes.object,
  }),
  channelId: PropTypes.string.isRequired,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(HomeSlot);
