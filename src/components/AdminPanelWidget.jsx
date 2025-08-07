import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from '../ui/Card';
import Text from '../ui/Text';
import WButton from '../ui/WButton';
import useSettingsStore from '../utils/settingsManager';
import './AdminPanelWidget.css';

const AdminPanelWidget = ({ isVisible, onClose }) => {
  const { 
    floatingWidgets, 
    apiIntegrations,
    setAdminPanelWidgetPosition 
  } = useSettingsStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef(null);

  // Get admin panel config from settings manager
  const adminPanelConfig = apiIntegrations?.adminPanel || { powerActions: [] };
  const adminPanelPosition = floatingWidgets?.adminPanel?.position || { x: 700, y: 100 };

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
        <WButton
          variant="tertiary"
          onClick={onClose}
          className="close-btn"
        >
          ✕
        </WButton>
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
              Configure actions in Settings → API & Widgets → Admin Panel Widget
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanelWidget;
