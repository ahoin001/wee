import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import Slider from '../../ui/Slider';
import { useFloatingWidgetsState } from '../../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { CSS_COLOR_PURE_WHITE } from '../../design/runtimeColorStrings.js';

const GLASS_TEST_BTN_STYLE = {
  background: 'hsl(var(--color-pure-white) / 0.2)',
  border: '1px solid hsl(var(--color-pure-white) / 0.3)',
  borderRadius: '8px',
  padding: '8px 16px',
  color: CSS_COLOR_PURE_WHITE,
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backdropFilter: 'blur(10px)',
};
import useAnimationActivity from '../../hooks/useAnimationActivity';
import { useFloatingWidgetFrame } from '../../hooks/useFloatingWidgetFrame';
import './SystemInfoWidget.css';

const SystemInfoWidget = ({ isVisible, onClose }) => {
  const { floatingWidgets, setFloatingWidgetsState } = useFloatingWidgetsState();
  const { isAppActive, isLowPowerMode, pollIntervalMultiplier } = useAnimationActivity({
    activeFps: 30,
    lowPowerFps: 15,
  });

  const intervalRef = useRef(null);

  // Get system info widget state from floating widgets
  const systemInfoWidget = floatingWidgets.systemInfo;
  const systemInfoPosition = systemInfoWidget.position;
  const systemInfoSize = systemInfoWidget.size || { width: 320, height: 400 };
  const updateInterval = systemInfoWidget.updateInterval || 30; // Default to 30 seconds
  const systemInfoData = systemInfoWidget.data;
  const isLoading = systemInfoWidget.isLoading;
  const error = systemInfoWidget.error;

  const setSystemInfoWidgetPosition = useCallback(
    (position) => {
      setFloatingWidgetsState({
        systemInfo: { ...systemInfoWidget, position },
      });
    },
    [setFloatingWidgetsState, systemInfoWidget]
  );

  const setSystemInfoWidgetSize = useCallback(
    (size) => {
      setFloatingWidgetsState({
        systemInfo: { ...systemInfoWidget, size },
      });
    },
    [setFloatingWidgetsState, systemInfoWidget]
  );

  const {
    widgetRef,
    size,
    isDragging,
    isResizing,
    handleDragPointerDown,
    handleResizeSouthEastPointerDown,
    handleResizeSouthPointerDown,
    handleResizeEastPointerDown,
  } = useFloatingWidgetFrame({
    setPosition: setSystemInfoWidgetPosition,
    position: systemInfoPosition,
    size: systemInfoSize,
    setSize: setSystemInfoWidgetSize,
    resizable: true,
    resizeVariant: 'edges',
    minSize: { width: 280, height: 300 },
    shouldCancelDrag: (e) =>
      !!(
        e.target.closest('.metric-card') ||
        e.target.closest('.close-btn') ||
        e.target.closest('.refresh-btn') ||
        e.target.closest('.resize-handle') ||
        e.target.closest('.interval-slider') ||
        e.target.closest('input[type="range"]')
      ),
  });

  // Update system info interval
  const updateSystemInfoInterval = (interval) => {
    setFloatingWidgetsState({
      systemInfo: { ...systemInfoWidget, updateInterval: interval }
    });
  };

  // Fetch system info using store manager
  const fetchSystemInfo = useCallback(async () => {
    if (!isVisible || !isAppActive) return;
    if (!window.api?.getSystemInfo) return;
    
    const store = useConsolidatedAppStore.getState();
    
    try {
      // Set loading state first
      store.actions.floatingWidgetManager.setSystemInfoLoading(true);
      
      const response = await window.api.getSystemInfo();
      
      if (response && response.success && response.data) {
        store.actions.floatingWidgetManager.updateSystemInfoData(response.data);
      } else {
        const errorMessage = response?.error || 'API call failed';
        store.actions.floatingWidgetManager.setSystemInfoError(errorMessage);
      }
    } catch (error) {
      store.actions.floatingWidgetManager.setSystemInfoError(`Failed to fetch: ${error.message}`);
    }
  }, [isVisible, isAppActive]);

  // Set up interval for automatic updates
  useEffect(() => {
    if (updateInterval > 0 && isVisible && isAppActive) {
      const baseIntervalMs = Math.max(5, updateInterval) * 1000;
      const lowPowerFactor = isLowPowerMode ? 1.25 : 1;
      const effectiveIntervalMs = Math.round(baseIntervalMs * pollIntervalMultiplier * lowPowerFactor);
      intervalRef.current = setInterval(fetchSystemInfo, effectiveIntervalMs);
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
  }, [updateInterval, isVisible, isAppActive, fetchSystemInfo, pollIntervalMultiplier, isLowPowerMode]);

  // Initial fetch when widget becomes visible
  useEffect(() => {
    if (isVisible && isAppActive) {
      fetchSystemInfo();
    }
  }, [isVisible, isAppActive, fetchSystemInfo]);

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
    if (!systemInfoData) return null;

    // Handle both old and new data structures
    const cpu = systemInfoData.cpu || {};
    const memory = systemInfoData.memory || {};
    const gpu = systemInfoData.gpu || {};
    const storage = systemInfoData.storage || {};
    const battery = systemInfoData.battery || {};

    // Handle storage array vs single object
    const storageData = Array.isArray(storage) ? storage[0] || {} : storage;

    return {
      cpu: {
        model: cpu.model || 'Unknown',
        usage: cpu.usage || 0,
        cores: cpu.cores || 0,
        temperature: cpu.temperature || 0
      },
      memory: {
        total: memory.total || 0,
        used: memory.used || 0,
        free: memory.free || 0,
        usage: memory.usage || 0
      },
      gpu: {
        model: gpu.name || gpu.model || 'Unknown',
        usage: gpu.usage || 0,
        memory: gpu.memory || 0,
        temperature: gpu.temperature || 0
      },
      storage: {
        total: storageData.total || 0,
        used: storageData.used || 0,
        free: storageData.free || 0,
        usage: storageData.usage || 0
      },
      battery: {
        level: battery.level || 0,
        charging: battery.charging || battery.isCharging || false,
        timeRemaining: battery.timeRemaining || battery.timeLeft || 0
      }
    };
  }, [systemInfoData]);

  // Format bytes to human readable
  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Get usage color based on percentage
  const getUsageColor = useCallback((percentage) => {
    if (percentage >= 80) return 'text-red-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-green-400';
  }, []);

  // Render metric card
  const renderMetricCard = useCallback((title, value, unit, percentage, icon, onClick, className = '', subtitle = '') => {
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
        {subtitle && (
          <Text variant="caption" className="metric-subtitle" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '10px', marginBottom: '8px' }}>
            {subtitle}
          </Text>
        )}
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
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 10000,
        cursor: isDragging ? 'grabbing' : isResizing ? 'nw-resize' : 'grab',
        resize: 'none',
      }}
      onPointerDown={handleDragPointerDown}
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
      <div className="widget-content" style={{ 
        height: 'calc(100% - 120px)', // Account for header and footer
        overflow: 'auto',
        padding: '16px'
      }}>
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner">⟳</div>
            <Text variant="body" className="loading-text">Loading system info...</Text>
          </div>
        ) : formattedSystemInfo ? (
          <div className="metrics-grid" style={{
            display: 'grid',
            gridTemplateColumns: size.width < 400 ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            height: '100%'
          }}>
            {/* CPU */}
            {renderMetricCard(
              'CPU',
              formattedSystemInfo.cpu.usage.toFixed(1),
              '%',
              formattedSystemInfo.cpu.usage,
              '🖥️',
              () => handleItemClick('taskManager'),
              'cpu-card',
              `${formattedSystemInfo.cpu.cores} cores`
            )}

            {/* Memory */}
            {renderMetricCard(
              'Memory',
              formattedSystemInfo.memory.usage.toFixed(1),
              '%',
              formattedSystemInfo.memory.usage,
              '💾',
              () => handleItemClick('taskManager'),
              'memory-card',
              `${formatBytes(formattedSystemInfo.memory.used)} / ${formatBytes(formattedSystemInfo.memory.total)}`
            )}

            {/* GPU */}
            {renderMetricCard(
              'GPU',
              formattedSystemInfo.gpu.usage.toFixed(1),
              '%',
              formattedSystemInfo.gpu.usage,
              '🎮',
              () => handleItemClick('taskManager'),
              'gpu-card',
              formattedSystemInfo.gpu.memory > 0 ? formatBytes(formattedSystemInfo.gpu.memory) : 'Unknown'
            )}

            {/* Storage */}
            {renderMetricCard(
              'Storage',
              formattedSystemInfo.storage.usage.toFixed(1),
              '%',
              formattedSystemInfo.storage.usage,
              '💿',
              () => handleItemClick('fileExplorer'),
              'storage-card',
              `${formatBytes(formattedSystemInfo.storage.used)} / ${formatBytes(formattedSystemInfo.storage.total)}`
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
            <Text variant="body" className="error-text">
              {error || 'Failed to load system info'}
            </Text>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <WButton
                variant="secondary"
                onClick={fetchSystemInfo}
                className="retry-btn"
              >
                Retry
              </WButton>
              <WButton
                variant="secondary"
                onClick={() => {
                  console.log('[SystemInfoWidget] Testing API call...');
                  window.api.getSystemInfo().then(response => {
                    console.log('[SystemInfoWidget] Test API response:', response);
                  }).catch(error => {
                    console.error('[SystemInfoWidget] Test API error:', error);
                  });
                }}
                style={GLASS_TEST_BTN_STYLE}
              >
                Test API
              </WButton>
              <WButton
                variant="secondary"
                onClick={() => {
                  console.log('[SystemInfoWidget] Testing store update with mock data...');
                  const store = useConsolidatedAppStore.getState();
                  const mockData = {
                    cpu: {
                      model: 'Intel Core i5-12400F',
                      usage: 25.5,
                      cores: 12,
                      temperature: 45
                    },
                    memory: {
                      total: 17032929280,
                      used: 8000000000,
                      free: 9032929280,
                      usage: 47.0
                    },
                    storage: [{
                      name: 'C:',
                      total: 1000000000000,
                      used: 500000000000,
                      usage: 50.0
                    }],
                    gpu: {
                      name: 'NVIDIA GeForce RTX 3060',
                      memory: 12000000000,
                      usage: 15.0,
                      temperature: 55
                    },
                    battery: null
                  };
                  store.actions.floatingWidgetManager.updateSystemInfoData(mockData);
                }}
                style={GLASS_TEST_BTN_STYLE}
              >
                Test Store
              </WButton>
            </div>
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

      {/* Resize Handles */}
      <div 
        className="resize-handle resize-handle-bottom-right"
        onPointerDown={handleResizeSouthEastPointerDown}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '12px',
          height: '12px',
          cursor: 'nw-resize',
          background: 'rgba(255, 255, 255, 0.2)',
          borderLeft: '2px solid rgba(255, 255, 255, 0.5)',
          borderTop: '2px solid rgba(255, 255, 255, 0.5)',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      />
      <div 
        className="resize-handle resize-handle-bottom"
        onPointerDown={handleResizeSouthPointerDown}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20px',
          height: '6px',
          cursor: 'ns-resize',
          background: 'rgba(255, 255, 255, 0.2)',
          borderTop: '2px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '3px 3px 0 0',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      />
      <div 
        className="resize-handle resize-handle-right"
        onPointerDown={handleResizeEastPointerDown}
        style={{
          position: 'absolute',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
          width: '6px',
          height: '20px',
          cursor: 'ew-resize',
          background: 'rgba(255, 255, 255, 0.2)',
          borderLeft: '2px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '0 3px 3px 0',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      />
    </div>
  );
};

export default SystemInfoWidget; 
