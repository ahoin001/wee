import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from '../ui/Card';
import Text from '../ui/Text';
import WButton from '../ui/WButton';
import { useFloatingWidgetsState } from '../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import AdminPanel from './AdminPanel';
import './AdminPanelWidget.css';

const AdminPanelWidget = ({ isVisible, onClose }) => {
  const { floatingWidgets, setFloatingWidgetsState } = useFloatingWidgetsState();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const widgetRef = useRef(null);

  // Get admin panel widget state from floating widgets
  const adminPanelWidget = floatingWidgets.adminPanel;
  const adminPanelPosition = adminPanelWidget.position;
  const adminPanelConfig = adminPanelWidget.config || { powerActions: [] };



  // Update admin panel widget position
  const setAdminPanelWidgetPosition = (position) => {
    setFloatingWidgetsState({
      adminPanel: { ...adminPanelWidget, position }
    });
  };

  // Dragging logic
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.action-btn') || e.target.closest('.close-btn')) return;
    
    setIsDragging(true);
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setAdminPanelWidgetPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset, setAdminPanelWidgetPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
        zIndex: 10000,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
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
