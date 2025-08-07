import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useFloatingWidgetStore from '../utils/useFloatingWidgetStore';
import useSystemInfoStore from '../utils/useSystemInfoStore';
import Slider from '../ui/Slider';
import './SystemInfoWidget.css';

const SystemInfoWidget = React.memo(({ isVisible, onClose }) => {
  const {
    systemInfo,
    isLoading,
    refreshSystemInfo,
    openTaskManager,
    updateInterval,
    setUpdateInterval
  } = useSystemInfoStore();

  const { systemInfoPosition, setSystemInfoPosition } = useFloatingWidgetStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [size, setSize] = useState({ width: 320, height: 450 });
  const [currentPage, setCurrentPage] = useState('overview'); // 'overview', 'detailed', 'settings'
  const [selectedMetric, setSelectedMetric] = useState('cpu');
  const widgetRef = useRef(null);

  // Memoize expensive calculations
  const formattedSystemInfo = useMemo(() => {
    if (!systemInfo.cpu) return null;
    
    return {
      cpu: {
        usage: systemInfo.cpu.usage,
        cores: systemInfo.cpu.cores,
        model: systemInfo.cpu.model,
        temperature: systemInfo.cpu.temperature
      },
      memory: {
        total: systemInfo.memory?.total,
        used: systemInfo.memory?.used,
        free: systemInfo.memory?.free,
        usage: systemInfo.memory?.usage
      },
      gpu: {
        name: systemInfo.gpu?.name,
        memory: systemInfo.gpu?.memory,
        usage: systemInfo.gpu?.usage,
        temperature: systemInfo.gpu?.temperature
      },
      storage: systemInfo.storage?.map(disk => ({
        ...disk,
        usagePercent: disk.total > 0 ? Math.round((disk.used / disk.total) * 100) : 0
      })) || [],
      battery: systemInfo.battery
    };
  }, [systemInfo]);

  // Memoize event handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.control-btn') || e.target.closest('.page-btn') || e.target.closest('.metric-btn') || e.target.closest('.resize-handle') || e.target.closest('.clickable-item')) return;
    
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
    
    setSystemInfoPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset, setSystemInfoPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Resizing logic
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
    const rect = widgetRef.current.getBoundingClientRect();
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    });
  }, []);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const newWidth = Math.max(280, Math.min(500, resizeStart.width + deltaX));
    const newHeight = Math.max(350, Math.min(600, resizeStart.height + deltaY));
    
    setSize({ width: newWidth, height: newHeight });
  }, [isResizing, resizeStart]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Refresh system info periodically
  useEffect(() => {
    if (!isVisible || updateInterval === 0) return;
    
    const interval = setInterval(() => {
      refreshSystemInfo(false); // Don't show loading for periodic updates
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [isVisible, refreshSystemInfo, updateInterval]);

  // Initial load with loading state
  useEffect(() => {
    if (isVisible && !systemInfo.cpu) {
      refreshSystemInfo(true); // Show loading only on initial load
    }
  }, [isVisible, systemInfo.cpu, refreshSystemInfo]);

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

  // Global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Format helper functions
  const formatPercentage = (value) => `${Math.round(value || 0)}%`;
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };
  const formatTemperature = (temp) => temp ? `${Math.round(temp)}°C` : 'N/A';

  // Handle clickable items
  const handleItemClick = (type, data) => {
    switch (type) {
      case 'cpu':
        openTaskManager();
        break;
      case 'memory':
        openTaskManager();
        break;
      case 'storage':
        // Open File Explorer to the specific drive
        if (window.electronAPI && window.electronAPI.openFileExplorer) {
          window.electronAPI.openFileExplorer(data.name);
        }
        break;
      case 'gpu':
        // Could open GPU monitoring software if available
        openTaskManager();
        break;
      default:
        break;
    }
  };

  // Render metric card with click functionality
  const renderMetricCard = (title, value, subtitle, icon, color = '#4CAF50', clickable = false, clickData = null) => (
    <div 
      className={`metric-card ${clickable ? 'clickable-item' : ''}`}
      style={{ borderColor: color }}
      onClick={clickable ? () => handleItemClick(title.toLowerCase(), clickData) : undefined}
    >
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value" style={{ color }}>
        {value}
      </div>
      {subtitle && (
        <div className="metric-subtitle">{subtitle}</div>
      )}
    </div>
  );

  if (!isVisible) return null;

  return (
    <div 
      className={`system-info-widget ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      ref={widgetRef}
      style={{
        left: `${systemInfoPosition.x}px`,
        top: `${systemInfoPosition.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Widget Content */}
      <div className="widget-content">
        {/* Header with page navigation and quick actions */}
        <div className="widget-header">
          <div className="page-navigation">
            <button 
              className={`page-btn ${currentPage === 'overview' ? 'active' : ''}`}
              onClick={() => setCurrentPage('overview')}
              title="System Overview"
            >
              <span className="page-icon">📊</span>
              <span className="page-label">Overview</span>
            </button>
            <button 
              className={`page-btn ${currentPage === 'detailed' ? 'active' : ''}`}
              onClick={() => setCurrentPage('detailed')}
              title="Detailed Metrics"
            >
              <span className="page-icon">🔍</span>
              <span className="page-label">Detailed</span>
            </button>
            <button 
              className={`page-btn ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentPage('settings')}
              title="Widget Settings"
            >
              <span className="page-icon">⚙️</span>
              <span className="page-label">Settings</span>
            </button>
          </div>
        </div>
        
        {/* Quick Actions below the tabs */}
        <div className="quick-actions-top">
          <button 
            className="action-btn"
            onClick={openTaskManager}
            title="Open Task Manager"
          >
            🖥️ Task Manager
          </button>
          <button 
            className="action-btn"
            onClick={() => refreshSystemInfo(false)}
            title="Refresh System Info"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Overview Page */}
        {currentPage === 'overview' && (
          <div className="overview-content">
            {isLoading ? (
              <div className="loading">Loading system info...</div>
            ) : (
              <>
                {/* CPU Section */}
                <div className="metric-section">
                  <h3 className="section-title">CPU</h3>
                  <div className="metrics-grid">
                    {renderMetricCard(
                      'Usage',
                      formatPercentage(systemInfo.cpu?.usage),
                      `${systemInfo.cpu?.cores || 0} cores`,
                      '🖥️',
                      systemInfo.cpu?.usage > 80 ? '#FF5722' : systemInfo.cpu?.usage > 60 ? '#FF9800' : '#4CAF50',
                      true,
                      'cpu'
                    )}
                    {renderMetricCard(
                      'Temperature',
                      formatTemperature(systemInfo.cpu?.temperature),
                      'CPU Temp',
                      '🌡️',
                      systemInfo.cpu?.temperature > 80 ? '#FF5722' : systemInfo.cpu?.temperature > 60 ? '#FF9800' : '#4CAF50',
                      true,
                      'cpu'
                    )}
                  </div>
                </div>

                {/* Memory Section */}
                <div className="metric-section">
                  <h3 className="section-title">Memory</h3>
                  <div className="metrics-grid">
                    {renderMetricCard(
                      'Usage',
                      formatPercentage(systemInfo.memory?.usage),
                      `${formatBytes(systemInfo.memory?.used)} / ${formatBytes(systemInfo.memory?.total)}`,
                      '💾',
                      systemInfo.memory?.usage > 80 ? '#FF5722' : systemInfo.memory?.usage > 60 ? '#FF9800' : '#4CAF50',
                      true,
                      'memory'
                    )}
                    {renderMetricCard(
                      'Available',
                      formatBytes(systemInfo.memory?.free),
                      'Free Memory',
                      '📈',
                      '#2196F3',
                      true,
                      'memory'
                    )}
                  </div>
                </div>

                {/* GPU Section */}
                {systemInfo.gpu && (
                  <div className="metric-section">
                    <h3 className="section-title">GPU</h3>
                    <div className="metrics-grid">
                      {renderMetricCard(
                        'Usage',
                        formatPercentage(systemInfo.gpu?.usage),
                        systemInfo.gpu?.name || 'GPU',
                        '🎮',
                        systemInfo.gpu?.usage > 80 ? '#FF5722' : systemInfo.gpu?.usage > 60 ? '#FF9800' : '#4CAF50',
                        true,
                        'gpu'
                      )}
                      {renderMetricCard(
                        'Temperature',
                        formatTemperature(systemInfo.gpu?.temperature),
                        'GPU Temp',
                        '🌡️',
                        systemInfo.gpu?.temperature > 80 ? '#FF5722' : systemInfo.gpu?.temperature > 60 ? '#FF9800' : '#4CAF50',
                        true,
                        'gpu'
                      )}
                    </div>
                  </div>
                )}

                {/* Storage Section */}
                {systemInfo.storage && systemInfo.storage.length > 0 && (
                  <div className="metric-section">
                    <h3 className="section-title">Storage</h3>
                    <div className="storage-list">
                      {systemInfo.storage.map((disk, index) => (
                        <div 
                          key={index} 
                          className="storage-item clickable-item"
                          onClick={() => handleItemClick('storage', disk)}
                        >
                          <div className="storage-info">
                            <span className="storage-name">{disk.name}</span>
                            <span className="storage-usage">
                              {formatBytes(disk.used)} / {formatBytes(disk.total)}
                            </span>
                          </div>
                          <div className="storage-bar">
                            <div 
                              className="storage-fill"
                              style={{ 
                                width: `${disk.usage}%`,
                                backgroundColor: disk.usage > 80 ? '#FF5722' : disk.usage > 60 ? '#FF9800' : '#4CAF50'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Battery Section */}
                {systemInfo.battery && (
                  <div className="metric-section">
                    <h3 className="section-title">Battery</h3>
                    <div className="metrics-grid">
                      {renderMetricCard(
                        'Level',
                        `${systemInfo.battery.level}%`,
                        systemInfo.battery.charging ? 'Charging' : 'Discharging',
                        systemInfo.battery.charging ? '🔌' : '🔋',
                        systemInfo.battery.level < 20 ? '#FF5722' : systemInfo.battery.level < 50 ? '#FF9800' : '#4CAF50'
                      )}
                      {renderMetricCard(
                        'Power State',
                        systemInfo.battery.powerState || 'Unknown',
                        'System Power',
                        '⚡',
                        '#2196F3'
                      )}
                    </div>
                    <div className="battery-details">
                      <div className="detail-row">
                        <span className="detail-label">Time Left:</span>
                        <span className="detail-value">{systemInfo.battery.timeLeft || 'N/A'}</span>
                      </div>
                      {systemInfo.battery.voltage && (
                        <div className="detail-row">
                          <span className="detail-label">Voltage:</span>
                          <span className="detail-value">{systemInfo.battery.voltage}V</span>
                        </div>
                      )}
                      {systemInfo.battery.capacity && (
                        <div className="detail-row">
                          <span className="detail-label">Capacity:</span>
                          <span className="detail-value">{systemInfo.battery.capacity}mAh</span>
                        </div>
                      )}
                      {systemInfo.battery.cycleCount && (
                        <div className="detail-row">
                          <span className="detail-label">Cycles:</span>
                          <span className="detail-value">{systemInfo.battery.cycleCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Detailed Page */}
        {currentPage === 'detailed' && (
          <div className="detailed-content">
            <div className="metric-tabs">
              <button 
                className={`metric-btn ${selectedMetric === 'cpu' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('cpu')}
              >
                CPU
              </button>
              <button 
                className={`metric-btn ${selectedMetric === 'memory' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('memory')}
              >
                Memory
              </button>
              <button 
                className={`metric-btn ${selectedMetric === 'gpu' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('gpu')}
              >
                GPU
              </button>
            </div>

            <div className="detailed-metrics">
              {selectedMetric === 'cpu' && systemInfo.cpu && (
                <div className="detailed-section">
                  <h3>CPU Details</h3>
                  <div className="detail-grid">
                    <div className="detail-item clickable-item" onClick={() => handleItemClick('cpu')}>
                      <span className="detail-label">Model:</span>
                      <span className="detail-value">{systemInfo.cpu.model || 'Unknown'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Cores:</span>
                      <span className="detail-value">{systemInfo.cpu.cores || 0}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Speed:</span>
                      <span className="detail-value">{systemInfo.cpu.speed || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Temperature:</span>
                      <span className="detail-value">{formatTemperature(systemInfo.cpu.temperature)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'memory' && systemInfo.memory && (
                <div className="detailed-section">
                  <h3>Memory Details</h3>
                  <div className="detail-grid">
                    <div className="detail-item clickable-item" onClick={() => handleItemClick('memory')}>
                      <span className="detail-label">Total:</span>
                      <span className="detail-value">{formatBytes(systemInfo.memory.total)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Used:</span>
                      <span className="detail-value">{formatBytes(systemInfo.memory.used)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Free:</span>
                      <span className="detail-value">{formatBytes(systemInfo.memory.free)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Usage:</span>
                      <span className="detail-value">{formatPercentage(systemInfo.memory.usage)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'gpu' && systemInfo.gpu && (
                <div className="detailed-section">
                  <h3>GPU Details</h3>
                  <div className="detail-grid">
                    <div className="detail-item clickable-item" onClick={() => handleItemClick('gpu')}>
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{systemInfo.gpu.name || 'Unknown'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Memory:</span>
                      <span className="detail-value">{formatBytes(systemInfo.gpu.memory)}</span>
                    </div>
                    {systemInfo.gpu.memoryDetails && (
                      <>
                        <div className="detail-item">
                          <span className="detail-label">Memory Type:</span>
                          <span className="detail-value">{systemInfo.gpu.memoryDetails.type || 'Unknown'}</span>
                        </div>
                        {systemInfo.gpu.memoryDetails.speed && (
                          <div className="detail-item">
                            <span className="detail-label">Memory Speed:</span>
                            <span className="detail-value">{systemInfo.gpu.memoryDetails.speed} MHz</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Driver:</span>
                      <span className="detail-value">{systemInfo.gpu.driver || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Temperature:</span>
                      <span className="detail-value">{formatTemperature(systemInfo.gpu.temperature)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Page */}
        {currentPage === 'settings' && (
          <div className="settings-content">
            <div className="settings-section">
              <h3 className="settings-title">Widget Settings</h3>
              
              <div className="setting-item">
                <div style={{ marginBottom: 8, color: '#ffffff' }}>Update Interval</div>
                <Slider
                  value={updateInterval / 1000}
                  min={0}
                  max={10}
                  step={1}
                  onChange={(value) => setUpdateInterval(value * 1000)}
                />
                <div style={{ fontSize: '12px', opacity: 0.8, color: '#ffffff' }}>
                  {updateInterval === 0 ? 'Off' : `${updateInterval / 1000} seconds`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div 
        className="resize-handle"
        onMouseDown={handleResizeStart}
        onMouseMove={handleResizeMove}
        onMouseUp={handleResizeEnd}
      >
        ↙
      </div>
    </div>
  );
});

export default SystemInfoWidget; 