import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import { useFloatingWidgetsState, useUIState } from '../../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useFloatingWidgetFrame } from '../../hooks/useFloatingWidgetFrame';
import {
  applyAdminPanelPowerActions,
  executeAdminCommand,
  isDestructiveAdminAction,
  normalizeAdminPanelConfig,
} from '../../utils/adminPanelCommands';
import FloatingWidgetPresence from '../widgets/common/FloatingWidgetPresence';
import AdminPanel from './AdminPanel';
import './AdminPanelWidget.css';

const AdminPanelWidget = ({ isVisible, onClose, onExitAnimationComplete }) => {
  const { floatingWidgets, setFloatingWidgetsState } = useFloatingWidgetsState();
  const { confirmAction } = useUIState();

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [actionError, setActionError] = useState('');

  const adminPanelWidget = floatingWidgets.adminPanel;
  const adminPanelPosition = adminPanelWidget.position;
  const adminPanelConfig = useMemo(
    () => normalizeAdminPanelConfig(adminPanelWidget.config),
    [adminPanelWidget.config]
  );

  const setAdminPanelWidgetPosition = useCallback(
    (position) => {
      setFloatingWidgetsState({
        adminPanel: { ...adminPanelWidget, position },
      });
    },
    [setFloatingWidgetsState, adminPanelWidget]
  );

  const { widgetRef, size, isDragging, handleDragPointerDown } = useFloatingWidgetFrame({
    setPosition: setAdminPanelWidgetPosition,
    position: adminPanelPosition,
    initialSize: { width: 300, height: 520 },
    resizable: false,
    shouldCancelDrag: (e) =>
      !!(
        e.target.closest('.action-btn') ||
        e.target.closest('.close-btn') ||
        e.target.closest('.config-btn')
      ),
  });

  const runAction = useCallback(
    async (action) => {
      setActionError('');
      const result = await executeAdminCommand(action.command);
      if (!result.success) {
        setActionError(result.error || `Could not run “${action.name}”`);
        return;
      }
      onClose?.();
    },
    [onClose]
  );

  const handleActionClick = useCallback(
    (action) => {
      if (isDestructiveAdminAction(action)) {
        confirmAction(
          `Run ${action.name}?`,
          `This will run <strong>${action.name}</strong> on your PC. Continue?`,
          () => {
            void runAction(action);
          },
          null,
          'Run',
          'danger-primary'
        );
        return;
      }
      void runAction(action);
    },
    [confirmAction, runAction]
  );

  const handleAdminPanelSave = useCallback((powerActionsOrConfig) => {
    const store = useConsolidatedAppStore.getState();
    const currentAdminPanel = store.floatingWidgets.adminPanel;
    store.actions.setFloatingWidgetsState({
      adminPanel: applyAdminPanelPowerActions(currentAdminPanel, powerActionsOrConfig),
    });
    setShowAdminPanel(false);
  }, []);

  useEffect(() => {
    if (!isVisible) setShowAdminPanel(false);
  }, [isVisible]);

  return (
    <FloatingWidgetPresence
      isOpen={isVisible}
      onExitAnimationComplete={onExitAnimationComplete}
      ref={widgetRef}
      className="admin-panel-widget"
      style={{
        position: 'fixed',
        left: `${adminPanelPosition.x}px`,
        top: `${adminPanelPosition.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 10000,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handleDragPointerDown}
    >
      <div className="widget-header">
        <div className="header-content">
          <div className="header-icon">⚙️</div>
          <Text variant="h4" className="header-title">
            Quick Access
          </Text>
        </div>
        <div className="header-actions">
          <WButton
            variant="tertiary"
            onClick={() => setShowAdminPanel(true)}
            className="config-btn"
            title="Configure Actions"
          >
            ⚙️
          </WButton>
          <WButton variant="tertiary" onClick={onClose} className="close-btn">
            ✕
          </WButton>
        </div>
      </div>

      <div className="widget-content">
        {actionError ? (
          <div className="mb-3 rounded-xl border border-[hsl(var(--state-error)/0.45)] bg-[hsl(var(--state-error)/0.12)] px-3 py-2 text-[11px] font-semibold text-[hsl(var(--state-error))]">
            {actionError}
          </div>
        ) : null}

        {adminPanelConfig.powerActions.length > 0 ? (
          <div className="actions-grid">
            {adminPanelConfig.powerActions.map((action) => (
              <WButton
                key={action.id}
                variant="secondary"
                onClick={() => handleActionClick(action)}
                className="action-btn"
              >
                <div className="action-content">
                  <span className="action-icon">{action.icon}</span>
                  <div className="action-text">
                    <Text variant="body" className="action-name">
                      {action.name}
                    </Text>
                    {action.description ? (
                      <Text variant="caption" className="action-description">
                        {action.description}
                      </Text>
                    ) : null}
                  </div>
                </div>
              </WButton>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">⚙️</div>
            <Text variant="body" className="empty-title">
              No actions configured
            </Text>
            <Text variant="caption" className="empty-description">
              Click the ⚙️ button to add Quick Access actions
            </Text>
          </div>
        )}
      </div>

      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onSave={handleAdminPanelSave}
        config={adminPanelConfig}
      />
    </FloatingWidgetPresence>
  );
};

export default AdminPanelWidget;
