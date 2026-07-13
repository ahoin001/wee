export const HOME_SLOT_KINDS = {
  channel: {
    id: 'channel',
    label: 'Home Channel',
    colSpan: 1,
    rowSpan: 1,
    render: 'ChannelSlot',
  },
  widget: {
    id: 'widget',
    label: 'Widget',
    notImplemented: true,
    colSpan: 1,
    rowSpan: 1,
    render: 'WidgetSlot',
  },
};

/**
 * @param {string} id
 * @returns {typeof HOME_SLOT_KINDS[keyof typeof HOME_SLOT_KINDS] | null}
 */
export function getHomeSlotKind(id) {
  if (!id) return null;
  return HOME_SLOT_KINDS[id] ?? null;
}

/**
 * @returns {Array<typeof HOME_SLOT_KINDS[keyof typeof HOME_SLOT_KINDS]>}
 */
export function listHomeSlotKinds() {
  return Object.values(HOME_SLOT_KINDS);
}
