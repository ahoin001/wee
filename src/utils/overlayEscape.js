/**
 * Escape / overlay coordination for shell chrome.
 * Quick Menu must not open while a modal owns the Escape key.
 */

/**
 * @param {object} [ui] - store ui slice
 * @returns {boolean}
 */
export function isBlockingOverlayOpen(ui = {}) {
  return Boolean(
    ui.showSettingsModal ||
      ui.channelConfigureModalOpen ||
      ui.showUpdateModal ||
      ui.isAuthModalOpen ||
      ui.showConfirmationModal ||
      ui.showWorkspaceSwitcher ||
      ui.commandPaletteOpen ||
      ui.homeBoardArrangeMode
  );
}

/**
 * Close store-owned overlays Escape should dismiss.
 * Returns `defer` when a local-state surface (channel modal / arrange) owns Escape —
 * callers must not open Quick Menu and must not preventDefault so that surface can close.
 *
 * @param {{ ui?: object, actions?: { setUIState?: Function } }} store
 * @returns {'closed-menu' | 'closed-modal' | 'defer' | 'none'}
 */
export function closeTopOverlayOnEscape(store) {
  const ui = store?.ui || {};
  const setUIState = store?.actions?.setUIState;
  if (!setUIState) return 'none';

  if (ui.showSettingsActionMenu) {
    setUIState({ showSettingsActionMenu: false });
    return 'closed-menu';
  }

  if (ui.showSettingsModal) {
    setUIState({ showSettingsModal: false });
    return 'closed-modal';
  }

  if (ui.showUpdateModal) {
    setUIState({ showUpdateModal: false });
    return 'closed-modal';
  }

  if (ui.isAuthModalOpen) {
    setUIState({ isAuthModalOpen: false });
    return 'closed-modal';
  }

  if (ui.showConfirmationModal) {
    setUIState({ showConfirmationModal: false, confirmationModalData: null });
    return 'closed-modal';
  }

  if (ui.showWorkspaceSwitcher) {
    setUIState({ showWorkspaceSwitcher: false });
    return 'closed-modal';
  }

  if (ui.commandPaletteOpen) {
    setUIState({ commandPaletteOpen: false });
    return 'closed-modal';
  }

  if (ui.channelConfigureModalOpen || ui.homeBoardArrangeMode) {
    return 'defer';
  }

  return 'none';
}

/**
 * Escape → close overlay if any, else open Quick Menu.
 * @param {{ getState: Function }} storeApi
 * @param {{ openQuickMenu?: Function }} [opts]
 * @returns {'opened-menu' | 'closed-menu' | 'closed-modal' | 'defer' | 'none'}
 */
export function handleShellEscapeKey(storeApi, { openQuickMenu } = {}) {
  const store = storeApi.getState();
  const result = closeTopOverlayOnEscape(store);

  if (result !== 'none') {
    return result;
  }

  if (typeof openQuickMenu === 'function') {
    openQuickMenu();
    return 'opened-menu';
  }

  store.actions?.setUIState?.({ showSettingsActionMenu: true });
  return 'opened-menu';
}
