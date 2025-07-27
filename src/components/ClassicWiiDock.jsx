import React, { useState, useEffect } from 'react';
import intervalManager from '../utils/IntervalManager.js';
import './ClassicWiiDock.css';

const ClassicWiiDock = ({
  onSettingsClick,
  onSettingsChange,
  buttonConfigs,
  onButtonContextMenu,
  onButtonClick,
  timeColor,
  timeFormat24hr,
  timeFont,
  ribbonGlowColor,
  showPresetsButton,
  presetsButtonConfig,
  openPresetsModal
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const taskId = intervalManager.addTask(() => {
      setCurrentTime(new Date());
    }, 1000, 'classic-time-update');

    return () => intervalManager.removeTask(taskId);
  }, []);

  const formatTime = (date) => {
    if (timeFormat24hr) {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="classic-wii-dock-container">
      {/* Container for the dock */}
      <div id="dock-container" className="relative w-full max-w-6xl">
        
        {/* Wii Dock Base - Main Structure */}
        <div className="wii-dock-base">
          {/* Main dock body */}
          <div className="wii-dock-body">
            {/* Top edge highlight */}
            <div className="wii-dock-top-edge"></div>
            
            {/* Main dock surface */}
            <div className="wii-dock-surface">
              {/* Left curved section */}
              <div className="wii-dock-left-curve"></div>
              
              {/* Center section */}
              <div className="wii-dock-center"></div>
              
              {/* Right curved section */}
              <div className="wii-dock-right-curve"></div>
            </div>
          </div>
        </div>

        {/* SD Card Icon Container */}
        <div className="sd-card-container">
          <div className="sd-card">
            <div className="sd-card-body">
              <div className="sd-card-top"></div>
              <div className="sd-card-screen">
                <div className="sd-card-screen-content">
                  <div className="sd-card-icon">W</div>
                </div>
              </div>
              <div className="sd-card-bottom"></div>
            </div>
          </div>
        </div>
        
        {/* Left Button Pod Container */}
        <div className="left-button-pod-container">
          <div className="left-button-pod">
            {/* Button pod base */}
            <div className="button-pod-base">
              <div className="button-pod-outer-ring"></div>
              <div className="button-pod-inner-ring"></div>
              <div className="button-pod-button">
                <div className="button-pod-button-inner">
                  <div className="button-pod-button-highlight"></div>
                  <div className="button-pod-button-center">
                    <div className="button-pod-button-icon">A</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Button pod housing */}
            <div className="button-pod-housing">
              <div className="button-pod-housing-left"></div>
              <div className="button-pod-housing-right"></div>
            </div>
          </div>
        </div>

        {/* Right Button Pod Container */}
        <div className="right-button-pod-container">
          <div className="right-button-pod">
            {/* Button pod base */}
            <div className="button-pod-base">
              <div className="button-pod-outer-ring"></div>
              <div className="button-pod-inner-ring"></div>
              <div className="button-pod-button">
                <div className="button-pod-button-inner">
                  <div className="button-pod-button-highlight"></div>
                  <div className="button-pod-button-center">
                    <div className="button-pod-button-icon">B</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Button pod housing */}
            <div className="button-pod-housing">
              <div className="button-pod-housing-left"></div>
              <div className="button-pod-housing-right"></div>
            </div>
          </div>
        </div>

        {/* Interactive Elements */}
        
        {/* Time Display */}
        <div 
          className="time-display"
          style={{ color: timeColor, fontFamily: timeFont }}
        >
          <div className="time-text">{formatTime(currentTime)}</div>
          <div className="date-text">{formatDate(currentTime)}</div>
        </div>

        {/* Left Button */}
        <div 
          className="left-button-interactive classic-button"
          onClick={() => onButtonClick(0)}
          onContextMenu={(e) => onButtonContextMenu(0, e)}
          title={buttonConfigs[0]?.name || 'Left Button'}
        />

        {/* Right Button */}
        <div 
          className="right-button-interactive classic-button"
          onClick={() => onButtonClick(1)}
          onContextMenu={(e) => onButtonContextMenu(1, e)}
          title={buttonConfigs[1]?.name || 'Right Button'}
        />

        {/* Settings Button */}
        <div 
          className="settings-button-interactive classic-button"
          onClick={onSettingsClick}
          title="Settings"
        />

        {/* Presets Button */}
        {showPresetsButton && (
          <div 
            className="presets-button-interactive classic-button"
            onClick={openPresetsModal}
            title={presetsButtonConfig?.name || 'Presets'}
          />
        )}

      </div>
    </div>
  );
};

export default ClassicWiiDock; 