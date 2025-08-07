import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Card from '../ui/Card';
import Text from '../ui/Text';
import WButton from '../ui/WButton';
import Slider from '../ui/Slider';
import useSettingsStore from '../utils/settingsManager';
import './SystemInfoWidget.css';

const SystemInfoWidget = ({ isVisible, onClose }) => {
  const { 
    floatingWidgets, 
    updateSystemInfo, 
    setSystemInfoLoading, 
    updateSystemInfoInterval,
    setSystemInfoWidgetPosition 
  } = useSettingsStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef(null);
  const intervalRef = useRef(null);

  // Get system info data from settings manager
  const systemInfo = floatingWidgets?.systemInfo?.systemInfo;
  const isLoading = floatingWidgets?.systemInfo?.isLoading;
  const updateInterval = floatingWidgets?.systemInfo?.updateInterval || 0;
  const systemInfoPosition = floatingWidgets?.systemInfo?.position || { x: 400, y: 100 };

  // Dragging logic
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.metric-card') || e.target.closest('.close-btn') || e.target.closest('.refresh-btn')) return;
    
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
    
    setSystemInfoWidgetPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset, setSystemInfoWidgetPosition]);

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

  // Fetch system info
  const fetchSystemInfo = useCallback(async () => {
    if (!isVisible) return;
    
    setSystemInfoLoading(true);
    try {
      const response = await window.api.getSystemInfo();
      if (response.success) {
        updateSystemInfo(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch system info:', error);
    } finally {
      setSystemInfoLoading(false);
    }
  }, [isVisible, setSystemInfoLoading, updateSystemInfo]);

  // Set up interval for automatic updates
  useEffect(() => {
    if (updateInterval > 0 && isVisible) {
      intervalRef.current = setInterval(fetchSystemInfo, updateInterval * 1000);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [updateInterval, isVisible, fetchSystemInfo]);

  // Initial fetch when widget becomes visible
  useEffect(() => {
    if (isVisible) {
      fetchSystemInfo();
    }
  }, [isVisible, fetchSystemInfo]);

  // Handle item click to open relevant applications
  const handleItemClick = useCallback((itemType) => {
    switch (itemType) {
      case 'taskManager':
        window.api?.openTaskManager();
        break;
      case 'fileExplorer':
        window.api?.openFileExplorer();
        break;
      case 'systemInfo':
        window.api?.openSystemInfo();
        break;
      case 'powerOptions':
        window.api?.openPowerOptions();
        break;
      default:
        break;
    }
  }, []);

  // Format system info for display
  const formattedSystemInfo = useMemo(() => {
    if (!systemInfo) return null;

    return {
      cpu: {
        model: systemInfo.cpu?.model || 'Unknown',
        usage: systemInfo.cpu?.usage || 0,
        cores: systemInfo.cpu?.cores || 0,
        temperature: systemInfo.cpu?.temperature || 0
      },
      memory: {
        total: systemInfo.memory?.total || 0,
        used: systemInfo.memory?.used || 0,
        free: systemInfo.memory?.free || 0,
        usage: systemInfo.memory?.usage || 0
      },
      gpu: {
        model: systemInfo.gpu?.model || 'Unknown',
        usage: systemInfo.gpu?.usage || 0,
        memory: systemInfo.gpu?.memory || 0,
        temperature: systemInfo.gpu?.temperature || 0
      },
      storage: {
        total: systemInfo.storage?.total || 0,
        used: systemInfo.storage?.used || 0,
        free: systemInfo.storage?.free || 0,
        usage: systemInfo.storage?.usage || 0
      },
      battery: {
        level: systemInfo.battery?.level || 0,
        charging: systemInfo.battery?.charging || false,
        timeRemaining: systemInfo.battery?.timeRemaining || 0
      }
    };
  }, [systemInfo]);

  // Render metric card
  const renderMetricCard = useCallback((title, value, unit, percentage, icon, onClick, className = '') => {
    return (
      <div 
        className={`metric-card ${onClick ? 'clickable-item' : ''} ${className}`}
        onClick={onClick ? () => onClick() : undefined}
      >
        <div className="metric-header">
          <span className="metric-icon">{icon}</span>
          <Text variant="caption" className="metric-title">{title}</Text>
        </div>
        <div className="metric-value">
          <Text variant="h3" className="metric-number">{value}</Text>
          {unit && <Text variant="caption" className="metric-unit">{unit}</Text>}
        </div>
        {percentage !== undefined && (
          <div className="metric-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <Text variant="caption" className="progress-text">{percentage.toFixed(1)}%</Text>
          </div>
        )}
      </div>
    );
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      ref={widgetRef}
      className="system-info-widget"
      style={{
        position: 'fixed',
        left: `${systemInfoPosition.x}px`,
        top: `${systemInfoPosition.y}px`,
        zIndex: 10000,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Widget Header */}
      <div className="widget-header">
        <div className="header-content">
          <div className="header-icon">📊</div>
          <Text variant="h4" className="header-title">
            System Info
          </Text>
        </div>
        <div className="header-actions">
          <WButton
            variant="tertiary"
            onClick={fetchSystemInfo}
            disabled={isLoading}
            className="refresh-btn"
          >
            {isLoading ? '⟳' : '↻'}
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
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner">⟳</div>
            <Text variant="body" className="loading-text">Loading system info...</Text>
          </div>
        ) : formattedSystemInfo ? (
          <div className="metrics-grid">
            {/* CPU */}
            {renderMetricCard(
              'CPU',
              formattedSystemInfo.cpu.usage.toFixed(1),
              '%',
              formattedSystemInfo.cpu.usage,
              '🖥️',
              () => handleItemClick('taskManager'),
              'cpu-card'
            )}

            {/* Memory */}
            {renderMetricCard(
              'Memory',
              formattedSystemInfo.memory.usage.toFixed(1),
              '%',
              formattedSystemInfo.memory.usage,
              '💾',
              () => handleItemClick('taskManager'),
              'memory-card'
            )}

            {/* GPU */}
            {renderMetricCard(
              'GPU',
              formattedSystemInfo.gpu.usage.toFixed(1),
              '%',
              formattedSystemInfo.gpu.usage,
              '🎮',
              () => handleItemClick('taskManager'),
              'gpu-card'
            )}

            {/* Storage */}
            {renderMetricCard(
              'Storage',
              formattedSystemInfo.storage.usage.toFixed(1),
              '%',
              formattedSystemInfo.storage.usage,
              '💿',
              () => handleItemClick('fileExplorer'),
              'storage-card'
            )}

            {/* Battery */}
            {formattedSystemInfo.battery.level > 0 && (
              <div className="battery-card">
                <div className="battery-header">
                  <span className="battery-icon">
                    {formattedSystemInfo.battery.charging ? '🔌' : '🔋'}
                  </span>
                  <Text variant="caption" className="battery-title">Battery</Text>
                </div>
                <div className="battery-details">
                  <Text variant="h3" className="battery-level">
                    {formattedSystemInfo.battery.level}%
                  </Text>
                  <div className="battery-status">
                    <Text variant="caption" className="battery-status-text">
                      {formattedSystemInfo.battery.charging ? 'Charging' : 'Discharging'}
                    </Text>
                    {formattedSystemInfo.battery.timeRemaining > 0 && (
                      <Text variant="caption" className="battery-time">
                        {Math.floor(formattedSystemInfo.battery.timeRemaining / 60)}h {formattedSystemInfo.battery.timeRemaining % 60}m
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <Text variant="body" className="error-text">Failed to load system info</Text>
            <WButton
              variant="secondary"
              onClick={fetchSystemInfo}
              className="retry-btn"
            >
              Retry
            </WButton>
          </div>
        )}
      </div>

      {/* Update Interval Control */}
      <div className="widget-footer">
        <div className="interval-control">
          <Text variant="caption" className="interval-label">Update Interval</Text>
          <Slider
            value={updateInterval}
            onChange={(value) => updateSystemInfoInterval(value)}
            min={0}
            max={60}
            step={5}
            className="interval-slider"
          />
          <Text variant="caption" className="interval-value">
            {updateInterval === 0 ? 'Off' : `${updateInterval}s`}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default SystemInfoWidget; 