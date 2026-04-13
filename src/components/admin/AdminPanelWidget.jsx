import React, { useState, useCallback } from 'react';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import { useFloatingWidgetsState } from '../../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useFloatingWidgetFrame } from '../../hooks/useFloatingWidgetFrame';
import AdminPanel from './AdminPanel';
import './AdminPanelWidget.css';

const AdminPanelWidget = ({ isVisible, onClose }) => {
  const { floatingWidgets, setFloatingWidgetsState } = useFloatingWidgetsState();

  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Get admin panel widget state from floating widgets
  const adminPanelWidget = floatingWidgets.adminPanel;
  const adminPanelPosition = adminPanelWidget.position;
  const adminPanelConfig = adminPanelWidget.config || { powerActions: [] };

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

  const handleActionClick = (action) => {
    if (window.api && window.api.executeCommand) {
      window.api.executeCommand(action.command);
    }
    onClose();
  };

  const handleAdminPanelSave = useCallback((powerActions) => {
    const store = useConsolidatedAppStore.getState();
    
    // Get current admin panel state from store to avoid stale closure
    const currentAdminPanel = store.floatingWidgets.adminPanel;
    
    // Use the direct setFloatingWidgetsState action instead of floatingWidgetManager
    store.actions.setFloatingWidgetsState({
      adminPanel: { 
        ...currentAdminPanel, 
        config: { powerActions }
      }
    });
    
    setShowAdminPanel(false);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
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
      {/* Widget Header */}
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
          <WButton
            variant="tertiary"
            onClick={onClose}
            className="close-btn"
          >
            ✕
          </WButton>
        </div>
      </div>

      {/* Widget Content */}
      <div className="widget-content">
        {adminPanelConfig.powerActions && adminPanelConfig.powerActions.length > 0 ? (
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
                    {action.description && (
                      <Text variant="caption" className="action-description">
                        {action.description}
                      </Text>
                    )}
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
              Click the ⚙️ button in the header to configure quick access actions
            </Text>
          </div>
        )}
      </div>

      {/* Admin Panel Configuration Modal */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onSave={handleAdminPanelSave}
        config={adminPanelConfig}
      />
    </div>
  );
};

export default AdminPanelWidget;

